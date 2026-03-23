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

  async updateStatus(id: string, status: string): Promise<WaitingQueueDocument | null> {
    return await WaitingQueueModel.findByIdAndUpdate(id, { status }, { new: true });
  }

  async deleteByUserId(userId: string): Promise<void> {
    const userObjectId = new Types.ObjectId(userId);
    await WaitingQueueModel.deleteMany({ userId: userObjectId });
  }
}
