# Plan: Convert Cribbage React Artifact to Next.js Application

## Table of Contents

### Phase 1: Project Initialization
- [ ] [1.1: Create Next.js project with TypeScript and Tailwind CSS 🤖](#step-11-create-nextjs-project-with-typescript-and-tailwind-css-🤖)
- [ ] [1.2: Review generated project structure 🤖](#step-12-review-generated-project-structure-🤖)
- [ ] [1.3: Clean up default Next.js files 🤖](#step-13-clean-up-default-nextjs-files-🤖)

### Phase 2: Extract Game Logic into Utilities
- [ ] [2.1: Create types and interfaces file 🤖](#step-21-create-types-and-interfaces-file-🤖)
- [ ] [2.2: Create card utilities module 🤖](#step-22-create-card-utilities-module-🤖)
- [ ] [2.3: Create scoring utilities module 🤖](#step-23-create-scoring-utilities-module-🤖)
- [ ] [2.4: Create game state types and constants 🤖](#step-24-create-game-state-types-and-constants-🤖)

### Phase 3: Create Game State Management
- [ ] [3.1: Create game context provider 🤖](#step-31-create-game-context-provider-🤖)
- [ ] [3.2: Implement game actions and reducers 🤖](#step-32-implement-game-actions-and-reducers-🤖)
- [ ] [3.3: Create custom hooks for game operations 🤖](#step-33-create-custom-hooks-for-game-operations-🤖)

### Phase 4: Build Component Structure
- [ ] [4.1: Create Card component 🤖](#step-41-create-card-component-🤖)
- [ ] [4.2: Create CribbageBoard component 🤖](#step-42-create-cribbageboard-component-🤖)
- [ ] [4.3: Create Hand component 🤖](#step-43-create-hand-component-🤖)
- [ ] [4.4: Create PeggingArea component 🤖](#step-44-create-peggingarea-component-🤖)
- [ ] [4.5: Create GameControls component 🤖](#step-45-create-gamecontrols-component-🤖)
- [ ] [4.6: Create MessageDisplay component 🤖](#step-46-create-messagedisplay-component-🤖)
- [ ] [4.7: Create CuttingDeck component 🤖](#step-47-create-cuttingdeck-component-🤖)

### Phase 5: Main Page Integration
- [ ] [5.1: Create main game page component 🤖](#step-51-create-main-game-page-component-🤖)
- [ ] [5.2: Integrate all components in main page 🤖](#step-52-integrate-all-components-in-main-page-🤖)
- [ ] [5.3: Configure layout and metadata 🤖](#step-53-configure-layout-and-metadata-🤖)

### Phase 6: Testing and Verification
- [ ] [6.1: Run development server 🤖](#step-61-run-development-server-🤖)
- [ ] [6.2: Test all game phases 👤](#step-62-test-all-game-phases-👤)
- [ ] [6.3: Fix any issues found during testing 🤖](#step-63-fix-any-issues-found-during-testing-🤖)

### Phase 7: Documentation and Git
- [ ] [7.1: Create README with setup instructions 🤖](#step-71-create-readme-with-setup-instructions-🤖)
- [ ] [7.2: Git add and commit changes 🤖](#step-72-git-add-and-commit-changes-🤖)
- [ ] [7.3: User pushes to remote 👤](#step-73-user-pushes-to-remote-👤)

---

## Phase 1: Project Initialization

### Step 1.1: Create Next.js project with TypeScript and Tailwind CSS 🤖

Initialize a new Next.js project using `create-next-app` with TypeScript and Tailwind CSS configured.

**Actions:**
- Run `npx create-next-app@latest . --typescript --tailwind --app --no-src`
- This will create the Next.js project in the current directory
- Accept defaults for ESLint and other configurations

**Expected Output:**
- Next.js project structure with app router
- TypeScript configuration files
- Tailwind CSS setup

---

### Step 1.2: Review generated project structure 🤖

Review the generated project to understand the directory structure and identify where components and utilities will be placed.

**Actions:**
- Examine the `/app` directory structure
- Note the location of `page.tsx`, `layout.tsx`, etc.
- Identify where to create `/components`, `/lib`, `/hooks`, `/types` directories

**Expected Output:**
- Understanding of Next.js 13+ app router structure
- Plan for organizing custom code

---

### Step 1.3: Clean up default Next.js files 🤖

Remove or clean up the default Next.js template content to prepare for the Cribbage game.

**Actions:**
- Clear default content from `app/page.tsx`
- Update `app/layout.tsx` with appropriate metadata
- Remove unnecessary default styles
- Keep Tailwind configuration

**Expected Output:**
- Clean slate for building the Cribbage application
- Basic Next.js structure intact

---

## Phase 2: Extract Game Logic into Utilities

### Step 2.1: Create types and interfaces file 🤖

Create a centralized types file that defines all TypeScript interfaces and types used throughout the application.

**Actions:**
- Create `/types/game.ts`
- Define `Card` interface
- Define `GamePhase` type
- Define `Player` type
- Define `PeggingPlay` interface
- Define `GameState` interface

**Expected Output:**
```typescript
// Example structure
export interface Card {
  suit: string;
  rank: string;
  value: number;
}

export type GamePhase = 'initial' | 'cutting' | 'cut' | 'deal' | 'discard' | 'cut-starter' | 'pegging' | 'counting' | 'round-end' | 'game-over';
// ... etc
```

---

### Step 2.2: Create card utilities module 🤖

Extract all card-related utility functions into a dedicated module.

**Actions:**
- Create `/lib/cardUtils.ts`
- Move `createDeck()`, `shuffleDeck()`, `getCardValue()`, `getRankValue()` functions
- Export all utility functions

**Expected Output:**
- Clean, reusable card utility functions
- Proper TypeScript typing

---

### Step 2.3: Create scoring utilities module 🤖

Extract all scoring logic into a dedicated module.

**Actions:**
- Create `/lib/scoringUtils.ts`
- Move `scoreHand()`, `scorePegging()`, `count15s()`, `countPairs()`, `countRuns()`, `isRun()`, `getCombinations()` functions
- Export all scoring functions

**Expected Output:**
- Centralized scoring logic
- Easy to test and maintain

---

### Step 2.4: Create game state types and constants 🤖

Define game constants and additional helper types.

**Actions:**
- Create `/lib/constants.ts`
- Define `SUITS`, `RANKS` constants
- Define game configuration constants (e.g., `WINNING_SCORE = 121`)
- Define initial state values

**Expected Output:**
- Centralized game configuration
- Easy to modify game rules

---

## Phase 3: Create Game State Management

### Step 3.1: Create game context provider 🤖

Build a React Context provider to manage global game state.

**Actions:**
- Create `/contexts/GameContext.tsx`
- Define `GameState` interface
- Create `GameContext` and `GameProvider`
- Initialize all game state variables
- Provide state and setter functions

**Expected Output:**
- Centralized state management
- Context available to all components

---

### Step 3.2: Implement game actions and reducers 🤖

Create game action functions that modify the game state.

**Actions:**
- Create `/lib/gameActions.ts`
- Implement `cutForDeal()`, `dealHands()`, `confirmDiscard()`, `cutStarter()`, `startPegging()` actions
- Implement pegging actions: `playerPeg()`, `computerPeg()`, `playerSayGo()`
- Implement counting and round management actions

**Expected Output:**
- Clean separation of game logic from UI
- Testable game actions

---

### Step 3.3: Create custom hooks for game operations 🤖

Create custom React hooks that encapsulate common game operations.

**Actions:**
- Create `/hooks/useGameActions.ts`
- Create hook that wraps game actions with context
- Provide easy-to-use interface for components

**Expected Output:**
- Simplified component logic
- Reusable game operation hooks

---

## Phase 4: Build Component Structure

### Step 4.1: Create Card component 🤖

Build a reusable Card component for rendering playing cards.

**Actions:**
- Create `/components/Card.tsx`
- Accept props: `card`, `selectable`, `selected`, `onClick`
- Implement card rendering with proper styling
- Handle red/black card colors

**Expected Output:**
- Reusable, well-styled Card component
- Proper TypeScript props interface

---

### Step 4.2: Create CribbageBoard component 🤖

Build the cribbage board with pegs showing player scores.

**Actions:**
- Create `/components/CribbageBoard.tsx`
- Accept props: `playerScore`, `computerScore`
- Render SVG-based board with holes
- Show player and computer pegs at correct positions

**Expected Output:**
- Visual cribbage board component
- Accurate score representation

---

### Step 4.3: Create Hand component 🤖

Build a component to display a hand of cards.

**Actions:**
- Create `/components/Hand.tsx`
- Accept props: `cards`, `selectable`, `selectedCards`, `onCardClick`, `hidden`
- Render multiple Card components
- Handle card selection state

**Expected Output:**
- Flexible hand display component
- Works for player hand, computer hand, and crib

---

### Step 4.4: Create PeggingArea component 🤖

Build a component to show the pegging play area.

**Actions:**
- Create `/components/PeggingArea.tsx`
- Accept props: `peggingPile`, `peggingCount`
- Display played cards in sequence
- Show current count

**Expected Output:**
- Clear visualization of pegging phase
- Shows cards played and running count

---

### Step 4.5: Create GameControls component 🤖

Build a component for game control buttons.

**Actions:**
- Create `/components/GameControls.tsx`
- Accept props: `gamePhase`, `onCutForDeal`, `onDealCards`, etc.
- Conditionally render appropriate buttons based on game phase
- Style buttons consistently

**Expected Output:**
- Centralized control interface
- Phase-appropriate button display

---

### Step 4.6: Create MessageDisplay component 🤖

Build a component to show game messages to the player.

**Actions:**
- Create `/components/MessageDisplay.tsx`
- Accept props: `message`
- Style message box with appropriate colors
- Center and make prominent

**Expected Output:**
- Clear message communication
- Consistent styling

---

### Step 4.7: Create CuttingDeck component 🤖

Build a component for the deck cutting visualization.

**Actions:**
- Create `/components/CuttingDeck.tsx`
- Accept props: `onCut`, `playerCutCard`, `computerCutCard`
- Render deck spread for cutting
- Show cut cards when revealed

**Expected Output:**
- Interactive deck cutting interface
- Visual feedback during cutting phase

---

## Phase 5: Main Page Integration

### Step 5.1: Create main game page component 🤖

Build the main game page that orchestrates all components.

**Actions:**
- Update `/app/page.tsx`
- Import all components
- Use GameContext for state management
- Structure page layout

**Expected Output:**
- Main game interface
- All components working together

---

### Step 5.2: Integrate all components in main page 🤖

Wire up all components with proper props and event handlers.

**Actions:**
- Connect Card components to game state
- Connect Board to scores
- Connect Hands to player/computer cards
- Connect Controls to game actions
- Implement conditional rendering based on game phase

**Expected Output:**
- Fully functional game interface
- All interactions working

---

### Step 5.3: Configure layout and metadata 🤖

Configure the app layout and metadata for proper display.

**Actions:**
- Update `/app/layout.tsx`
- Set page title to "Cribbage Game"
- Configure viewport and other metadata
- Ensure Tailwind styles are included

**Expected Output:**
- Proper page metadata
- Correct styling application

---

## Phase 6: Testing and Verification

### Step 6.1: Run development server 🤖

Start the Next.js development server and verify it runs without errors.

**Actions:**
- Run `npm run dev`
- Verify server starts on http://localhost:3000
- Check for compilation errors

**Expected Output:**
- Dev server running
- No TypeScript or build errors

---

### Step 6.2: Test all game phases 👤

**User Action:** Manually test the game through all phases to ensure functionality.

**Test Cases:**
1. Initial load - "Cut for Deal" button appears
2. Cutting phase - deck appears and responds to clicks
3. Card distribution - low card wins deal
4. Deal phase - 6 cards dealt to each player
5. Discard phase - can select 2 cards
6. Starter cut - starter card appears
7. Pegging phase - can play cards, "Go" button works
8. Counting phase - scores calculated correctly
9. Round progression - dealer alternates
10. Game completion - winner declared at 121 points

**Expected Outcome:**
- All game phases work correctly
- No console errors
- Smooth transitions between phases

---

### Step 6.3: Fix any issues found during testing 🤖

Address any bugs or issues discovered during testing.

**Actions:**
- Debug any errors found
- Fix UI/UX issues
- Ensure game logic works correctly
- Verify TypeScript types are correct

**Expected Output:**
- Fully working game
- No known bugs

---

## Phase 7: Documentation and Git

### Step 7.1: Create README with setup instructions 🤖

Create comprehensive README documentation.

**Actions:**
- Create/update `/README.md`
- Document installation steps
- Document how to run the dev server
- Document how to build for production
- Explain project structure
- Add game rules reference

**Expected Output:**
- Complete README file
- Easy onboarding for development

---

### Step 7.2: Git add and commit changes 🤖

Add all new files to git and create a commit.

**Actions:**
- Use `git add` with specific files (no wildcards)
- List each new file/directory explicitly
- Create commit message describing the conversion
- Include co-authorship footer

**Expected Output:**
- All changes committed to current branch
- Ready for user to push

---

### Step 7.3: User pushes to remote 👤

**User Action:** Push the committed changes to the remote repository.

**Command:**
```bash
git push origin <branch-name>
```

**Expected Outcome:**
- Changes available on remote repository
- Ready for deployment if needed

---

## Summary

This plan converts the single-file React component (`cribbage-game.tsx`) into a well-organized Next.js application with:

- **Proper separation of concerns**: Utilities, types, components, and state management in separate modules
- **TypeScript throughout**: Full type safety
- **Next.js 13+ App Router**: Modern Next.js architecture
- **Tailwind CSS**: Consistent styling framework
- **Component-based architecture**: Reusable, maintainable components
- **Context-based state management**: Clean global state handling

The resulting application will be development-ready and can be extended with additional features like multiplayer, game history, statistics, etc.
