import { describe, expect, it } from 'vitest';
import candidates from '../../src/data/elections/2026/zilinsky-kraj/candidates.json';

function slugifyName(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
}

describe('public candidate URLs', () => {
  it('uses readable name slugs and disambiguates both pairs of namesakes', () => {
    const urbanovic = candidates.filter((candidate) => slugifyName(`${candidate.givenName} ${candidate.familyName}`) === 'rudolf-urbanovic');
    expect(urbanovic.map((candidate) => candidate.slug).sort()).toEqual([
      'rudolf-urbanovic-ing',
      'rudolf-urbanovic-ma',
    ]);
    const stanovsky = candidates.filter((candidate) => slugifyName(`${candidate.givenName} ${candidate.familyName}`) === 'martin-stanovsky');
    expect(stanovsky.map((candidate) => candidate.slug).sort()).toEqual(['martin-stanovsky-30', 'martin-stanovsky-53']);
    const namesakes = [...urbanovic, ...stanovsky];

    for (const candidate of candidates.filter((item) => !namesakes.includes(item))) {
      expect(candidate.slug, candidate.id).toBe(slugifyName(`${candidate.givenName} ${candidate.familyName}`));
    }
  });
});
