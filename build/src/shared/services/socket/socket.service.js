"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketUserMiddleware = socketUserMiddleware;
const redis_service_1 = __importDefault(require("../redis.service"));
const app_constants_1 = require("../../config/app.constants");
const recycle_services_1 = require("../../../features/recycle/recycle.services");
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
            console.log("New client connected:", socket.id);
            console.log("Client origin:", socket.handshake.headers.origin);
            console.log("Client user agent:", socket.handshake.headers['user-agent']);
            const { User } = socket.handshake.query;
            const userId = User;
            try {
                // Clean up any previous socket for this user
                const user_previous_socket = await redis_service_1.default.instance.getUserSocket(userId);
                if (user_previous_socket) {
                    await redis_service_1.default.instance.delete(userId);
                }
                // Store new socket mapping
                await redis_service_1.default.instance.set(userId, socket.id);
                this.setupEventHandlers(socket);
                socket.emit(app_constants_1.WS_EVENT.CONNECTION, {
                    message: "Connected to socket",
                    socketId: socket.id,
                    userId: userId
                });
                console.log(`User ${userId} successfully connected with socket ${socket.id}`);
            }
            catch (error) {
                console.error("Error setting up socket connection:", error);
                socket.emit("error", { message: "Failed to establish connection" });
            }
            // Handle disconnection
            socket.on("disconnect", async (reason) => {
                console.log(`Socket ${socket.id} disconnected. Reason: ${reason}`);
                try {
                    await redis_service_1.default.instance.delete(userId);
                }
                catch (error) {
                    console.error("Error cleaning up socket on disconnect:", error);
                }
            });
            // Handle chat join
            socket.on(app_constants_1.WS_EVENT.CHAT_JOIN, async (data) => {
                try {
                    console.log(`User ${userId} joining chat ${data.chatID}`);
                    // Join the room
                    await socket.join(data.chatID);
                    console.log(`Socket ${socket.id} joined room ${data.chatID}`);
                    // Get messages for the chat
                    const messages = await new recycle_services_1.RecycleService().getRecycleChatMessages({
                        chatID: data.chatID,
                    });
                    console.log(`Sending ${messages?.length || 0} messages to user in chat ${data.chatID}`);
                    // Send messages directly to this socket (not to the room)
                    socket.emit(app_constants_1.WS_EVENT.CHAT_MESSAGE, {
                        messages,
                        chatID: data.chatID,
                    });
                    socket.emit(app_constants_1.WS_EVENT.ROOM_JOINED, {
                        room: data.chatID,
                        message: `Successfully joined room ${data.chatID}`,
                    });
                    // Optionally notify other users in the room that someone joined
                    socket.to(data.chatID).emit(app_constants_1.WS_EVENT.USER_JOINED_CHAT, {
                        userId,
                        chatID: data.chatID,
                        message: `User ${userId} joined the chat`,
                    });
                }
                catch (error) {
                    console.error("Error joining chat:", error);
                    socket.emit("error", { message: "Failed to join chat" });
                }
            });
            // Handle sending messages to a chat
            socket.on(app_constants_1.WS_EVENT.SEND_CHAT_MESSAGE, async (data) => {
                try {
                    console.log(`User ${userId} sending message to chat ${data.chatID}`);
                    // Save the message (if needed)
                    // const savedMessage = await new RecycleService().saveMessage(data);
                    // Emit to all users in the chat room (including sender)
                    this.io.to(data.chatID).emit(app_constants_1.WS_EVENT.CHAT_MESSAGE, {
                        message: data.message,
                        userID: userId,
                        senderID: userId,
                        chatID: data.chatID,
                        timestamp: new Date(),
                    });
                    new recycle_services_1.RecycleService().sendRecycleChatMessage({
                        message: data.message,
                        userID: userId,
                        chatID: data.chatID,
                    });
                }
                catch (error) {
                    console.error("Error sending message:", error);
                    socket.emit("error", { message: "Failed to send message" });
                }
            });
        });
    }
    setupEventHandlers(socket) {
        socket.on(app_constants_1.WS_EVENT.JOIN, async (room) => {
            console.log("User joining room:", room);
            try {
                await socket.join(room);
                console.log(`Socket ${socket.id} successfully joined room ${room}`);
                // Notify others in the room
                socket.to(room).emit(app_constants_1.WS_EVENT.USER_JOINED_ROOM, {
                    socketId: socket.id,
                    room,
                });
            }
            catch (error) {
                console.error("Error joining room:", error);
                socket.emit("error", { message: `Failed to join room ${room}` });
            }
        });
    }
    async emitEventToClient(userId, event, data) {
        const socketId = await redis_service_1.default.instance.getUserSocket(userId);
        if (socketId) {
            const targetSocket = this.io.sockets.sockets.get(socketId);
            if (targetSocket) {
                targetSocket.emit(event, data);
                console.log(`Emitted ${event} to user ${userId} (socket: ${socketId})`);
            }
            else {
                console.log(`Socket ${socketId} not found for user ${userId}`);
            }
        }
        else {
            console.log(`No socket found for user ${userId}`);
        }
    }
    emitEventToAll(event, data) {
        this.io.emit(event, data);
        console.log(`Emitted ${event} to all connected clients`);
    }
    emitToGroup(group, event, data) {
        this.io.to(group).emit(event, data);
        console.log(`Emitted ${event} to group ${group}`);
    }
    // Helper method to check room membership
    async getRoomMembers(room) {
        const sockets = await this.io.in(room).fetchSockets();
        return sockets.map((socket) => ({
            socketId: socket.id,
            userId: socket.handshake.query.User,
        }));
    }
    // Get connection statistics
    getConnectionStats() {
        return {
            connectedClients: this.io.engine.clientsCount,
            totalConnections: this.io.sockets.sockets.size,
            timestamp: new Date().toISOString()
        };
    }
    // Test connection method for external users
    testConnection() {
        this.io.emit('connection_test', {
            message: 'Socket.IO server is working',
            timestamp: new Date().toISOString(),
            serverTime: Date.now()
        });
    }
}
exports.default = WS;
async function socketUserMiddleware(socket, next) {
    try {
        let { user } = socket.handshake.query;
        user = user;
        // Allow anonymous connections for external users
        if (!user) {
            // Generate a temporary user ID for anonymous connections
            user = `anonymous_${socket.id}`;
            console.log(`Anonymous user connected with socket ${socket.id}`);
        }
        socket.handshake.query.User = user;
        console.log(`User ${user} authenticated for socket ${socket.id}`);
        next();
    }
    catch (error) {
        console.error("Socket authentication error:", error);
        if (error instanceof Error) {
            next(error);
        }
        else {
            next(new Error("Authentication failed"));
        }
    }
}
