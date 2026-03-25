import { Server, Socket } from "socket.io";
import { IMatchService } from "../service/match.service.interface";
import { MatchDocument } from "../model/match";
import { socketUsers, disconnectTimers, matchTimers, DEFAULT_TURN_TIME_LIMIT } from "./state";
import { MatchPlayer } from "./types";

export function registerSocketHandlers(io: Server, socket: Socket, matchService: IMatchService) {
  const userId = socket.data.userId as string;
  const email = socket.data.email as string | undefined;

  socketUsers.set(socket.id, { userId, email });

  socket.on("join_room", (payload: { matchId: string }) => handleJoinRoom(io, socket, matchService, payload));
  socket.on("toggle_ready", (payload: { matchId: string; ready: boolean }) => handleToggleReady(io, socket, matchService, payload));
  socket.on("send_move", (payload: { matchId: string; x: number; y: number; action: string }) => handleSendMove(io, socket, matchService, payload));
  socket.on("disconnect", () => handleDisconnect(io, socket, matchService));
}

async function handleJoinRoom(
  io: Server,
  socket: Socket,
  matchService: IMatchService,
  payload: { matchId: string },
) {
  const userId = socket.data.userId as string;
  const email = socket.data.email as string | undefined;

  if (!payload?.matchId) {
    socket.emit("error", { message: "matchId is required" });
    return;
  }

  const matchId = payload.matchId;

  const reconnectKey = `${matchId}:${userId}`;
  const pendingTimer = disconnectTimers.get(reconnectKey);
  if (pendingTimer) {
    clearTimeout(pendingTimer);
    disconnectTimers.delete(reconnectKey);
  }

  socket.join(matchId);
  socketUsers.set(socket.id, { userId, email, matchId });

  try {
    const match = await matchService.getMatchById(matchId);
    if (!match) {
      socket.emit("error", { message: "Match not found" });
      return;
    }

    await matchService.addPlayerToMatch(matchId, userId);

    io.to(matchId).emit("player_joined", {
      player: { userId },
    });

    const updatedMatch = await matchService.getMatchById(matchId);
    if (!updatedMatch) {
      socket.emit("error", { message: "Match not found" });
      return;
    }

    const readyStates = updatedMatch.players.map((p) => ({
      userId: p.userId.toString(),
      isReady: p.isReady,
    }));

    io.to(matchId).emit("ready_update", { players: readyStates });

    const bothReady = updatedMatch.players.length >= 2 && updatedMatch.players.every((p) => p.isReady);
    if (bothReady && updatedMatch.status === "waiting") {
      await startGame(matchId, updatedMatch, io, matchService);
    }
  } catch (error) {
    socket.emit("error", { message: (error as Error).message });
  }
}

async function handleToggleReady(
  io: Server,
  socket: Socket,
  matchService: IMatchService,
  payload: { matchId: string; ready: boolean },
) {
  const userId = socket.data.userId as string;

  const matchId = payload?.matchId;
  const ready = Boolean(payload?.ready);
  if (!matchId) {
    socket.emit("error", { message: "matchId is required" });
    return;
  }

  try {
    const updatedMatch = await matchService.setPlayerReady(matchId, userId, ready);
    if (!updatedMatch) {
      socket.emit("error", { message: "Match not found" });
      return;
    }

    io.to(matchId).emit("toggle_ready", {
      userId,
      ready,
    });

    const bothReady = updatedMatch.players.length >= 2 && updatedMatch.players.every((p) => p.isReady);
    if (bothReady && updatedMatch.status === "waiting") {
      await startGame(matchId, updatedMatch, io, matchService);
    }
  } catch (error) {
    socket.emit("error", { message: (error as Error).message });
  }
}

async function handleSendMove(
  io: Server,
  socket: Socket,
  matchService: IMatchService,
  payload: { matchId: string; x: number; y: number; action: string },
) {
  const userId = socket.data.userId as string;

  const matchId = payload?.matchId;
  const x = Number(payload?.x);
  const y = Number(payload?.y);
  const action = payload?.action || "open";

  if (!matchId) {
    socket.emit("error", { message: "matchId is required" });
    return;
  }

  try {
    const match = await matchService.getMatchById(matchId);
    if (!match) {
      socket.emit("error", { message: "Match not found" });
      return;
    }

    const currentTurn = match.currentTurn?.toString();
    if (!currentTurn || currentTurn !== userId) {
      socket.emit("error", { message: "Not your turn" });
      return;
    }

    const hitBomb = Math.random() < 0.15;
    const result = hitBomb ? "bomb" : "safe";

    let updatedPlayers: MatchPlayer[] = match.players.map((p) => ({
      userId: p.userId,
      isReady: p.isReady,
      health: p.health,
    }));

    if (hitBomb) {
      updatedPlayers = updatedPlayers.map((p) => {
        if (p.userId.toString() === userId) {
          return { ...p, health: Math.max(0, p.health - 1) };
        }
        return p;
      });

      await matchService.updateMatch(matchId, { players: updatedPlayers });
    }

    await matchService.addMove(matchId, {
      playerId: userId,
      x,
      y,
      action,
      result,
    });

    io.to(matchId).emit("move_result", {
      userId,
      x,
      y,
      action,
      result,
      health: updatedPlayers.find((p) => p.userId.toString() === userId)?.health,
    });

    const player = updatedPlayers.find((p) => p.userId.toString() === userId);
    if (player?.health === 0) {
      await endMatch(matchId, userId, io, matchService);
      return;
    }

    await switchTurn(matchId, io, matchService);
  } catch (error) {
    socket.emit("error", { message: (error as Error).message });
  }
}

async function handleDisconnect(io: Server, socket: Socket, matchService: IMatchService) {
  const userId = socket.data.userId as string;
  const data = socketUsers.get(socket.id);
  if (!data) return;

  const { matchId } = data;
  socketUsers.delete(socket.id);

  if (!matchId) return;

  const key = `${matchId}:${userId}`;
  if (disconnectTimers.has(key)) {
    return;
  }

  const timer = setTimeout(async () => {
    disconnectTimers.delete(key);

    const match = await matchService.getMatchById(matchId);
    if (!match) return;

    const opponent = match.players.find((p) => p.userId.toString() !== userId);
    const opponentId = opponent?.userId.toString();

    io.to(matchId).emit("player_left", { userId });

    if (opponentId) {
      await endMatch(matchId, userId, io, matchService);
    }
  }, 30_000);

  disconnectTimers.set(key, timer);
}

export async function startGame(
  matchId: string,
  match: MatchDocument,
  io: Server,
  matchService: IMatchService,
) {
  try {
    const startedMatch = await matchService.startMatch(matchId, match.hostId?.toString(), false);
    if (startedMatch) {
      io.to(matchId).emit("start_game", {
        matchId,
        currentTurn: startedMatch.currentTurn?.toString() ?? null,
        turnTimeLimit: startedMatch.turnTimeLimit || DEFAULT_TURN_TIME_LIMIT,
      });

      startMatchTimer(matchId, io, matchService);
      return;
    }
  } catch {
    // fallback to existing behavior below
  }

  const currentTurn = match.hostId?.toString() || match.players[0]?.userId?.toString();
  await matchService.setMatchStatus(matchId, "playing");
  await matchService.setCurrentTurn(matchId, currentTurn);

  io.to(matchId).emit("start_game", {
    matchId,
    currentTurn,
    turnTimeLimit: DEFAULT_TURN_TIME_LIMIT,
  });

  startMatchTimer(matchId, io, matchService);
}

export function startMatchTimer(matchId: string, io: Server, matchService: IMatchService) {
  stopMatchTimer(matchId);

  const timer = {
    remainingSeconds: DEFAULT_TURN_TIME_LIMIT,
    interval: setInterval(async () => {
      timer.remainingSeconds -= 1;
      io.to(matchId).emit("timer_tick", { remaining: timer.remainingSeconds });

      if (timer.remainingSeconds <= 0) {
        timer.remainingSeconds = DEFAULT_TURN_TIME_LIMIT;
        await switchTurn(matchId, io, matchService);
      }
    }, 1000),
  };

  matchTimers.set(matchId, timer);
}

function stopMatchTimer(matchId: string) {
  const timer = matchTimers.get(matchId);
  if (timer) {
    clearInterval(timer.interval);
    matchTimers.delete(matchId);
  }
}

async function switchTurn(matchId: string, io: Server, matchService: IMatchService) {
  const match = await matchService.getMatchById(matchId);
  if (!match) return;

  const currentTurn = match.currentTurn?.toString();
  const otherPlayer = match.players.find((p) => p.userId.toString() !== currentTurn);
  const nextTurn = otherPlayer?.userId.toString();

  if (!nextTurn) {
    return;
  }

  await matchService.setCurrentTurn(matchId, nextTurn);
  io.to(matchId).emit("turn_changed", { nextTurn });
}

async function endMatch(matchId: string, loserId: string, io: Server, matchService: IMatchService) {
  const match = await matchService.getMatchById(matchId);
  if (!match) return;

  const winner = match.players.find((p) => p.userId.toString() !== loserId);
  const winnerId = winner?.userId.toString();

  await matchService.setMatchStatus(matchId, "finished");
  stopMatchTimer(matchId);

  io.to(matchId).emit("game_over", {
    winnerId: winnerId ?? null,
    loserId,
  });
}
