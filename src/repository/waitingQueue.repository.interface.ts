import { WaitingQueueDocument, WaitingQueueInput } from "../model/waitingQueue";

export interface IWaitingQueueRepository {
  create(data: WaitingQueueInput): Promise<WaitingQueueDocument>;
  findByUserIdAndStatus(userId: string, status: string): Promise<WaitingQueueDocument | null>;
  findOldestWaitingOpponent(userId: string, boardSize: string): Promise<WaitingQueueDocument | null>;
  updateStatus(id: string, status: string): Promise<WaitingQueueDocument | null>;
  updateQueue(id: string, update: Partial<WaitingQueueInput>): Promise<WaitingQueueDocument | null>;
  deleteByUserId(userId: string): Promise<void>;
}
