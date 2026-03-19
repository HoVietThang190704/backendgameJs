import { MatchInput } from "../model/match";

export interface SocketAuth {
  token?: string;
}

export type ConnectedUser = {
  userId: string;
  email?: string;
  matchId?: string;
};

export type MatchPlayer = MatchInput["players"][number];
