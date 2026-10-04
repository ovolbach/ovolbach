import { describe, expect, it } from 'vitest';
import { listPublishedElectionContexts } from '../../src/lib/load-guide-data';
import { assembleRegionalContext } from '../../src/lib/regional-context';
import { getRegionalChairBallot } from '../../src/lib/selectors';

const region = assembleRegionalContext(await listPublishedElectionContexts());

describe('regional overview chair ballot', () => {
  it('shows seven chair candidates in ballot order without duplicating their council candidacies', () => {
    const data = { ...region.data, candidacies: region.data.candidacies.slice().reverse() };
    const ballot = getRegionalChairBallot(data);
    expect(ballot.election.id).toBe('region-chair');
    expect(ballot.district).toBeUndefined();
    expect(ballot.candidates.map((candidate) => candidate.candidacy.ballotNumber)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(new Set(ballot.candidates.map((candidate) => candidate.id)).size).toBe(7);
    expect(ballot.candidates.filter((candidate) => candidate.id === 'candidate-89')).toHaveLength(1);
    expect(ballot.candidates.filter((candidate) => candidate.id === 'candidate-90')).toHaveLength(1);
    for (const candidate of ballot.candidates) {
      expect(candidate.candidacy.electionId).toBe('region-chair');
      expect(candidate.candidacy.sourceIds.length).toBeGreaterThan(0);
      expect(candidate.sourceIds.length).toBeGreaterThan(0);
    }
  });

  it('keeps the sourced election when the chair ballot has no candidates', () => {
    const ballot = getRegionalChairBallot({ ...region.data, candidacies: [] });
    expect(ballot.candidates).toEqual([]);
    expect(ballot.election).toEqual(region.data.elections.find((election) => election.id === 'region-chair'));
  });

  it('rejects a missing or ambiguous chair election instead of choosing another contest', () => {
    const chair = region.data.elections.find((election) => election.id === 'region-chair')!;
    expect(() => getRegionalChairBallot({ ...region.data, elections: [] })).toThrow('Expected exactly one election: region-chair');
    expect(() => getRegionalChairBallot({ ...region.data, elections: [...region.data.elections, chair] }))
      .toThrow('Expected exactly one election: region-chair');
  });
});
