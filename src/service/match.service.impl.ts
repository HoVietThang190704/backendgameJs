import { Types } from "mongoose";
import { IMatchService } from "./match.service.interface";
import { IMatchRepository } from "../repository/match.repository.interface";
import { IUserService } from "./user.service.interface";
import { MatchDocument, MatchInput } from "../model/match";

const DEFAULT_GAME_BOARD = { rows: 10, cols: 10, bombs: 20 };
const DEFAULT_TURN_TIME_LIMIT = 30;

type BombCoordinate = {
  x: number;
  y: number;
};

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
    return this.matchRepository.findActiveMatchByUserId(userId);
  }

  async getMatchById(matchId: string): Promise<MatchDocument | null> {
    return this.matchRepository.findMatchById(matchId);
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

    return this.matchRepository.updateMatch(matchId, { players });
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

  async leaveMatch(matchId: string, userId: string): Promise<MatchDocument | null> {
  async startMatch(
    matchId: string,
    requestedByUserId?: string,
    enforceHostCheck: boolean = false,
  ): Promise<MatchDocument | null> {
    const match = await this.getMatchById(matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    const userIndex = match.players.findIndex((p) => p.userId.toString() === userId);
    if (userIndex === -1) {
      throw new Error("User is not part of this match");
    }

    // Remove the leaving user from match players
    const remainingPlayers = match.players.filter((p) => p.userId.toString() !== userId);

    // Reset user currentMatchId outside this method (in controller) via userService

    if (remainingPlayers.length === 0) {
      // No players remain, delete the match
      await this.matchRepository.deleteMatch(matchId);
      return null;
    }

    const updatedMatchData: any = {
      players: remainingPlayers,
      status: remainingPlayers.length === 1 && match.status === "playing" ? "waiting" : match.status,
    };

    const hostLeft = match.hostId?.toString() === userId;
    if (hostLeft) {
      updatedMatchData.hostId = remainingPlayers[0].userId;
    }

    if (match.currentTurn?.toString() === userId) {
      updatedMatchData.currentTurn = remainingPlayers[0].userId;
      updatedMatchData.turnStartTime = new Date();
    }

    const updatedMatch = await this.matchRepository.updateMatch(matchId, updatedMatchData);

    return updatedMatch;
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

    const player1Bombs = generateBombCoordinates(gameBoard.rows, gameBoard.cols, gameBoard.bombs);
    const player2Bombs = generateBombCoordinates(gameBoard.rows, gameBoard.cols, gameBoard.bombs);
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

  async addMove(
    matchId: string,
    move: { playerId: string; x: number; y: number; action: string; result: string },
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
      createdAt: new Date(),
    };

    const moves = match.moves ? [...match.moves, newMove] : [newMove];
    return this.matchRepository.updateMatch(matchId, { moves });
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
