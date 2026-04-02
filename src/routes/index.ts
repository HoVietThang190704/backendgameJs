import Container from "../lib/container/container";
import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { createAuthRoutes } from "./auth.routes";
import { AuthController } from "../controllers/auth.controller";
import { UserController } from "../controllers/user.controller";
import { createUserRoutes } from "./user.routes";
import { createMatchRoutes } from "./match.routes";
import { createWaitingQueueRoutes } from "./waitingQueue.routes";
import { createFriendRoutes } from "./friend.routes";
import { MatchController } from "../controllers/match.controller";
import { WaitingQueueController } from "../controllers/waitingQueue.controller";
import { FriendController } from "../controllers/friend.controller";

export default function setupRoutes(): Router {
    const router = Router();
    const container = Container.getInstance();

    const authController = container.get<AuthController>('AuthController');
    const userController = container.get<UserController>('UserController');
    const matchController = container.get<MatchController>('MatchController');
    const waitingQueueController = container.get<WaitingQueueController>('WaitingQueueController');
    const friendController = container.get<FriendController>('FriendController');

    router.use('/auth', createAuthRoutes(authController));
    router.use('/user', createUserRoutes(userController));
    router.use('/matches', createMatchRoutes(matchController));
    router.use('/matches', createWaitingQueueRoutes(waitingQueueController));
    router.use('/friends', createFriendRoutes(friendController));

    router.get('/match-history', authMiddleware, (req, res) => matchController.getMatchHistory(req, res));

    return router;
}