import Container from "../lib/container/container";
import { Router } from "express";
import { createAuthRoutes } from "./auth.routes";
import { AuthController } from "../controllers/auth.controller";
import { UserController } from "../controllers/user.controller";
import { createUserRoutes } from "./user.routes";

export default function setupRoutes(): Router {
    const router = Router();
    const container = Container.getInstance();

    const authController = container.get<AuthController>('AuthController');
    const userController = container.get<UserController>('UserController');

    router.use('/auth', createAuthRoutes(authController));
    router.use('/user', createUserRoutes(userController));

    return router;
}