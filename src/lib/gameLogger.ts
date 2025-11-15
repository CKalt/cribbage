/**
 * Game Logger - Creates JSONL log entries for all game state changes
 */

import { Card, GamePhase, Player, PeggingPlay } from '@/types/game';

export interface GameLogEntry {
  timestamp: string;
  action: string;
  gamePhase: GamePhase;
  playerScore: number;
  computerScore: number;
  dealer?: Player | null;
  message?: string;
  playerHand?: Card[];
  computerHand?: Card[];
  crib?: Card[];
  starterCard?: Card | null;
  peggingPile?: PeggingPlay[];
  peggingCount?: number;
  peggingTurn?: Player | null;
  playerCutCard?: Card | null;
  computerCutCard?: Card | null;
  selectedCards?: Card[];
  details?: Record<string, any>;
}

export class GameLogger {
  private logs: GameLogEntry[] = [];

  /**
   * Add a log entry for a game action
   */
  log(entry: Omit<GameLogEntry, 'timestamp'>): void {
    const logEntry: GameLogEntry = {
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.logs.push(logEntry);
  }

  /**
   * Get all logs as JSONL string (one JSON object per line)
   */
  getJSONL(): string {
    return this.logs.map(entry => JSON.stringify(entry)).join('\n');
  }

  /**
   * Get all logs as array
   */
  getLogs(): GameLogEntry[] {
    return [...this.logs];
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
  }

  /**
   * Get log count
   */
  count(): number {
    return this.logs.length;
  }
}

/**
 * Helper to create a log entry from game state
 */
export function createLogEntry(
  action: string,
  gameState: {
    gamePhase: GamePhase;
    playerScore: number;
    computerScore: number;
    dealer?: Player | null;
    message?: string;
    playerHand?: Card[];
    computerHand?: Card[];
    crib?: Card[];
    starterCard?: Card | null;
    peggingPile?: PeggingPlay[];
    peggingCount?: number;
    peggingTurn?: Player | null;
    playerCutCard?: Card | null;
    computerCutCard?: Card | null;
    selectedCards?: Card[];
  },
  details?: Record<string, any>
): Omit<GameLogEntry, 'timestamp'> {
  return {
    action,
    gamePhase: gameState.gamePhase,
    playerScore: gameState.playerScore,
    computerScore: gameState.computerScore,
    dealer: gameState.dealer,
    message: gameState.message,
    playerHand: gameState.playerHand,
    computerHand: gameState.computerHand,
    crib: gameState.crib,
    starterCard: gameState.starterCard,
    peggingPile: gameState.peggingPile,
    peggingCount: gameState.peggingCount,
    peggingTurn: gameState.peggingTurn,
    playerCutCard: gameState.playerCutCard,
    computerCutCard: gameState.computerCutCard,
    selectedCards: gameState.selectedCards,
    details,
  };
}
