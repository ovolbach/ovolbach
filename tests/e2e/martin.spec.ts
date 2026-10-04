import { expect, test } from '@playwright/test';
import { loadElectionContext } from '../../src/lib/load-guide-data';
import { candidateProfilePath } from '../../src/lib/regional-context';

const BASE = '/martin/2026/';
const context = await loadElectionContext({ citySlug: 'martin', year: 2026 });
const { data } = context;

test('Martin is discoverable and exposes all four official ballots and its district limits', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Martin.*2026/ }).click();
  await expect(page).toHaveURL(/\/martin\/2026\/$/);
  for (const [number, limit] of [[1, 8], [2, 5], [3, 5], [4, 7]]) {
    await page.goto(`${BASE}?obvod=district-${number}`);
    const district = page.locator(`[data-district="2026-mt-city-${number}"]`);
    await expect(district).toBeVisible();
    await expect(district.locator('[data-ballot-id="city-council"] [data-ballot-limit]'))
      .toContainText(`Najviac označených kandidátov: ${limit}.`);
    await expect(page.locator('[data-ballot-id="region-council"] [data-ballot-limit]'))
      .toContainText('Najviac označených kandidátov: 8.');
  }
  await page.goto(`${BASE}kandidati/`);
  for (const [kind, count] of [['mayor', 9], ['city-council', 94], ['region-chair', 7], ['region-council', 45]] as const) {
    await expect(page.locator(`[data-catalogue-election="${kind}"] [data-candidate-card]`)).toHaveCount(count);
  }
});

test('all 124 profiles expose the official name, finance and every referenced claim source', async ({ page }) => {
  test.setTimeout(150_000);
  const sourceById = new Map(data.sources.map((source) => [source.id, source]));
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
      expect(rendered.find((item) => item.id === claim.id)?.sources, claim.id)
        .toEqual(claim.sourceIds.map((id) => sourceById.get(id)?.url));
    }
  }
});

test('multiple candidacies and finance retain their separate official identities', async ({ page }) => {
  await page.goto(`${BASE}kandidat/marek-belak/`);
  await expect(page.locator('[data-candidacy]').evaluateAll((items) => items.map((item) => [
    item.getAttribute('data-election-id'), item.getAttribute('data-ballot-number'),
  ]))).resolves.toEqual([['mayor', '1'], ['city-council', '1'], ['region-council', '3']]);
  await page.goto('/zilinsky-kraj/2026/kandidat/adam-lucansky/');
  await expect(page.locator('[data-candidacy]')).toHaveCount(2);
  await page.goto(`${BASE}kandidat/milan-ftorek/`);
  await expect(page.locator('[data-personal-account]')).toHaveAttribute('href',
    'https://www.tatrabanka.sk/sk/personal/ucet-platby/transparentne-ucty/ucet/?iban=sk7911000000002976122236');
  await page.goto(`${BASE}kandidat/jan-danko/`);
  await expect(page.locator('[data-personal-account]')).toHaveCount(0);
});

test('search, comparison and sources stay in the Martin context', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('searchbox').fill('Marek Belák');
  await expect(page.locator('[data-search-results] a').first()).toBeVisible();
  const paths = await page.locator('[data-search-results] a').evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href).pathname));
  expect(paths.every((path) => path.startsWith(BASE))).toBe(true);
  await page.goto(`${BASE}porovnat/?kandidat=mt-marek-belak&kandidat=mt-matej-turzo`);
  await expect(page.locator('[data-comparison-column]')).toHaveText(['Marek BELÁK, Ing.', 'Matej TURZO, Mgr., MBA']);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,follow');
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await page.getByRole('navigation', { name: 'Hlavná navigácia' }).getByRole('link', { name: 'Zdroje' }).click();
  await expect(page).toHaveURL((url) => url.pathname === `${BASE}zdroje/`
    && url.searchParams.getAll('kandidat').join(',') === 'mt-marek-belak,mt-matej-turzo');
  await expect(page.locator('[data-source-register]').first()).toBeVisible();
});

test('all 52 polling places link the official list without inferred electoral district assignment', async ({ page }) => {
  await page.goto(`${BASE}ako-volit/`);
  const note = page.locator('[data-polling-limitation]');
  await expect(note).toContainText('Priradenie okrskov k mestským volebným obvodom nebolo potvrdené.');
  await expect(note.locator('a').first()).toHaveAttribute('href', 'https://www.martin.sk/assets/File.ashx?id_dokumenty=109474&id_org=700031');
  await expect(page.locator('[data-polling-station]')).toHaveCount(52);
  await expect(page.locator('[data-polling-station="19"]')).toBeVisible();
  await expect(page.locator('[data-polling-district]')).toHaveCount(0);
});
