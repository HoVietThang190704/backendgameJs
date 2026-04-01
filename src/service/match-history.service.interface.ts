import { MatchDocument } from "../model/match";
import { MatchHistoryItem } from "./match-history.service.impl";

export interface IMatchHistoryService {
  buildMatchHistoryItems(matches: MatchDocument[], userId: string): MatchHistoryItem[];
}
