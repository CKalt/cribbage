'use client';

// Cribbage Board Component - Traditional 3-row layout with SVG
// Emulates real cribbage board with two pegs per player (leapfrog style)
// Includes tap-to-zoom feature for mobile viewing

import { useState, useEffect, useRef } from 'react';

/**
 * Visual cribbage board with score pegs and glow effect on score changes
 * @param {number} playerScore - Player's current score (0-121)
 * @param {number} computerScore - Computer's current score (0-121)
 */
export default function CribbageBoard({ playerScore, computerScore, playerLabel = 'You', opponentLabel = 'CPU' }) {
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

  // Zoom modal state
  const [showZoom, setShowZoom] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const lastPanOffset = useRef({ x: 0, y: 0 });

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
    // Standard cribbage board S-pattern:
    // Row 2 (bottom): holes 1-30, left→right (1 at left, 30 at right)
    // Row 1 (middle): holes 31-60, right→left (31 at right, 60 at left)
    // Row 0 (top): holes 61-90, left→right (61 at left, 90 at right)
    // Row 0 (top): holes 91-120, right→left (91 at right, 120 at left)

    let row, posInRow, goingRight;
    if (score <= 30) {
      // 1-30: row 2, going right (1 at left, 30 at right)
      row = 2; posInRow = score - 1; goingRight = true;
    } else if (score <= 60) {
      // 31-60: row 1, going left (31 at right, 60 at left)
      row = 1; posInRow = score - 31; goingRight = false;
    } else if (score <= 90) {
      // 61-90: row 0, going right (61 at left, 90 at right)
      row = 0; posInRow = score - 61; goingRight = true;
    } else {
      // 91-120: row 0, going left (91 at right, 120 at left)
      row = 0; posInRow = score - 91; goingRight = false;
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

  // Handle zoom modal open
  const handleBoardClick = () => {
    setPanOffset({ x: 0, y: 0 });
    lastPanOffset.current = { x: 0, y: 0 };
    setShowZoom(true);
  };

  // Pan handlers for touch/mouse
  const handleDragStart = (e) => {
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX, y: clientY };
    lastPanOffset.current = { ...panOffset };
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const deltaX = clientX - dragStart.current.x;
    const deltaY = clientY - dragStart.current.y;
    setPanOffset({
      x: lastPanOffset.current.x + deltaX,
      y: lastPanOffset.current.y + deltaY
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // The SVG board content
  const renderBoardSVG = (isZoomed = false) => (
    <svg
      viewBox={`0 0 ${boardWidth} ${boardHeight}`}
      className={isZoomed ? "w-full h-auto" : "mx-auto w-full max-w-[620px]"}
      preserveAspectRatio="xMidYMid meet"
      style={isZoomed ? { minWidth: '800px' } : undefined}
    >
      {/* Glow filters */}
      <defs>
        <filter id={isZoomed ? "playerGlowZoom" : "playerGlow"} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feFlood floodColor="#60a5fa" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={isZoomed ? "computerGlowZoom" : "computerGlow"} x="-50%" y="-50%" width="200%" height="200%">
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

      {/* Row labels on left - shows score when arriving at left side */}
      <text x="12" y={startY + 2 * rowSpacing + 4} fontSize="9" fill="#ffd700" fontWeight="bold">1</text>
      <text x="8" y={startY + 1 * rowSpacing + 4} fontSize="9" fill="#ffd700" fontWeight="bold">60</text>
      <text x="8" y={startY + 0 * rowSpacing + 4} fontSize="9" fill="#ffd700" fontWeight="bold">61</text>

      {/* Row labels on right - shows score when arriving at right side */}
      <text x={boardWidth - 28} y={startY + 2 * rowSpacing + 4} fontSize="9" fill="#ffd700" fontWeight="bold">30</text>
      <text x={boardWidth - 28} y={startY + 1 * rowSpacing + 4} fontSize="9" fill="#ffd700" fontWeight="bold">31</text>
      <text x={boardWidth - 28} y={startY + 0 * rowSpacing + 4} fontSize="9" fill="#ffd700" fontWeight="bold">90</text>

      {/* Direction arrows showing flow */}
      <text x={boardWidth / 2 - 10} y={startY + 2 * rowSpacing + 4} fontSize="10" fill="#888">→</text>
      <text x={boardWidth / 2 - 10} y={startY + 1 * rowSpacing + 4} fontSize="10" fill="#888">←</text>
      <text x={boardWidth / 2 - 10} y={startY + 0 * rowSpacing + 4} fontSize="10" fill="#888">↔</text>

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
          filter={playerGlow ? `url(#${isZoomed ? 'playerGlowZoom' : 'playerGlow'})` : "none"}
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
          filter={computerGlow ? `url(#${isZoomed ? 'computerGlowZoom' : 'computerGlow'})` : "none"}
          className={computerGlow ? "animate-pulse" : ""}
        />
      )}

      {/* Score legend */}
      <g transform={`translate(${boardWidth / 2 - 80}, ${boardHeight - 18})`}>
        <circle cx="8" cy="0" r="5" fill="#2266ff" stroke="#fff" strokeWidth="1" />
        <text x="18" y="4" fontSize="11" fill="#ffd700" fontWeight="bold">{playerLabel}: {playerScore}</text>
        <circle cx="100" cy="0" r="5" fill="#ff2222" stroke="#fff" strokeWidth="1" />
        <text x="110" y="4" fontSize="11" fill="#ffd700" fontWeight="bold">{opponentLabel}: {computerScore}</text>
      </g>
    </svg>
  );

  return (
    <>
      {/* Normal board view - clickable to zoom */}
      <div
        className="mb-6 bg-gradient-to-br from-amber-800 to-amber-900 rounded-lg p-4 shadow-xl cursor-pointer relative"
        onClick={handleBoardClick}
        title="Tap to zoom"
      >
        {renderBoardSVG(false)}
        {/* Zoom hint icon */}
        <div className="absolute top-2 right-2 text-amber-300 opacity-50 text-xs">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </div>

      {/* Zoom modal */}
      {showZoom && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
          onClick={() => setShowZoom(false)}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 text-white text-3xl z-50 bg-black bg-opacity-50 rounded-full w-10 h-10 flex items-center justify-center"
            onClick={() => setShowZoom(false)}
          >
            &times;
          </button>

          {/* Zoom hint */}
          <div className="absolute top-4 left-4 text-white text-sm opacity-70">
            Drag to pan • Tap to close
          </div>

          {/* Draggable board container */}
          <div
            className="overflow-hidden w-full h-full flex items-center justify-center"
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
            style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          >
            <div
              className="bg-gradient-to-br from-amber-800 to-amber-900 rounded-lg p-6 shadow-2xl"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }}
            >
              {renderBoardSVG(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
