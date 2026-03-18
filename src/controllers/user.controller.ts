import { Request, Response } from "express";
import { BaseResponse } from "../lib/baseresponse";
import { registerSchema, loginSchema, refreshSchema } from "../schema/user.schema";
import { IUserService } from "../service/user.service.interface";
import { isValidObjectId } from "mongoose";

export class UserController {
    constructor(private readonly userService: IUserService) {}

    async registerUser(req: Request, res: Response) {
        try {
            const parse = registerSchema.safeParse(req.body);
            if (!parse.success) {
                return res.status(400).json({ errors: parse.error.format() });
            }
            const { username, email, password } = parse.data;
            const user = await this.userService.register(username, email, password);
            const response = new BaseResponse<typeof user>()
                .setResponse(201)
                .setSuccess(true)
                .setMessage("User registered successfully")
                .setData(user);
            res.status(201).json(response);
        } catch (error) {
            console.error("Error registering user:", error);
            res.status(400).json({ error: (error as Error).message ?? "Failed to register" });
        }
    }

    async loginUser(req: Request, res: Response) {
        try {
            const parse = loginSchema.safeParse(req.body);
            if (!parse.success) {
                return res.status(400).json({ errors: parse.error.format() });
            }
            const { email, password } = parse.data;
            const result = await this.userService.login(email, password);
            const response = new BaseResponse<typeof result>()
                .setResponse(200)
                .setSuccess(true)
                .setMessage("Logged in successfully")
                .setData(result);
            res.json(response);
        } catch (error) {
            console.error("Error logging in:", error);
            res.status(400).json({ error: (error as Error).message ?? "Failed to login" });
        }
    }

    async getProfile(req: Request, res: Response) {
        try {
            const { id } = req.params;
            if (!isValidObjectId(id)) {
                return res.status(400).json({ error: "Invalid user id format" });
            }
            const user = await this.userService.getProfile(id);
            const response = new BaseResponse<typeof user>()
                .setResponse(200)
                .setSuccess(true)
                .setMessage("Profile fetched successfully")
                .setData(user);
            res.json(response);
        } catch (error) {
            console.error("Error fetching profile:", error);
            res.status(404).json({ error: (error as Error).message ?? "User not found" });
        }
    }

    async refreshToken(req: Request, res: Response) {
        try {
            const parse = refreshSchema.safeParse(req.body);
            if (!parse.success) {
                return res.status(400).json({ errors: parse.error.format() });
            }
            const { token } = parse.data;
            const data = await this.userService.refresh(token);
            const response = new BaseResponse<typeof data>()
                .setResponse(200)
                .setSuccess(true)
                .setMessage("Access token refreshed")
                .setData(data);
            res.json(response);
        } catch (error) {
            console.error("Error refreshing token:", error);
            res.status(400).json({ error: (error as Error).message ?? "Failed to refresh token" });
        }
    }
}
