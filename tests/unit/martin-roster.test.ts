import { readFile } from 'node:fs/promises';
import { preservesApprovedRecord } from '../helpers/approved-record-preservation';
import { describe, expect, it } from 'vitest';
import { listElectionContextConfigs, listPublishedElectionContexts, loadElectionContext } from '../../src/lib/load-guide-data';
import { validateDataset } from '../../src/lib/validate-dataset';
import { getBallotsForDistrict, getBallotSelectionLimit } from '../../src/lib/selectors';

const loadCity = () => loadElectionContext({ citySlug: 'martin', year: 2026 });

describe('Martin official 2026 electorate and research', () => {
  it('matches every ballot field to the reopened official roster, including ordering', async () => {
    const fixture = JSON.parse(await readFile('tests/fixtures/martin-official-roster-2026.json', 'utf8'));
    const { data } = await loadCity();
    expect(data.candidacies.filter((row) => row.contestId.startsWith('2026-mt-') || row.districtId === '2026-zsk-region-6'))
      .toEqual(fixture.candidacies);
    expect(data.candidates.filter((person) => person.id.startsWith('mt-')))
      .toEqual(fixture.candidates.filter((person: { id: string }) => person.id.startsWith('mt-')));
  });

  it('preserves approved originals except explicitly audited evidence corrections', async () => {
    const fixture = JSON.parse(await readFile('tests/fixtures/martin-baseline-record-hashes.json', 'utf8'));
    for (const [path, hashes] of Object.entries(fixture)) {
      const records = JSON.parse(await readFile(`src/data/${path}`, 'utf8')) as Array<{ id: string; contestId?: string }>;
      for (const [id, hash] of Object.entries(hashes as Record<string, string>)) {
        const record = records.find((row) => (path.endsWith('/elections.json') ? row.contestId : row.id) === id);
        expect(preservesApprovedRecord(`src/data/${path}`, id, record, hash), `${path}:${id}`).toBe(true);
      }
    }
  });

  it('publishes all four contests from the official 2026 city and regional lists', async () => {
    const configs = await listElectionContextConfigs();
    expect(configs.find((config) => config.citySlug === 'martin')).toMatchObject({
      cityName: 'Martin', status: 'published', snapshotDate: '2026-10-04', regionalDistrictId: '2026-zsk-region-6',
    });
    expect((await listPublishedElectionContexts()).some((context) => context.basePath === '/martin/2026/')).toBe(true);
    const { data } = await loadCity();
    expect(data.candidates).toHaveLength(124);
    expect(data.candidacies).toHaveLength(155);
    for (const [kind, count] of [['mayor', 9], ['city-council', 94], ['region-chair', 7], ['region-council', 45]] as const) {
      expect(data.candidacies.filter((row) => row.electionId === kind), kind).toHaveLength(count);
    }
    expect(data.elections.every((election) => election.electionDate === '2026-10-24')).toBe(true);
  });

  it('preserves the four official district candidate counts and selection limits', async () => {
    const context = await loadCity();
    expect(context.data.districts.filter((district) => district.kind === 'city').map((district) => district.seats)).toEqual([8, 5, 5, 7]);
    for (const [index, count] of [34, 22, 15, 23].entries()) {
      const districtId = `2026-mt-city-${index + 1}`;
      expect(context.data.candidacies.filter((row) => row.districtId === districtId)).toHaveLength(count);
      const ballots = getBallotsForDistrict(context.data, districtId, context.regionalDistrictId);
      expect(getBallotSelectionLimit(ballots[1]!)).toBe([8, 5, 5, 7][index]);
      expect(getBallotSelectionLimit(ballots[3]!)).toBe(8);
    }
    // The official city-wide document does not establish district assignment.
    // Keep all 52 precincts in a separate city-wide list without inferred joins.
    expect(context.data.districts.flatMap((district) => district.pollingStations)).toHaveLength(0);
    const stations = JSON.parse(await readFile('src/data/elections/2026/zilinsky-kraj/municipalities/martin/polling-stations.json', 'utf8'));
    const expectedStations = JSON.parse(await readFile('tests/fixtures/martin-polling-stations-2026.json', 'utf8'));
    expect(stations).toEqual(expectedStations);
    expect(stations.map((station: { number: number }) => station.number)).toEqual(Array.from({ length: 52 }, (_, index) => index + 1));
  });

  it('shares Lučanský and preserves contest-specific occupations, affiliations and titles', async () => {
    const { data } = await loadCity();
    expect(data.candidates.filter((person) => person.givenName === 'Adam' && person.familyName === 'LUČANSKÝ')).toHaveLength(1);
    expect(data.candidacies.filter((row) => row.candidateId === 'candidate-90').map((row) => [row.electionId, row.ballotNumber]))
      .toEqual([['region-chair', 6], ['region-council', 28]]);
    const belak = data.candidacies.filter((row) => row.candidateId === 'mt-marek-belak');
    expect(belak.map((row) => [row.electionId, row.ballotNumber, row.ageAtElection]))
      .toEqual([['mayor', 1, 61], ['city-council', 1, 61], ['region-council', 3, 61]]);
    expect(data.candidacies.find((row) => row.candidateId === 'mt-stefan-balosak' && row.electionId === 'city-council')?.occupationOfficial).toBe('živnostník');
    expect(data.candidacies.find((row) => row.candidateId === 'mt-stefan-balosak' && row.electionId === 'region-council')?.occupationOfficial).toBe('technický poradca, živnostník');
    expect(data.candidates.find((person) => person.id === 'mt-viliam-komora')?.displayName).toBe('Viliam KOMORA, ThLic. Mgr. Mgr. Mgr., PhD.');
    expect(data.candidacies.find((row) => row.candidateId === 'mt-viliam-komora' && row.electionId === 'region-council')?.displayNameOfficial)
      .toBe('Viliam KOMORA, ThLic. Mgr., PhD.');
    expect(data.candidates.find((person) => person.id === 'mt-peter-torok')?.familyName).toBe('TŐRŐK');
  });

  it('has eight completed categories and finance for every person, with valid release references', async () => {
    const { data } = await loadCity();
    expect(validateDataset(data, 'release')).toEqual([]);
    expect(data.researchCoverage).toHaveLength(124 * 8);
    expect(data.researchCoverage.some((row) => row.status === 'pending')).toBe(false);
    expect(data.campaignFinance).toHaveLength(124);
    const audit = JSON.parse(await readFile('research/martin-2026.json', 'utf8'));
    expect(audit.candidates).toHaveLength(117);
    const followup = JSON.parse(await readFile('research/martin-media-review-2026.json', 'utf8'));
    const changes = followup.coverageChanges as Array<{ before: { candidateId: string; category: string; status: string }; after: { status: string } }>;
    for (const receipt of audit.candidates) {
      expect(Object.keys(receipt.categoryStatuses), receipt.candidateId).toHaveLength(8);
      for (const [category, status] of Object.entries(receipt.categoryStatuses)) {
        const change = changes.find((row) => row.before.candidateId === receipt.candidateId && row.before.category === category);
        if (change) expect(change.before.status).toBe(status);
        expect(data.researchCoverage.find((row) => row.candidateId === receipt.candidateId && row.category === category)?.status)
          .toBe(change?.after.status ?? status);
      }
    }
  });

  it('requires documented national exclusion or campaign identity for positive account matches', async () => {
    const { data } = await loadCity();
    for (const id of ['mt-renata-habrunova', 'mt-jozef-petras']) {
      const account = data.campaignFinance.find((record) => record.candidateId === id)?.account;
      expect(account, id).toMatchObject({ status: 'verified' });
      if (account?.status === 'verified') {
        expect(account.sourceIds).toContain('finance-national-mayors-2026');
        expect(account.identity.some((item) => item.attribute === 'campaign'), id).toBe(true);
      }
    }
    const unresolved = data.campaignFinance.find((record) => record.candidateId === 'mt-jan-danko')?.account;
    expect(unresolved).toMatchObject({ status: 'unverified' });
    expect(unresolved).not.toHaveProperty('url');
    for (const id of ['mt-milan-ftorek', 'mt-matej-turzo', 'mt-igor-hubacek']) {
      const account = data.campaignFinance.find((record) => record.candidateId === id)?.account;
      expect(account?.status, id).toBe('verified');
      if (account?.status === 'verified') {
        expect(new Set(account.identity.map((item) => item.attribute)).size, id).toBeGreaterThanOrEqual(2);
        expect(account.sourceIds.some((sourceId) => data.sources.find((source) => source.id === sourceId)?.type === 'candidate'), id).toBe(true);
      }
    }
  });

  it('preserves existing city electorates while adding documented shared-candidate research', async () => {
    const followup = JSON.parse(await readFile('research/martin-media-review-2026.json', 'utf8'));
    expect(followup.sharedAddedClaimIds).toHaveLength(17);
    for (const [citySlug, people, ballots, claims] of [['liptovsky-mikulas', 91, 109, 621], ['ruzomberok', 79, 100, 520]] as const) {
      const { data } = await loadElectionContext({ citySlug, year: 2026 });
      expect(data.candidates).toHaveLength(people);
      expect(data.candidacies).toHaveLength(ballots);
      expect(data.claims).toHaveLength(claims);
      expect(data.candidacies.some((row) => row.contestId.startsWith('2026-mt-') || row.districtId === '2026-zsk-region-6')).toBe(false);
    }
  });
});
