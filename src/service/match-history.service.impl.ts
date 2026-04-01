import { MatchDocument } from "../model/match";
import { IMatchHistoryService } from "./match-history.service.interface";

export type MatchHistoryItem = {
  matchId: string;
  result: "win" | "lose" | "draw";
  opponent: {
    displayName: string;
    avatar: string;
  };
  duration: string;
  eloChange: number;
  playedAt: Date;
};

export class MatchHistoryService implements IMatchHistoryService {
  buildMatchHistoryItems(matches: MatchDocument[], userId: string): MatchHistoryItem[] {
    return matches.map((match) => {
      const userInMatch = match.players.find((p) => p.userId.toString() === userId);
      const opponentInMatch = match.players.find((p) => p.userId.toString() !== userId);

      let result: "win" | "lose" | "draw" = "draw";
      if (userInMatch && opponentInMatch) {
        if (userInMatch.health === 0) result = "lose";
        else if (opponentInMatch.health === 0) result = "win";
        else result = "draw";
      } else if (userInMatch && !opponentInMatch) {
        result = "win";
      }

      const opponentUser: any = opponentInMatch?.userId;
      const opponentDisplayName = opponentUser?.name || opponentUser?.username || "Unknown";
      const opponentAvatar = opponentUser?.avatar_url || "";

      const playedAt = match.updatedAt ?? match.createdAt ?? new Date();
      const startAt = match.startedAt ?? match.createdAt ?? playedAt;
      const durationMs = Math.max(0, playedAt.getTime() - startAt.getTime());
      const durationSec = Math.floor(durationMs / 1000);
      const durationMin = Math.floor(durationSec / 60);
      const durationStr = `${durationMin}m ${durationSec % 60}s`;

      return {
        matchId: match._id?.toString() ?? "",
        result,
        opponent: {
          displayName: opponentDisplayName,
          avatar: opponentAvatar,
        },
        duration: durationStr,
        eloChange: 0,
        playedAt,
      };
    });
  }
}
