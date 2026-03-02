import mongoose from "mongoose";
import { config } from "./utils/db.config";

export async function connectDatabase(): Promise<void> {
    const uri = config.MONGO_URI;

    if (!uri) {
        throw new Error("MONGO_URI is not configured");
    }

    if (mongoose.connection.readyState >= 1) {
        return;
    }

    await mongoose.connect(uri);
    console.log("MongoDB connected");
}
