import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

export function createAuthRoutes(authController: AuthController): Router {
    const router = Router();

    router.post('/register', (req, res) => authController.register(req, res));
    router.post('/login', (req, res) => authController.login(req, res));
    router.post('/refresh', (req, res) => authController.refreshToken(req, res));
    return router;
}