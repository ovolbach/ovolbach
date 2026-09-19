import { describe, expect, it } from 'vitest';
import type { GuideData } from '../../src/lib/schemas';
import {
  getBallotsForDistrict,
  getCandidateProfile,
  getComparisonRows,
  getSourceRegister,
} from '../../src/lib/selectors';
import { makeGuideData, baseCandidate, baseCandidacy, baseClaim, baseElection, baseSource } from '../fixtures/guide-data';

const candidateTwo = {
  ...baseCandidate,
  id: 'jan-blchac',
  slug: 'jan-blchac',
  displayName: 'Ján Blcháč',
  sourceIds: ['missing-source'],
};

const fixture: GuideData = makeGuideData({
  candidates: [{ ...baseCandidate, id: 'peter-bonko', slug: 'peter-bonko' }, candidateTwo],
  districts: [{
    id: 'district-4', kind: 'city', number: 4, name: 'Obvod 4', seats: 1,
    areas: [], pollingStations: [], sourceIds: [baseSource.id],
  }, {
    id: 'zsk-5', kind: 'region', number: 5, name: 'ŽSK obvod 5', seats: 1,
    areas: [], pollingStations: [], sourceIds: [baseSource.id],
  }, {
    id: 'zsk-6', kind: 'region', number: 6, name: 'ŽSK obvod 6', seats: 1,
    areas: [], pollingStations: [], sourceIds: [baseSource.id],
  }],
  elections: [baseElection, {
    ...baseElection, id: 'city-council', title: { sk: 'Mestské zastupiteľstvo' }, maxSelections: 'district_seats',
  }, {
    ...baseElection, id: 'region-chair', title: { sk: 'Predseda ŽSK' }, level: 'region',
  }, {
    ...baseElection, id: 'region-council', title: { sk: 'Zastupiteľstvo ŽSK' }, level: 'region', maxSelections: 'district_seats',
  }],
  candidacies: [
    { ...baseCandidacy, id: 'mayor-peter', candidateId: 'peter-bonko', ballotNumber: 2 },
    { ...baseCandidacy, id: 'city-peter', candidateId: 'peter-bonko', electionId: 'city-council', districtId: 'district-4', ballotNumber: 2 },
    { ...baseCandidacy, id: 'city-jan', candidateId: 'jan-blchac', electionId: 'city-council', districtId: 'district-9', ballotNumber: 1 },
    { ...baseCandidacy, id: 'mayor-jan', candidateId: 'jan-blchac', ballotNumber: 1 },
    { ...baseCandidacy, id: 'region-chair-jan', candidateId: 'jan-blchac', electionId: 'region-chair', ballotNumber: 1 },
    { ...baseCandidacy, id: 'region-peter', candidateId: 'peter-bonko', electionId: 'region-council', districtId: 'zsk-5', ballotNumber: 1 },
    { ...baseCandidacy, id: 'region-jan-unrelated', candidateId: 'jan-blchac', electionId: 'region-council', districtId: 'zsk-6', ballotNumber: 1 },
  ],
  claims: [
    { ...baseClaim, id: 'claim-late', candidateId: 'peter-bonko', period: '2026-02' },
    { ...baseClaim, id: 'claim-early', candidateId: 'peter-bonko', period: '2025-01' },
    {
      ...baseClaim,
      id: 'claim-election-win',
      candidateId: 'peter-bonko',
      category: 'previous_elections',
      kind: 'election_result',
      period: '2022',
      election: { contestId: 'oso-mayor-2022', office: 'mayor', outcome: 'elected' },
    },
  ],
  sources: [
    { ...baseSource, id: 'source-z', publisher: 'Žurnál', title: 'Z', publishedAt: '2026-03-01' },
    { ...baseSource, id: 'source-a2', publisher: 'Aktuality', title: 'B', publishedAt: '2026-02-01' },
    { ...baseSource, id: 'source-a1', publisher: 'Aktuality', title: 'A', publishedAt: '2026-02-01' },
  ],
  researchCoverage: [
    { id: 'coverage-peter-basic', candidateId: 'peter-bonko', category: 'basic', status: 'pending', sourceIds: [] },
    { id: 'coverage-jan-basic', candidateId: 'jan-blchac', category: 'basic', status: 'searched_none', sourceIds: [baseSource.id] },
  ],
});

describe('guide selectors', () => {
  it('returns four canonical ballots for a city district and maps region council to ŽSK district 5', () => {
    const ballots = getBallotsForDistrict(fixture, 'district-4', 'zsk-5');
    expect(ballots.map((ballot) => ballot.election.id)).toEqual([
      'mayor', 'city-council', 'region-chair', 'region-council',
    ]);
    expect(ballots[1]!.candidates.map((candidate) => candidate.id)).toEqual(['peter-bonko']);
    expect(ballots[2]!.candidates.map((candidate) => candidate.id)).toEqual(['jan-blchac']);
    expect(ballots[3]!.candidates.map((candidate) => candidate.id)).toEqual(['peter-bonko']);
    expect(ballots[3]!.candidates.map((candidate) => candidate.candidacy.districtId)).toEqual(['zsk-5']);
    expect(ballots[0]!.candidates.map((candidate) => candidate.id)).toEqual(['jan-blchac', 'peter-bonko']);
    expect(ballots[0]!.candidates[1]!.electionHistory).toEqual({
      participations: 1,
      wins: 1,
      deputyWins: 0,
      mayorWins: 1,
      regionalChairWins: 0,
      presidentWins: 0,
      sourceIds: ['source-1'],
    });
  });

  it('uses the only regional district in a city context even when its number is 8', () => {
    const ruzomberok = {
      ...fixture,
      districts: [fixture.districts[0]!, { ...fixture.districts[1]!, id: 'zsk-8', number: 8 }],
      candidacies: fixture.candidacies.map((candidacy) => candidacy.districtId === 'zsk-5'
        ? { ...candidacy, districtId: 'zsk-8' } : candidacy),
    };
    const ballots = getBallotsForDistrict(ruzomberok, 'district-4', 'zsk-8');
    expect(ballots[3]!.district?.id).toBe('zsk-8');
    expect(ballots[3]!.candidates.map((candidate) => candidate.candidacy.districtId)).toEqual(['zsk-8']);
  });

  it('throws for an unknown district', () => {
    expect(() => getBallotsForDistrict(fixture, 'missing-district', 'zsk-5')).toThrow('Unknown district: missing-district');
  });

  it('rejects a city district when regional district 5 is missing or ambiguous', () => {
    const missingRegional = { ...fixture, districts: fixture.districts.filter((district) => district.id !== 'zsk-5') };
    const ambiguousRegional = { ...fixture, districts: [...fixture.districts, { ...fixture.districts[1]! }] };
    expect(() => getBallotsForDistrict(missingRegional, 'district-4', 'zsk-5')).toThrow('Expected exactly one regional district: zsk-5');
    expect(() => getBallotsForDistrict(ambiguousRegional, 'district-4', 'zsk-5')).toThrow('Expected exactly one regional district: zsk-5');
  });

  it('keeps an expected ballot when it has no candidates', () => {
    const withoutRegionChair = {
      ...fixture,
      candidacies: fixture.candidacies.filter((candidacy) => candidacy.electionId !== 'region-chair'),
    };
    const ballots = getBallotsForDistrict(withoutRegionChair, 'district-4', 'zsk-5');
    expect(ballots.map((ballot) => ballot.election.id)).toEqual([
      'mayor', 'city-council', 'region-chair', 'region-council',
    ]);
    expect(ballots[2]!.candidates).toEqual([]);
  });

  it('joins every ballot for a candidate and sorts claims deterministically', () => {
    const profile = getCandidateProfile(fixture, 'peter-bonko');
    expect(profile.candidacies.map((candidacy) => candidacy.id)).toEqual([
      'mayor-peter', 'city-peter', 'region-peter',
    ]);
    expect(profile.claims.map((claim) => claim.id)).toEqual(['claim-early', 'claim-late', 'claim-election-win']);
  });

  it('throws for an unknown candidate', () => {
    expect(() => getCandidateProfile(fixture, 'missing-candidate')).toThrow('Unknown candidate: missing-candidate');
  });

  it('preserves equal comparison categories for missing facts and input order', () => {
    const rows = getComparisonRows(fixture, ['peter-bonko', 'jan-blchac']);
    expect(rows).toHaveLength(8);
    expect(rows[0]!.cells).toHaveLength(2);
    expect(rows[0]!.cells.map((cell) => cell.candidateId)).toEqual(['peter-bonko', 'jan-blchac']);
    expect(rows[0]!.cells.map((cell) => cell.researchCoverage?.status)).toEqual(['pending', 'searched_none']);
  });

  it('returns no comparison rows for empty input', () => {
    expect(getComparisonRows(fixture, [])).toEqual([]);
  });

  it('throws for an unknown comparison candidate', () => {
    expect(() => getComparisonRows(fixture, ['missing-candidate'])).toThrow('Unknown candidate: missing-candidate');
  });

  it('sorts source register and preserves invalid source references on joined records', () => {
    expect(getSourceRegister(fixture).map((source) => source.id)).toEqual(['source-a1', 'source-a2', 'source-z']);
    expect(getCandidateProfile(fixture, 'jan-blchac').candidate.sourceIds).toEqual(['missing-source']);
  });
});
