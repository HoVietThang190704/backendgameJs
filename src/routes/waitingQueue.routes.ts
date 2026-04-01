import { Router } from "express";
import { WaitingQueueController } from "../controllers/waitingQueue.controller";
import { authMiddleware } from "../middleware/auth.middleware";

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BaseResponse'
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Bad request
 */
export function createWaitingQueueRoutes(waitingQueueController: WaitingQueueController): Router {
  const router = Router();

  router.post("/find", authMiddleware, (req, res) => waitingQueueController.findMatch(req, res));

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
  router.delete("/cancel", authMiddleware, (req, res) => waitingQueueController.cancelMatch(req, res));

  return router;
}
