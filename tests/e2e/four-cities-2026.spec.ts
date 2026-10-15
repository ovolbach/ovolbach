import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import type rosterShape from '../fixtures/four-cities-2026-rosters.json';

const rosters = JSON.parse(readFileSync(new URL('../fixtures/four-cities-2026-rosters.json', import.meta.url), 'utf8')) as typeof rosterShape;

const cities = [
  ['trnava', 'trnavsky-kraj'], ['trencin', 'trenciansky-kraj'],
  ['nitra', 'nitriansky-kraj'], ['banska-bystrica', 'banskobystricky-kraj'],
] as const;

for (const [city, region] of cities) {
  const base = `/${city}/2026/`;
  const regionalBase = `/${region}/2026/`;
  const fixture = rosters[city];
  const chairRows = fixture.rows.filter((row) => row.electionId === 'region-chair');
  const firstChair = chairRows[0];
  const secondChair = chairRows[1];
  if (!firstChair || !secondChair) throw new Error(`Missing chair comparison fixture for ${city}`);

  test(`${city} exposes every municipal district and the complete regional district`, async ({ page }) => {
    expect((await page.goto(`${base}kandidati/?volby=mayor`))?.status()).toBe(200);
    await expect(page.locator('[data-candidate-card]:visible')).toHaveCount(fixture.rows.filter((row) => row.electionId === 'mayor').length);
    await page.getByLabel('Voľby', { exact: true }).selectOption('city-council');
    for (const district of fixture.districts.filter((row) => row.kind === 'city')) {
      await page.getByLabel('Volebný obvod', { exact: true }).selectOption(`district-${district.number}`);
      const count = fixture.rows.filter((row) => row.electionId === 'city-council' && row.districtNumber === district.number).length;
      await expect(page.locator('[data-candidate-card]:visible')).toHaveCount(count);
      await expect(page.locator('[data-candidate-card]:visible [data-ballot-number]')).toHaveText(Array.from({ length: count }, (_, i) => String(i + 1)));
    }
    await page.getByLabel('Voľby', { exact: true }).selectOption('region-council');
    await expect(page.locator('[data-candidate-card]:visible')).toHaveCount(fixture.rows.filter((row) => row.electionId === 'region-council').length);
    await page.getByLabel('Voľby', { exact: true }).selectOption('region-chair');
    await expect(page.locator('[data-candidate-card]:visible')).toHaveCount(chairRows.length);
    for (const card of await page.locator('[data-candidate-card]:visible').all()) {
      await expect(card.locator('h3 a')).toHaveAttribute('href', new RegExp(`^${regionalBase}kandidat/`));
    }
  });

  test(`${city} voting instructions and shared chair profile work without JavaScript`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, baseURL: baseURL! });
    try {
      const page = await context.newPage();
      expect((await page.goto(`${base}ako-volit/`))?.status()).toBe(200);
      await expect(page.locator('[data-guide-ballot]')).toHaveCount(4);
      expect(await page.locator('[data-polling-station]').count()).toBeGreaterThan(0);
      await page.goto(regionalBase);
      await expect(page.locator('#kandidati [data-candidate-card]')).toHaveCount(chairRows.length);
      await page.locator('#kandidati [data-candidate-card] h3 a').first().click();
      expect(new URL(page.url()).pathname).toMatch(new RegExp(`^${regionalBase}kandidat/`));
      await expect(page.locator('[data-candidacy]')).toHaveCount(fixture.rows.filter((row) => row.candidateId === firstChair.candidateId).length);
      await expect(page.locator('html')).toHaveAttribute('lang', 'sk');
      expect(await context.cookies()).toEqual([]);
    } finally { await context.close(); }
  });

  test(`${city} comparison, search and mobile voting guide stay within its cycle`, async ({ page }) => {
    await page.goto(`${regionalBase}porovnat/?kandidat=${firstChair.candidateId}&kandidat=${secondChair.candidateId}`);
    await expect(page.locator('[data-comparison-column]')).toHaveCount(2);
    await expect(page.locator('[data-comparison-table] [data-comparison-row]')).toHaveCount(8);
    await page.goto(`${regionalBase}porovnat/?kandidat=${firstChair.candidateId}&kandidat=candidate-85`);
    await expect(page.getByRole('status')).toContainText('neplatný');
    await page.goto(base);
    await page.getByRole('searchbox').fill(firstChair.displayNameOfficial);
    await expect(page.locator(`[data-search-results] a[href^="${regionalBase}kandidat/"]`)).toHaveCount(1);
    await page.goto(`${base}ako-volit/`);
    const result = await new AxeBuilder({ page }).analyze();
    expect(result.violations.filter((row) => ['serious', 'critical'].includes(row.impact ?? ''))).toEqual([]);
  });
}
