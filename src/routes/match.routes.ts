import { Router } from "express";
import { MatchController } from "../controllers/match.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export function createMatchRoutes(matchController: MatchController): Router {
  const router = Router();

  /**
   * @openapi
   * /api/matches/create:
   *   post:
   *     summary: Create a private match room
   *     tags:
   *       - Match
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       201:
   *         description: Match created
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BaseResponse'
   *       401:
   *         description: Unauthorized
   *       400:
   *         description: Bad request
   */
  router.post("/create", authMiddleware, (req, res) => matchController.createPrivateMatch(req, res));

  /**
   * @openapi
   * /api/matches/join:
   *   post:
   *     summary: Join an existing match room by ID
   *     tags:
   *       - Match
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               matchId:
   *                 type: string
   *                 example: "642f1e7dc1d3d75b8f89c789"
   *     responses:
   *       200:
   *         description: Joined match successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BaseResponse'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Match not found
   *       400:
   *         description: Bad request
   */
  router.post("/join", authMiddleware, (req, res) => matchController.joinMatch(req, res));

  /**
   * @openapi
   * /api/matches/{id}:
   *   get:
   *     summary: Get match state (board and player status)
   *     tags:
   *       - Match
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Match state
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BaseResponse'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Match not found
   */
  router.get("/:id", authMiddleware, (req, res) => matchController.getMatchState(req, res));

  /**
   * @openapi
   * /api/matches/{id}/leave:
   *   delete:
   *     summary: Leave a match
   *     tags:
   *       - Match
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Left match successfully or match deleted
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BaseResponse'
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Match not found
   */
  router.delete("/:id/leave", authMiddleware, (req, res) => matchController.leaveMatch(req, res));

  /**
   * @openapi
   * /api/matches/{id}/ready:
   *   patch:
   *     summary: Set player ready status
   *     tags:
   *       - Match
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               isReady:
   *                 type: boolean
   *     responses:
   *       200:
   *         description: Status updated
   *       401:
   *         description: Unauthorized
   *       404:
   *         description: Match not found
   *       400:
   *         description: Bad request
   */
  router.patch("/:id/ready", authMiddleware, (req, res) => matchController.setReady(req, res));

  /**
   * @openapi
   * /api/matches/{matchId}/start:
   *   post:
   *     summary: Start match and initialize bomb maps
   *     tags:
   *       - Match
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: matchId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Match started
   *       401:
   *         description: Unauthorized
   *       403:
   *         description: Forbidden
   *       404:
   *         description: Match not found
   *       400:
   *         description: Bad request
   */
  router.post("/:matchId/start", authMiddleware, (req, res) => matchController.startMatch(req, res));

  /**
   * @openapi
   * /api/matches/find:
   *   post:
   *     summary: Start searching for an opponent
   *     tags:
   *       - Match
   *     security:
   *       - BearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               boardSize:
   *                 type: string
   *                 enum: [small, medium, large]
   *                 example: "medium"
   *     responses:
   *       200:
   *         description: Searching for opponent
   *       401:
   *         description: Unauthorized
   *       400:
   *         description: Bad request
   */
  router.post("/find", authMiddleware, (req, res) => matchController.findMatch(req, res));

  /**
   * @openapi
   * /api/matches/cancel:
   *   delete:
   *     summary: Cancel searching for an opponent
   *     tags:
   *       - Match
   *     security:
   *       - BearerAuth: []
   *     responses:
   *       200:
   *         description: Search cancelled or no active queue entry
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/BaseResponse'
   *       401:
   *         description: Unauthorized
   *       400:
   *         description: Bad request
   */
  router.delete("/cancel", authMiddleware, (req, res) => matchController.cancelMatch(req, res));

  return router;
}
