'use client';

// Main Cribbage Game Component

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

// Import game logic from lib/
import { createDeck, shuffleDeck } from '@/lib/deck';
import { calculateHandScore, calculatePeggingScore } from '@/lib/scoring';
import { computerSelectCrib, computerSelectPlay, DIFFICULTY_PROFILES } from '@/lib/ai';
import { aiRandom } from '@/lib/ai/rng';
import { rankOrder } from '@/lib/constants';
import {
  PERSISTED_STATE_KEYS,
  createGameStateSnapshot,
  deserializeGameState,
  shouldSaveGame,
  hasSignificantChange,
} from '@/lib/gameStateSerializer';

// Import UI components
import CribbageBoard from './CribbageBoard';
import PlayingCard, { PlayedCard, LargeCard, CutCard } from './PlayingCard';
import GameMessage from './GameMessage';
import GameStatus from './GameStatus';
import ScoreBreakdown from './ScoreBreakdown';
import DebugPanel from './DebugPanel';
import ScoreSelector from './ScoreSelector';
import CorrectScoreCelebration from './CorrectScoreCelebration';
import CelebrationToast from './CelebrationToast';
import DeckCut from './DeckCut';
import ActionButtons from './ActionButtons';
import FlyingCard from './FlyingCard';
import BugReportViewer from './BugReportViewer';
import AdminPanel from './AdminPanel';
import Leaderboard from './Leaderboard';
import { APP_VERSION } from '@/lib/version';
import { celebrateHand, celebratePegging, celebrateGameEnd, celebrateCut } from '@/lib/celebrations';
import { getRequiredAction, actionRequiresButton } from '@/lib/gameActions';
import { useRequiredAction, useActionDebug } from '@/hooks/useRequiredAction';

/**
 * Main game component with all state management and game logic
 */
export default function CribbageGame({ onLogout }) {
  // Get authenticated user for bug reports
  const { user } = useAuth();

  // Menu state
  const [showMenu, setShowMenu] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [showBugReportViewer, setShowBugReportViewer] = useState(false);
  const [unreadBugReports, setUnreadBugReports] = useState(0);
  const [showUnreadNotification, setShowUnreadNotification] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  // personalMessage state removed — now handled by VersionNotification

  // Game flow state
  const [gameState, setGameState] = useState('menu');
  const [dealer, setDealer] = useState('player');
  const [currentPlayer, setCurrentPlayer] = useState('player');
  const [message, setMessage] = useState('');

  // Deck/cards state
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [computerHand, setComputerHand] = useState([]);
  const [crib, setCrib] = useState([]);
  const [cutCard, setCutCard] = useState(null);
  const [pendingCutCard, setPendingCutCard] = useState(null); // For starter cut animation

  // Score state
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);

  // Selection state
  const [selectedCards, setSelectedCards] = useState([]);
  const [peggingSelectedCard, setPeggingSelectedCard] = useState(null);
  const [discardingCards, setDiscardingCards] = useState([]);

  // Play phase state
  const [playerPlayHand, setPlayerPlayHand] = useState([]);
  const [computerPlayHand, setComputerPlayHand] = useState([]);
  const [playerPlayedCards, setPlayerPlayedCards] = useState([]);
  const [computerPlayedCards, setComputerPlayedCards] = useState([]);
  const [allPlayedCards, setAllPlayedCards] = useState([]);
  const [currentCount, setCurrentCount] = useState(0);
  const [lastPlayedBy, setLastPlayedBy] = useState(null);
  const [lastGoPlayer, setLastGoPlayer] = useState(null);
  const [peggingHistory, setPeggingHistory] = useState([]); // Track all pegging plays for review
  const [showPeggingSummary, setShowPeggingSummary] = useState(false);
  const [countingHistory, setCountingHistory] = useState([]); // Track hand/crib counts for review
  const [showCountingHistory, setShowCountingHistory] = useState(false); // Toggle counting history panel
  const [computerCountingHand, setComputerCountingHand] = useState(null); // Track what computer is currently counting

  // Counting phase state
  const [countingTurn, setCountingTurn] = useState('');
  const [playerCountInput, setPlayerCountInput] = useState('');
  const [computerClaimedScore, setComputerClaimedScore] = useState(null);
  const [actualScore, setActualScore] = useState(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [counterIsComputer, setCounterIsComputer] = useState(null);
  const [handsCountedThisRound, setHandsCountedThisRound] = useState(0);
  const [isProcessingCount, setIsProcessingCount] = useState(false);
  const [pendingCountContinue, setPendingCountContinue] = useState(null); // Stores data for continuing after player acknowledges
  const [playerMadeCountDecision, setPlayerMadeCountDecision] = useState(false); // True after player accepts/objects
  const [showMugginsPreferenceDialog, setShowMugginsPreferenceDialog] = useState(false);
  const [pendingWrongMugginsResult, setPendingWrongMugginsResult] = useState(null); // Stores result to apply after preference chosen

  // Cutting phase state
  const [playerCutCard, setPlayerCutCard] = useState(null);
  const [computerCutCard, setComputerCutCard] = useState(null);
  const [cutResultReady, setCutResultReady] = useState(false); // True when cut result shown, waiting for user to proceed

  // Scoring state
  const [pendingScore, setPendingScore] = useState(null);

  // Clear pegging selection when not in play phase or not player's turn
  useEffect(() => {
    if (gameState !== 'play' || currentPlayer !== 'player' || pendingScore) {
      setPeggingSelectedCard(null);
    }
  }, [gameState, currentPlayer, pendingScore]);

  // Celebration state
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationScore, setCelebrationScore] = useState(null);

  // Card flight animation state
  const [flyingCard, setFlyingCard] = useState(null);
  const [landingCardIndex, setLandingCardIndex] = useState(-1);
  const [landingIsComputer, setLandingIsComputer] = useState(false);
  const playerPlayAreaRef = useRef(null);
  const computerPlayAreaRef = useRef(null);
  const computerHandRef = useRef(null);
  const cribPileRef = useRef(null);
  const cribDisplayRef = useRef(null);
  const cribPileLastRect = useRef(null);
  const handCardRectsRef = useRef([]); // Captured hand card positions for crib reveal animation
  const playerHandContainerRef = useRef(null);
  const deckPileRef = useRef(null);
  const needsRecoveryDealRef = useRef(false); // Set ONLY during restore when hands >= 3

  // Crib reveal animation state
  const [cribRevealPhase, setCribRevealPhase] = useState('idle'); // 'idle' | 'revealing' | 'done'
  const [cribRevealedCards, setCribRevealedCards] = useState([]);

  // Deal animation state
  const [dealPhase, setDealPhase] = useState('idle');           // 'idle' | 'dealing' | 'flipping'
  const [dealtPlayerCards, setDealtPlayerCards] = useState([]);  // cards landed in player hand
  const [dealtComputerCards, setDealtComputerCards] = useState([]); // cards landed in computer hand
  const [dealFlipIndex, setDealFlipIndex] = useState(-1);       // which player card is flipping (-1 = none)

  // Computer discard tracking
  const [computerKeptHand, setComputerKeptHand] = useState(null);
  const [computerDiscardCards, setComputerDiscardCards] = useState([]);
  const [computerDiscardDone, setComputerDiscardDone] = useState(false);
  const [cribCardsInPile, setCribCardsInPile] = useState(0);
  const [computerDiscardMoment, setComputerDiscardMoment] = useState(null);

  // Debug state
  const [debugLog, setDebugLog] = useState([]);
  const [gameLog, setGameLog] = useState([]);

  // Persistence state
  const [savedGameExists, setSavedGameExists] = useState(false);
  const [savedGameData, setSavedGameData] = useState(null);
  const [userStats, setUserStats] = useState({ wins: 0, losses: 0, forfeits: 0 });
  const [userExpertStats, setUserExpertStats] = useState({ wins: 0, losses: 0, forfeits: 0 });
  const [isLoadingGame, setIsLoadingGame] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedStateRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Forfeit state
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);

  // Get muggins penalty preference from localStorage
  const getMugginsPreference = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mugginsPreference'); // 'no-penalty' or '2-points' or null
    }
    return null;
  };

  // Save muggins penalty preference to localStorage
  const saveMugginsPreference = (preference) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mugginsPreference', preference);
    }
  };

  // AI difficulty preference (persists across sessions)
  const getAiDifficulty = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('aiDifficulty') || 'normal';
    }
    return 'normal';
  };
  const saveAiDifficulty = (d) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aiDifficulty', d);
    }
  };
  const [aiDifficulty, setAiDifficulty] = useState('normal');

  // Celebration settings (persists across sessions)
  const getCelebrationLevel = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('celebrationLevel') || 'classic';
    }
    return 'classic';
  };
  const getMotionLevel = () => {
    if (typeof window !== 'undefined') {
      // Check prefers-reduced-motion
      if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'off';
      return localStorage.getItem('motionLevel') || 'standard';
    }
    return 'standard';
  };
  const [celebrationLevel, setCelebrationLevel] = useState('classic');
  const [motionLevel, setMotionLevel] = useState('standard');
  const [celebrationToast, setCelebrationToast] = useState(null); // { phrase, animation }
  const [prevHandScore, setPrevHandScore] = useState(null); // for streak detection
  const [maxDeficit, setMaxDeficit] = useState(0); // for comeback detection

  // Initialize difficulty and celebration settings from localStorage on mount
  useEffect(() => {
    setAiDifficulty(getAiDifficulty());
    setCelebrationLevel(getCelebrationLevel());
    setMotionLevel(getMotionLevel());
  }, []);

  // Create current state snapshot for saving
  const createCurrentSnapshot = useCallback(() => {
    return createGameStateSnapshot({
      gameState, dealer, currentPlayer, message,
      deck, playerHand, computerHand, crib, cutCard,
      playerScore, computerScore, selectedCards,
      playerPlayHand, computerPlayHand,
      playerPlayedCards, computerPlayedCards,
      allPlayedCards, currentCount, lastPlayedBy, lastGoPlayer,
      peggingHistory, countingHistory, computerCountingHand,
      countingTurn, handsCountedThisRound, counterIsComputer,
      computerClaimedScore, actualScore, pendingCountContinue,
      playerCutCard, computerCutCard, cutResultReady,
      pendingScore, aiDifficulty,
      computerKeptHand, computerDiscardCards, computerDiscardDone, cribCardsInPile,
    });
  }, [
    gameState, dealer, currentPlayer, message,
    deck, playerHand, computerHand, crib, cutCard,
    playerScore, computerScore, selectedCards,
    playerPlayHand, computerPlayHand,
    playerPlayedCards, computerPlayedCards,
    allPlayedCards, currentCount, lastPlayedBy, lastGoPlayer,
    peggingHistory, countingHistory, computerCountingHand,
    countingTurn, handsCountedThisRound, counterIsComputer,
    computerClaimedScore, actualScore, pendingCountContinue,
    computerKeptHand, computerDiscardCards, computerDiscardDone, cribCardsInPile,
    playerCutCard, computerCutCard, cutResultReady,
    pendingScore, aiDifficulty,
  ]);

  // Save game state to server
  const saveGameState = useCallback(async (snapshot) => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      const response = await fetch('/api/game-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameState: snapshot,
          version: APP_VERSION,
        }),
      });

      if (response.ok) {
        lastSavedStateRef.current = snapshot;
      }
    } catch (error) {
      console.error('Failed to save game state:', error);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving]);

  // Delete saved game state
  const deleteSavedGame = useCallback(async () => {
    try {
      await fetch('/api/game-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      });
      setSavedGameExists(false);
      setSavedGameData(null);
      lastSavedStateRef.current = null;
    } catch (error) {
      console.error('Failed to delete saved game:', error);
    }
  }, []);

  // Record game result (win/loss/forfeit)
  const recordGameResult = useCallback(async (result) => {
    try {
      const response = await fetch('/api/game-stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result, difficulty: aiDifficulty }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.stats) {
          setUserStats(data.stats);
        }
        if (data.expertStats) {
          setUserExpertStats(data.expertStats);
        }
      }
    } catch (error) {
      console.error('Failed to record game result:', error);
    }
  }, [aiDifficulty]);

  // Load saved game state on mount
  useEffect(() => {
    const loadSavedGame = async () => {
      try {
        const response = await fetch('/api/game-state');
        if (response.ok) {
          const data = await response.json();
          if (data.gameState) {
            setSavedGameExists(true);
            setSavedGameData(data.gameState);
          }
          if (data.stats) {
            setUserStats(data.stats);
          }
          if (data.expertStats) {
            setUserExpertStats(data.expertStats);
          }
        }
      } catch (error) {
        console.error('Failed to load saved game:', error);
      } finally {
        setIsLoadingGame(false);
      }
    };

    loadSavedGame();
  }, []);

  // Fetch unread bug report count on mount
  useEffect(() => {
    const fetchUnreadCount = async () => {
      const email = user?.attributes?.email || user?.username;
      if (!email) return;

      try {
        const response = await fetch(`/api/bug-reports?email=${encodeURIComponent(email)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUnreadBugReports(data.unreadCount);
          }
        }
      } catch (error) {
        console.error('Failed to fetch unread bug reports:', error);
      }
    };

    fetchUnreadCount();
  }, [user]);

  // Show notification when there are unread bug report replies
  useEffect(() => {
    if (unreadBugReports > 0) {
      setShowUnreadNotification(true);
    }
  }, [unreadBugReports]);

  // Personal messages are now handled by VersionNotification component
  // (shown after the "Got It!" dismiss — see lib/personal-messages.js)

  // Auto-save game state with debounce
  useEffect(() => {
    // Don't save during initial load or if not in a saveable state
    if (isLoadingGame || !shouldSaveGame(gameState)) {
      return;
    }

    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce save by 500ms
    saveTimeoutRef.current = setTimeout(() => {
      const snapshot = createCurrentSnapshot();

      // Only save if there's a significant change
      if (hasSignificantChange(lastSavedStateRef.current, snapshot)) {
        saveGameState(snapshot);
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [
    gameState, playerScore, computerScore, playerHand, computerHand,
    crib, cutCard, allPlayedCards, handsCountedThisRound, dealer,
    isLoadingGame, createCurrentSnapshot, saveGameState, actualScore,
  ]);

  // Recovery deal: if restored with counting already complete, deal next hand after delay
  useEffect(() => {
    if (needsRecoveryDealRef.current && gameState === 'counting') {
      needsRecoveryDealRef.current = false;
      const timer = setTimeout(() => {
        setMessage('Hand complete - Dealing next hand...');
        setTimeout(() => {
          const newDealer = dealer === 'player' ? 'computer' : 'player';
          setDealer(newDealer);
          const newDeck = shuffleDeck(createDeck());
          setDeck(newDeck);
          dealHands(newDeck, newDealer);
        }, 1500);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  // Resume a saved game
  const resumeGame = useCallback(() => {
    if (!savedGameData) return;

    const restored = deserializeGameState(savedGameData);
    if (!restored) return;

    // If restored during deal animation, skip to cribSelect.
    // Also clear stale counting fields from previous hand — the race condition
    // in bug #80 can leave counterIsComputer/countingTurn set when a new deal fires.
    if (restored.gameState === 'dealing') {
      restored.gameState = 'cribSelect';
      restored.message = 'Select 2 cards for the crib';
      restored.counterIsComputer = null;
      restored.countingTurn = '';
      restored.handsCountedThisRound = 0;
      restored.actualScore = null;
      restored.computerClaimedScore = null;
      restored.pendingCountContinue = null;
    }

    // Restore all persisted state
    if (restored.gameState) setGameState(restored.gameState);
    if (restored.dealer !== undefined) setDealer(restored.dealer);
    if (restored.currentPlayer !== undefined) setCurrentPlayer(restored.currentPlayer);
    if (restored.message !== undefined) setMessage(restored.message);
    if (restored.deck) setDeck(restored.deck);
    if (restored.playerHand) setPlayerHand(restored.playerHand);
    if (restored.computerHand) setComputerHand(restored.computerHand);
    if (restored.crib) setCrib(restored.crib);
    if (restored.cutCard !== undefined) setCutCard(restored.cutCard);
    if (restored.playerScore !== undefined) setPlayerScore(restored.playerScore);
    if (restored.computerScore !== undefined) setComputerScore(restored.computerScore);
    if (restored.selectedCards) setSelectedCards(restored.selectedCards);
    if (restored.playerPlayHand) setPlayerPlayHand(restored.playerPlayHand);
    if (restored.computerPlayHand) setComputerPlayHand(restored.computerPlayHand);
    if (restored.playerPlayedCards) setPlayerPlayedCards(restored.playerPlayedCards);
    if (restored.computerPlayedCards) setComputerPlayedCards(restored.computerPlayedCards);
    if (restored.allPlayedCards) setAllPlayedCards(restored.allPlayedCards);
    if (restored.currentCount !== undefined) setCurrentCount(restored.currentCount);
    if (restored.lastPlayedBy !== undefined) setLastPlayedBy(restored.lastPlayedBy);
    if (restored.lastGoPlayer !== undefined) setLastGoPlayer(restored.lastGoPlayer);
    if (restored.peggingHistory) setPeggingHistory(restored.peggingHistory);
    if (restored.countingHistory) setCountingHistory(restored.countingHistory);
    if (restored.computerCountingHand !== undefined) setComputerCountingHand(restored.computerCountingHand);
    if (restored.countingTurn !== undefined) setCountingTurn(restored.countingTurn);
    if (restored.handsCountedThisRound !== undefined) setHandsCountedThisRound(restored.handsCountedThisRound);
    if (restored.counterIsComputer !== undefined) {
      setCounterIsComputer(restored.counterIsComputer);
    } else if (restored.gameState === 'counting' && restored.countingTurn) {
      // Fallback for old saves without counterIsComputer:
      // Derive from countingTurn - if it's 'player' or player's crib turn, player counts
      const isPlayerCounting = restored.countingTurn === 'player' ||
        (restored.countingTurn === 'crib' && restored.dealer === 'player');
      setCounterIsComputer(!isPlayerCounting);
    }
    if (restored.computerClaimedScore !== undefined) setComputerClaimedScore(restored.computerClaimedScore);
    if (restored.actualScore !== undefined) setActualScore(restored.actualScore);
    if (restored.pendingCountContinue !== undefined) setPendingCountContinue(restored.pendingCountContinue);
    console.log('[Restore] Generic restore: actualScore=', restored.actualScore, 'computerClaimedScore=', restored.computerClaimedScore, 'pendingCountContinue=', restored.pendingCountContinue, 'gameState=', restored.gameState, 'counterIsComputer=', restored.counterIsComputer, 'handsCountedThisRound=', restored.handsCountedThisRound);
    if (restored.computerKeptHand !== undefined) setComputerKeptHand(restored.computerKeptHand);
    if (restored.computerDiscardCards !== undefined) setComputerDiscardCards(restored.computerDiscardCards);
    if (restored.computerDiscardDone !== undefined) setComputerDiscardDone(restored.computerDiscardDone);
    if (restored.cribCardsInPile !== undefined) setCribCardsInPile(restored.cribCardsInPile);

    // Validate and fix counting state consistency
    // The source of truth is handsCountedThisRound and dealer - derive counterIsComputer from them
    if (restored.gameState === 'counting' && restored.handsCountedThisRound !== undefined && restored.dealer) {
      const hands = restored.handsCountedThisRound;
      const dlr = restored.dealer;
      let correctCounterIsComputer;
      let correctCountingTurn;

      if (hands >= 3) {
        // All counting done but deal didn't fire (e.g. page refreshed during timeout)
        // Set ref so the recovery useEffect (which checks ONLY this ref) will deal
        console.log(`[Resume] handsCountedThisRound=${hands}, all counting complete - scheduling recovery deal`);
        needsRecoveryDealRef.current = true;
        setCountingTurn('');
        setCounterIsComputer(null);
        setMessage('Hand complete - Dealing next hand...');
      } else if (hands === 0) {
        // Non-dealer counts first
        correctCounterIsComputer = (dlr === 'player');
        correctCountingTurn = (dlr === 'player') ? 'computer' : 'player';
      } else if (hands === 1) {
        // Dealer counts their hand second
        correctCounterIsComputer = (dlr === 'computer');
        correctCountingTurn = dlr;
      } else if (hands === 2) {
        // Dealer counts crib third - crib reveal already happened
        correctCounterIsComputer = (dlr === 'computer');
        correctCountingTurn = 'crib';
        setCribRevealPhase('done');
        // Clear stale actualScore from previous count so ScoreSelector renders
        setActualScore(null);
        setComputerClaimedScore(null);
        setPendingScore(null);
      }

      // Clear stale pendingCountContinue from previous count sub-phase.
      // Points are already applied; the acknowledgment is only UI and is not
      // meaningful after a page refresh/restore. If left set, it takes priority
      // over the ScoreSelector in getRequiredAction() and shows a Continue button
      // instead of the score entry grid (bug #77).
      if (hands < 3) {
        setPendingCountContinue(null);
      }

      // Override with correct values if they don't match (skip if hands >= 3, already handled)
      if (hands < 3 && correctCounterIsComputer !== undefined && correctCounterIsComputer !== restored.counterIsComputer) {
        console.log(`[Resume] Fixing counterIsComputer: ${restored.counterIsComputer} → ${correctCounterIsComputer}`);
        setCounterIsComputer(correctCounterIsComputer);
      }
      if (hands < 3 && correctCountingTurn !== undefined && correctCountingTurn !== restored.countingTurn) {
        console.log(`[Resume] Fixing countingTurn: ${restored.countingTurn} → ${correctCountingTurn}`);
        setCountingTurn(correctCountingTurn);
      }

      // Fix the message to match the current counting state (skip if hands >= 3, already handled)
      if (hands < 3) {
        // Use correctCounterIsComputer if we fixed it, otherwise use restored value
        const isComputerCounting = correctCounterIsComputer !== undefined ? correctCounterIsComputer : restored.counterIsComputer;
        const turn = correctCountingTurn !== undefined ? correctCountingTurn : restored.countingTurn;

        if (isComputerCounting) {
          // Computer's turn to count
          if (turn === 'crib') {
            setMessage('Computer counts the crib');
          } else {
            setMessage(hands === 0 ? 'Computer counts their hand (non-dealer)' : 'Computer counts their hand (dealer)');
          }
        } else {
          // Player's turn to count
          if (turn === 'crib') {
            setMessage('Count your crib');
          } else {
            setMessage(hands === 0 ? 'Count your hand (non-dealer)' : 'Count your hand (dealer)');
          }
        }
      }
      console.log(`[Resume] Set counting message for hands=${hands}, turn=${turn}, isComputer=${isComputerCounting}`);

      // Clear stale score state from a previous count sub-phase.
      // For the player's turn: any actualScore/computerClaimedScore is stale.
      // For the computer's turn: actualScore without computerClaimedScore is stale
      // (leftover from player's previous count that blocks computer counting useEffect).
      // Only keep both when the computer has actually claimed (player needs to verify).
      if (hands < 3 && correctCounterIsComputer === false) {
        if (restored.actualScore) {
          console.log(`[Resume] Clearing stale actualScore from previous count (player's turn)`);
          setActualScore(null);
          setShowBreakdown(false);
        }
        if (restored.computerClaimedScore) {
          console.log(`[Resume] Clearing stale computerClaimedScore`);
          setComputerClaimedScore(null);
        }
      } else if (hands < 3 && correctCounterIsComputer === true && restored.actualScore && !restored.computerClaimedScore) {
        // Computer's turn but has stale actualScore from player's previous count (bug #79)
        console.log(`[Resume] Clearing stale actualScore blocking computer counting`);
        setActualScore(null);
        setShowBreakdown(false);
      }
    }

    if (restored.playerCutCard !== undefined) setPlayerCutCard(restored.playerCutCard);
    if (restored.computerCutCard !== undefined) setComputerCutCard(restored.computerCutCard);
    if (restored.cutResultReady !== undefined) setCutResultReady(restored.cutResultReady);
    // Don't restore pendingScore during counting phase — it's a pegging concept
    // and would block ScoreSelector from appearing (line 532 previously overrode
    // the clearing done by the counting validation block at line 477)
    if (restored.pendingScore !== undefined && restored.gameState !== 'counting') {
      setPendingScore(restored.pendingScore);
    }
    // Don't restore aiDifficulty from saved game — use the player's
    // current menu selection. They just had a chance to change it.

    // Store as last saved state
    lastSavedStateRef.current = savedGameData;
  }, [savedGameData]);

  // Forfeit the current game
  const handleForfeit = useCallback(async () => {
    setShowForfeitConfirm(false);

    // Record forfeit in stats
    await recordGameResult('forfeit');

    // Delete saved game
    await deleteSavedGame();

    // Update game state
    setGameState('gameOver');
    setMessage('You forfeited. Computer wins!');
  }, [recordGameResult, deleteSavedGame]);

  // Handle natural game completion (win/loss by reaching 121)
  const handleGameOver = useCallback(async (playerWon, customMessage = null) => {
    // Record result
    await recordGameResult(playerWon ? 'win' : 'loss');

    // Delete saved game
    await deleteSavedGame();

    // Fire game-end celebration
    const gameResult = celebrateGameEnd(
      playerWon,
      playerScoreRef.current,
      computerScoreRef.current,
      maxDeficit,
      { celebrationLevel, motionLevel }
    );
    if (gameResult.phrase) {
      setCelebrationToast({ phrase: gameResult.phrase, animation: gameResult.animation });
    }

    // Update game state
    setGameState('gameOver');
    setMessage(customMessage || (playerWon ? 'You win!' : 'Computer wins!'));
    // Reset streak tracking
    setPrevHandScore(null);
    setMaxDeficit(0);
  }, [recordGameResult, deleteSavedGame, maxDeficit, celebrationLevel, motionLevel]);

  // Refs to track current scores for use in addPoints
  const playerScoreRef = useRef(playerScore);
  const computerScoreRef = useRef(computerScore);
  useEffect(() => { playerScoreRef.current = playerScore; }, [playerScore]);
  useEffect(() => { computerScoreRef.current = computerScore; }, [computerScore]);

  /**
   * Central function to add points to a player's score.
   * This is the ONLY place where scores should be modified (except for initialization/restore).
   * Handles win detection automatically.
   *
   * @param {string} player - 'player' or 'computer'
   * @param {number} points - Points to add
   * @param {string} reason - Reason for the points (for logging)
   * @returns {Object} { newScore: number, gameEnded: boolean }
   */
  const addPoints = useCallback((player, points, reason) => {
    if (points <= 0) return { newScore: player === 'player' ? playerScoreRef.current : computerScoreRef.current, gameEnded: false };

    const currentScore = player === 'player' ? playerScoreRef.current : computerScoreRef.current;
    const newScore = currentScore + points;

    // Update the score
    if (player === 'player') {
      setPlayerScore(newScore);
      playerScoreRef.current = newScore;
    } else {
      setComputerScore(newScore);
      computerScoreRef.current = newScore;
    }

    // Track max deficit for comeback detection
    const pScore = player === 'player' ? newScore : playerScoreRef.current;
    const cScore = player === 'computer' ? newScore : computerScoreRef.current;
    const playerDeficit = cScore - pScore;
    if (playerDeficit > 0) {
      setMaxDeficit(prev => Math.max(prev, playerDeficit));
    }

    // Log the scoring event
    addDebugLog(`${player === 'player' ? 'Player' : 'Computer'} scores ${points} points (${reason}): ${currentScore} -> ${newScore}`);

    // Check for win
    if (newScore >= 121) {
      const playerWon = player === 'player';
      const winMessage = playerWon
        ? `You win with ${newScore} points!`
        : `Computer wins with ${newScore} points!`;
      addDebugLog(winMessage);
      handleGameOver(playerWon, winMessage);
      return { newScore, gameEnded: true };
    }

    return { newScore, gameEnded: false };
  }, [handleGameOver]);

  // Enhanced logging function
  const addDebugLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev.slice(-50), `[${timestamp}] ${msg}`]);
    console.log(`[${timestamp}] ${msg}`);
  };

  // Game event logging function
  const logGameEvent = (eventType, data) => {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      data: data,
      gameState: {
        state: gameState,
        dealer: dealer,
        playerScore: playerScore,
        computerScore: computerScore,
        currentCount: currentCount,
        currentPlayer: currentPlayer,
        playerPlayHand: playerPlayHand?.map(c => `${c.rank}${c.suit}`),
        computerPlayHand: computerPlayHand?.map(c => `${c.rank}${c.suit}`),
        pendingScore: pendingScore ? { player: pendingScore.player, points: pendingScore.points, reason: pendingScore.reason } : null,
        lastPlayedBy: lastPlayedBy,
      }
    };
    setGameLog(prev => [...prev, event]);
    addDebugLog(`GAME EVENT: ${eventType} - ${JSON.stringify(data)}`);
  };

  // Move to counting phase
  const moveToCountingPhase = () => {
    addDebugLog('Moving to counting phase');
    setGameState('counting');
    setHandsCountedThisRound(0);

    // Clear any leftover pegging state
    setPendingScore(null);
    setLastPlayedBy(null);

    setComputerClaimedScore(null);
    setActualScore(null);
    setShowBreakdown(false);
    setIsProcessingCount(false);
    setPendingCountContinue(null);
    setPlayerMadeCountDecision(false);
    setShowMugginsPreferenceDialog(false);
    setPendingWrongMugginsResult(null);
    setCribRevealPhase('idle');
    setCribRevealedCards([]);

    const firstCounter = dealer === 'player' ? 'computer' : 'player';
    const isComputerFirst = firstCounter === 'computer';

    setCounterIsComputer(isComputerFirst);
    setCountingTurn(firstCounter);

    addDebugLog(`First counter: ${firstCounter} (non-dealer), counterIsComputer: ${isComputerFirst}, dealer: ${dealer}`);
    setMessage(isComputerFirst ? 'Computer counts first (non-dealer)' : 'Count your hand (non-dealer first)');
  };

  // Track crib pile position while it's visible
  useEffect(() => {
    if (cribPileRef.current) {
      cribPileLastRect.current = cribPileRef.current.getBoundingClientRect();
    }
  });

  // Crib reveal animation - flies cards one at a time from pile to display
  const startCribReveal = () => {
    setCribRevealPhase('revealing');
    setCribRevealedCards([]);
    setMessage('Turning over the crib...');
    // Pre-set counting state so ScoreSelector/verification UI renders (invisible)
    // and reserves layout space BEFORE animation starts — prevents layout shift
    setCountingTurn('crib');
    setCounterIsComputer(dealer === 'computer');

    // Wait for re-render so layout is stable, then start flying cards
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Brief pause so user sees the empty box before cards fly in
        setTimeout(() => revealNextCribCard(0), 300);
      });
    });
  };

  const revealNextCribCard = (index) => {
    if (index >= crib.length) {
      setCribRevealPhase('done');
      // countingTurn and counterIsComputer already set in startCribReveal
      setMessage(dealer === 'computer' ? 'Computer counts the crib' : 'Count your crib');
      return;
    }

    // Capture positions FRESH from live DOM right before each card flies.
    // This prevents stale positions as the grid cell changes with each added card.
    const handContainer = dealer === 'computer' ? computerHandRef.current : playerHandContainerRef.current;
    const pileRect = cribPileRef.current ? cribPileRef.current.getBoundingClientRect() : cribPileLastRect.current;
    const targetCardRect = handContainer ? handContainer.children[index]?.getBoundingClientRect() : null;

    if (pileRect && targetCardRect) {
      setFlyingCard({
        card: crib[index],
        className: 'flying-card-crib',
        startRect: {
          top: pileRect.top,
          left: pileRect.left,
          width: targetCardRect.width,
          height: targetCardRect.height,
        },
        endRect: {
          top: targetCardRect.top,
          left: targetCardRect.left,
        },
        onComplete: () => {
          setFlyingCard(null);
          setCribRevealedCards(prev => [...prev, crib[index]]);
          // Wait for re-render after adding the card, then fly next
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(() => revealNextCribCard(index + 1), 150);
            });
          });
        }
      });
    } else {
      // Fallback: reveal all instantly
      setCribRevealedCards([...crib]);
      setCribRevealPhase('done');
      setCountingTurn('crib');
      setCounterIsComputer(dealer === 'computer');
      setMessage(dealer === 'computer' ? 'Computer counts the crib' : 'Count your crib');
    }
  };

  // Safety: if crib reveal gets stuck in 'revealing', force to 'done' (bug #80)
  useEffect(() => {
    if (cribRevealPhase === 'revealing') {
      const safetyTimer = setTimeout(() => {
        console.log('[Safety] Crib reveal stuck in revealing — forcing to done');
        setCribRevealPhase('done');
        setCribRevealedCards([...crib]);
        setFlyingCard(null);
        setMessage(dealer === 'computer' ? 'Computer counts the crib' : 'Count your crib');
      }, 5000);
      return () => clearTimeout(safetyTimer);
    }
  }, [cribRevealPhase, crib, dealer]);

  // Start new game
  const startNewGame = () => {
    const newDeck = shuffleDeck(createDeck());
    setDeck(newDeck);
    setPlayerScore(0);
    setComputerScore(0);
    setGameState('cutting');
    setPlayerCutCard(null);
    setComputerCutCard(null);
    setMessage('Cut the deck to determine dealer (low card deals)');

    logGameEvent('GAME_START', {
      deckSize: newDeck.length,
      timestamp: new Date().toISOString()
    });
  };

  // Return to menu (e.g., after game over) so player can change settings
  const returnToMenu = () => {
    setGameState('menu');
    setMessage('');
    setPlayerScore(0);
    setComputerScore(0);
    setPlayerHand([]);
    setComputerHand([]);
    setCrib([]);
    setCutCard(null);
    setPlayerPlayHand([]);
    setComputerPlayHand([]);
    setPlayerPlayedCards([]);
    setComputerPlayedCards([]);
    setAllPlayedCards([]);
    setSavedGameExists(false);
    setSavedGameData(null);
  };

  // Player cuts the deck (position is 0-1 from DeckCut component)
  const playerCutDeck = (cutPosition = 0.5) => {
    if (playerCutCard) return;

    // Convert cut position to deck index (position affects where in deck we cut)
    const cutIndex = Math.floor(cutPosition * 30) + 10;
    const card = deck[cutIndex];
    setPlayerCutCard(card);

    setTimeout(() => {
      // Computer cuts at a random position
      let compCutIndex;
      do {
        compCutIndex = Math.floor(Math.random() * 30) + 10;
      } while (compCutIndex === cutIndex);

      const compCard = deck[compCutIndex];
      setComputerCutCard(compCard);

      setTimeout(() => {
        const playerRank = rankOrder[card.rank];
        const computerRank = rankOrder[compCard.rank];

        if (playerRank < computerRank) {
          setDealer('player');
          setMessage('You cut lower - You deal first!');
          setCutResultReady(true);
          logGameEvent('CUT_FOR_DEALER', {
            playerCard: card,
            computerCard: compCard,
            dealer: 'player',
            playerRank: playerRank,
            computerRank: computerRank
          });
        } else if (computerRank < playerRank) {
          setDealer('computer');
          setMessage('Computer cut lower - Computer deals first');
          setCutResultReady(true);
          logGameEvent('CUT_FOR_DEALER', {
            playerCard: card,
            computerCard: compCard,
            dealer: 'computer',
            playerRank: playerRank,
            computerRank: computerRank
          });
        } else {
          setMessage('Same rank! Cut again');
          setPlayerCutCard(null);
          setComputerCutCard(null);
          logGameEvent('CUT_FOR_DEALER_TIE', {
            playerCard: card,
            computerCard: compCard,
            rank: playerRank
          });
          return;
        }
        // No auto-deal - wait for user to click button
      }, 1500);
    }, 1200);
  };

  // Proceed to dealing after cut
  const proceedToDeal = () => {
    setCutResultReady(false);
    setGameState('dealing');
    setPlayerCutCard(null);
    setComputerCutCard(null);
    dealHands(deck);
  };

  // Deal hands — sets up state then kicks off deal animation
  // currentDealer: pass explicitly when dealer was just changed via setDealer (stale closure)
  const dealHands = (currentDeck, currentDealer) => {
    const activeDealer = currentDealer || dealer;
    needsRecoveryDealRef.current = false;
    const playerCards = currentDeck.slice(0, 6);
    const computerCards = currentDeck.slice(6, 12);

    if (playerCards.length !== 6 || computerCards.length !== 6) {
      console.error('Dealing error - should be 6 cards each. Player:', playerCards.length, 'Computer:', computerCards.length);
    }

    // Computer decides its discard at deal time (enables independent animation timing)
    const kept = computerSelectCrib(computerCards, activeDealer === 'computer', aiDifficulty);
    const discards = computerCards.filter(card =>
      !kept.some(c => c.rank === card.rank && c.suit === card.suit)
    );

    setPlayerHand(playerCards);
    setComputerHand(computerCards);
    setComputerKeptHand(kept);
    setComputerDiscardCards(discards);
    setComputerDiscardDone(false);
    setCribCardsInPile(0);
    setCribRevealPhase('idle');
    setCribRevealedCards([]);
    setDeck(currentDeck.slice(12));
    setCrib([]);
    setSelectedCards([]);
    setCountingTurn('');
    setPlayerCountInput('');
    setComputerClaimedScore(null);
    setActualScore(null);
    setShowBreakdown(false);
    setPendingScore(null);
    setCutCard(null);
    setLastGoPlayer(null);
    setPeggingHistory([]);
    setShowPeggingSummary(false);
    setCountingHistory([]);
    setHandsCountedThisRound(0);  // Reset for new hand

    // Randomly choose when computer will discard (simulates human deliberation)
    const moment = [1, 2, 3, 4, 5][Math.floor(Math.random() * 5)];
    setComputerDiscardMoment(moment);

    // Start deal animation
    setGameState('dealing');
    setDealPhase('dealing');
    setDealtPlayerCards([]);
    setDealtComputerCards([]);
    setDealFlipIndex(-1);
    setMessage('Dealing...');

    // Wait for DOM to render deck pile and hand containers, then start dealing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => dealNextCard(0, playerCards, computerCards, activeDealer), 300);
      });
    });
  };

  // Recursively deal cards one at a time with flight animation
  // currentDealer passed explicitly to avoid stale closure on subsequent hands
  const dealNextCard = (index, playerCards, computerCards, currentDealer) => {
    if (index >= 12) {
      setDealPhase('flipping');
      startDealFlip(0);
      return;
    }

    // Non-dealer receives first card (even indices), dealer gets odd indices
    const isForPlayer = (currentDealer === 'computer') ? (index % 2 === 0) : (index % 2 === 1);
    const targetCards = isForPlayer ? playerCards : computerCards;
    // Which slot (0-5) in that player's hand?
    const playerDealtSoFar = Math.floor((index + (currentDealer === 'computer' ? 1 : 0)) / 2);
    const computerDealtSoFar = Math.floor((index + (currentDealer === 'computer' ? 0 : 1)) / 2);
    const slot = isForPlayer ? playerDealtSoFar : computerDealtSoFar;
    const card = targetCards[slot];

    const sourceRect = deckPileRef.current?.getBoundingClientRect();
    const handContainer = isForPlayer ? playerHandContainerRef.current : computerHandRef.current;
    const targetEl = handContainer?.children[slot];
    const targetRect = targetEl?.getBoundingClientRect();

    if (!sourceRect || !targetRect) {
      // Fallback: skip animation, finish deal instantly
      finishDeal(playerCards, computerCards);
      return;
    }

    setFlyingCard({
      card,
      startRect: {
        top: sourceRect.top,
        left: sourceRect.left,
        width: targetRect.width,
        height: targetRect.height,
      },
      endRect: {
        top: targetRect.top,
        left: targetRect.left,
      },
      faceDown: true,
      className: 'flying-card-deal',
      onComplete: () => {
        setFlyingCard(null);
        if (isForPlayer) {
          setDealtPlayerCards(prev => [...prev, card]);
        } else {
          setDealtComputerCards(prev => [...prev, card]);
        }
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setTimeout(() => dealNextCard(index + 1, playerCards, computerCards, currentDealer), 80);
          });
        });
      }
    });
  };

  // Stagger-flip player cards face-up one by one
  const startDealFlip = (index) => {
    if (index >= 6) {
      // Small delay after last flip before transitioning
      setTimeout(() => finishDeal(), 300);
      return;
    }
    setDealFlipIndex(index);
    setTimeout(() => startDealFlip(index + 1), 80);
  };

  // Animation complete — transition to cribSelect
  const finishDeal = (playerCardsOverride, computerCardsOverride) => {
    const pCards = playerCardsOverride || playerHand;
    const cCards = computerCardsOverride || computerHand;
    setDealPhase('idle');
    setDealFlipIndex(-1);
    setDealtPlayerCards([]);
    setDealtComputerCards([]);
    setGameState('cribSelect');
    setMessage('Select 2 cards for the crib');
    logGameEvent('DEAL_HANDS', {
      playerHand: pCards,
      computerHand: cCards.map(c => ({ rank: c.rank, suit: c.suit })),
      dealer: dealer
    });
  };

  // Handle card selection for crib
  const toggleCardSelection = (card) => {
    if (gameState !== 'cribSelect') return;

    const isSelected = selectedCards.some(c => c.rank === card.rank && c.suit === card.suit);

    if (isSelected) {
      setSelectedCards(selectedCards.filter(c => !(c.rank === card.rank && c.suit === card.suit)));
    } else if (selectedCards.length < 2) {
      const newSelected = [...selectedCards, card];
      setSelectedCards(newSelected);

      // Moment 2: Computer discards when player selects first card
      if (computerDiscardMoment === 2 && !computerDiscardDone && newSelected.length === 1) {
        const delay = 500 + Math.random() * 1000;
        setTimeout(() => animateComputerDiscard(), delay);
      }
      // Moment 3: Computer discards when player selects second card
      if (computerDiscardMoment === 3 && !computerDiscardDone && newSelected.length === 2) {
        const delay = 300 + Math.random() * 700;
        setTimeout(() => animateComputerDiscard(), delay);
      }
    }
  };

  // Animate computer discarding 2 face-down cards to the crib pile
  const animateComputerDiscard = (onDone) => {
    if (computerDiscardDone || computerDiscardCards.length !== 2) {
      if (onDone) onDone();
      return;
    }

    const firstCard = computerHandRef.current?.querySelector(':scope > *');
    const startRect = firstCard?.getBoundingClientRect();
    const endRect = cribPileRef.current?.getBoundingClientRect();

    if (!startRect || !endRect) {
      // Fallback: complete without animation
      setComputerDiscardDone(true);
      setCribCardsInPile(prev => prev + 2);
      if (onDone) onDone();
      return;
    }

    // Animate first face-down card
    setFlyingCard({
      card: computerDiscardCards[0],
      startRect,
      endRect,
      faceDown: true,
      onComplete: () => {
        setCribCardsInPile(prev => prev + 1);
        // Get fresh position for second card
        const secondCard = computerHandRef.current?.querySelector(':scope > *');
        const startRect2 = secondCard?.getBoundingClientRect() || startRect;
        // Animate second face-down card
        setFlyingCard({
          card: computerDiscardCards[1],
          startRect: startRect2,
          endRect,
          faceDown: true,
          onComplete: () => {
            setFlyingCard(null);
            setCribCardsInPile(prev => prev + 1);
            setComputerDiscardDone(true);
            if (onDone) onDone();
          }
        });
      }
    });
  };

  // Moment 1: Computer discards shortly after dealing
  useEffect(() => {
    if (gameState === 'cribSelect' && computerDiscardMoment === 1 && !computerDiscardDone) {
      const delay = 1500 + Math.random() * 1500;
      const timer = setTimeout(() => animateComputerDiscard(), delay);
      return () => clearTimeout(timer);
    }
  }, [gameState, computerDiscardMoment, computerDiscardDone]);

  // Apply crib discard state changes (extracted for animation deferral)
  const applyCribDiscard = useCallback(() => {
    const newPlayerHand = playerHand.filter(card =>
      !selectedCards.some(s => s.rank === card.rank && s.suit === card.suit)
    );

    // Use pre-computed computer decision from dealHands
    const newComputerHand = computerKeptHand || computerSelectCrib(computerHand, dealer === 'computer', aiDifficulty);
    const discards = computerDiscardCards.length === 2 ? computerDiscardCards :
      computerHand.filter(card => !newComputerHand.some(c => c.rank === card.rank && c.suit === card.suit));

    const newCrib = [...selectedCards, ...discards];

    if (newPlayerHand.length !== 4 || newComputerHand.length !== 4 || newCrib.length !== 4) {
      console.error('Invalid card counts after discard');
      return;
    }

    setPlayerHand(newPlayerHand);
    setComputerHand(newComputerHand);
    setCrib(newCrib);
    setSelectedCards([]);
    setCribCardsInPile(4);

    setPlayerPlayHand([...newPlayerHand]);
    setComputerPlayHand([...newComputerHand]);
    setPlayerPlayedCards([]);
    setComputerPlayedCards([]);
    setAllPlayedCards([]);
    setCurrentCount(0);
    setLastPlayedBy(null);
    setLastGoPlayer(null);

    logGameEvent('DISCARD_TO_CRIB', {
      playerDiscards: selectedCards,
      computerDiscards: discards,
      crib: newCrib,
      playerHand: newPlayerHand,
      computerHand: newComputerHand
    });

    // Transition to cut for starter phase
    setGameState('cutForStarter');
    const nonDealer = dealer === 'player' ? 'Computer' : 'You';
    setMessage(`${nonDealer === 'You' ? 'Cut' : 'Computer cuts'} for the starter card`);
  }, [playerHand, selectedCards, computerHand, computerKeptHand, computerDiscardCards, dealer]);

  // Discard to crib with animation
  const discardToCrib = () => {
    if (selectedCards.length !== 2) return;

    if (gameState !== 'cribSelect' || playerHand.length !== 6) {
      console.error('discardToCrib called in wrong state:', gameState, 'or wrong hand size:', playerHand.length);
      return;
    }

    // Hide selected cards from hand during animation
    setDiscardingCards([...selectedCards]);

    // Find the selected card elements by looking for cards with the cyan selection ring
    const cardElements = document.querySelectorAll('[class*="ring-cyan"]');
    // Target: crib pile (shown next to dealer's hand)
    const endRect = cribPileRef.current?.getBoundingClientRect() ||
      (dealer === 'computer' ? computerHandRef : null)?.current?.getBoundingClientRect() ||
      { top: dealer === 'computer' ? 100 : 500, left: window.innerWidth / 2 - 20 };

    // After all animations complete, finalize
    const finalize = () => {
      setFlyingCard(null);
      setDiscardingCards([]);
      applyCribDiscard();
    };

    // After player animation completes: handle moment 5 or finalize
    const afterPlayerDiscard = () => {
      setFlyingCard(null);
      if (computerDiscardMoment === 5 && !computerDiscardDone) {
        const delay = 500 + Math.random() * 500;
        setTimeout(() => animateComputerDiscard(finalize), delay);
      } else {
        finalize();
      }
    };

    if (cardElements.length >= 2) {
      // Capture both start positions before any animation
      const startRect1 = cardElements[0].getBoundingClientRect();
      const startRect2 = cardElements[1].getBoundingClientRect();

      // Moment 4: Interleave - player card 1, computer cards, player card 2
      if (computerDiscardMoment === 4 && !computerDiscardDone) {
        setFlyingCard({
          card: selectedCards[0],
          startRect: startRect1,
          endRect,
          onComplete: () => {
            setCribCardsInPile(prev => prev + 1);
            // Computer's two cards fly next
            animateComputerDiscard(() => {
              // Then player's second card
              setFlyingCard({
                card: selectedCards[1],
                startRect: startRect2,
                endRect,
                onComplete: () => {
                  setCribCardsInPile(prev => prev + 1);
                  finalize();
                }
              });
            });
          }
        });
      } else {
        // Moments 1-3, 5: player cards animate sequentially
        setFlyingCard({
          card: selectedCards[0],
          startRect: startRect1,
          endRect,
          onComplete: () => {
            setCribCardsInPile(prev => prev + 1);
            setFlyingCard({
              card: selectedCards[1],
              startRect: startRect2,
              endRect,
              onComplete: () => {
                setCribCardsInPile(prev => prev + 1);
                afterPlayerDiscard();
              }
            });
          }
        });
      }
    } else {
      // Fallback: no animation
      applyCribDiscard();
    }
  };

  // Handle cut for starter card
  const handleStarterCut = (cutPosition) => {
    // Use cut position to determine card (adds feeling that position matters)
    const cutIndex = Math.floor(cutPosition * (deck.length - 1));
    const cut = deck[cutIndex];
    const newDeck = [...deck.slice(0, cutIndex), ...deck.slice(cutIndex + 1)];

    setPendingCutCard(cut);
    setDeck(newDeck);

    // Reveal after animation
    setTimeout(() => {
      setCutCard(cut);
      setPendingCutCard(null);

      logGameEvent('CUT_FOR_STARTER', {
        cutCard: cut,
        cutPosition: cutPosition
      });

      if (cut.rank === 'J') {
        // Fire cut celebration
        const cutCelebration = celebrateCut(cut, {
          scorer: dealer,
          celebrationLevel,
          motionLevel,
        });
        if (cutCelebration.phrase) {
          setCelebrationToast({ phrase: cutCelebration.phrase, animation: cutCelebration.animation });
        }

        setGameState('play');
        if (dealer === 'player') {
          setPendingScore({ player: 'player', points: 2, reason: 'His heels!' });
          setMessage('His heels! 2 points for dealer - Click Accept');
        } else {
          setPendingScore({ player: 'computer', points: 2, reason: 'His heels!' });
          setMessage('His heels! 2 points for dealer - Click Accept');
        }
        setCurrentPlayer(dealer === 'player' ? 'computer' : 'player');
      } else {
        setGameState('play');
        setCurrentPlayer(dealer === 'player' ? 'computer' : 'player');
        setMessage(dealer === 'player' ? "Computer's turn (non-dealer starts)" : "Your turn (non-dealer starts)");
      }
    }, 1500);
  };

  // Auto-trigger computer cut when they are non-dealer
  useEffect(() => {
    if (gameState === 'cutForStarter' && dealer === 'player' && !pendingCutCard) {
      // Computer is non-dealer, they cut automatically after a short delay
      const timer = setTimeout(() => {
        const randomPosition = Math.random() * 0.6 + 0.2; // 20-80% of deck
        handleStarterCut(randomPosition);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [gameState, dealer, pendingCutCard]);

  // Accept score and continue
  const acceptScoreAndContinue = () => {
    if (!pendingScore) return;

    // Use centralized scoring function
    const { newScore, gameEnded } = addPoints(pendingScore.player, pendingScore.points, pendingScore.reason);

    logGameEvent('SCORE_POINTS', {
      player: pendingScore.player,
      points: pendingScore.points,
      reason: pendingScore.reason,
      newPlayerScore: pendingScore.player === 'player' ? newScore : playerScore,
      newComputerScore: pendingScore.player === 'computer' ? newScore : computerScore
    });

    // Add to pegging history if this is a pegging phase score or His heels
    if (gameState === 'play' || pendingScore.reason === 'One for last card' || pendingScore.reason === 'His heels!') {
      setPeggingHistory(prev => [...prev, {
        type: 'points',
        player: pendingScore.player,
        points: pendingScore.points,
        reason: pendingScore.reason
      }]);
    }

    const scoringPlayer = pendingScore.player;
    const wasGoPoint = pendingScore.reason === 'One for last card';
    const wasHisHeels = pendingScore.reason === 'His heels!';
    const needsLastCard = pendingScore.needsLastCard;
    setPendingScore(null);

    setLastGoPlayer(null);

    // If game ended due to win, stop processing
    if (gameEnded) return;

    if (needsLastCard) {
      setPendingScore({ player: scoringPlayer, points: 1, reason: 'One for last card' });
      setMessage(`${scoringPlayer === 'player' ? 'Now claim' : 'Computer also gets'} 1 point for last card - Click Accept`);
      return;
    }

    if (wasHisHeels) {
      setMessage(`${currentPlayer === 'player' ? 'Your' : "Computer's"} turn (non-dealer starts)`);
    } else if (gameState === 'play') {
      if (playerPlayHand.length === 0 && computerPlayHand.length === 0) {
        moveToCountingPhase();
        return;
      }

      if (currentCount === 31 || (wasGoPoint && (playerPlayHand.length > 0 || computerPlayHand.length > 0))) {
        if (playerPlayHand.length > 0 || computerPlayHand.length > 0) {
          setPlayerPlayedCards([]);
          setComputerPlayedCards([]);
          setAllPlayedCards([]);
          setCurrentCount(0);
          setLastGoPlayer(null);

          if (playerPlayHand.length > 0 && computerPlayHand.length === 0) {
            setCurrentPlayer('player');
            setMessage('Your turn - play your remaining cards');
          } else if (computerPlayHand.length > 0 && playerPlayHand.length === 0) {
            setCurrentPlayer('computer');
            setMessage("Computer plays remaining cards");
          } else if (playerPlayHand.length > 0 && computerPlayHand.length > 0) {
            const nextPlayer = lastPlayedBy === 'player' ? 'computer' : 'player';
            setCurrentPlayer(nextPlayer);
            setMessage(`${nextPlayer === 'player' ? 'Your' : "Computer's"} turn - new round`);
          }

          setLastPlayedBy(null);
        }
      } else {
        // Determine next player, but check if they have cards to play
        let nextPlayer = scoringPlayer === 'player' ? 'computer' : 'player';

        // Check if the intended next player has any playable cards
        const nextPlayerHand = nextPlayer === 'player' ? playerPlayHand : computerPlayHand;
        const otherPlayerHand = nextPlayer === 'player' ? computerPlayHand : playerPlayHand;
        const nextPlayerCanPlay = nextPlayerHand.some(card => currentCount + card.value <= 31);
        const otherPlayerCanPlay = otherPlayerHand.some(card => currentCount + card.value <= 31);

        if (nextPlayerHand.length === 0 || !nextPlayerCanPlay) {
          // Next player has no cards or can't play any
          if (otherPlayerHand.length > 0 && otherPlayerCanPlay) {
            // Other player can still play, but current player must say "Go" first
            if (nextPlayer === 'player' && nextPlayerHand.length > 0) {
              // Player has cards - let them play or say Go
              setCurrentPlayer('player');
              setMessage('Your turn');
            } else if (nextPlayer === 'computer') {
              // Computer has cards but can't play - auto Go
              setMessage('Computer says "Go"');
              setLastGoPlayer('computer');
              logGameEvent('COMPUTER_GO', { player: 'computer', currentCount: currentCount, remainingCards: nextPlayerHand.length });
              setPeggingHistory(prev => [...prev, { type: 'go', player: 'computer', count: currentCount }]);
              setCurrentPlayer('player');
            } else {
              // Player is out of cards, switch to computer
              nextPlayer = 'computer';
              setCurrentPlayer(nextPlayer);
              setMessage("Computer's turn");
            }
          } else if (otherPlayerHand.length === 0 && nextPlayerHand.length === 0) {
            // Both out of cards
            moveToCountingPhase();
            return;
          } else {
            // Neither can play at current count
            // If one player is out of cards and the other can't play, auto-handle the Go
            if (nextPlayerHand.length > 0 && nextPlayer === 'player' && otherPlayerHand.length === 0) {
              // Player has cards, computer is out of cards, neither can play at this count
              // Auto-handle Go and award last card to computer (who played last)
              setCurrentPlayer('player');
              logGameEvent('PLAYER_GO', { player: 'player', currentCount: currentCount, remainingCards: nextPlayerHand.length, auto: true });
              setPeggingHistory(prev => [...prev, { type: 'go', player: 'player', count: currentCount }]);
              setPendingScore({ player: 'computer', points: 1, reason: 'One for last card' });
              setMessage('Computer gets 1 point for last card - Click Accept');
            } else if (nextPlayerHand.length > 0 && nextPlayer === 'player') {
              // Player has cards - let them play or say Go
              setCurrentPlayer('player');
              setMessage('Your turn');
            } else if (otherPlayerHand.length > 0 && nextPlayer === 'computer') {
              // Computer's turn but can't play - computer says Go first
              setLastGoPlayer('computer');
              logGameEvent('COMPUTER_GO', { player: 'computer', currentCount: currentCount, remainingCards: nextPlayerHand.length });
              setPeggingHistory(prev => [...prev, { type: 'go', player: 'computer', count: currentCount }]);
              // Now player's turn - they also can't play, so they'll need to say Go too
              setCurrentPlayer('player');
              setMessage('Computer says "Go" - Your turn');
            } else if (lastPlayedBy) {
              // One or both players out of cards and neither can play - award last card directly
              // But first log the Go from whoever couldn't play
              if (nextPlayerHand.length > 0) {
                // nextPlayer has cards but can't play - they say Go
                const goPlayer = nextPlayer;
                setLastGoPlayer(goPlayer);
                logGameEvent(goPlayer === 'computer' ? 'COMPUTER_GO' : 'PLAYER_GO', {
                  player: goPlayer, currentCount: currentCount, remainingCards: nextPlayerHand.length
                });
                setPeggingHistory(prev => [...prev, { type: 'go', player: goPlayer, count: currentCount }]);
              }
              setCurrentPlayer('player');
              setPendingScore({ player: lastPlayedBy, points: 1, reason: 'One for last card' });
              const goPrefix = nextPlayerHand.length > 0 ? `${nextPlayer === 'computer' ? 'Computer' : 'You'} say "Go" - ` : '';
              setMessage(`${goPrefix}${lastPlayedBy === 'player' ? 'You get' : 'Computer gets'} 1 point for last card - Click Accept`);
            }
          }
        } else {
          setCurrentPlayer(nextPlayer);
          setMessage(`${nextPlayer === 'player' ? 'Your' : "Computer's"} turn`);
        }
      }
    }
  };

  // Apply computer card play (state updates extracted for animation deferral)
  const applyComputerPlay = useCallback((card) => {
    const newCount = currentCount + card.value;
    const newAllPlayed = [...allPlayedCards, card];
    const { score, reason } = calculatePeggingScore(newAllPlayed, newCount);

    const newComputerPlayHand = computerPlayHand.filter(c => !(c.rank === card.rank && c.suit === card.suit));
    setComputerPlayHand(newComputerPlayHand);
    setComputerPlayedCards(prev => [...prev, card]);
    setAllPlayedCards(newAllPlayed);
    setCurrentCount(newCount);
    setLastPlayedBy('computer');

    // Trigger landing pulse
    setLandingIsComputer(true);
    setLandingCardIndex(computerPlayedCards.length);
    setTimeout(() => setLandingCardIndex(-1), 350);

    logGameEvent('PLAY_CARD', {
      player: 'computer',
      card: card,
      newCount: newCount,
      score: score,
      reason: reason,
      remainingCards: newComputerPlayHand.length
    });

    // Add to pegging history
    setPeggingHistory(prev => [...prev, {
      type: 'play',
      player: 'computer',
      card: `${card.rank}${card.suit}`,
      count: newCount,
      points: score,
      reason: reason || null
    }]);

    const isLastCard = newComputerPlayHand.length === 0;
    const playerOutOfCards = playerPlayHand.length === 0;

    // Fire pegging celebration for computer
    if (score > 0 || (isLastCard && playerOutOfCards)) {
      const isGo = isLastCard && playerOutOfCards && score === 0;
      const pegCelebration = celebratePegging(score || 1, newCount, reason, isGo, {
        scorer: 'computer',
        celebrationLevel,
        motionLevel,
      });
      if (pegCelebration.phrase) {
        setCelebrationToast({ phrase: pegCelebration.phrase, animation: pegCelebration.animation });
      }
    }

    if (score > 0) {
      setCurrentPlayer('player');
      if (isLastCard && playerOutOfCards && newCount !== 31) {
        setPendingScore({
          player: 'computer',
          points: score,
          reason: `Computer plays ${card.rank}${card.suit} - ${reason}`,
          needsLastCard: true
        });
        setMessage(`Computer plays ${card.rank}${card.suit} for ${score} - ${reason} - Click Accept`);
      } else {
        setPendingScore({ player: 'computer', points: score, reason: `Computer plays ${card.rank}${card.suit} - ${reason}` });
        setMessage(`Computer plays ${card.rank}${card.suit} for ${score} - ${reason} - Click Accept`);
      }
    } else if (isLastCard && playerOutOfCards) {
      setCurrentPlayer('player');
      setPendingScore({ player: 'computer', points: 1, reason: 'One for last card' });
      setMessage('Computer gets 1 point for last card - Click Accept');
    } else {
      setMessage(`Computer plays ${card.rank}${card.suit} (count: ${newCount})`);

      if (playerPlayHand.length > 0) {
        setCurrentPlayer('player');
      } else {
        const canContinue = newComputerPlayHand.some(c => newCount + c.value <= 31);
        if (!canContinue && newComputerPlayHand.length > 0) {
          setCurrentPlayer('player');
          setPendingScore({ player: 'computer', points: 1, reason: 'One for last card' });
          setMessage('Computer gets 1 point for last card - Click Accept');
        }
      }
    }
  }, [currentCount, allPlayedCards, computerPlayHand, playerPlayHand, computerPlayedCards]);

  // Computer makes a play - useEffect
  useEffect(() => {
    if (gameState === 'play' && currentPlayer === 'computer' && !pendingScore && !flyingCard) {
      // Guard: computer must have cards to play (bug #97)
      if (computerPlayHand.length === 0) {
        addDebugLog(`Bug #97: computer is currentPlayer with no cards at count ${currentCount}`);
        return;
      }
      const timer = setTimeout(() => {
        const card = computerSelectPlay(computerPlayHand, allPlayedCards, currentCount, aiDifficulty);

        if (card) {
          // Animate computer card from a single card in the hand to play area center
          const firstCard = computerHandRef.current?.querySelector(':scope > *');
          const startRect = firstCard?.getBoundingClientRect();
          const areaRect = computerPlayAreaRef.current?.getBoundingClientRect();
          const endRect = areaRect ? {
            top: areaRect.top,
            left: areaRect.left + areaRect.width / 2 - (startRect?.width || 0) / 2,
            width: areaRect.width,
            height: areaRect.height
          } : null;

          if (startRect && endRect) {
            setFlyingCard({
              card,
              startRect,
              endRect,
              isComputer: true,
              onComplete: () => {
                setFlyingCard(null);
                applyComputerPlay(card);
              }
            });
          } else {
            applyComputerPlay(card);
          }
        } else {
          setMessage('Computer says "Go"');
          setLastGoPlayer('computer');

          logGameEvent('COMPUTER_GO', {
            player: 'computer',
            currentCount: currentCount,
            remainingCards: computerPlayHand.length,
            computerHand: computerPlayHand.map(c => `${c.rank}${c.suit}`),
            playerHand: playerPlayHand.map(c => `${c.rank}${c.suit}`),
          });

          // Add Go to pegging history
          setPeggingHistory(prev => [...prev, {
            type: 'go',
            player: 'computer',
            count: currentCount
          }]);

          const playerCanStillPlay = playerPlayHand.some(card => currentCount + card.value <= 31);

          if (playerCanStillPlay) {
            setCurrentPlayer('player');
            setMessage('Computer says "Go" - You can still play');
          } else {
            // Set currentPlayer to 'player' to prevent useEffect from firing again
            setCurrentPlayer('player');
            if (lastPlayedBy === 'player') {
              setPendingScore({ player: 'player', points: 1, reason: 'One for last card' });
              setMessage('Computer says "Go" - You get 1 point for last card - Click Accept');
            } else if (lastPlayedBy === 'computer') {
              setPendingScore({ player: 'computer', points: 1, reason: 'One for last card' });
              setMessage('Computer says "Go" and gets 1 point for last card - Click Accept');
            }
          }
        }
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameState, pendingScore, flyingCard, computerPlayHand, allPlayedCards, currentCount, playerPlayHand, lastPlayedBy, applyComputerPlay]);

  // Apply player card play (state updates extracted for animation deferral)
  const applyPlayerPlay = useCallback((card) => {
    const newCount = currentCount + card.value;
    const newAllPlayed = [...allPlayedCards, card];
    const { score, reason } = calculatePeggingScore(newAllPlayed, newCount);

    const newPlayerPlayHand = playerPlayHand.filter(c => !(c.rank === card.rank && c.suit === card.suit));
    setPlayerPlayHand(newPlayerPlayHand);
    setPlayerPlayedCards(prev => [...prev, card]);
    setAllPlayedCards(newAllPlayed);
    setCurrentCount(newCount);
    setLastPlayedBy('player');

    // Trigger landing pulse on the newest card
    setLandingIsComputer(false);
    setLandingCardIndex(playerPlayedCards.length); // index of the about-to-be-added card
    setTimeout(() => setLandingCardIndex(-1), 350);

    logGameEvent('PLAY_CARD', {
      player: 'player',
      card: card,
      newCount: newCount,
      score: score,
      reason: reason,
      remainingCards: newPlayerPlayHand.length
    });

    // Add to pegging history
    setPeggingHistory(prev => [...prev, {
      type: 'play',
      player: 'player',
      card: `${card.rank}${card.suit}`,
      count: newCount,
      points: score,
      reason: reason || null
    }]);

    const isLastCard = newPlayerPlayHand.length === 0;
    const computerOutOfCards = computerPlayHand.length === 0;

    // Fire pegging celebration
    if (score > 0 || (isLastCard && computerOutOfCards)) {
      const isGo = isLastCard && computerOutOfCards && score === 0;
      const pegCelebration = celebratePegging(score || 1, newCount, reason, isGo, {
        scorer: 'player',
        celebrationLevel,
        motionLevel,
      });
      if (pegCelebration.phrase) {
        setCelebrationToast({ phrase: pegCelebration.phrase, animation: pegCelebration.animation });
      }
    }

    if (score > 0) {
      // Only award last card if NOT hitting 31 (31 already includes 2-point bonus)
      if (isLastCard && computerOutOfCards && newCount !== 31) {
        setPendingScore({
          player: 'player',
          points: score,
          reason: `You played ${card.rank}${card.suit} - ${reason}`,
          needsLastCard: true
        });
        setMessage(`You scored ${score} - ${reason}! Click Accept (then claim last card)`);
      } else {
        setPendingScore({ player: 'player', points: score, reason: `You played ${card.rank}${card.suit} - ${reason}` });
        setMessage(`You scored ${score} - ${reason}! Click Accept`);
      }
    } else if (isLastCard && computerOutOfCards) {
      setPendingScore({ player: 'player', points: 1, reason: 'One for last card' });
      setMessage('You get 1 point for last card - Click Accept');
    } else {
      setMessage(`You played ${card.rank}${card.suit} (count: ${newCount})`);
      // Only hand control to computer if it has cards to play (bug #97)
      if (computerPlayHand.length > 0) {
        setCurrentPlayer('computer');
      } else {
        // Computer has no cards — player continues playing remaining cards
        setCurrentPlayer('player');
      }
    }
  }, [currentCount, allPlayedCards, playerPlayHand, computerPlayHand, playerPlayedCards]);

  // Player makes a play (with card flight animation)
  const playerPlay = (card, cardEvent) => {
    if (currentPlayer !== 'player' || pendingScore || flyingCard) return;
    if (currentCount + card.value > 31) {
      setMessage("Can't play that card - total would exceed 31");
      return;
    }

    // Get positions for animation - target center of play area
    const startRect = cardEvent?.currentTarget?.getBoundingClientRect();
    const areaRect = playerPlayAreaRef.current?.getBoundingClientRect();
    const endRect = areaRect ? {
      top: areaRect.top,
      left: areaRect.left + areaRect.width / 2 - (startRect?.width || 0) / 2,
      width: areaRect.width,
      height: areaRect.height
    } : null;

    if (startRect && endRect) {
      // Start animation, defer state update until animation completes
      setFlyingCard({
        card,
        startRect,
        endRect,
        isComputer: false,
        onComplete: () => {
          setFlyingCard(null);
          applyPlayerPlay(card);
        }
      });
    } else {
      // Fallback: no animation
      applyPlayerPlay(card);
    }
  };

  // Confirm pegging play via "Play Card" button (finds selected card's DOM position for animation)
  const confirmPeggingPlay = () => {
    if (!peggingSelectedCard) return;
    const selectedEl = document.querySelector('[class*="ring-cyan-400"]');
    const startRect = selectedEl?.getBoundingClientRect();
    const areaRect = playerPlayAreaRef.current?.getBoundingClientRect();
    if (startRect && areaRect) {
      const endRect = {
        top: areaRect.top,
        left: areaRect.left + areaRect.width / 2 - startRect.width / 2,
        width: areaRect.width,
        height: areaRect.height,
      };
      setFlyingCard({
        card: peggingSelectedCard,
        startRect,
        endRect,
        isComputer: false,
        onComplete: () => {
          setFlyingCard(null);
          applyPlayerPlay(peggingSelectedCard);
        },
      });
    } else {
      applyPlayerPlay(peggingSelectedCard);
    }
    setPeggingSelectedCard(null);
  };

  // Player says go
  const playerGo = () => {
    if (currentPlayer !== 'player' || pendingScore) return;

    setMessage('You say "Go"');
    setLastGoPlayer('player');

    logGameEvent('PLAYER_GO', {
      player: 'player',
      currentCount: currentCount,
      remainingCards: playerPlayHand.length
    });

    // Add Go to pegging history
    setPeggingHistory(prev => [...prev, {
      type: 'go',
      player: 'player',
      count: currentCount
    }]);

    const computerCanPlay = computerPlayHand.some(card => currentCount + card.value <= 31);

    if (computerCanPlay) {
      setCurrentPlayer('computer');
    } else {
      if (lastPlayedBy) {
        if (lastPlayedBy === 'player') {
          setPendingScore({ player: 'player', points: 1, reason: 'One for last card' });
          setMessage('You claim 1 point for last card - Click Accept');
        } else {
          setPendingScore({ player: 'computer', points: 1, reason: 'One for last card' });
          setMessage('Computer gets 1 point for last card - Click Accept');
        }
      }
    }
  };

  // Player claims last card point
  const claimLastCard = () => {
    if (currentPlayer !== 'player' || pendingScore) return;

    setPendingScore({ player: 'player', points: 1, reason: 'One for last card' });
    setMessage('You claim 1 point for last card - Click Accept');

    if (playerPlayHand.length === 0 && computerPlayHand.length === 0) {
      return;
    }
  };

  // Submit player's count
  const submitPlayerCount = (directScore = null) => {
    const claimed = directScore !== null ? directScore : parseInt(playerCountInput);
    if (isNaN(claimed)) {
      setMessage('Please enter a valid number');
      return;
    }

    addDebugLog(`Player submitting count - counterIsComputer: ${counterIsComputer}, handsCountedThisRound: ${handsCountedThisRound}, dealer: ${dealer}`);

    if (counterIsComputer) {
      addDebugLog('BLOCKED: Not player turn');
      return;
    }

    let hand;
    let handType;
    if (handsCountedThisRound === 0 && dealer === 'computer') {
      hand = playerHand;
      handType = 'hand';
      addDebugLog('Player counting as non-dealer (hand)');
    } else if (handsCountedThisRound === 0 && dealer === 'player') {
      addDebugLog('ERROR: Player trying to count when they should not');
      return;
    } else if (handsCountedThisRound === 1 && dealer === 'player') {
      hand = playerHand;
      handType = 'hand';
      addDebugLog('Player counting as dealer (hand)');
    } else if (handsCountedThisRound === 2 && dealer === 'player') {
      hand = crib;
      handType = 'crib';
      addDebugLog('Player counting as dealer (crib)');
    } else {
      addDebugLog(`ERROR: Player counting in wrong situation`);
      return;
    }

    const { score, breakdown } = calculateHandScore(hand, cutCard, handType === 'crib');
    setActualScore({ score, breakdown });

    logGameEvent('PLAYER_COUNT', {
      handType: handType,
      claimed: claimed,
      actual: score,
      hand: hand,
      handsCountedThisRound: handsCountedThisRound
    });

    // Add to counting history (copy breakdown array to avoid any reference issues)
    setCountingHistory(prev => [...prev, {
      player: 'player',
      handType,
      cards: hand.map(c => `${c.rank}${c.suit}`),
      cutCard: `${cutCard.rank}${cutCard.suit}`,
      claimed,
      actual: score,
      breakdown: [...breakdown]
    }]);

    const newHandsCountedThisRound = handsCountedThisRound + 1;
    setHandsCountedThisRound(newHandsCountedThisRound);
    setPlayerCountInput('');
    setShowBreakdown(true);

    // Fire celebration toast for notable hands (regardless of correct count)
    const handCelebration = celebrateHand(score, breakdown, {
      scorer: 'player',
      celebrationLevel,
      motionLevel,
      prevHandScore,
      isCrib: handType === 'crib',
    });
    if (handCelebration.phrase) {
      setCelebrationToast({ phrase: handCelebration.phrase, animation: handCelebration.animation });
    }
    setPrevHandScore(score);

    if (claimed === score) {
      // Show celebration for correct count
      setCelebrationScore(score);
      setShowCelebration(true);
      const { gameEnded } = addPoints('player', score, `correct count (${handType})`);
      addDebugLog(`Player count correct. Hands counted now: ${newHandsCountedThisRound}`);

      // If game ended due to win, stop processing
      if (gameEnded) return;

      // Message will be set after celebration completes
      // Store the hands counted for use in celebration callback
      setPendingCountContinue({ newHandsCountedThisRound, type: 'correct', score });
    } else if (claimed < score) {
      const { gameEnded } = addPoints('player', claimed, `undercount (${handType})`);
      setMessage(`You undercounted! You claimed ${claimed} but it's ${score} - You only get ${claimed}. Review the breakdown and click Continue.`);
      addDebugLog(`Player undercounted. Waiting for acknowledgment. Hands counted now: ${newHandsCountedThisRound}`);

      // If game ended due to win, stop processing
      if (gameEnded) return;

      // Wait for player to acknowledge
      setPendingCountContinue({ newHandsCountedThisRound, type: 'undercount' });
    } else {
      setMessage(`Muggins! You overcounted. You claimed ${claimed} but it's only ${score}. You get 0 points. Review the breakdown and click Continue.`);
      // No points for overcounting
      addDebugLog(`Player overcounted. Waiting for acknowledgment. Hands counted now: ${newHandsCountedThisRound}`);

      // Wait for player to acknowledge
      setPendingCountContinue({ newHandsCountedThisRound, type: 'overcount' });
    }
  };

  // Continue after player acknowledges their count result
  const handleCountContinue = () => {
    // If pendingCountContinue is set, use it
    if (pendingCountContinue) {
      const { type, newHandsCountedThisRound } = pendingCountContinue;
      addDebugLog(`Player acknowledged count result (type=${type}). Continuing...`);
      setPendingCountContinue(null);

      // For wrongMuggins and undercount, need to clear additional state
      if (type === 'wrongMuggins' || type === 'undercount') {
        setShowBreakdown(false);
        setActualScore(null);
        setComputerClaimedScore(null);
        setIsProcessingCount(false);
        setPlayerMadeCountDecision(false);
      }

      proceedAfterPlayerCount(newHandsCountedThisRound);
      return;
    }

    // Fallback: derive next step from current state (handles restored games)
    // If actualScore is set, player already submitted - proceed to next count.
    // IMPORTANT: Do NOT fire this fallback when counterIsComputer is true — that means
    // the computer's counting flow (e.g. muggins 5-second timeout) is handling the
    // transition. Allowing the fallback to fire here causes a race condition where BOTH
    // the fallback and the timeout advance the game simultaneously (bug #80).
    if (actualScore && gameState === 'counting' && !counterIsComputer) {
      const nextHandsCount = handsCountedThisRound + 1;
      addDebugLog(`Fallback continue: actualScore set, proceeding with handsCountedThisRound=${nextHandsCount}`);
      setActualScore(null);
      setShowBreakdown(false);
      proceedAfterPlayerCount(nextHandsCount);
      return;
    }

    addDebugLog('handleCountContinue called but no action to take');
  };

  // Handle celebration complete
  const handleCelebrationComplete = () => {
    setShowCelebration(false);
    setCelebrationScore(null);

    if (pendingCountContinue && pendingCountContinue.type === 'correct') {
      const { newHandsCountedThisRound, score } = pendingCountContinue;
      setMessage(`${score} points scored!`);
      setPendingCountContinue(null);
      // Clear actualScore immediately so the computer counting useEffect
      // can see shouldCount=true in this render cycle (bug #84)
      setActualScore(null);
      setShowBreakdown(false);
      // Short delay then proceed
      setTimeout(() => {
        proceedAfterPlayerCount(newHandsCountedThisRound);
      }, 500);
    }
  };

  // Common logic for proceeding after player count
  // Note: Win detection is now handled by addPoints, so we just proceed with next steps
  const proceedAfterPlayerCount = (newHandsCountedThisRound) => {
    setShowBreakdown(false);
    setActualScore(null);

    if (newHandsCountedThisRound >= 3) {
      addDebugLog('All counting complete - dealing next hand');

      setCountingTurn('');
      setCounterIsComputer(null);

      setTimeout(() => {
        setMessage('Hand complete - Dealing next hand...');
        setTimeout(() => {
          const newDealer = dealer === 'player' ? 'computer' : 'player';
          setDealer(newDealer);
          const newDeck = shuffleDeck(createDeck());
          setDeck(newDeck);
          dealHands(newDeck, newDealer);
        }, 1500);
      }, 100);
    } else if (newHandsCountedThisRound === 1) {
      addDebugLog(`First count done by player, dealer (${dealer}) counts hand next`);
      setCountingTurn(dealer);
      setCounterIsComputer(dealer === 'computer');
      setMessage(dealer === 'computer' ? 'Computer counts their hand (dealer)' : 'Count your hand (dealer)');
    } else if (newHandsCountedThisRound === 2) {
      addDebugLog(`Second count done by player, dealer (${dealer}) counts crib next - starting reveal animation`);
      startCribReveal();
    }
  };

  // Computer counts
  const computerCounts = () => {
    addDebugLog(`computerCounts() called - counterIsComputer: ${counterIsComputer}, handsCountedThisRound: ${handsCountedThisRound}, dealer: ${dealer}`);

    if (!counterIsComputer || handsCountedThisRound >= 3) {
      addDebugLog(`BLOCKED: counterIsComputer=${counterIsComputer}, handsCountedThisRound=${handsCountedThisRound}`);
      return;
    }

    if (isProcessingCount) {
      addDebugLog('BLOCKED: computerCounts() blocked by isProcessingCount flag');
      return;
    }

    if (computerClaimedScore !== null) {
      addDebugLog('BLOCKED: computerCounts() blocked - already has claimed score');
      return;
    }

    // Reset decision state for new count
    setPlayerMadeCountDecision(false);
    setShowMugginsPreferenceDialog(false);

    setIsProcessingCount(true);
    addDebugLog('Set isProcessingCount = true');

    let hand;
    let handType;
    if (handsCountedThisRound === 0 && dealer === 'player') {
      hand = computerHand;
      handType = 'hand';
      addDebugLog('Computer counting as non-dealer (hand)');
    } else if (handsCountedThisRound === 1 && dealer === 'computer') {
      hand = computerHand;
      handType = 'hand';
      addDebugLog('Computer counting as dealer (hand)');
    } else if (handsCountedThisRound === 2 && dealer === 'computer') {
      hand = crib;
      handType = 'crib';
      addDebugLog('Computer counting as dealer (crib)');
    } else {
      addDebugLog(`ERROR: Computer counting in wrong situation`);
      setIsProcessingCount(false);
      return;
    }

    addDebugLog(`Computer counting their ${handType}`);

    // Store the hand being counted for history
    setComputerCountingHand({
      handType,
      cards: hand.map(c => `${c.rank}${c.suit}`)
    });

    const { score, breakdown } = calculateHandScore(hand, cutCard, handType === 'crib');
    setActualScore({ score, breakdown });

    // Fire celebration for computer's hand (shown as toast)
    const compCelebration = celebrateHand(score, breakdown, {
      scorer: 'computer',
      celebrationLevel,
      motionLevel,
      prevHandScore,
      isCrib: handType === 'crib',
    });
    if (compCelebration.phrase) {
      setCelebrationToast({ phrase: compCelebration.phrase, animation: compCelebration.animation });
    }
    setPrevHandScore(score);

    let claimed = score;
    const profile = DIFFICULTY_PROFILES[aiDifficulty] || DIFFICULTY_PROFILES.normal;
    if (profile.overcountRate && aiRandom() < profile.overcountRate && score > 0) {
      // Deliberate overcount bluff (currently disabled for Expert — net handicap vs muggins callers)
      const bluff = Math.ceil(aiRandom() * profile.overcountRange);
      claimed = score + bluff;
      addDebugLog(`Computer bluffing overcount: actual ${score}, claiming ${claimed}`);
    } else if (aiRandom() < profile.countingErrorRate && score > 0) {
      const error = aiRandom() < 0.5 ? -profile.countingErrorRange : profile.countingErrorRange;
      claimed = Math.max(0, score + error);
      addDebugLog(`Computer making counting error: actual ${score}, claiming ${claimed}`);
    }

    setComputerClaimedScore(claimed);
    addDebugLog(`Computer claims ${claimed} points for ${handType}`);
    setMessage(`Computer claims ${claimed} points for ${handType === 'crib' ? 'the crib' : 'their hand'} - Do you accept?`);
  };

  // Accept computer's count
  // When user accepts, computer gets what they claimed (that's the muggins rule -
  // if you don't challenge an over-count, they get away with it)
  const acceptComputerCount = () => {
    addDebugLog(`acceptComputerCount() - claimed: ${computerClaimedScore}, actual: ${actualScore?.score}, handsCountedThisRound: ${handsCountedThisRound}, dealer: ${dealer}`);

    setPlayerMadeCountDecision(true);
    const { score, breakdown } = actualScore;

    // Add to counting history
    if (computerCountingHand) {
      setCountingHistory(prev => [...prev, {
        player: 'computer',
        handType: computerCountingHand.handType,
        cards: computerCountingHand.cards,
        cutCard: `${cutCard.rank}${cutCard.suit}`,
        claimed: computerClaimedScore,
        actual: score,
        breakdown
      }]);
    }

    const handType = computerCountingHand?.handType || 'hand';
    // Give computer what they claimed (user accepted without challenging)
    const { gameEnded } = addPoints('computer', computerClaimedScore, `accepted count (${handType})`);

    const newHandsCountedThisRound = handsCountedThisRound + 1;
    setHandsCountedThisRound(newHandsCountedThisRound);
    addDebugLog(`Computer count accepted. Hands counted now: ${newHandsCountedThisRound}`);

    setShowBreakdown(false);
    setActualScore(null);
    setComputerClaimedScore(null);
    setIsProcessingCount(false);

    // If game ended due to win, stop processing
    if (gameEnded) return;

    // Immediately set up next counter and message (don't delay with setTimeout)
    addDebugLog(`After accepting computer count, newHandsCountedThisRound: ${newHandsCountedThisRound}`);

    if (newHandsCountedThisRound >= 3) {
      addDebugLog('All counting complete - dealing next hand');

      setCountingTurn('');
      setCounterIsComputer(null);
      setMessage('Hand complete - Dealing next hand...');

      setTimeout(() => {
        const newDealer = dealer === 'player' ? 'computer' : 'player';
        setDealer(newDealer);
        const newDeck = shuffleDeck(createDeck());
        setDeck(newDeck);
        dealHands(newDeck, newDealer);
      }, 1500);
    } else if (newHandsCountedThisRound === 1) {
      addDebugLog(`First count done, dealer (${dealer}) counts hand next`);
      setCountingTurn(dealer);
      setCounterIsComputer(dealer === 'computer');
      setMessage(dealer === 'computer' ? 'Computer counts their hand (dealer)' : 'Count your hand (dealer)');
    } else if (newHandsCountedThisRound === 2) {
      addDebugLog(`Second count done, dealer (${dealer}) counts crib next - starting reveal animation`);
      startCribReveal();
    }
  };

  // Apply the result of a wrong muggins call based on preference
  const applyWrongMugginsResult = (preference, resultData) => {
    const { score, claimed, newHandsCountedThisRound } = resultData;

    let gameEnded;
    if (preference === '2-points') {
      setMessage(`Wrong call! Computer's count was correct (${claimed}). Computer gets ${claimed} + 2 penalty points.`);
      ({ gameEnded } = addPoints('computer', claimed + 2, 'wrong muggins + penalty'));
    } else {
      setMessage(`Wrong call! Computer's count was correct. They get ${claimed} points.`);
      ({ gameEnded } = addPoints('computer', claimed, 'wrong muggins'));
    }

    // If game ended due to win, stop processing
    if (gameEnded) return;

    setShowBreakdown(true);
    setPlayerMadeCountDecision(true);

    // Let user review the breakdown at their own pace - they click Continue when ready
    setPendingCountContinue({ type: 'wrongMuggins', newHandsCountedThisRound });
  };

  // Handle muggins preference selection
  const handleMugginsPreferenceChoice = (preference) => {
    saveMugginsPreference(preference);
    setShowMugginsPreferenceDialog(false);
    if (pendingWrongMugginsResult) {
      applyWrongMugginsResult(preference, pendingWrongMugginsResult);
      setPendingWrongMugginsResult(null);
    }
  };

  // Object to computer's count
  const objectToComputerCount = () => {
    const { score, breakdown } = actualScore;
    addDebugLog(`Object to computer count: claimed=${computerClaimedScore}, actual=${score}`);

    setPlayerMadeCountDecision(true);

    // Add to counting history (for all objection cases)
    if (computerCountingHand) {
      setCountingHistory(prev => [...prev, {
        player: 'computer',
        handType: computerCountingHand.handType,
        cards: computerCountingHand.cards,
        cutCard: `${cutCard.rank}${cutCard.suit}`,
        claimed: computerClaimedScore,
        actual: score,
        breakdown,
        objected: true
      }]);
    }

    if (computerClaimedScore > score) {
      // Correct muggins call - computer overcounted
      const mugginsPoints = computerClaimedScore - score;
      setMessage(`MUGGINS! Computer overcounted: claimed ${computerClaimedScore} but actual is ${score}. Computer gets 0, you get ${mugginsPoints}!`);
      setShowBreakdown(true);

      const { gameEnded } = addPoints('player', mugginsPoints, 'muggins');

      logGameEvent('MUGGINS', {
        caughtPlayer: 'computer',
        claimed: computerClaimedScore,
        actual: score,
        mugginsPoints: mugginsPoints,
        breakdown: breakdown
      });

      // If game ended due to win, stop processing
      if (gameEnded) return;

      const newHandsCountedThisRound = handsCountedThisRound + 1;
      setHandsCountedThisRound(newHandsCountedThisRound);
      addDebugLog(`Computer overcount caught. Hands counted now: ${newHandsCountedThisRound}`);

      setTimeout(() => {
        setShowBreakdown(false);
        setActualScore(null);
        setComputerClaimedScore(null);
        setIsProcessingCount(false);
        setPlayerMadeCountDecision(false);

        if (newHandsCountedThisRound >= 3) {
          addDebugLog('All counting complete after muggins');
    
          setCountingTurn('');
          setCounterIsComputer(null);

          setTimeout(() => {
            setMessage('Hand complete - Dealing next hand...');
            setTimeout(() => {
              const newDealer = dealer === 'player' ? 'computer' : 'player';
              setDealer(newDealer);
              const newDeck = shuffleDeck(createDeck());
              setDeck(newDeck);
              dealHands(newDeck, newDealer);
            }, 1500);
          }, 100);
        } else if (newHandsCountedThisRound === 1) {
          addDebugLog(`First count done (muggins), dealer (${dealer}) counts hand next`);
          setCountingTurn(dealer);
          setCounterIsComputer(dealer === 'computer');
          setMessage(dealer === 'computer' ? 'Computer counts their hand (dealer)' : 'Count your hand (dealer)');
        } else if (newHandsCountedThisRound === 2) {
          addDebugLog(`Second count done (muggins), dealer (${dealer}) counts crib next - starting reveal animation`);
          startCribReveal();
        }
      }, 5000);
    } else if (computerClaimedScore === score) {
      // Wrong muggins call - computer was correct
      const newHandsCountedThisRound = handsCountedThisRound + 1;
      setHandsCountedThisRound(newHandsCountedThisRound);

      const preference = getMugginsPreference();
      if (!preference) {
        // First time - ask for preference
        setPendingWrongMugginsResult({ score, claimed: computerClaimedScore, newHandsCountedThisRound });
        setShowMugginsPreferenceDialog(true);
        return;
      }

      applyWrongMugginsResult(preference, { score, claimed: computerClaimedScore, newHandsCountedThisRound });
    } else {
      // Computer undercounted - player's objection reveals they could have had more
      setPlayerMadeCountDecision(true);
      setMessage(`Computer undercounted! They claimed ${computerClaimedScore} but could have had ${score}. They get ${computerClaimedScore} points.`);
      const { gameEnded } = addPoints('computer', computerClaimedScore, 'undercount');
      setShowBreakdown(true);

      // If game ended due to win, stop processing
      if (gameEnded) return;

      const newHandsCountedThisRound = handsCountedThisRound + 1;
      setHandsCountedThisRound(newHandsCountedThisRound);

      // Let user review the breakdown at their own pace - they click Continue when ready
      setPendingCountContinue({ type: 'undercount', newHandsCountedThisRound });
    }
  };

  // Check if pegging is truly complete
  useEffect(() => {
    if (gameState === 'play' && !pendingScore && !flyingCard) {
      if (playerPlayHand.length === 0 && computerPlayHand.length === 0) {
        // Before transitioning, ensure last-card point has been awarded (bug #94)
        if (lastPlayedBy) {
          addDebugLog(`Watchdog: awarding last-card point to ${lastPlayedBy} before counting transition`);
          setPendingScore({ player: lastPlayedBy, points: 1, reason: 'One for last card' });
          setCurrentPlayer('player');
          setMessage(`${lastPlayedBy === 'player' ? 'You get' : 'Computer gets'} 1 point for last card - Click Accept`);
        } else {
          moveToCountingPhase();
        }
      }
    }
  }, [gameState, playerPlayHand.length, computerPlayHand.length, pendingScore, flyingCard, lastPlayedBy]);

  // Use effect for computer counting
  useEffect(() => {
    const shouldComputerCount = gameState === 'counting' &&
                               counterIsComputer === true &&
                               !pendingScore &&
                               !actualScore &&
                               computerClaimedScore === null &&
                               !isProcessingCount &&
                               handsCountedThisRound < 3 &&
                               cribRevealPhase !== 'revealing';

    addDebugLog(`useEffect check - shouldCount: ${shouldComputerCount}, counterIsComputer: ${counterIsComputer}, ` +
                `handsCountedThisRound: ${handsCountedThisRound}, state: ${gameState}, pendingScore: ${!!pendingScore}, ` +
                `actualScore: ${!!actualScore}, computerClaimedScore: ${computerClaimedScore}, isProcessingCount: ${isProcessingCount}`);

    if (shouldComputerCount) {
      addDebugLog('Setting timer for computer to count');
      const timer = setTimeout(() => {
        addDebugLog('Timer fired - calling computerCounts()');
        computerCounts();
      }, 1500);
      return () => {
        addDebugLog('Clearing computer count timer');
        clearTimeout(timer);
      };
    }
  }, [counterIsComputer, gameState, pendingScore, actualScore, computerClaimedScore, isProcessingCount, handsCountedThisRound, dealer, countingTurn, cribRevealPhase]);

  // Recovery: if game was restored with all 3 hands counted, deal next hand.
  // Uses needsRecoveryDealRef (set ONLY in restore code) to avoid firing during
  // normal gameplay where handsCountedThisRound transiently reaches 3.
  useEffect(() => {
    if (needsRecoveryDealRef.current) {
      needsRecoveryDealRef.current = false;
      console.log('[Recovery] Restored with counting complete - dealing next hand');
      const timer = setTimeout(() => {
        setDealer(prev => prev === 'player' ? 'computer' : 'player');
        const newDeck = shuffleDeck(createDeck());
        setDeck(newDeck);
        dealHands(newDeck);
      }, 1500);
      return () => clearTimeout(timer);
    }
  });

  // Recovery: clear stale actualScore when left over from a previous count sub-phase.
  // Handles two cases:
  // 1. Player's turn but actualScore set without pendingCountContinue (bug #77)
  // 2. Computer's turn but actualScore set without computerClaimedScore (bug #79)
  //    — stale from player's previous count, blocks computer counting useEffect
  useEffect(() => {
    if (gameState === 'counting' && counterIsComputer === false &&
        actualScore && !pendingCountContinue && !showCelebration) {
      console.log('[Recovery] Clearing stale actualScore during player counting turn',
        { actualScore, computerClaimedScore, handsCountedThisRound, counterIsComputer });
      setActualScore(null);
      setComputerClaimedScore(null);
      setShowBreakdown(false);
    }
    if (gameState === 'counting' && counterIsComputer === true &&
        actualScore && !computerClaimedScore && !isProcessingCount) {
      console.log('[Recovery] Clearing stale actualScore blocking computer counting',
        { actualScore, handsCountedThisRound, counterIsComputer });
      setActualScore(null);
      setShowBreakdown(false);
    }
  }, [gameState, counterIsComputer, actualScore, pendingCountContinue, showCelebration, computerClaimedScore, isProcessingCount]);

  // === Required Action Hook (Phase 1 - Prevent Stuck States) ===
  // Single source of truth for what action the user should take
  const gameStateForAction = {
    gameState,
    currentPlayer,
    selectedCards,
    playerHand,
    pendingScore,
    pendingCountContinue,
    counterIsComputer,
    actualScore,
    computerClaimedScore,
    playerMadeCountDecision,
    showMugginsPreferenceDialog,
    playerPlayHand,
    currentCount,
    cutResultReady,
    dealer,
    peggingSelectedCard,
  };

  const actionHandlers = {
    discardToCrib,
    acceptScoreAndContinue,
    handleCountContinue,
    playerGo,
    startNewGame,
    acceptComputerCount,
    objectToComputerCount,
    handleMugginsPreferenceChoice,
    confirmPeggingPlay,
  };

  const requiredAction = useRequiredAction(gameStateForAction, actionHandlers);

  // Development debug logging
  useActionDebug(requiredAction, gameStateForAction);

  // Handle "I'm Stuck" menu option - auto-submits bug report and attempts recovery
  const handleStuckRecovery = useCallback(async () => {
    addDebugLog('User clicked "I\'m Stuck" - auto-submitting bug report');

    // Capture full state for bug report
    const stuckStateReport = {
      timestamp: new Date().toISOString(),
      appVersion: APP_VERSION,
      requiredAction: {
        type: requiredAction.type,
        label: requiredAction.label,
        requiresButton: requiredAction.requiresButton,
      },
      gameState: {
        state: gameState,
        dealer,
        currentPlayer,
        playerScore,
        computerScore,
        handsCountedThisRound,
        counterIsComputer,
        countingTurn,
        pendingCountContinue: pendingCountContinue ? {
          type: pendingCountContinue.type,
          newHandsCountedThisRound: pendingCountContinue.newHandsCountedThisRound,
        } : null,
        pendingScore: pendingScore ? {
          points: pendingScore.points,
          reason: pendingScore.reason,
        } : null,
        computerClaimedScore,
        playerMadeCountDecision,
        showMugginsPreferenceDialog,
        actualScore,
        isProcessingCount,
      },
      cards: {
        playerHand: playerHand?.map(c => `${c.rank}${c.suit}`),
        computerHand: computerHand?.map(c => `${c.rank}${c.suit}`),
        crib: crib?.map(c => `${c.rank}${c.suit}`),
        cutCard: cutCard ? `${cutCard.rank}${cutCard.suit}` : null,
        playerPlayHand: playerPlayHand?.map(c => `${c.rank}${c.suit}`),
        computerPlayHand: computerPlayHand?.map(c => `${c.rank}${c.suit}`),
      },
      recentGameLog: gameLog.slice(-20),
      recentDebugLog: debugLog.slice(-50),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };

    // Auto-submit bug report
    try {
      await fetch('/api/bug-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'AUTO_STUCK_STATE',
          description: `User clicked "Stuck" button. Required action was: ${requiredAction.type} (${requiredAction.label || 'no label'})`,
          gameState: stuckStateReport,
          userEmail: user?.attributes?.email || user?.username || 'unknown',
        }),
      });
      addDebugLog('Auto bug report submitted successfully');
    } catch (err) {
      addDebugLog(`Failed to submit auto bug report: ${err.message}`);
    }

    // Try to recover based on current state
    if (pendingCountContinue) {
      addDebugLog('Stuck recovery: pendingCountContinue set, calling handleCountContinue');
      handleCountContinue();
    } else if (pendingScore) {
      addDebugLog('Stuck recovery: pendingScore set, calling acceptScoreAndContinue');
      acceptScoreAndContinue();
    } else if (gameState === 'counting' && counterIsComputer && computerClaimedScore !== null) {
      addDebugLog('Stuck recovery: computer claimed score, calling acceptComputerCount');
      acceptComputerCount();
    } else if (gameState === 'counting' && actualScore && computerClaimedScore === null) {
      // Restored game with player's actualScore blocking computer count
      addDebugLog('Stuck recovery: actualScore blocking computer count, clearing and proceeding');
      setActualScore(null);
      setShowBreakdown(false);
      // Trigger computer to count by ensuring state is correct
      if (counterIsComputer) {
        setMessage('Resuming - Computer will count...');
      } else {
        // Player's turn to count - let them use ScoreSelector
        setMessage('Enter your score to continue');
      }
    } else if (gameState === 'gameOver') {
      addDebugLog('Stuck recovery: game over, returning to menu');
      returnToMenu();
    } else if (gameState === 'play' && currentPlayer === 'computer' && !pendingScore) {
      // Computer should be playing but isn't - give turn to player
      addDebugLog('Stuck recovery: computer stuck in play phase, switching to player');
      setCurrentPlayer('player');
      setMessage('Your turn');
    } else if (gameState === 'play' && playerPlayHand.length === 0 && computerPlayHand.length === 0) {
      // Both out of cards but didn't transition to counting
      addDebugLog('Stuck recovery: both players out of cards, moving to counting');
      moveToCountingPhase();
    } else if (gameState === 'cutForStarter' && dealer === 'player') {
      // Computer should have auto-cut but didn't - trigger it
      addDebugLog('Stuck recovery: computer cut stuck, triggering cut');
      const randomPosition = Math.random() * 0.6 + 0.2;
      handleStarterCut(randomPosition);
    } else {
      addDebugLog('Unknown stuck state, no automatic recovery available');
      setMessage('Bug report sent. If still stuck, use menu to forfeit.');
    }
  }, [
    requiredAction, gameState, dealer, currentPlayer, playerScore, computerScore,
    handsCountedThisRound, counterIsComputer, countingTurn, pendingCountContinue,
    pendingScore, computerClaimedScore, playerMadeCountDecision, showMugginsPreferenceDialog,
    actualScore, isProcessingCount, playerHand, computerHand, crib, cutCard,
    playerPlayHand, computerPlayHand, gameLog, debugLog, user
  ]);

  // Check if player can play any card
  const playerCanPlay = playerPlayHand.some(card => currentCount + card.value <= 31);

  return (
    <>
    {flyingCard && (
      <FlyingCard
        key={`${flyingCard.card.rank}${flyingCard.card.suit}${flyingCard.faceDown ? '-fd' : ''}${flyingCard.className || ''}`}
        card={flyingCard.card}
        startRect={flyingCard.startRect}
        endRect={flyingCard.endRect}
        onComplete={flyingCard.onComplete}
        faceDown={flyingCard.faceDown || false}
        className={flyingCard.className || 'flying-card'}
      />
    )}
    <div className="min-h-screen bg-green-900 p-4">
      {/* Three-dot menu in top right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="bg-green-700 hover:bg-green-600 text-white w-10 h-10 rounded-lg text-xl font-bold shadow-lg border border-green-600 transition-colors flex items-center justify-center"
        >
          ⋮
        </button>

        {/* Dropdown menu */}
        {showMenu && (
          <>
            {/* Backdrop to close menu */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 overflow-hidden">
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowBugReport(true);
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center gap-3 border-b border-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Report Bug
              </button>

              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowBugReportViewer(true);
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center gap-3 border-b border-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Bug Reports
                {unreadBugReports > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadBugReports}
                  </span>
                )}
              </button>

              {/* Leaderboard - available to all users */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowLeaderboard(true);
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center gap-3 border-b border-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Leaderboard
              </button>

              {/* Switch Difficulty Mode */}
              <button
                onClick={() => {
                  setShowMenu(false);
                  const newMode = aiDifficulty === 'expert' ? 'normal' : 'expert';
                  setAiDifficulty(newMode);
                  saveAiDifficulty(newMode);
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center gap-3 border-b border-gray-700"
              >
                {aiDifficulty === 'expert' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )}
                {aiDifficulty === 'expert' ? 'Switch to Normal' : 'Switch to Expert'}
              </button>

              {/* Celebration Level */}
              <button
                onClick={() => {
                  const levels = ['off', 'minimal', 'classic', 'lively', 'fullBanter'];
                  const labels = { off: 'Off', minimal: 'Minimal', classic: 'Classic', lively: 'Lively', fullBanter: 'Full Banter' };
                  const idx = levels.indexOf(celebrationLevel);
                  const next = levels[(idx + 1) % levels.length];
                  setCelebrationLevel(next);
                  if (typeof window !== 'undefined') localStorage.setItem('celebrationLevel', next);
                  setMessage(`Celebrations: ${labels[next]}`);
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center gap-3 border-b border-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Celebrations: {{ off: 'Off', minimal: 'Minimal', classic: 'Classic', lively: 'Lively', fullBanter: 'Full Banter' }[celebrationLevel]}
              </button>

              {/* Admin Panel - only for chris@chrisk.com */}
              {user?.attributes?.email === 'chris@chrisk.com' && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowAdminPanel(true);
                  }}
                  className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center gap-3 border-b border-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Admin Panel
                </button>
              )}

              {/* I'm Stuck option - only during active gameplay */}
              {gameState !== 'menu' && gameState !== 'gameOver' && gameState !== 'cutting' && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleStuckRecovery();
                  }}
                  className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center gap-3 border-b border-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  I'm Stuck
                </button>
              )}

              {gameState !== 'menu' && gameState !== 'gameOver' && gameState !== 'cutting' && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowForfeitConfirm(true);
                  }}
                  className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center gap-3 border-b border-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Forfeit
                </button>
              )}

              <button
                onClick={() => {
                  setShowMenu(false);
                  if (onLogout) onLogout();
                }}
                className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 flex items-center gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </>
        )}
      </div>

      <div className="max-w-6xl mx-auto">
        <Card className="bg-green-800 text-white">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Cribbage</CardTitle>
            <div className="text-center text-green-600 text-xs">{APP_VERSION}</div>
            {user?.attributes?.email && (
              <div className="text-center text-green-400 text-xs mt-0.5">{user.attributes.email}</div>
            )}
            {gameState !== 'menu' && (
              <div className="text-center mt-0.5" data-testid="difficulty-label">
                {aiDifficulty === 'expert' ? (
                  <span className="bg-orange-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">EXPERT MODE</span>
                ) : (
                  <span className="bg-green-700 text-white text-xs font-bold px-2 py-0.5 rounded-full">NORMAL MODE</span>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {gameState === 'menu' && (
              <div className="text-center">
                {isLoadingGame ? (
                  <div className="text-gray-400">Loading...</div>
                ) : (
                  <>
                    {/* Stats display */}
                    {(userStats.wins > 0 || userStats.losses > 0 || userStats.forfeits > 0) && (
                      <div className="mb-4 text-sm">
                        <div className="text-gray-400 mb-1">Normal Record:</div>
                        <div className="flex justify-center gap-4">
                          <span className="text-green-400">W: {userStats.wins}</span>
                          <span className="text-red-400">L: {userStats.losses}</span>
                          {userStats.forfeits > 0 && (
                            <span className="text-yellow-400">F: {userStats.forfeits}</span>
                          )}
                        </div>
                      </div>
                    )}
                    {(userExpertStats.wins > 0 || userExpertStats.losses > 0 || userExpertStats.forfeits > 0) && (
                      <div className="mb-4 text-sm">
                        <div className="text-orange-400 mb-1">Expert Record:</div>
                        <div className="flex justify-center gap-4">
                          <span className="text-green-400">W: {userExpertStats.wins}</span>
                          <span className="text-red-400">L: {userExpertStats.losses}</span>
                          {userExpertStats.forfeits > 0 && (
                            <span className="text-yellow-400">F: {userExpertStats.forfeits}</span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Resume game button */}
                    {savedGameExists && (
                      <div className="mb-4">
                        <Button
                          onClick={resumeGame}
                          className="text-lg px-8 py-4 bg-green-600 hover:bg-green-700"
                        >
                          Resume Game
                        </Button>
                        <div className="text-xs text-gray-400 mt-2">
                          Game in progress saved
                        </div>
                      </div>
                    )}

                    {/* Difficulty selector */}
                    <div className="mb-6" data-testid="difficulty-selector">
                      <div className="text-gray-400 text-sm mb-2">Difficulty:</div>
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => { setAiDifficulty('normal'); saveAiDifficulty('normal'); }}
                          className={`px-4 py-2 rounded-l-full text-sm font-medium transition-colors ${
                            aiDifficulty === 'normal'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          Normal
                        </button>
                        <button
                          onClick={() => { setAiDifficulty('expert'); saveAiDifficulty('expert'); }}
                          className={`px-4 py-2 rounded-r-full text-sm font-medium transition-colors ${
                            aiDifficulty === 'expert'
                              ? 'bg-orange-600 text-white'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          Expert
                        </button>
                      </div>
                      {aiDifficulty === 'expert' && (
                        <div className="text-orange-400 text-xs mt-2 text-left max-w-[260px] mx-auto">
                          <div className="mb-1 font-medium">Expert AI improvements:</div>
                          <ul className="list-disc list-inside space-y-0.5 text-gray-300">
                            <li>Optimal discards via expected value</li>
                            <li>Evaluates all 46 possible cuts</li>
                            <li>Smarter pegging with count control</li>
                            <li>Rarely miscounts — stay sharp with muggins!</li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* New game button - only shown when no saved game exists */}
                    {!savedGameExists && (
                      <Button
                        onClick={startNewGame}
                        className="text-lg px-8 py-4"
                      >
                        Start New Game
                      </Button>
                    )}

                  </>
                )}
              </div>
            )}

            {/* Cutting for dealer */}
            {gameState === 'cutting' && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="text-lg mb-4">{message}</div>

                  {/* Visual deck cut */}
                  <div className="flex justify-center gap-12 mb-6">
                    {/* Player's cut */}
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-2">Your cut</div>
                      <DeckCut
                        onCut={playerCutDeck}
                        disabled={!!playerCutCard}
                        label=""
                        revealedCard={playerCutCard}
                        showCutAnimation={!!playerCutCard}
                      />
                    </div>

                    {/* Computer's cut */}
                    <div className="text-center">
                      <div className="text-sm text-gray-400 mb-2">Computer's cut</div>
                      {computerCutCard ? (
                        <DeckCut
                          disabled={true}
                          label=""
                          revealedCard={computerCutCard}
                          showCutAnimation={true}
                        />
                      ) : playerCutCard ? (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-gray-500 animate-pulse">Cutting...</div>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center">
                          <div className="text-gray-600 text-sm">Waiting for your cut</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {cutResultReady && (
                    <Button onClick={proceedToDeal} className="bg-green-600 hover:bg-green-700 text-lg px-6 py-3">
                      {dealer === 'player' ? 'Deal the Cards' : 'Let Computer Deal'}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Cut for starter card */}
            {gameState === 'cutForStarter' && (
              <div className="text-center">
                <div className="mb-6">
                  <div className="text-lg mb-4">{message}</div>

                  {/* Show hands for reference */}
                  <div className="mb-6">
                    <div className="text-sm text-gray-400 mb-2">Your hand:</div>
                    <div className="flex justify-center gap-2">
                      {playerHand.map((card, idx) => (
                        <div key={idx} className={`bg-white rounded p-2 text-lg font-bold ${
                          card.suit === '♥' || card.suit === '♦' ? 'text-red-600' : 'text-black'
                        }`}>
                          {card.rank}{card.suit}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Deck cut for starter */}
                  <div className="flex justify-center">
                    {dealer === 'player' ? (
                      // Computer is non-dealer, they cut - auto-cut after delay
                      <div className="text-center">
                        <DeckCut
                          disabled={true}
                          label="Computer is cutting..."
                          revealedCard={pendingCutCard}
                          showCutAnimation={!!pendingCutCard}
                        />
                        {!pendingCutCard && (
                          <div className="mt-4">
                            <div className="text-gray-400 animate-pulse">Computer is cutting the deck...</div>
                            {/* Auto-trigger computer cut */}
                            <script dangerouslySetInnerHTML={{ __html: '' }} />
                          </div>
                        )}
                      </div>
                    ) : (
                      // Player is non-dealer, they cut
                      <DeckCut
                        onCut={handleStarterCut}
                        disabled={!!pendingCutCard}
                        label="Cut for the starter card"
                        revealedCard={pendingCutCard}
                        showCutAnimation={!!pendingCutCard}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Game Status - shows current phase and progress */}
            {gameState !== 'menu' && (
              <GameStatus
                gameState={gameState}
                dealer={dealer}
                playerScore={playerScore}
                computerScore={computerScore}
                playerHandLength={playerHand.length}
                selectedCardsLength={selectedCards.length}
                playerPlayedCards={playerPlayedCards.length}
                computerPlayedCards={computerPlayedCards.length}
                handsCountedThisRound={handsCountedThisRound}
                counterIsComputer={counterIsComputer}
                currentPlayer={currentPlayer}
              />
            )}

            {gameState !== 'menu' && gameState !== 'cutting' && gameState !== 'cutForStarter' && (
              <>
                {/* Visual Cribbage Board */}
                <CribbageBoard
                  playerScore={playerScore}
                  computerScore={computerScore}
                />

                {/* Dealer indicator */}
                <div className="text-center mb-4">
                  Dealer: {dealer === 'player' ? 'You' : 'Computer'}
                </div>

                {/* Cut card */}
                {cutCard && (
                  <div className="text-center mb-4">
                    <div className="text-sm mb-1">Cut Card:</div>
                    <CutCard card={cutCard} />
                  </div>
                )}

                {/* Counting phase buttons */}
                {gameState === 'counting' && (
                  <div className="text-center mb-4 space-x-2">
                    <Button
                      onClick={() => setShowPeggingSummary(!showPeggingSummary)}
                      className="bg-purple-600 hover:bg-purple-700 text-xs"
                    >
                      {showPeggingSummary ? 'Hide' : 'Show'} Pegging Summary
                    </Button>
                    {countingHistory.length > 0 && (
                      <Button
                        onClick={() => setShowCountingHistory(!showCountingHistory)}
                        className="bg-blue-600 hover:bg-blue-700 text-xs"
                      >
                        {showCountingHistory ? 'Hide' : 'Show'} Counting History
                      </Button>
                    )}
                  </div>
                )}

                {/* Pegging Summary Panel */}
                {gameState === 'counting' && showPeggingSummary && peggingHistory.length > 0 && (
                  <div className="mb-4 p-3 bg-purple-900 rounded border border-purple-600">
                    <div className="text-sm font-bold text-purple-300 mb-2">Pegging Summary</div>
                    <div className="text-xs space-y-1 max-h-40 overflow-y-auto">
                      {peggingHistory.map((entry, idx) => (
                        <div key={idx} className={`${entry.player === 'player' ? 'text-blue-300' : 'text-red-300'}`}>
                          {entry.type === 'play' && (
                            <>
                              <span className="font-bold">{entry.player === 'player' ? 'You' : 'CPU'}:</span>
                              {' '}{entry.card} → {entry.count}
                              {entry.points > 0 && <span className="text-yellow-300"> (+{entry.points} {entry.reason})</span>}
                            </>
                          )}
                          {entry.type === 'go' && (
                            <>
                              <span className="font-bold">{entry.player === 'player' ? 'You' : 'CPU'}:</span>
                              {' '}"Go" at {entry.count}
                            </>
                          )}
                          {entry.type === 'points' && (
                            <>
                              <span className="font-bold">{entry.player === 'player' ? 'You' : 'CPU'}:</span>
                              {' '}<span className="text-yellow-300">+{entry.points} ({entry.reason})</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-purple-600 text-xs">
                      <span className="text-blue-300">You: {peggingHistory.filter(e => e.type === 'points' && e.player === 'player').reduce((sum, e) => sum + e.points, 0)} pts</span>
                      {' • '}
                      <span className="text-red-300">CPU: {peggingHistory.filter(e => e.type === 'points' && e.player === 'computer').reduce((sum, e) => sum + e.points, 0)} pts</span>
                    </div>
                  </div>
                )}

                {/* Counting History Panel */}
                {gameState === 'counting' && showCountingHistory && countingHistory.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-900 rounded border border-blue-600">
                    <div className="text-sm font-bold text-blue-300 mb-2">Counting History</div>
                    <div className="text-xs space-y-2 max-h-60 overflow-y-auto">
                      {countingHistory.map((entry, idx) => (
                        <div key={idx} className={`p-2 rounded ${entry.player === 'player' ? 'bg-blue-800' : 'bg-red-900'}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className={`font-bold ${entry.player === 'player' ? 'text-blue-300' : 'text-red-300'}`}>
                              {entry.player === 'player' ? 'Your' : 'CPU'} {entry.handType === 'crib' ? 'Crib' : 'Hand'}
                            </span>
                            <span className="text-yellow-300">
                              {entry.claimed === entry.actual ? (
                                `+${entry.claimed} pts`
                              ) : entry.claimed < entry.actual ? (
                                `+${entry.claimed} (could be ${entry.actual})`
                              ) : (
                                <span className="text-red-400">Overcounted! 0 pts</span>
                              )}
                            </span>
                          </div>
                          <div className="text-gray-300">
                            Cards: {entry.cards.join(', ')} + {entry.cutCard}
                          </div>
                          {entry.breakdown && entry.breakdown.length > 0 && (
                            <div className="text-gray-400 mt-1 font-mono text-xs">
                              {entry.breakdown.reduce((acc, b, i) => {
                                const str = typeof b === 'string' ? b : `${b.description}: ${b.points}`;
                                const match = str.match(/^(.+?)\s*\((.+?)\):\s*(\d+)$/);
                                if (match) {
                                  const [, type, cards, pts] = match;
                                  const points = parseInt(pts, 10);
                                  const cumulative = acc.cumulative + points;
                                  acc.elements.push(
                                    <div key={i} className="flex justify-between gap-2">
                                      <span>{i + 1}. {cards.replace(/\+/g, ' + ').replace(/-/g, ', ')}</span>
                                      <span className="text-right whitespace-nowrap">{type.toLowerCase()} {points} → {cumulative}</span>
                                    </div>
                                  );
                                  acc.cumulative = cumulative;
                                } else {
                                  acc.elements.push(<div key={i}>{str}</div>);
                                }
                                return acc;
                              }, { elements: [], cumulative: 0 }).elements}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Computer hand / Crib (when computer is dealer) - positioned above play area */}
                {(() => {
                  const showCribHere = gameState === 'counting' && dealer === 'computer' &&
                    handsCountedThisRound >= 2 && (cribRevealPhase === 'revealing' || cribRevealPhase === 'done');
                  const handHighlighted = !showCribHere && gameState === 'counting' && counterIsComputer && computerClaimedScore !== null &&
                    ((handsCountedThisRound === 0 && dealer === 'player') || (handsCountedThisRound === 1 && dealer === 'computer'));
                  const cribHighlighted = showCribHere && cribRevealPhase !== 'revealing' &&
                    counterIsComputer && computerClaimedScore !== null && handsCountedThisRound === 2;
                  // Keep border visible during entire crib reveal so the box never disappears
                  const showBorder = handHighlighted || cribHighlighted || showCribHere;
                  return (
                  <div className={`mb-6 p-2 rounded ${
                    showBorder ? 'bg-yellow-900/30 border-2 border-yellow-500' : ''
                  }`}>
                    <div className="text-sm mb-2">
                      {showCribHere ? "Crib (Computer's):" : gameState === 'dealing' ? "Computer's Hand:" : `Computer's Hand: ${gameState === 'play' ? `${computerPlayHand.length} cards` : ''}`}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                      {/* Deck pile when computer is dealer */}
                      {dealer === 'computer' && gameState === 'dealing' && (() => {
                        const remaining = Math.max(0, 12 - dealtPlayerCards.length - dealtComputerCards.length);
                        return remaining > 0 ? (
                        <div className="flex flex-col items-center">
                          <div ref={deckPileRef} className="relative" style={{ width: '40px', height: '56px' }}>
                            {Array.from({ length: Math.min(3, remaining) }).map((_, i) => (
                              <div key={i} className="absolute bg-blue-900 border-2 border-blue-700 rounded"
                                style={{ width: '40px', height: '56px', top: `${-i * 2}px`, left: `${i * 1}px` }}
                              />
                            ))}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-4">Deck</div>
                        </div>
                        ) : null;
                      })()}
                      {dealer === 'computer' && (gameState === 'cribSelect' || gameState === 'play' || gameState === 'counting') && (handsCountedThisRound < 2 || cribRevealPhase === 'revealing') && (() => {
                        const pileCount = gameState === 'cribSelect' ? cribCardsInPile : 4;
                        return (
                        <div ref={cribPileRef} className="flex flex-col items-center">
                          <div className="relative w-12 h-16">
                            {pileCount === 0 ? (
                              <div className="w-12 h-16 border-2 border-dashed border-green-600 rounded flex items-center justify-center">
                                <span className="text-[10px] text-green-600">Crib</span>
                              </div>
                            ) : (
                              <>
                                {pileCount >= 1 && <div className="absolute top-0 left-0 bg-blue-900 border-2 border-blue-700 rounded w-12 h-16 shadow-md" />}
                                {pileCount >= 2 && <div className="absolute top-1 left-0.5 bg-blue-800 border-2 border-blue-600 rounded w-12 h-16 shadow-md" />}
                                {pileCount >= 3 && <div className="absolute top-2 left-1 bg-blue-700 border-2 border-blue-500 rounded w-12 h-16 shadow-lg" />}
                                {pileCount >= 4 && <div className="absolute top-3 left-1.5 bg-blue-900 border-2 border-blue-400 rounded w-12 h-16 shadow-lg flex items-center justify-center font-bold text-xs text-blue-200">Crib</div>}
                              </>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-4">Crib</div>
                        </div>
                        );
                      })()}
                      <div className="grid">
                        {/* Hand cards - always rendered to maintain container size; invisible during crib reveal */}
                        <div ref={computerHandRef} className={`col-start-1 row-start-1 flex justify-center [&>*:not(:first-child)]:-ml-1 ${showCribHere ? 'invisible' : ''}`}>
                          {(gameState === 'dealing' ? computerHand :
                            gameState === 'counting' || gameState === 'gameOver' ? computerHand :
                            gameState === 'play' ? computerPlayHand :
                            gameState === 'cribSelect' && computerDiscardDone && computerKeptHand ? computerKeptHand :
                            computerHand).map((card, idx) => (
                            <div key={idx} style={{
                              marginTop: idx % 2 === 1 ? '4px' : '0',
                              ...(gameState === 'dealing' && idx >= dealtComputerCards.length ? { visibility: 'hidden' } : {})
                            }}>
                              <PlayingCard
                                card={card}
                                faceDown={gameState !== 'counting' && gameState !== 'gameOver'}
                                revealed={gameState === 'counting' || gameState === 'gameOver'}
                                highlighted={handHighlighted}
                              />
                            </div>
                          ))}
                        </div>
                        {/* Crib cards - same grid cell so cell expands to fit both */}
                        {showCribHere && (
                          <div ref={cribDisplayRef} className="col-start-1 row-start-1 flex justify-center [&>*:not(:first-child)]:-ml-3">
                            {(cribRevealPhase === 'revealing' ? cribRevealedCards : crib).map((card, idx) => (
                              <div key={idx} style={{ marginTop: idx % 2 === 1 ? '4px' : '0' }}>
                                <PlayingCard card={card} highlighted={cribHighlighted} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })()}

                {/* Play area with separate stacks */}
                {gameState === 'play' && (
                  <div className="mb-6">
                    <div className="text-center mb-2">Count: {currentCount}</div>
                    <div className="bg-green-700 rounded p-4">
                      {/* Computer's played cards */}
                      <div className="mb-3">
                        <div className="text-xs mb-1">Computer's plays:</div>
                        <div ref={computerPlayAreaRef} className="flex flex-wrap justify-center [&>*:not(:first-child)]:-ml-2 min-h-[40px]">
                          {computerPlayedCards.map((card, idx) => (
                            <div key={idx} className={idx === landingCardIndex && landingIsComputer ? 'animate-[cardLand_0.3s_ease-out]' : ''} style={{ marginTop: idx % 2 === 1 ? '3px' : '0' }}>
                              <PlayedCard card={card} />
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Player's played cards */}
                      <div>
                        <div className="text-xs mb-1">Your plays:</div>
                        <div ref={playerPlayAreaRef} className="flex flex-wrap justify-center [&>*:not(:first-child)]:-ml-2 min-h-[40px]">
                          {playerPlayedCards.map((card, idx) => (
                            <div
                              key={idx}
                              className={idx === landingCardIndex && !landingIsComputer ? 'animate-[cardLand_0.3s_ease-out]' : ''}
                              style={{ marginTop: idx % 2 === 1 ? '3px' : '0' }}
                            >
                              <PlayedCard card={card} />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message - dynamic during crib selection */}
                {gameState === 'cribSelect' && selectedCards.length < 2 ? (
                  <GameMessage message={
                    selectedCards.length === 0
                      ? `Select 2 cards for ${dealer === 'player' ? 'your' : "computer's"} crib`
                      : `Select one more card for ${dealer === 'player' ? 'your' : "computer's"} crib`
                  } />
                ) : gameState !== 'cribSelect' ? (
                  <GameMessage message={message} />
                ) : null}

                {/* Pending score indicator (button in sticky bar) */}

                {/* Player hand / Crib (when player is dealer) */}
                {(() => {
                  const showCribHere = gameState === 'counting' && dealer === 'player' &&
                    handsCountedThisRound >= 2 && (cribRevealPhase === 'revealing' || cribRevealPhase === 'done');
                  // Hide player's hand during crib counting when computer is dealer (crib shown in computer section)
                  if (!showCribHere && gameState === 'counting' && handsCountedThisRound >= 2 && (cribRevealPhase === 'revealing' || cribRevealPhase === 'done')) return null;
                  const handHighlighted = !showCribHere && (
                    (gameState === 'cribSelect') ||
                    (gameState === 'play' && currentPlayer === 'player' && !pendingScore) ||
                    (gameState === 'counting' && !counterIsComputer && !pendingCountContinue &&
                     ((handsCountedThisRound === 0 && dealer === 'computer') || (handsCountedThisRound === 1 && dealer === 'player')))
                  );
                  const cribHighlighted = showCribHere && cribRevealPhase !== 'revealing' &&
                    !counterIsComputer && !pendingCountContinue && handsCountedThisRound === 2;
                  const showBorder = handHighlighted || cribHighlighted || showCribHere;
                  return (
                  <div className={`mb-6 p-2 rounded ${
                    showBorder ? 'bg-yellow-900/30 border-2 border-yellow-500' : ''
                  }`}>
                    <div className="text-sm mb-2">
                      {showCribHere ? "Crib (Yours):" : gameState === 'dealing' ? 'Your Hand:' : `Your Hand: (${gameState === 'play' ? playerPlayHand.length : gameState === 'counting' ? 4 : playerHand.length} cards)`}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                      <div className="grid">
                        {/* Hand cards - always rendered to maintain container size; invisible during crib reveal */}
                        <div ref={playerHandContainerRef} className={`col-start-1 row-start-1 flex justify-center [&>*:not(:first-child)]:-ml-1 ${showCribHere ? 'invisible' : ''}`}>
                          {(gameState === 'dealing' ? playerHand :
                            gameState === 'cribSelect' ? playerHand :
                            gameState === 'play' ? playerPlayHand :
                            playerHand).map((card, idx) => {
                            const isBeingDiscarded = discardingCards.some(d => d.rank === card.rank && d.suit === card.suit);
                            const isDealHidden = gameState === 'dealing' && idx >= dealtPlayerCards.length;
                            const isFlipping = gameState === 'dealing' && dealPhase === 'flipping' && idx <= dealFlipIndex;
                            const isDealFaceDown = gameState === 'dealing' && (!isFlipping);
                            return (
                            <div key={idx} className={`relative ${isFlipping ? 'card-flip-reveal' : ''}`} style={{
                              marginTop: idx % 2 === 1 ? '4px' : '0',
                              ...(isBeingDiscarded ? { visibility: 'hidden' } : {}),
                              ...(isDealHidden ? { visibility: 'hidden' } : {})
                            }}>
                              {gameState === 'play' && peggingSelectedCard &&
                               peggingSelectedCard.rank === card.rank && peggingSelectedCard.suit === card.suit && (
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-cyan-300 text-xs px-2 py-1 rounded shadow-lg border border-cyan-400/30 z-10">
                                  Click again to play, or another card to select
                                </div>
                              )}
                              <PlayingCard
                                card={card}
                                faceDown={isDealFaceDown}
                                selected={
                                  (!showCribHere && !isBeingDiscarded && selectedCards.some(c => c.rank === card.rank && c.suit === card.suit)) ||
                                  (gameState === 'play' && peggingSelectedCard && peggingSelectedCard.rank === card.rank && peggingSelectedCard.suit === card.suit)
                                }
                                disabled={
                                  showCribHere ||
                                  gameState === 'dealing' ||
                                  (gameState === 'play' && (currentCount + card.value > 31 || currentPlayer !== 'player' || pendingScore)) ||
                                  (gameState === 'cribSelect' && playerHand.length !== 6)
                                }
                                highlighted={handHighlighted}
                                onClick={(e) => {
                                  if (showCribHere || gameState === 'dealing') return;
                                  if (gameState === 'cribSelect' && playerHand.length === 6) toggleCardSelection(card);
                                  else if (gameState === 'play' && currentPlayer === 'player' && !pendingScore) {
                                    if (currentCount + card.value > 31) return;
                                    // Auto-play with single click when only one playable card remains
                                    const playableCards = playerPlayHand.filter(c => currentCount + c.value <= 31);
                                    if (playableCards.length === 1) {
                                      playerPlay(card, e);
                                      setPeggingSelectedCard(null);
                                    } else if (peggingSelectedCard && peggingSelectedCard.rank === card.rank && peggingSelectedCard.suit === card.suit) {
                                      playerPlay(card, e);
                                      setPeggingSelectedCard(null);
                                    } else {
                                      setPeggingSelectedCard(card);
                                    }
                                  }
                                }}
                              />
                            </div>
                            );
                          })}
                        </div>
                        {/* Crib cards - same grid cell so cell expands to fit both */}
                        {showCribHere && (
                          <div ref={cribDisplayRef} className="col-start-1 row-start-1 flex justify-center [&>*:not(:first-child)]:-ml-3">
                            {(cribRevealPhase === 'revealing' ? cribRevealedCards : crib).map((card, idx) => (
                              <div key={idx} style={{ marginTop: idx % 2 === 1 ? '4px' : '0' }}>
                                <PlayingCard card={card} highlighted={cribHighlighted} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Deck pile when player is dealer */}
                      {dealer === 'player' && gameState === 'dealing' && (() => {
                        const remaining = Math.max(0, 12 - dealtPlayerCards.length - dealtComputerCards.length);
                        return remaining > 0 ? (
                        <div className="flex flex-col items-center">
                          <div ref={deckPileRef} className="relative" style={{ width: '40px', height: '56px' }}>
                            {Array.from({ length: Math.min(3, remaining) }).map((_, i) => (
                              <div key={i} className="absolute bg-blue-900 border-2 border-blue-700 rounded"
                                style={{ width: '40px', height: '56px', top: `${-i * 2}px`, left: `${i * 1}px` }}
                              />
                            ))}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-4">Deck</div>
                        </div>
                        ) : null;
                      })()}
                      {dealer === 'player' && (gameState === 'cribSelect' || gameState === 'play' || gameState === 'counting') && (handsCountedThisRound < 2 || cribRevealPhase === 'revealing') && (() => {
                        const pileCount = gameState === 'cribSelect' ? cribCardsInPile : 4;
                        return (
                        <div ref={cribPileRef} className="flex flex-col items-center">
                          <div className="relative w-12 h-16">
                            {pileCount === 0 ? (
                              <div className="w-12 h-16 border-2 border-dashed border-green-600 rounded flex items-center justify-center">
                                <span className="text-[10px] text-green-600">Crib</span>
                              </div>
                            ) : (
                              <>
                                {pileCount >= 1 && <div className="absolute top-0 left-0 bg-blue-900 border-2 border-blue-700 rounded w-12 h-16 shadow-md" />}
                                {pileCount >= 2 && <div className="absolute top-1 left-0.5 bg-blue-800 border-2 border-blue-600 rounded w-12 h-16 shadow-md" />}
                                {pileCount >= 3 && <div className="absolute top-2 left-1 bg-blue-700 border-2 border-blue-500 rounded w-12 h-16 shadow-lg" />}
                                {pileCount >= 4 && <div className="absolute top-3 left-1.5 bg-blue-900 border-2 border-blue-400 rounded w-12 h-16 shadow-lg flex items-center justify-center font-bold text-xs text-blue-200">Crib</div>}
                              </>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-4">Crib</div>
                        </div>
                        );
                      })()}
                    </div>
                  </div>
                  );
                })()}

                {/* Crib is now displayed inline in the hand sections above */}

                {/* Counting input - Score selector grid */}
                {/* Show ScoreSelector when: it's the player's turn to count AND either
                    actualScore hasn't been set yet (normal) OR actualScore is stale from
                    a previous count sub-phase (pendingCountContinue is null — during normal
                    gameplay they're always set together in the same React batch). Bug #77. */}
                {gameState === 'counting' && (!actualScore || !pendingCountContinue) && !pendingScore && !computerClaimedScore &&
                 counterIsComputer === false && (
                  <div className={`mb-4 ${cribRevealPhase === 'revealing' ? 'invisible' : ''}`}>
                    <ScoreSelector onSelect={(score) => submitPlayerCount(score)} />
                  </div>
                )}

                {/* Computer count verification - info box only, buttons in sticky bar */}
                {gameState === 'counting' && counterIsComputer && actualScore && !pendingScore && computerClaimedScore !== null && !playerMadeCountDecision && !showMugginsPreferenceDialog && (
                  <div className="text-center mb-4">
                    <div className="bg-yellow-900 border-2 border-yellow-500 rounded p-4 inline-block">
                      <div className="text-yellow-300 font-bold mb-2">
                        Computer claims {computerClaimedScore} points
                      </div>
                      <div className="text-sm text-gray-400">
                        Count the hand yourself to verify!
                      </div>
                    </div>
                  </div>
                )}

                {/* Muggins penalty preference dialog - info only, buttons in sticky bar */}
                {showMugginsPreferenceDialog && (
                  <div className="text-center mb-4">
                    <div className="bg-purple-900 border-2 border-purple-500 rounded p-4 inline-block">
                      <div className="text-purple-300 font-bold mb-2">
                        Wrong Muggins Call!
                      </div>
                      <div className="text-sm text-gray-300">
                        Computer's count was correct. Choose penalty below.
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        This preference will be saved for future games
                      </div>
                    </div>
                  </div>
                )}

                {/* Score breakdown - show when:
                    - Computer counting and player has accepted/objected
                    - Player counting and has submitted (pendingCountContinue set)
                    Don't show stale breakdown from a previous count sub-phase (bug #77) */}
                <ScoreBreakdown
                  actualScore={actualScore}
                  show={gameState === 'counting' && (
                    (counterIsComputer && playerMadeCountDecision) ||
                    (!counterIsComputer && pendingCountContinue)
                  )}
                />

                {/* Continue button moved to sticky bar */}

                {/* Discard button moved to sticky bar */}

                {/* Play phase buttons moved to sticky bar */}

                {/* Game over button moved to sticky bar */}


                {/* Forfeit Confirmation Modal */}
                {showForfeitConfirm && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                      <h2 className="text-xl font-bold text-white mb-4">Forfeit Game?</h2>
                      <p className="text-gray-300 text-sm mb-6">
                        Are you sure you want to forfeit? This will count as a loss and end the current game.
                      </p>
                      <div className="flex justify-end gap-3">
                        <Button
                          onClick={() => setShowForfeitConfirm(false)}
                          className="bg-gray-600 hover:bg-gray-700"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleForfeit}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Yes, Forfeit
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Celebration overlay for correct counts */}
                {showCelebration && celebrationScore !== null && (
                  <CorrectScoreCelebration
                    score={celebrationScore}
                    onComplete={handleCelebrationComplete}
                  />
                )}

                {/* Celebration toast (phrases + micro-animations) */}
                <CelebrationToast
                  phrase={celebrationToast?.phrase}
                  animation={celebrationToast?.animation}
                  onDismiss={() => setCelebrationToast(null)}
                />

                {/* Debug Panel */}
                <DebugPanel
                  debugLog={debugLog}
                  gameLog={gameLog}
                  gameState={{
                    // Core game state
                    state: gameState,
                    dealer,
                    playerScore,
                    computerScore,
                    currentPlayer,
                    // Counting phase state
                    handsCountedThisRound,
                    counterIsComputer,
                    countingTurn,
                    computerClaimedScore,
                    isProcessingCount,
                    actualScore: actualScore ? { score: actualScore.score, hasBreakdown: !!actualScore.breakdown } : null,
                    pendingScore: pendingScore ? { points: pendingScore.points, reason: pendingScore.reason } : null,
                    pendingCountContinue: pendingCountContinue ? { type: pendingCountContinue.type, handsCount: pendingCountContinue.newHandsCountedThisRound } : null,
                    playerMadeCountDecision,
                    // Display state - critical for debugging message issues
                    currentMessage: message,
                    showBreakdown,
                    // History
                    peggingHistory,
                    countingHistory,
                    // Cards
                    playerHand: playerHand?.map(c => `${c.rank}${c.suit}`),
                    computerHand: computerHand?.map(c => `${c.rank}${c.suit}`),
                    crib: crib?.map(c => `${c.rank}${c.suit}`),
                    cutCard: cutCard ? `${cutCard.rank}${cutCard.suit}` : null,
                    // Session info
                    wasGameRestored: isLoadingGame ? 'loading' : (gameLog.length > 0 && gameLog[0]?.type === 'GAME_RESTORED' ? 'yes' : 'no'),
                    appVersion: APP_VERSION,
                  }}
                  showBugModalExternal={showBugReport}
                  onBugModalClose={() => setShowBugReport(false)}
                  userEmail={user?.attributes?.email || user?.username || 'unknown'}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Bug Report Viewer Modal */}
        <BugReportViewer
          isOpen={showBugReportViewer}
          onClose={() => setShowBugReportViewer(false)}
          userEmail={user?.attributes?.email || user?.username}
          onUnreadCountChange={setUnreadBugReports}
        />

        {/* Admin Panel Modal - only for admin user */}
        <AdminPanel
          isOpen={showAdminPanel}
          onClose={() => setShowAdminPanel(false)}
          userEmail={user?.attributes?.email || user?.username}
        />

        {/* Leaderboard Modal - available to all users */}
        <Leaderboard
          isOpen={showLeaderboard}
          onClose={() => setShowLeaderboard(false)}
        />

        {/* Bug Report Modal - always available even at menu screen */}
        {(gameState === 'menu' || gameState === 'cutting' || gameState === 'cutForStarter') && (
          <DebugPanel
            debugLog={debugLog}
            gameLog={gameLog}
            gameState={{ state: gameState, appVersion: APP_VERSION }}
            showBugModalExternal={showBugReport}
            onBugModalClose={() => setShowBugReport(false)}
            userEmail={user?.attributes?.email || user?.username || 'unknown'}
          />
        )}

        {/* Unread bug report replies notification - outside gameState conditional so it shows at menu */}
        {showUnreadNotification && unreadBugReports > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl border border-yellow-500">
              <h2 className="text-xl font-bold text-yellow-400 mb-2">
                New Reply{unreadBugReports > 1 ? 's' : ''} on Bug Report{unreadBugReports > 1 ? 's' : ''}
              </h2>
              <p className="text-gray-300 text-sm mb-4">
                You have {unreadBugReports} unread {unreadBugReports === 1 ? 'reply' : 'replies'} on your bug report{unreadBugReports > 1 ? 's' : ''}.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  onClick={() => setShowUnreadNotification(false)}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  Dismiss
                </Button>
                <Button
                  onClick={() => {
                    setShowUnreadNotification(false);
                    setShowBugReportViewer(true);
                  }}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  View Reports
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom padding to account for sticky action bar */}
        {gameState !== 'menu' && requiredAction.requiresButton && (
          <div className="h-20" />
        )}
      </div>

      {/* Sticky action bar - always visible at bottom on mobile */}
      {gameState !== 'menu' && requiredAction.requiresButton && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-700 p-3 z-40 backdrop-blur-sm">
          <div className="max-w-md mx-auto text-center">
            <ActionButtons
              requiredAction={requiredAction}
              handlers={{
                discardToCrib,
                acceptScoreAndContinue,
                handleCountContinue,
                playerGo,
                startNewGame,
                returnToMenu,
                acceptComputerCount,
                objectToComputerCount,
                handleMugginsPreferenceChoice,
                confirmPeggingPlay,
                proceedAfterCut: () => {}, // TODO: implement if needed
              }}
              pendingScore={pendingScore}
              computerClaimedScore={computerClaimedScore}
              selectedCardsLength={selectedCards.length}
            />
          </div>
        </div>
      )}
    </div>
    </>
  );
}
