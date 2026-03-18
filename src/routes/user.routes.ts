import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export function createUserRoutes(userController: UserController): Router {
    const router = Router();

    router.get('/profile', authMiddleware, (req, res) => userController.getProfile(req, res));

    return router;
}
