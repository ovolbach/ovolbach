import { describe, expect, it } from 'vitest';
import { listPublishedElectionContexts, type ElectionContext } from '../../src/lib/load-guide-data';
import { assembleRegionalContext } from '../../src/lib/regional-context';
import { getRelatedCandidateGroups } from '../../src/lib/related-candidates';
import { baseCandidate, baseCandidacy, baseElection, baseSource, makeGuideData } from '../fixtures/guide-data';

const contexts = await listPublishedElectionContexts();
const lm = contexts.find((context) => context.citySlug === 'liptovsky-mikulas')!;
const region = assembleRegionalContext(contexts.filter((context) => context.regionSlug === 'zilinsky-kraj'));

const district = {
  id: 'district-1', kind: 'city' as const, number: 1, name: 'Obvod 1', seats: 4,
  areas: [], pollingStations: [], sourceIds: [baseSource.id],
};
const own = { ...baseCandidacy, electionId: 'city-council' as const, contestId: '2026-lm-city-council', districtId: district.id };
const first = { ...own, id: 'first', candidateId: 'first', ballotNumber: 2, displayNameOfficial: 'Prvý KANDIDÁT, Ing.' };
const last = { ...own, id: 'last', candidateId: 'last', ballotNumber: 9, sourceIds: ['roster-2'] };
const fixture: ElectionContext = {
  ...lm,
  data: makeGuideData({
    candidates: [baseCandidate, ...['first', 'last', 'outside'].map((id) => ({ ...baseCandidate, id, slug: id, displayName: id }))],
    candidacies: [last, own, first,
      { ...own, id: 'other-contest', candidateId: 'outside', contestId: '2026-other-city-council' },
      { ...own, id: 'other-district', candidateId: 'outside', districtId: 'district-2' },
    ],
    elections: [{ ...baseElection, id: 'city-council', contestId: own.contestId }],
    districts: [district],
    sources: [baseSource, { ...baseSource, id: 'roster-2', url: 'https://example.com/roster-2' }],
  }),
};

describe('other candidates in the same elections', () => {
  it('shows every candidacy of a municipal candidate with complete district lists', () => {
    const groups = getRelatedCandidateGroups(lm, 'candidate-1', contexts);
    expect(groups.map((group) => [group.electionId, group.candidates.length])).toEqual([
      ['mayor', 2], ['city-council', 13], ['region-council', 29],
    ]);
    for (const group of groups) {
      expect(group.candidates.some((candidate) => candidate.candidateId === 'candidate-1')).toBe(false);
      expect(new Set(group.candidates.map((candidate) => candidate.candidateId)).size).toBe(group.candidates.length);
      const numbers = group.candidates.map((candidate) => candidate.ballotNumber);
      expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    }
  });

  it('restores full municipal rosters for a shared regional profile and puts the chair ballot first', () => {
    const groups = getRelatedCandidateGroups(region, 'candidate-89', contexts);
    expect(groups.map((group) => [group.electionId, group.candidates.length])).toEqual([
      ['region-chair', 6], ['city-council', 12], ['region-council', 82],
    ]);
    expect(groups[0]!.candidates.every((candidate) => candidate.href.startsWith('/zilinsky-kraj/2026/kandidat/'))).toBe(true);
    expect(groups[1]!.districtName).toBeDefined();
    expect(groups[1]!.candidates.some((candidate) => candidate.href.startsWith('/zilina/2026/kandidat/'))).toBe(true);
  });

  it('matches both contest and district, sorts ballot numbers and preserves official names', () => {
    const [group] = getRelatedCandidateGroups(fixture, baseCandidate.id, [fixture]);
    expect(group?.candidates).toEqual([
      { candidateId: 'first', displayName: 'Prvý KANDIDÁT, Ing.', ballotNumber: 2, href: '/liptovsky-mikulas/2026/kandidat/first/' },
      { candidateId: 'last', displayName: 'last', ballotNumber: 9, href: '/liptovsky-mikulas/2026/kandidat/last/' },
    ]);
    expect(group?.districtName).toBe('Obvod 1');
    expect(group?.sources.map((source) => source.id)).toEqual(['source-1', 'roster-2']);
  });

  it('excludes draft contexts and other regions or years even when identifiers coincide', () => {
    const other = { ...fixture, citySlug: 'aaa', basePath: '/aaa/2026/' };
    const regionalFixture = { ...region, data: fixture.data };
    const groups = getRelatedCandidateGroups(regionalFixture, baseCandidate.id, [
      { ...other, status: 'draft' }, { ...other, regionSlug: 'other-region' }, { ...other, year: 2030 }, fixture,
    ]);
    expect(groups[0]!.candidates[0]!.href).toBe('/liptovsky-mikulas/2026/kandidat/first/');
  });

  it('prefers the current city and otherwise selects a context by city slug without repeating candidates', () => {
    const other = { ...fixture, citySlug: 'aaa', basePath: '/aaa/2026/' };
    const published = [other, fixture, fixture];
    expect(getRelatedCandidateGroups(fixture, baseCandidate.id, published)[0]!.candidates[0]!.href)
      .toBe('/liptovsky-mikulas/2026/kandidat/first/');
    const groups = getRelatedCandidateGroups({ ...region, data: fixture.data }, baseCandidate.id, published);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.candidates).toHaveLength(2);
    expect(groups[0]!.candidates[0]!.href).toBe('/aaa/2026/kandidat/first/');
  });

  it('omits an election when the person is its only candidate', () => {
    const alone = { ...fixture, data: { ...fixture.data, candidacies: [own] } };
    expect(getRelatedCandidateGroups(alone, baseCandidate.id, [alone])).toEqual([]);
  });

  it('fails closed when a roster source is missing', () => {
    const missingSource = { ...fixture, data: { ...fixture.data, sources: [baseSource] } };
    expect(() => getRelatedCandidateGroups(missingSource, baseCandidate.id, [missingSource])).toThrow('unknown source ID roster-2');
  });
});
