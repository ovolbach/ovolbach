import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const MUNICIPAL = '/liptovsky-mikulas/2026/kandidat/jan-blchac/';
const REGIONAL = '/zilinsky-kraj/2026/kandidat/martin-kapitulik/';

for (const [path, counts] of [[MUNICIPAL, [2, 13, 29]], [REGIONAL, [6, 12, 82]]] as const) {
  test(`${path} ends with complete compact lists for each election`, async ({ page }) => {
    await page.goto(path);
    const block = page.locator('[data-related-candidates]');
    await expect(block.getByRole('heading', { level: 2, name: 'Ďalší kandidáti v rovnakých voľbách' })).toBeVisible();
    await expect(block).toHaveAttribute('data-pagefind-ignore', '');
    expect(await block.evaluate((element) => element.parentElement?.lastElementChild === element)).toBe(true);
    const groups = block.locator('[data-related-election]');
    await expect(groups).toHaveCount(3);
    for (let index = 0; index < counts.length; index += 1) {
      const group = groups.nth(index);
      await expect(group.getByRole('heading', { level: 3 })).toHaveCount(1);
      await expect(group.locator('[data-related-candidate]')).toHaveCount(counts[index]!);
      const numbers = await group.locator('[data-related-candidate]').evaluateAll((rows) => rows.map((row) => Number(row.getAttribute('data-ballot-number'))));
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
      await expect(group.locator('[data-source-attribution] a').first()).toBeVisible();
      await expect(group.locator('[data-source-attribution]').first()).toContainText('overené');
    }
    const ownId = await page.locator('[data-candidate-profile]').getAttribute('data-candidate-id');
    await expect(block.locator(`[data-related-candidate="${ownId}"]`)).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).include('[data-related-candidates]').analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  });
}

test('keyboard navigation between municipal profiles retains comparison selection', async ({ page }) => {
  await page.goto(`${MUNICIPAL}?kandidat=candidate-1&kandidat=candidate-2`);
  const link = page.locator('[data-related-election="mayor"] [data-related-candidate] a').first();
  const target = await link.getAttribute('href');
  const name = await link.textContent();
  await link.focus();
  await expect(link).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(target!);
  expect(new URL(page.url()).searchParams.getAll('kandidat')).toEqual(['candidate-1', 'candidate-2']);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name!);
  await expect(page.locator('[data-compare-selection-status]')).toContainText('Vybraní kandidáti: 2');
});

test('regional links retain regional selection and municipal links start a fresh selection', async ({ page }) => {
  await page.goto(`${REGIONAL}?kandidat=candidate-85&kandidat=candidate-89`);
  const chairLink = page.locator('[data-related-election="region-chair"] [data-related-candidate] a').first();
  await chairLink.click();
  expect(new URL(page.url()).pathname).toMatch(/^\/zilinsky-kraj\/2026\/kandidat\//);
  expect(new URL(page.url()).searchParams.getAll('kandidat')).toEqual(['candidate-85', 'candidate-89']);

  await page.goto(`${REGIONAL}?kandidat=candidate-85&kandidat=candidate-89`);
  await page.locator('[data-related-election="city-council"] a[href^="/zilina/2026/kandidat/"]').first().click();
  expect(new URL(page.url()).pathname).toMatch(/^\/zilina\/2026\/kandidat\//);
  expect(new URL(page.url()).searchParams.getAll('kandidat')).toEqual([]);
  await expect(page.locator('[data-compare-selection-status]')).toContainText('Vybraní kandidáti: 0');
});

test('a municipal roster links directly to a shared regional profile without carrying municipal selection', async ({ page }) => {
  await page.goto('/zilina/2026/kandidat/peter-cibulka/?kandidat=candidate-89');
  await page.locator(`[data-related-candidates] a[href="${REGIONAL}"]`).first().click();
  await expect(page).toHaveURL(REGIONAL);
  await expect(page.locator('[data-compare-selection-status]')).toContainText('Vybraní kandidáti: 0');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the complete regional rosters and profile links work as static HTML', async ({ page }) => {
    await page.goto(REGIONAL);
    await expect(page.locator('[data-related-election="region-council"] [data-related-candidate]')).toHaveCount(82);
    const link = page.locator('[data-related-election="city-council"] [data-related-candidate] a').first();
    const target = await link.getAttribute('href');
    await link.click();
    await expect(page).toHaveURL(target!);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
