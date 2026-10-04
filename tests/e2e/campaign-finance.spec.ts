import { expect, test } from '@playwright/test';
import { loadElectionContext } from '../../src/lib/load-guide-data';
import { candidateProfilePath } from '../../src/lib/regional-context';

const context = await loadElectionContext({ citySlug: 'liptovsky-mikulas', year: 2026 });
const { candidates } = context.data;
const profileFor = (slug: string) => candidateProfilePath(context, candidates.find((candidate) => candidate.slug === slug)!.id);

const BASE = '/liptovsky-mikulas/2026/kandidat/';
test('independent-only profiles expose candidate finance without a party-account alternative', async ({ page }) => {
  const independentSlugs = ['matej-blanar', 'lucia-cukerova', 'gabriel-slavkovsky', 'andrea-zidekova', 'juraj-paska', 'michal-paska', 'peter-bonko', 'marian-matejka', 'peter-gartner', 'marta-jancusova', 'lucia-zahorska', 'tomas-martaus', 'petra-mudronova', 'juraj-piatka', 'branislav-treger', 'martin-kapitulik'];
  for (const slug of independentSlugs) {
    await page.goto(profileFor(slug));
    const finance = page.locator('[data-campaign-finance]');
    await expect(finance.getByRole('heading', { name: 'Transparentné účty a správy politických strán' })).toHaveCount(0);
    await expect(finance.locator('[data-party-account]')).toHaveCount(0);
    await expect(finance).not.toContainText('či výdavky znáša kandidát, politická strana alebo obaja');
    await expect(finance).not.toContainText('Samotná nominácia stranou');
    await expect(finance).not.toContainText('účet a správa strany');
    await expect(finance.locator('a[href*="najcastejsie-otazky-a-odpovede-pre-politicke-strany"]')).toHaveCount(0);
    await expect(finance).toContainText('Transparentný účet kandidáta');
    await expect(finance).toContainText('§ 6 ods. 8');
  }
  await page.goto(profileFor('martin-kapitulik'));
  await expect(page.locator('[data-personal-account]')).toHaveCount(1);
  await expect(page.locator('[data-finance-report-duty]')).toHaveAttribute('data-finance-report-duty', 'required');
  await page.goto(`${BASE}peter-bonko/`);
  await expect(page.locator('[data-campaign-finance]')).toContainText('Pre samostatnú poslaneckú kandidatúru sa nevyžaduje');
});
test('mixed candidacies retain party accounts with the specific party nomination', async ({ page }) => {
  await page.goto(`${BASE}tomas-medved/`);
  const finance = page.locator('[data-campaign-finance]');
  await expect(finance.locator('[data-party-account]')).toHaveCount(2);
  await expect(finance.locator('[data-party-nominations]')).toContainText('Voľby do Mestského zastupiteľstva mesta Liptovský Mikuláš');
  await expect(finance.locator('[data-party-nominations]')).toContainText('Hlas - sociálna demokracia, Smer - sociálna demokracia');
  await expect(finance.locator('[data-party-nominations]')).not.toContainText('Voľby poslancov do zastupiteľstva Žilinského samosprávneho kraja');
});
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
test('council duties remain explicit and the rechecked chair account is linked', async ({ page }) => {
  await page.goto(`${BASE}peter-bonko/`);
  await expect(page.locator('[data-campaign-finance]')).toContainText('Pre samostatnú poslaneckú kandidatúru sa nevyžaduje');
  await expect(page.locator('[data-campaign-finance]')).toContainText('ďalších kandidatúr');
  await page.goto(profileFor('anna-belousovova'));
  await expect(page.locator('[data-campaign-finance] [data-personal-account]')).toHaveAttribute('href', 'https://ib.fio.sk/ib/transparent?a=2603546837');
  await expect(page.locator('[data-campaign-finance]')).toContainText('2026-10-04');
});
test('every profile includes finance without contacting bank or party sites', async ({ page, baseURL }) => {
  const externalRequests: string[] = [];
  page.on('request', (request) => { if (new URL(request.url()).origin !== new URL(baseURL!).origin) externalRequests.push(request.url()); });
  for (const candidate of candidates) {
    await page.goto(candidateProfilePath(context, candidate.id));
    await expect(page.locator('[data-campaign-finance]')).toHaveCount(1);
  }
  expect(externalRequests).toEqual([]);
});
