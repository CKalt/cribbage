# Cribbage Game

A standalone Next.js implementation of the classic card game Cribbage. Play against a computer opponent with full game rules including pegging, counting, and muggins.

## Features

- Complete Cribbage game implementation
- Play against computer AI
- Full scoring including:
  - Fifteens
  - Pairs
  - Runs
  - Flushes
  - Nobs
  - His Heels
- Pegging phase with proper "Go" rules
- Counting phase with muggins (catch opponent's miscount)
- Proper dealer rotation
- Cut for deal at start

## Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to play the game.

## How to Play

1. Click "Start New Game" to begin
2. Cut the deck to determine first dealer (low card deals)
3. Select 2 cards to discard to the crib
4. Play cards during the pegging phase, trying to make the count exactly 15 or 31
5. Count your hand after pegging
6. First player to 121 wins!

## Build for Production

To create a production build:

```bash
npm run build
npm run start
```

## Technologies Used

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- shadcn/ui components