import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const routes = ['/', '/kandidati/', '/ako-volit/', '/metodika/', '/zdroje/'];
const LEGAL_NOTICE = 'Tento web nikoho nevyzýva, aby volil alebo nevolil konkrétneho kandidáta, politickú stranu alebo koalíciu.';

test('public routes create no client persistence, request no external origin, and have no serious axe findings', async ({ page, context }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  for (const path of routes) {
    await page.goto(path);
    expect(await context.cookies(), path).toEqual([]);
    await expect(page.evaluate(async () => ({
      local: localStorage.length,
      session: sessionStorage.length,
      databases: 'databases' in indexedDB ? await indexedDB.databases() : [],
      registrations: await navigator.serviceWorker.getRegistrations(),
      caches: await caches.keys(),
    })), path).resolves.toEqual({ local: 0, session: 0, databases: [], registrations: [], caches: [] });
    await expect(page.getByRole('contentinfo'), path).toContainText(LEGAL_NOTICE);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((item) => ['serious', 'critical'].includes(item.impact ?? '')), path).toEqual([]);
  }

  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4321')).toBe(true);
});

test('search is keyboard usable, loads only on focus, and returns candidate and source terms', async ({ page }) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  const input = page.getByRole('searchbox', { name: 'Hľadať na ovolbach.sk' });
  await expect(page.locator('script[src="/pagefind/pagefind.js"]')).toHaveCount(0);
  await input.focus();
  await expect(input).toBeFocused();
  await input.fill('Milan POVA');
  await expect(page.locator('[data-search-status]')).toContainText('Výsledky hľadania');
  await expect(page.getByRole('link', { name: /Milan POVA/i }).first()).toHaveAttribute('href', /\/kandidat\/milan-pova-ing\//);
  await input.fill('Dátum vydania');
  const sourceResult = page.locator('[data-search-results] a[href^="/zdroje/"]').first();
  await expect(sourceResult).toBeVisible();
  expect(await page.locator('[data-search-results] a').evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href)).every((url) =>
    url.origin === window.location.origin && url.protocol === 'http:' && url.pathname.startsWith('/'),
  ))).toBe(true);
  await page.keyboard.press('Tab');
  await expect(sourceResult).toBeFocused();
  await input.fill('GDPR');
  await expect(page.locator('[data-search-results] a')).toHaveCount(1);
  await expect(page.locator('[data-search-results] a')).toHaveAttribute('href', /\/metodika\//);
  // Exact matching tests footer exclusion without fuzzy matches to source names such as Blog N.
  await input.fill('"nevyzýva"');
  await expect(page.locator('[data-search-status]')).toHaveText('Výsledky hľadania: 0.');
  expect(errors).toEqual([]);
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4321')).toBe(true);
});

test('generated internal links resolve to current static routes', async ({ page }) => {
  const paths = new Set<string>();
  for (const route of [...routes, '/porovnat/']) {
    await page.goto(route);
    for (const href of await page.locator('a[href]').evaluateAll((links) => links.map((link) => link.getAttribute('href')))) {
      if (!href || href.startsWith('#') || href.startsWith('mailto:')) continue;
      const url = new URL(href, page.url());
      if (url.origin === 'http://127.0.0.1:4321') paths.add(`${url.pathname}${url.search}`);
    }
  }

  for (const path of paths) {
    const response = await page.request.get(path);
    expect(response.status(), path).toBe(200);
  }
});
