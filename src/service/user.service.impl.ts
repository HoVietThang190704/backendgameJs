import crypto from "crypto";
import jwt from "jsonwebtoken";
import { IUserRepository } from "../repository/user.repository.interface";
import { IUserService } from "./user.service.interface";

const ACCESS_EXPIRE = "15m";
const REFRESH_EXPIRE = "7d";

export class UserService implements IUserService {
    private repository: IUserRepository;
    private refreshStore: Set<string> = new Set();

    constructor(repository: IUserRepository) {
        this.repository = repository;
    }

    private hashPassword(password: string): string {
        return crypto.createHash("sha256").update(password).digest("hex");
    }

    private generateAccessToken(user: any): string {
        const secret = process.env.JWT_SECRET || "secret";
        return jwt.sign({ userId: user.id }, secret, { expiresIn: ACCESS_EXPIRE });
    }

    private generateRefreshToken(user: any): string {
        const secret = process.env.JWT_REFRESH_SECRET || "refreshsecret";
        const token = jwt.sign({ userId: user.id }, secret, { expiresIn: REFRESH_EXPIRE });
        this.refreshStore.add(token);
        return token;
    }

    async register(username: string, email: string, password: string) {
        const existing = await this.repository.findByEmail(email);
        if (existing) {
            throw new Error("Email already in use");
        }
        const hashed = this.hashPassword(password);
        return this.repository.create(username, email, hashed, "user");
    }

    async login(email: string, password: string) {
        const user = await this.repository.findByEmail(email);
        if (!user) {
            throw new Error("Invalid credentials");
        }
        const hashed = this.hashPassword(password);
        if (user.password !== hashed) {
            throw new Error("Invalid credentials");
        }
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);
        return { user, accessToken, refreshToken };
    }

    async getProfile(id: string) {
        const user = await this.repository.findById(id);
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }

    async refresh(refreshToken: string) {
        if (!this.refreshStore.has(refreshToken)) {
            throw new Error("Invalid refresh token");
        }
        const secret = process.env.JWT_REFRESH_SECRET || "refreshsecret";
        try {
            const payload: any = jwt.verify(refreshToken, secret);
            const user = await this.getProfile(payload.userId);
            const accessToken = this.generateAccessToken(user);
            return { accessToken };
        } catch (err) {
            this.refreshStore.delete(refreshToken);
            throw new Error("Refresh token expired or invalid");
        }
    }
}