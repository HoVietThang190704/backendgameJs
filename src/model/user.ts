import { Schema, model, Document } from "mongoose";

export interface IUserDocument extends Document {
    username: string;
    email: string;
    password: string;
    role: "user" | "admin";
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
    {
        username: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, required: true },
        role: { type: String, enum: ["user", "admin"], default: "user" },
    },
    {
        timestamps: true,
    }
);

export const UserModel = model<IUserDocument>("User", UserSchema);
