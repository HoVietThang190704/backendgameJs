import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.sendStatus(401);

    const secret = process.env.JWT_SECRET || "secret";
    jwt.verify(token, secret, (err: jwt.VerifyErrors | null, decoded: jwt.JwtPayload | string | undefined) => {
        if (err || !decoded) return res.sendStatus(403);
        // attach payload to request for downstream handlers
        (req as any).user = decoded;
        next();
    });
}
