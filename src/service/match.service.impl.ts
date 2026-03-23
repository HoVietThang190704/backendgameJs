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

function generateBombCoordinates(rows: number, cols: number, bombCount: number): BombCoordinate[] {
  const totalCells = rows * cols;
  const safeBombCount = Math.min(Math.max(bombCount, 0), totalCells);

  const selectedIndices = new Set<number>();
  while (selectedIndices.size < safeBombCount) {
    selectedIndices.add(Math.floor(Math.random() * totalCells));
  }

  return Array.from(selectedIndices).map((cellIndex) => ({
    x: cellIndex % cols,
    y: Math.floor(cellIndex / cols),
  }));
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

    let isParticipant = false;
    const players = match.players.map((player) => {
      const playerUserId = player.userId.toString();
      if (playerUserId === userId) {
        isParticipant = true;
      }

      return {
        userId: new Types.ObjectId(playerUserId),
        isReady: playerUserId === userId ? ready : player.isReady,
        health: player.health,
      };
    });

    if (!isParticipant) {
      throw new Error("Player is not in this match");
    }

    return this.matchRepository.updateMatch(matchId, { players });
  }

  async startMatch(matchId: string, requesterId: string): Promise<MatchDocument | null> {
    const match = await this.getMatchById(matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.status !== "waiting") {
      throw new Error("Match is not in waiting state");
    }

    const hostId = match.hostId.toString();
    if (hostId !== requesterId) {
      throw new Error("Only room host can start match");
    }

    if (match.players.length < 2) {
      throw new Error("Match must have 2 players to start");
    }

    const bothReady = match.players.every((player) => player.isReady);
    if (!bothReady) {
      throw new Error("All players must be ready before starting");
    }

    const gameBoard = match.gameBoard;
    if (!gameBoard) {
      throw new Error("Match gameBoard is missing");
    }

    const rows = gameBoard.rows;
    const cols = gameBoard.cols;
    const bombs = gameBoard.bombs;

    const player1Bombs = generateBombCoordinates(rows, cols, bombs);
    const player2Bombs = generateBombCoordinates(rows, cols, bombs);

    return this.matchRepository.updateMatch(matchId, {
      status: "playing",
      startedAt: new Date(),
      currentTurn: match.hostId,
      player1Bombs,
      player2Bombs,
    });
  }

  async setCurrentTurn(matchId: string, userId: string): Promise<MatchDocument | null> {
    return this.matchRepository.updateMatch(matchId, { currentTurn: new Types.ObjectId(userId) });
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
      return existingMatch;
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
