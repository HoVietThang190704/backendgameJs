import { MatchDocument } from "../model/match";
import { MatchStatePayload } from "./match-state.service.impl";

export interface IMatchStateService {
  buildMatchStatePayload(match: MatchDocument): Promise<MatchStatePayload>;
}
