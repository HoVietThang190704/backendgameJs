import { WaitingQueueDocument, WaitingQueueInput, WaitingQueueModel } from "../model/waitingQueue";
import { IWaitingQueueRepository } from "./waitingQueue.repository.interface";
import { Types } from "mongoose";

export class WaitingQueueRepository implements IWaitingQueueRepository {
  async create(data: WaitingQueueInput): Promise<WaitingQueueDocument> {
    return await WaitingQueueModel.create(data);
  }

  async findByUserIdAndStatus(userId: string, status: string): Promise<WaitingQueueDocument | null> {
    const userObjectId = new Types.ObjectId(userId);
    return await WaitingQueueModel.findOne({ userId: userObjectId, status }).sort({ createdAt: -1 });
  }

  async findOldestWaitingOpponent(userId: string, boardSize: string): Promise<WaitingQueueDocument | null> {
    const userObjectId = new Types.ObjectId(userId);
    return await WaitingQueueModel.findOne({
      status: "waiting",
      userId: { $ne: userObjectId },
      "preferences.boardSize": boardSize,
    }).sort({ joinedAt: 1, createdAt: 1 });
  }

  async updateStatus(id: string, status: string): Promise<WaitingQueueDocument | null> {
    return await WaitingQueueModel.findByIdAndUpdate(id, { status }, { new: true });
  }

  async updateQueue(id: string, update: Partial<WaitingQueueInput>): Promise<WaitingQueueDocument | null> {
    return await WaitingQueueModel.findByIdAndUpdate(id, update, { new: true });
  }

  async deleteByUserId(userId: string): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);
    await WaitingQueueModel.deleteMany({ userId: userObjectId });
  }
}
