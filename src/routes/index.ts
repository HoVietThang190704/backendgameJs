import { Router } from "express";
import Container from "../lib/container/container";
import { UserController } from "../controllers/user.controller";
import { createUserRoutes } from "./user.routes";

export default function setupRoutes(): Router {
    const router = Router();
    const container = Container.getInstance();

    const userController = container.get<UserController>("UserController");

    router.use("/auth", createUserRoutes(userController));

    return router;
}