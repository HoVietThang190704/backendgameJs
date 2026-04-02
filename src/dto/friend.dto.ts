import { Types } from "mongoose";
import z from "zod";
import { Friend } from "../model/friend";

const friendRequestStatus = z.enum(["pending", "accepted", "rejected", "blocked"]);

export const friendResponseDto = z.object({
  requesterId: z.instanceof(Types.ObjectId),
  recipientId: z.instanceof(Types.ObjectId),
  status: friendRequestStatus,
  createdAt: z.date(),
  updatedAt: z.date(),
}) satisfies z.ZodType<Friend, z.ZodTypeDef, unknown>;

export type FriendRequestStatus = z.infer<typeof friendRequestStatus>;
export type FriendResponseDto = z.infer<typeof friendResponseDto>;