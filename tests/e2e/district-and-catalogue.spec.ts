import { expect, test } from '@playwright/test';
const BASE = '/liptovsky-mikulas/2026/';

test('district selection is encoded only in the URL', async ({ page, context }) => {
  await page.goto(`${BASE}?obvod=district-4`);

  await expect(page.locator('[data-district="2026-lm-city-4"] [data-district-facts]')).toContainText(/Okoličné.*Stošice/);
  await expect(page.getByLabel('Volebný obvod')).toHaveValue('district-4');
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })))
    .toEqual({ local: 0, session: 0 });
});

test('catalogue filters candidates without changing their official order', async ({ page }) => {
  await page.goto(`${BASE}kandidati/?volby=city-council&obvod=district-4`);

  await expect(page.locator('[data-candidate-card]:visible')).toHaveCount(5);
  await expect(page.locator('[data-candidate-card]:visible [data-ballot-number]').first()).toHaveText('1');
  await expect(page.locator('[data-candidate-card] .candidate-card__history')).toHaveCount(0);
});

test('overview renders shared ballots once and district-specific city ballots', async ({ page }) => {
  await page.goto(`${BASE}?obvod=district-4`);

  await expect(page.locator('[data-ballot-section]')).toHaveCount(11);
  await expect(page.locator('[data-candidate-card]')).toHaveCount(109);
  for (const election of ['mayor', 'region-chair', 'region-council']) {
    const section = page.locator(`[data-ballot-section][data-election="${election}"]`);
    await expect(section).toHaveCount(1);
    await expect(section).toBeVisible();
    await expect(section.locator(':scope > h3')).toHaveCount(1);
    await expect(section.locator('[data-candidate-card] h4').first()).toBeVisible();
  }
  await expect(page.locator('[data-district="2026-lm-city-4"] [data-ballot-section]:visible')).toHaveCount(1);
  await expect(page.locator('[data-district="2026-lm-city-4"] [data-election="city-council"] [data-candidate-card]')).toHaveCount(5);
  await expect(page.locator('[data-district="2026-lm-city-4"] [data-election="city-council"]')).not.toContainText('Katarína ČÁPOVÁ');
  await expect(page.locator('[data-district="2026-lm-city-4"] [data-ballot-section]:visible').evaluateAll(
    (sections) => sections.map((section) => section.getAttribute('data-ballot-id')),
  )).resolves.toEqual(['city-council']);
  await expect(page.locator('[data-district="2026-lm-city-4"] [data-election="city-council"] [data-candidate-card]').evaluateAll(
    (cards) => cards.map((card) => card.getAttribute('data-candidate-id')),
  )).resolves.toEqual(['candidate-49', 'candidate-50', 'candidate-51', 'candidate-52', 'candidate-53']);
  await expect(page.locator('[data-district="2026-lm-city-4"] [data-district-facts] h2')).toHaveText('Volebný obvod č. 4');
  await expect(page.locator('[data-district="2026-lm-city-4"] [data-election="city-council"] h3')).toHaveCount(1);
  expect(await page.locator('[data-district="2026-lm-city-4"] [data-election="city-council"] [data-candidate-card] h4').allTextContents())
    .toEqual(['Peter BONKO, Bc.', 'Šimon CUPRA, Ing.', 'Jaroslav GREŠO', 'Marian MATEJKA', 'Jozef REPASKÝ, Bc.']);

  const blchac = page.locator('[data-election="mayor"] [data-candidate-id="candidate-1"]');
  await expect(page.locator('[data-candidate-card] .candidate-card__history')).toHaveCount(0);
  await expect(blchac.locator('a').first()).toHaveAttribute('href', `${BASE}kandidat/jan-blchac/`);
  await expect(blchac.locator('[data-source-attribution] a').first()).toHaveAttribute('href', /^https:/);
});

test('district selection survives reload and uses a neutral fallback for invalid URL state', async ({ page }) => {
  await page.goto(`${BASE}?obvod=district-4`);
  await page.reload();
  await expect(page.locator('[data-district="2026-lm-city-4"] [data-district-facts]')).toContainText(/Okoličné.*Stošice/);

  await page.goto(`${BASE}?obvod=not-a-district`);
  await expect(page.getByRole('status')).toContainText('Neplatný volebný obvod');
  await page.goto(`${BASE}?obvod=city-4`);
  await expect(page.getByRole('status')).toContainText('Neplatný volebný obvod');
  await expect(page.locator('[data-district]:visible')).toHaveCount(0);
});

test('missing district URL starts in a neutral collapsed state', async ({ page }) => {
  await page.goto(BASE);

  await expect(page.getByRole('status')).toHaveText('Vyberte volebný obvod.');
  await expect(page.locator('[data-district][open]')).toHaveCount(0);
  await expect(page.locator('[data-district] [data-candidate-card]:visible')).toHaveCount(0);
});

test('no-JS GET fallback targets exactly district 4 in official ballot and candidate order', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(BASE);

  await page.getByRole('button', { name: 'Obvod č. 4' }).click();
  await expect(page).toHaveURL(/\?obvod=district-4#district-4$/);
  const district = page.locator('#district-4');
  await expect(page.locator('[data-district]:visible')).toHaveCount(1);
  await expect(district.locator('[data-ballot-section]').evaluateAll(
    (sections) => sections.map((section) => section.getAttribute('data-ballot-id')),
  )).resolves.toEqual(['city-council']);
  await expect(page.locator('[data-ballot-section][data-election="mayor"]')).toHaveCount(1);
  await expect(district.locator('[data-election="city-council"] [data-candidate-card]').evaluateAll(
    (cards) => cards.map((card) => card.getAttribute('data-candidate-id')),
  )).resolves.toEqual(['candidate-49', 'candidate-50', 'candidate-51', 'candidate-52', 'candidate-53']);
  await expect(page.locator('[data-district]:not(:target) [data-candidate-card]:visible')).toHaveCount(0);
  expect(await page.locator('[data-district]:not(:target) a').first().evaluate((link) => {
    (link as HTMLElement).focus();
    return document.activeElement === link;
  })).toBe(false);
  await context.close();
});

test('district selection creates no browser storage or cross-origin requests', async ({ page, context }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto(`${BASE}?obvod=district-4`);
  expect(await context.cookies()).toEqual([]);
  await expect(page.evaluate(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    indexed: (await indexedDB.databases()).length,
  }))).resolves.toEqual({ local: 0, session: 0, indexed: 0 });
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4321')).toBe(true);
});

test('Back and Forward reapply selection from the URL', async ({ page }) => {
  await page.goto(`${BASE}?obvod=district-4`);
  await page.getByLabel('Volebný obvod').selectOption('district-5');
  await expect(page.locator('[data-district="2026-lm-city-5"] [data-district-facts]')).toContainText(/Iľanovo.*Ploštín/);
  await page.goBack();
  await expect(page.locator('[data-district="2026-lm-city-4"] [data-district-facts]')).toContainText(/Okoličné.*Stošice/);
  await page.goForward();
  await expect(page.locator('[data-district="2026-lm-city-5"] [data-district-facts]')).toContainText(/Iľanovo.*Ploštín/);
});
