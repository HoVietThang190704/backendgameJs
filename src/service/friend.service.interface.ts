import { FriendResponseDto } from "../dto/friend.dto";

export interface IFriendService {
  addFriend(requesterId: string, recipientId: string): Promise<FriendResponseDto>;
  removeFriend(requesterId: string, recipientId: string): Promise<void>;
  getFriends(userId: string): Promise<FriendResponseDto[]>;
  areFriends(userId: string, friendId: string): Promise<boolean>;
  getIncomingRequests(userId: string): Promise<FriendResponseDto[]>;
  respondToRequest(requesterId: string, recipientId: string, status: "accepted" | "rejected" | "blocked"): Promise<FriendResponseDto>;
}