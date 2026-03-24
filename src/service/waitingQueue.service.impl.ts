import { IWaitingQueueService } from "./waitingQueue.service.interface";
import { IWaitingQueueRepository } from "../repository/waitingQueue.repository.interface";
import { IUserService } from "./user.service.interface";
import { WaitingQueueDocument, WaitingQueueInput } from "../model/waitingQueue";
import { Types } from "mongoose";

export class WaitingQueueService implements IWaitingQueueService {
  private readonly waitingQueueRepository: IWaitingQueueRepository;
  private readonly userService: IUserService;

  constructor(waitingQueueRepository: IWaitingQueueRepository, userService: IUserService) {
    this.waitingQueueRepository = waitingQueueRepository;
    this.userService = userService;
  }

  async addToQueue(userId: string, boardSize: string): Promise<WaitingQueueDocument> {
    const user = await this.userService.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.currentMatchId) {
      throw new Error("User is already in an active match");
    }

    // Check if already in queue
    const existing = await this.waitingQueueRepository.findByUserIdAndStatus(userId, "waiting");
    if (existing) {
       // Requirement: Ensure only one "waiting" record. 
       // If already exists, return it instead of creating a new one.
      return existing; 
    }

    // In model/user.ts, we added rank but InferSchemaType might not have updated if we haven't re-run build.
    // Casting to any to access the new field safely in TS.
    const rank = (user as any).rank ?? 1000;

    const queueData: WaitingQueueInput = {
      userId: new Types.ObjectId(userId),
      rank,
      status: "waiting",
      preferences: {
        boardSize,
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
