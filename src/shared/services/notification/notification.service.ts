import { Expo, ExpoPushMessage, ExpoPushTicket } from "expo-server-sdk";
import prismaClient from "../../../infastructure/database/postgreSQL/connect";
import logger from "../logger";

const expo = new Expo({ useFcmV1: true });

export default class PushService {
  public static instance: PushService;

  private constructor() {}

  public static getInstance(): PushService {
    if (!this.instance) {
      this.instance = new PushService();
    }
    return this.instance;
  }

  async emitNotificationToClient(
    uid: string,
    header: { title: string; body: string },
    data?: Record<string, string>
  ): Promise<ExpoPushTicket[]> {
    const user = await prismaClient.user.findUnique({ where: { id: uid } });

    if (!user?.deviceToken || !Expo.isExpoPushToken(user.deviceToken)) {
      return [];
    }

    const messages: ExpoPushMessage[] = [
      {
        to: user.deviceToken,
        sound: "default",
        title: header.title,
        body: header.body,
        data: data ?? {},
      },
    ];

    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        logger.error({ err: error, uid }, "push notification chunk failed");
      }
    }

    return tickets;
  }
}

type NotificationPayload = {
  title: string;
  body: string;
  image?: string;
  link?: string;
  data?: Record<string, string>;
};

export class NotificationService {
  /**
   * Create an in-app notification row and optionally fan out a push notification.
   * Never throws to callers — errors are logged and swallowed.
   */
  async createAndSend(userId: string, payload: NotificationPayload): Promise<void> {
    try {
      const user = await prismaClient.user.findUnique({
        where: { id: userId },
        include: { settings: true },
      });

      if (!user) return;

      await prismaClient.notification.create({
        data: {
          userId,
          title: payload.title,
          body: payload.body,
          image: payload.image,
          link: payload.link,
        },
      });

      if (user.settings?.isPushNotificationsEnabled === false) {
        return;
      }

      await PushService.getInstance().emitNotificationToClient(
        userId,
        { title: payload.title, body: payload.body },
        payload.data
      );
    } catch (err) {
      logger.error({ err, userId, payload }, "notification dispatch failed");
    }
  }
}

export const notificationService = new NotificationService();
