import { LocationAccuracy, ProductType, Status, User } from "@prisma/client";
import { getCurrencyForCity } from "../../shared/config/region";
import prismaClient from "../../infastructure/database/postgreSQL/connect";
import { AzureBlobService } from "../../shared/services/azure/blobstorage.service";
import { ISettings, IUser } from "./user.intercase";

import AdminServiceClient from "../../shared/services/admin/adminservice.client";
import AdminService from "../../shared/services/admin/adminservice";
import { Helper } from "../../shared/helper/helper";
import {
  emailNotificationService,
  EmailNotificationType,
} from "../../shared/services/email/email-notification.service";
import { notificationService } from "../../shared/services/notification/notification.service";
import { enrichProductListing, enrichUserWithRating } from "./rating.service";

export class UserService {
  AdminClient: AdminService;

  constructor() {
    const adminClient = new AdminServiceClient(new AdminService());
    this.AdminClient = adminClient.build();
  }

  public async getUserById(id: string) {
    const user = await prismaClient.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    const { password, ...safeUser } = user;
    return enrichUserWithRating(safeUser);
  }

  public async getUserByEmail(email: string) {
    const user = await prismaClient.user.findFirst({ where: { email } });
    return user;
  }

  public async uploadImage(image: string, userId: string) {
    // Get current user to check for existing image
    const user = await this.getUserById(userId);

    // If user has existing image, delete it first
    if (user?.image) {
      await AzureBlobService.instance.deleteFile(user.image);
    }

    const imageUrl = await AzureBlobService.instance.uploadBase64Image(
      image,
      userId,
      "user"
    );

    const updatedUser = await prismaClient.user.update({
      where: { id: userId },
      data: { image: imageUrl.url },
    });

    return updatedUser;
  }

  public async updateUser(user: IUser) {
    const checkUser = await this.getUserById(user.id);
    if (!checkUser) {
      throw new Error("User not found");
    }

    const updatedUser = await prismaClient.user.update({
      where: { id: user.id },
      data: user,
    });
    return updatedUser;
  }
  public async deleteUser(userId: string) {
    const user = await this.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // check is user hase a pending or upcomming order or  has a balance in wallet
    const pendingOrders = await prismaClient.order.findMany({
      where: { userId, status: { in: [Status.PENDING] } },
    });
    if (pendingOrders.length > 0) {
      throw new Error("User has a pending order");
    }

    // check is user has a balance in wallet
    const wallet = await prismaClient.wallet.findUnique({
      where: { userId },
    });
    if (wallet?.balance > 0) {
      throw new Error("User has a balance in wallet. Please withdraw your balance before deleting your account.");
    }

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison

    const schedules = await prismaClient.recycleSchedule.findMany({
      where: {
        userId,
        status: { in: [Status.PENDING] }
      },
      select: {
        id: true,
        dates: true
      },
    });

    // Filter schedules that have at least one future or today date
    const futureSchedules = schedules.filter((schedule) => {
      return schedule.dates.some(date => {
        const scheduleDate = new Date(date);
        scheduleDate.setHours(0, 0, 0, 0);
        return scheduleDate >= currentDate;
      });
    });

    if (futureSchedules.length > 0) {
      throw new Error("You have upcoming recycle schedules. Please complete or cancel them before deleting your account.");
    }

    emailNotificationService.notifyUser(userId, EmailNotificationType.ACCOUNT_DELETED, {
      firstName: user.firstName,
    });

    void notificationService.createAndSend(userId, {
      title: "Account deleted",
      body: "Your account has been deleted. We're sorry to see you go.",
      data: { type: "ACCOUNT_DELETED" },
    });

    await prismaClient.user.update({
      where: { id: userId },
      data: { status: Status.DELETED },
    });
    return { message: "User deleted successfully" };
  }

  public async getUserSettings(userId: string) {
    const settings = await prismaClient.settings.findUnique({
      where: { userId },
    });

    if (!settings) {
      const newSettings = await this.updateSettings(
        { id: userId },
        {
          isEmailNotificationsEnabled: true,
          isSmsNotificationsEnabled: true,
          isPushNotificationsEnabled: true,
        }
      );
      return newSettings;
    }

    return settings;
  }

  public async updateDeviceToken(deviceToken: string, userId: string) {
    const updatedUser = await prismaClient.user.update({
      where: { id: userId },
      data: { deviceToken },
    });
    return updatedUser;
  }



  public async updateLocation(location: {
    latitude: number;
    longitude: number;
  }, userId: string) {

    const updatedUser = await prismaClient.user.update({
      where: { id: userId },
      data: { latitude: location.latitude, longitude: location.longitude, locationAccuracy: LocationAccuracy.EXACT },
    });

    return updatedUser;
  }






  public async updateSettings(user: IUser, settings: ISettings) {
    const updatedSettings = await prismaClient.settings.upsert({
      where: {
        userId: user.id,
      },
      update: {
        isEmailNotificationsEnabled: settings.isEmailNotificationsEnabled,
        isSmsNotificationsEnabled: settings.isSmsNotificationsEnabled,
        isPushNotificationsEnabled: settings.isPushNotificationsEnabled,
      },
      create: {
        userId: user.id,
        isEmailNotificationsEnabled: settings.isEmailNotificationsEnabled,
        isSmsNotificationsEnabled: settings.isSmsNotificationsEnabled,
        isPushNotificationsEnabled: settings.isPushNotificationsEnabled,
      },
    });

    return updatedSettings;
  }

  public async getHomeCharities(_user: User, params: { Latitude: number; Longitude: number }): Promise<any[]> {
    try {
      // Fetch charity products
      const charities = await prismaClient.product.findMany({
        where: {
          isSold: false,
          type: ProductType.CHARITY_PRODUCT,
          currency: getCurrencyForCity(_user.cityOfResidence),
          createdBy: {
            id: {
              not: _user.id,
            },
          },
        },
        select: {
          id: true,
          price: true,
          material: true,
          title: true,
          description: true,
          images: true,
          createdAt: true,
          updatedAt: true,
          soldAt: true,
          confirmedAt: true,
          isSold: true,
          currency: true,
          createdBy: {
            select: {
              latitude: true,
              longitude: true,
              address: true,
              city: true,
              firstName: true,
              lastName: true,
              image: true,
              id: true,
              phone: true,
              averageRating: true,
              ratingCount: true,
            },
          },
        },
      });

      // Get all materials in parallel
      const materialPromises = charities.map((charity) =>
        this.AdminClient.getMaterialById(charity.material)
      );
      const materials = await Promise.all(materialPromises);

      // Map materials back to charities and add distance
      const charitiesWithMaterialsAndDistance = charities.map((charity, index) => {
        let distance = null;
        if (
          typeof charity.createdBy.latitude === "number" &&
          typeof charity.createdBy.longitude === "number" &&
          typeof params.Latitude === "number" &&
          typeof params.Longitude === "number"
        ) {
          distance = Helper.getDistanceFromLatLonInMiles(
            params.Latitude,
            params.Longitude,
            charity.createdBy.latitude,
            charity.createdBy.longitude
          );
        }
        return enrichProductListing({
          ...charity,
          material: materials[index].payload,
          distanceInMiles: distance,
        });
      });

      // Sort by distance, with closest items first (null distances at the end)
      const sortedCharities = charitiesWithMaterialsAndDistance.sort((a, b) => {
        if (a.distanceInMiles === null && b.distanceInMiles === null) return 0;
        if (a.distanceInMiles === null) return 1;
        if (b.distanceInMiles === null) return -1;
        return a.distanceInMiles - b.distanceInMiles;
      });

      return sortedCharities;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  public async getHomeFacilities(_user: IUser, _settings: any): Promise<any[]> {
    try {
      const facilities = await this.AdminClient.getFacilities({
        Latitude: _settings.Latitude,
        Longitude: _settings.Longitude,
      });
      return facilities.payload.items;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  public async getHomeHeroes(_user: IUser): Promise<any[]> {
    try {
      // const heroes = await prismaClient.hero.findMany({
      //   where: {
      //     status: Status.APPROVED,
      //   },
      // });

      return [];
    } catch (error: any) {
      throw new Error(error);
    }
  }

  public async getHomeTopDeals(
    _user: User,
    params: {
      Latitude: number;
      Longitude: number;
    }
  ): Promise<any[]> {
    try {
      // Fetch products with latitude and longitude
      const topDeals = await prismaClient.product.findMany({
        where: {
          isSold: false,
          type: ProductType.SALES_PRODUCT,
          currency: getCurrencyForCity(_user.cityOfResidence),
          createdBy: {
            id: {
              not: _user.id,
            },
          },
        },
        select: {
          id: true,
          price: true,
          material: true,
          title: true,
          description: true,
          images: true,
          createdAt: true,
          updatedAt: true,
          soldAt: true,
          currency: true,
          confirmedAt: true,
          isSold: true,
          createdBy: {
            select: {
              latitude: true,
              longitude: true,
              address: true,
              city: true,
              firstName: true,
              lastName: true,
              image: true,
              phone: true,
              id: true,
              averageRating: true,
              ratingCount: true,
            },
          },
        },
      });



      // Get all materials in parallel
      const materialPromises = topDeals.map((deal) =>
        this.AdminClient.getMaterialById(deal.material)
      );
      const materials = await Promise.all(materialPromises);

      // Map materials back to deals and add distance
      const dealsWithMaterialsAndDistance = topDeals.map((deal, index) => {
        let distance = null;
        if (
          typeof deal.createdBy.latitude === "number" &&
          typeof deal.createdBy.longitude === "number" &&
          typeof params.Latitude === "number" &&
          typeof params.Longitude === "number"
        ) {
          distance = Helper.getDistanceFromLatLonInMiles(
            params.Latitude,
            params.Longitude,
            deal.createdBy.latitude,
            deal.createdBy.longitude
          );
        }
        return enrichProductListing({
          ...deal,
          material: materials[index].payload,
          distanceInMiles: distance,
        });
      });

      // Sort by distance, with closest items first (null distances at the end)
      const sortedDeals = dealsWithMaterialsAndDistance.sort((a, b) => {
        if (a.distanceInMiles === null && b.distanceInMiles === null) return 0;
        if (a.distanceInMiles === null) return 1;
        if (b.distanceInMiles === null) return -1;
        return a.distanceInMiles - b.distanceInMiles;
      });

      return sortedDeals;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  // Notifications

  private async getOwnedNotification(userId: string, notificationId: string) {
    const notification = await prismaClient.notification.findFirst({
      where: {
        id: notificationId,
        userId,
        isDeleted: false,
      },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    return notification;
  }

  public async getNotificationById(notificationId: string) {
    const notification = await prismaClient.notification.findUnique({
      where: { id: notificationId },
    });
    return notification;
  }

  public async getNotifications(
    user: IUser,
    options?: { page?: number; limit?: number; unreadOnly?: boolean }
  ) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(50, Math.max(1, options?.limit ?? 20));
    const skip = (page - 1) * limit;

    const where = {
      userId: user.id,
      isDeleted: false,
      ...(options?.unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, total, unreadCount] = await Promise.all([
      prismaClient.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prismaClient.notification.count({ where }),
      prismaClient.notification.count({
        where: { userId: user.id, isDeleted: false, isRead: false },
      }),
    ]);

    return {
      notifications,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
        unreadCount,
      },
    };
  }

  public async getUnreadNotificationCount(userId: string) {
    const unreadCount = await prismaClient.notification.count({
      where: { userId, isDeleted: false, isRead: false },
    });

    return { unreadCount };
  }

  public async markNotificationAsRead(user: IUser, notificationId: string) {
    await this.getOwnedNotification(user.id, notificationId);

    return prismaClient.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  public async markNotificationAsUnread(user: IUser, notificationId: string) {
    await this.getOwnedNotification(user.id, notificationId);

    return prismaClient.notification.update({
      where: { id: notificationId },
      data: { isRead: false },
    });
  }

  public async markAllNotificationsAsRead(userId: string) {
    const result = await prismaClient.notification.updateMany({
      where: { userId, isDeleted: false, isRead: false },
      data: { isRead: true },
    });

    return { updatedCount: result.count };
  }

  public async deleteNotification(user: IUser, notificationId: string) {
    await this.getOwnedNotification(user.id, notificationId);

    return prismaClient.notification.update({
      where: { id: notificationId },
      data: { isDeleted: true, isRead: true },
    });
  }
}
