import { FriendResponseDto } from "../dto/friend.dto";
import { Friend, FriendModel } from "../model/friend";
import { IFriendRepository } from "./friend.repository.interface";

export class FriendRepository implements IFriendRepository {
  constructor() {}

  async addFriend(requesterId: string, recipientId: string): Promise<Friend> {
    const addFriend = await FriendModel.create({
      requesterId,
      recipientId,
      status: "pending",
    });
    return addFriend;
  }

  async removeFriend(requesterId: string, recipientId: string): Promise<Friend> {
    const removedFriend = await FriendModel.findOneAndDelete({
      $or: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId },
      ],
    });
    if (!removedFriend) {
      throw new Error("Friend relationship not found");
    }
    return removedFriend;
  }

  async getFriends(userId: string): Promise<string[]> {
    const friends = await FriendModel.find({
      $or: [{ requesterId: userId }, { recipientId: userId }],
      status: "accepted",
    });
    const friendIds = friends.map((friend) => {
      if (friend.requesterId.toString() === userId) {
        return friend.recipientId.toString();
      } else {
        return friend.requesterId.toString();
      }
    });
    return friendIds;
  }

  async areFriends(userId: string, friendId: string): Promise<boolean> {
    const friendship = await FriendModel.findOne({
      $or: [
        { requesterId: userId, recipientId: friendId },
        { requesterId: friendId, recipientId: userId },
      ],
      status: "accepted",
    });
    return !!friendship;
  }

  async getFriendConnection(userId: string, friendId: string): Promise<Friend | null> {
    const friend = await FriendModel.findOne({
      $or: [
        { requesterId: userId, recipientId: friendId },
        { requesterId: friendId, recipientId: userId },
      ],
    });
    return friend;
  }

  async getIncomingRequests(userId: string): Promise<Friend[]> {
    return await FriendModel.find({ recipientId: userId, status: "pending" });
  }

  async respondToRequest(requesterId: string, recipientId: string, status: "accepted" | "rejected" | "blocked"): Promise<Friend> {
    if (!['accepted', 'rejected', 'blocked'].includes(status)) {
      throw new Error("Invalid status");
    }

    const updatedFriend = await FriendModel.findOneAndUpdate(
      { requesterId, recipientId, status: "pending" },
      { status },
      { new: true }
    );

    if (!updatedFriend) {
      throw new Error("Friend request not found or already processed");
    }

    return updatedFriend;
  }
}
