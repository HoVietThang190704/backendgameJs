import { Request, Response } from 'express';
import { IUserService } from '../service/user.service.interface';
import { IFriendService } from '../service/friend.service.interface';
import { BaseResponse } from '../lib/baseresponse';
import { User } from '../model/user';

export class UserController {
  private readonly userService: IUserService;
  private readonly friendService: IFriendService;

  constructor(userService: IUserService, friendService: IFriendService) {
    this.userService = userService;
    this.friendService = friendService;
  }

  async getUserByEmail(req: Request, res: Response): Promise<void> {
    try {
      const email = req.params.email;
      const user = await this.userService.getUserByEmail(email as string);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
      } else {
        res.status(200).json(user);
      }
    } catch (error) {
      res.status(400).json({ message: "Error fetching user: "});
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "User not authenticated" });
      } else {
        const fieldsQuery = req.query.fields as string;
        let projection = '';

        if (fieldsQuery) {
          projection = fieldsQuery
            .split(',')
            .map(f => f.trim())
            .filter(f => f !== 'password' && f !== '-password' && f !== 'passwordHash' && f !== '-passwordHash')
            .join(' ');
        }

        const user = await this.userService.getUserById(userId, projection);

        if (!user) {
          res.status(404).json({ message: "User not found" });
        } else {
          const response = new BaseResponse<User>()
            .setResponse(200)
            .setMessage("User profile retrieved successfully")
            .setSuccess(true)
            .setData(user)
            .build();

          res.status(200).json(response);
        }
      }
    } catch (error) {
      console.error("Error retrieving user profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const query = req.query.name as string;
      if (!query || !query.trim()) {
        res.status(400).json({ message: "Query parameter 'name' is required" });
        return;
      }

      const users = await this.userService.searchUsersByName(query, 20);
      const currentUserId = req.userId;

      const usersWithStatus = await Promise.all(
        users.map(async (user) => {
          const searchedUserId = (user as unknown as { _id: string })._id?.toString();
          let relationshipStatus: "accepted" | "pending" | "rejected" | "blocked" | "not_friends" = "not_friends";
          let isFriend = false;
          let isPendingOutgoing = false;
          let isPendingIncoming = false;
          let isBlocked = false;

          if (currentUserId && searchedUserId) {
            const connection = await this.friendService.getFriendStatus(currentUserId, searchedUserId);
            relationshipStatus = connection;

            if (connection === "accepted") {
              isFriend = true;
            } else if (connection === "blocked") {
              isBlocked = true;
            } else if (connection === "pending") {
              // mark outgoing/incoming by direction in FriendService helper
              const friendConnection = await this.friendService.getFriendConnection(currentUserId, searchedUserId);
              if (friendConnection) {
                if (friendConnection.requesterId.toString() === currentUserId) {
                  isPendingOutgoing = true;
                } else {
                  isPendingIncoming = true;
                }
              }
            }
          }

          return {
            ...user,
            relationshipStatus,
            isFriend,
            isBlocked,
            isPendingOutgoing,
            isPendingIncoming,
          };
        })
      );

      const response = new BaseResponse<typeof usersWithStatus>()
        .setResponse(200)
        .setSuccess(true)
        .setMessage("Users found")
        .setData(usersWithStatus)
        .build();
      res.status(200).json(response);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.userId;
      if (!userId) {
        res.status(401).json({ message: "User not authenticated" });
        return;
      }

      const userInfo = await this.userService.getUserById(userId);
      if (!userInfo) {
        res.status(404).json({ message: "Authenticated user not found" });
        return;
      }

      const leaderboardUsers = await this.userService.getTopUsers(10);

      const userRankData = await this.userService.getUserOwnRankPosition(userId);
      if (!userRankData) {
        res.status(404).json({ message: "User ranking data not found" });
        return;
      }

      const formattedTop = leaderboardUsers.map((u, index) => {
        const total = (u.wins ?? 0) + (u.losses ?? 0);
        const winRate = total > 0 ? Number(((u.wins ?? 0) / total * 100).toFixed(1)) : 0;

        return {
          displayName: u.name?.trim() ? u.name : u.username,
          avatar: u.avatar_url ?? '',
          rank: u.rank ?? 0,
          stats: {
            wins: u.wins ?? 0,
            losses: u.losses ?? 0,
            winRate,
          },
          position: index + 1,
        };
      });

      const response = new BaseResponse<{
        top: Array<{
          displayName: string;
          avatar: string;
          rank: number;
          stats: { wins: number; losses: number; winRate: number };
          position: number;
        }>;
        me: { rank: number; position: number };
      }>()
        .setResponse(200)
        .setMessage("Leaderboard fetched successfully")
        .setSuccess(true)
        .setData({
          top: formattedTop,
          me: {
            rank: userRankData.rank,
            position: userRankData.position,
          },
        })
        .build();

      res.status(200).json(response);
    } catch (error) {
      console.error("Error retrieving leaderboard:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}
