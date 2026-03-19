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
    created: {
        time: { type: Date, default: Date.now }
    },
    modified: {
        time: { type: Date, default: Date.now }
    }
})

export const UserModel = model("User", userSchema);
export type User = InferSchemaType<typeof userSchema>;