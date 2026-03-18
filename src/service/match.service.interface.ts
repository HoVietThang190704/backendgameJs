import { MatchDocument } from "../model/match";

export interface IMatchService {
  createPrivateMatch(hostId: string): Promise<MatchDocument>;
  getActiveMatchForUser(userId: string): Promise<MatchDocument | null>;
}
