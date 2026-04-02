import { FriendResponseDto } from "../dto/friend.dto";
import { IFriendRepository } from "../repository/friend.repository.interface";
import { IFriendService } from "./friend.service.interface";

export class FriendService implements IFriendService {
  private readonly friendRepository: IFriendRepository;

  constructor(friendRepository: IFriendRepository) {
    this.friendRepository = friendRepository;
  }

  async addFriend(requesterId: string, recipientId: string): Promise<FriendResponseDto> {
    if (requesterId === recipientId) {
      throw new Error("Cannot send friend request to yourself");
    }

    const existingFriend = await this.friendRepository.areFriends(requesterId, recipientId);
    if (existingFriend) {
      throw new Error("Users are already friends");
    }

    const requestWorks = await this.friendRepository.addFriend(requesterId, recipientId);
    return requestWorks as unknown as FriendResponseDto;
  }

  async removeFriend(requesterId: string, recipientId: string): Promise<void> {
    await this.friendRepository.removeFriend(requesterId, recipientId);
  }

  async getFriends(userId: string): Promise<FriendResponseDto[]> {
    const friendIds = await this.friendRepository.getFriends(userId);
    return friendIds.map((friendId) => ({
      requesterId: userId as any,
      recipientId: friendId as any,
      status: "accepted",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as FriendResponseDto));
  }

  async areFriends(userId: string, friendId: string): Promise<boolean> {
    return this.friendRepository.areFriends(userId, friendId);
  }

  async getFriendConnection(userId: string, friendId: string): Promise<any | null> {
    return this.friendRepository.getFriendConnection(userId, friendId);
  }

  async getFriendStatus(userId: string, friendId: string): Promise<"accepted" | "pending" | "rejected" | "blocked" | "not_friends"> {
    const connection = await this.friendRepository.getFriendConnection(userId, friendId);
    if (!connection) {
      return "not_friends";
    }

    if (connection.status === "accepted") {
      return "accepted";
    }

    if (connection.status === "pending") {
      return "pending";
    }

    if (connection.status === "rejected") {
      return "rejected";
    }

    if (connection.status === "blocked") {
      return "blocked";
    }

    return "not_friends";
  }

  async getIncomingRequests(userId: string): Promise<FriendResponseDto[]> {
    const incoming = await this.friendRepository.getIncomingRequests(userId);
    return incoming.map((r) => r as unknown as FriendResponseDto);
  }

  async respondToRequest(
    requesterId: string,
    recipientId: string,
    status: "accepted" | "rejected" | "blocked"
  ): Promise<FriendResponseDto> {
    const updated = await this.friendRepository.respondToRequest(requesterId, recipientId, status);
    return updated as unknown as FriendResponseDto;
  }
}
