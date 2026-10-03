import { describe, expect, it } from 'vitest';
import { listElectionContextConfigs, listPublishedElectionContexts, loadElectionContext } from '../../src/lib/load-guide-data';
import { validateDataset } from '../../src/lib/validate-dataset';
import { getBallotsForDistrict, getBallotSelectionLimit } from '../../src/lib/selectors';
import officialRoster from '../fixtures/zilina-official-roster.json';
import historicalResults from '../fixtures/zilina-election-results.json';

const loadCity = () => loadElectionContext({ citySlug: 'zilina', year: 2026 });

describe('Žilina official 2026 election guide', () => {
  it('makes the Žilina city and its regional district 11 available as a separate context', async () => {
    expect((await listElectionContextConfigs()).find((row) => row.citySlug === 'zilina')).toMatchObject({
      cityName: 'Žilina', year: 2026, snapshotDate: '2026-10-03', regionalDistrictId: '2026-zsk-region-11',
      contestIds: { mayor: '2026-za-mayor', 'city-council': '2026-za-city-council' },
    });
  });

  it('includes every registered candidacy in all four official lists', async () => {
    const { data } = await loadCity();
    expect(data.candidates).toHaveLength(135);
    expect(data.candidacies).toHaveLength(192);
    for (const [kind, count] of [['mayor', 8], ['city-council', 94], ['region-council', 83], ['region-chair', 7]] as const) {
      expect(data.candidacies.filter((row) => row.electionId === kind), kind).toHaveLength(count);
    }
    expect(data.candidacies.some((row) => row.contestId.startsWith('2026-lm-') || row.contestId.startsWith('2026-rk-'))).toBe(false);
  });

  it('preserves every official ballot number, age, occupation and nomination', async () => {
    const { data } = await loadCity();
    expect(data.candidacies.filter((row) => row.electionId !== 'region-chair').map((row) => ({
      candidateId: row.candidateId, electionId: row.electionId, ballotNumber: row.ballotNumber,
      ageAtElection: row.ageAtElection, occupationOfficial: row.occupationOfficial,
      affiliations: row.affiliations, independent: row.independent,
      districtId: row.districtId ?? null, sourceIds: row.sourceIds,
    }))).toEqual(officialRoster);
  });

  it('preserves all 80 stations, street continuation and the official surname split', async () => {
    const { data } = await loadCity();
    const stations = data.districts.flatMap((row) => row.pollingStations);
    expect(stations.map((row) => row.number).toSorted((a, b) => a - b)).toEqual(Array.from({ length: 80 }, (_, i) => i + 1));
    expect(stations.find((row) => row.number === 1)?.coverage).toContain('bez ulice (Priezvisko od A do J)');
    expect(stations.find((row) => row.number === 80)?.coverage).toBe('bez ulice (Priezvisko od K do Ž)');
    expect(data.districts.find((row) => row.id === '2026-za-city-3')?.pollingStations.map((row) => row.number)).toContain(80);
    expect(stations.find((row) => row.number === 10)?.coverage).toContain('Palárikova');
    expect(stations.find((row) => row.number === 75)?.coverage).toContain('Richtárska');
    expect(stations.find((row) => row.number === 76)?.coverage).toContain('Kubov dvor');
    expect(stations.map((row) => row.coverage).join(' ')).not.toMatch(/Teh elná|Štrkov á|Kub ov|\f|Dátum konania/);
  });

  it('uses official municipal districts and ballot limits, including the smaller outer districts', async () => {
    const { data, regionalDistrictId } = await loadCity();
    expect(data.districts.filter((row) => row.kind === 'city').map((row) => row.seats)).toEqual([5, 4, 5, 7, 3, 2, 2, 3]);
    for (const [index, count] of [19, 15, 13, 18, 10, 3, 7, 9].entries()) {
      const rows = data.candidacies.filter((row) => row.districtId === `2026-za-city-${index + 1}`);
      expect(rows.map((row) => row.ballotNumber)).toEqual(Array.from({ length: count }, (_, i) => i + 1));
    }
    expect(getBallotsForDistrict(data, '2026-za-city-6', regionalDistrictId).map(getBallotSelectionLimit)).toEqual([1, 2, 1, 12]);
  });

  it('joins three candidacies by verified age, occupation and election locality', async () => {
    const { data } = await loadCity();
    for (const candidateId of ['za-peter-cibulka', 'za-rastislav-johanes', 'za-michal-milo', 'za-miroslav-sokol']) {
      expect(data.candidacies.filter((row) => row.candidateId === candidateId)).toHaveLength(3);
    }
    expect(data.candidacies.filter((row) => row.candidateId === 'candidate-89').map((row) => row.electionId).toSorted())
      .toEqual(['city-council', 'region-chair', 'region-council']);
  });

  it('preserves the seven existing chair people and the original city records', async () => {
    const za = await loadCity();
    const lm = await loadElectionContext({ citySlug: 'liptovsky-mikulas', year: 2026 });
    const rk = await loadElectionContext({ citySlug: 'ruzomberok', year: 2026 });
    const chairs = (data: typeof za.data) => data.candidacies.filter((row) => row.electionId === 'region-chair');
    expect(chairs(za.data)).toEqual(chairs(lm.data));
    expect(lm.data.candidates).toHaveLength(91);
    expect(lm.data.claims).toHaveLength(604);
    expect(rk.data.candidates).toHaveLength(79);
    expect(rk.data.claims).toHaveLength(503);
  });

  it('publishes only after all eight categories and financing have been researched', async () => {
    const context = await loadCity();
    expect(context.status).toBe('published');
    expect(validateDataset(context.data, 'release')).toEqual([]);
    expect(context.data.researchCoverage).toHaveLength(135 * 8);
    expect(context.data.researchCoverage.some((row) => row.status === 'pending')).toBe(false);
    expect(context.data.campaignFinance).toHaveLength(135);
    expect((await listPublishedElectionContexts()).map((row) => row.basePath)).toContain('/zilina/2026/');
  });
  it('keeps a substitute result and a same-name elected person in another town distinct', async () => {
    const { data } = await loadCity();
    const result = data.claims.find((row) => row.id === 'claim-za-veronika-barcikova-council-result-2022');
    expect(result).toMatchObject({
      text: { sk: 'Vo voľbách poslancov v roku 2022 v obci Žilina, volebnom obvode č. 4 Veronika Barčíková získala 673 hlasov (2,56 %) a nebola zvolená. Stala sa náhradníčkou.' },
      election: { contestId: 'zilina-city-council-2022', office: 'municipal_council', outcome: 'substitute' },
    });
    expect(data.claims.filter((row) => row.candidateId === 'za-veronika-barcikova').map((row) => row.text.sk).join(' ')).not.toContain('Rakša');
  });

  it('locks complete verified historical outcome texts and their official sources', async () => {
    const { data } = await loadCity();
    expect(historicalResults.length).toBeGreaterThan(0);
    expect(data.claims.filter((row) => row.candidateId.startsWith('za-') && row.kind === 'election_result')
      .map(({ id, candidateId, text, period, election, sourceIds }) => ({ id, candidateId, text, period, election, sourceIds })))
      .toEqual(historicalResults);
  });

  it('excludes optional claims whose exact originals are inaccessible at the snapshot', async () => {
    const { data } = await loadCity();
    const inaccessible = ['za-a-balogova-candidate-profile', 'za-b-jantosik-sak', 'za-c-bienik-party-cv'];
    expect(data.sources.filter((row) => inaccessible.includes(row.id))).toEqual([]);
    expect(data.claims.filter((row) => row.sourceIds.some((id) => inaccessible.includes(id)))).toEqual([]);
    expect(data.researchCoverage.find((row) => row.candidateId === 'za-zuzana-balogova' && row.category === 'programme_statements'))
      .toMatchObject({ status: 'searched_none', sourceIds: [] });
    for (const candidateId of ['za-roman-jantosik', 'za-roman-bienik']) {
      expect(data.researchCoverage.find((row) => row.candidateId === candidateId && row.category === 'employment_business'))
        .toMatchObject({ status: 'found' });
    }
  });

  it('preserves that the first Bulvár funding allegation did not name an opponent', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((row) => row.id === 'claim-za-rastislav-johanes-bulvar-allegation-2026')?.text.sk)
      .toBe('Žilinak.sk v septembri 2026 informoval, že Peter Fiabáne tvrdil, že vlastník sporného pozemku na Bulvári financuje kampaň jedného z jeho protikandidátov, ktorého nemenoval.');
    expect(data.claims.find((row) => row.id === 'claim-za-rastislav-johanes-bulvar-response-2026')?.kind).toBe('response');
  });

});
