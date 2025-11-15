/**
 * CribbageBoard component - Renders the cribbage board with pegs
 */

interface CribbageBoardProps {
  playerScore: number;
  computerScore: number;
}

export default function CribbageBoard({ playerScore, computerScore }: CribbageBoardProps) {
  const holes = [];

  // Create all 121 holes (0-120) with pegs at current scores
  for (let i = 0; i <= 120; i++) {
    const x = 20 + (i % 30) * 18;
    const y = 20 + Math.floor(i / 30) * 25;

    // Add hole
    holes.push(
      <circle
        key={i}
        cx={x}
        cy={y}
        r="4"
        fill="#8B4513"
        stroke="#654321"
        strokeWidth="1"
      />
    );

    // Add player peg if at this position
    if (i === playerScore) {
      holes.push(
        <circle
          key={`p${i}`}
          cx={x}
          cy={y}
          r="5"
          fill="#3B82F6"
          stroke="#1E40AF"
          strokeWidth="2"
        />
      );
    }

    // Add computer peg if at this position
    if (i === computerScore) {
      holes.push(
        <circle
          key={`c${i}`}
          cx={x}
          cy={y}
          r="5"
          fill="#EF4444"
          stroke="#991B1B"
          strokeWidth="2"
        />
      );
    }
  }

  return (
    <svg
      width="560"
      height="120"
      className="bg-amber-100 rounded-lg border-4 border-amber-800 mx-auto"
    >
      {holes}
    </svg>
  );
}
