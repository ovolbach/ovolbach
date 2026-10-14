import { describe, expect, it } from 'vitest';
import candidates from '../../src/data/elections/2026/zilinsky-kraj/candidates.json';

function slugifyName(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, '');
}

describe('public candidate URLs', () => {
  it('uses readable name slugs and disambiguates all namesakes', () => {
    const urbanovic = candidates.filter((candidate) => slugifyName(`${candidate.givenName} ${candidate.familyName}`) === 'rudolf-urbanovic');
    expect(urbanovic.map((candidate) => candidate.slug).sort()).toEqual([
      'rudolf-urbanovic-ing',
      'rudolf-urbanovic-ma',
    ]);
    const stanovsky = candidates.filter((candidate) => slugifyName(`${candidate.givenName} ${candidate.familyName}`) === 'martin-stanovsky');
    expect(stanovsky.map((candidate) => candidate.slug).sort()).toEqual(['martin-stanovsky-30', 'martin-stanovsky-53']);
    const groups = new Map<string, typeof candidates>();
    for (const candidate of candidates) {
      const name = slugifyName(`${candidate.givenName} ${candidate.familyName}`);
      groups.set(name, [...(groups.get(name) ?? []), candidate]);
    }
    for (const [name, people] of groups) {
      if (people.length === 1) expect(people[0]!.slug, people[0]!.id).toBe(name);
      else {
        expect(new Set(people.map((row) => row.slug)).size).toBe(people.length);
        for (const person of people) expect(person.slug, person.id).toMatch(new RegExp(`^${name}(?:-[a-z0-9-]+)?$`));
      }
    }
  });
});
