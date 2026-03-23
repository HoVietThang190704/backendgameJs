import { WaitingQueueDocument, WaitingQueueInput } from "../model/waitingQueue";

export interface IWaitingQueueRepository {
  create(data: WaitingQueueInput): Promise<WaitingQueueDocument>;
  findByUserIdAndStatus(userId: string, status: string): Promise<WaitingQueueDocument | null>;
  updateStatus(id: string, status: string): Promise<WaitingQueueDocument | null>;
  deleteByUserId(userId: string): Promise<void>;
}
