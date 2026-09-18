import { expect, test } from '@playwright/test';
import { CORRECTIONS_EMAIL, SITE_TITLE } from '../../src/config/site';

const LEGAL_NOTICE =
  'Tento web nikoho nevyzýva, aby volil alebo nevolil konkrétneho kandidáta, politickú stranu alebo koalíciu. Iba zhromažďuje a sprístupňuje verejne dostupné informácie z otvorených zdrojov a odkazuje na pôvodných vydavateľov. Pri používaní citácií a osobných údajov rešpektuje autorské práva a pravidlá ochrany osobných údajov podľa GDPR. Žiadosť o opravu alebo odstránenie údajov: info@ovolbach.sk.';

test('renders Slovak metadata, navigation, and legal notice', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'sk');
  await expect(page).toHaveTitle(SITE_TITLE);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Nezávislý sprievodca komunálnymi voľbami v Liptovskom Mikuláši.',
  );
  await expect(page.getByRole('banner')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Hlavná navigácia' })).toBeVisible();
  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByRole('contentinfo')).toBeVisible();
  await expect(page.getByRole('contentinfo').locator('p').first()).toHaveText(LEGAL_NOTICE);
  await expect(page.getByRole('link', { name: CORRECTIONS_EMAIL })).toHaveAttribute(
    'href',
    `mailto:${CORRECTIONS_EMAIL}`,
  );

  const skipLink = page.getByRole('link', { name: 'Preskočiť na obsah' });
  await expect(skipLink).toHaveAttribute('href', '#main-content');
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});
