import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticateToken } from "../middleware/auth";

export function createUserRoutes(userController: UserController): Router {
    const router = Router();

    router.post("/register", (req, res) => userController.registerUser(req, res));
    router.post("/login", (req, res) => userController.loginUser(req, res));
    router.post("/refresh", (req, res) => userController.refreshToken(req, res));
    router.get("/profile/:id", authenticateToken, (req, res) => userController.getProfile(req, res));

    return router;
}