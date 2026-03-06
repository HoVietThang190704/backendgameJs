import Container from "../lib/container/container";
import { Router } from "express";
import { createAuthRoutes } from "./auth.routes";
import { AuthController } from "../controllers/auth.controller";

export default function setupRoutes(): Router {
    const router = Router();
    const container = Container.getInstance();

    const authController = container.get<AuthController>('AuthController');

    router.use('/auth', createAuthRoutes(authController));

    return router;
}