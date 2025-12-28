'use client';

// Cribbage Board Component - Traditional 3-row layout with SVG
// Emulates real cribbage board with two pegs per player (leapfrog style)

import { useState, useEffect, useRef } from 'react';

/**
 * Visual cribbage board with score pegs and glow effect on score changes
 * @param {number} playerScore - Player's current score (0-121)
 * @param {number} computerScore - Computer's current score (0-121)
 */
export default function CribbageBoard({ playerScore, computerScore }) {
  // Track back peg positions (the previous score before last move)
  // This emulates real cribbage where you leapfrog two pegs
  // Initialize to a position slightly behind current score for restored games
  const [playerBackPeg, setPlayerBackPeg] = useState(() => Math.max(0, playerScore - 1));
  const [computerBackPeg, setComputerBackPeg] = useState(() => Math.max(0, computerScore - 1));

  // Track previous scores to detect changes
  const prevPlayerScore = useRef(playerScore);
  const prevComputerScore = useRef(computerScore);

  // Track if this is initial mount (to handle restored games)
  const isInitialMount = useRef(true);

  // Glow state for each player
  const [playerGlow, setPlayerGlow] = useState(false);
  const [computerGlow, setComputerGlow] = useState(false);

  // Initialize back pegs on mount for restored games
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // For restored games, set back peg to score-1 (or 0 if score <= 1)
      if (playerScore > 0) {
        setPlayerBackPeg(Math.max(0, playerScore - 1));
      }
      if (computerScore > 0) {
        setComputerBackPeg(Math.max(0, computerScore - 1));
      }
    }
  }, []);

  // Detect score changes - update back peg to previous front peg position
  useEffect(() => {
    if (!isInitialMount.current && playerScore !== prevPlayerScore.current) {
      // Move back peg to where front peg was
      setPlayerBackPeg(prevPlayerScore.current);
      setPlayerGlow(true);
      const timer = setTimeout(() => setPlayerGlow(false), 1500);
      prevPlayerScore.current = playerScore;
      return () => clearTimeout(timer);
    }
  }, [playerScore]);

  useEffect(() => {
    if (!isInitialMount.current && computerScore !== prevComputerScore.current) {
      // Move back peg to where front peg was
      setComputerBackPeg(prevComputerScore.current);
      setComputerGlow(true);
      const timer = setTimeout(() => setComputerGlow(false), 1500);
      prevComputerScore.current = computerScore;
      return () => clearTimeout(timer);
    }
  }, [computerScore]);

  const boardWidth = 620;
  const boardHeight = 140;
  const holeSpacing = 18;
  const rowSpacing = 32;
  const startX = 45;
  const startY = 35;
  const playerTrackOffset = -5;  // Player track (blue) above center
  const computerTrackOffset = 5; // Computer track (red) below center

  // Convert score (0-121) to row and position within row
  const getHolePosition = (score, trackOffset) => {
    // Score 0 = start position (before hole 1)
    if (score <= 0) {
      return {
        x: startX - holeSpacing,  // One space before hole 1
        y: startY + 2 * rowSpacing + trackOffset  // Bottom row (where game starts)
      };
    }
    if (score > 120) score = 120;

    // Determine which row (0, 1, 2) and position in row
    // Row 0: holes 1-30 (going right)
    // Row 1: holes 31-60 (going left)
    // Row 2: holes 61-90 (going right)
    // Row 3: holes 91-120 (going left)
    // But we only have 3 visual rows, so we use 4 segments across 3 rows

    let row, posInRow, goingRight;
    if (score <= 30) {
      row = 2; posInRow = score - 1; goingRight = true;
    } else if (score <= 60) {
      row = 1; posInRow = 60 - score; goingRight = false;
    } else if (score <= 90) {
      row = 1; posInRow = score - 61; goingRight = true;
    } else {
      row = 0; posInRow = 120 - score; goingRight = false;
    }

    const x = goingRight
      ? startX + posInRow * holeSpacing
      : startX + (29 - posInRow) * holeSpacing;
    const y = startY + row * rowSpacing + trackOffset;

    return { x, y };
  };

  // Generate hole positions for display
  const generateHoles = () => {
    const holes = [];

    // Generate 30 holes per row, 3 rows
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 30; col++) {
        const x = startX + col * holeSpacing;
        const y = startY + row * rowSpacing;
        holes.push({ x, y, row, col });
      }
    }

    return holes;
  };

  const holes = generateHoles();
  const playerPos = getHolePosition(playerScore, playerTrackOffset);
  const playerPrevPos = getHolePosition(playerBackPeg, playerTrackOffset);
  const computerPos = getHolePosition(computerScore, computerTrackOffset);
  const computerPrevPos = getHolePosition(computerBackPeg, computerTrackOffset);

  return (
    <div className="mb-6 bg-gradient-to-br from-amber-800 to-amber-900 rounded-lg p-4 shadow-xl">
      <svg
        viewBox={`0 0 ${boardWidth} ${boardHeight}`}
        className="mx-auto w-full max-w-[620px]"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Glow filters */}
        <defs>
          <filter id="playerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#60a5fa" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="computerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#f87171" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Board background */}
        <rect x="5" y="5" width={boardWidth - 10} height={boardHeight - 10} fill="#654321" rx="8" />
        <rect x="10" y="10" width={boardWidth - 20} height={boardHeight - 20} fill="#8B4513" rx="6" />

        {/* Row labels on left */}
        <text x="12" y={startY + 2 * rowSpacing + 4} fontSize="9" fill="#ffd700" fontWeight="bold">0</text>
        <text x="8" y={startY + 1 * rowSpacing + 4} fontSize="9" fill="#ffd700" fontWeight="bold">60</text>
        <text x="8" y={startY + 0 * rowSpacing + 4} fontSize="9" fill="#ffd700" fontWeight="bold">90</text>

        {/* Row labels on right */}
        <text x={boardWidth - 28} y={startY + 2 * rowSpacing + 4} fontSize="9" fill="#ffd700" fontWeight="bold">30</text>
        <text x={boardWidth - 28} y={startY + 1 * rowSpacing + 4} fontSize="9" fill="#ffd700" fontWeight="bold">60</text>
        <text x={boardWidth - 32} y={startY + 0 * rowSpacing + 4} fontSize="9" fill="#ffd700" fontWeight="bold">120</text>

        {/* Direction arrows */}
        <text x={boardWidth / 2 - 10} y={startY + 2 * rowSpacing + 4} fontSize="10" fill="#888">→</text>
        <text x={boardWidth / 2 - 10} y={startY + 1 * rowSpacing + 4} fontSize="10" fill="#888">↔</text>
        <text x={boardWidth / 2 - 10} y={startY + 0 * rowSpacing + 4} fontSize="10" fill="#888">←</text>

        {/* Holes - player track (above) */}
        {holes.map((hole, idx) => (
          <circle
            key={`p-${idx}`}
            cx={hole.x}
            cy={hole.y + playerTrackOffset}
            r="3"
            fill="#2c1810"
            stroke="#4444aa"
            strokeWidth="0.5"
          />
        ))}

        {/* Holes - computer track (below) */}
        {holes.map((hole, idx) => (
          <circle
            key={`c-${idx}`}
            cx={hole.x}
            cy={hole.y + computerTrackOffset}
            r="3"
            fill="#2c1810"
            stroke="#aa4444"
            strokeWidth="0.5"
          />
        ))}

        {/* 5-hole markers */}
        {holes.filter((_, idx) => (idx % 5 === 4)).map((hole, idx) => (
          <line
            key={`mark-${idx}`}
            x1={hole.x}
            y1={hole.y - 10}
            x2={hole.x}
            y2={hole.y + 10}
            stroke="#555"
            strokeWidth="0.5"
          />
        ))}

        {/* Player pegs (blue) - both same color like real cribbage */}
        {playerPrevPos && (
          <circle cx={playerPrevPos.x} cy={playerPrevPos.y} r="5" fill="#2266ff" stroke="#fff" strokeWidth="1" />
        )}
        {playerPos && (
          <circle
            cx={playerPos.x}
            cy={playerPos.y}
            r={playerGlow ? 6 : 5}
            fill="#2266ff"
            stroke="#fff"
            strokeWidth="1.5"
            filter={playerGlow ? "url(#playerGlow)" : "none"}
            className={playerGlow ? "animate-pulse" : ""}
          />
        )}

        {/* Computer pegs (red) - both same color like real cribbage */}
        {computerPrevPos && (
          <circle cx={computerPrevPos.x} cy={computerPrevPos.y} r="5" fill="#ff2222" stroke="#fff" strokeWidth="1" />
        )}
        {computerPos && (
          <circle
            cx={computerPos.x}
            cy={computerPos.y}
            r={computerGlow ? 6 : 5}
            fill="#ff2222"
            stroke="#fff"
            strokeWidth="1.5"
            filter={computerGlow ? "url(#computerGlow)" : "none"}
            className={computerGlow ? "animate-pulse" : ""}
          />
        )}

        {/* Score legend */}
        <g transform={`translate(${boardWidth / 2 - 80}, ${boardHeight - 18})`}>
          <circle cx="8" cy="0" r="5" fill="#2266ff" stroke="#fff" strokeWidth="1" />
          <text x="18" y="4" fontSize="11" fill="#ffd700" fontWeight="bold">You: {playerScore}</text>
          <circle cx="100" cy="0" r="5" fill="#ff2222" stroke="#fff" strokeWidth="1" />
          <text x="110" y="4" fontSize="11" fill="#ffd700" fontWeight="bold">CPU: {computerScore}</text>
        </g>
      </svg>
    </div>
  );
}
