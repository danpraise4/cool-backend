import { Expo } from "expo-server-sdk";
import prismaClient from "../../../infastructure/database/postgreSQL/connect";

export default class PushService {
  public static instance: PushService;

  private constructor() {}

  public static getInstance(): PushService {
    if (!this.instance) {
      this.instance = new PushService();
    }
    return this.instance;
  }

  // Send to Single User listed
  async emitNotficationToClient(
    uid: string,
    header: { title: string; body: string },
    data?: { [key: string]: string }
  ) {
    const user = await prismaClient.user.findUnique({
      where: {
        id: uid,
      },
    });
    if (!user.deviceToken) return;

    let expo = new Expo({
      //   accessToken: config.expoAccessToken,
      useFcmV1: true,    
    });

    if (Expo.isExpoPushToken(user.deviceToken)) {
      console.log("Sending to", user.deviceToken);
      let messages = [];
      messages.push({
        to: user.deviceToken,
        sound: "default",
        title: header.title,
        body: header.body,
        data: data ?? {},
      });

      // The Expo push notification service accepts batches of notifications so

      let chunks = expo.chunkPushNotifications(messages);
      let tickets = [];
      (async () => {
        for (let chunk of chunks) {
          try {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            console.log(ticketChunk);
            tickets.push(...ticketChunk);
          } catch (error) {
            console.error(error);
          }
        }
      })();

      return;
    }
  }
}
