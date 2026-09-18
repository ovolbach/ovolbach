import { expect, test } from '@playwright/test';

const FIRST = 'candidate-1';
const SECOND = 'candidate-2';

test('comparison keeps valid candidate URL order and renders eight common categories', async ({ page }) => {
  await page.goto(`/porovnat/?kandidat=${SECOND}&kandidat=${FIRST}`);

  await expect(page.locator('[data-comparison-column]')).toHaveCount(2);
  await expect(page.locator('[data-comparison-table] [data-comparison-row]')).toHaveCount(8);
  await expect(page.locator('[data-comparison-column]').evaluateAll((columns) =>
    columns.map((column) => column.getAttribute('data-candidate-id')),
  )).resolves.toEqual([SECOND, FIRST]);
});

test('comparison rejects invalid, duplicate, and oversized URL selections', async ({ page }) => {
  await page.goto(`/porovnat/?kandidat=${FIRST}&kandidat=${FIRST}`);
  await expect(page.getByRole('status')).toContainText('neplatný');
  await expect(page.locator('[data-comparison-row]')).toHaveCount(0);

  await page.goto(`/porovnat/?kandidat=${FIRST}&kandidat=neexistuje`);
  await expect(page.getByRole('status')).toContainText('neplatný');

  await page.goto(`/porovnat/?kandidat=candidate-1&kandidat=candidate-2&kandidat=candidate-3&kandidat=candidate-4&kandidat=candidate-5`);
  await expect(page.getByRole('status')).toContainText('najviac štyroch');
  await expect(page.locator('[data-comparison-row]')).toHaveCount(0);
});

test('comparison keeps state only in URL and browser storage remains empty', async ({ page, context }) => {
  await page.goto(`/porovnat/?kandidat=${FIRST}&kandidat=${SECOND}`);

  expect(await context.cookies()).toEqual([]);
  await expect(page.evaluate(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    indexed: (await indexedDB.databases()).length,
  }))).resolves.toEqual({ local: 0, session: 0, indexed: 0 });
});

test('comparison cells retain candidate labels for mobile card layout', async ({ page }) => {
  await page.goto(`/porovnat/?kandidat=${FIRST}&kandidat=${SECOND}`);
  await expect(page.locator('[data-comparison-row] td').first()).toHaveAttribute('data-candidate', /Ján BLCHÁČ/);
});

test('comparison cards use available reading width on mobile', async ({ page }, testInfo) => {
  testInfo.skip(testInfo.project.name !== 'mobile', 'mobile-only layout assertion');
  await page.goto(`/porovnat/?kandidat=${FIRST}&kandidat=${SECOND}`);
  await expect(page.locator('[data-comparison-mobile]').evaluate((cards) =>
    Math.round(cards.getBoundingClientRect().width),
  )).resolves.toBeGreaterThan(300);
});

test('mobile comparison exposes semantic candidate and field labels without desktop duplicate', async ({ page }, testInfo) => {
  testInfo.skip(testInfo.project.name !== 'mobile', 'mobile-only layout assertion');
  await page.goto(`/porovnat/?kandidat=${FIRST}&kandidat=${SECOND}`);
  await expect(page.locator('[data-comparison-mobile]')).toBeVisible();
  await expect(page.locator('[data-comparison-mobile] dt').first()).toContainText('Kandidát');
  await expect(page.locator('[data-comparison-mobile] dd').first()).toContainText('Ján BLCHÁČ');
  await expect(page.locator('[data-comparison-table]')).toBeHidden();
});

test('voting guide states four ballots and official selection limits', async ({ page }) => {
  await page.goto('/ako-volit/');

  await expect(page.getByText('4 hlasovacie lístky', { exact: true })).toBeVisible();
  await expect(page.locator('[data-guide-ballot-info]').getByRole('link', { name: 'Zdroj' }).first()).toBeVisible();
  await expect(page.getByText('1 hlas pre primátora mesta Liptovský Mikuláš')).toBeVisible();
  await expect(page.getByText('podľa počtu mandátov vo vašom mestskom volebnom obvode')).toBeVisible();
  await expect(page.getByText('1 hlas pre predsedu Žilinského samosprávneho kraja')).toBeVisible();
  await expect(page.getByText('najviac 6 kandidátov')).toBeVisible();
  await expect(page.getByText('Mestské časti nevolia samostatných primátorov.', { exact: true })).toBeVisible();
  await expect(page.locator('[data-guide-ballot]')).toHaveCount(4);
  for (const item of await page.locator('[data-guide-ballot]').all()) {
    await expect(item.getByRole('link', { name: 'Zdroj' }).first()).toBeVisible();
  }
});

test('methodology and shared legal notice explain neutrality, sources, corrections, and privacy', async ({ page }) => {
  await page.goto('/metodika/');

  await expect(page.getByRole('heading', { name: 'Metodika' })).toBeVisible();
  await expect(page.locator('#main-content').getByText('info@ovolbach.sk')).toBeVisible();
  await expect(page.getByText(/neukladá voľbu kandidátov ani žiadne údaje v prehliadači alebo na serveri/)).toBeVisible();
  await expect(page.getByText(/nehodnotí ani neodporúča kandidátov/)).toBeVisible();
  await expect(page.locator('.legal-notice')).toContainText('Tento web nikoho nevyzýva');
});
