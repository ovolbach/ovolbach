import { expect, test } from '@playwright/test';

const REGION = '/zilinsky-kraj/2026/';
const DISTRICTS = [
  ['2026-zsk-region-3', 'dolny-kubin'],
  ['2026-zsk-region-5', 'liptovsky-mikulas'],
  ['2026-zsk-region-6', 'martin'],
  ['2026-zsk-region-8', 'ruzomberok'],
  ['2026-zsk-region-11', 'zilina'],
] as const;

test('main catalogue opens the published regional overview alongside the cities', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mestá, kraje a roky');
  await expect(page.getByRole('heading', { level: 2, name: 'Kraje', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: 'Mestá', exact: true })).toBeVisible();
  await expect(page.locator('.city-year-catalogue a')).toHaveCount(5);
  await page.getByRole('main').locator(`a[href="${REGION}"]`).click();
  await expect(page).toHaveURL(REGION);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Žilinský samosprávny kraj – voľby 2026');
});

test('overview has seven sourced chair cards and five districts that open the council filter', async ({ page }) => {
  expect((await page.goto(REGION))?.status()).toBe(200);
  const cards = page.locator('#kandidati [data-candidate-card]');
  await expect(cards).toHaveCount(7);
  await expect(cards.locator('[data-ballot-number]')).toHaveText(['1', '2', '3', '4', '5', '6', '7']);
  await expect(page.locator('#kandidati [data-candidate-id="candidate-89"]')).toHaveCount(1);
  await expect(page.locator('#kandidati [data-candidate-id="candidate-90"]')).toHaveCount(1);
  for (const card of await cards.all()) {
    await expect(card.locator('h3 a')).toHaveAttribute('href', new RegExp(`^${REGION}kandidat/`));
    expect(await card.locator('[data-source-id]').count()).toBeGreaterThan(0);
  }
  const districts = page.locator('[data-regional-district]');
  expect(await districts.evaluateAll((rows) => rows.map((row) => row.getAttribute('data-regional-district'))))
    .toEqual(DISTRICTS.map(([id]) => id));
  await expect(page.getByText('Na webe sú zatiaľ spracované tieto volebné obvody:', { exact: true })).toBeVisible();
  for (const [id, city] of DISTRICTS) {
    const district = page.locator(`[data-regional-district="${id}"]`);
    expect(await district.locator('[data-source-id]').count()).toBeGreaterThan(0);
    await district.locator(`a[href="/${city}/2026/kandidati/?volby=region-council"]`).click();
    await expect(page).toHaveURL(`/${city}/2026/kandidati/?volby=region-council`);
    await expect(page.getByLabel('Voľby', { exact: true })).toHaveValue('region-council');
    await expect(page.locator('[data-catalogue-election="region-council"]')).toBeVisible();
    await page.goto(REGION);
  }
});

test('keyboard selection survives profile, overview and comparison navigation and resets at a city', async ({ page }) => {
  await page.goto(REGION);
  for (const id of ['candidate-89', 'candidate-90']) {
    await page.locator(`[data-compare-candidate="${id}"]`).focus();
    await page.keyboard.press('Space');
  }
  await expect.poll(() => new URL(page.url()).searchParams.getAll('kandidat')).toEqual(['candidate-89', 'candidate-90']);
  await page.locator('[data-candidate-id="candidate-89"] h3 a').click();
  await expect(page.locator('[data-candidacy]')).toHaveCount(3);
  await expect(page.getByRole('navigation', { name: 'Navigácia v štruktúre webu' }).getByRole('link', { name: /Žilinský samosprávny kraj 2026/ })).toBeVisible();
  await page.getByRole('link', { name: 'Vybrať kandidátov', exact: true }).click();
  expect(new URL(page.url()).pathname).toBe(REGION);
  expect(new URL(page.url()).hash).toBe('#kandidati');
  await expect(page.locator('[data-compare-candidate="candidate-89"]')).toBeChecked();
  await expect(page.locator('[data-compare-candidate="candidate-90"]')).toBeChecked();
  await page.getByRole('link', { name: 'Otvoriť porovnanie', exact: true }).click();
  expect(new URL(page.url()).pathname).toBe(`${REGION}porovnat/`);
  await expect(page.locator('[data-comparison-column]')).toHaveCount(2);
  await page.getByRole('navigation', { name: 'Hlavná navigácia' }).getByRole('link', { name: 'Prehľad', exact: true }).click();
  expect(new URL(page.url()).searchParams.getAll('kandidat')).toEqual(['candidate-89', 'candidate-90']);
  await page.locator('[data-regional-district="2026-zsk-region-6"] a[href^="/martin/"]').click();
  await expect(page).toHaveURL('/martin/2026/kandidati/?volby=region-council');
  expect(new URL(page.url()).searchParams.getAll('kandidat')).toEqual([]);
});

test('overview selection limits, reload, reset and browser history stay in the URL', async ({ page }) => {
  await page.goto(REGION);
  for (const id of ['candidate-85', 'candidate-86', 'candidate-87', 'candidate-88']) {
    await page.locator(`[data-compare-candidate="${id}"]`).check();
  }
  await expect(page.locator('[data-compare-candidate="candidate-89"]')).toBeDisabled();
  await page.reload();
  await expect(page.locator('[data-compare-candidate]:checked')).toHaveCount(4);
  await page.locator('[data-compare-candidate="candidate-88"]').uncheck();
  await expect(page.locator('[data-compare-candidate="candidate-89"]')).toBeEnabled();
  await page.goBack();
  await expect(page.locator('[data-compare-candidate]:checked')).toHaveCount(4);
  await page.getByRole('button', { name: 'Vymazať výber' }).click();
  await expect(page.locator('[data-compare-candidate]:checked')).toHaveCount(0);
  expect(new URL(page.url()).searchParams.getAll('kandidat')).toEqual([]);
  await page.goBack();
  await expect(page.locator('[data-compare-candidate]:checked')).toHaveCount(4);
});

test('overview detects duplicate, foreign and excessive selections and permits clearing them', async ({ page }) => {
  for (const query of [
    'kandidat=candidate-85&kandidat=candidate-85',
    'kandidat=candidate-85&kandidat=mt-marek-belak',
    'kandidat=candidate-85&kandidat=candidate-86&kandidat=candidate-87&kandidat=candidate-88&kandidat=candidate-89',
  ]) {
    await page.goto(`${REGION}?${query}`);
    await expect(page.locator('[data-compare-selection-status]')).toContainText('neplatný');
    await expect(page.locator('[data-compare-candidate]:disabled')).toHaveCount(7);
    await page.getByRole('button', { name: 'Vymazať výber' }).click();
    await expect(page.locator('[data-compare-candidate]:disabled')).toHaveCount(0);
  }
});

test('regional overview has collection SEO, sourced date and one sitemap entry', async ({ page, request }) => {
  await page.goto(`${REGION}?kandidat=candidate-85`);
  await expect(page.locator('html')).toHaveAttribute('lang', 'sk');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://ovolbach.sk${REGION}`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://ovolbach.sk${REGION}`);
  await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  await expect(page.locator('[data-election-date] time')).toHaveAttribute('datetime', '2026-10-24');
  expect(await page.locator('[data-election-date] [data-source-id]').count()).toBeGreaterThan(0);
  const graph = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)['@graph'];
  expect(graph.find((node: { '@type': string }) => node['@type'] === 'CollectionPage').url).toBe(`https://ovolbach.sk${REGION}`);
  expect(graph.find((node: { '@type': string }) => node['@type'] === 'BreadcrumbList').itemListElement.map((item: { item: string }) => item.item))
    .toEqual(['https://ovolbach.sk/', `https://ovolbach.sk${REGION}`]);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap.split(`<loc>https://ovolbach.sk${REGION}</loc>`)).toHaveLength(2);
  expect([...sitemap.matchAll(/<loc>([^<]*\/kandidat\/[^<]+)<\/loc>/g)]).toHaveLength(460);
  expect(sitemap).not.toContain('/porovnat/');
});

test('regional candidates, districts and profile links work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: baseURL! });
  try {
    const page = await context.newPage();
    expect((await page.goto(REGION))?.status()).toBe(200);
    await expect(page.locator('#kandidati [data-candidate-card]')).toHaveCount(7);
    await expect(page.locator('[data-regional-district]')).toHaveCount(5);
    await page.locator('[data-candidate-id="candidate-89"] h3 a').click();
    await expect(page.locator('[data-candidacy]')).toHaveCount(3);
    await page.getByRole('navigation', { name: 'Hlavná navigácia' }).getByRole('link', { name: 'Prehľad', exact: true }).click();
    await expect(page).toHaveURL(REGION);
  } finally {
    await context.close();
  }
});
