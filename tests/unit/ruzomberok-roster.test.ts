import { describe, expect, it } from 'vitest';
import { listElectionContextConfigs, listPublishedElectionContexts, loadElectionContext } from '../../src/lib/load-guide-data';
import { validateDataset } from '../../src/lib/validate-dataset';
import { getBallotsForDistrict, getBallotSelectionLimit } from '../../src/lib/selectors';
import verifiedElectionResults from '../fixtures/ruzomberok-election-results.json';
import researchAudit from '../../research/ruzomberok-2026.json';
import mediaReview from '../../research/ruzomberok-media-review-2026.json';

const loadCity = () => loadElectionContext({ citySlug: 'ruzomberok', year: 2026 });

describe('Ružomberok official 2026 roster', () => {
  it('registers the city with its own municipal contests and regional district 8', async () => {
    expect((await listElectionContextConfigs()).find((city) => city.citySlug === 'ruzomberok')).toMatchObject({
      cityName: 'Ružomberok', year: 2026, snapshotDate: '2026-10-04',
      regionalDistrictId: '2026-zsk-region-8',
      contestIds: { mayor: '2026-rk-mayor', 'city-council': '2026-rk-city-council' },
    });
  });

  it('contains every registered candidacy in the four elections', async () => {
    const { data } = await loadCity();
    expect(data.candidates).toHaveLength(79);
    expect(data.candidacies).toHaveLength(100);
    for (const [kind, count] of [['mayor', 4], ['city-council', 62], ['region-council', 27], ['region-chair', 7]] as const) {
      expect(data.candidacies.filter((row) => row.electionId === kind), kind).toHaveLength(count);
    }
    expect(data.candidacies.some((row) => row.districtId === '2026-zsk-region-5')).toBe(false);
    expect(data.candidacies.some((row) => row.contestId.startsWith('2026-lm-'))).toBe(false);
  });

  it('preserves district sizes, ballot ordering, 16 city seats and five regional seats', async () => {
    const { data, regionalDistrictId } = await loadCity();
    expect(data.districts.filter((row) => row.kind === 'city').map((row) => row.seats)).toEqual([1, 1, 1, 1, 12]);
    const sizes = [3, 3, 4, 3, 49];
    for (const [index, count] of sizes.entries()) {
      const rows = data.candidacies.filter((row) => row.districtId === `2026-rk-city-${index + 1}`);
      expect(rows).toHaveLength(count);
      expect(rows.map((row) => row.ballotNumber)).toEqual(Array.from({ length: count }, (_, number) => number + 1));
    }
    const ballots = getBallotsForDistrict(data, '2026-rk-city-5', regionalDistrictId);
    expect(ballots.map(getBallotSelectionLimit)).toEqual([1, 12, 1, 5]);
    expect(data.districts.flatMap((row) => row.pollingStations).map((row) => row.number)).toEqual(Array.from({ length: 24 }, (_, number) => number + 1));
  });

  it('keeps street names continuous across official PDF page breaks', async () => {
    const { data } = await loadCity();
    const areas = data.districts.find((district) => district.id === '2026-rk-city-5')?.areas.join(' ');
    expect(areas).toContain('Nábrežie M. R. Štefánika');
    expect(areas).not.toMatch(/_{3,}|\f/);
  });

  it('joins multiple candidacies using verified age, occupation and local electoral context', async () => {
    const { data } = await loadCity();
    const person = data.candidates.find((row) => row.slug === 'jan-kuran');
    expect(person?.displayName).toBe('Ján KURÁŇ, Mgr. Art.');
    const rows = data.candidacies.filter((row) => row.candidateId === person?.id);
    expect(rows.map((row) => [row.electionId, row.ballotNumber, row.ageAtElection, row.occupationOfficial])).toEqual([
      ['mayor', 3, 49, 'podnikateľ'], ['city-council', 24, 49, 'podnikateľ'], ['region-council', 18, 49, 'podnikateľ'],
    ]);
    expect(rows.filter((row) => row.independent)).toHaveLength(2);
    expect(rows.find((row) => row.electionId === 'region-council')?.affiliations).toEqual(['Občianska konzervatívna strana']);
    expect(data.candidates.find((row) => row.slug === 'jan-kral')?.familyName).toBe('KRÁL');
    expect(data.candidates.find((row) => row.slug === 'pavel-sipos')?.familyName).toBe('ŠÍPOŠ');
  });

  it('shares the seven chair people and preserves the original city electorate', async () => {
    const rk = await loadCity();
    const lm = await loadElectionContext({ citySlug: 'liptovsky-mikulas', year: 2026 });
    const heads = (data: typeof rk.data) => data.candidacies.filter((row) => row.electionId === 'region-chair');
    expect(heads(rk.data)).toEqual(heads(lm.data));
    expect(lm.data.candidates).toHaveLength(91);
    expect(lm.data.candidacies).toHaveLength(109);
    // Preserves all shared additions from the pending local research and the Martin merge.
    expect(lm.data.claims).toHaveLength(632);
  });

  it('publishes only a complete sourced research and finance snapshot', async () => {
    const context = await loadCity();
    expect(context.status).toBe('published');
    expect(validateDataset(context.data, 'release')).toEqual([]);
    expect(context.data.researchCoverage).toHaveLength(79 * 8);
    expect(context.data.researchCoverage.some((row) => row.status === 'pending')).toBe(false);
    expect(context.data.campaignFinance).toHaveLength(79);
    expect((await listPublishedElectionContexts()).map((city) => city.basePath)).toContain('/ruzomberok/2026/');
  });

  it('keeps an elected result separate from a substitute result and from current office', async () => {
    const { data } = await loadCity();
    const result = (candidateId: string) => data.claims.find((claim) =>
      claim.candidateId === candidateId && claim.election?.contestId === 'zilina-region-council-2022');
    expect(result('rk-lubomir-kuban')).toMatchObject({
      text: { sk: 'Vo voľbách do zastupiteľstva Žilinského samosprávneho kraja 29. 10. 2022 získal vo volebnom obvode č. 8 Ružomberok 8 407 hlasov; výsledok: zvolený.' },
      election: { office: 'regional_council', outcome: 'elected' },
    });
    expect(result('rk-jaroslav-rakucak')).toMatchObject({
      text: { sk: 'Vo voľbách do zastupiteľstva Žilinského samosprávneho kraja 29. 10. 2022 získal vo volebnom obvode č. 8 Ružomberok 1 943 hlasov; výsledok: náhradník.' },
      election: { office: 'regional_council', outcome: 'substitute' },
    });
    expect(data.claims.filter((claim) => claim.candidateId === 'rk-lubomir-kuban' && claim.category === 'public_office')
      .some((claim) => claim.sourceIds.includes('statistics-regional-outcomes-2022'))).toBe(false);
  });

  it('locks the complete verified text and outcome of all 104 new historical results', async () => {
    const { data } = await loadCity();
    const results = data.claims.filter((claim) => claim.candidateId.startsWith('rk-') && claim.kind === 'election_result')
      .map(({ id, candidateId, text, period, election, sourceIds }) => ({ id, candidateId, text, period, election, sourceIds }));
    expect(results).toHaveLength(104);
    expect(results).toEqual(verifiedElectionResults);
  });

  it('bounds business roles and candidate responses without publishing personal income or private identity data', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'rk-frantisek-rakosi-fera')).toBeUndefined();
    expect(data.claims.find((claim) => claim.id === 'rk-frantisek-rakosi-official-occupation')?.text.sk)
      .toBe('V oficiálnom zozname kandidátov pre voľby 24. 10. 2026 je uvedené povolanie: právnik.');
    const response = data.claims.find((claim) => claim.id === 'rk-martin-alusic-invoice-response');
    expect(response).toMatchObject({ kind: 'response', category: 'controversies', sourceIds: ['rk-alusic-invoice-response-2026'] });
    expect(response?.text.sk).toBe('Martin Alušic vo vyjadrení zo 6. 9. 2026 uviedol, že sumy za právne služby sú obratom advokátskej kancelárie, nie jeho osobným príjmom.');
    const texts = data.claims.filter((claim) => claim.candidateId.startsWith('rk-')).map((claim) => claim.text.sk).join('\n');
    expect(texts).not.toMatch(/Dátum narodenia|rodné číslo|trvalý pobyt|bydlisko:|nar\.\s*\d{1,2}\.\s*\d{1,2}\.\s*\d{4}/i);
    expect(data.sources.some((source) => source.url.includes('19020.a5da19'))).toBe(false);
  });

  it('publishes only candidate accounts joined to the current campaign with two additional attributes', async () => {
    const { data } = await loadCity();
    for (const candidateId of ['rk-martin-alusic', 'rk-jan-kuran']) {
      const finance = data.campaignFinance.find((record) => record.candidateId === candidateId);
      expect(finance?.account.status).toBe('verified');
      if (finance?.account.status === 'verified') {
        expect(new Set(finance.account.identity.map((item) => item.attribute)).size).toBeGreaterThanOrEqual(2);
      }
    }
    expect(data.campaignFinance.find((record) => record.candidateId === 'rk-lubomir-kuban')?.account.status).toBe('verified');
  });

  it('preserves punctuation in the verified Kubáň quotation and marks the excerpt', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'rk-lubomir-kuban-pedestrian-zone-statement')).toMatchObject({
      kind: 'quote',
      label: { sk: 'Kubáňovo vyjadrenie pre Pravdu (úryvok)' },
      text: { sk: '… Najskôr chceme urobiť architektonickú súťaž a potom komplexnú rekonštrukciu troch ulíc v centre, …' },
    });
  });

  it('keeps candidate attribution outside the exact quoted source text', async () => {
    const { data } = await loadCity();
    const excerpts = [
      ['claim-rk-michal-sidor-rest-area-statement-2018', 'Ďalej aby bola vytvorená oddychová zóna pre mamičky s deťmi.'],
      ['claim-rk-juraj-sramek-public-service-statement-2026', 'Verejnú funkciu vnímam rovnako – ako zodpovednú službu ľuďom, nie ako priestor na veľké vyhlásenia.'],
      ['claim-rk-peter-stupak-parking-project-statement', 'Pripravený je projekt zvýšenia parkovacích miest na našom sídlisku, rekonštrukcie ciest a chodníkov…'],
    ];
    for (const [id, text] of excerpts) {
      const claim = data.claims.find((item) => item.id === id);
      expect(claim?.kind, id).toBe('quote');
      expect(claim?.text.sk, id).toBe(text);
      expect(claim?.label.sk, id).toMatch(/^(Michal Sidor|Juraj Šrámek|Peter Štupák) – vyjadrenie/);
    }
  });

  it('documents a person identity bridge for every root business-register role', async () => {
    const { data } = await loadCity();
    const roleIds = ['rk-martin-alusic-alusic-company', 'rk-lubomir-kuban-mbk', 'rk-lubomir-kuban-czt',
      'rk-lubomir-kuban-mestsky-podnik', 'rk-lubomir-kuban-basket-centrum', 'rk-lubomir-kuban-mfk-board',
      'rk-jan-kuran-ferity', 'rk-katarina-bachanova-kp-biznis', 'rk-martin-baran-agropodnik',
      'rk-miroslav-futo-slavia', 'rk-damian-jelsovka-hdv', 'rk-damian-jelsovka-ktj',
      'claim-rk-marian-pales-sad-supervisory-board'];
    const sources = new Map(data.sources.map((source) => [source.id, source]));
    for (const id of roleIds) {
      const claim = data.claims.find((item) => item.id === id);
      expect(claim, id).toBeDefined();
      expect(claim!.sourceIds.some((sourceId) => /obchodnyvestnik\.justice\.gov\.sk|nrsr\.sk/.test(sources.get(sourceId)!.url)), id).toBe(true);
    }
  });

  it('records the signed joint MBK response for each of its two respondents', async () => {
    const { data } = await loadCity();
    for (const candidateId of ['rk-lubomir-kuban', 'rk-tomas-klopta']) {
      expect(data.claims.some((claim) => claim.candidateId === candidateId && claim.kind === 'response'
        && claim.sourceIds.includes('rk-mbk-joint-response-2025')), candidateId).toBe(true);
      expect(data.researchCoverage.find((row) => row.candidateId === candidateId && row.category === 'controversies'))
        .toMatchObject({ status: 'found', sourceIds: expect.arrayContaining(['rk-mbk-joint-response-2025']) });
    }
  });

  it('preserves the official historical conclusion of each verified personal insolvency case', async () => {
    const { data } = await loadCity();
    for (const [candidateId, sourceId, text] of [
      ['rk-marian-pales', 'rk-pales-insolvency-ended-2024', 'Správca v Obchodnom vestníku 21. 2. 2024 oznámil, že konkurz na majetok Mariana Páleša v konaní 9OdK/99/2023 sa končí, pretože konkurzná podstata nepokryje náklady konkurzu.'],
      ['rk-radovan-ondrejka', 'rk-ondrejka-insolvency-ended-2022', 'Správca v Obchodnom vestníku 13. 7. 2022 oznámil, že konkurz na majetok Radovana Ondrejku v konaní 1OdK/1/2022 sa končí, pretože konkurzná podstata nepokryje náklady konkurzu.'],
    ] as const) {
      expect(data.claims.find((claim) => claim.candidateId === candidateId && claim.sourceIds.includes(sourceId)))
        .toMatchObject({ kind: 'official_outcome', category: 'controversies', text: { sk: text }, checkedAt: '2026-10-03' });
      expect(data.researchCoverage.find((row) => row.candidateId === candidateId && row.category === 'controversies')?.status).toBe('found');
    }
  });

  it('keeps the per-person research audit consistent with published coverage', async () => {
    const { data } = await loadCity();
    expect(researchAudit.candidates).toHaveLength(72);
    const people: Array<{
      candidateId: string;
      categoryStatuses?: Record<string, string>;
      coverage?: Record<string, string>;
      searches?: Array<{ categories: string[] }>;
      categorySearches?: Record<string, { status?: string; supportingSourceIds?: string[] }>;
    }> = researchAudit.candidates;
    for (const person of people) {
      if (person.searches) {
        expect(new Set(person.searches.flatMap((search) => search.categories)).size, person.candidateId).toBe(8);
        continue;
      }
      const statuses = person.categoryStatuses ?? person.coverage
        ?? Object.fromEntries(Object.entries(person.categorySearches ?? {}).map(([category, search]) => [category, search.status]));
      expect(Object.keys(statuses)).toHaveLength(8);
      for (const [category, status] of Object.entries(statuses)) {
        const coverage = data.researchCoverage.find((record) => record.candidateId === person.candidateId && record.category === category);
        const refreshed = mediaReview.coverageChanges.find((record) => record.candidateId === person.candidateId && record.category === category)?.after;
        expect(refreshed?.status ?? status, `${person.candidateId}/${category}`).toBe(coverage?.status);
        const sourceIds = person.categorySearches?.[category]?.supportingSourceIds;
        if (sourceIds) expect((refreshed?.sourceIds ?? sourceIds).toSorted(), `${person.candidateId}/${category}`).toEqual(coverage?.sourceIds.toSorted());
      }
    }
  });

  it('supports the shared chair office with an accessible official source and a bounded verification date', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'claim-candidate-88-zsk-chair-current')).toMatchObject({
      text: { sk: 'Európsky výbor regiónov uvádza Eriku Jurinovú ako predsedníčku Žilinského samosprávneho kraja.' },
      period: 'stav overený 3. októbra 2026', checkedAt: '2026-10-03', sourceIds: ['cor-jurinova-current-2026'],
    });
    expect(data.sources.find((source) => source.id === 'cor-jurinova-current-2026')).toMatchObject({
      url: 'https://www.cor.europa.eu/sk/clenovia/erika-jurinova', type: 'official',
    });
    expect(data.sources.some((source) => source.id === 'zsk-jurinova-profile')).toBe(false);
  });

  it('distinguishes the later Lučanský announcement from the official registered roster', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'claim-candidate-90-withdrawal-announcement-2026')).toMatchObject({
      candidateId: 'candidate-90', category: 'media', kind: 'media_report',
      text: { sk: 'TASR v správe zverejnenej STVR 29. 9. 2026 uviedla, že Adam Lučanský v televíznej debate JOJ 24 večer 28. 9. 2026 oznámil vzdanie sa kandidatúry na predsedu ŽSK v prospech Igora Chomu.' },
      period: 'oznámenie 28. septembra 2026; správa 29. septembra 2026',
      checkedAt: '2026-10-03', sourceIds: ['stvr-tasr-lucansky-withdrawal-2026'],
    });
    expect(data.candidacies.filter((row) => row.electionId === 'region-chair')).toHaveLength(7);
    expect(data.candidacies.find((row) => row.candidateId === 'candidate-90')).toMatchObject({ ballotNumber: 6 });
  });

  it('dates and attributes the shared Belousovová programme statement reported after the earlier snapshot', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'claim-candidate-85-roads-statement-2026-09-30')).toMatchObject({
      candidateId: 'candidate-85', category: 'programme_statements', kind: 'media_report',
      text: { sk: 'Michal Motúz v rozhovore z 30. septembra 2026 uviedol, že Anna Belousovová navrhuje transparentné poradie obnovy ciest a mostov založené na objektívnych údajoch.' },
      period: 'vyjadrenie zverejnené 30. septembra 2026', checkedAt: '2026-10-03',
      sourceIds: ['zenskyweb-belousovova-interview-2026-09-30'],
    });
    expect(data.sources.find((source) => source.id === 'zenskyweb-belousovova-interview-2026-09-30')).toMatchObject({
      author: 'Michal Motúz', publishedAt: '2026-09-30', type: 'media',
    });
  });
});
