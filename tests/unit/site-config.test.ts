import { describe, expect, it } from 'vitest';
import { CORRECTIONS_EMAIL, SITE_TITLE, SITE_URL } from '../../src/config/site';

describe('site configuration', () => {
  it('uses the approved public identity', () => {
    expect(SITE_URL).toBe('https://ovolbach.sk');
    expect(SITE_TITLE).toBe('Voľby v mestách a krajoch | ovolbach.sk');
    expect(CORRECTIONS_EMAIL).toBe('info@ovolbach.sk');
  });
});
