import { FriendResponseDto } from "../dto/friend.dto";
import { Friend } from "../model/friend";

export interface IFriendRepository {
  addFriend(requesterId: string, recipientId: string): Promise<Friend>;
  removeFriend(requesterId: string, recipientId: string): Promise<Friend>;
  getFriends(userId: string): Promise<string[]>;
  areFriends(userId: string, friendId: string): Promise<boolean>;
  getFriendConnection(userId: string, friendId: string): Promise<Friend | null>;
  getIncomingRequests(userId: string): Promise<Friend[]>;
  respondToRequest(requesterId: string, recipientId: string, status: "accepted" | "rejected" | "blocked"): Promise<Friend>;
}