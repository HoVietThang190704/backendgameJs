import { LoginDto } from "../dto/auth.dto";
import { CreateUserDto } from "../dto/user.dto";
import { User } from "../model/user";

export interface IAuthService {
  register(user: CreateUserDto): Promise<User>;
  login(user: LoginDto): Promise<{ accessToken: string; refreshToken: string }>;
  refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;
  logout(refreshToken: string): Promise<void>;
}