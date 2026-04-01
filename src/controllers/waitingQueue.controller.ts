import { Request, Response } from "express";
import { IWaitingQueueService } from "../service/waitingQueue.service.interface";
import { BaseResponse } from "../lib/baseresponse";

export class WaitingQueueController {
  private readonly waitingQueueService: IWaitingQueueService;

  constructor(waitingQueueService: IWaitingQueueService) {
    this.waitingQueueService = waitingQueueService;
  }

  async findMatch(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { boardSize } = req.body;
      if (!boardSize) {
        res.status(400).json({ message: "boardSize is required" });
        return;
      }

      const queueRecord = await this.waitingQueueService.addToQueue(userId, boardSize);

      const response = new BaseResponse<typeof queueRecord>()
        .setResponse(200)
        .setMessage("Searching for opponent")
        .setSuccess(true)
        .setData(queueRecord)
        .build();

      res.status(200).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to find match";
      res.status(400).json({ message });
    }
  }

  async cancelMatch(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const cancelledQueue = await this.waitingQueueService.cancelFromQueue(userId);
      if (!cancelledQueue) {
        const response = new BaseResponse<null>()
          .setResponse(200)
          .setMessage("No active queue entry to cancel")
          .setSuccess(false)
          .build();

        res.status(200).json(response);
        return;
      }

      const response = new BaseResponse<typeof cancelledQueue>()
        .setResponse(200)
        .setMessage("Search cancelled")
        .setSuccess(true)
        .setData(cancelledQueue)
        .build();

      res.status(200).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to cancel search";
      res.status(400).json({ message });
    }
  }
}
