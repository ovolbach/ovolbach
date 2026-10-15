import { restoreAuditedFile } from '../helpers/history-audit-preservation';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { listElectionContextConfigs, loadElectionContext, loadGlobalSources } from '../../src/lib/load-guide-data';
import type { ClaimCategory } from '../../src/lib/schemas';
import { pollingGroupsForContext } from '../../src/lib/polling-groups';
import preservation from '../fixtures/four-cities-2026-preservation.json';
import rosters from '../fixtures/four-cities-2026-rosters.json';

const cities = [
  ['trnava', 'Trnava', 'trnavsky-kraj'],
  ['trencin', 'Trenčín', 'trenciansky-kraj'],
  ['nitra', 'Nitra', 'nitriansky-kraj'],
  ['banska-bystrica', 'Banská Bystrica', 'banskobystricky-kraj'],
] as const;
const researchCategories = ['basic', 'employment_business', 'public_office', 'previous_elections',
  'programme_statements', 'asset_declarations', 'media', 'controversies'] satisfies ClaimCategory[];

describe('four new cities: complete 2026 research', () => {
  it.each(cities)('registers %s in its own regional cycle with all four contests', async (citySlug, cityName, regionSlug) => {
    const configs = await listElectionContextConfigs();
    const config = configs.find((item) => item.year === 2026 && item.citySlug === citySlug);
    expect(config).toMatchObject({ cityName, regionSlug });
    const context = await loadElectionContext({ citySlug, year: 2026 });
    expect(new Set(context.data.elections.map((item) => item.id)))
      .toEqual(new Set(['mayor', 'city-council', 'region-chair', 'region-council']));
    expect(context.data.elections.every((item) => item.electionDate === '2026-10-24')).toBe(true);
    expect(new Set(Object.values(context.contestIds)).size).toBe(4);
  });

  it.each(cities)('keeps a full eight-category matrix and separate finance for every %s candidate', async (citySlug) => {
    const { data } = await loadElectionContext({ citySlug, year: 2026 });
    expect(data.candidates.length).toBeGreaterThan(0);
    for (const candidate of data.candidates) {
      const coverage = data.researchCoverage.filter((item) => item.candidateId === candidate.id);
      expect(coverage.map((item) => item.category).sort(), candidate.id).toEqual([...researchCategories].sort());
      expect(data.campaignFinance.filter((item) => item.candidateId === candidate.id), candidate.id).toHaveLength(1);
    }
    for (const record of data.campaignFinance) {
      if (record.account.status === 'verified' && record.account.verificationMethod === 'register_exclusion') {
        expect(record.account.exclusionEvidence).toMatchObject({
          scope: 'four-cities-2026', remainingCandidateId: record.candidateId,
        });
      }
    }
  });

  it.each(cities)('preserves every reconciled official ballot row and seat count for %s', async (citySlug) => {
    const { data } = await loadElectionContext({ citySlug, year: 2026 });
    const fixture = rosters[citySlug];
    expect(data.candidates).toHaveLength(fixture.people);
    const districtNumbers = new Map(data.districts.map((district) => [district.id, district.number]));
    const ballotRows = data.candidacies.map((row) => ({
      candidateId: row.candidateId, electionId: row.electionId,
      districtNumber: row.districtId ? districtNumbers.get(row.districtId) : null,
      ballotNumber: row.ballotNumber, displayNameOfficial: row.displayNameOfficial,
      ageAtElection: row.ageAtElection, occupationOfficial: row.occupationOfficial,
      affiliations: row.affiliations, independent: row.independent,
    }));
    const ordered = <T extends { electionId: string; districtNumber: number | null | undefined; ballotNumber: number }>(rows: T[]) =>
      rows.sort((a, b) => a.electionId.localeCompare(b.electionId) || (a.districtNumber ?? 0) - (b.districtNumber ?? 0) || a.ballotNumber - b.ballotNumber);
    expect(ordered(ballotRows)).toEqual(ordered([...fixture.rows]));
    const districts = (rows: { kind: string; number: number; seats: number }[]) => rows.sort((a, b) => a.kind.localeCompare(b.kind) || a.number - b.number);
    expect(districts(data.districts.map(({ kind, number, seats }) => ({ kind, number, seats }))))
      .toEqual(districts([...fixture.districts]));
  });

  it.each(cities)('has completed and reviewed research before publishing %s', async (citySlug) => {
    const context = await loadElectionContext({ citySlug, year: 2026 });
    expect(context.status).toBe('published');
    expect(context.data.researchCoverage.filter((record) => record.status === 'pending')).toEqual([]);
  });

  it('keeps the two Nitra-district Peter Poláks separate', async () => {
    const { data } = await loadElectionContext({ citySlug: 'nitra', year: 2026 });
    const namesakes = data.candidates.filter((person) => person.givenName === 'Peter' && person.familyName === 'Polák');
    expect(namesakes.map((person) => person.id).sort()).toEqual(['nsk-peter-polak-50', 'nsk-peter-polak-52']);
    for (const person of namesakes) {
      const ages = new Set(data.candidacies.filter((row) => row.candidateId === person.id).map((row) => row.ageAtElection));
      expect([...ages]).toEqual([person.id.endsWith('-50') ? 50 : 52]);
    }
    const result = data.claims.find((claim) => claim.candidateId === 'nsk-peter-polak-50' && claim.election?.outcome === 'substitute');
    expect(result?.text.sk).toBe('Voľby obecného alebo mestského zastupiteľstva 29. 10. 2022; obec: Nitra; volebný obvod č. 4; 560 platných hlasov (2,05 %); výsledok: náhradník.');
    expect(data.claims.some((claim) => claim.candidateId === 'nsk-peter-polak-52' && claim.id === result?.id)).toBe(false);
  });

  it('preserves the distinct Nitra procedural stages and their dates', async () => {
    const { data } = await loadElectionContext({ citySlug: 'nitra', year: 2026 });
    const claims = new Map(data.claims.map((claim) => [claim.id, claim]));
    expect(claims.get('nsk-erik-blasko-bankruptcy-opening-2019')).toMatchObject({
      kind: 'official_outcome', period: 'uznesenie 20. 2. 2019; publikované 27. 2. 2019',
      text: { sk: 'Okresný súd Nitra uznesením z 20. februára 2019 v konaní 32OdK/10/2019 vyhlásil konkurz na majetok Erika Blaška. Uznesenie bolo uverejnené v Obchodnom vestníku 27. februára 2019.' },
    });
    expect(claims.get('nsk-erik-blasko-debt-relief-order-2019')?.kind).toBe('official_outcome');
    expect(claims.get('nsk-milos-macho-bankruptcy-closure-2020')?.text.sk).toBe('Správca v oznámení uverejnenom 28. mája 2020 uviedol, že konkurz na majetok Miloša Macha, sp. zn. 28OdK/49/2018, sa končí, pretože konkurzná podstata nepokryje náklady konkurzu; oznámením sa konkurz zrušuje.');
    expect(claims.get('nsk-stefan-stefek-charge-quashed-report-2018')?.kind).toBe('media_report');
    expect(claims.get('nsk-tibor-gaspar-ocistec-response-2026')?.kind).toBe('response');
    expect(claims.get('nsk-tibor-gaspar-ocistec-latest-stage-2026')?.period).toBe('12. 10. 2026');
    for (const year of [2020, 2022]) {
      expect(claims.get(`nsk-slavomir-papp-enforcement-service-${year}`)?.text.sk).toContain('nie dnešný stav konania');
    }
    expect(claims.has('nsk-zdenko-svoboda-parliament-current-2026')).toBe(false);
  });

  it('uses the official Nitra polling correction and preserves both Dražovce addresses', async () => {
    const { data } = await loadElectionContext({ citySlug: 'nitra', year: 2026 });
    const stations = new Map(data.districts.flatMap((district) => district.pollingStations).map((station) => [station.number, station]));
    expect(stations.size).toBe(74);
    for (const number of [28, 29]) {
      expect(stations.get(number)).toMatchObject({
        address: 'Gymnázium Golianova, Golianova 68', sourceId: 'nr-polling-change-28-29-2026',
      });
      expect(stations.get(number)?.coverage).toContain('Vchod do budovy je z Petzwalovej ulice.');
    }
    expect(stations.get(50)?.address).toBe('Kultúrny dom Dražovce, Kultúrna 2');
    expect(stations.get(51)?.address).toBe('Kultúrny dom Dražovce, Kultúrna 8');
  });

  it('keeps the Trnava bankruptcy opening and debt relief as separate decisions', async () => {
    const { data } = await loadElectionContext({ citySlug: 'trnava', year: 2026 });
    const opening = data.claims.find((claim) => claim.id === 'ttsk-anton-zeleznik-controversies-1-2026');
    const relief = data.claims.find((claim) => claim.id === 'ttsk-anton-zeleznik-debt-relief-2020');
    expect(opening?.kind).toBe('official_outcome');
    expect(opening?.text.sk).toBe('Okresný súd Trnava uznesením z 20. mája 2020 v konaní 25OdK/163/2020 vyhlásil konkurz na majetok Antona Železníka.');
    expect(relief).toMatchObject({ candidateId: 'ttsk-anton-zeleznik', kind: 'official_outcome' });
    expect(relief?.text.sk).toContain('oddlžení');
  });

  it('includes the verified 2022 Trnava regional-chair result', async () => {
    const { data } = await loadElectionContext({ citySlug: 'trnava', year: 2026 });
    const result = data.claims.find((claim) => claim.candidateId === 'ttsk-jozef-viskupic' && claim.election?.office === 'regional_chair' && claim.period?.startsWith('2022'));
    expect(result?.election?.outcome).toBe('elected');
    expect(result?.text.sk).toBe('Vo voľbách predsedu Trnavského samosprávneho kraja 29. októbra 2022 získal Jozef Viskupič 69 743 hlasov (38,56 %); výsledok: zvolený.');
  });

  it('does not infer a government appointment from the ministry homepage', async () => {
    const { data } = await loadElectionContext({ citySlug: 'trencin', year: 2026 });
    expect(data.claims.some((claim) => claim.id === 'tsk-simona-zacharova-government-office-2026')).toBe(false);
  });

  it('keeps each self-declared Bodis employment relationship separate', async () => {
    const { data } = await loadElectionContext({ citySlug: 'nitra', year: 2026 });
    const claims = data.claims.filter((claim) => claim.candidateId === 'nsk-martin-bodis' && claim.id.startsWith('nr-employment-martin-bodis-zamestnania-oznamenie-2024'));
    expect(claims).toHaveLength(3);
    expect(claims.map((claim) => claim.text.sk)).toContain('Vo svojom oznámení za rok 2024 zverejnenom NR SR Martin Bodis uviedol pracovný alebo obdobný vzťah s Hotely mládeže Slovakia, a.s.');
  });

  it('retains Mičega’s published IBAN without constructing a bank-page URL', async () => {
    const { data } = await loadElectionContext({ citySlug: 'trencin', year: 2026 });
    const account = data.campaignFinance.find((record) => record.candidateId === 'tsk-milos-micega')?.account;
    expect(account).toMatchObject({ status: 'verified', verificationMethod: 'candidate_site' });
    expect(account && 'iban' in account ? account.iban : undefined).toBeTruthy();
    expect(account && 'url' in account ? account.url : undefined).toBeUndefined();
  });

  it('keeps private birth dates out of the tracked research journals', () => {
    for (const [city] of cities) {
      const journal = readFileSync(`research/${city}-2026.json`, 'utf8');
      expect(journal, city).not.toMatch(/(?:Dátum narodenia|naroden[ýá]|nar\.)\s*:?\s*\d{1,2}\.\s*\d{1,2}\.\s*\d{4}/iu);
    }
  });

  it('keeps Vnuk’s two self-declared PPA roles atomic', async () => {
    const { data } = await loadElectionContext({ citySlug: 'nitra', year: 2026 });
    const claims = data.claims.filter((claim) => claim.id.startsWith('nr-employment-vladimir-vnuk-ppa-2016-2021'));
    expect(claims).toHaveLength(2);
    expect(claims.filter((claim) => claim.text.sk.includes('výkonného riaditeľa'))).toHaveLength(1);
    expect(claims.filter((claim) => claim.text.sk.includes('Sekcie financovania podpôr a rozpočtu'))).toHaveLength(1);
  });

  it('requires a second distinct identity bridge for the Švehla employer record', async () => {
    const { data } = await loadElectionContext({ citySlug: 'trencin', year: 2026 });
    expect(data.claims.some((claim) => claim.id === 'tsk-robert-svehla-current-city-assistant-2026')).toBe(false);
  });

  it('publishes all 79 Banská Bystrica polling rooms under their official ward headers', async () => {
    const context = await loadElectionContext({ citySlug: 'banska-bystrica', year: 2026 });
    const { cityWide, groups } = pollingGroupsForContext(context);
    expect(cityWide).toBe(false);
    expect(groups.map((group) => group.pollingStations.length)).toEqual([12, 6, 23, 6, 17, 8, 7]);
    const stations = groups.flatMap((group) => group.pollingStations);
    expect(stations.map((station) => station.number)).toEqual(Array.from({ length: 79 }, (_, i) => i + 1));
    expect(stations.every((station) => station.address && station.coverage)).toBe(true);
    expect(stations.some((station) => station.address.includes('Skuteckého 8'))).toBe(true);
    expect(stations.some((station) => station.address.includes('ZUŠ Jána Cikkera'))).toBe(false);
    for (const id of new Set([...groups[0]!.sourceIds, ...stations.map((station) => station.sourceId)])) {
      expect(context.data.sources.some((source) => source.id === id), id).toBe(true);
    }
  });

  it('gives the TTSK declaration API index a document title instead of its raw JSON body', async () => {
    const source = (await loadGlobalSources()).find((row) => row.id === 'tt-regional-declarations-2024-json-2026');
    expect(source?.title).toBe('Oficiálny index majetkových priznaní TTSK za rok 2024');
  });

  it('keeps the exact published party account identifiers free of copied outer whitespace', async () => {
    const { data } = await loadElectionContext({ citySlug: 'trencin', year: 2026 });
    for (const [id, iban] of [
      ['tn-party-kdh-krestanskodemokraticke-hnutie', 'SK7509000000005246166150'],
      ['tn-party-smer-socialna-demokracia', 'SK1709000000005245573360'],
    ]) {
      expect(data.financeParties.find((party) => party.id === id)?.account).toMatchObject({
        status: 'registered', url: `https://www.transparentneucty.sk/#/ucet/${iban}`,
      });
    }
  });

  it('preserves all previously approved cycle files and source records', async () => {
    for (const [file, sha256] of Object.entries(preservation.cycleFiles)) {
      expect(createHash('sha256').update(restoreAuditedFile(`src/data/${file}`, readFileSync(`src/data/${file}`, 'utf8'))).digest('hex'), file).toBe(sha256);
    }
    const sources = new Map((await loadGlobalSources()).map((source) => [source.id, source]));
    for (const [id, sha256] of Object.entries(preservation.sourceRecords)) {
      expect(sources.has(id), id).toBe(true);
      expect(createHash('sha256').update(JSON.stringify(sources.get(id))).digest('hex'), id).toBe(sha256);
    }
  });
});
