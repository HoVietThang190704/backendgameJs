import { MatchDocument } from "../model/match";

export type ApplyMoveResult = {
  matchId: string;
  playerId: string;
  x: number;
  y: number;
  action: string;
  result: "bomb" | "safe";
  health: number;
  revealedCells: Array<{ x: number; y: number; adjacentMines: number }>;
  nextTurn: string | null;
  gameOver: boolean;
  winnerId: string | null;
  loserId: string | null;
};

export interface IGameLogicService {
  applyMove(matchId: string, userId: string, x: number, y: number, action: string): Promise<ApplyMoveResult>;
  buildTargetBoardState(match: MatchDocument, userId: string): {
    bombs: Array<{ x: number; y: number }>;
    revealed: Array<{ x: number; y: number }>;
    flags: Array<{ x: number; y: number }>;
  };
}