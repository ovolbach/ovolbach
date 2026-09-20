import { expect, test } from '@playwright/test';
import candidates from '../../src/data/elections/2026/zilinsky-kraj/candidates.json' with { type: 'json' };

const base = '/liptovsky-mikulas/2026/';

test('home exposes canonical, social tags and page-appropriate JSON-LD in static HTML', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://ovolbach.sk/');
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://ovolbach.sk/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', 'https://ovolbach.sk/og-default.png');
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
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
  const nodes = JSON.parse(graph!)['@graph'] as { '@type': string; '@id'?: string; url?: string; name?: string; about?: { '@id': string } }[];
  expect(nodes.map((node) => node['@type'])).not.toContain('ProfilePage');
  const personId = `https://ovolbach.sk${base}kandidat/${candidate.slug}/#person`;
  expect(nodes.find((node) => node['@type'] === 'WebPage')?.about).toEqual({ '@id': personId });
  expect(nodes.find((node) => node['@type'] === 'Person')).toMatchObject({
    '@id': personId, url: `https://ovolbach.sk${base}kandidat/${candidate.slug}/`, name: candidate.displayName,
  });
});

test('candidate titles and descriptions identify the sourced candidacy', async ({ page }) => {
  for (const [slug, election, district] of [
    ['jan-blchac', 'voľby primátora mesta', false],
    ['peter-hrabcak', 'voľby do mestského zastupiteľstva', true],
    ['rudolf-urbanovic-ing', 'voľby do mestského zastupiteľstva', true],
    ['rudolf-urbanovic-ma', 'voľby do mestského zastupiteľstva', true],
  ] as const) {
    await page.goto(`${base}kandidat/${slug}/`);
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toContain(election);
    expect(description!.includes('volebný obvod č.')).toBe(district);
    expect(description!.length).toBeLessThanOrEqual(165);
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute('content', description!);
    await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute('content', description!);
  }
  await page.goto(`${base}kandidat/jan-blchac/`);
  await expect(page).toHaveTitle('Ján BLCHÁČ | Liptovský Mikuláš 2026');
  await page.goto(`${base}kandidat/rudolf-urbanovic-ing/`);
  await expect(page).toHaveTitle('Rudolf URBANOVIČ, Ing. | Liptovský Mikuláš 2026');
});

test('source groups and comparison tool have appropriate headings and indexing', async ({ page }) => {
  await page.goto(`${base}zdroje/`);
  await expect(page.getByRole('main').locator('h2')).toHaveCount(3);
  await expect(page.locator('[data-source-register] h2')).toHaveCount(0);
  await expect(page.locator('[data-source-register] h3').first()).toBeVisible();

  await page.goto(`${base}porovnat/`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
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
