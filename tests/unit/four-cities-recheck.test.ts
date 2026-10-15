import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { loadElectionCycle, loadGlobalSources } from '../../src/lib/load-guide-data';
import preservation from '../fixtures/four-cities-recheck-preservation.json';
import eventMoves from '../fixtures/four-cities-event-moves.json';

const cases = [
  ['trnavsky-kraj', 135, 10, 0, 125], ['trenciansky-kraj', 114, 5, 0, 109],
  ['nitriansky-kraj', 166, 8, 0, 158], ['banskobystricky-kraj', 131, 7, 1, 123],
] as const;

describe('four-city account, event and election recheck', () => {
  it('preserves all 2621 previously approved source records and their verification boundaries', async () => {
    const sources = await loadGlobalSources();
    expect(sources.length).toBeGreaterThanOrEqual(preservation.sourceCount);
    expect(createHash('sha256').update(JSON.stringify(sources.slice(0, preservation.sourceCount))).digest('hex'))
      .toBe(preservation.sourcePrefixSha256);
  });

  it.each(cases)('records reviewed account statuses and full exclusion evidence for %s', async (region, people, verified, unverified, notListed) => {
    const data = await loadElectionCycle(2026, region);
    expect(data.candidates).toHaveLength(people);
    expect(data.campaignFinance.filter((row) => row.account.status === 'verified')).toHaveLength(verified);
    expect(data.campaignFinance.filter((row) => row.account.status === 'unverified')).toHaveLength(unverified);
    expect(data.campaignFinance.filter((row) => row.account.status === 'not_listed')).toHaveLength(notListed);
    for (const row of data.campaignFinance) {
      if (row.account.status !== 'verified' || row.account.verificationMethod !== 'register_exclusion') continue;
      expect(row.account.exclusionEvidence).toMatchObject({ scope: 'four-cities-2026', remainingCandidateId: row.candidateId });
      expect(row.account.exclusionEvidence!.registers.map(({ kind, rowCount, complete }) => [kind, rowCount, complete]))
        .toEqual([['mayor', 6560, true], ['city-council', 40184, true], ['region-chair', 56, true], ['region-council', 2472, true]]);
      expect(row.account.exclusionEvidence!.matches.filter((match) => match.decision === 'retained')).toHaveLength(1);
      expect(row.ownExpenses).toBe('unknown');
      expect(row.campaignOperator).toBe('unknown');
    }
  });

  it('keeps a candidate-published party account distinct from the candidate personal account', async () => {
    const data = await loadElectionCycle(2026, 'banskobystricky-kraj');
    const row = data.campaignFinance.find((item) => item.candidateId === 'bbsk-diana-javorcikova')!;
    expect(row.account.status).toBe('unverified');
    expect(row.partyIds).toContain('progresivne-slovensko');
    const party = data.financeParties.find((item) => item.id === 'progresivne-slovensko');
    expect(party?.account.status).toBe('registered');
  });

  it('moves the existing underlying reports beside their responses without rewriting or duplicating them', async () => {
    const cycles = await Promise.all(cases.map(([region]) => loadElectionCycle(2026, region)));
    const claims = cycles.flatMap((cycle) => cycle.claims);
    for (const move of eventMoves) {
      const matches = claims.filter((claim) => claim.id === move.claimId);
      expect(matches, move.claimId).toHaveLength(1);
      expect(matches[0]?.category, move.claimId).toBe(move.to);
      const restored = { ...matches[0]!, category: move.from };
      expect(createHash('sha256').update(JSON.stringify(restored)).digest('hex'), move.claimId).toBe(move.originalSha256);
    }
  });

  it('records the official Vráble archive results as separate historical elections', async () => {
    const data = await loadElectionCycle(2026, 'nitriansky-kraj');
    for (const [year, votes] of [['2014', '553'], ['2018', '367']]) {
      const claims = data.claims.filter((claim) => claim.candidateId === 'nsk-branislav-banyi'
        && claim.election?.office === 'municipal_council' && claim.period?.startsWith(year!));
      expect(claims, year).toHaveLength(1);
      expect(claims[0]?.election?.outcome).toBe('elected');
      expect(claims[0]?.text.sk).toContain(votes);
      expect(claims[0]?.text.sk.split(';').at(-1)?.trim()).toBe('oficiálny výsledok: zvolený.');
    }
  });

  it('preserves the 2017 Cehlárik substitute result instead of treating it as an election win', async () => {
    const data = await loadElectionCycle(2026, 'trnavsky-kraj');
    const claim = data.claims.find((row) => row.candidateId === 'ttsk-jaroslav-cehlarik'
      && row.election?.office === 'regional_council' && row.period === '2017-11-04');
    expect(claim?.election?.outcome).toBe('substitute');
    expect(claim?.text.sk.split(';').at(-1)?.trim()).toBe('oficiálny výsledok: náhradník.');
  });

  it('excludes the older Vladimír Poruban from the younger namesake\'s 2018 election history', async () => {
    const data = await loadElectionCycle(2026, 'trenciansky-kraj');
    const contests = data.claims.filter((row) => row.candidateId === 'tsk-vladimir-poruban'
      && row.election?.office === 'municipal_council' && row.period === '2018-11-10');
    expect(contests).toHaveLength(1);
    expect(contests[0]?.text.sk).toContain('783 hlasov');
    expect(contests[0]?.text.sk).not.toContain('348 hlasov');
  });

  it('withholds old Dvonč events without a second independent link to the current candidate', async () => {
    const data = await loadElectionCycle(2026, 'nitriansky-kraj');
    expect(data.claims.filter((claim) => claim.candidateId === 'nsk-jozef-dvonc'
      && claim.id.includes('regiojet'))).toHaveLength(0);
    expect(data.researchCoverage.find((row) => row.candidateId === 'nsk-jozef-dvonc'
      && row.category === 'controversies')).toMatchObject({ status: 'searched_none' });
  });

  it('keeps the reported Cehlárik civil outcome separate from his compliance statement', async () => {
    const data = await loadElectionCycle(2026, 'trnavsky-kraj');
    const report = data.claims.find((row) => row.id === 'ttsk-jaroslav-cehlarik-droba-judgment-report-20260629');
    const response = data.claims.find((row) => row.id === 'ttsk-jaroslav-cehlarik-droba-execution-response-20260629');
    expect(report).toMatchObject({ category: 'controversies', kind: 'media_report' });
    expect(response).toMatchObject({ category: 'controversies', kind: 'response' });
  });

  it('states the Bočko election-petition procedural outcome from the official court order', async () => {
    const data = await loadElectionCycle(2026, 'trnavsky-kraj');
    const claim = data.claims.find((row) => row.id === 'ttsk-ivan-bocko-election-petition-official-20221207');
    expect(claim).toMatchObject({ category: 'controversies', kind: 'official_outcome', period: '2022-12-07' });
    expect(claim?.text.sk).toBe('Najvyšší správny súd SR uznesením 12Svp/24/2022 zo 7. decembra 2022 odmietol žalobu o ústavnosť a zákonnosť volieb starostu Bohdanoviec nad Trnavou, v ktorej bol žalovaným Ivan Bočko. Poučenie uvádza, že proti rozhodnutiu nie je prípustný opravný prostriedok.');
    expect(data.sources.filter((source) => claim?.sourceIds.includes(source.id)).some((source) => source.type === 'official')).toBe(true);
  });

  it('retains Nosko\'s tentative explanation and the dated non-delivery qualification', async () => {
    const data = await loadElectionCycle(2026, 'banskobystricky-kraj');
    const claim = data.claims.find((row) => row.id === 'bbsk-jan-nosko-declaration-fine-response-20260602');
    expect(claim?.kind).toBe('response');
    expect(claim?.text.sk).toBe('Ján Nosko pre TASR uviedol, že predpokladá, že nedopatrením neuviedol funkciu konateľa v spoločnosti Dom kultúry; namietal, že za ňu nepoberal odmenu. Podľa jeho reakcie mu k 2. júnu 2026 oficiálne rozhodnutie a jeho odôvodnenie ešte neboli doručené.');
  });

  it('preserves the temporary procedural scope of the Modranský security-measure decision', async () => {
    const data = await loadElectionCycle(2026, 'banskobystricky-kraj');
    const claim = data.claims.find((row) => row.id === 'bbsk-marek-modransky-sad-poprad-security-supreme-20260428');
    expect(claim).toMatchObject({ kind: 'official_outcome', period: '2026-04-28' });
    expect(claim?.text.sk).toBe('Najvyšší súd SR 28. apríla 2026 v konaní 5Obno/1/2026 odmietol dovolanie proti uzneseniu 4Cob/112/2025. Vysvetlil, že zabezpečovacie opatrenie má dočasnú povahu a nerozhoduje vo veci samej; poučenie nepripúšťa opravný prostriedok. Toto uznesenie neurčuje trestnú vinu ani konečnú výšku náhrady škody.');
    expect(data.sources.some((source) => claim?.sourceIds.includes(source.id)
      && source.type === 'official' && source.url === 'https://www.nsud.sk/data/att/4b0/862687.e28b55.pdf')).toBe(true);
  });
});
