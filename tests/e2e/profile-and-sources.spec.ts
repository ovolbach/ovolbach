import { expect, test } from '@playwright/test';
import candidates from '../../src/data/elections/2026/zilinsky-kraj/candidates.json' with { type: 'json' };
import claims from '../../src/data/elections/2026/zilinsky-kraj/claims.json' with { type: 'json' };
import researchCoverage from '../../src/data/elections/2026/zilinsky-kraj/research-coverage.json' with { type: 'json' };
import sources from '../../src/data/sources.json' with { type: 'json' };
import { isSafeOutboundSourceUrl } from '../../src/lib/source-url';

const JAN_BLCHAC = 'jan-blchac';
const PETER_BONKO = 'peter-bonko';
const BASE = '/liptovsky-mikulas/2026/';
const COMPLETE_SEARCHED_NONE_CANDIDATE = candidates.find((candidate) => candidate.id === 'candidate-71')?.slug;

if (!COMPLETE_SEARCHED_NONE_CANDIDATE) throw new Error('Expected candidate-71 in production data');

test('every displayed claim exposes its source next to the text', async ({ page }) => {
  await page.goto(`${BASE}kandidat/${JAN_BLCHAC}/`);
  const sourcedTexts = page.locator('[data-claim] [data-sourced-text]');
  for (let index = 0; index < await sourcedTexts.count(); index += 1) {
    const sourcedText = sourcedTexts.nth(index);
    const claimId = await sourcedText.getAttribute('data-sourced-text');
    const claim = claims.find((item) => item.id === claimId);
    expect(claim, `Rendered claim ${claimId ?? '<missing id>'} must exist in data`).toBeDefined();

    const claimElement = sourcedText.locator('xpath=ancestor::*[@data-claim][1]');
    const sourceLinks = claimElement.locator('[data-source-attribution] a');
    await expect(sourceLinks).toHaveCount(claim!.sourceIds.length);

    for (let sourceIndex = 0; sourceIndex < claim!.sourceIds.length; sourceIndex += 1) {
      const sourceLink = sourceLinks.nth(sourceIndex);
      await expect(sourceLink).toBeVisible();
      const href = await sourceLink.getAttribute('href');
      expect(href, `${claimId} source ${sourceIndex + 1}`).not.toBeNull();
      expect(new URL(href!).protocol).toBe('https:');
      expect(isSafeOutboundSourceUrl(href!)).toBe(true);
    }
  }
});

test('release data has no pending research and complete profiles use the searched-none sentence', async ({ page }) => {
  expect(researchCoverage.every((row) => row.status !== 'pending')).toBe(true);
  await page.goto(`${BASE}kandidat/${COMPLETE_SEARCHED_NONE_CANDIDATE}/`);
  await expect(page.getByText('Vo verejne dostupných zdrojoch sa údaj nenašiel.', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Údaje sa overujú.')).toHaveCount(0);
});

test('single- and multi-ballot profiles expose official sourced candidacies', async ({ page }) => {
  await page.goto(`${BASE}kandidat/${PETER_BONKO}/`);
  await expect(page.getByRole('heading', { name: 'Peter BONKO, Bc.' })).toBeVisible();
  await expect(page.locator('[data-candidacy]')).toHaveCount(1);

  await page.goto(`${BASE}kandidat/${JAN_BLCHAC}/`);
  await expect(page.locator('[data-candidacy]')).toHaveCount(3);
  await expect(page.locator('[data-candidacy]').evaluateAll((items) => items.map((item) => ({
    election: item.getAttribute('data-election-id'),
    ballotNumber: item.getAttribute('data-ballot-number'),
  })))).resolves.toEqual([
    { election: 'mayor', ballotNumber: '1' },
    { election: 'city-council', ballotNumber: '1' },
    { election: 'region-council', ballotNumber: '1' },
  ]);
  await expect(page.locator('[data-candidacy]').getByRole('link', { name: 'Zdroj' }).first()).toBeVisible();
});

test('profile summarizes election participation and elected offices since 2000', async ({ page }) => {
  await page.goto(`${BASE}kandidat/${JAN_BLCHAC}/`);
  const history = page.locator('.election-history');

  await expect(history.getByRole('heading', { name: 'Volebná história od roku 2000' })).toBeVisible();
  await expect(history).toContainText('Účasti vo voľbách14');
  await expect(history).toContainText('Zvolenia spolu13');
  await expect(history).toContainText('Zvolenia za poslanca9');
  await expect(history).toContainText('Zvolenia za starostu alebo primátora4');
  await expect(history.locator('[data-source-attribution] a').first()).toHaveAttribute('href', /^https:/);
  await expect(history.locator('[data-source-attribution]').first()).toContainText('overené');
});

test('all canonical candidate profile links resolve', async ({ page }) => {
  expect(candidates).toHaveLength(91);
  expect(new Set(candidates.map((candidate) => candidate.slug)).size).toBe(91);
  expect(new Set(candidates.map((candidate) => `${BASE}kandidat/${candidate.slug}/`)).size).toBe(91);
  for (const candidate of candidates) {
    const response = await page.goto(`${BASE}kandidat/${candidate.slug}/`);
    expect(response?.status(), candidate.slug).toBe(200);
  }
});

test('source register retains outbound metadata and profile source attribution', async ({ page }) => {
  await page.goto('/zdroje/');
  await expect(page.getByRole('heading', { name: 'Zdroje' })).toBeVisible();
  const source = page.locator('[data-source-register]').first();
  await expect(source).toContainText('Vydavateľ:');
  await expect(source).toContainText('Overené:');
  await expect(source.getByRole('link', { name: 'Zdroj' })).toHaveAttribute('href', /^https:/);
  const sourceUrls = await page.locator('[data-source-register] a[href]').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  );
  expect(sourceUrls).toHaveLength(sources.length);
  expect(new Set(sourceUrls).size).toBe(sourceUrls.length);
  expect([...sourceUrls].sort()).toEqual(sources.map((source) => source.url).sort());
  expect(sourceUrls.every((url) => url !== null && isSafeOutboundSourceUrl(url))).toBe(true);

  await page.goto(`${BASE}kandidat/${JAN_BLCHAC}/`);
  await expect(page.locator('[data-source-attribution]').first().getByRole('link', { name: 'Zdroj' })).toHaveAttribute('href', /^https:/);
});

test('unknown candidate slug returns a 404 page', async ({ page }) => {
  const response = await page.goto(`${BASE}kandidat/neexistujuci-kandidat/`);
  expect(response?.status()).toBe(404);
});
