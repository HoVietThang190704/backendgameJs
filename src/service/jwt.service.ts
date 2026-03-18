import jwt from "jsonwebtoken";

export interface JwtPayload {
  userId?: string;
  email?: string;
  rule?: string;
  sub?: string;
  iat?: number;
  exp?: number;
}

const secretKey = process.env.JWT_SECRET_KEY as string;
const refreshSecretKey = process.env.JWT_REFRESH_SECRET_KEY || secretKey;
const accessTokenExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "1h";
const refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

function durationToSeconds(value: string): number | null {
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const match = trimmed.match(/^(\d+)([smhd])$/i);
  if (!match) {
    return null;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case "s":
      return amount;
    case "m":
      return amount * 60;
    case "h":
      return amount * 60 * 60;
    case "d":
      return amount * 60 * 60 * 24;
    default:
      return null;
  }
}
export class JwtService {
  static instance: JwtService;
  static getInstance(): JwtService {
    if (!JwtService.instance) {
      JwtService.instance = new JwtService();
    }
    return JwtService.instance;
  }
  constructor() {}

  async issueAccessToken(payload: JwtPayload): Promise<string> {
    const expiresIn = accessTokenExpiresIn as jwt.SignOptions["expiresIn"];
    const token = jwt.sign(payload, secretKey, { expiresIn });
    return token;
  }

  async issueRefreshToken(payload: JwtPayload): Promise<string> {
    const expiresIn = refreshTokenExpiresIn as jwt.SignOptions["expiresIn"];
    const token = jwt.sign(payload, refreshSecretKey, { expiresIn });
    return token;
  }

  async verifyAccessToken(token: string): Promise<JwtPayload | null> {
    try {
      const decoded = jwt.verify(token, secretKey);
      return decoded as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<JwtPayload | null> {
    try {
      const decoded = jwt.verify(token, refreshSecretKey);
      return decoded as JwtPayload;
    } catch (error) {
      return null;
    }
  }

  getRefreshTokenTtlSeconds(): number | null {
    return durationToSeconds(refreshTokenExpiresIn);
  }
  
}