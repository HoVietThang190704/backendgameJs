import { Types } from "mongoose";
import { MatchDocument } from "../model/match";
import { IMatchRepository } from "../repository/match.repository.interface";
import { IMatchService } from "./match.service.interface";
import { ApplyMoveResult, IGameLogicService } from "./game-logic.service.interface";

type BombCoordinate = {
  x: number;
  y: number;
};

type RevealedCell = BombCoordinate & {
  adjacentMines: number;
};

export class GameLogicService implements IGameLogicService {
  private readonly matchRepository: IMatchRepository;
  private readonly matchService: IMatchService;

  constructor(matchRepository: IMatchRepository, matchService: IMatchService) {
    this.matchRepository = matchRepository;
    this.matchService = matchService;
  }

  async applyMove(matchId: string, userId: string, x: number, y: number, action: string): Promise<ApplyMoveResult> {
    const match = await this.matchRepository.findMatchById(matchId);
    if (!match) {
      throw new Error("Match not found");
    }

    if (match.status !== "playing") {
      throw new Error("Match is not in playing state");
    }

    const attackerIndex = match.players.findIndex((player) => player.userId.toString() === userId);
    if (attackerIndex < 0) {
      throw new Error("Player is not in this match");
    }

    const currentTurn = match.currentTurn?.toString();
    if (!currentTurn || currentTurn !== userId) {
      throw new Error("Not your turn");
    }

    const opponentIndex = attackerIndex === 0 ? 1 : 0;
    const attacker = match.players[attackerIndex];
    const opponent = match.players[opponentIndex];
    if (!opponent) {
      throw new Error("Opponent not found");
    }

    if (action === "flag") {
      const nextTurn = opponent.userId.toString();
      const moveResult: ApplyMoveResult = {
        matchId,
        playerId: userId,
        x,
        y,
        action,
        result: "safe",
        health: attacker.health ?? 3,
        revealedCells: [],
        nextTurn,
        gameOver: false,
        winnerId: null,
        loserId: null,
      };

      await this.matchService.addMove(matchId, {
        playerId: userId,
        x,
        y,
        action,
        result: moveResult.result,
        revealedCells: [],
      });

      await this.matchService.setCurrentTurn(matchId, nextTurn);
      return moveResult;
    }

    const bombs = this.resolveBombs(match, opponentIndex);
    const hitBomb = bombs.some((bomb) => bomb.x === x && bomb.y === y);

    const currentHealth = attacker.health ?? 3;
    const updatedHealth = hitBomb ? Math.max(0, currentHealth - 1) : currentHealth;
    const revealedCells = hitBomb
      ? []
      : this.revealCells(match, opponentIndex, x, y, bombs);

    const updatedPlayers = match.players.map((player, index) => {
      const basePlayer = typeof (player as { toObject?: () => unknown }).toObject === "function"
        ? (player as { toObject: () => { userId: Types.ObjectId; isReady: boolean; health: number; _id?: Types.ObjectId } }).toObject()
        : {
            userId: player.userId,
            isReady: player.isReady,
            health: player.health,
          };

      if (index !== attackerIndex) {
        return basePlayer;
      }

      return {
        ...basePlayer,
        health: updatedHealth,
      };
    });

    const moveResult: ApplyMoveResult = {
      matchId,
      playerId: userId,
      x,
      y,
      action,
      result: hitBomb ? "bomb" : "safe",
      health: updatedHealth,
      revealedCells,
      nextTurn: null,
      gameOver: false,
      winnerId: null,
      loserId: null,
    };

    const opponentSafeCellCount = this.resolveSafeCellCount(match, opponentIndex);
    const revealedSafeCellCount = this.countRevealedSafeCells(match, attackerIndex, revealedCells);
    const clearedAllSafeCells = revealedSafeCellCount >= opponentSafeCellCount && opponentSafeCellCount > 0;

    if (updatedHealth === 0 || clearedAllSafeCells) {
      moveResult.gameOver = true;
      moveResult.winnerId = updatedHealth === 0 ? opponent.userId.toString() : userId;
      moveResult.loserId = updatedHealth === 0 ? userId : opponent.userId.toString();
    }

    await this.matchService.addMove(matchId, {
      playerId: userId,
      x,
      y,
      action,
      result: moveResult.result,
      revealedCells: moveResult.revealedCells,
    });

    if (moveResult.gameOver) {
      if (!moveResult.winnerId) {
        throw new Error("Unable to determine match winner");
      }

      await this.matchService.updateMatch(matchId, {
        players: updatedPlayers,
      });
      return moveResult;
    }

    moveResult.nextTurn = opponent.userId.toString();
    await this.matchService.updateMatch(matchId, { players: updatedPlayers });
    const nextTurn = moveResult.nextTurn;
    if (!nextTurn) {
      throw new Error("Unable to determine next turn");
    }
    await this.matchService.setCurrentTurn(matchId, nextTurn);

    return moveResult;
  }

  buildTargetBoardState(match: MatchDocument, userId: string) {
    const attackerIndex = match.players.findIndex((player) => player.userId.toString() === userId);
    const opponentIndex = attackerIndex === 0 ? 1 : 0;
    const bombs = this.resolveBombs(match, opponentIndex);

    return {
      bombs,
      revealed: [],
      flags: [],
    };
  }

  private revealCells(match: MatchDocument, boardIndex: number, startX: number, startY: number, bombs: BombCoordinate[]): RevealedCell[] {
    const board = this.resolveBoard(match);
    const rows = board.rows;
    const cols = board.cols;
    const bombSet = new Set(bombs.map((bomb) => `${bomb.x}:${bomb.y}`));
    const visited = new Set<string>();
    const queue: BombCoordinate[] = [{ x: startX, y: startY }];
    const revealedCells: RevealedCell[] = [];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        continue;
      }

      const key = `${current.x}:${current.y}`;
      if (visited.has(key) || bombSet.has(key)) {
        continue;
      }

      visited.add(key);
      const adjacentMines = this.countAdjacentBombs(current.x, current.y, bombSet, rows, cols);
      revealedCells.push({ x: current.x, y: current.y, adjacentMines });

      if (adjacentMines !== 0) {
        continue;
      }

      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          if (dx === 0 && dy === 0) {
            continue;
          }

          const nextX = current.x + dx;
          const nextY = current.y + dy;
          const nextKey = `${nextX}:${nextY}`;

          if (nextX < 0 || nextX >= rows || nextY < 0 || nextY >= cols) {
            continue;
          }

          if (!visited.has(nextKey) && !bombSet.has(nextKey)) {
            queue.push({ x: nextX, y: nextY });
          }
        }
      }
    }

    return revealedCells;
  }

  private countAdjacentBombs(x: number, y: number, bombSet: Set<string>, rows: number, cols: number): number {
    let count = 0;

    for (let dx = -1; dx <= 1; dx += 1) {
      for (let dy = -1; dy <= 1; dy += 1) {
        if (dx === 0 && dy === 0) {
          continue;
        }

        const nextX = x + dx;
        const nextY = y + dy;
        if (nextX < 0 || nextX >= rows || nextY < 0 || nextY >= cols) {
          continue;
        }

        if (bombSet.has(`${nextX}:${nextY}`)) {
          count += 1;
        }
      }
    }

    return count;
  }

  private resolveSafeCellCount(match: MatchDocument, boardIndex: number): number {
    const board = this.resolveBoard(match);
    const bombs = this.resolveBombs(match, boardIndex);
    return Math.max(0, board.rows * board.cols - bombs.length);
  }

  private countRevealedSafeCells(match: MatchDocument, attackerIndex: number, currentMoveCells: RevealedCell[]): number {
    const previousMoveKeys = new Set<string>();

    (match.moves || []).forEach((move) => {
      if (move.playerId.toString() !== match.players[attackerIndex]?.userId.toString()) {
        return;
      }

      const revealedCells = move.action === "open"
        ? Array.isArray(move.revealedCells) && move.revealedCells.length > 0
          ? move.revealedCells
          : move.result === "safe"
            ? [{ x: move.x, y: move.y, adjacentMines: 0 }]
            : []
        : [];

      revealedCells.forEach((cell) => {
        if (cell.adjacentMines >= 0) {
          previousMoveKeys.add(`${cell.x}:${cell.y}`);
        }
      });
    });

    currentMoveCells.forEach((cell) => {
      if (cell.adjacentMines >= 0) {
        previousMoveKeys.add(`${cell.x}:${cell.y}`);
      }
    });

    return previousMoveKeys.size;
  }

  private resolveBoard(match: MatchDocument) {
    return match.gameBoard ?? { rows: 10, cols: 10, bombs: 20 };
  }

  private resolveBombs(match: MatchDocument, boardIndex: number): BombCoordinate[] {
    const bombs = boardIndex === 0 ? match.player1Bombs : match.player2Bombs;
    if (!Array.isArray(bombs)) {
      return [];
    }

    return bombs
      .filter((bomb) => Boolean(bomb) && Number.isFinite(bomb.x) && Number.isFinite(bomb.y))
      .map((bomb) => ({ x: Number(bomb.x), y: Number(bomb.y) }));
  }
}