import { NextFunction } from 'express';
import { JwtPayload, JwtService } from '../service/jwt.service';
import { Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const jwtService = JwtService.getInstance();
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token missing' });
  }
  const payload: JwtPayload | null = await jwtService.verifyAccessToken(token);
  if (!payload || !payload.userId) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  req.userId = payload.userId;
  next();
}
