import { describe, expect, it } from 'vitest';
import { CORRECTIONS_EMAIL, ELECTION_DATE, SITE_URL } from '../../src/config/site';

describe('site configuration', () => {
  it('uses the approved public identity', () => {
    expect(SITE_URL).toBe('https://ovolbach.sk');
    expect(ELECTION_DATE).toBe('2026-10-24');
    expect(CORRECTIONS_EMAIL).toBe('info@ovolbach.sk');
  });
});
