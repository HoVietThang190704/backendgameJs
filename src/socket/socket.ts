import http from "http";
import { Server } from "socket.io";
import Container from "../lib/container/container";
import { JwtService } from "../service/jwt.service";
import { IMatchService } from "../service/match.service.interface";
import { IGameLogicService } from "../service/game-logic.service.interface";
import { IMatchStateService } from "../service/match-state.service.interface";
import { createSocketAuthMiddleware } from "./auth";
import { registerSocketHandlers } from "./handlers";
import SocketService from "./socket.service";

export function setupSocketServer(server: http.Server, allowedOrigins: string[]) {
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Initialize SocketService
  SocketService.getInstance().setIo(io);

  const container = Container.getInstance();
  const matchService = container.get<IMatchService>("MatchService");
  const gameLogicService = container.get<IGameLogicService>("GameLogicService");
  const matchStateService = container.get<IMatchStateService>("MatchStateService");
  const jwtService = JwtService.getInstance();

  io.use(createSocketAuthMiddleware(jwtService));

  io.on("connection", (socket) => {
    registerSocketHandlers(io, socket, matchService, gameLogicService, matchStateService);
  });
}
