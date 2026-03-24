import { Match, MatchDocument, MatchInput } from "../model/match";

export interface IMatchRepository {
  createMatch(match: MatchInput): Promise<MatchDocument>;
  findMatchById(matchId: string): Promise<MatchDocument | null>;
  findActiveMatchByUserId(userId: string): Promise<MatchDocument | null>;
  findMatchByPinCode(pinCode: string): Promise<MatchDocument | null>;
  updateMatch(matchId: string, update: Partial<MatchInput>): Promise<MatchDocument | null>;
  deleteMatch(matchId: string): Promise<MatchDocument | null>;
}
