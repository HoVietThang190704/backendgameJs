import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export function createUserRoutes(userController: UserController): Router {
    const router = Router();

    /**
     * @openapi
     * /api/user/profile:
     *   get:
     *     summary: Get authenticated user profile
     *     tags:
     *       - User
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: query
     *         name: fields
     *         schema:
     *           type: string
    *         description: "Select fields to include in response, comma-separated (ex: username,email,name)"
     *     responses:
     *       200:
     *         description: User profile retrieved
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/BaseResponse'
     *       401:
     *         description: User not authenticated
     *       500:
     *         description: Internal server error
     */
    router.get('/profile', authMiddleware, (req, res) => userController.getProfile(req, res));

    router.get('/leaderboard', authMiddleware, (req, res) => userController.getLeaderboard(req, res));

    return router;
}
