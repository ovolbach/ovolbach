import { describe, expect, it } from 'vitest';
import { listElectionContextConfigs, loadElectionContext } from '../../src/lib/load-guide-data';
import { getBallotsForDistrict, getBallotSelectionLimit } from '../../src/lib/selectors';
import { existsSync, readFileSync } from 'node:fs';
import officialHistory from '../fixtures/presov-poprad-history-2022.json';
import { loadElectionCycle } from '../../src/lib/load-guide-data';
import officialRoster from '../fixtures/presov-poprad-official-roster.json';
import history2017 from '../fixtures/presov-poprad-history-2017.json';

describe('Poprad and Prešov election manifests', () => {
  it('matches every official registration, including compound names and surname diacritics', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    expect(data.candidacies).toHaveLength(402);
    expect(data.candidates).toHaveLength(320);
    for (const row of officialRoster) {
      const prefix = row.sourceKey.startsWith('pp-') ? 'pp' : row.sourceKey.startsWith('po-') ? 'po' : 'psk';
      const id = `2026-${prefix}-${row.electionId}-${row.districtNumber ?? 'all'}-${row.ballotNumber}`;
      const registration = data.candidacies.find((item) => item.id === id);
      expect(registration, id).toMatchObject({ ballotNumber: row.ballotNumber,
        displayNameOfficial: row.displayNameOfficial, ageAtElection: row.ageAtElection,
        occupationOfficial: row.occupationOfficial, affiliations: row.affiliations,
        independent: row.independent, sourceIds: [row.sourceId] });
      expect(data.candidates.find((item) => item.id === registration?.candidateId), id)
        .toMatchObject({ givenName: row.givenName, familyName: row.familyName });
    }
  });
  it.each([
    ['poprad', 'Poprad', '2026-psk-region-6'],
    ['presov', 'Prešov', '2026-psk-region-7'],
  ])('configures %s in its own PSK council district', async (citySlug, cityName, regionalDistrictId) => {
    const configs = await listElectionContextConfigs();
    expect(configs.find((row) => row.citySlug === citySlug && row.year === 2026)).toMatchObject({
      cityName, regionSlug: 'presovsky-kraj', regionName: 'Prešovský samosprávny kraj', regionalDistrictId,
    });
  });
  it('uses the six officially determined Prešov council seat limits rather than guessed allocations', async () => {
    const context = await loadElectionContext({ citySlug: 'presov', year: 2026 });
    expect(context.data.districts.filter((row) => row.kind === 'city').map((row) => row.seats)).toEqual([7, 3, 4, 5, 4, 8]);
    expect(getBallotsForDistrict(context.data, '2026-po-city-6', context.regionalDistrictId).map(getBallotSelectionLimit)).toEqual([1, 8, 1, 15]);
  });
  it('preserves all 66 officially assigned Prešov polling stations', async () => {
    const { data } = await loadElectionContext({ citySlug: 'presov', year: 2026 });
    const stations = data.districts.flatMap((row) => row.pollingStations);
    expect(stations.map((row) => row.number).toSorted((a, b) => a - b)).toEqual(Array.from({ length: 66 }, (_, i) => i + 1));
    expect(stations.find((row) => row.number === 2)?.coverage).toContain('155A');
    expect(stations.find((row) => row.number === 1)?.address).toBe('Základná škola, Bajkalská 29');
    expect(stations.find((row) => row.number === 21)?.address).toBe('Súkromná stredná odborná škola hotelierstva a gastronómie Mladosť, Pod Kalváriou 36');
    expect(stations.find((row) => row.number === 31)?.address).toBe('Stredná odborná škola gastronómie a služieb, Sídlisko duklianskych hrdinov 3');
    expect(stations.find((row) => row.number === 32)?.address).toBe('Spojená škola T. Ševčenka s vyučovacím jazykom ukrajinským, Sládkovičova 4');
    for (const number of [45, 46]) expect(stations.find((row) => row.number === number)?.address)
      .toBe('Cirkevná základná škola s materskou školou sv. Gorazda, Solivarská 49');
    expect(stations.find((row) => row.number === 31)?.coverage).toContain('101, 103, 105, 107, 107A');
    expect(data.sources.find((row) => row.id === 'po-polling-2026')?.url)
      .toBe('https://www.presov.sk/download_file_f.php?id=2482594');
  });
  it('preserves the full Poprad city-wide list without inventing district assignments', () => {
    const file = 'src/data/elections/2026/presovsky-kraj/municipalities/poprad/polling-stations.json';
    expect(existsSync(file)).toBe(true);
    if (!existsSync(file)) return;
    const stations = JSON.parse(readFileSync(file, 'utf8'));
    expect(stations.map((row: { number: number }) => row.number)).toEqual(Array.from({ length: 44 }, (_, i) => i + 1));
    expect(stations[43].address).toBe('Zariadenie pre seniorov (Seniorpark), Kvetnica 424/24');
  });
  it('publishes the complete official 2022 outcomes after municipality and age identity checks', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    for (const row of officialHistory) {
      const claim = data.claims.find((item) => item.id === `claim-${row.candidateId}-${row.kind}-${row.districtNumber ?? 'all'}-result-2022`);
      expect(claim, row.candidateId).toMatchObject({ candidateId: row.candidateId, text: { sk: row.text },
        period: '2022', election: { contestId: row.contestId, office: row.office, outcome: row.outcome }, sourceIds: row.sourceIds });
    }
  });
  it('retains the independently matched 2017 council results and substitute statuses', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    for (const row of history2017) {
      expect(data.claims.find((item) => item.id === `claim-${row.candidateId}-regional_council-${row.districtNumber}-result-2017`), row.candidateId)
        .toMatchObject({ candidateId: row.candidateId, kind: 'election_result', text: { sk: row.text }, period: '2017',
          election: { contestId: row.contestId, office: row.office, outcome: row.outcome }, sourceIds: row.sourceIds });
    }
  });
});
