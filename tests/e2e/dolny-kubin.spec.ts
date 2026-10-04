import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loadElectionContext } from '../../src/lib/load-guide-data';
import { candidateProfilePath } from '../../src/lib/regional-context';

const BASE = '/dolny-kubin/2026/';

test('the Dolný Kubín guide exposes the official ballots and local district limits', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Dolný Kubín.*2026/ }).click();
  await expect(page).toHaveURL(/\/dolny-kubin\/2026\/$/);
  await page.goto(`${BASE}?obvod=district-2`);
  await expect(page.locator('[data-district="2026-dk-city-2"]')).toBeVisible();
  await expect(page.locator('[data-district="2026-dk-city-2"] [data-ballot-id="city-council"] [data-ballot-limit]'))
    .toContainText('Najviac označených kandidátov: 6.');
  await expect(page.locator('[data-ballot-id="region-council"] [data-ballot-limit]')).toContainText('Najviac označených kandidátov: 3.');
  await page.goto(`${BASE}kandidati/`);
  for (const [kind, count] of [['mayor', 5], ['city-council', 42], ['region-council', 20], ['region-chair', 7]] as const) {
    await expect(page.locator(`[data-catalogue-election="${kind}"] [data-candidate-card]`)).toHaveCount(count);
  }
});

test('every Dolný Kubín profile renders all cited claims and its financing evidence', async ({ page }) => {
  test.setTimeout(90_000);
  const context = await loadElectionContext({ citySlug: 'dolny-kubin', year: 2026 });
  const { data } = context;
  const sources = new Map(data.sources.map((source) => [source.id, source.url]));
  for (const candidate of data.candidates) {
    const response = await page.goto(candidateProfilePath(context, candidate.id));
    expect(response?.status(), candidate.slug).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(candidate.displayName);
    await expect(page.locator('[data-campaign-finance]')).toHaveCount(1);
    const rendered = await page.locator('[data-claim]').evaluateAll((elements) => elements.map((element) => ({
      id: element.querySelector('[data-sourced-text]')?.getAttribute('data-sourced-text'),
      sources: [...element.querySelectorAll('[data-source-attribution] a')].map((link) => link.getAttribute('href')),
    })));
    for (const claim of data.claims.filter((claim) => claim.candidateId === candidate.id)) {
      expect(rendered.find((item) => item.id === claim.id)?.sources, claim.id).toEqual(claim.sourceIds.map((id) => sources.get(id)));
    }
  }
});

test('namesakes resolve to distinct profiles and three candidacies retain one verified identity', async ({ page }) => {
  await page.goto(`${BASE}kandidat/martin-stanovsky-30/`);
  await expect(page.locator('[data-candidacy]')).toHaveCount(2);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('MSc');
  await page.goto(`${BASE}kandidat/martin-stanovsky-53/`);
  await expect(page.locator('[data-candidacy]')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Martin STANOVSKÝ');
  await page.goto(`${BASE}kandidat/katarina-brunckova/`);
  await expect(page.locator('[data-candidacy]')).toHaveCount(3);
  await expect(page.locator('[data-finance-report-duty]')).toHaveAttribute('data-finance-report-duty', 'required');
});

test('the new public pages pass serious accessibility checks', async ({ page }) => {
  for (const route of ['', 'kandidati/', 'kandidat/katarina-brunckova/', 'zdroje/', 'ako-volit/']) {
    await page.goto(`${BASE}${route}`);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((issue) => issue.impact === 'serious' || issue.impact === 'critical'), route).toEqual([]);
  }
});
