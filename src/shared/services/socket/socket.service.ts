import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import RedisService from "../redis.service";
import { WS_EVENT } from "../../config/app.constants";
import { RecycleService } from "../../../features/recycle/recycle.services";
import logger from "../logger";

const recycleService = new RecycleService();

export default class WS {
  public static instance: WS;
  private io: Server;

  private constructor(io: Server) {
    this.io = io;
    this.setupSocket();
  }

  public static getInstance(io: Server): WS {
    if (!this.instance) {
      this.instance = new WS(io);
    }
    return this.instance;
  }

  private setupSocket() {
    this.io.on(WS_EVENT.CONNECTION, async (socket: Socket<DefaultEventsMap>) => {
      const { User } = socket.handshake.query;
      const userId = User as string;

      try {
        const previousSocket = await RedisService.instance.getUserSocket(userId);
        if (previousSocket) {
          await RedisService.instance.delete(userId);
        }

        await RedisService.instance.set(userId, socket.id, 3600);

        this.setupEventHandlers(socket);
        socket.emit(WS_EVENT.CONNECTION, {
          message: "Connected to socket",
          socketId: socket.id,
          userId,
        });

        logger.debug({ userId, socketId: socket.id }, "user connected");
      } catch (error) {
        logger.error({ err: error, socketId: socket.id }, "socket connection setup failed");
        socket.emit("error", { message: "Failed to establish connection" });
      }

      socket.on("disconnect", async (reason) => {
        logger.debug({ socketId: socket.id, reason }, "socket disconnected");
        try {
          await RedisService.instance.delete(userId);
        } catch (error) {
          logger.error({ err: error, socketId: socket.id }, "socket cleanup on disconnect failed");
        }
      });

      socket.on(WS_EVENT.CHAT_JOIN, async (data: { chatID: string }) => {
        try {
          await socket.join(data.chatID);

          const messages = await recycleService.getRecycleChatMessages({ chatID: data.chatID });

          socket.emit(WS_EVENT.CHAT_MESSAGE, { messages, chatID: data.chatID });
          socket.emit(WS_EVENT.ROOM_JOINED, {
            room: data.chatID,
            message: `Successfully joined room ${data.chatID}`,
          });
          socket.to(data.chatID).emit(WS_EVENT.USER_JOINED_CHAT, {
            userId,
            chatID: data.chatID,
          });
        } catch (error) {
          logger.error({ err: error, userId, chatID: data.chatID }, "chat join failed");
          socket.emit("error", { message: "Failed to join chat" });
        }
      });

      socket.on(WS_EVENT.SEND_CHAT_MESSAGE, async (data: { chatID: string; message: string }) => {
        try {
          this.io.to(data.chatID).emit(WS_EVENT.CHAT_MESSAGE, {
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
        } catch (error) {
          logger.error({ err: error, userId, chatID: data.chatID }, "send chat message failed");
          socket.emit("error", { message: "Failed to send message" });
        }
      });
    });
  }

  public setupEventHandlers(socket: Socket) {
    socket.on(WS_EVENT.JOIN, async (room: string) => {
      try {
        await socket.join(room);
        socket.to(room).emit(WS_EVENT.USER_JOINED_ROOM, { socketId: socket.id, room });
      } catch (error) {
        logger.error({ err: error, socketId: socket.id, room }, "room join failed");
        socket.emit("error", { message: `Failed to join room ${room}` });
      }
    });
  }

  async emitEventToClient(userId: string, event: string, data: unknown) {
    const socketId = await RedisService.instance.getUserSocket(userId);
    if (!socketId) return;

    const targetSocket = this.io.sockets.sockets.get(socketId);
    if (targetSocket) {
      targetSocket.emit(event, data);
    } else {
      await RedisService.instance.delete(userId);
    }
  }

  emitEventToAll(event: string, data: unknown) {
    this.io.emit(event, data);
  }

  emitToGroup(group: string, event: string, data: unknown) {
    this.io.to(group).emit(event, data);
  }

  async getRoomMembers(room: string) {
    const sockets = await this.io.in(room).fetchSockets();
    return sockets.map((s) => ({
      socketId: s.id,
      userId: s.handshake.query.User,
    }));
  }
}

export async function socketUserMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  const { user } = socket.handshake.query;

  if (!user || typeof user !== "string") {
    return next(new Error("Authentication required: missing user query parameter"));
  }

  socket.handshake.query.User = user;
  next();
}
