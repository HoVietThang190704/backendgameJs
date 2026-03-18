import { Types } from "mongoose";
import { IMatchService } from "./match.service.interface";
import { IMatchRepository } from "../repository/match.repository.interface";
import { IUserService } from "./user.service.interface";
import { MatchDocument, MatchInput } from "../model/match";

const DEFAULT_GAME_BOARD = { rows: 10, cols: 10, bombs: 20 };
const DEFAULT_TURN_TIME_LIMIT = 30;

function generatePinCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
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
