import { IUserService } from "./user.service.interface";
import { MatchDocument } from "../model/match";
import { matchTimers } from "../socket/state";
import { IMatchStateService } from "./match-state.service.interface";

export type PlayerState = {
  userId: string;
  displayName: string;
  avatar: string;
  rank: number;
  isReady: boolean;
  playerNumber: number;
  health: number;
  isHost: boolean;
};

export type BoardState = {
  player1Revealed: Array<{ x: number; y: number }>;
  player2Revealed: Array<{ x: number; y: number }>;
  player1Flags: Array<{ x: number; y: number }>;
  player2Flags: Array<{ x: number; y: number }>;
};

export type MatchStatePayload = {
  matchId: string | null;
  pinCode: string;
  status: string;
  hostId: string;
  gameBoard: {
    rows: number;
    cols: number;
    bombs: number;
  };
  players: PlayerState[];
  boardState: BoardState;
  currentTurn: string | null;
  turnStartTime: Date | null;
  turnTimeLimit: number;
  remainingSeconds: number | null;
};

export class MatchStateService implements IMatchStateService {
  private readonly userService: IUserService;

  constructor(userService: IUserService) {
    this.userService = userService;
  }

  async buildMatchStatePayload(match: MatchDocument): Promise<MatchStatePayload> {
    const playerState: PlayerState[] = await Promise.all(
      match.players.map(async (p, index) => {
        const user = await this.userService.getUserById(p.userId.toString());
        const displayName = user?.name || user?.username || "Unknown";
        return {
          userId: p.userId.toString(),
          displayName,
          avatar: user?.avatar_url || "",
          rank: user?.rank ?? 0,
          isReady: p.isReady,
          playerNumber: index + 1,
          health: p.health,
          isHost: p.userId.toString() === match.hostId?.toString(),
        };
      }),
    );

    const player1Id = match.players[0]?.userId?.toString();
    const player2Id = match.players[1]?.userId?.toString();

    const player1Revealed: Array<{ x: number; y: number }> = [];
    const player2Revealed: Array<{ x: number; y: number }> = [];
    const player1Flags: Array<{ x: number; y: number }> = [];
    const player2Flags: Array<{ x: number; y: number }> = [];

    (match.moves || []).forEach((move) => {
      if (move.action === "open") {
        const revealedCells = Array.isArray(move.revealedCells) && move.revealedCells.length > 0
          ? move.revealedCells
          : [{ x: move.x, y: move.y, adjacentMines: move.result === "bomb" ? -1 : 0 }];

        revealedCells.forEach((cell) => {
          const coord = { x: cell.x, y: cell.y };
          if (move.playerId.toString() === player1Id) {
            player1Revealed.push(coord);
          } else if (move.playerId.toString() === player2Id) {
            player2Revealed.push(coord);
          }
        });
      } else if (move.action === "flag") {
        const coord = { x: move.x, y: move.y };
        if (move.playerId.toString() === player1Id) {
          player1Flags.push(coord);
        } else if (move.playerId.toString() === player2Id) {
          player2Flags.push(coord);
        }
      }
    });

    const turnTimeLimit = match.turnTimeLimit ?? 30;
    let turnStartTime = match.turnStartTime ?? null;
    let remainingSeconds: number | null = null;

    const timer = matchTimers.get(match._id?.toString() ?? "");
    if (timer) {
      remainingSeconds = timer.remainingSeconds;
      turnStartTime = new Date(Date.now() - (turnTimeLimit - remainingSeconds) * 1000);
    }

    return {
      matchId: match._id?.toString() ?? null,
      pinCode: match.pinCode,
      status: match.status,
      hostId: match.hostId?.toString() ?? "",
      gameBoard: {
        rows: match.gameBoard?.rows ?? 0,
        cols: match.gameBoard?.cols ?? 0,
        bombs: match.gameBoard?.bombs ?? 0,
      },
      players: playerState,
      boardState: {
        player1Revealed,
        player2Revealed,
        player1Flags,
        player2Flags,
      },
      currentTurn: match.currentTurn?.toString() ?? null,
      turnStartTime,
      turnTimeLimit,
      remainingSeconds,
    };
  }
}
