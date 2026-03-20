import { JwtService } from "../service/jwt.service";
import { Socket } from "socket.io";
import { SocketAuth } from "./types";

type SocketNext = (err?: any) => void;

export function createSocketAuthMiddleware(jwtService: JwtService) {
  return async (socket: Socket, next: SocketNext) => {
    const auth = socket.handshake.auth as unknown as SocketAuth;
    const authToken = auth?.token;

    const authorizationHeader = socket.handshake.headers["authorization"];
    const headerToken = typeof authorizationHeader === "string"
      ? authorizationHeader.split(" ")[1]
      : undefined;

    const queryToken =
      typeof socket.handshake.query?.token === "string"
        ? socket.handshake.query.token
        : undefined;

    const token = authToken ?? headerToken ?? queryToken;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    const payload = await jwtService.verifyAccessToken(token);
    if (!payload || !payload.userId) {
      return next(new Error("Invalid access token"));
    }

    socket.data.userId = payload.userId;
    socket.data.email = payload.email;

    next();
  };
}
