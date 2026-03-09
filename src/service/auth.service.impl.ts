import { LoginDto } from '../dto/auth.dto';
import { CreateUserDto } from '../dto/user.dto';
import { User } from '../model/user';
import { IAuthService } from './auth.service.interface';
import { IUserService } from './user.service.interface';
import bcrypt from 'bcrypt';
import { JwtService } from './jwt.service';
import { redisClient } from '../lib/redis';

export class AuthService implements IAuthService {
  private readonly userService: IUserService;

  constructor(userService: IUserService) {
    this.userService = userService;
  }

  async register(user: CreateUserDto): Promise<User> {
    const existingUser = await this.userService.getUserByEmail(user.email);
    if (existingUser) {
      throw new Error('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const newUser = await this.userService.createUser({ ...user, password: hashedPassword });
    return newUser;
  }

  async login(user: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const existingUser = await this.userService.getUserByEmail(user.email);
    if (!existingUser || !(await bcrypt.compare(user.password, existingUser.password))) {
      throw new Error('Invalid email or password');
    }

    const jwtPayLoad = {
      email: existingUser.email,
      rule: existingUser.rule,
      sub: existingUser.email
    };
    const jwtService = JwtService.getInstance();

    const accessToken = await jwtService.issueAccessToken(jwtPayLoad);
    const refreshToken = await jwtService.issueRefreshToken(jwtPayLoad);

    const refreshKey = `refresh_token:${existingUser.email}`;
    const refreshTtlSeconds = jwtService.getRefreshTokenTtlSeconds();
    if (refreshTtlSeconds) {
      await redisClient.set(refreshKey, refreshToken, { EX: refreshTtlSeconds });
    } else {
      await redisClient.set(refreshKey, refreshToken);
    }

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const jwtService = JwtService.getInstance();
    const decoded = await jwtService.verifyRefreshToken(refreshToken);

    if (!decoded || typeof decoded !== "object") {
      throw new Error('Invalid refresh token');
    }

    const tokenPayload = decoded as { email?: string; sub?: string; rule?: string };
    const email = tokenPayload.email || tokenPayload.sub;
    if (!email) {
      throw new Error('Invalid refresh token');
    }

    const refreshKey = `refresh_token:${email}`;
    const storedToken = await redisClient.get(refreshKey);
    if (!storedToken || storedToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    const existingUser = await this.userService.getUserByEmail(email);
    if (!existingUser) {
      throw new Error('User not found');
    }

    const jwtPayLoad = {
      email: existingUser.email,
      rule: existingUser.rule,
      sub: existingUser.email
    };

    const newAccessToken = await jwtService.issueAccessToken(jwtPayLoad);
    const newRefreshToken = await jwtService.issueRefreshToken(jwtPayLoad);
    const refreshTtlSeconds = jwtService.getRefreshTokenTtlSeconds();

    if (refreshTtlSeconds) {
      await redisClient.set(refreshKey, newRefreshToken, { EX: refreshTtlSeconds });
    } else {
      await redisClient.set(refreshKey, newRefreshToken);
    }

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string): Promise<void> {
    const jwtService = JwtService.getInstance();
    const decoded = await jwtService.verifyRefreshToken(refreshToken);

    if (!decoded || typeof decoded !== "object") {
      throw new Error('Invalid refresh token');
    }

    const tokenPayload = decoded as { email?: string; sub?: string };
    const email = tokenPayload.email || tokenPayload.sub;
    if (!email) {
      throw new Error('Invalid refresh token');
    }

    const refreshKey = `refresh_token:${email}`;
    const storedToken = await redisClient.get(refreshKey);
    if (!storedToken || storedToken !== refreshToken) {
      throw new Error('Invalid refresh token');
    }

    await redisClient.del(refreshKey);
  }
}
