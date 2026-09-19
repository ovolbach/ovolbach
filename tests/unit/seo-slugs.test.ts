import { describe, expect, it } from 'vitest';
import candidates from '../../src/data/elections/2026/zilinsky-kraj/candidates.json';

function slugifyName(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
}

describe('public candidate URLs', () => {
  it('use readable name slugs and disambiguate the two namesakes', () => {
    const namesakes = candidates.filter((candidate) => slugifyName(`${candidate.givenName} ${candidate.familyName}`) === 'rudolf-urbanovic');
    expect(namesakes.map((candidate) => candidate.slug).sort()).toEqual([
      'rudolf-urbanovic-ing',
      'rudolf-urbanovic-ma',
    ]);

    for (const candidate of candidates.filter((item) => !namesakes.includes(item))) {
      expect(candidate.slug, candidate.id).toBe(slugifyName(`${candidate.givenName} ${candidate.familyName}`));
    }
  });
});
