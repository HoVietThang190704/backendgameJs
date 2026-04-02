import { Types } from "mongoose";
import { IMatchService } from "./match.service.interface";
import { IMatchRepository } from "../repository/match.repository.interface";
import { IUserService } from "./user.service.interface";
import { MatchDocument, MatchInput } from "../model/match";

const DEFAULT_GAME_BOARD = { rows: 10, cols: 10, bombs: 20 };
const DEFAULT_TURN_TIME_LIMIT = 30;
const WIN_ELO_DELTA = 20;
const LOSE_ELO_DELTA = -10;

type BombCoordinate = {
  x: number;
  y: number;
};

function normalizeBombCoordinates(
  bombs: Array<{ x: number; y: number }> | undefined,
  rows: number,
  cols: number,
): BombCoordinate[] {
  if (!Array.isArray(bombs)) {
    return [];
  }

  const normalized = bombs
    .filter((bomb) => Number.isFinite(bomb.x) && Number.isFinite(bomb.y))
    .map((bomb) => ({ x: Number(bomb.x), y: Number(bomb.y) }))
    .filter((bomb) => bomb.x >= 0 && bomb.x < rows && bomb.y >= 0 && bomb.y < cols);

  const unique = new Map<string, BombCoordinate>();
  normalized.forEach((bomb) => {
    unique.set(`${bomb.x}:${bomb.y}`, bomb);
  });

  return Array.from(unique.values());
}

function generatePinCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateBombCoordinates(rows: number, cols: number, bombs: number): BombCoordinate[] {
  const totalCells = rows * cols;
  const bombCount = Math.min(Math.max(0, bombs), totalCells);
  const coordinateSet = new Set<string>();

  while (coordinateSet.size < bombCount) {
    const x = Math.floor(Math.random() * rows);
    const y = Math.floor(Math.random() * cols);
    coordinateSet.add(`${x}:${y}`);
  }

  return Array.from(coordinateSet).map((value) => {
    const [x, y] = value.split(":").map(Number);
    return { x, y };
  });
}

export class MatchService implements IMatchService {
  private readonly matchRepository: IMatchRepository;
  private readonly userService: IUserService;

  constructor(matchRepository: IMatchRepository, userService: IUserService) {
    this.matchRepository = matchRepository;
    this.userService = userService;
  }

  async getActiveMatchForUser(userId: string): Promise<MatchDocument | null> {
    const activeMatch = await this.matchRepository.findActiveMatchByUserId(userId);
    if (activeMatch) {
      return activeMatch;
    }

    const user = await this.userService.getUserById(userId, "currentMatchId");
    if (user?.currentMatchId) {
      await this.userService.setCurrentMatch(userId, null);
    }

    return null;
  }

  async getMatchById(matchId: string): Promise<MatchDocument | null> {
    return this.matchRepository.findMatchById(matchId);
  }

  async getMatchHistory(userId: string, page: number, limit: number): Promise<MatchDocument[]> {
    return this.matchRepository.findFinishedMatchesByUserId(userId, page, limit);
  }

  async addPlayerToMatch(matchId: string, userId: string): Promise<MatchDocument | null> {
    const match = await this.getMatchById(matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    const alreadyInMatch = match.players.some(p => p.userId.toString() === userId);
    if (alreadyInMatch) {
      return match;
    }

    if (match.players.length >= 2) {
      throw new Error("Match is full");
    }

    const players = [
      ...match.players,
      {
        userId: new Types.ObjectId(userId),
        isReady: false,
        health: 3,
      },
    ];

    const updatedMatch = await this.matchRepository.updateMatch(matchId, { players });
    if (updatedMatch?._id) {
      await this.userService.setCurrentMatch(userId, updatedMatch._id.toString());
    }

    return updatedMatch;
  }

  async setPlayerReady(matchId: string, userId: string, ready: boolean): Promise<MatchDocument | null> {
    const match = await this.getMatchById(matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    const isPlayerInMatch = match.players.some((p) => p.userId.toString() === userId);
    if (!isPlayerInMatch) {
      throw new Error("Player is not in this match");
    }

    const players = match.players.map((p) => {
      const basePlayer = typeof (p as { toObject?: () => unknown }).toObject === "function"
        ? (p as { toObject: () => { userId: Types.ObjectId; isReady: boolean; health: number; _id?: Types.ObjectId } }).toObject()
        : {
          userId: p.userId,
          isReady: p.isReady,
          health: p.health,
        };

      return {
        ...basePlayer,
        isReady: p.userId.toString() === userId ? ready : p.isReady,
      };
    });

    return this.matchRepository.updateMatch(matchId, { players });
  }

  async startMatch(
    matchId: string,
    requestedByUserId?: string,
    enforceHostCheck: boolean = false,
  ): Promise<MatchDocument | null> {
    const match = await this.getMatchById(matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.status !== "waiting") {
      throw new Error("Match is not in waiting state");
    }

    const bothReady = match.players.length >= 2 && match.players.every((player) => player.isReady);
    if (!bothReady) {
      throw new Error("Both players must be ready");
    }

    const hostId = match.hostId?.toString();
    if (enforceHostCheck && requestedByUserId && hostId !== requestedByUserId) {
      throw new Error("Only host can start the match");
    }

    const gameBoard = match.gameBoard;
    if (!gameBoard) {
      throw new Error("Match game board is not configured");
    }

    const existingPlayer1Bombs = normalizeBombCoordinates(match.player1Bombs, gameBoard.rows, gameBoard.cols);
    const existingPlayer2Bombs = normalizeBombCoordinates(match.player2Bombs, gameBoard.rows, gameBoard.cols);
    const player1Bombs = existingPlayer1Bombs.length > 0
      ? existingPlayer1Bombs
      : generateBombCoordinates(gameBoard.rows, gameBoard.cols, gameBoard.bombs);
    const player2Bombs = existingPlayer2Bombs.length > 0
      ? existingPlayer2Bombs
      : generateBombCoordinates(gameBoard.rows, gameBoard.cols, gameBoard.bombs);
    const firstTurn = hostId || match.players[0]?.userId?.toString();

    if (!firstTurn) {
      throw new Error("Unable to determine first turn");
    }

    return this.matchRepository.updateMatch(matchId, {
      status: "playing",
      startedAt: new Date(),
      player1Bombs,
      player2Bombs,
      currentTurn: new Types.ObjectId(firstTurn),
    });
  }

  async setCurrentTurn(matchId: string, userId: string): Promise<MatchDocument | null> {
    return this.matchRepository.updateMatch(matchId, { currentTurn: new Types.ObjectId(userId), turnStartTime: new Date() });
  }

  async setMatchStatus(matchId: string, status: string): Promise<MatchDocument | null> {
    return this.matchRepository.updateMatch(matchId, { status });
  }

  async setPlayerBombs(
    matchId: string,
    userId: string,
    bombs: Array<{ x: number; y: number }>,
  ): Promise<MatchDocument | null> {
    const match = await this.getMatchById(matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    const playerIndex = match.players.findIndex((player) => player.userId.toString() === userId);
    if (playerIndex < 0) {
      throw new Error("Player is not in this match");
    }

    const gameBoard = match.gameBoard;
    if (!gameBoard) {
      throw new Error("Match game board is not configured");
    }

    const normalizedBombs = normalizeBombCoordinates(bombs, gameBoard.rows, gameBoard.cols);
    const limitedBombs = normalizedBombs.slice(0, gameBoard.bombs);

    if (playerIndex === 0) {
      return this.matchRepository.updateMatch(matchId, { player1Bombs: limitedBombs });
    }

    return this.matchRepository.updateMatch(matchId, { player2Bombs: limitedBombs });
  }

  async addMove(
    matchId: string,
    move: { playerId: string; x: number; y: number; action: string; result: string; revealedCells?: Array<{ x: number; y: number; adjacentMines: number }> },
  ): Promise<MatchDocument | null> {
    const match = await this.getMatchById(matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    const newMove = {
      playerId: new Types.ObjectId(move.playerId),
      x: move.x,
      y: move.y,
      action: move.action,
      result: move.result,
      revealedCells: move.revealedCells,
      createdAt: new Date(),
    };

    const moves = match.moves ? [...match.moves, newMove] : [newMove];
    return this.matchRepository.updateMatch(matchId, { moves });
  }

  async clearCurrentMatchForPlayers(matchId: string): Promise<void> {
    const match = await this.getMatchById(matchId);
    if (!match) {
      return;
    }

    await Promise.all(
      match.players.map((player) => this.userService.setCurrentMatch(player.userId.toString(), null)),
    );
  }

  async finalizeMatch(matchId: string, winnerId: string, loserId: string): Promise<{ winnerEloDelta: number; loserEloDelta: number }> {
    const match = await this.getMatchById(matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.status !== "finished") {
      await this.matchRepository.updateMatch(matchId, {
        status: "finished",
        winnerId: new Types.ObjectId(winnerId),
        finishedAt: new Date(),
        currentTurn: undefined,
        turnStartTime: undefined,
      });

      await Promise.all([
        this.userService.applyGameResult(winnerId, WIN_ELO_DELTA, true),
        this.userService.applyGameResult(loserId, LOSE_ELO_DELTA, false),
      ]);
    }

    await this.clearCurrentMatchForPlayers(matchId);

    return {
      winnerEloDelta: WIN_ELO_DELTA,
      loserEloDelta: LOSE_ELO_DELTA,
    };
  }

  async leaveMatch(matchId: string, userId: string): Promise<MatchDocument | null> {
    const match = await this.getMatchById(matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    const player = match.players.find((p) => p.userId.toString() === userId);
    if (!player) {
      throw new Error("Player is not in this match");
    }

    const remainingPlayers = match.players.filter((p) => p.userId.toString() !== userId);

    // Reset user's current match
    await this.userService.setCurrentMatch(userId, null);

    // If no player remains, delete match
    if (remainingPlayers.length === 0) {
      await this.userService.setCurrentMatch(userId, null);
      await this.matchRepository.deleteMatch(matchId);
      return null;
    }

    const isHost = match.hostId?.toString() === userId;

    // If host leaves, assign host to remaining player
    const updateData: Partial<MatchInput> = {
      players: remainingPlayers,
    };

    if (isHost) {
      updateData.hostId = remainingPlayers[0].userId;
    }

    // If match is active and a player left, mark it finished to avoid ghost match
    if (match.status === "playing") {
      updateData.status = "finished";
      updateData.currentTurn = undefined;
      updateData.turnStartTime = undefined;
    }

    const updatedMatch = await this.matchRepository.updateMatch(matchId, updateData);

    if (match.status === "playing") {
      await this.clearCurrentMatchForPlayers(matchId);
    }

    return updatedMatch;
  }

  async updateMatch(matchId: string, update: Partial<import("../model/match").MatchInput>): Promise<MatchDocument | null> {
    return this.matchRepository.updateMatch(matchId, update);
  }

  async createPrivateMatch(hostId: string): Promise<MatchDocument> {
    const existingMatch = await this.matchRepository.findActiveMatchByUserId(hostId);
    if (existingMatch) {
      throw new Error("User is already in an active match");
    }

    // Ensure PIN is unique among open rooms
    let pinCode: string | null = null;
    for (let i = 0; i < 10; i++) {
      const candidate = generatePinCode();
      const existing = await this.matchRepository.findMatchByPinCode(candidate);
      if (!existing) {
        pinCode = candidate;
        break;
      }
    }

    if (!pinCode) {
      throw new Error("Unable to generate a unique room PIN");
    }

    const hostObjectId = new Types.ObjectId(hostId);

    const matchData: MatchInput = {
      matchType: "private",
      status: "waiting",
      pinCode,
      hostId: hostObjectId,
      players: [
        {
          userId: hostObjectId,
          isReady: true,
          health: 3,
        },
      ],
      gameBoard: DEFAULT_GAME_BOARD,
      turnTimeLimit: DEFAULT_TURN_TIME_LIMIT,
    };

    const match = await this.matchRepository.createMatch(matchData);

    // Update user's current match
    await this.userService.setCurrentMatch(hostId, match._id.toString());

    return match;
  }
}
