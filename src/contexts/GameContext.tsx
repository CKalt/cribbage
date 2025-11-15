'use client';

/**
 * Game Context Provider for Cribbage
 * Manages all game state and provides it to child components
 */

import React, { createContext, useContext, useState, ReactNode, useRef } from 'react';
import { GameState, Card, Player, PeggingPlay, GamePhase } from '@/types/game';
import { INITIAL_GAME_STATE } from '@/lib/constants';
import { GameLogger } from '@/lib/gameLogger';

/**
 * Context value interface - includes state and setters
 */
interface GameContextValue extends GameState {
  // State setters
  setGamePhase: (phase: GamePhase) => void;
  setDeck: (deck: Card[]) => void;
  setPlayerHand: (hand: Card[]) => void;
  setComputerHand: (hand: Card[]) => void;
  setCrib: (crib: Card[]) => void;
  setStarterCard: (card: Card | null) => void;
  setPlayerScore: (score: number | ((prev: number) => number)) => void;
  setComputerScore: (score: number | ((prev: number) => number)) => void;
  setDealer: (dealer: Player | null) => void;
  setMessage: (message: string) => void;
  setSelectedCards: (cards: Card[]) => void;
  setPeggingPile: (pile: PeggingPlay[]) => void;
  setPeggingCount: (count: number) => void;
  setPeggingTurn: (turn: Player | null) => void;
  setPlayerPeggingHand: (hand: Card[]) => void;
  setComputerPeggingHand: (hand: Card[]) => void;
  setPlayerPassedGo: (passed: boolean) => void;
  setComputerPassedGo: (passed: boolean) => void;
  setLastPegger: (player: Player | null) => void;
  setPlayerCutCard: (card: Card | null) => void;
  setComputerCutCard: (card: Card | null) => void;
  setDeckForCutting: (deck: Card[]) => void;
  setCutPosition: (position: number | null) => void;
  // Logger functions
  getGameLogs: () => string; // Returns JSONL format
  clearGameLogs: () => void;
  getLogger: () => GameLogger;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

/**
 * Game Provider Component
 */
export function GameProvider({ children }: { children: ReactNode }) {
  // Create logger instance (persists across renders)
  const loggerRef = useRef(new GameLogger());

  const [gamePhase, setGamePhase] = useState<GamePhase>(INITIAL_GAME_STATE.gamePhase);
  const [deck, setDeck] = useState<Card[]>(INITIAL_GAME_STATE.deck);
  const [playerHand, setPlayerHand] = useState<Card[]>(INITIAL_GAME_STATE.playerHand);
  const [computerHand, setComputerHand] = useState<Card[]>(INITIAL_GAME_STATE.computerHand);
  const [crib, setCrib] = useState<Card[]>(INITIAL_GAME_STATE.crib);
  const [starterCard, setStarterCard] = useState<Card | null>(INITIAL_GAME_STATE.starterCard);
  const [playerScore, setPlayerScore] = useState<number>(INITIAL_GAME_STATE.playerScore);
  const [computerScore, setComputerScore] = useState<number>(INITIAL_GAME_STATE.computerScore);
  const [dealer, setDealer] = useState<Player | null>(INITIAL_GAME_STATE.dealer);
  const [message, setMessage] = useState<string>(INITIAL_GAME_STATE.message);
  const [selectedCards, setSelectedCards] = useState<Card[]>(INITIAL_GAME_STATE.selectedCards);
  const [peggingPile, setPeggingPile] = useState<PeggingPlay[]>(INITIAL_GAME_STATE.peggingPile);
  const [peggingCount, setPeggingCount] = useState<number>(INITIAL_GAME_STATE.peggingCount);
  const [peggingTurn, setPeggingTurn] = useState<Player | null>(INITIAL_GAME_STATE.peggingTurn);
  const [playerPeggingHand, setPlayerPeggingHand] = useState<Card[]>(INITIAL_GAME_STATE.playerPeggingHand);
  const [computerPeggingHand, setComputerPeggingHand] = useState<Card[]>(INITIAL_GAME_STATE.computerPeggingHand);
  const [playerPassedGo, setPlayerPassedGo] = useState<boolean>(INITIAL_GAME_STATE.playerPassedGo);
  const [computerPassedGo, setComputerPassedGo] = useState<boolean>(INITIAL_GAME_STATE.computerPassedGo);
  const [lastPegger, setLastPegger] = useState<Player | null>(INITIAL_GAME_STATE.lastPegger);
  const [playerCutCard, setPlayerCutCard] = useState<Card | null>(INITIAL_GAME_STATE.playerCutCard);
  const [computerCutCard, setComputerCutCard] = useState<Card | null>(INITIAL_GAME_STATE.computerCutCard);
  const [deckForCutting, setDeckForCutting] = useState<Card[]>(INITIAL_GAME_STATE.deckForCutting);
  const [cutPosition, setCutPosition] = useState<number | null>(INITIAL_GAME_STATE.cutPosition);

  // Logger functions
  const getGameLogs = () => loggerRef.current.getJSONL();
  const clearGameLogs = () => loggerRef.current.clear();
  const getLogger = () => loggerRef.current;

  const value: GameContextValue = {
    // State
    gamePhase,
    deck,
    playerHand,
    computerHand,
    crib,
    starterCard,
    playerScore,
    computerScore,
    dealer,
    message,
    selectedCards,
    peggingPile,
    peggingCount,
    peggingTurn,
    playerPeggingHand,
    computerPeggingHand,
    playerPassedGo,
    computerPassedGo,
    lastPegger,
    playerCutCard,
    computerCutCard,
    deckForCutting,
    cutPosition,
    // Setters
    setGamePhase,
    setDeck,
    setPlayerHand,
    setComputerHand,
    setCrib,
    setStarterCard,
    setPlayerScore,
    setComputerScore,
    setDealer,
    setMessage,
    setSelectedCards,
    setPeggingPile,
    setPeggingCount,
    setPeggingTurn,
    setPlayerPeggingHand,
    setComputerPeggingHand,
    setPlayerPassedGo,
    setComputerPassedGo,
    setLastPegger,
    setPlayerCutCard,
    setComputerCutCard,
    setDeckForCutting,
    setCutPosition,
    // Logger functions
    getGameLogs,
    clearGameLogs,
    getLogger,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/**
 * Custom hook to use the game context
 */
export function useGameContext() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
}
