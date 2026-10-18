import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator } from '@playwright/test';

const MUNICIPAL = '/liptovsky-mikulas/2026/kandidat/jan-blchac/';
const REGIONAL = '/zilinsky-kraj/2026/kandidat/martin-kapitulik/';

async function expectCandidateColumns(list: Locator, count: number) {
  const rows = await list.locator('[data-related-candidate]').evaluateAll((items) => items.map((item, index) => {
    const box = item.getBoundingClientRect();
    const range = document.createRange();
    range.selectNodeContents(item.querySelector('a')!);
    return {
      index, left: Math.round(box.left), top: box.top,
      fragments: item.getClientRects().length,
      textFits: Array.from(range.getClientRects()).every((rect) => rect.left >= box.left - 1 && rect.right <= box.right + 1),
    };
  }));
  const columns = [...new Set(rows.map((row) => row.left))].sort((a, b) => a - b);
  expect(columns).toHaveLength(count);
  expect(columns.flatMap((left) => rows.filter((row) => row.left === left).map((row) => row.index)))
    .toEqual(rows.map((row) => row.index));
  for (const left of columns) {
    const column = rows.filter((row) => row.left === left);
    for (let index = 1; index < column.length; index += 1) {
      expect(column[index]!.top).toBeGreaterThan(column[index - 1]!.top);
    }
  }
  expect(rows.every((row) => row.fragments === 1 && row.textFits)).toBe(true);
}

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
      await expect(group.getByRole('link')).toHaveCount(counts[index]!);
      await expect(group.locator('[data-source-attribution]')).toHaveCount(0);
      await expectCandidateColumns(group.locator('.related-candidates__list'), page.viewportSize()!.width > 672 ? 2 : 1);
    }
    const ownId = await page.locator('[data-candidate-profile]').getAttribute('data-candidate-id');
    await expect(block.locator(`[data-related-candidate="${ownId}"]`)).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const results = await new AxeBuilder({ page }).include('[data-related-candidates]').analyze();
    expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
  });
}

test('candidate columns switch at 672/673 px and keep long names inside their column', async ({ page }) => {
  await page.goto(MUNICIPAL);
  const list = page.locator('[data-related-election="region-council"] .related-candidates__list');
  for (const [width, count] of [[672, 1], [673, 2], [320, 1]] as const) {
    await page.setViewportSize({ width, height: 900 });
    await expectCandidateColumns(list, count);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test('Tab follows candidates down the first column before entering the second', async ({ page }) => {
  await page.goto(MUNICIPAL);
  const list = page.locator('[data-related-election="city-council"] .related-candidates__list');
  await expectCandidateColumns(list, page.viewportSize()!.width > 672 ? 2 : 1);
  const links = list.getByRole('link');
  await links.first().focus();
  for (let index = 1; index < await links.count(); index += 1) {
    await page.keyboard.press('Tab');
    await expect(links.nth(index)).toBeFocused();
  }
});

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
