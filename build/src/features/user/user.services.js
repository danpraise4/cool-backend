"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const client_1 = require("@prisma/client");
const connect_1 = __importDefault(require("../../infastructure/database/postgreSQL/connect"));
const blobstorage_service_1 = require("../../shared/services/azure/blobstorage.service");
const adminservice_client_1 = __importDefault(require("../../shared/services/admin/adminservice.client"));
const adminservice_1 = __importDefault(require("../../shared/services/admin/adminservice"));
const helper_1 = require("../../shared/helper/helper");
class UserService {
    AdminClient;
    constructor() {
        const adminClient = new adminservice_client_1.default(new adminservice_1.default());
        this.AdminClient = adminClient.build();
    }
    async getUserById(id) {
        const user = await connect_1.default.user.findUnique({
            where: { id },
        });
        delete user?.password;
        return user;
    }
    async getUserByEmail(email) {
        const user = await connect_1.default.user.findFirst({ where: { email } });
        return user;
    }
    async uploadImage(image, userId) {
        // Get current user to check for existing image
        const user = await this.getUserById(userId);
        // If user has existing image, delete it first
        if (user?.image) {
            await blobstorage_service_1.AzureBlobService.instance.deleteFile(user.image);
        }
        const imageUrl = await blobstorage_service_1.AzureBlobService.instance.uploadBase64Image(image, userId, "user");
        const updatedUser = await connect_1.default.user.update({
            where: { id: userId },
            data: { image: imageUrl.url },
        });
        return updatedUser;
    }
    async updateUser(user) {
        console.log("1 user");
        const checkUser = await this.getUserById(user.id);
        console.log("2 user");
        if (!checkUser) {
            throw new Error("User not found");
        }
        const updatedUser = await connect_1.default.user.update({
            where: { id: user.id },
            data: user,
        });
        return updatedUser;
    }
    async deleteUser(userId) {
        const user = await this.getUserById(userId);
        if (!user) {
            throw new Error("User not found");
        }
        // check is user hase a pending or upcomming order or  has a balance in wallet
        const pendingOrders = await connect_1.default.order.findMany({
            where: { userId, status: { in: [client_1.Status.PENDING] } },
        });
        if (pendingOrders.length > 0) {
            throw new Error("User has a pending order");
        }
        // check is user has a balance in wallet
        const wallet = await connect_1.default.wallet.findUnique({
            where: { userId },
        });
        if (wallet?.balance > 0) {
            throw new Error("User has a balance in wallet. Please withdraw your balance before deleting your account.");
        }
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
        const schedules = await connect_1.default.recycleSchedule.findMany({
            where: {
                userId,
                status: { in: [client_1.Status.PENDING] }
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
        await connect_1.default.user.update({
            where: { id: userId },
            data: { status: client_1.Status.DELETED },
        });
        return { message: "User deleted successfully" };
    }
    async getUserSettings(userId) {
        const settings = await connect_1.default.settings.findUnique({
            where: { userId },
        });
        if (!settings) {
            const newSettings = await this.updateSettings({ id: userId }, {
                isEmailNotificationsEnabled: true,
                isSmsNotificationsEnabled: true,
                isPushNotificationsEnabled: true,
            });
            return newSettings;
        }
        return settings;
    }
    async updateDeviceToken(deviceToken, userId) {
        const updatedUser = await connect_1.default.user.update({
            where: { id: userId },
            data: { deviceToken },
        });
        return updatedUser;
    }
    async updateLocation(location, userId) {
        const updatedUser = await connect_1.default.user.update({
            where: { id: userId },
            data: { latitude: location.latitude, longitude: location.longitude, locationAccuracy: client_1.LocationAccuracy.EXACT },
        });
        return updatedUser;
    }
    async updateSettings(user, settings) {
        const updatedSettings = await connect_1.default.settings.upsert({
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
    async getHomeCharities(_user, params) {
        try {
            console.log("params", params);
            // Fetch charity products
            const charities = await connect_1.default.product.findMany({
                where: {
                    isSold: false,
                    type: client_1.ProductType.CHARITY_PRODUCT,
                    currency: _user.cityOfResidence === "Lagos" ? client_1.Currency.NGN : client_1.Currency.EUR,
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
                        },
                    },
                },
            });
            // Get all materials in parallel
            const materialPromises = charities.map((charity) => this.AdminClient.getMaterialById(charity.material));
            const materials = await Promise.all(materialPromises);
            // Map materials back to charities and add distance
            const charitiesWithMaterialsAndDistance = charities.map((charity, index) => {
                let distance = null;
                if (typeof charity.createdBy.latitude === "number" &&
                    typeof charity.createdBy.longitude === "number" &&
                    typeof params.Latitude === "number" &&
                    typeof params.Longitude === "number") {
                    distance = helper_1.Helper.getDistanceFromLatLonInMiles(params.Latitude, params.Longitude, charity.createdBy.latitude, charity.createdBy.longitude);
                }
                return {
                    ...charity,
                    material: materials[index].payload,
                    distanceInMiles: distance,
                };
            });
            // Sort by distance, with closest items first (null distances at the end)
            const sortedCharities = charitiesWithMaterialsAndDistance.sort((a, b) => {
                if (a.distanceInMiles === null && b.distanceInMiles === null)
                    return 0;
                if (a.distanceInMiles === null)
                    return 1;
                if (b.distanceInMiles === null)
                    return -1;
                return a.distanceInMiles - b.distanceInMiles;
            });
            return sortedCharities;
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async getHomeFacilities(_user, _settings) {
        try {
            const facilities = await this.AdminClient.getFacilities({
                Latitude: _settings.Latitude,
                Longitude: _settings.Longitude,
            });
            return facilities.payload.items;
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async getHomeHeroes(_user) {
        try {
            // const heroes = await prismaClient.hero.findMany({
            //   where: {
            //     status: Status.APPROVED,
            //   },
            // });
            return [];
        }
        catch (error) {
            throw new Error(error);
        }
    }
    async getHomeTopDeals(_user, params) {
        try {
            // Fetch products with latitude and longitude
            const topDeals = await connect_1.default.product.findMany({
                where: {
                    isSold: false,
                    type: client_1.ProductType.SALES_PRODUCT,
                    currency: _user.cityOfResidence === "Lagos" ? client_1.Currency.NGN : client_1.Currency.EUR,
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
                        },
                    },
                },
            });
            // Get all materials in parallel
            const materialPromises = topDeals.map((deal) => this.AdminClient.getMaterialById(deal.material));
            const materials = await Promise.all(materialPromises);
            // Map materials back to deals and add distance
            const dealsWithMaterialsAndDistance = topDeals.map((deal, index) => {
                let distance = null;
                if (typeof deal.createdBy.latitude === "number" &&
                    typeof deal.createdBy.longitude === "number" &&
                    typeof params.Latitude === "number" &&
                    typeof params.Longitude === "number") {
                    distance = helper_1.Helper.getDistanceFromLatLonInMiles(params.Latitude, params.Longitude, deal.createdBy.latitude, deal.createdBy.longitude);
                }
                return {
                    ...deal,
                    material: materials[index].payload,
                    distanceInMiles: distance,
                };
            });
            // Sort by distance, with closest items first (null distances at the end)
            const sortedDeals = dealsWithMaterialsAndDistance.sort((a, b) => {
                if (a.distanceInMiles === null && b.distanceInMiles === null)
                    return 0;
                if (a.distanceInMiles === null)
                    return 1;
                if (b.distanceInMiles === null)
                    return -1;
                return a.distanceInMiles - b.distanceInMiles;
            });
            return sortedDeals;
        }
        catch (error) {
            throw new Error(error);
        }
    }
    // Notifications
    // get notifications by id
    async getNotificationById(notificationId) {
        const notification = await connect_1.default.notification.findUnique({
            where: { id: notificationId },
        });
        return notification;
    }
    async getNotifications(user) {
        const notifications = await connect_1.default.notification.findMany({
            where: { userId: user.id },
            orderBy: {
                createdAt: "desc",
            },
        });
        return notifications;
    }
    async markNotificationAsRead(user, notificationId) {
        const _notification = await this.getNotificationById(notificationId);
        if (!_notification) {
            throw new Error("Notification not found");
        }
        if (_notification.userId !== user.id) {
            throw Error("You don't have permission to delete this");
        }
        const notification = await connect_1.default.notification.update({
            where: { id: notificationId },
            data: { isRead: true },
        });
        return notification;
    }
    async markNotificationAsUnread(user, notificationId) {
        const _notification = await this.getNotificationById(notificationId);
        if (!_notification) {
            throw new Error("Notification not found");
        }
        if (_notification.userId !== user.id) {
            throw Error("You don't have permission to mark this as unread");
        }
        const notification = await connect_1.default.notification.update({
            where: { id: notificationId },
            data: { isRead: false },
        });
        return notification;
    }
}
exports.UserService = UserService;
