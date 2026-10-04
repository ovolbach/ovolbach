import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { listElectionContextConfigs, listPublishedElectionContexts, loadElectionContext } from '../../src/lib/load-guide-data';
import { validateDataset } from '../../src/lib/validate-dataset';
import { getBallotsForDistrict, getBallotSelectionLimit } from '../../src/lib/selectors';
import officialRoster from '../fixtures/dolny-kubin-roster.json';

const loadCity = () => loadElectionContext({ citySlug: 'dolny-kubin', year: 2026 });

describe('Dolný Kubín official electorate and sourced research', () => {
  it('makes every official contest available in the city guide', async () => {
    expect((await listElectionContextConfigs()).find((config) => config.citySlug === 'dolny-kubin')).toMatchObject({
      cityName: 'Dolný Kubín', status: 'published', snapshotDate: '2026-10-03', regionalDistrictId: '2026-zsk-region-3',
    });
    expect((await listPublishedElectionContexts()).some((context) => context.basePath === '/dolny-kubin/2026/')).toBe(true);
    const { data } = await loadCity();
    expect(data.candidates).toHaveLength(59);
    expect(data.candidacies).toHaveLength(74);
    for (const [kind, count] of [['mayor', 5], ['city-council', 42], ['region-council', 20], ['region-chair', 7]] as const) {
      expect(data.candidacies.filter((row) => row.electionId === kind), kind).toHaveLength(count);
    }
    expect(data.elections.every((election) => election.electionDate === '2026-10-24')).toBe(true);
  });

  it('retains every official ballot fact and contest-specific affiliation', async () => {
    const { data } = await loadCity();
    for (const expected of officialRoster.candidacies) {
      const row = data.candidacies.find((row) => row.candidateId === expected.candidateId && row.electionId === expected.electionId);
      expect(row, `${expected.candidateId}/${expected.electionId}`).toMatchObject({
        ballotNumber: expected.ballotNumber, ageAtElection: expected.ageAtElection,
        occupationOfficial: expected.occupationOfficial, affiliations: expected.affiliations, independent: expected.independent,
      });
      expect(row?.districtId).toBe(expected.districtId ?? undefined);
      expect(row?.sourceIds).toContain(expected.sourceId);
    }
  });

  it('offers the correct candidates and seat limits for each selected district', async () => {
    const context = await loadCity();
    for (const [i, count] of [13, 17, 11, 1].entries()) {
      const districtId = `2026-dk-city-${i + 1}`;
      expect(context.data.candidacies.filter((row) => row.districtId === districtId)).toHaveLength(count);
      const ballots = getBallotsForDistrict(context.data, districtId, context.regionalDistrictId);
      expect(getBallotSelectionLimit(ballots[1]!)).toBe([5, 6, 4, 1][i]);
      expect(getBallotSelectionLimit(ballots[3]!)).toBe(3);
    }
    const stations = context.data.districts.flatMap((district) => district.pollingStations);
    expect(stations.map((station) => station.number).toSorted((a, b) => a - b)).toEqual(Array.from({ length: 18 }, (_, i) => i + 1));
    expect(stations.find((station) => station.number === 4)?.coverage).toContain('Jána Hollého');
    expect(stations.find((station) => station.number === 14)?.coverage).not.toContain('Jána Hollého');
  });

  it('separates the Stanovský namesakes and joins three Bruncková candidacies', async () => {
    const { data } = await loadCity();
    const namesakes = data.candidates.filter((candidate) => candidate.givenName === 'Martin' && candidate.familyName === 'STANOVSKÝ');
    expect(namesakes).toHaveLength(2);
    expect(new Set(namesakes.map((candidate) => candidate.slug)).size).toBe(2);
    expect(data.candidacies.filter((row) => row.candidateId === 'dk-martin-stanovsky-30').map((row) => row.ageAtElection)).toEqual([30, 30]);
    expect(data.candidacies.filter((row) => row.candidateId === 'dk-martin-stanovsky-53').map((row) => row.ageAtElection)).toEqual([53]);
    expect(data.candidacies.filter((row) => row.candidateId === 'dk-katarina-brunckova').map((row) => [row.electionId, row.ballotNumber]))
      .toEqual([['mayor', 2], ['city-council', 3], ['region-council', 4]]);
  });

  it('publishes completed per-person research with valid sources and finance', async () => {
    const { data } = await loadCity();
    expect(validateDataset(data, 'release')).toEqual([]);
    expect(data.researchCoverage).toHaveLength(472);
    expect(data.researchCoverage.some((row) => row.status === 'pending')).toBe(false);
    expect(data.campaignFinance).toHaveLength(59);
    const audit = JSON.parse(await readFile('research/dolny-kubin-2026.json', 'utf8'));
    const mediaAudit = JSON.parse(await readFile('research/dolny-kubin-media-review-2026.json', 'utf8'));
    expect(audit.candidates).toHaveLength(52);
    for (const person of audit.candidates) {
      for (const claimId of person.claimIds ?? []) {
        expect(data.claims.some((claim) => claim.id === claimId && claim.candidateId === person.candidateId), claimId).toBe(true);
      }
      expect(Object.keys(person.categoryStatuses), person.candidateId).toHaveLength(8);
      for (const [category, status] of Object.entries(person.categoryStatuses)) {
        const refreshed = mediaAudit.coverageChanges.find((row: { candidateId: string; category: string }) => row.candidateId === person.candidateId && row.category === category)?.after;
        expect(data.researchCoverage.find((row) => row.candidateId === person.candidateId && row.category === category)?.status).toBe(refreshed?.status ?? status);
      }
    }
  });

  it('keeps the existing guides and approved research intact', async () => {
    for (const [citySlug, people, ballots, claims] of [['liptovsky-mikulas', 91, 109, 629], ['ruzomberok', 79, 100, 597]] as const) {
      const { data } = await loadElectionContext({ citySlug, year: 2026 });
      expect(data.candidates).toHaveLength(people);
      expect(data.candidacies).toHaveLength(ballots);
      expect(data.claims).toHaveLength(claims);
      expect(data.candidacies.some((row) => row.contestId.startsWith('2026-dk-') || row.districtId === '2026-zsk-region-3')).toBe(false);
    }
  });
});
