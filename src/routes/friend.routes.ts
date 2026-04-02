import { Router } from "express";
import { FriendController } from "../controllers/friend.controller";
import { authMiddleware } from "../middleware/auth.middleware";

/**
 * @openapi
 * /friends/request:
 *   post:
 *     tags:
 *       - Friend
 *     summary: Send a friend request
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FriendRequest'
 *     responses:
 *       201:
 *         description: Friend request sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 *       400:
 *         description: Bad request
 * /friends/remove:
 *   delete:
 *     tags:
 *       - Friend
 *     summary: Remove a friend
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               friendId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Friend removed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 * /friends:
 *   get:
 *     tags:
 *       - Friend
 *     summary: Get friend list
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Getting friends list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 * /friends/incoming:
 *   get:
 *     tags:
 *       - Friend
 *     summary: Get incoming friend requests
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Incoming requests list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 * /friends/response:
 *   post:
 *     tags:
 *       - Friend
 *     summary: Respond to friend request
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requesterId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected, blocked]
 *     responses:
 *       200:
 *         description: Friend request updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 */
export function createFriendRoutes(friendController: FriendController): Router {
  const router = Router();

  router.post("/request", authMiddleware, (req, res) => friendController.sendRequest(req, res));
  router.delete("/remove", authMiddleware, (req, res) => friendController.removeFriend(req, res));
  router.get("/", authMiddleware, (req, res) => friendController.getFriends(req, res));
  router.get("/incoming", authMiddleware, (req, res) => friendController.getIncomingRequests(req, res));
  router.post("/response", authMiddleware, (req, res) => friendController.respondToRequest(req, res));

  return router;
}
