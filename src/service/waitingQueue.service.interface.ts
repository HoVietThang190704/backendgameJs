import { WaitingQueueDocument } from "../model/waitingQueue";

export interface IWaitingQueueService {
  addToQueue(userId: string, boardSize: string): Promise<WaitingQueueDocument>;
  cancelFromQueue(userId: string): Promise<WaitingQueueDocument | null>;
}
