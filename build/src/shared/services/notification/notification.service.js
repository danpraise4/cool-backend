"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = void 0;
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
class NotificationService {
    /**
     * Create an in-app notification row and optionally fan out a push notification.
     * Never throws to callers — errors are logged and swallowed.
     */
    async createAndSend(userId, payload) {
        try {
            const user = await connect_1.default.user.findUnique({
                where: { id: userId },
                include: { settings: true },
            });
            if (!user)
                return;
            const notificationType = payload.type ?? payload.data?.type;
            await connect_1.default.notification.create({
                data: {
                    userId,
                    title: payload.title,
                    body: payload.body,
                    image: payload.image,
                    link: payload.link,
                    type: notificationType,
                    metadata: payload.data ? payload.data : undefined,
                },
            });
            if (user.settings?.isPushNotificationsEnabled === false) {
                return;
            }
            await PushService.getInstance().emitNotificationToClient(userId, { title: payload.title, body: payload.body }, payload.data);
        }
        catch (err) {
            logger_1.default.error({ err, userId, payload }, "notification dispatch failed");
        }
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
