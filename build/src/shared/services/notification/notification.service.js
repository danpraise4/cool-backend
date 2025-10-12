"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expo_server_sdk_1 = require("expo-server-sdk");
const connect_1 = __importDefault(require("../../../infastructure/database/postgreSQL/connect"));
class PushService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!this.instance) {
            this.instance = new PushService();
        }
        return this.instance;
    }
    // Send to Single User listed
    async emitNotficationToClient(uid, header, data) {
        const user = await connect_1.default.user.findUnique({
            where: {
                id: uid,
            },
        });
        if (!user.deviceToken)
            return;
        let expo = new expo_server_sdk_1.Expo({
            //   accessToken: config.expoAccessToken,
            useFcmV1: true,
        });
        if (expo_server_sdk_1.Expo.isExpoPushToken(user.deviceToken)) {
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
                    }
                    catch (error) {
                        console.error(error);
                    }
                }
            })();
            return;
        }
    }
}
exports.default = PushService;
