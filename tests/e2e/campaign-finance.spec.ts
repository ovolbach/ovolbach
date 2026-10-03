import { expect, test } from '@playwright/test';
import candidates from '../../src/data/elections/2026/zilinsky-kraj/candidates.json' with { type: 'json' };

const BASE = '/liptovsky-mikulas/2026/kandidat/';
test('finance distinguishes personal and coalition accounts and shows the sourced reporting deadline', async ({ page }) => {
  await page.goto(`${BASE}jan-blchac/`);
  const finance = page.locator('[data-campaign-finance]');
  await expect(finance.getByRole('heading', { name: 'Financovanie volebnej kampane' })).toBeVisible();
  await expect(finance.locator('[data-personal-account]')).toHaveAttribute('href', 'https://ib.vub.sk/pch/transparentne-ucty?iban=SK1502000000007284370653&CN');
  await expect(finance.locator('[data-party-account]')).toHaveCount(2);
  await expect(finance).toContainText('Domov národná strana');
  await expect(finance).toContainText('23. 11. 2026');
  await expect(finance).toContainText('Lehota ešte neuplynula');
  await expect(finance).toContainText('181/2014');
  await expect(finance).toContainText('§ 6 ods. 8');
  await expect(finance).toContainText('2026-10-03');
});
test('council roles and unverified identity remain explicit without publishing an ambiguous personal account', async ({ page }) => {
  await page.goto(`${BASE}peter-bonko/`);
  await expect(page.locator('[data-campaign-finance]')).toContainText('Pre samostatnú poslaneckú kandidatúru sa nevyžaduje');
  await expect(page.locator('[data-campaign-finance]')).toContainText('ďalších kandidatúr');
  await page.goto(`${BASE}anna-belousovova/`);
  await expect(page.locator('[data-campaign-finance] [data-personal-account]')).toHaveCount(0);
  await expect(page.locator('[data-campaign-finance]')).toContainText('dvoma ďalšími identifikačnými údajmi');
});
test('every profile includes finance without contacting bank or party sites', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => { if (new URL(request.url()).origin !== 'http://127.0.0.1:4321') externalRequests.push(request.url()); });
  for (const candidate of candidates) {
    await page.goto(`${BASE}${candidate.slug}/`);
    await expect(page.locator('[data-campaign-finance]')).toHaveCount(1);
  }
  expect(externalRequests).toEqual([]);
});
