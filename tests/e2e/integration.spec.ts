import { expect, test, type Page } from '@playwright/test';
import { createComparisonPayload } from '../../src/lib/comparison-payload';
import { comparisonContextFixture } from '../fixtures/comparison-context';

async function tabTo(page: Page, selector: string) {
  for (let i = 0; i < 100; i++) {
    await page.keyboard.press('Tab');
    if (await page.locator(selector).evaluate((node) => node === document.activeElement)) return;
  }
  throw new Error(`Keyboard cannot reach ${selector}`);
}

test('visitor selects two named candidates using only keyboard and reaches comparison in selection order', async ({ page }) => {
  await page.goto('/');
  await tabTo(page, '.site-nav a[href="/kandidati/"]');
  await page.keyboard.press('Enter');
  await tabTo(page, '[data-election-select]');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await tabTo(page, '[data-district-select]');
  for (let index = 0; index < 4; index++) await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('checkbox', { name: 'Vybrať na porovnanie: Peter BONKO, Bc.', exact: true })).toBeVisible();
  await tabTo(page, '[data-candidate-card]:visible input[data-compare-candidate="candidate-49"]');
  await page.keyboard.press('Space');
  await tabTo(page, '[data-candidate-card]:visible input[data-compare-candidate="candidate-50"]');
  await page.keyboard.press('Space');
  expect(new URL(page.url()).searchParams.getAll('kandidat')).toEqual(['candidate-49', 'candidate-50']);
  await tabTo(page, '[data-compare-link]');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/porovnat\//);
  await expect(page.locator('[data-comparison-column]')).toHaveText(['Peter BONKO, Bc.', 'Šimon CUPRA, Ing.']);
  await page.reload();
  expect(new URL(page.url()).searchParams.getAll('kandidat')).toEqual(['candidate-49', 'candidate-50']);
});

test('comparison retains quoted and disputed context on both layouts', async ({ page }, info) => {
  const payload = JSON.stringify(createComparisonPayload(comparisonContextFixture())).replace(/</g, '\\u003c');
  await page.route('**/porovnat/**', async (route) => {
    const response = await route.fetch();
    const html = (await response.text()).replace(/(<script id="comparison-data"[^>]*>)[\s\S]*?(<\/script>)/, `$1${payload}$2`);
    await route.fulfill({ response, body: html });
  });
  await page.goto('/porovnat/?kandidat=candidate-1&kandidat=candidate-2');
  const visible = page.locator(info.project.name === 'mobile' ? '[data-comparison-mobile]' : '[data-comparison-table]');
  for (const label of ['Fakt', 'Citát', 'Mediálna správa', 'Vyjadrenie kandidáta', 'Oficiálny výsledok']) {
    await expect(visible.getByText(label, { exact: true })).toBeVisible();
  }
  const quote = visible.locator('[data-claim]').filter({ hasText: 'Testovací text quote' });
  await expect(quote).toContainText('Kontext quote');
  await expect(quote).toContainText('2024–2026');
  await expect(quote).toContainText('Testovací autor');
  await expect(quote).toContainText('Testovací vydavateľ');
  await expect(quote).toContainText('Mediálny zdroj');
  await expect(quote.getByRole('link', { name: /Zdroj:/ })).toHaveAttribute('href', 'https://example.com/source');
});

test('comparison basic row shows official facts and resolved roster attribution', async ({ page }, info) => {
  await page.goto('/porovnat/?kandidat=candidate-49&kandidat=candidate-50');
  const basic = page.locator(info.project.name === 'mobile' ? '[data-comparison-mobile] [data-comparison-row]' : '[data-comparison-table] [data-comparison-row]').first();
  await expect(basic).toContainText('Číslo na hlasovacom lístku');
  await expect(basic).toContainText('Vek');
  await expect(basic).toContainText('Povolanie');
  await expect(basic).toContainText('Volebný obvod č. 4');
  await expect(basic.getByRole('link', { name: /Zdroj:/ }).first()).toHaveAttribute('href', /^https:/);
  await expect(basic).not.toContainText('Údaje sú dostupné.');
});

test('catalogue provides all four election filters and neutral invalid states', async ({ page }) => {
  await page.goto('/kandidati/?volby=city-council&obvod=district-4');
  const filter = page.getByLabel('Voľby', { exact: true });
  for (const [election, count] of [['mayor', 3], ['city-council', 5], ['region-chair', 7], ['region-council', 30]] as const) {
    await filter.selectOption(election);
    await expect(page.locator('[data-candidate-card]:visible')).toHaveCount(count);
    await expect(page.locator('[data-candidate-card]:visible [data-ballot-number]').first()).toHaveText('1');
    expect(new URL(page.url()).searchParams.get('volby')).toBe(election);
    if (election === 'region-council') await expect(page.locator('[data-catalogue-election="region-council"]')).toContainText('Volebný obvod č. 5');
  }
  for (const query of ['', '?volby=bad&obvod=district-4', '?volby=city-council', '?volby=mayor&obvod=bad']) {
    await page.goto(`/kandidati/${query}`);
    await expect(page.locator('[data-candidate-card]:visible')).toHaveCount(0);
  }
});

test('comparison selection enforces four, synchronizes duplicate cards and restores Back state', async ({ page }) => {
  await page.goto('/?obvod=district-1');
  for (const id of ['candidate-1', 'candidate-44', 'candidate-13', 'candidate-2']) {
    await page.locator(`[data-compare-candidate="${id}"]:visible`).first().check();
  }
  await expect(page.locator('[data-compare-candidate="candidate-3"]:visible').first()).toBeDisabled();
  expect(new URL(page.url()).searchParams.getAll('kandidat')).toEqual(['candidate-1', 'candidate-44', 'candidate-13', 'candidate-2']);
  for (const duplicate of await page.locator('[data-compare-candidate="candidate-1"]:visible').all()) await expect(duplicate).toBeChecked();
  await page.locator('[data-compare-candidate="candidate-1"]:visible').first().uncheck();
  expect(new URL(page.url()).searchParams.getAll('kandidat')).toEqual(['candidate-44', 'candidate-13', 'candidate-2']);
  await page.goBack();
  for (const duplicate of await page.locator('[data-compare-candidate="candidate-1"]:visible').all()) await expect(duplicate).toBeChecked();
  await page.getByRole('link', { name: 'Metodika', exact: true }).first().click();
  await page.getByRole('link', { name: 'Porovnať', exact: true }).click();
  await expect(page.locator('[data-comparison-column]')).toHaveCount(4);
});

test('polling guide publishes all districts and exact Stošice station with source', async ({ page }) => {
  await page.goto('/ako-volit/');
  await expect(page.locator('[data-polling-district]')).toHaveCount(8);
  const station = page.locator('[data-polling-station="22"]');
  await expect(station).toContainText('Stošice');
  await expect(station).toContainText('ZŠ Okoličné, Okoličianska 404/10');
  await expect(station.getByRole('heading')).toHaveText('Volebný okrsok č. 22');
  await expect(station.getByRole('link', { name: /Zdroj:/ })).toHaveAttribute('href', /Obvody%20a%20okrsky%202026.pdf$/);
});

test('cards, ballot limits and district facts have adjacent original-source attribution', async ({ page }) => {
  await page.goto('/?obvod=district-4');
  const district = page.locator('[data-district="city-4"]');
  await expect(district.locator('[data-district-facts] [data-source-attribution]').first()).toBeVisible();
  for (const ballot of await district.locator('[data-ballot-section]').all()) {
    await expect(ballot.locator('[data-ballot-limit] [data-source-attribution]').first()).toBeVisible();
    await expect(ballot.locator('[data-candidate-card]').first().getByRole('link', { name: /Zdroj:/ }).first()).toHaveAttribute('href', /^https:/);
  }
});

test('search Enter preserves district, election and repeated comparison parameters', async ({ page }) => {
  for (const path of ['/kandidati/?obvod=district-4&volby=city-council&kandidat=candidate-49&kandidat=candidate-50', '/porovnat/?obvod=district-4&volby=mayor&kandidat=candidate-1&kandidat=candidate-2']) {
    await page.goto(path);
    const before = new URL(page.url()).search;
    await page.getByRole('searchbox').fill('Blcháč');
    await page.getByRole('searchbox').press('Enter');
    await expect(page.locator('[data-search-results] li').first()).toBeVisible();
    expect(new URL(page.url()).search).toBe(before);
  }
});

test('every page exposes snapshot and document type beside source links', async ({ page }) => {
  for (const path of ['/', '/kandidati/', '/porovnat/', '/ako-volit/', '/metodika/', '/zdroje/', '/kandidat/jan-blchacing-phd/']) {
    await page.goto(path);
    await expect(page.locator('[data-snapshot-date]')).toContainText('2026-09-18');
  }
  await expect(page.locator('[data-source-attribution]').first()).toContainText('Oficiálny dokument');
});

test('methodology publishes the quotation and copyright policy', async ({ page }) => {
  await page.goto('/metodika/');
  const policy = page.getByRole('region', { name: 'Citácie a autorské práva' });
  await expect(policy).toContainText('krátke a presné');
  await expect(policy).toContainText('pôvodné znenie a kontext');
  await expect(policy).toContainText('autora');
  await expect(policy).toContainText('odkaz');
  await expect(policy).toContainText('nereprodukujeme');
  await expect(policy).toContainText('GDPR');
});
