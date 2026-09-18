import { expect, test } from '@playwright/test';

test('district selection is encoded only in the URL', async ({ page, context }) => {
  await page.goto('/?obvod=district-4');

  await expect(page.getByRole('heading', { name: /Okoličné.*Stošice/ })).toBeVisible();
  await expect(page.getByLabel('Volebný obvod')).toHaveValue('district-4');
  expect(await context.cookies()).toEqual([]);
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length })))
    .toEqual({ local: 0, session: 0 });
});

test('catalogue filters candidates without changing their official order', async ({ page }) => {
  await page.goto('/kandidati/?volby=city-council&obvod=district-4');

  await expect(page.locator('[data-candidate-card]:visible')).toHaveCount(5);
  await expect(page.locator('[data-candidate-card]:visible [data-ballot-number]').first()).toHaveText('1');
});

test('district 4 shows four ballot sections and only its five city-council candidates', async ({ page }) => {
  await page.goto('/?obvod=district-4');

  await expect(page.locator('[data-district="city-4"] [data-ballot-section]:visible')).toHaveCount(4);
  await expect(page.locator('[data-district="city-4"] [data-election="city-council"] [data-candidate-card]')).toHaveCount(5);
  await expect(page.locator('[data-district="city-4"] [data-election="city-council"]')).not.toContainText('Katarína ČÁPOVÁ');
  await expect(page.locator('[data-district="city-4"] [data-ballot-section]:visible').evaluateAll(
    (sections) => sections.map((section) => section.getAttribute('data-ballot-id')),
  )).resolves.toEqual(['mayor', 'city-council', 'region-chair', 'region-council']);
  await expect(page.locator('[data-district="city-4"] [data-election="city-council"] [data-candidate-card]').evaluateAll(
    (cards) => cards.map((card) => card.getAttribute('data-candidate-id')),
  )).resolves.toEqual(['candidate-49', 'candidate-50', 'candidate-51', 'candidate-52', 'candidate-53']);
  expect(await page.locator('[data-district="city-4"] [data-election="city-council"] [data-candidate-card] h3').allTextContents())
    .toEqual(['Peter BONKO, Bc.', 'Šimon CUPRA, Ing.', 'Jaroslav GREŠO', 'Marian MATEJKA', 'Jozef REPASKÝ, Bc.']);
});

test('district selection survives reload and uses a neutral fallback for invalid URL state', async ({ page }) => {
  await page.goto('/?obvod=district-4');
  await page.reload();
  await expect(page.getByRole('heading', { name: /Okoličné.*Stošice/ })).toBeVisible();

  await page.goto('/?obvod=not-a-district');
  await expect(page.getByRole('status')).toContainText('Neplatný volebný obvod');
  await page.goto('/?obvod=city-4');
  await expect(page.getByRole('status')).toContainText('Neplatný volebný obvod');
  await expect(page.locator('[data-district]:visible')).toHaveCount(0);
});

test('missing district URL starts in a neutral collapsed state', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('status')).toHaveText('Vyberte volebný obvod.');
  await expect(page.locator('[data-district][open]')).toHaveCount(0);
  await expect(page.locator('[data-district] [data-candidate-card]:visible')).toHaveCount(0);
});

test('no-JS GET fallback targets exactly district 4 in official ballot and candidate order', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');

  await page.getByRole('button', { name: 'Obvod č. 4' }).click();
  await expect(page).toHaveURL(/\?obvod=district-4#district-4$/);
  const district = page.locator('#district-4');
  await expect(page.locator('[data-district]:visible')).toHaveCount(1);
  await expect(district.locator('[data-ballot-section]').evaluateAll(
    (sections) => sections.map((section) => section.getAttribute('data-ballot-id')),
  )).resolves.toEqual(['mayor', 'city-council', 'region-chair', 'region-council']);
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
  await page.goto('/?obvod=district-4');
  expect(await context.cookies()).toEqual([]);
  await expect(page.evaluate(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    indexed: (await indexedDB.databases()).length,
  }))).resolves.toEqual({ local: 0, session: 0, indexed: 0 });
  expect(requests.every((url) => new URL(url).origin === 'http://127.0.0.1:4321')).toBe(true);
});

test('Back and Forward reapply selection from the URL', async ({ page }) => {
  await page.goto('/?obvod=district-4');
  await page.getByLabel('Volebný obvod').selectOption('district-5');
  await expect(page.getByRole('heading', { name: /Iľanovo.*Ploštín/ })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: /Okoličné.*Stošice/ })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { name: /Iľanovo.*Ploštín/ })).toBeVisible();
});
