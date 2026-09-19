import { describe, expect, it } from 'vitest';
import candidates from '../../src/data/elections/2026/zilinsky-kraj/candidates.json';
import candidacies from '../../src/data/elections/2026/zilinsky-kraj/candidacies.json';
import districts from '../../src/data/elections/2026/zilinsky-kraj/districts.json';
import elections from '../../src/data/elections/2026/zilinsky-kraj/elections.json';

const selectionLimit = (id: string) => elections.find((election) => election.id === id)?.maxSelections;

describe('official 2026 election roster', () => {
  it('contains all eight city districts with the approved seat counts', () => {
    expect(districts.filter((district) => district.kind === 'city')
      .sort((a, b) => a.number - b.number).map((district) => district.seats))
      .toEqual([4, 7, 7, 1, 1, 1, 3, 1]);
  });

  it('uses the correct selection limits', () => {
    expect(selectionLimit('mayor')).toBe(1);
    expect(selectionLimit('city-council')).toBe('district_seats');
    expect(selectionLimit('region-chair')).toBe(1);
    expect(selectionLimit('region-council')).toBe('district_seats');
  });

  it('uses a region-wide source for the shared regional-council contest', () => {
    expect(elections.find((election) => election.id === 'region-council')?.sourceIds)
      .toEqual(['zsk-districts-seats-2026']);
  });

  it.each(['mayor', 'city-council', 'region-chair', 'region-council'])('%s has registered candidates', (id) => {
    expect(candidacies.some((item) => item.electionId === id)).toBe(true);
  });

  it('preserves exact official spelling for the seventh ŽSK chair candidate', () => {
    expect(candidates.find((candidate) => candidate.id === 'candidate-91')).toMatchObject({
      displayName: 'Milan POVA, Ing.', familyName: 'POVA', slug: 'milan-pova-ing',
    });
    expect(candidacies.find((candidacy) => candidacy.id === 'candidacy-106')?.candidateId).toBe('candidate-91');
  });

  it('normalizes the Palúdzka street ligature', () => {
    const coverage = districts.find((district) => district.id === '2026-lm-city-7')?.pollingStations
      .find((station) => station.number === 27)?.coverage;
    expect(coverage).toContain('Žuffova');
    expect(coverage).not.toContain('Žuﬀova');
  });
});
