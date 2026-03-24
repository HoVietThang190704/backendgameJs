import { Schema, model, InferSchemaType } from "mongoose";

export const userSchema = new Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String, default: '' },
    rule: { type: String, default: 'user' },
    avatar_url: { type: String, default: '', required: false },
    isActive: { type: Boolean, default: true },
    currentMatchId: { type: Schema.Types.ObjectId, ref: "Match", required: false },
    rank: { type: Number, default: 1000 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    totalMatches: { type: Number, default: 0 },
    winRate: { type: Number, default: 0 },
    created: {
        time: { type: Date, default: Date.now }
    },
    modified: {
        time: { type: Date, default: Date.now }
    }
})

export const UserModel = model("User", userSchema);
export type User = InferSchemaType<typeof userSchema>;