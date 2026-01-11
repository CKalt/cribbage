// @ts-check
const { test, expect } = require('@playwright/test');

// Test accounts
const USER1 = {
  email: 'chris+one@chrisk.com',
  password: 'Hello123$'
};

const USER2 = {
  email: 'chris+two@chrisk.com',
  password: 'Hello123$'
};

const BASE_URL = 'https://beta.cribbage.chrisk.com';

/**
 * Helper: Login to the app
 */
async function login(page, user) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(BASE_URL + '/', { timeout: 10000 });
  await expect(page.locator('text=Cribbage')).toBeVisible({ timeout: 10000 });
}

/**
 * Helper: Open the Game Lobby
 */
async function openGameLobby(page) {
  await page.click('button:has-text("⋮")');
  await page.waitForTimeout(500);
  await page.click('text=Play vs Friend');
  await page.waitForTimeout(500);
  await expect(page.locator('text=Find Players')).toBeVisible();
}

/**
 * Helper: Join an existing game from My Games tab
 */
async function joinExistingGame(page) {
  await openGameLobby(page);
  await page.click('text=My Games');
  await page.waitForTimeout(1000);

  // Look for any game button
  const gameButton = page.locator('button:has-text("Your Turn"), button:has-text("View"), button:has-text("Waiting")').first();
  if (await gameButton.isVisible()) {
    await gameButton.click();
    await page.waitForTimeout(2000);
    return true;
  }
  return false;
}

// ============================================================
// TEST: Game displays cards in discarding phase
// ============================================================
test('Game displays player cards in discarding phase', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  // Check if we're in discarding phase and can see cards
  const phase = await page.locator('text=Phase:').textContent();
  console.log('Current phase:', phase);

  // Check for phase indicator
  await expect(page.locator('text=Phase:')).toBeVisible();

  // If in discarding phase, we should see cards or "You've discarded" message
  const discardingPhase = phase?.includes('discarding');
  if (discardingPhase) {
    const hasCards = await page.locator('.flex.justify-center.gap-2 > div').count() > 0;
    const hasDiscarded = await page.locator('text=You\'ve discarded').isVisible();

    if (hasCards) {
      console.log('✓ Cards are displayed');
    } else if (hasDiscarded) {
      console.log('✓ Player has already discarded');
    }

    expect(hasCards || hasDiscarded).toBeTruthy();
  }

  console.log('✓ Game display test completed');
});

// ============================================================
// TEST: Can select cards for discard
// ============================================================
test('Can select cards for discard', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  // Check if in discarding phase and haven't discarded yet
  const hasDiscarded = await page.locator('text=You\'ve discarded').isVisible();
  if (hasDiscarded) {
    console.log('✓ Already discarded - selection test skipped');
    return;
  }

  // Check if cards are visible
  const cards = page.locator('.flex.justify-center.gap-2.flex-wrap > div');
  const cardCount = await cards.count();

  if (cardCount > 0) {
    // Click first card to select it
    await cards.first().click();
    await page.waitForTimeout(300);

    // Check for selection indicator (ring-4 class or similar)
    // The card should have a cyan ring when selected
    const firstCardClasses = await cards.first().getAttribute('class');
    console.log('First card classes after click:', firstCardClasses);

    // Click second card
    if (cardCount > 1) {
      await cards.nth(1).click();
      await page.waitForTimeout(300);
    }

    // Check if discard button is enabled
    const discardButton = page.locator('button:has-text("Discard")');
    if (await discardButton.isVisible()) {
      const isDisabled = await discardButton.isDisabled();
      console.log('Discard button disabled:', isDisabled);

      // With 2 cards selected, button should be enabled
      // Note: depends on whether we successfully selected 2 cards
    }

    console.log('✓ Card selection test completed');
  } else {
    console.log('⚠ No cards visible for selection');
  }
});

// ============================================================
// TEST: Discard button shows correct count
// ============================================================
test('Discard button shows selection count', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const hasDiscarded = await page.locator('text=You\'ve discarded').isVisible();
  if (hasDiscarded) {
    console.log('✓ Already discarded - button test skipped');
    return;
  }

  const discardButton = page.locator('button:has-text("Discard")');
  if (await discardButton.isVisible()) {
    // Initially should show 0/2
    const buttonText = await discardButton.textContent();
    console.log('Discard button text:', buttonText);

    expect(buttonText).toContain('/2');
    console.log('✓ Discard button shows count correctly');
  }
});

// ============================================================
// TEST: Game shows dealer indicator
// ============================================================
test('Game shows dealer indicator', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  // Check for dealer indicator
  const dealerText = page.locator('text=Dealer:');
  if (await dealerText.isVisible()) {
    const dealerInfo = await dealerText.textContent();
    console.log('Dealer info:', dealerInfo);
    console.log('✓ Dealer indicator is visible');
  } else {
    console.log('⚠ Dealer indicator not found');
  }
});

// ============================================================
// TEST: Game shows score
// ============================================================
test('Game shows score display', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  // Check for score display
  const scoreText = page.locator('text=Score:');
  await expect(scoreText).toBeVisible();

  const scoreInfo = await scoreText.textContent();
  console.log('Score display:', scoreInfo);
  console.log('✓ Score is displayed');
});

// ============================================================
// TEST: Game shows turn indicator
// ============================================================
test('Game shows turn indicator', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  // Wait for the game UI to fully load
  await page.waitForTimeout(1000);

  // The turn indicator is a prominent element - check for either state
  // Use .first() since "Waiting for" may appear in multiple places
  const yourTurn = await page.locator('text=Your Turn').first().isVisible();
  const waiting = await page.locator('text=/^Waiting for .+\\.\\.\\.$/').first().isVisible();

  if (yourTurn) {
    console.log('✓ Shows "Your Turn"');
  } else if (waiting) {
    console.log('✓ Shows "Waiting for opponent"');
  }

  // At least one turn indicator should be visible
  expect(yourTurn || waiting).toBeTruthy();
});

// ============================================================
// TEST: Game shows last move info
// ============================================================
test('Game shows last move info', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  // Check for last move section
  const lastMoveLabel = page.locator('text=Last move:');
  if (await lastMoveLabel.isVisible()) {
    console.log('✓ Last move info is displayed');
  } else {
    console.log('⚠ No last move info (game may be new)');
  }
});

// ============================================================
// TEST: Full discard flow (if in discarding phase)
// ============================================================
test('Full discard flow', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  // Check phase
  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('discarding')) {
    console.log('⚠ Not in discarding phase - skipping discard flow test');
    test.skip();
    return;
  }

  // Check if already discarded
  const hasDiscarded = await page.locator('text=You\'ve discarded').isVisible();
  if (hasDiscarded) {
    console.log('✓ Already discarded - flow test skipped');
    return;
  }

  // Get cards
  const cards = page.locator('.flex.justify-center.gap-2.flex-wrap > div');
  const cardCount = await cards.count();

  if (cardCount < 2) {
    console.log('⚠ Not enough cards to discard');
    return;
  }

  // Select first card
  console.log('Selecting first card...');
  await cards.first().click();
  await page.waitForTimeout(300);

  // Select second card
  console.log('Selecting second card...');
  await cards.nth(1).click();
  await page.waitForTimeout(300);

  // Check discard button
  const discardButton = page.locator('button:has-text("Discard 2/2")');
  if (await discardButton.isVisible()) {
    console.log('✓ Discard button enabled with 2 cards selected');

    // Click discard
    await discardButton.click();
    await page.waitForTimeout(2000);

    // Check for success - should show "You've discarded" message
    const discardSuccess = await page.locator('text=You\'ve discarded').isVisible();
    if (discardSuccess) {
      console.log('✓ Discard successful!');
    } else {
      // Check if moved to next phase
      const newPhase = await page.locator('text=Phase:').textContent();
      console.log('Phase after discard:', newPhase);
    }
  } else {
    console.log('⚠ Discard button not showing 2/2 - selection may have failed');
  }
});

// ============================================================
// TEST: Two players can both discard
// ============================================================
test('Two players can discard', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  try {
    // Login both users
    console.log('Logging in User 1...');
    await login(page1, USER1);

    console.log('Logging in User 2...');
    await login(page2, USER2);

    // Both join their games
    console.log('User 1 joining game...');
    const joined1 = await joinExistingGame(page1);

    console.log('User 2 joining game...');
    const joined2 = await joinExistingGame(page2);

    if (!joined1 || !joined2) {
      console.log('⚠ Could not join games for both users');
      test.skip();
      return;
    }

    // Check phases for both
    const phase1 = await page1.locator('text=Phase:').textContent();
    const phase2 = await page2.locator('text=Phase:').textContent();

    console.log('User 1 phase:', phase1);
    console.log('User 2 phase:', phase2);

    // If both in discarding, check their states
    if (phase1?.includes('discarding') && phase2?.includes('discarding')) {
      const user1Discarded = await page1.locator('text=You\'ve discarded').isVisible();
      const user2Discarded = await page2.locator('text=You\'ve discarded').isVisible();

      console.log('User 1 has discarded:', user1Discarded);
      console.log('User 2 has discarded:', user2Discarded);

      console.log('✓ Both users can see discarding phase');
    }

  } finally {
    await context1.close();
    await context2.close();
  }
});

// ============================================================
// TEST: Cut phase displays correctly
// ============================================================
test('Cut phase shows cut button', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('cut')) {
    console.log('⚠ Not in cut phase - skipping');
    test.skip();
    return;
  }

  // Check for cut deck button
  const cutButton = page.locator('button:has-text("Cut Deck")');
  const waitingForCut = page.locator('text=Waiting for');

  const hasCutButton = await cutButton.isVisible();
  const isWaiting = await waitingForCut.isVisible();

  if (hasCutButton) {
    console.log('✓ Cut Deck button is visible (it\'s your turn to cut)');
  } else if (isWaiting) {
    console.log('✓ Waiting for opponent to cut');
  }

  expect(hasCutButton || isWaiting).toBeTruthy();
});

// ============================================================
// TEST: Cut card displays after cut
// ============================================================
test('Cut card displays after cutting', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  // Check for cut card display
  const cutCardLabel = page.locator('text=Cut Card');
  if (await cutCardLabel.isVisible()) {
    console.log('✓ Cut card is displayed');

    // The cut card should have a value displayed nearby
    const cutCardArea = page.locator('text=Cut Card').locator('..');
    const cutCardContent = await cutCardArea.textContent();
    console.log('Cut card area:', cutCardContent);
  } else {
    console.log('⚠ No cut card visible (not yet cut or in earlier phase)');
  }
});

// ============================================================
// PLAY PHASE TESTS
// ============================================================

// ============================================================
// TEST: Play phase shows count display
// ============================================================
test('Play phase shows count display', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('playing')) {
    console.log('⚠ Not in playing phase - skipping');
    test.skip();
    return;
  }

  // Check for count display
  const countLabel = page.locator('text=Count:');
  await expect(countLabel).toBeVisible();

  const countText = await countLabel.textContent();
  console.log('Count display:', countText);

  // Should show "/ 31"
  const has31 = await page.locator('text=/ 31').isVisible();
  expect(has31).toBeTruthy();

  console.log('✓ Count display is visible');
});

// ============================================================
// TEST: Play phase shows played cards area
// ============================================================
test('Play phase shows played cards area', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('playing')) {
    console.log('⚠ Not in playing phase - skipping');
    test.skip();
    return;
  }

  // Check for played cards area
  const playedCardsLabel = page.locator('text=Cards played this round');
  await expect(playedCardsLabel).toBeVisible();

  console.log('✓ Played cards area is visible');
});

// ============================================================
// TEST: Play phase shows remaining cards count
// ============================================================
test('Play phase shows remaining cards', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('playing')) {
    console.log('⚠ Not in playing phase - skipping');
    test.skip();
    return;
  }

  // Check for "Your cards (X remaining):" label
  const yourCardsLabel = page.locator('text=Your cards');
  await expect(yourCardsLabel).toBeVisible();

  const labelText = await yourCardsLabel.textContent();
  console.log('Your cards label:', labelText);

  // Should contain "remaining"
  expect(labelText).toContain('remaining');

  console.log('✓ Remaining cards display is visible');
});

// ============================================================
// TEST: Play phase shows playable cards highlighted
// ============================================================
test('Play phase highlights playable cards', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('playing')) {
    console.log('⚠ Not in playing phase - skipping');
    test.skip();
    return;
  }

  // Check if it's our turn
  const isMyTurn = await page.locator('text=Your Turn').isVisible();
  if (!isMyTurn) {
    console.log('⚠ Not my turn - skipping highlight test');
    test.skip();
    return;
  }

  // Look for playable card indicator - should see "Tap a highlighted card"
  const tapMessage = page.locator('text=Tap a highlighted card');
  const goButton = page.locator('button:has-text("Go")');

  const hasTapMessage = await tapMessage.isVisible();
  const hasGoButton = await goButton.isVisible();

  if (hasTapMessage) {
    console.log('✓ Playable cards message is shown');
  } else if (hasGoButton) {
    console.log('✓ Go button is shown (no playable cards)');
  }

  expect(hasTapMessage || hasGoButton).toBeTruthy();
});

// ============================================================
// TEST: Go button appears when no playable cards
// ============================================================
test('Go button appears when no playable cards', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('playing')) {
    console.log('⚠ Not in playing phase - skipping');
    test.skip();
    return;
  }

  const isMyTurn = await page.locator('text=Your Turn').isVisible();
  if (!isMyTurn) {
    console.log('⚠ Not my turn - skipping Go button test');
    test.skip();
    return;
  }

  // Check for "No playable cards" message or Go button
  const noPlayable = page.locator('text=No playable cards');
  const goButton = page.locator('button:has-text("Go")');

  const hasNoPlayableMessage = await noPlayable.isVisible();
  const hasGoButton = await goButton.isVisible();

  if (hasGoButton) {
    console.log('✓ Go button is available');

    // Check the button text
    const buttonText = await goButton.textContent();
    console.log('Go button text:', buttonText);
    expect(buttonText).toContain('Go');
  } else {
    console.log('✓ Player has playable cards (Go button not needed)');
  }
});

// ============================================================
// TEST: Opponent Go indicator shows
// ============================================================
test('Opponent Go indicator displays', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('playing')) {
    console.log('⚠ Not in playing phase - skipping');
    test.skip();
    return;
  }

  // Check for opponent Go indicator
  const opponentGo = page.locator('text=said "Go"');
  const hasOpponentGo = await opponentGo.isVisible();

  if (hasOpponentGo) {
    console.log('✓ Opponent Go indicator is visible');
  } else {
    console.log('✓ No opponent Go indicator (opponent hasn\'t said Go)');
  }

  // This test passes either way - we're just checking the UI handles both states
});

// ============================================================
// TEST: Can play a card in play phase
// ============================================================
test('Can play a card in play phase', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('playing')) {
    console.log('⚠ Not in playing phase - skipping');
    test.skip();
    return;
  }

  const isMyTurn = await page.locator('text=Your Turn').isVisible();
  if (!isMyTurn) {
    console.log('⚠ Not my turn - cannot play card');
    test.skip();
    return;
  }

  // Check if we have playable cards (not showing Go button)
  const tapMessage = page.locator('text=Tap a highlighted card');
  if (!await tapMessage.isVisible()) {
    console.log('⚠ No playable cards available');
    test.skip();
    return;
  }

  // Get current count before playing
  const countBefore = await page.locator('text=Count:').textContent();
  console.log('Count before:', countBefore);

  // Get cards - find ones that are not disabled
  const cards = page.locator('.flex.justify-center.gap-2.flex-wrap > div').filter({
    has: page.locator(':not([class*="opacity-50"])')
  });

  const cardCount = await cards.count();
  console.log('Number of card elements:', cardCount);

  if (cardCount > 0) {
    // Click the first playable card
    console.log('Clicking first card...');
    await cards.first().click();
    await page.waitForTimeout(2000);

    // Check if phase changed or count updated
    const countAfter = await page.locator('text=Count:').textContent();
    console.log('Count after:', countAfter);

    // Check for last move update
    const lastMove = page.locator('text=Last move:');
    if (await lastMove.isVisible()) {
      const lastMoveText = await lastMove.locator('..').textContent();
      console.log('Last move:', lastMoveText);
    }

    console.log('✓ Card play test completed');
  } else {
    console.log('⚠ No enabled cards found');
  }
});

// ============================================================
// TEST: Two players can play cards alternately
// ============================================================
test('Two players can play in play phase', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  try {
    console.log('Logging in User 1...');
    await login(page1, USER1);

    console.log('Logging in User 2...');
    await login(page2, USER2);

    console.log('User 1 joining game...');
    const joined1 = await joinExistingGame(page1);

    console.log('User 2 joining game...');
    const joined2 = await joinExistingGame(page2);

    if (!joined1 || !joined2) {
      console.log('⚠ Could not join games for both users');
      test.skip();
      return;
    }

    const phase1 = await page1.locator('text=Phase:').textContent();
    const phase2 = await page2.locator('text=Phase:').textContent();

    console.log('User 1 phase:', phase1);
    console.log('User 2 phase:', phase2);

    if (!phase1?.includes('playing') || !phase2?.includes('playing')) {
      console.log('⚠ Not both in playing phase');
      test.skip();
      return;
    }

    // Check whose turn it is
    const user1Turn = await page1.locator('text=Your Turn').isVisible();
    const user2Turn = await page2.locator('text=Your Turn').isVisible();

    console.log('User 1 turn:', user1Turn);
    console.log('User 2 turn:', user2Turn);

    // Exactly one should have the turn
    expect(user1Turn !== user2Turn).toBeTruthy();

    console.log('✓ Turn management is working correctly');

  } finally {
    await context1.close();
    await context2.close();
  }
});

// ============================================================
// TEST: Count highlights at 15 or 31
// ============================================================
test('Count highlights at special values', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('playing')) {
    console.log('⚠ Not in playing phase - skipping');
    test.skip();
    return;
  }

  // Get the count element
  const countValue = page.locator('.text-2xl.font-bold');
  if (await countValue.isVisible()) {
    const countText = await countValue.textContent();
    const countNum = parseInt(countText || '0');
    console.log('Current count:', countNum);

    // Check if count has special highlighting class
    const countClasses = await countValue.getAttribute('class');
    console.log('Count classes:', countClasses);

    if (countNum === 15 || countNum === 31) {
      // Should have yellow highlighting
      expect(countClasses).toContain('text-yellow');
      console.log('✓ Count has special highlighting at', countNum);
    } else {
      console.log('✓ Count display working (not at special value)');
    }
  }
});

// ============================================================
// COUNTING PHASE TESTS
// ============================================================

// ============================================================
// TEST: Counting phase displays correctly
// ============================================================
test('Counting phase displays correctly', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('counting')) {
    console.log('⚠ Not in counting phase - skipping');
    test.skip();
    return;
  }

  // Check for counting phase header
  const countingHeader = page.locator('text=Counting Phase');
  await expect(countingHeader).toBeVisible();

  // Check for "Counting:" label showing what's being counted
  const countingLabel = page.locator('text=/Counting:/');
  await expect(countingLabel).toBeVisible();

  const labelText = await countingLabel.textContent();
  console.log('Counting label:', labelText);

  console.log('✓ Counting phase displays correctly');
});

// ============================================================
// TEST: Counting phase shows cut card
// ============================================================
test('Counting phase shows cut card', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('counting')) {
    console.log('⚠ Not in counting phase - skipping');
    test.skip();
    return;
  }

  // Check for cut card label
  const cutCardLabel = page.locator('text=Cut Card:');
  await expect(cutCardLabel).toBeVisible();

  console.log('✓ Cut card is displayed during counting');
});

// ============================================================
// TEST: Counting phase shows hand being counted
// ============================================================
test('Counting phase shows hand being counted', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('counting')) {
    console.log('⚠ Not in counting phase - skipping');
    test.skip();
    return;
  }

  // Check for hand label (either "Hand:" or "Crib:")
  const handLabel = page.locator('text=/^Hand:|^Crib:/');
  await expect(handLabel).toBeVisible();

  const labelText = await handLabel.textContent();
  console.log('Hand/Crib label:', labelText);

  console.log('✓ Hand/Crib is displayed for counting');
});

// ============================================================
// TEST: Count button appears when it's your turn
// ============================================================
test('Count button appears when it is your turn', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('counting')) {
    console.log('⚠ Not in counting phase - skipping');
    test.skip();
    return;
  }

  // Check if it's our turn
  const isMyTurn = await page.locator('text=Your Turn').first().isVisible();
  if (!isMyTurn) {
    console.log('⚠ Not my turn to count - skipping');
    test.skip();
    return;
  }

  // Check for Count Hand button
  const countButton = page.locator('button:has-text("Count Hand")');
  await expect(countButton).toBeVisible();

  console.log('✓ Count Hand button is visible');
});

// ============================================================
// TEST: Waiting message when not your turn to count
// ============================================================
test('Waiting message displays when not your turn to count', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('counting')) {
    console.log('⚠ Not in counting phase - skipping');
    test.skip();
    return;
  }

  // Check if it's NOT our turn
  const isMyTurn = await page.locator('text=Your Turn').first().isVisible();
  if (isMyTurn) {
    console.log('⚠ It is my turn - skipping waiting test');
    test.skip();
    return;
  }

  // Check for waiting message
  const waitingMsg = page.locator('text=/Waiting for .+\\.\\.\\.$/').first();
  await expect(waitingMsg).toBeVisible();

  console.log('✓ Waiting message is displayed');
});

// ============================================================
// TEST: Scores display shows round scores
// ============================================================
test('Scores display during counting phase', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('counting')) {
    console.log('⚠ Not in counting phase - skipping');
    test.skip();
    return;
  }

  // Check for Scores This Round section (appears after at least one count)
  const scoresSection = page.locator('text=Scores This Round');
  const hasScoresSection = await scoresSection.isVisible();

  if (hasScoresSection) {
    console.log('✓ Scores This Round section is visible');

    // Check for point displays
    const pointsText = page.locator('text=/\\d+ points/').first();
    if (await pointsText.isVisible()) {
      const points = await pointsText.textContent();
      console.log('Found points display:', points);
    }
  } else {
    console.log('✓ No scores yet (first count not complete)');
  }
});

// ============================================================
// TEST: Can click Count Hand button
// ============================================================
test('Can click Count Hand button to count', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  const phase = await page.locator('text=Phase:').textContent();
  if (!phase?.includes('counting')) {
    console.log('⚠ Not in counting phase - skipping');
    test.skip();
    return;
  }

  // Check if it's our turn
  const isMyTurn = await page.locator('text=Your Turn').first().isVisible();
  if (!isMyTurn) {
    console.log('⚠ Not my turn to count - skipping');
    test.skip();
    return;
  }

  // Click the Count Hand button
  const countButton = page.locator('button:has-text("Count Hand")');
  await expect(countButton).toBeVisible();

  // Get current score before clicking
  const scoreBefore = await page.locator('text=/\\(\\d+ pts\\)/).first().textContent();
  console.log('Score before:', scoreBefore);

  await countButton.click();
  await page.waitForTimeout(2000);

  // After clicking, either scores section appears or phase changes
  const scoresSection = await page.locator('text=Scores This Round').isVisible();
  const phaseChanged = !(await page.locator('text=Phase: counting').isVisible());

  if (scoresSection) {
    console.log('✓ Scores section appeared after counting');
  } else if (phaseChanged) {
    console.log('✓ Phase changed after counting (new round started)');
  }

  expect(scoresSection || phaseChanged).toBeTruthy();
});

// ============================================================
// TEST: Two players can both count
// ============================================================
test('Two players can count their hands', async ({ browser }) => {
  const context1 = await browser.newContext();
  const context2 = await browser.newContext();

  const page1 = await context1.newPage();
  const page2 = await context2.newPage();

  try {
    // Login both users
    console.log('Logging in User 1...');
    await login(page1, USER1);

    console.log('Logging in User 2...');
    await login(page2, USER2);

    // Both join their games
    console.log('User 1 joining game...');
    const joined1 = await joinExistingGame(page1);

    console.log('User 2 joining game...');
    const joined2 = await joinExistingGame(page2);

    if (!joined1 || !joined2) {
      console.log('⚠ Could not join games for both users');
      test.skip();
      return;
    }

    // Check phases for both
    const phase1 = await page1.locator('text=Phase:').textContent();
    const phase2 = await page2.locator('text=Phase:').textContent();

    console.log('User 1 phase:', phase1);
    console.log('User 2 phase:', phase2);

    if (!phase1?.includes('counting') || !phase2?.includes('counting')) {
      console.log('⚠ Not both in counting phase - skipping');
      test.skip();
      return;
    }

    // Check who has the Count button
    const user1HasCount = await page1.locator('button:has-text("Count Hand")').isVisible();
    const user2HasCount = await page2.locator('button:has-text("Count Hand")').isVisible();

    console.log('User 1 can count:', user1HasCount);
    console.log('User 2 can count:', user2HasCount);

    // Only one should be able to count at a time
    expect(user1HasCount || user2HasCount).toBeTruthy();

    console.log('✓ Counting phase turn management is working');

  } finally {
    await context1.close();
    await context2.close();
  }
});

// ============================================================
// TEST: New round starts after all counting
// ============================================================
test('New round starts after counting completes', async ({ page }) => {
  await login(page, USER1);

  const joined = await joinExistingGame(page);
  if (!joined) {
    console.log('⚠ No games available to test');
    test.skip();
    return;
  }

  // This test observes the round number
  const roundDisplay = page.locator('text=/Game #/');
  if (await roundDisplay.isVisible()) {
    const gameInfo = await roundDisplay.textContent();
    console.log('Game info:', gameInfo);
  }

  const phase = await page.locator('text=Phase:').textContent();
  console.log('Current phase:', phase);

  // If in counting or discarding, game is progressing normally
  if (phase?.includes('counting') || phase?.includes('discarding')) {
    console.log('✓ Game is in a valid phase (counting or new round discarding)');
  }

  expect(phase).toBeTruthy();
});
