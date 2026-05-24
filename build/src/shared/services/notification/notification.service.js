"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expo_server_sdk_1 = require("expo-server-sdk");
const connect_1 = __importDefault(require("../../../infastructure/database/postgreSQL/connect"));
const logger_1 = __importDefault(require("../logger"));
const expo = new expo_server_sdk_1.Expo({ useFcmV1: true });
class PushService {
    static instance;
    constructor() { }
    static getInstance() {
        if (!this.instance) {
            this.instance = new PushService();
        }
        return this.instance;
    }
    async emitNotificationToClient(uid, header, data) {
        const user = await connect_1.default.user.findUnique({ where: { id: uid } });
        if (!user?.deviceToken || !expo_server_sdk_1.Expo.isExpoPushToken(user.deviceToken)) {
            return [];
        }
        const messages = [
            {
                to: user.deviceToken,
                sound: "default",
                title: header.title,
                body: header.body,
                data: data ?? {},
            },
        ];
        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];
        for (const chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            }
            catch (error) {
                logger_1.default.error({ err: error, uid }, "push notification chunk failed");
            }
        }
        return tickets;
    }
}
exports.default = PushService;
