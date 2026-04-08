import { IWaitingQueueService } from "./waitingQueue.service.interface";
import { IWaitingQueueRepository } from "../repository/waitingQueue.repository.interface";
import { IUserService } from "./user.service.interface";
import { IMatchService } from "./match.service.interface";
import { WaitingQueueDocument, WaitingQueueInput } from "../model/waitingQueue";
import { Types } from "mongoose";

export class WaitingQueueService implements IWaitingQueueService {
  private readonly waitingQueueRepository: IWaitingQueueRepository;
  private readonly userService: IUserService;
  private readonly matchService: IMatchService;

  constructor(waitingQueueRepository: IWaitingQueueRepository, userService: IUserService, matchService: IMatchService) {
    this.waitingQueueRepository = waitingQueueRepository;
    this.userService = userService;
    this.matchService = matchService;
  }

  async addToQueue(userId: string, boardSize: string): Promise<WaitingQueueDocument> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.currentMatchId) {
      const activeMatch = await this.matchService.getActiveMatchForUser(userId);
      if (activeMatch) {
        throw new Error("User is already in an active match");
      }

      await this.userService.setCurrentMatch(userId, null);
    }

    const existing = await this.waitingQueueRepository.findByUserIdAndStatus(userId, "waiting");
    if (existing) {
      return existing;
    }

    const normalizedBoardSize = boardSize || "medium";
    const opponentQueue = await this.waitingQueueRepository.findOldestWaitingOpponent(userId, normalizedBoardSize);

    if (opponentQueue) {
      const createdMatch = await this.matchService.createPrivateMatch(userId);
      const matchId = createdMatch._id.toString();
      const opponentId = opponentQueue.userId.toString();

      await this.matchService.addPlayerToMatch(matchId, opponentId);
      await this.userService.setCurrentMatch(opponentId, matchId);

      await this.waitingQueueRepository.updateQueue(opponentQueue._id.toString(), {
        status: "matched",
        matchedWith: new Types.ObjectId(userId),
        matchId: createdMatch._id,
      });

      return await this.waitingQueueRepository.create({
        userId: new Types.ObjectId(userId),
        rank: user.rank ?? 1000,
        status: "matched",
        preferences: {
          boardSize: normalizedBoardSize,
        },
        matchedWith: new Types.ObjectId(opponentId),
        matchId: createdMatch._id,
      });
    }

    const queueData: WaitingQueueInput = {
      userId: new Types.ObjectId(userId),
      rank: user.rank ?? 1000,
      status: "waiting",
      preferences: {
        boardSize: normalizedBoardSize,
      },
    };

    return await this.waitingQueueRepository.create(queueData);
  }

  async cancelFromQueue(userId: string): Promise<WaitingQueueDocument | null> {
    const existing = await this.waitingQueueRepository.findByUserIdAndStatus(userId, "waiting");
    if (!existing) {
      return null;
    }

    return await this.waitingQueueRepository.updateStatus(existing._id.toString(), "cancelled");
  }
}
