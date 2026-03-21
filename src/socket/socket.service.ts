import { Server } from "socket.io";

export class SocketService {
  private static instance: SocketService;
  private io?: Server;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  setIo(io: Server): void {
    this.io = io;
  }

  getIo(): Server | undefined {
    return this.io;
  }

  emitToRoom(room: string, event: string, payload: unknown): void {
    if (!this.io) {
      console.warn("Socket.io not initialized in SocketService");
      return;
    }
    this.io.to(room).emit(event, payload);
  }
}

export default SocketService;
