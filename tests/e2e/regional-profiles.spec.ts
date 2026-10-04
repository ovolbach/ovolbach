import { expect, test } from '@playwright/test';

const REGION = '/zilinsky-kraj/2026/';

test('shared profile preserves all candidacies and canonical identity', async ({ page }) => {
  const response = await page.goto(`${REGION}kandidat/martin-kapitulik/?kandidat=candidate-89`);
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-candidate-profile]')).toHaveAttribute('data-candidate-id', 'candidate-89');
  await expect(page.locator('[data-candidacy]')).toHaveCount(3);
  await expect(page.locator('[data-candidacy]').first()).toContainText('predsedu');
  await expect(page.locator('[data-candidacy][data-election-id="city-council"]')).toContainText('Žilina');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://ovolbach.sk${REGION}kandidat/martin-kapitulik/`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', `https://ovolbach.sk${REGION}kandidat/martin-kapitulik/`);
  const graph = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!)['@graph'];
  expect(graph.find((node: { '@type': string }) => node['@type'] === 'Person')).toMatchObject({
    '@id': `https://ovolbach.sk${REGION}kandidat/martin-kapitulik/#person`,
    url: `https://ovolbach.sk${REGION}kandidat/martin-kapitulik/`,
  });
  expect((await page.title()).length).toBeLessThanOrEqual(60);
  expect((await page.locator('meta[name="description"]').getAttribute('content'))!.length).toBeLessThanOrEqual(165);
  await expect(page.getByRole('link', { name: 'Vybrať kandidátov', exact: true })).toHaveAttribute('href', /\/zilinsky-kraj\/2026\/porovnat\/.*#vyber$/);
});

test('regional selection limits, reset and browser history stay in the URL', async ({ page }) => {
  await page.goto(`${REGION}porovnat/`);
  for (const id of ['candidate-85', 'candidate-86', 'candidate-87', 'candidate-88']) {
    await page.locator(`[data-compare-candidate="${id}"]`).check();
  }
  await expect(page.locator('[data-comparison-column]')).toHaveCount(4);
  await expect(page.locator('[data-compare-candidate="candidate-89"]')).toBeDisabled();
  await page.locator('[data-compare-candidate="candidate-88"]').uncheck();
  await expect(page.locator('[data-compare-candidate="candidate-89"]')).toBeEnabled();
  await page.goBack();
  await expect(page.locator('[data-compare-candidate="candidate-88"]')).toBeChecked();
  await expect(page.locator('[data-comparison-column]')).toHaveCount(4);
  await page.getByRole('button', { name: 'Vymazať výber' }).click();
  await expect(page.locator('[data-comparison-column]')).toHaveCount(0);
  await page.goBack();
  await expect(page.locator('[data-comparison-column]')).toHaveCount(4);
  await page.getByRole('link', { name: 'Anna BELOUSOVOVÁ, RNDr.', exact: true }).click();
  expect(new URL(page.url()).searchParams.getAll('kandidat')).toHaveLength(4);
  await page.getByRole('link', { name: 'Vybrať kandidátov', exact: true }).click();
  await expect(page).toHaveURL(/\/zilinsky-kraj\/2026\/porovnat\/.*#vyber$/);
  await expect(page.locator('[data-comparison-column]')).toHaveCount(4);
  for (const params of ['kandidat=candidate-85&kandidat=candidate-85', 'kandidat=unknown&kandidat=candidate-85',
    'kandidat=candidate-85&kandidat=candidate-86&kandidat=candidate-87&kandidat=candidate-88&kandidat=candidate-89']) {
    await page.goto(`${REGION}porovnat/?${params}`);
    await expect(page.locator('[data-compare-selection-status]')).toContainText('neplatný');
    await expect(page.locator('[data-comparison-column]')).toHaveCount(0);
    await page.getByRole('button', { name: 'Vymazať výber' }).click();
    await expect(page.locator('[data-compare-candidate="candidate-85"]')).toBeEnabled();
  }
});

test('crossing from a municipal selection starts a fresh regional selection', async ({ page }) => {
  await page.goto('/martin/2026/kandidati/?volby=region-chair&kandidat=mt-marek-belak');
  const card = page.locator('[data-candidate-card][data-candidate-id="candidate-85"]');
  await card.locator('h3 a').click();
  await expect(page).toHaveURL(`${REGION}kandidat/anna-belousovova/`);
  await expect(page.locator('[data-compare-selection-status]')).toContainText('Vybraní kandidáti: 0');
  await page.getByRole('navigation', { name: 'Hlavná navigácia' }).getByRole('link', { name: 'Zdroje' }).click();
  await expect(page).toHaveURL('/zdroje/');
});

test('Pagefind returns one shared identity globally and inside each municipality', async ({ page }) => {
  for (const route of ['/', '/dolny-kubin/2026/', '/liptovsky-mikulas/2026/', '/martin/2026/', '/ruzomberok/2026/', '/zilina/2026/', `${REGION}kandidat/milan-pova/`]) {
    await page.goto(route);
    await page.getByRole('searchbox').fill('Anna BELOUSOVOVÁ');
    const shared = page.locator(`[data-search-results] a[href="${REGION}kandidat/anna-belousovova/"]`);
    await expect(shared).toHaveCount(1);
    await expect(shared).toBeVisible();
    await expect(page.locator('[data-search-results] a[href*="kandidat/anna-belousovova/"]')).toHaveCount(1);
  }
});

test('search navigation preserves selection within its scope and resets it across scopes', async ({ page }) => {
  const params = '?kandidat=candidate-85&kandidat=candidate-89';
  await page.goto(`${REGION}kandidat/milan-pova/${params}`);
  await page.getByRole('searchbox').fill('Anna BELOUSOVOVÁ');
  const shared = page.locator(`[data-search-results] a[href^="${REGION}kandidat/anna-belousovova/"]`);
  await expect(shared).toBeVisible();
  await shared.click();
  expect(new URL(page.url()).searchParams.getAll('kandidat')).toEqual(['candidate-85', 'candidate-89']);
  await page.goto(`/martin/2026/${params}`);
  await page.getByRole('searchbox').fill('Anna BELOUSOVOVÁ');
  await expect(shared).toBeVisible();
  await shared.click();
  expect(new URL(page.url()).searchParams.getAll('kandidat')).toEqual([]);
});

test('sitemap contains 460 unique profiles and excludes comparison routes', async ({ request }) => {
  const response = await request.get('/sitemap.xml');
  expect(response.status()).toBe(200);
  const sitemap = await response.text();
  expect([...sitemap.matchAll(/<loc>([^<]*\/kandidat\/[^<]+)<\/loc>/g)]).toHaveLength(460);
  expect(sitemap).toContain(`https://ovolbach.sk${REGION}kandidat/anna-belousovova/`);
  expect(sitemap).not.toMatch(/\/(?:martin|dolny-kubin|liptovsky-mikulas|zilina|ruzomberok)\/2026\/kandidat\/anna-belousovova\//);
  expect(sitemap).not.toContain('/porovnat/');
});

test('regional comparison selects seven chair candidates without a city', async ({ page }) => {
  await page.goto(`${REGION}porovnat/`);
  await expect(page.locator('[data-compare-candidate]')).toHaveCount(7);
  await page.locator('[data-compare-candidate="candidate-89"]').check();
  await page.locator('[data-compare-candidate="candidate-90"]').check();
  await expect(page.locator('[data-comparison-output]')).toContainText('Martin KAPITULÍK');
  await expect(page.locator('[data-comparison-output]')).toContainText('Adam LUČANSKÝ');
  await expect(page.locator('[data-comparison-output] [data-candidacy]')).toHaveCount(4);
  await expect(page.locator('[data-comparison-output] [data-candidacy] h3')).toHaveText(Array(4).fill('Voľby predsedu Žilinského samosprávneho kraja'));
  await page.reload();
  await expect(page.locator('[data-compare-candidate="candidate-89"]')).toBeChecked();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await page.goto(`${REGION}porovnat/?kandidat=candidate-85&kandidat=mt-marek-belak`);
  await expect(page.locator('[data-comparison-status]')).toContainText('neplatný');
  await page.getByRole('button', { name: 'Vymazať výber' }).click();
  await expect(page).not.toHaveURL(/kandidat=/);
});

test('municipal cards for both offices link to the shared profile', async ({ page }) => {
  await page.goto('/zilina/2026/kandidati/?volby=city-council');
  const cards = page.locator('[data-candidate-card][data-candidate-id="candidate-89"]');
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    await expect(card.locator('h3 a,h4 a').first()).toHaveAttribute('href', `${REGION}kandidat/martin-kapitulik/`);
  }
});
