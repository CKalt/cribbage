'use client';

/**
 * Custom hook that wraps game actions with game context
 * Provides easy-to-use interface for components
 */

import { useCallback } from 'react';
import { useGameContext } from '@/contexts/GameContext';
import * as gameActions from '@/lib/gameActions';
import { Card } from '@/types/game';

/**
 * Hook that provides game actions bound to the current game context
 */
export function useGameActions() {
  const context = useGameContext();

  // Create setter object for passing to game actions
  const setters: gameActions.GameStateSetter = {
    setGamePhase: context.setGamePhase,
    setDeck: context.setDeck,
    setPlayerHand: context.setPlayerHand,
    setComputerHand: context.setComputerHand,
    setCrib: context.setCrib,
    setStarterCard: context.setStarterCard,
    setPlayerScore: context.setPlayerScore,
    setComputerScore: context.setComputerScore,
    setDealer: context.setDealer,
    setMessage: context.setMessage,
    setSelectedCards: context.setSelectedCards,
    setPeggingPile: context.setPeggingPile,
    setPeggingCount: context.setPeggingCount,
    setPeggingTurn: context.setPeggingTurn,
    setPlayerPeggingHand: context.setPlayerPeggingHand,
    setComputerPeggingHand: context.setComputerPeggingHand,
    setPlayerPassedGo: context.setPlayerPassedGo,
    setComputerPassedGo: context.setComputerPassedGo,
    setLastPegger: context.setLastPegger,
    setPlayerCutCard: context.setPlayerCutCard,
    setComputerCutCard: context.setComputerCutCard,
    setDeckForCutting: context.setDeckForCutting,
    setCutPosition: context.setCutPosition,
  };

  // Wrap cutForDeal
  const cutForDeal = useCallback(() => {
    gameActions.cutForDeal(setters);
  }, [setters]);

  // Wrap handlePlayerCut
  const handlePlayerCut = useCallback(
    (position: number) => {
      gameActions.handlePlayerCut(
        position,
        {
          gamePhase: context.gamePhase,
          deckForCutting: context.deckForCutting,
        },
        setters
      );
    },
    [context.gamePhase, context.deckForCutting, setters]
  );

  // Wrap dealHands
  const dealHands = useCallback(() => {
    gameActions.dealHands(context.dealer, setters);
  }, [context.dealer, setters]);

  // Wrap toggleCardSelection
  const toggleCardSelection = useCallback(
    (card: Card) => {
      gameActions.toggleCardSelection(card, context.selectedCards, setters);
    },
    [context.selectedCards, setters]
  );

  // Wrap confirmDiscard
  const confirmDiscard = useCallback(() => {
    gameActions.confirmDiscard(
      {
        selectedCards: context.selectedCards,
        playerHand: context.playerHand,
        computerHand: context.computerHand,
      },
      setters
    );
  }, [context.selectedCards, context.playerHand, context.computerHand, setters]);

  // Wrap cutStarter
  const cutStarter = useCallback(() => {
    gameActions.cutStarter(
      {
        deck: context.deck,
        dealer: context.dealer,
      },
      setters
    );
  }, [context.deck, context.dealer, setters]);

  // Forward declarations for recursive callbacks
  let computerPegAction: () => void;
  let startCountingAction: () => void;
  let checkWinAction: () => void;

  // Wrap startPegging
  const startPegging = useCallback(() => {
    gameActions.startPegging(
      {
        playerHand: context.playerHand,
        computerHand: context.computerHand,
        dealer: context.dealer,
      },
      setters,
      () => computerPegAction()
    );
  }, [context.playerHand, context.computerHand, context.dealer, setters]);

  // Wrap playerPeg
  const playerPeg = useCallback(
    (card: Card) => {
      gameActions.playerPeg(
        card,
        {
          peggingCount: context.peggingCount,
          peggingPile: context.peggingPile,
          playerPeggingHand: context.playerPeggingHand,
          computerPeggingHand: context.computerPeggingHand,
          lastPegger: context.lastPegger,
        },
        setters,
        () => startCountingAction(),
        () => computerPegAction()
      );
    },
    [
      context.peggingCount,
      context.peggingPile,
      context.playerPeggingHand,
      context.computerPeggingHand,
      context.lastPegger,
      setters,
    ]
  );

  // Wrap playerSayGo
  const playerSayGo = useCallback(() => {
    gameActions.playerSayGo(
      {
        computerPassedGo: context.computerPassedGo,
        lastPegger: context.lastPegger,
        playerPeggingHand: context.playerPeggingHand,
        computerPeggingHand: context.computerPeggingHand,
      },
      setters,
      () => startCountingAction(),
      () => computerPegAction()
    );
  }, [
    context.computerPassedGo,
    context.lastPegger,
    context.playerPeggingHand,
    context.computerPeggingHand,
    setters,
  ]);

  // Wrap computerPeg
  const computerPeg = useCallback(() => {
    gameActions.computerPeg(
      {
        computerPeggingHand: context.computerPeggingHand,
        peggingCount: context.peggingCount,
        peggingPile: context.peggingPile,
        playerPassedGo: context.playerPassedGo,
        lastPegger: context.lastPegger,
        playerPeggingHand: context.playerPeggingHand,
      },
      setters,
      () => startCountingAction(),
      () => computerPegAction()
    );
  }, [
    context.computerPeggingHand,
    context.peggingCount,
    context.peggingPile,
    context.playerPassedGo,
    context.lastPegger,
    context.playerPeggingHand,
    setters,
  ]);

  // Wrap startCounting
  const startCounting = useCallback(() => {
    gameActions.startCounting(
      {
        dealer: context.dealer,
        computerHand: context.computerHand,
        playerHand: context.playerHand,
        crib: context.crib,
        starterCard: context.starterCard,
      },
      setters,
      () => checkWinAction()
    );
  }, [
    context.dealer,
    context.computerHand,
    context.playerHand,
    context.crib,
    context.starterCard,
    setters,
  ]);

  // Wrap checkWinAndContinue
  const checkWinAndContinue = useCallback(() => {
    gameActions.checkWinAndContinue(
      {
        playerScore: context.playerScore,
        computerScore: context.computerScore,
      },
      setters
    );
  }, [context.playerScore, context.computerScore, setters]);

  // Wrap nextRound
  const nextRound = useCallback(() => {
    gameActions.nextRound(context.dealer, setters);
  }, [context.dealer, setters]);

  // Wrap newGame
  const newGame = useCallback(() => {
    gameActions.newGame(setters);
  }, [setters]);

  // Assign the callbacks for recursive use
  computerPegAction = computerPeg;
  startCountingAction = startCounting;
  checkWinAction = checkWinAndContinue;

  return {
    cutForDeal,
    handlePlayerCut,
    dealHands,
    toggleCardSelection,
    confirmDiscard,
    cutStarter,
    startPegging,
    playerPeg,
    playerSayGo,
    computerPeg,
    startCounting,
    checkWinAndContinue,
    nextRound,
    newGame,
  };
}
