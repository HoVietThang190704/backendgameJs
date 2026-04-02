import { InferSchemaType, model, Schema } from "mongoose";

export const friendSchema = new Schema({
  requesterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected", "blocked"], default: "pending" },
}, { timestamps: true });

friendSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });
friendSchema.index({ recipientId: 1, status: 1 });

export const FriendModel = model("Friend", friendSchema);
export type Friend = InferSchemaType<typeof friendSchema>;