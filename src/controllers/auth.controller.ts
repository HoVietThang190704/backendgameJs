import { Request, Response } from 'express';
import { LoginDto, RefreshTokenDto } from "../dto/auth.dto";
import { createUserDto } from "../dto/user.dto";
import { BaseResponse } from "../lib/baseresponse";
import { User } from "../model/user";
import { IAuthService } from "../service/auth.service.interface";

export class AuthController {
  private readonly authService: IAuthService;

  constructor(authService: IAuthService) {
    this.authService = authService;
  }

  async register(req: Request, res: Response) {
    try {
        const result = createUserDto.safeParse(req.body);
        if (!result.success) {
          return res.status(400).json({ message: "Invalid user data", errors: result.error });
        }
        const user = await this.authService.register(result.data);
        const response = new BaseResponse<User>()
        .setResponse(201)
        .setMessage("User registered successfully")
        .setSuccess(true)
        .build();
      res.json(response); 
    } catch (error) {
      res.status(400).json({ message: "Error registering user: " });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const result = LoginDto.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid login data", errors: result.error });
      }

      const tokens = await this.authService.login(result.data);
      const response = new BaseResponse<{ accessToken: string; refreshToken: string }>()
        .setResponse(200)
        .setMessage("Login successful")
        .setSuccess(true)
        .setData(tokens)
        .build();

      res.status(200).json(response);
    } catch (error) {
      res.status(401).json({ message: "Invalid email or password" });
    }
  }

  async refreshToken(req: Request, res: Response) {
    try {
      const result = RefreshTokenDto.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid refresh token", errors: result.error });
      }

      const tokens = await this.authService.refreshToken(result.data.refreshToken);
      const response = new BaseResponse<{ accessToken: string; refreshToken: string }>()
        .setResponse(200)
        .setMessage("Token refreshed")
        .setSuccess(true)
        .setData(tokens)
        .build();

      res.status(200).json(response);
    } catch (error) {
      res.status(401).json({ message: "Invalid refresh token" });
    }
  }
}