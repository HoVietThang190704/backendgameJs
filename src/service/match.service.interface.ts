import { MatchDocument, MatchInput } from "../model/match";

export interface IMatchService {
  createPrivateMatch(hostId: string): Promise<MatchDocument>;
  getActiveMatchForUser(userId: string): Promise<MatchDocument | null>;
  getMatchById(matchId: string): Promise<MatchDocument | null>;
  getMatchHistory(userId: string, page: number, limit: number): Promise<MatchDocument[]>;
  addPlayerToMatch(matchId: string, userId: string): Promise<MatchDocument | null>;
  setPlayerReady(matchId: string, userId: string, ready: boolean): Promise<MatchDocument | null>;
  startMatch(matchId: string, requestedByUserId?: string, enforceHostCheck?: boolean): Promise<MatchDocument | null>;
  setCurrentTurn(matchId: string, userId: string): Promise<MatchDocument | null>;
  setMatchStatus(matchId: string, status: string): Promise<MatchDocument | null>;
  setPlayerBombs(matchId: string, userId: string, bombs: Array<{ x: number; y: number }>): Promise<MatchDocument | null>;
  addMove(matchId: string, move: { playerId: string; x: number; y: number; action: string; result: string; revealedCells?: Array<{ x: number; y: number; adjacentMines: number }> }): Promise<MatchDocument | null>;
  clearCurrentMatchForPlayers(matchId: string): Promise<void>;
  finalizeMatch(matchId: string, winnerId: string, loserId: string): Promise<{ winnerEloDelta: number; loserEloDelta: number }>;
  updateMatch(matchId: string, update: Partial<MatchInput>): Promise<MatchDocument | null>;
  leaveMatch(matchId: string, userId: string): Promise<MatchDocument | null>;
}
