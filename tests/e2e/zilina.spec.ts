import { expect, test } from '@playwright/test';
import { loadElectionContext } from '../../src/lib/load-guide-data';

const BASE = '/zilina/2026/';
const { data } = await loadElectionContext({ citySlug: 'zilina', year: 2026 });

test('Žilina is discoverable and its ballots use its own districts and seat limits', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Žilina.*2026/ }).click();
  await expect(page).toHaveURL(/\/zilina\/2026\/$/);
  await page.goto(`${BASE}?obvod=district-6`);
  const district = page.locator('[data-district="2026-za-city-6"]');
  await expect(district).toBeVisible();
  await expect(district.locator('[data-ballot-id="city-council"] [data-ballot-limit]')).toContainText('Najviac označených kandidátov: 2.');
  await expect(page.locator('[data-ballot-id="region-council"] [data-ballot-limit]')).toContainText('Najviac označených kandidátov: 12.');
  await expect(page.locator('[data-district="2026-lm-city-5"]')).toHaveCount(0);
  await page.goto(`${BASE}kandidati/`);
  for (const [kind, count] of [['mayor', 8], ['city-council', 94], ['region-chair', 7], ['region-council', 83]] as const) {
    await expect(page.locator(`[data-catalogue-election="${kind}"] [data-candidate-card]`)).toHaveCount(count);
  }
});

test('all 135 profiles resolve and expose every research claim source and finance section', async ({ page }) => {
  test.setTimeout(120_000);
  const sourceById = new Map(data.sources.map((source) => [source.id, source]));
  for (const candidate of data.candidates) {
    const response = await page.goto(`${BASE}kandidat/${candidate.slug}/`);
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

test('one person retains three official candidacies and campaign identity', async ({ page }) => {
  await page.goto(`${BASE}kandidat/peter-cibulka/`);
  await expect(page.locator('[data-candidacy]')).toHaveCount(3);
  await expect(page.locator('[data-candidacy]').evaluateAll((items) => items.map((item) => [
    item.getAttribute('data-election-id'), item.getAttribute('data-ballot-number'),
  ]))).resolves.toEqual([['mayor', '1'], ['city-council', '4'], ['region-council', '14']]);
  await expect(page.locator('[data-personal-account]')).toHaveAttribute('href', 'https://transparentneucty.sk/#/ucet/SK3309000000005245909565');
  await expect(page.locator('[data-finance-report-duty]')).toHaveAttribute('data-finance-report-duty', 'required');
});

test('search and source navigation remain scoped to Žilina', async ({ page }) => {
  await page.goto(BASE);
  await page.getByRole('searchbox').fill('Peter Cibulka');
  await expect(page.locator('[data-search-results] a').first()).toBeVisible();
  const paths = await page.locator('[data-search-results] a').evaluateAll((links) => links.map((link) => new URL((link as HTMLAnchorElement).href).pathname));
  expect(paths.every((path) => path.startsWith(BASE))).toBe(true);
  await page.getByRole('navigation', { name: 'Hlavná navigácia' }).getByRole('link', { name: 'Zdroje' }).click();
  await expect(page).toHaveURL(/\/zilina\/2026\/zdroje\/$/);
  await expect(page.locator('[data-source-register]').first()).toBeVisible();
});


test('rechecked Žilina campaign accounts expose the verified bank link and identity evidence', async ({ page }) => {
  for (const [slug, accountUrl, evidenceUrl] of [
    ['rastislav-johanes', 'https://www.unicreditbank.sk/sk/ostatne/transparentny-ucet.html?IBAN=SK4511110000006856301131', 'https://www.minv.sk/swift_data/source/verejna_sprava/volby_a_referendum/150_oso/OSO26_ZZK-Starosta.xlsx'],
    ['miroslav-sokol', 'https://www.tatrabanka.sk/sk/personal/ucet-platby/transparentne-ucty/ucet/?iban=sk0211000000002973085679', 'https://miroslavsokol.sk/kandidat/'],
  ]) {
    await page.goto(`${BASE}kandidat/${slug}/`);
    const finance = page.locator('[data-campaign-finance]');
    await expect(finance.locator('[data-personal-account]')).toHaveAttribute('href', accountUrl);
    await finance.locator('summary').click();
    await expect(finance.locator(`a[href="${evidenceUrl}"]`).first()).toBeVisible();
    await expect(finance).toContainText('2026-10-04');
  }
});
