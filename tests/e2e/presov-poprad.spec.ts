import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const REGION = '/presovsky-kraj/2026/';

test('homepage nests the seven cities under their region and year in Slovak order', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  const groups = page.locator('main .region-year-catalogue');
  await expect(groups).toHaveCount(2);
  await expect(groups.locator('h2')).toHaveText(['Prešovský samosprávny kraj — 2026', 'Žilinský samosprávny kraj — 2026']);
  await expect(groups.locator('h3')).toHaveText(['Mestá', 'Mestá']);
  await expect(groups.first().locator('.city-year-catalogue a')).toHaveText(['Poprad — 2026', 'Prešov — 2026']);
  await expect(groups.last().locator('.city-year-catalogue a')).toHaveCount(5);
});

test('PSK overview keeps all eleven registered chairs in order and links only the two studied districts', async ({ page }) => {
  expect((await page.goto(REGION))?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Prešovský samosprávny kraj – voľby 2026');
  const cards = page.locator('#kandidati [data-candidate-card]');
  await expect(cards).toHaveCount(11);
  await expect(cards.locator('[data-ballot-number]')).toHaveText(Array.from({ length: 11 }, (_, i) => String(i + 1)));
  await expect(cards.locator('h3 a').first()).toHaveAttribute('href', `${REGION}kandidat/drahomir-cureja/`);
  await expect(page.locator('[data-regional-district]')).toHaveCount(2);
  await expect(page.locator('[data-candidacy-update]')).toHaveCount(1);
  await expect(page.locator('[data-candidacy-update]')).toContainText('6. októbra 2026');
  await expect(page.locator('[data-regional-district="2026-psk-region-6"] a').first())
    .toHaveAttribute('href', '/poprad/2026/kandidati/?volby=region-council');
  await expect(page.locator('[data-regional-district="2026-psk-region-7"] a').first())
    .toHaveAttribute('href', '/presov/2026/kandidati/?volby=region-council');
  expect(await page.locator('main').innerText()).not.toContain('Žilinsk');
});

for (const [city, prefix, mayorCount, councilCount, regionCount, stationCount] of [
  ['poprad', 'pp', 5, 79, 49, 44], ['presov', 'po', 6, 138, 114, 66],
] as const) {
  const base = `/${city}/2026/`;
  test(`${city} catalogue keeps all official registrations, filters and shared profile links`, async ({ page }) => {
    expect((await page.goto(`${base}kandidati/?volby=mayor`))?.status()).toBe(200);
    await expect(page.locator('[data-candidate-card]:visible')).toHaveCount(mayorCount);
    await page.getByLabel('Voľby', { exact: true }).selectOption('city-council');
    await expect(page.locator('[data-candidate-card]:visible')).toHaveCount(0);
    const counts = city === 'poprad' ? [37, 42] : [27, 16, 19, 19, 22, 35];
    expect(counts.reduce((sum, count) => sum + count, 0)).toBe(councilCount);
    for (const [index, count] of counts.entries()) {
      await page.getByLabel('Volebný obvod', { exact: true }).selectOption(`district-${index + 1}`);
      await expect(page.locator('[data-candidate-card]:visible')).toHaveCount(count);
      await expect(page.locator('[data-candidate-card]:visible [data-ballot-number]'))
        .toHaveText(Array.from({ length: count }, (_, i) => String(i + 1)));
    }
    await page.getByLabel('Voľby', { exact: true }).selectOption('region-council');
    await expect(page.locator('[data-candidate-card]:visible')).toHaveCount(regionCount);
    await page.getByLabel('Voľby', { exact: true }).selectOption('region-chair');
    await expect(page.locator('[data-candidate-card]:visible')).toHaveCount(11);
    await expect(page.locator('[data-candidate-card][data-candidate-id="psk-milan-majersky"] a').first())
      .toHaveAttribute('href', `${REGION}kandidat/milan-majersky/`);
  });
  test(`${city} voting guide includes all official polling stations and remains accessible`, async ({ page }) => {
    await page.goto(`${base}ako-volit/`);
    await expect(page.locator('[data-polling-station]')).toHaveCount(stationCount);
    await expect(page.locator('[data-guide-ballot]')).toHaveCount(4);
    await expect(page.locator('[data-guide-ballot]').last()).toContainText(city === 'poprad' ? 'najviac 8' : 'najviac 15');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((row) => ['serious', 'critical'].includes(row.impact ?? ''))).toEqual([]);
  });
  test(`${city} official city ballot and regional profiles work without JavaScript`, async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(base);
    await page.getByRole('button', { name: 'Obvod č. 1', exact: true }).click();
    await expect(page.locator(`[data-district="2026-${prefix}-city-1"] [data-election="city-council"] [data-candidate-card]`))
      .toHaveCount(city === 'poprad' ? 37 : 27);
    await page.goto(`${REGION}kandidat/milan-majersky/`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('MAJERSKÝ');
    expect(await context.cookies()).toEqual([]);
    await context.close();
  });
}

test('PSK comparison excludes candidates from the other region and contains eight categories', async ({ page }) => {
  await page.goto(`${REGION}porovnat/?kandidat=psk-milan-majersky&kandidat=psk-samuel-migal`);
  await expect(page.locator('[data-comparison-column]')).toHaveCount(2);
  await expect(page.locator('[data-comparison-table] [data-comparison-row]')).toHaveCount(8);
  await page.goto(`${REGION}porovnat/?kandidat=psk-milan-majersky&kandidat=candidate-85`);
  await expect(page.getByRole('status')).toContainText('neplatný');
});

test('PSK scoped search returns its chair profile once and never a Žilina candidate', async ({ page }) => {
  await page.goto('/poprad/2026/');
  await page.getByRole('searchbox').fill('Milan MAJERSKÝ');
  await expect(page.locator(`[data-search-results] a[href="${REGION}kandidat/milan-majersky/"]`)).toHaveCount(1);
  await page.getByRole('searchbox').fill('Anna BELOUSOVOVÁ');
  await expect(page.locator('[data-search-status]')).toHaveText('Výsledky hľadania: 0.');
});
