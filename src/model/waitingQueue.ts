import { Schema, model, InferSchemaType, HydratedDocument, Types } from "mongoose";

export const waitingQueueSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  rank: { type: Number, required: true },
  status: { type: String, required: true, enum: ["waiting", "matched", "cancelled"], default: "waiting" },
  joinedAt: { type: Date, default: Date.now },
  preferences: {
    boardSize: { type: String, required: true, default: "medium" },
  },
  matchedWith: { type: Schema.Types.ObjectId, ref: "User", required: false },
  matchId: { type: Schema.Types.ObjectId, ref: "Match", required: false },
}, {
  timestamps: true,
});

export const WaitingQueueModel = model("WaitingQueue", waitingQueueSchema);
export type WaitingQueue = InferSchemaType<typeof waitingQueueSchema>;
export type WaitingQueueDocument = HydratedDocument<WaitingQueue>;

export type WaitingQueueInput = {
  userId: Types.ObjectId;
  rank: number;
  status: string;
  preferences: {
    boardSize: string;
  };
  matchedWith?: Types.ObjectId;
  matchId?: Types.ObjectId;
};
