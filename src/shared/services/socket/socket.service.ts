import { Server, Socket } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import RedisService from "../redis.service";
import { WS_EVENT } from "../../config/app.constants";
import { RecycleService } from "../../../features/recycle/recycle.services";


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
    this.io.on(
      WS_EVENT.CONNECTION,
      async (socket: Socket<DefaultEventsMap>) => {
        console.log("New client connected:", socket.id);
        const { User } = socket.handshake.query;
        const userId = User as string;

        // Clean up any previous socket for this user
        const user_previous_socket = await RedisService.instance.getUserSocket(
          userId
        );
        if (user_previous_socket) {
          await RedisService.instance.delete(userId);
        }

        // Store new socket mapping
        await RedisService.instance.set(userId, socket.id);

        this.setupEventHandlers(socket);
        socket.emit(WS_EVENT.CONNECTION, { message: "Connected to socket" });

        // Handle disconnection
        socket.on("disconnect", async () => {
          console.log(`Socket ${socket.id} disconnected`);
          await RedisService.instance.delete(userId);
        });

        // Handle chat join
        socket.on(WS_EVENT.CHAT_JOIN, async (data: any) => {
          try {
            console.log(`User ${userId} joining chat ${data.chatID}`);

            // Join the room
            await socket.join(data.chatID);
            console.log(`Socket ${socket.id} joined room ${data.chatID}`);

            // Get messages for the chat
            const messages = await new RecycleService().getRecycleChatMessages({
              chatID: data.chatID,
            });

            console.log(
              `Sending ${messages?.length || 0} messages to user in chat ${
                data.chatID
              }`
            );

            // Send messages directly to this socket (not to the room)
            socket.emit(WS_EVENT.CHAT_MESSAGE, {
              messages,
              chatID: data.chatID,
            });

            socket.emit(WS_EVENT.ROOM_JOINED, {
              room: data.chatID,
              message: `Successfully joined room ${data.chatID}`,
            });

            // Optionally notify other users in the room that someone joined
            socket.to(data.chatID).emit(WS_EVENT.USER_JOINED_CHAT, {
              userId,
              chatID: data.chatID,
              message: `User ${userId} joined the chat`,
            });
          } catch (error) {
            console.error("Error joining chat:", error);
            socket.emit("error", { message: "Failed to join chat" });
          }
        });

        // Handle sending messages to a chat
        socket.on(WS_EVENT.SEND_CHAT_MESSAGE, async (data: any) => {
          try {
            console.log(
              `User ${userId} sending message to chat ${data.chatID}`
            );

            // Save the message (if needed)
            // const savedMessage = await new RecycleService().saveMessage(data);
            // Emit to all users in the chat room (including sender)

            this.io.to(data.chatID).emit(WS_EVENT.CHAT_MESSAGE, {
              message: data.message,
              userID: userId,
              senderID: userId,
              chatID: data.chatID,
              timestamp: new Date(),
            });

            new RecycleService().sendRecycleChatMessage({
              message: data.message,
              userID: userId,
              chatID: data.chatID,
            });
          } catch (error) {
            console.error("Error sending message:", error);
            socket.emit("error", { message: "Failed to send message" });
          }
        });
      }
    );
  }

  public setupEventHandlers(socket: Socket) {
    socket.on(WS_EVENT.JOIN, async (room) => {
      console.log("User joining room:", room);
      try {
        await socket.join(room);
        console.log(`Socket ${socket.id} successfully joined room ${room}`);

        // Notify others in the room
        socket.to(room).emit(WS_EVENT.USER_JOINED_ROOM, {
          socketId: socket.id,
          room,
        });
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: `Failed to join room ${room}` });
      }
    });
  }

  async emitEventToClient(userId: string, event: string, data: any) {
    const socketId = await RedisService.instance.getUserSocket(userId);
    if (socketId) {
      const targetSocket = this.io.sockets.sockets.get(socketId);
      if (targetSocket) {
        targetSocket.emit(event, data);
        console.log(`Emitted ${event} to user ${userId} (socket: ${socketId})`);
      } else {
        console.log(`Socket ${socketId} not found for user ${userId}`);
      }
    } else {
      console.log(`No socket found for user ${userId}`);
    }
  }

  emitEventToAll(event: string, data: any) {
    this.io.emit(event, data);
    console.log(`Emitted ${event} to all connected clients`);
  }

  emitToGroup(group: string, event: string, data: any) {
    this.io.to(group).emit(event, data);
    console.log(`Emitted ${event} to group ${group}`);
  }

  // Helper method to check room membership
  async getRoomMembers(room: string) {
    const sockets = await this.io.in(room).fetchSockets();
    return sockets.map((socket) => ({
      socketId: socket.id,
      userId: socket.handshake.query.User,
    }));
  }
}

export async function socketUserMiddleware(
  socket: Socket,
  next: (err?: Error) => void
) {
  try {
    let { user } = socket.handshake.query;
    user = user as string;

    if (!user) {
      throw new Error("User ID must be provided");
    }

  

    socket.handshake.query.User = user;
    console.log(`User ${user} authenticated for socket ${socket.id}`);
    next();
  } catch (error) {
    console.error("Socket authentication error:", error);
    if (error instanceof Error) {
      next(error);
    } else {
      next(new Error("Authentication failed"));
    }
  }
}
