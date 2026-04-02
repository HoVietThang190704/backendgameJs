import { Request, Response } from "express";
import { IFriendService } from "../service/friend.service.interface";
import { BaseResponse } from "../lib/baseresponse";

export class FriendController {
  private readonly friendService: IFriendService;

  constructor(friendService: IFriendService) {
    this.friendService = friendService;
  }

  async sendRequest(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = req.userId;
      const { recipientId } = req.body;

      if (!requesterId) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      if (!recipientId) {
        res.status(400).json({ message: "recipientId is required" });
        return;
      }

      const result = await this.friendService.addFriend(requesterId, recipientId);
      const response = new BaseResponse().setResponse(201).setSuccess(true).setMessage("Friend request sent").setData(result).build();
      res.status(201).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to send friend request";
      res.status(400).json({ message });
    }
  }

  async removeFriend(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = req.userId;
      const { friendId } = req.body;

      if (!requesterId) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      if (!friendId) {
        res.status(400).json({ message: "friendId is required" });
        return;
      }

      await this.friendService.removeFriend(requesterId, friendId);

      const response = new BaseResponse().setResponse(200).setSuccess(true).setMessage("Friend removed").build();
      res.status(200).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to remove friend";
      res.status(400).json({ message });
    }
  }

  async getFriends(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      const data = await this.friendService.getFriends(userId);
      const response = new BaseResponse().setResponse(200).setSuccess(true).setMessage("Friends retrieved").setData(data).build();
      res.status(200).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to get friends";
      res.status(400).json({ message });
    }
  }

  async getIncomingRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }

      const data = await this.friendService.getIncomingRequests(userId);
      const response = new BaseResponse().setResponse(200).setSuccess(true).setMessage("Incoming friend requests retrieved").setData(data).build();
      res.status(200).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to get incoming requests";
      res.status(400).json({ message });
    }
  }

  async respondToRequest(req: Request, res: Response): Promise<void> {
    try {
      const recipientId = req.userId;
      const { requesterId, status } = req.body;

      if (!recipientId) {
        res.status(401).json({ message: "Authentication required" });
        return;
      }
      if (!requesterId || !status) {
        res.status(400).json({ message: "requesterId and status are required" });
        return;
      }

      const validStatuses = ["accepted", "rejected", "blocked"] as const;
      if (!validStatuses.includes(status)) {
        res.status(400).json({ message: "Invalid status" });
        return;
      }

      const data = await this.friendService.respondToRequest(requesterId, recipientId, status);
      const response = new BaseResponse().setResponse(200).setSuccess(true).setMessage("Friend request updated").setData(data).build();
      res.status(200).json(response);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to respond to friend request";
      res.status(400).json({ message });
    }
  }
}
