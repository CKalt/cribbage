'use client';

// Cribbage Board Component - Animated visual board with dual-peg system

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';

/**
 * Board configuration constants
 */
const BOARD_CONFIG = {
  width: 620,
  height: 140,
  holeSpacing: 18,
  rowSpacing: 32,
  startX: 45,
  startY: 35,
  playerTrackOffset: -5,
  computerTrackOffset: 5,
  holeRadius: 3,
  pegRadius: 5,
  // Animation settings
  pointAnimationDuration: 250, // ms per point (slower for visibility)
  zoomLevel: 2.0,
  zoomTransitionDuration: 400, // ms
  postAnimationDelay: 2000, // ms to display after animation completes
  preAnimationDelay: 2500, // ms to wait before showing (lets celebration play first)
};

/**
 * Animated Cribbage Board with dual-peg system and zoom effects
 */
const CribbageBoard = forwardRef(function CribbageBoard({
  playerScore = 0,
  computerScore = 0,
  onAnimationComplete,
}, ref) {
  const { width: boardWidth, height: boardHeight, holeSpacing, rowSpacing, startX, startY,
          playerTrackOffset, computerTrackOffset, zoomLevel, zoomTransitionDuration,
          pointAnimationDuration } = BOARD_CONFIG;

  // Peg positions - dual pegs for each player (front and back)
  const [pegPositions, setPegPositions] = useState({
    player: { frontPeg: playerScore, backPeg: Math.max(0, playerScore - 1) },
    computer: { frontPeg: computerScore, backPeg: Math.max(0, computerScore - 1) }
  });

  // Animation state
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingPlayer, setAnimatingPlayer] = useState(null);
  const [animatingPegPos, setAnimatingPegPos] = useState(null);
  const [scorePopup, setScorePopup] = useState({ visible: false, points: 0, x: 0, y: 0 });

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [viewBox, setViewBox] = useState(`0 0 ${boardWidth} ${boardHeight}`);

  // Animation queue
  const animationQueue = useRef([]);
  const isProcessingQueue = useRef(false);

  // Convert score (0-121) to x,y position
  const getHolePosition = useCallback((score, trackOffset) => {
    if (score <= 0) return { x: startX - 15, y: startY + 2 * rowSpacing + trackOffset };
    if (score > 121) score = 121;

    let row, posInRow, goingRight;
    if (score <= 30) {
      row = 2; posInRow = score - 1; goingRight = true;
    } else if (score <= 60) {
      row = 1; posInRow = 60 - score; goingRight = false;
    } else if (score <= 90) {
      row = 1; posInRow = score - 61; goingRight = true;
    } else if (score <= 120) {
      row = 0; posInRow = 120 - score; goingRight = false;
    } else {
      // Score 121 - winning position
      row = 0; posInRow = 0; goingRight = false;
    }

    const x = goingRight
      ? startX + posInRow * holeSpacing
      : startX + (29 - posInRow) * holeSpacing;
    const y = startY + row * rowSpacing + trackOffset;

    return { x, y };
  }, [startX, startY, holeSpacing, rowSpacing]);

  // Generate hole positions for display
  const generateHoles = useCallback(() => {
    const holes = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 30; col++) {
        const x = startX + col * holeSpacing;
        const y = startY + row * rowSpacing;
        holes.push({ x, y, row, col });
      }
    }
    return holes;
  }, [startX, startY, holeSpacing, rowSpacing]);

  const holes = generateHoles();

  // Calculate viewBox for zooming to a specific position
  const getZoomedViewBox = useCallback((centerX, centerY, zoomFactor) => {
    const newWidth = boardWidth / zoomFactor;
    const newHeight = boardHeight / zoomFactor;
    const x = Math.max(0, Math.min(centerX - newWidth / 2, boardWidth - newWidth));
    const y = Math.max(0, Math.min(centerY - newHeight / 2, boardHeight - newHeight));
    return `${x} ${y} ${newWidth} ${newHeight}`;
  }, [boardWidth, boardHeight]);

  // Animate a single point movement
  const animateSinglePoint = useCallback((player, fromScore, toScore) => {
    return new Promise((resolve) => {
      const trackOffset = player === 'player' ? playerTrackOffset : computerTrackOffset;
      const toPos = getHolePosition(toScore, trackOffset);

      setAnimatingPegPos(toPos);

      setTimeout(() => {
        // Update peg positions - leapfrog: back peg jumps to new front
        setPegPositions(prev => ({
          ...prev,
          [player]: {
            frontPeg: toScore,
            backPeg: prev[player].frontPeg // Old front becomes new back
          }
        }));
        resolve();
      }, pointAnimationDuration);
    });
  }, [getHolePosition, playerTrackOffset, computerTrackOffset, pointAnimationDuration]);

  // Process the animation queue
  const processQueue = useCallback(async () => {
    if (isProcessingQueue.current || animationQueue.current.length === 0) return;

    isProcessingQueue.current = true;

    while (animationQueue.current.length > 0) {
      const { player, points, startScore, onComplete } = animationQueue.current.shift();

      if (points <= 0) {
        if (onComplete) onComplete();
        continue;
      }

      // Wait for celebration animation to finish first
      await new Promise(r => setTimeout(r, BOARD_CONFIG.preAnimationDelay));

      setIsAnimating(true);
      setAnimatingPlayer(player);

      const trackOffset = player === 'player' ? playerTrackOffset : computerTrackOffset;
      const targetScore = Math.min(startScore + points, 121);
      const targetPos = getHolePosition(targetScore, trackOffset);

      // Zoom in to target area
      setViewBox(getZoomedViewBox(targetPos.x, targetPos.y, zoomLevel));

      // Wait for zoom
      await new Promise(r => setTimeout(r, zoomTransitionDuration));

      // Show score popup
      setScorePopup({ visible: true, points, x: targetPos.x, y: targetPos.y - 15 });

      // Animate each point with leapfrog
      for (let p = 1; p <= points && startScore + p <= 121; p++) {
        const currentScore = startScore + p;
        await animateSinglePoint(player, currentScore - 1, currentScore);
      }

      // Keep popup visible and pause for user to appreciate the move
      await new Promise(r => setTimeout(r, BOARD_CONFIG.postAnimationDelay));
      setScorePopup(prev => ({ ...prev, visible: false }));

      // Zoom out
      setViewBox(`0 0 ${boardWidth} ${boardHeight}`);
      await new Promise(r => setTimeout(r, zoomTransitionDuration));

      setIsAnimating(false);
      setAnimatingPlayer(null);
      setAnimatingPegPos(null);

      if (onComplete) onComplete();
    }

    isProcessingQueue.current = false;

    if (onAnimationComplete) onAnimationComplete();
  }, [getHolePosition, getZoomedViewBox, animateSinglePoint, playerTrackOffset,
      computerTrackOffset, zoomLevel, zoomTransitionDuration, boardWidth, boardHeight,
      onAnimationComplete]);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    // Animate scoring with zoom and point-by-point pegging
    animateScore: (player, points, startScore) => {
      return new Promise((resolve) => {
        animationQueue.current.push({ player, points, startScore, onComplete: resolve });
        processQueue();
      });
    },

    // Set peg positions without animation (for loading saved games)
    setPegPositionsImmediate: (player, score) => {
      setPegPositions(prev => ({
        ...prev,
        [player]: {
          frontPeg: score,
          backPeg: Math.max(0, score - 1)
        }
      }));
    },

    // Check if currently animating
    isAnimating: () => isAnimating,

    // Skip current animation
    skipAnimation: () => {
      animationQueue.current = [];
      setIsAnimating(false);
      setAnimatingPlayer(null);
      setAnimatingPegPos(null);
      setViewBox(`0 0 ${boardWidth} ${boardHeight}`);
    }
  }), [processQueue, isAnimating, boardWidth, boardHeight]);

  // Sync peg positions with scores when not animating
  useEffect(() => {
    if (!isAnimating) {
      setPegPositions({
        player: { frontPeg: playerScore, backPeg: Math.max(0, playerScore - 1) },
        computer: { frontPeg: computerScore, backPeg: Math.max(0, computerScore - 1) }
      });
    }
  }, [playerScore, computerScore, isAnimating]);

  // Get current peg positions for rendering
  const playerFrontPos = animatingPlayer === 'player' && animatingPegPos
    ? animatingPegPos
    : getHolePosition(pegPositions.player.frontPeg, playerTrackOffset);
  const playerBackPos = getHolePosition(pegPositions.player.backPeg, playerTrackOffset);
  const computerFrontPos = animatingPlayer === 'computer' && animatingPegPos
    ? animatingPegPos
    : getHolePosition(pegPositions.computer.frontPeg, computerTrackOffset);
  const computerBackPos = getHolePosition(pegPositions.computer.backPeg, computerTrackOffset);

  // The board SVG content (reused in both normal and overlay modes)
  const boardSvg = (
    <svg
      viewBox={viewBox}
      className="mx-auto w-full max-w-[620px]"
      preserveAspectRatio="xMidYMid meet"
      style={{
        transition: `viewBox ${zoomTransitionDuration}ms ease-out`
      }}
    >
        <defs>
          {/* Glow filter for animating pegs */}
          <filter id="pegGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Hole depth gradient */}
          <radialGradient id="holeGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#3a2a1a" />
            <stop offset="100%" stopColor="#1a0a00" />
          </radialGradient>
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
            fill="url(#holeGradient)"
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
            fill="url(#holeGradient)"
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

        {/* Player back peg (blue, dimmer) */}
        {pegPositions.player.backPeg > 0 && (
          <circle
            cx={playerBackPos.x}
            cy={playerBackPos.y}
            r="5"
            fill="#4466cc"
            stroke="#000"
            strokeWidth="1"
            opacity="0.6"
          />
        )}

        {/* Player front peg (blue, bright) */}
        {pegPositions.player.frontPeg > 0 && (
          <circle
            cx={playerFrontPos.x}
            cy={playerFrontPos.y}
            r="5"
            fill="#2266ff"
            stroke="#fff"
            strokeWidth="1.5"
            filter={animatingPlayer === 'player' ? 'url(#pegGlow)' : 'none'}
            style={{
              transition: `cx ${pointAnimationDuration}ms ease-out, cy ${pointAnimationDuration}ms ease-out`
            }}
          />
        )}

        {/* Computer back peg (red, dimmer) */}
        {pegPositions.computer.backPeg > 0 && (
          <circle
            cx={computerBackPos.x}
            cy={computerBackPos.y}
            r="5"
            fill="#cc4444"
            stroke="#000"
            strokeWidth="1"
            opacity="0.6"
          />
        )}

        {/* Computer front peg (red, bright) */}
        {pegPositions.computer.frontPeg > 0 && (
          <circle
            cx={computerFrontPos.x}
            cy={computerFrontPos.y}
            r="5"
            fill="#ff2222"
            stroke="#fff"
            strokeWidth="1.5"
            filter={animatingPlayer === 'computer' ? 'url(#pegGlow)' : 'none'}
            style={{
              transition: `cx ${pointAnimationDuration}ms ease-out, cy ${pointAnimationDuration}ms ease-out`
            }}
          />
        )}

        {/* Score popup during animation */}
        {scorePopup.visible && (
          <g>
            <rect
              x={scorePopup.x - 18}
              y={scorePopup.y - 12}
              width="36"
              height="18"
              rx="4"
              fill="rgba(0,0,0,0.8)"
            />
            <text
              x={scorePopup.x}
              y={scorePopup.y}
              textAnchor="middle"
              fontSize="12"
              fontWeight="bold"
              fill="#ffd700"
            >
              +{scorePopup.points}
            </text>
          </g>
        )}

        {/* Score legend */}
        <g transform={`translate(${boardWidth / 2 - 80}, ${boardHeight - 18})`}>
          <circle cx="8" cy="0" r="5" fill="#2266ff" stroke="#fff" strokeWidth="1" />
          <text x="18" y="4" fontSize="11" fill="#ffd700" fontWeight="bold">You: {playerScore}</text>
          <circle cx="100" cy="0" r="5" fill="#ff2222" stroke="#fff" strokeWidth="1" />
          <text x="110" y="4" fontSize="11" fill="#ffd700" fontWeight="bold">CPU: {computerScore}</text>
        </g>
      </svg>
  );

  return (
    <>
      {/* Normal board display (when not animating) */}
      <div className={`mb-6 bg-gradient-to-br from-amber-800 to-amber-900 rounded-lg p-4 shadow-xl relative overflow-hidden ${isAnimating ? 'opacity-30' : ''}`}>
        {boardSvg}
      </div>

      {/* Fixed overlay for animation (always visible on screen) - z-60 to show above celebration */}
      {isAnimating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85">
          <div className="flex flex-col items-center justify-center h-full w-full p-2">
            {/* Rotated board container for portrait orientation */}
            <div
              className="relative bg-gradient-to-br from-amber-800 to-amber-900 rounded-lg p-3 shadow-2xl"
              style={{
                transform: 'rotate(90deg)',
                transformOrigin: 'center center',
                width: '90vh', // Use viewport height for width since rotated
                maxWidth: '650px',
              }}
            >
              {boardSvg}

              {/* Counter-rotated text overlay so it appears upright */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ transform: 'rotate(-90deg)' }}
              >
                <div className="text-center">
                  <div className="text-yellow-400 text-2xl font-bold animate-pulse mb-2">
                    {scorePopup.points > 0 ? `+${scorePopup.points} points` : 'Pegging...'}
                  </div>
                  <div className="text-gray-300 text-sm">
                    Watch the pegs move
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default CribbageBoard;
