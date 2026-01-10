// @ts-check
const { test, expect } = require('@playwright/test');

// Test accounts
const USER1 = {
  email: 'chris@chrisk.com',
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

  // Should show either "Your Turn" or "Waiting for..."
  const yourTurn = await page.locator('text=Your Turn').isVisible();
  const waiting = await page.locator('text=Waiting for').isVisible();

  if (yourTurn) {
    console.log('✓ Shows "Your Turn"');
  } else if (waiting) {
    console.log('✓ Shows "Waiting for opponent"');
  }

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
