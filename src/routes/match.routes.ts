import { Router } from "express";
import { MatchController } from "../controllers/match.controller";
import { authMiddleware } from "../middleware/auth.middleware";

export function createMatchRoutes(matchController: MatchController): Router {
  const router = Router();

  // Create private room (match)
  router.post("/create", authMiddleware, (req, res) => matchController.createPrivateMatch(req, res));

  return router;
}
