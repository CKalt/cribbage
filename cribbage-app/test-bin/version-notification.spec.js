// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Version Notification Tests
 *
 * These tests verify that the version notification system works correctly:
 * 1. The /api/version endpoint returns correct data
 * 2. The "What's New" modal appears when user hasn't seen current version
 * 3. The "New Version Available" modal appears when there's a version mismatch
 * 4. localStorage tracking works correctly
 */

const RELEASE_NOTES_SEEN_KEY = 'cribbage_release_notes_seen';

test.describe('Version API', () => {
  test('should return version and release note', async ({ request }) => {
    const response = await request.get('/api/version');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log('API Response:', data);

    expect(data.version).toBeDefined();
    expect(data.version).toMatch(/^v\d+\.\d+\.\d+-b\d+$/);
    expect(data.releaseNote).toBeDefined();
    expect(data.releaseNote.length).toBeGreaterThan(0);
  });
});

test.describe('Version Notification Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test('should show "What\'s New" modal on first visit', async ({ page }) => {
    // Listen for console logs to see version check debug output
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('Version check')) {
        consoleLogs.push(msg.text());
      }
    });

    await page.goto('/');

    // Wait a moment for the version check to run
    await page.waitForTimeout(2000);

    // Log what we captured
    console.log('Console logs captured:', consoleLogs);

    // Check if the modal appeared - look for either version modal
    const modal = page.locator('text="What\'s New!"').or(page.locator('text="New Version Available!"'));

    // Take screenshot regardless of result
    await page.screenshot({ path: 'test-bin/screenshots/version-modal-first-visit.png' });

    // The modal should appear since localStorage was cleared
    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should NOT show modal after dismissing "What\'s New"', async ({ page }) => {
    // First, get the current version from API
    const versionResponse = await page.request.get('/api/version');
    const { version } = await versionResponse.json();
    console.log('Current version:', version);

    // Set localStorage to indicate we've seen this version
    await page.addInitScript((ver) => {
      localStorage.setItem('cribbage_release_notes_seen', ver);
    }, version);

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Modal should NOT be visible
    const modal = page.locator('text="What\'s New!"').or(page.locator('text="New Version Available!"'));
    await expect(modal).not.toBeVisible();

    await page.screenshot({ path: 'test-bin/screenshots/version-modal-already-seen.png' });
  });

  test('should show modal when localStorage has OLD version', async ({ page }) => {
    // Set localStorage to an old version
    await page.addInitScript(() => {
      localStorage.setItem('cribbage_release_notes_seen', 'v0.1.0-b50');
    });

    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Version check') || text.includes('modal')) {
        consoleLogs.push(text);
      }
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    console.log('Console logs:', consoleLogs);

    // Should show "What's New" since versions match but localStorage differs
    const modal = page.locator('text="What\'s New!"');
    await page.screenshot({ path: 'test-bin/screenshots/version-modal-old-localStorage.png' });

    await expect(modal).toBeVisible({ timeout: 5000 });
  });

  test('should capture version check console output', async ({ page }) => {
    // Clear localStorage
    await page.addInitScript(() => {
      localStorage.clear();
    });

    const allLogs = [];
    page.on('console', msg => {
      allLogs.push({ type: msg.type(), text: msg.text() });
    });

    await page.goto('/');
    await page.waitForTimeout(3000);

    // Find version-related logs
    const versionLogs = allLogs.filter(log =>
      log.text.includes('Version') ||
      log.text.includes('version') ||
      log.text.includes('modal')
    );

    console.log('\n=== All Console Logs ===');
    allLogs.forEach(log => console.log(`[${log.type}] ${log.text}`));

    console.log('\n=== Version-Related Logs ===');
    versionLogs.forEach(log => console.log(`[${log.type}] ${log.text}`));

    // This test always passes - it's for debugging
    expect(true).toBeTruthy();
  });

  test('should verify APP_VERSION matches server version', async ({ page }) => {
    // Get server version
    const versionResponse = await page.request.get('/api/version');
    const { version: serverVersion } = await versionResponse.json();

    // Get client version by evaluating it in the page
    await page.goto('/');
    await page.waitForTimeout(1000);

    // Extract version from the page (it's shown in bottom left)
    const versionText = await page.locator('text=/v\\d+\\.\\d+\\.\\d+-b\\d+/').first().textContent();

    console.log('Server version:', serverVersion);
    console.log('Client version displayed:', versionText);

    // They should match after a fresh page load
    expect(versionText).toContain(serverVersion);
  });
});

test.describe('Version Modal Interaction', () => {
  test('clicking "Got It!" should dismiss modal and set localStorage', async ({ page }) => {
    // Clear localStorage
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/');

    // Wait for modal
    const modal = page.locator('text="What\'s New!"');
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Click "Got It!"
    await page.click('button:has-text("Got It!")');

    // Modal should disappear
    await expect(modal).not.toBeVisible();

    // Check localStorage was set
    const storedVersion = await page.evaluate(() => {
      return localStorage.getItem('cribbage_release_notes_seen');
    });

    console.log('Stored version after dismissing:', storedVersion);
    expect(storedVersion).toBeDefined();
    expect(storedVersion).toMatch(/^v\d+\.\d+\.\d+-b\d+$/);
  });

  test('modal should have "Later" and "Upgrade Now" for version mismatch', async ({ page }) => {
    // This test simulates a version mismatch scenario
    // We intercept the API to return a different version

    await page.route('/api/version', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          version: 'v0.1.0-b999',
          releaseNote: 'Test release note for upgrade'
        })
      });
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Should show "New Version Available" with Later/Upgrade buttons
    const newVersionModal = page.locator('text="New Version Available!"');

    await page.screenshot({ path: 'test-bin/screenshots/version-mismatch-modal.png' });

    await expect(newVersionModal).toBeVisible({ timeout: 5000 });

    // Verify buttons exist
    await expect(page.locator('button:has-text("Later")')).toBeVisible();
    await expect(page.locator('button:has-text("Upgrade Now")')).toBeVisible();
  });
});

test.describe('Debug: Trace Version Check Flow', () => {
  test('full trace of version check with fresh localStorage', async ({ page }) => {
    const events = [];

    // Intercept fetch to /api/version
    await page.route('/api/version', async route => {
      events.push({ event: 'API_REQUEST', time: Date.now() });
      await route.continue();
    });

    // Listen for console
    page.on('console', msg => {
      events.push({ event: 'CONSOLE', type: msg.type(), text: msg.text(), time: Date.now() });
    });

    // Clear localStorage
    await page.addInitScript(() => {
      localStorage.clear();
      console.log('localStorage cleared');
    });

    events.push({ event: 'NAVIGATION_START', time: Date.now() });
    await page.goto('/');
    events.push({ event: 'NAVIGATION_COMPLETE', time: Date.now() });

    await page.waitForTimeout(3000);
    events.push({ event: 'WAIT_COMPLETE', time: Date.now() });

    // Check modal state
    const whatsNewVisible = await page.locator('text="What\'s New!"').isVisible();
    const newVersionVisible = await page.locator('text="New Version Available!"').isVisible();

    events.push({
      event: 'MODAL_CHECK',
      whatsNewVisible,
      newVersionVisible,
      time: Date.now()
    });

    console.log('\n=== Event Timeline ===');
    const startTime = events[0]?.time || 0;
    events.forEach(e => {
      const elapsed = e.time - startTime;
      console.log(`+${elapsed}ms:`, JSON.stringify(e));
    });

    // Take final screenshot
    await page.screenshot({ path: 'test-bin/screenshots/version-check-trace.png' });

    // At least one modal should be visible with fresh localStorage
    expect(whatsNewVisible || newVersionVisible).toBeTruthy();
  });
});
