import { expect, test } from '@playwright/test';

test('catalogue links to the published city and year', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mestá a roky');
  await page.getByRole('link', { name: /Liptovský Mikuláš.*2026/ }).click();
  await expect(page).toHaveURL(/\/liptovsky-mikulas\/2026\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Liptovský Mikuláš');
});

test('city pages keep navigation, comparison and profiles within their own context', async ({ page }) => {
  await page.goto('/liptovsky-mikulas/2026/?obvod=district-4');
  await expect(page.locator('[data-district="2026-lm-city-4"]')).toBeVisible();
  await page.getByRole('link', { name: 'Kandidáti', exact: true }).click();
  await expect(page).toHaveURL(/\/liptovsky-mikulas\/2026\/kandidati\/$/);
  await page.getByLabel('Voľby', { exact: true }).selectOption('mayor');
  await expect(page.locator('[data-candidate-card]:visible').first().getByRole('link').first())
    .toHaveAttribute('href', /\/liptovsky-mikulas\/2026\/kandidat\//);
});

test('obsolete catalogue URL is absent or redirects to the published city', async ({ page }) => {
  const response = await page.goto('/kandidati/');
  const redirectedFrom = response?.request().redirectedFrom();

  if (!redirectedFrom) {
    expect(response?.status()).toBe(404);
    return;
  }

  expect(redirectedFrom.url()).toMatch(/\/kandidati\/$/);
  expect((await redirectedFrom.response())?.status()).toBe(301);
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/liptovsky-mikulas\/2026\/kandidati\/$/);
});

test('city navigation opens its own source register', async ({ page }) => {
  await page.goto('/liptovsky-mikulas/2026/');
  await page.getByRole('navigation', { name: 'Hlavná navigácia' }).getByRole('link', { name: 'Zdroje' }).click();
  await expect(page).toHaveURL(/\/liptovsky-mikulas\/2026\/zdroje\/$/);
});

test('home and catalogue show council limits from each ballot district', async ({ page }) => {
  await page.goto('/liptovsky-mikulas/2026/?obvod=district-4');
  const cityBallot = page.locator('[data-district="2026-lm-city-4"] [data-ballot-id="city-council"] [data-ballot-limit]');
  const regionBallot = page.locator('[data-ballot-id="region-council"] [data-ballot-limit]');
  await expect(regionBallot).toHaveCount(1);
  await expect(cityBallot).toContainText('Najviac označených kandidátov: 1.');
  await expect(regionBallot).toContainText('Najviac označených kandidátov: 6.');

  await page.goto('/liptovsky-mikulas/2026/kandidati/');
  await expect(page.locator('[data-catalogue-election="region-council"] [data-ballot-limit]'))
    .toContainText('Najviac označených kandidátov: 6.');
});

test('search is global in the catalogue and city/year-scoped inside a guide', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('searchbox').fill('Milan POVA');
  await expect(page.locator('[data-search-results] li').first()).toContainText('Liptovský Mikuláš · 2026');
  await page.goto('/liptovsky-mikulas/2026/');
  await page.getByRole('searchbox').fill('Dátum vydania');
  await expect(page.locator('[data-search-results] a').first()).toBeVisible();
  const paths = await page.locator('[data-search-results] a').evaluateAll((links) =>
    links.map((link) => new URL((link as HTMLAnchorElement).href).pathname),
  );
  expect(paths.every((path) => path.startsWith('/liptovsky-mikulas/2026/'))).toBe(true);
});
