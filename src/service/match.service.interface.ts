import { MatchDocument, MatchInput } from "../model/match";

export interface IMatchService {
  createPrivateMatch(hostId: string): Promise<MatchDocument>;
  getActiveMatchForUser(userId: string): Promise<MatchDocument | null>;
  getMatchById(matchId: string): Promise<MatchDocument | null>;
  addPlayerToMatch(matchId: string, userId: string): Promise<MatchDocument | null>;
  setPlayerReady(matchId: string, userId: string, ready: boolean): Promise<MatchDocument | null>;
  startMatch(matchId: string, requestedByUserId?: string, enforceHostCheck?: boolean): Promise<MatchDocument | null>;
  setCurrentTurn(matchId: string, userId: string): Promise<MatchDocument | null>;
  setMatchStatus(matchId: string, status: string): Promise<MatchDocument | null>;
  addMove(matchId: string, move: { playerId: string; x: number; y: number; action: string; result: string }): Promise<MatchDocument | null>;
  updateMatch(matchId: string, update: Partial<MatchInput>): Promise<MatchDocument | null>;
}
