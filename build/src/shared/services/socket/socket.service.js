"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketUserMiddleware = socketUserMiddleware;
const redis_service_1 = __importDefault(require("../redis.service"));
const app_constants_1 = require("../../config/app.constants");
const recycle_services_1 = require("../../../features/recycle/recycle.services");
const logger_1 = __importDefault(require("../logger"));
const recycleService = new recycle_services_1.RecycleService();
class WS {
    static instance;
    io;
    constructor(io) {
        this.io = io;
        this.setupSocket();
    }
    static getInstance(io) {
        if (!this.instance) {
            this.instance = new WS(io);
        }
        return this.instance;
    }
    setupSocket() {
        this.io.on(app_constants_1.WS_EVENT.CONNECTION, async (socket) => {
            const { User } = socket.handshake.query;
            const userId = User;
            try {
                const previousSocket = await redis_service_1.default.instance.getUserSocket(userId);
                if (previousSocket) {
                    await redis_service_1.default.instance.delete(userId);
                }
                await redis_service_1.default.instance.set(userId, socket.id, 3600);
                this.setupEventHandlers(socket);
                socket.emit(app_constants_1.WS_EVENT.CONNECTION, {
                    message: "Connected to socket",
                    socketId: socket.id,
                    userId,
                });
                logger_1.default.debug({ userId, socketId: socket.id }, "user connected");
            }
            catch (error) {
                logger_1.default.error({ err: error, socketId: socket.id }, "socket connection setup failed");
                socket.emit("error", { message: "Failed to establish connection" });
            }
            socket.on("disconnect", async (reason) => {
                logger_1.default.debug({ socketId: socket.id, reason }, "socket disconnected");
                try {
                    await redis_service_1.default.instance.delete(userId);
                }
                catch (error) {
                    logger_1.default.error({ err: error, socketId: socket.id }, "socket cleanup on disconnect failed");
                }
            });
            socket.on(app_constants_1.WS_EVENT.CHAT_JOIN, async (data) => {
                try {
                    await socket.join(data.chatID);
                    const messages = await recycleService.getRecycleChatMessages({ chatID: data.chatID });
                    socket.emit(app_constants_1.WS_EVENT.CHAT_MESSAGE, { messages, chatID: data.chatID });
                    socket.emit(app_constants_1.WS_EVENT.ROOM_JOINED, {
                        room: data.chatID,
                        message: `Successfully joined room ${data.chatID}`,
                    });
                    socket.to(data.chatID).emit(app_constants_1.WS_EVENT.USER_JOINED_CHAT, {
                        userId,
                        chatID: data.chatID,
                    });
                }
                catch (error) {
                    logger_1.default.error({ err: error, userId, chatID: data.chatID }, "chat join failed");
                    socket.emit("error", { message: "Failed to join chat" });
                }
            });
            socket.on(app_constants_1.WS_EVENT.SEND_CHAT_MESSAGE, async (data) => {
                try {
                    this.io.to(data.chatID).emit(app_constants_1.WS_EVENT.CHAT_MESSAGE, {
                        message: data.message,
                        userID: userId,
                        senderID: userId,
                        chatID: data.chatID,
                        timestamp: new Date(),
                    });
                    await recycleService.sendRecycleChatMessage({
                        message: data.message,
                        userID: userId,
                        chatID: data.chatID,
                    });
                }
                catch (error) {
                    logger_1.default.error({ err: error, userId, chatID: data.chatID }, "send chat message failed");
                    socket.emit("error", { message: "Failed to send message" });
                }
            });
        });
    }
    setupEventHandlers(socket) {
        socket.on(app_constants_1.WS_EVENT.JOIN, async (room) => {
            try {
                await socket.join(room);
                socket.to(room).emit(app_constants_1.WS_EVENT.USER_JOINED_ROOM, { socketId: socket.id, room });
            }
            catch (error) {
                logger_1.default.error({ err: error, socketId: socket.id, room }, "room join failed");
                socket.emit("error", { message: `Failed to join room ${room}` });
            }
        });
    }
    async emitEventToClient(userId, event, data) {
        const socketId = await redis_service_1.default.instance.getUserSocket(userId);
        if (!socketId)
            return;
        const targetSocket = this.io.sockets.sockets.get(socketId);
        if (targetSocket) {
            targetSocket.emit(event, data);
        }
        else {
            await redis_service_1.default.instance.delete(userId);
        }
    }
    emitEventToAll(event, data) {
        this.io.emit(event, data);
    }
    emitToGroup(group, event, data) {
        this.io.to(group).emit(event, data);
    }
    async getRoomMembers(room) {
        const sockets = await this.io.in(room).fetchSockets();
        return sockets.map((s) => ({
            socketId: s.id,
            userId: s.handshake.query.User,
        }));
    }
}
exports.default = WS;
async function socketUserMiddleware(socket, next) {
    const { user } = socket.handshake.query;
    if (!user || typeof user !== "string") {
        return next(new Error("Authentication required: missing user query parameter"));
    }
    socket.handshake.query.User = user;
    next();
}
