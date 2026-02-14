// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

/**
 * SEO Audit Tests
 *
 * Inspects what a search engine actually sees when crawling the site.
 * Runs in three modes: JS-enabled, JS-disabled, and mobile emulation.
 *
 * Saves rendered HTML snapshots and screenshots to test-bin/seo-audit-results/
 */

const RESULTS_DIR = path.join(__dirname, 'seo-audit-results');

// Ensure results directory exists
test.beforeAll(async () => {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
});

/**
 * Extract all SEO-relevant metadata from a page
 */
async function extractSeoData(page, response) {
  const status = response ? response.status() : null;
  const url = page.url();
  const headers = response ? response.headers() : {};

  const seo = await page.evaluate(() => {
    const getMeta = (name) => {
      const el = document.querySelector(`meta[name="${name}"]`) ||
                 document.querySelector(`meta[property="${name}"]`);
      return el ? el.getAttribute('content') : null;
    };

    const canonical = document.querySelector('link[rel="canonical"]');
    const bodyText = document.body ? document.body.innerText.trim() : '';

    return {
      title: document.title || null,
      description: getMeta('description'),
      robots: getMeta('robots'),
      ogTitle: getMeta('og:title'),
      ogDescription: getMeta('og:description'),
      ogImage: getMeta('og:image'),
      ogType: getMeta('og:type'),
      canonical: canonical ? canonical.getAttribute('href') : null,
      lang: document.documentElement.getAttribute('lang'),
      visibleTextLength: bodyText.length,
      visibleTextExcerpt: bodyText.substring(0, 500),
      h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
      linkCount: document.querySelectorAll('a[href]').length,
    };
  });

  return {
    url,
    status,
    xRobotsTag: headers['x-robots-tag'] || null,
    ...seo,
  };
}

/**
 * Save audit artifacts (HTML snapshot + screenshot)
 */
async function saveArtifacts(page, label) {
  const html = await page.content();
  fs.writeFileSync(path.join(RESULTS_DIR, `${label}.html`), html);
  await page.screenshot({
    path: path.join(RESULTS_DIR, `${label}.png`),
    fullPage: true,
  });
}

/**
 * Log audit results to console for visibility
 */
function logResults(label, data) {
  console.log(`\n=== SEO AUDIT: ${label} ===`);
  console.log(`  URL:           ${data.url}`);
  console.log(`  Status:        ${data.status}`);
  console.log(`  Title:         ${data.title}`);
  console.log(`  Description:   ${data.description}`);
  console.log(`  Robots:        ${data.robots || '(none)'}`);
  console.log(`  X-Robots-Tag:  ${data.xRobotsTag || '(none)'}`);
  console.log(`  Canonical:     ${data.canonical || '(none)'}`);
  console.log(`  Lang:          ${data.lang}`);
  console.log(`  OG Title:      ${data.ogTitle || '(none)'}`);
  console.log(`  OG Desc:       ${data.ogDescription || '(none)'}`);
  console.log(`  OG Image:      ${data.ogImage || '(none)'}`);
  console.log(`  H1 tags:       ${JSON.stringify(data.h1)}`);
  console.log(`  Link count:    ${data.linkCount}`);
  console.log(`  Visible text:  ${data.visibleTextLength} chars`);
  console.log(`  Text excerpt:  ${data.visibleTextExcerpt.substring(0, 200)}...`);
  console.log('===\n');
}

/**
 * Common assertions that apply to all render modes
 */
function assertBasicSeo(data, label) {
  // HTTP 200
  expect(data.status, `[${label}] Expected HTTP 200`).toBe(200);

  // Title must exist and not be generic
  expect(data.title, `[${label}] Title is missing`).toBeTruthy();
  const genericTitles = ['next.js', 'react app', 'untitled', 'document', 'home'];
  const titleLower = (data.title || '').toLowerCase();
  for (const generic of genericTitles) {
    expect(titleLower, `[${label}] Title is too generic: "${data.title}"`).not.toBe(generic);
  }
  expect(data.title.length, `[${label}] Title too short`).toBeGreaterThanOrEqual(10);

  // Meta description must exist and be substantive
  expect(data.description, `[${label}] Meta description is missing`).toBeTruthy();
  expect(data.description.length, `[${label}] Meta description too short`).toBeGreaterThanOrEqual(50);

  // Robots must not block indexing
  if (data.robots) {
    const robotsLower = data.robots.toLowerCase();
    expect(robotsLower, `[${label}] robots meta blocks indexing`).not.toContain('noindex');
  }
  if (data.xRobotsTag) {
    const xRobotsLower = data.xRobotsTag.toLowerCase();
    expect(xRobotsLower, `[${label}] X-Robots-Tag blocks indexing`).not.toContain('noindex');
  }

  // Visible text must not be empty
  expect(data.visibleTextLength, `[${label}] Page has no visible text`).toBeGreaterThan(50);
}

// ─── Mode A: Normal JS-enabled render ─────────────────────────────────────────

test.describe('SEO Audit - JS Enabled', () => {
  test('login page has proper SEO metadata', async ({ page }) => {
    const response = await page.goto('/login', { waitUntil: 'networkidle' });
    const data = await extractSeoData(page, response);
    logResults('JS-Enabled /login', data);
    await saveArtifacts(page, 'js-enabled-login');

    assertBasicSeo(data, 'JS-Enabled /login');
    expect(data.lang, 'html lang attribute should be set').toBeTruthy();
  });

  test('homepage redirects to login (auth-gated)', async ({ page }) => {
    const response = await page.goto('/', { waitUntil: 'networkidle' });
    const data = await extractSeoData(page, response);
    logResults('JS-Enabled / (homepage)', data);
    await saveArtifacts(page, 'js-enabled-homepage');

    // Homepage is auth-gated, so we expect redirect to login
    expect(data.url).toContain('/login');
    assertBasicSeo(data, 'JS-Enabled /');
  });

  test('robots.txt is accessible and allows crawling', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.ok(), 'robots.txt should return 200').toBeTruthy();

    const body = await response.text();
    console.log('\n=== robots.txt ===\n' + body + '\n===\n');

    // Should not disallow everything
    expect(body.toLowerCase()).not.toContain('disallow: /\n');
    // Should reference sitemap
    expect(body.toLowerCase()).toContain('sitemap');
  });

  test('sitemap.xml is accessible and valid', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.ok(), 'sitemap.xml should return 200').toBeTruthy();

    const body = await response.text();
    console.log('\n=== sitemap.xml ===\n' + body + '\n===\n');

    expect(body).toContain('<?xml');
    expect(body).toContain('<urlset');
    expect(body).toContain('cribbage.chrisk.com');
  });
});

// ─── Mode B: JS-disabled render ───────────────────────────────────────────────

test.describe('SEO Audit - JS Disabled', () => {
  test.use({ javaScriptEnabled: false });

  test('login page renders meaningful content without JS', async ({ page }) => {
    const response = await page.goto('/login', { waitUntil: 'networkidle' });
    const data = await extractSeoData(page, response);
    logResults('JS-Disabled /login', data);
    await saveArtifacts(page, 'js-disabled-login');

    // Status and metadata should still work (SSR)
    expect(data.status, 'Should return HTTP 200 without JS').toBe(200);
    expect(data.title, 'Title should exist without JS').toBeTruthy();
    expect(data.title.length, 'Title should be substantive without JS').toBeGreaterThanOrEqual(10);
    expect(data.description, 'Description should exist without JS').toBeTruthy();

    // Next.js SSR should provide some content even without JS
    // but client components may not render fully
    console.log(`  [JS-Disabled] Visible text: ${data.visibleTextLength} chars`);
  });
});

// ─── Mode C: Mobile viewport + UA emulation ───────────────────────────────────

test.describe('SEO Audit - Mobile', () => {
  test.use({
    viewport: { width: 412, height: 915 },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  });

  test('login page renders correctly on mobile', async ({ page }) => {
    const response = await page.goto('/login', { waitUntil: 'networkidle' });
    const data = await extractSeoData(page, response);
    logResults('Mobile /login', data);
    await saveArtifacts(page, 'mobile-login');

    assertBasicSeo(data, 'Mobile /login');

    // Check viewport meta tag exists
    const viewportMeta = await page.evaluate(() => {
      const el = document.querySelector('meta[name="viewport"]');
      return el ? el.getAttribute('content') : null;
    });
    expect(viewportMeta, 'viewport meta tag should exist').toBeTruthy();
    console.log(`  Viewport meta: ${viewportMeta}`);
  });
});
