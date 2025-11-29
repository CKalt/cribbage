'use client';

// Main Cribbage Game Component
// Will be populated in Phase 5

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CribbageBoard from './CribbageBoard';

/**
 * Main game component with all state management and game logic
 */
export default function CribbageGame() {
  const [gameState, setGameState] = useState('menu');
  const [playerScore, setPlayerScore] = useState(0);
  const [computerScore, setComputerScore] = useState(0);

  const startNewGame = () => {
    setGameState('playing');
    setPlayerScore(0);
    setComputerScore(0);
  };

  return (
    <div className="min-h-screen bg-green-900 p-4">
      <div className="max-w-6xl mx-auto">
        <Card className="bg-green-800 text-white">
          <CardHeader>
            <CardTitle className="text-3xl text-center">Cribbage</CardTitle>
          </CardHeader>
          <CardContent>
            {gameState === 'menu' && (
              <div className="text-center">
                <p className="mb-4">Placeholder - Full game will be implemented in Phase 5</p>
                <Button onClick={startNewGame} className="text-lg px-8 py-4">
                  Start New Game
                </Button>
              </div>
            )}

            {gameState !== 'menu' && (
              <>
                <CribbageBoard
                  playerScore={playerScore}
                  computerScore={computerScore}
                  onPegClick={() => {}}
                />
                <div className="text-center">
                  <p>Game in progress...</p>
                  <Button onClick={() => setGameState('menu')} className="mt-4">
                    Back to Menu
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
