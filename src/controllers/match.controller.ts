import { Request, Response } from "express";
import { IMatchService } from "../service/match.service.interface";
import { IMatchStateService } from "../service/match-state.service.interface";
import { IMatchHistoryService } from "../service/match-history.service.interface";
import { IUserService } from "../service/user.service.interface";
import { MatchDocument } from "../model/match";
import { MatchPlayer } from "../socket/types";
import { BaseResponse } from "../lib/baseresponse";
import { SocketService } from "../socket/socket.service";
import { matchTimers } from "../socket/state";

export class MatchController {
  private readonly matchService: IMatchService;
  private readonly socketService: SocketService;
  private readonly matchStateService: IMatchStateService;
  private readonly matchHistoryService: IMatchHistoryService;
  private readonly userService: IUserService;

  constructor(
    matchService: IMatchService,
    socketService: SocketService,
    matchStateService: IMatchStateService,
    matchHistoryService: IMatchHistoryService,
    userService: IUserService,
  ) {
    this.matchService = matchService;
    this.socketService = socketService;
    this.matchStateService = matchStateService;
    this.matchHistoryService = matchHistoryService;
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

      const payload = await this.matchStateService.buildMatchStatePayload(match);

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

  async getMatchHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const page = Number(req.query.page) >= 1 ? Number(req.query.page) : 1;
      const limit = Number(req.query.limit) >= 1 && Number(req.query.limit) <= 20 ? Number(req.query.limit) : 10;

      const matches = await this.matchService.getMatchHistory(userId, page, limit);
      const history = this.matchHistoryService.buildMatchHistoryItems(matches, userId);

      const response = new BaseResponse<typeof history>()
        .setResponse(200)
        .setMessage("Match history fetched")
        .setSuccess(true)
        .setData(history)
        .build();

      res.status(200).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to get match history";
      res.status(400).json({ message });
    }
  }

  async getActiveMatch(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const activeMatch = await this.matchService.getActiveMatchForUser(userId);
      const data = activeMatch
        ? {
            matchId: activeMatch._id?.toString() ?? null,
            status: activeMatch.status,
            currentPlayerId: activeMatch.currentTurn?.toString() ?? null,
            playerCount: activeMatch.players.length,
          }
        : {
            matchId: null,
            status: "none",
            currentPlayerId: null,
            playerCount: 0,
          };

      const response = new BaseResponse<typeof data>()
        .setResponse(200)
        .setMessage("Active match fetched")
        .setSuccess(true)
        .setData(data)
        .build();

      res.status(200).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to get active match";
      res.status(400).json({ message });
    }
  }

  async leaveMatch(req: Request, res: Response): Promise<void> {
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

      const result = await this.matchService.leaveMatch(id, userId);

      if (!result) {
        this.socketService.emitToRoom(id, "player_left", { userId });

        const response = new BaseResponse<null>()
          .setResponse(200)
          .setMessage("Player left and match deleted")
          .setSuccess(true)
          .build();

        res.status(200).json(response);
        return;
      }

      this.socketService.emitToRoom(id, "player_left", { userId });

      if (result.hostId?.toString() !== userId) {
        this.socketService.emitToRoom(id, "host_changed", { hostId: result.hostId?.toString() });
      }

      const response = new BaseResponse<MatchDocument>()
        .setResponse(200)
        .setMessage("Left match successfully")
        .setSuccess(true)
        .setData(result)
        .build();

      res.status(200).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to leave match";
      if (message === "Match not found") {
        res.status(404).json({ message });
        return;
      }
      if (message === "Player is not in this match") {
        res.status(400).json({ message });
        return;
      }
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

  async startMatch(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }

      const { matchId } = req.params;
      if (!matchId) {
        res.status(400).json({ message: "matchId is required" });
        return;
      }

      const startedMatch = await this.matchService.startMatch(matchId, userId, true);
      if (!startedMatch) {
        res.status(404).json({ message: "Match not found" });
        return;
      }

      const io = this.socketService.getIo();
      if (io) {
        const { startMatchTimer } = require("../socket/handlers");
        io.to(matchId).emit("start_game", {
          matchId,
          currentTurn: startedMatch.currentTurn?.toString() ?? null,
          turnTimeLimit: startedMatch.turnTimeLimit,
        });
        startMatchTimer(matchId, io, this.matchService);
      }

      const response = new BaseResponse<MatchDocument>()
        .setResponse(200)
        .setMessage("Match started")
        .setSuccess(true)
        .setData(startedMatch)
        .build();

      res.status(200).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to start match";

      if (message === "Only host can start the match") {
        res.status(403).json({ message });
        return;
      }

      res.status(400).json({ message });
    }
  }

}
