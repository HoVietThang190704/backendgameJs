import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export function createUserRoutes(userController: UserController): Router {
    const router = Router();

    /**
     * @openapi
     * /user/profile:
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

    /**
     * @openapi
     * /user/search:
     *   get:
     *     summary: Search users by name or username
     *     tags:
     *       - User
     *     security:
     *       - BearerAuth: []
     *     parameters:
     *       - in: query
     *         name: name
     *         schema:
     *           type: string
     *         required: true
     *         description: Search term for user name or username
     *     responses:
     *       200:
     *         description: List of users matching query
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/BaseResponse'
     *       400:
     *         description: Invalid query
     *       500:
     *         description: Internal server error
     */

    router.get('/search', authMiddleware, (req, res) => userController.searchUsers(req, res));

    router.get('/leaderboard', authMiddleware, (req, res) => userController.getLeaderboard(req, res));

    return router;
}
