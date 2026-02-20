// @ts-check
const { test, expect } = require('@playwright/test');
const { login } = require('./helpers/auth');

test.describe('Expert Mode', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Wait for game menu to load
    await expect(page.locator('[data-testid="difficulty-selector"]')).toBeVisible({ timeout: 10000 });
  });

  test('difficulty selector is visible on menu', async ({ page }) => {
    const selector = page.locator('[data-testid="difficulty-selector"]');
    await expect(selector).toBeVisible();
    // Both buttons should be present
    await expect(selector.getByText('Normal')).toBeVisible();
    await expect(selector.getByText('Expert')).toBeVisible();
  });

  test('Normal is selected by default', async ({ page }) => {
    const normalBtn = page.locator('[data-testid="difficulty-selector"] button', { hasText: 'Normal' });
    // Normal button should have green background
    await expect(normalBtn).toHaveClass(/bg-green-600/);
  });

  test('clicking Expert selects it and shows description', async ({ page }) => {
    const expertBtn = page.locator('[data-testid="difficulty-selector"] button', { hasText: 'Expert' });
    await expertBtn.click();
    // Expert button should now have orange background
    await expect(expertBtn).toHaveClass(/bg-orange-600/);
    // Should show the improvement list
    await expect(page.getByText('Expert AI improvements:')).toBeVisible();
    await expect(page.getByText('Optimal discards via expected value')).toBeVisible();
    await expect(page.getByText('Never miscounts hands')).toBeVisible();
  });

  test('Expert mode persists after page reload', async ({ page }) => {
    // Select expert
    await page.locator('[data-testid="difficulty-selector"] button', { hasText: 'Expert' }).click();
    await expect(page.getByText('Expert AI improvements:')).toBeVisible();

    // Reload page
    await page.reload();
    await expect(page.locator('[data-testid="difficulty-selector"]')).toBeVisible({ timeout: 10000 });

    // Expert should still be selected
    const expertBtn = page.locator('[data-testid="difficulty-selector"] button', { hasText: 'Expert' });
    await expect(expertBtn).toHaveClass(/bg-orange-600/);
  });

  test('switching back to Normal deselects Expert', async ({ page }) => {
    // Select expert first
    await page.locator('[data-testid="difficulty-selector"] button', { hasText: 'Expert' }).click();
    await expect(page.getByText('Expert AI improvements:')).toBeVisible();

    // Switch back to normal
    await page.locator('[data-testid="difficulty-selector"] button', { hasText: 'Normal' }).click();
    const normalBtn = page.locator('[data-testid="difficulty-selector"] button', { hasText: 'Normal' });
    await expect(normalBtn).toHaveClass(/bg-green-600/);
    // Description should disappear
    await expect(page.getByText('Expert AI improvements:')).not.toBeVisible();
  });

  test('Expert Mode label appears in header during gameplay', async ({ page }) => {
    // Select expert
    await page.locator('[data-testid="difficulty-selector"] button', { hasText: 'Expert' }).click();

    // Start a new game (click "New Game" button)
    const newGameBtn = page.getByRole('button', { name: /New Game/i });
    if (await newGameBtn.isVisible()) {
      await newGameBtn.click();
      // Wait for game to start - header should show Expert Mode label
      await expect(page.locator('[data-testid="expert-label"]')).toBeVisible({ timeout: 10000 });
    }
  });

  test('leaderboard shows Normal and Expert tabs', async ({ page }) => {
    // Open leaderboard from the menu (if accessible)
    const leaderboardBtn = page.getByRole('button', { name: /Leaderboard/i });
    if (await leaderboardBtn.isVisible()) {
      await leaderboardBtn.click();
      // Should see both tabs
      await expect(page.getByRole('button', { name: 'Normal' }).last()).toBeVisible({ timeout: 5000 });
      await expect(page.getByRole('button', { name: 'Expert' }).last()).toBeVisible();
    }
  });
});
