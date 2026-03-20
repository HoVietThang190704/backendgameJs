import { Request, Response } from "express";
import { IMatchService } from "../service/match.service.interface";
import { BaseResponse } from "../lib/baseresponse";

export class MatchController {
  private readonly matchService: IMatchService;

  constructor(matchService: IMatchService) {
    this.matchService = matchService;
  }

  async createPrivateMatch(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const match = await this.matchService.createPrivateMatch(userId);
      const matchId = match._id?.toString() ?? null;

      const response = new BaseResponse<{ matchId: string | null; pinCode: string }>()
        .setResponse(201)
        .setMessage("Match created")
        .setSuccess(true)
        .setData({ matchId, pinCode: match.pinCode })
        .build();

      res.status(201).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to create match";
      res.status(400).json({ message });
    }
  }

  async joinMatch(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { matchId } = req.body;
      if (!matchId) {
        res.status(400).json({ message: "matchId is required" });
        return;
      }

      const match = await this.matchService.addPlayerToMatch(matchId, userId);
      if (!match) {
        res.status(404).json({ message: "Match not found" });
        return;
      }

      const response = new BaseResponse<{ matchId: string; pinCode: string; players: any[] }>()
        .setResponse(200)
        .setMessage("Joined match successfully")
        .setSuccess(true)
        .setData({ matchId: match._id?.toString() ?? "", pinCode: match.pinCode, players: match.players as any[] })
        .build();

      res.status(200).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to join match";
      res.status(400).json({ message });
    }
  }
}
