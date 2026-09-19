import { expect, test } from '@playwright/test';
import candidates from '../../src/data/elections/2026/zilinsky-kraj/candidates.json' with { type: 'json' };

const base = '/liptovsky-mikulas/2026/';

test('home exposes canonical, social tags and page-appropriate JSON-LD in static HTML', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://ovolbach.sk/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://ovolbach.sk/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://ovolbach.sk/og-default.png');
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute('content', 'summary_large_image');
  const graph = await page.locator('script[type="application/ld+json"]').textContent();
  expect(graph).not.toBeNull();
  const nodes = JSON.parse(graph!)['@graph'] as { '@type': string }[];
  expect(nodes.map((node) => node['@type'])).toContain('WebSite');
  expect(nodes.map((node) => node['@type'])).toContain('CollectionPage');
});

test('candidate profile has a visible breadcrumb and no unsupported ProfilePage schema', async ({ page }) => {
  const candidate = candidates[0]!;
  await page.goto(`${base}kandidat/${candidate.slug}/?kandidat=${candidate.id}`);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://ovolbach.sk${base}kandidat/${candidate.slug}/`);
  const catalogueLink = page.getByRole('navigation', { name: 'Navigácia v štruktúre webu' }).getByRole('link', { name: 'Kandidáti' });
  expect(new URL((await catalogueLink.getAttribute('href'))!, 'https://ovolbach.sk').pathname).toBe(`${base}kandidati/`);
  const graph = await page.locator('script[type="application/ld+json"]').textContent();
  const nodes = JSON.parse(graph!)['@graph'] as { '@type': string; about?: { '@type': string; name: string } }[];
  expect(nodes.map((node) => node['@type'])).not.toContain('ProfilePage');
  expect(nodes.find((node) => node['@type'] === 'WebPage')?.about).toEqual({ '@type': 'Person', name: candidate.displayName });
});

test('key election content and profile links remain available without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(base);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Voľby Liptovský Mikuláš 2026');
  await expect(page.locator('[data-candidate-card] a[href*="/kandidat/"]').first()).toBeVisible();
  await page.goto(`${base}kandidat/${candidates[0]!.slug}/`);
  await expect(page.locator('[data-candidacy]')).toHaveCount(3);
  await context.close();
});

test('missing route has a custom non-indexable page and real 404 status', async ({ page }) => {
  const response = await page.goto(`${base}kandidat/neexistujuci-kandidat/`);
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Stránka sa nenašla');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('.legal-notice')).toBeVisible();
});
