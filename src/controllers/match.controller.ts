import { Request, Response } from "express";
import { IMatchService } from "../service/match.service.interface";
import { IUserService } from "../service/user.service.interface";
import { IWaitingQueueService } from "../service/waitingQueue.service.interface";
import { MatchDocument } from "../model/match";
import { WaitingQueueDocument } from "../model/waitingQueue";
import { MatchPlayer } from "../socket/types";
import { BaseResponse } from "../lib/baseresponse";
import { SocketService } from "../socket/socket.service";
import { matchTimers } from "../socket/state";

export class MatchController {
  private readonly matchService: IMatchService;
  private readonly socketService: SocketService;
  private readonly waitingQueueService: IWaitingQueueService;
  private readonly userService: IUserService;

  constructor(
    matchService: IMatchService,
    socketService: SocketService,
    waitingQueueService: IWaitingQueueService,
    userService: IUserService
  ) {
    this.matchService = matchService;
    this.socketService = socketService;
    this.waitingQueueService = waitingQueueService;
    this.userService = userService;
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

      const response = new BaseResponse<{ matchId: string; pinCode: string; players: MatchPlayer[] }>()
        .setResponse(200)
        .setMessage("Joined match successfully")
        .setSuccess(true)
        .setData({ matchId: match._id?.toString() ?? "", pinCode: match.pinCode, players: match.players as MatchPlayer[] })
        .build();

      res.status(200).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to join match";
      res.status(400).json({ message });
    }
  }

  async getMatchState(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({ message: "Match id is required" });
        return;
      }

      const match = await this.matchService.getMatchById(id);
      if (!match) {
        res.status(404).json({ message: "Match not found" });
        return;
      }

      const playerState = await Promise.all(
        match.players.map(async (p) => {
          const user = await this.userService.getUserById(p.userId.toString());
          const displayName = user?.name || user?.username || "Unknown";

          return {
            userId: p.userId.toString(),
            displayName,
            rank: user?.rank ?? 0,
            health: p.health,
          };
        }),
      );

      const player1Id = match.players[0]?.userId?.toString();
      const player2Id = match.players[1]?.userId?.toString();

      const player1Revealed: Array<{ x: number; y: number }> = [];
      const player2Revealed: Array<{ x: number; y: number }> = [];
      const player1Flags: Array<{ x: number; y: number }> = [];
      const player2Flags: Array<{ x: number; y: number }> = [];

      (match.moves || []).forEach((move) => {
        const coord = { x: move.x, y: move.y };
        if (move.action === "open") {
          if (move.playerId.toString() === player1Id) {
            player1Revealed.push(coord);
          } else if (move.playerId.toString() === player2Id) {
            player2Revealed.push(coord);
          }
        } else if (move.action === "flag") {
          if (move.playerId.toString() === player1Id) {
            player1Flags.push(coord);
          } else if (move.playerId.toString() === player2Id) {
            player2Flags.push(coord);
          }
        }
      });

      const turnTimeLimit = match.turnTimeLimit ?? 30;
      let turnStartTime = match.turnStartTime ?? null;
      let remainingSeconds = null;

      const timer = matchTimers.get(id);
      if (timer) {
        remainingSeconds = timer.remainingSeconds;
        turnStartTime = new Date(Date.now() - (turnTimeLimit - remainingSeconds) * 1000);
      }

      const payload = {
        players: playerState,
        boardState: {
          player1Revealed,
          player2Revealed,
          player1Flags,
          player2Flags,
        },
        currentTurn: match.currentTurn?.toString() ?? null,
        turnStartTime,
        turnTimeLimit,
        remainingSeconds,
      };

      const response = new BaseResponse<typeof payload>()
        .setResponse(200)
        .setMessage("Match state fetched")
        .setSuccess(true)
        .setData(payload)
        .build();

      res.status(200).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to get match state";
      res.status(400).json({ message });
    }
  }

  async setReady(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { id } = req.params;
      const { isReady } = req.body;

      if (typeof isReady !== "boolean") {
        res.status(400).json({ message: "isReady (boolean) is required" });
        return;
      }

      const updatedMatch = await this.matchService.setPlayerReady(id, userId, isReady);
      if (!updatedMatch) {
        res.status(404).json({ message: "Match not found" });
        return;
      }

      this.socketService.emitToRoom(id, "toggle_ready", {
        userId,
        ready: isReady,
      });

      const bothReady = updatedMatch.players.length >= 2 && updatedMatch.players.every((p) => p.isReady);
      if (bothReady && updatedMatch.status === "waiting") {
        const io = this.socketService.getIo();
        if (io) {
          const { startGame } = require("../socket/handlers"); 
          await startGame(id, updatedMatch, io, this.matchService);
        }
      }

      const response = new BaseResponse<MatchDocument>()
        .setResponse(200)
        .setMessage("Status updated")
        .setSuccess(true)
        .setData(updatedMatch)
        .build();

      res.status(200).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to update ready status";
      res.status(400).json({ message });
    }
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

      const response = new BaseResponse<WaitingQueueDocument>()
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

      const response = new BaseResponse<WaitingQueueDocument>()
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
