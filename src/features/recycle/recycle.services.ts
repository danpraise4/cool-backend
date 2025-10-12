import prismaClient from "../../infastructure/database/postgreSQL/connect";
import { Helper } from "../../shared/helper/helper";
import AdminServiceClient from "../../shared/services/admin/adminservice.client";
import AdminService from "../../shared/services/admin/adminservice";
import { ICommunityCreateSchedule, IUpdateRecycleSchedule } from "./recycle.intefase";
import { RecycleChatType, RecycleScheduleStatus, User } from "@prisma/client";

export class RecycleService {
  AdminClient: AdminService;

  constructor() {
    const adminClient = new AdminServiceClient(new AdminService());
    this.AdminClient = adminClient.build();
  }

  public async createRecycleSchedule(config: {
    user: User;
    schedule: ICommunityCreateSchedule;
  }) {
    const { type, facilityId, materialId, dates } = config.schedule;
    const {
      id: userId,
      firstName,
      lastName,
      email,
      phone,
      address,
    } = config.user;

    // Check if facility and material exist in parallel
    const [facility, material] = await Promise.all([
      this.AdminClient.getFacilityById(facilityId),
      this.AdminClient.getMaterialById(materialId),
    ]);

    if (!facility) {
      throw new Error("Facility not found");
    }

    if (!material) {
      throw new Error("Material not found");
    }

    // Validate dates
    // Validate dates
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison

    if (
      !dates.every((date) => {
        const dateObj = Helper.toDate(date);
        dateObj.setHours(0, 0, 0, 0); // Reset time to start of day
        return dateObj >= currentDate;
      })
    ) {
      throw new Error("Invalid dates - dates must be today or in the future");
    }

    // create
    const createAdmiRequest = await this.AdminClient.createRecycleRequest({
      facilityId: facility.payload.id,
      recycler: {
        recyclerAppId: userId,
        fullName: `${firstName} ${lastName}`,
        email: email,
        phoneNumber: phone,
        address: {
          lineOne: address,
          lineTwo: null,
          lineThree: null,
          postCode: "",
          state: config.user.cityOfResidence,
          city: config.user.cityOfResidence,
          country: config.user.cityOfResidence === "Lagos" ? "Nigeria" : "UK",
        },
      },
      recycle: {
        collectionMethod:
          config.schedule.type === "PICKUP" ? 1 : 2,
        materialId: material.payload.id,
        quantity: config.schedule.quantity || 0,
        scheduledCollectionDate: dates.map((date) => Helper.toDate(date))[0].toISOString(),
      },
    });

    console.log(createAdmiRequest);

    // Create schedule
    return prismaClient.recycleSchedule.create({
      data: {
        type,
        transactionId: createAdmiRequest.payload.transactionId,
        facility: facility.payload.id.toString(),
        material: material.payload.id.toString(),
        dates: dates.map((date) => Helper.toDate(date)),
        quantity: config.schedule.quantity || 0,
        userId,
      },
    });
  }

  public async updateRecycleSchedule(config: {
    id: string;
    userId: string;
    schedule: IUpdateRecycleSchedule;
  }) {

    console.log("here 1");
    const existingSchedule = await prismaClient.recycleSchedule.findFirst({
      where: {
        id: config.id,
        userId: config.userId,
      },
    });

    console.log("here 2 existingSchedule", config);

    if (!existingSchedule) {
      throw new Error(
        "Schedule not found or you don't have permission to update it"
      );
    }



    // Validate dates
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    const scheduledCollectionDate = Helper.toDate(config.schedule.scheduledCollectionDate);

    if (
      ![config.schedule.scheduledCollectionDate].every((date) => {
        const dateObj = Helper.toDate(date);
        dateObj.setHours(0, 0, 0, 0); // Reset time to start of day
        return dateObj >= currentDate;
      })
    ) {
      throw new Error("Invalid dates - dates must be today or in the future");
    }


    console.log("here 3", currentDate);

    await this.AdminClient.updateRecycleRequest(
      existingSchedule.transactionId,
      {
        recyclerAppId: config.userId,
        transactionStatus: (config.schedule.transactionStatus),
        scheduledCollectionDate: scheduledCollectionDate.toISOString(),
        quantity: config.schedule.quantity || 0,
      }
    );

    console.log("here 4");

    const updatedSchedule = await prismaClient.recycleSchedule.update({
      where: { id: config.id },
      data: {
        dates: [Helper.toDate(config.schedule.scheduledCollectionDate)],
        status: Helper.matchStatus(config.schedule.transactionStatus) as RecycleScheduleStatus,
      },
    });

    console.log("here 5");

    return updatedSchedule;
  }

  public async getRecycleScheduleByTransactionId(config: { recyclerId: string, transactionId: string }) {
    console.log("config", config);
    const schedule = await prismaClient.recycleSchedule.findFirst({
      where: { id: config.transactionId },
    });


    const facility = await this.AdminClient.getFacilityById(
      schedule.facility
    );
    const material = await this.AdminClient.getMaterialById(
      schedule.material
    );
     
    console.log("schedule", schedule);

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    const recycleRequest = await this.AdminClient.getRecycleRequestById({
      recyclerId: config.recyclerId.trim(),
      transactionId: schedule.transactionId.toString().trim(),
    });

    const payload = {
      schedule,
      facility: facility.payload,
      material: material.payload,
      recycleRequest: recycleRequest.payload,
    };

    console.log("payload", payload);

    return payload;
  }

  public async deleteRecycleSchedule(config: { id: string; userId: string }) {
    const deletedSchedule = await prismaClient.recycleSchedule.delete({
      where: { id: config.id, userId: config.userId },
    });

    return deletedSchedule;
  }

  // get recycle schedule based on id
  public async getRecycleSchedule(config: { id: string; userId: string }) {
    const schedule = await prismaClient.recycleSchedule.findFirst({
      where: { id: config.id, userId: config.userId },
    });

    if (!schedule) {
      throw new Error("Schedule not found");
    }

    return schedule;
  }

  // get all recycle schedules based on user and date
  public async getRecycleSchedules(config: { userId: string; date: string }) {
    const date = Helper.toDate(config.date);

    const schedules = await prismaClient.recycleSchedule.findMany({
      where: { userId: config.userId, dates: { has: date } },
    });

    // Map schedules to fetch facility details from API
    const schedulesWithFacilities = await Promise.all(
      schedules.map(async (schedule) => {
        const facility = await this.AdminClient.getFacilityById(
          schedule.facility
        );
        const material = await this.AdminClient.getMaterialById(
          schedule.material
        );

        // const recycleRequest = await this.AdminClient.getRecycleRequestById(schedule.transactionId);

        return {
          ...schedule,
          facility: facility.payload,
          material: material.payload,
          // request: recycleRequest.payload,
        };
      })
    );

    // console.log("schedulesWithFacilities", schedulesWithFacilities);

    return schedulesWithFacilities;
  }

  // get all the dates that a user has a recycle schedule
  public async getRecycleScheduleDates(config: { userId: string }) {
    const schedules = await prismaClient.recycleSchedule.findMany({
      where: { userId: config.userId },
      select: {
        dates: true,
      },
    });

    // Extract all dates from schedules and flatten into a single array
    const allDates = schedules.reduce((acc, schedule) => {
      return [...acc, ...schedule.dates];
    }, [] as Date[]);

    // Return the array of dates
    return allDates;
  }

  public async initiateRecycleChat(config: {
    userID: string;
    withID: string;
    type: RecycleChatType;
  }) {
    const { userID, withID, type } = config;

    const chatID = Helper.generateChatID(userID, withID);
    // find if chat already exists
    const chat = await prismaClient.recycleChat.findFirst({
      where: {
        chatID,
        OR: [{ createdBy: userID }, { withUser: userID }],
      },
    });

    if (chat) {
      return chat;
    }

    // create chat
    const newChat = await prismaClient.recycleChat.create({
      data: {
        chatID,
        createdBy: userID,
        withUser: withID,
        type,
      },
    });

    return newChat;
  }

  public async sendRecycleChatMessage(config: {
    chatID: string;
    message: string;
    userID: string;
  }) {
    const { chatID, message, userID } = config;

    const chat = await prismaClient.recycleChat.findUnique({
      where: { id: chatID },
    });

    if (!chat) {
      throw new Error("Chat not found");
    }

    // create message
    const newMessage = await prismaClient.recycleChatMessage.create({
      data: {
        message,
        senderID: userID,
        recycleChatId: chatID,
      },
    });

    await prismaClient.recycleChat.update({
      where: { id: chat.id },
      data: {
        lastMessage: {
          connect: {
            id: newMessage.id,
          },
        },
      },
    });

    return newMessage;
  }

  // get all messages for a chat // Not for api use
  public async getRecycleChatMessages(config: { chatID: string }) {
    const messages = await prismaClient.recycleChatMessage.findMany({
      where: { recycleChatId: config.chatID },
    });

    return messages;
  }

  // get all chats for a user
  public async getRecycleChats(config: { userID: string }) {
    const chats = await prismaClient.recycleChat.findMany({
      where: {
        OR: [{ createdBy: config.userID }, { withUser: config.userID }],
      },
      include: {
        lastMessage: true,
      },
      orderBy: {
        lastMessage: {
          createdAt: "desc",
        },
      },
    });

    return chats;
  }

  // get recycle facility data
  public async getRecycleFacilityData(config: { userID: string, facilityId: string }) {

    console.log("config", config);
    const facility = await this.AdminClient.getFacilityByItsID(config.facilityId);
    return facility.payload;
  }


  // Top
  public async getTopRecyclers() {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const topRecyclers = await prismaClient.recycleSchedule.groupBy({
      by: ["userId"],
      where: {
        // status: RecycleScheduleStatus.COMPLETED,
        createdAt: {
          gte: oneMonthAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10, // Get top 10 recyclers
    });

    // If you need user details, you can then fetch the users
    const topRecyclersWithUserInfo = await prismaClient.user.findMany({
      where: {
        id: {
          in: topRecyclers.map((recycler) => recycler.userId),
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        image: true,
        email: true,
        // Add other user fields you need
      },
    });

    // Combine the data
    const topRecyclersResult = topRecyclers.map((recycler) => ({
      userId: recycler.userId,
      recycleCount: recycler._count.id,
      user: topRecyclersWithUserInfo.find(
        (user) => user.id === recycler.userId
      ),
    }));

    return topRecyclersResult;
  }

  // Get falities i recycle with
  public async getCompletedRecycleSchedules(config: {
    userId: string;
  }): Promise<any> {
    // TODO
    const facilities = await prismaClient.recycleSchedule.findMany({
      where: {
        userId: config.userId,
      },
    });

    const facilitiesWithDetails = await Promise.all(
      facilities.map(async (schedule) => ({
        ...schedule,
        facility: (
          await this.AdminClient.getFacilityById(schedule.facility)
        ).payload,
        material: (
          await this.AdminClient.getMaterialById(schedule.material)
        ).payload,
      }))
    );

    return facilitiesWithDetails;
  }

  public async getUserRecyclingAnalytics(
    userId: string,
    timeRange?: { start?: Date; end?: Date }
  ) {
    const whereClause = {
      userId: userId,
      // status: RecycleScheduleStatus.COMPLETED,
      ...(timeRange && {
        createdAt: {
          ...(timeRange.start && { gte: timeRange.start }),
          ...(timeRange.end && { lte: timeRange.end }),
        },
      }),
    };

    // Get recycling count by material type
    const recyclingByMaterial = await prismaClient.recycleSchedule.groupBy({
      by: ["material"],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    // Fetch ALL materials (not just the ones with recycling data)
    const allMaterials = await this.AdminClient.getMaterial();
    // Create a map of material recycling counts for quick lookup
    const recyclingCountMap = new Map(
      recyclingByMaterial.map((item) => [item.material, item._count.id])
    );

    // Combine data for analytics - include ALL materials
    const analyticsData = allMaterials.payload.map((material) => ({
      materialId: material.id,
      materialTitle: material.category,
      recycleCount: recyclingCountMap.get(material.id.toString()) || 0, // ✅ Returns 0 if no recycling data found
      material: material,
    }));

    // Sort by recycle count (highest first), then by title for materials with 0 count
    analyticsData.sort((a, b) => {
      if (a.recycleCount !== b.recycleCount) {
        return b.recycleCount - a.recycleCount;
      }
      return a.materialTitle.localeCompare(b.materialTitle);
    });

    return analyticsData;
  }
}
