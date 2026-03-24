import { Schema, model, InferSchemaType, HydratedDocument, Types } from "mongoose";

export const matchSchema = new Schema({
  matchType: { type: String, required: true, default: "private" },
  status: { type: String, required: true, default: "waiting" },
  pinCode: { type: String, required: true, unique: true },
  hostId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  players: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      isReady: { type: Boolean, default: false },
      health: { type: Number, default: 3 },
    },
  ],
  gameBoard: {
    rows: { type: Number, required: true },
    cols: { type: Number, required: true },
    bombs: { type: Number, required: true },
  },
  turnTimeLimit: { type: Number, required: true, default: 30 },
  turnStartTime: { type: Date, required: false },
  currentTurn: { type: Schema.Types.ObjectId, ref: "User", required: false },
  moves: [
    {
      playerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      x: { type: Number, required: true },
      y: { type: Number, required: true },
      action: { type: String, required: true },
      result: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  lastTickAt: { type: Date, required: false },
}, {
  timestamps: true,
});

export const MatchModel = model("Match", matchSchema);
export type Match = InferSchemaType<typeof matchSchema>;
export type MatchDocument = HydratedDocument<Match>;
export type MatchInput = {
  matchType: string;
  status: string;
  pinCode: string;
  hostId: Types.ObjectId;
  players: Array<{
    userId: Types.ObjectId;
    isReady: boolean;
    health: number;
  }>;
  gameBoard: {
    rows: number;
    cols: number;
    bombs: number;
  };
  turnTimeLimit: number;
  currentTurn?: Types.ObjectId;
  turnStartTime?: Date;
  moves?: Array<{
    playerId: Types.ObjectId;
    x: number;
    y: number;
    action: string;
    result: string;
    createdAt?: Date;
  }>;
  lastTickAt?: Date;
};
