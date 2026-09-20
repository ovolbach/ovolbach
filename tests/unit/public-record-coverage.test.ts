import { describe, expect, it } from 'vitest';
import { loadGuideData } from '../../src/lib/load-guide-data';
import { summarizeElectionHistory } from '../../src/lib/profile-content';

const data = await loadGuideData();
const sourcesById = new Map(data.sources.map((source) => [source.id, source]));
const claimsById = new Map(data.claims.map((claim) => [claim.id, claim]));
const coverageById = new Map(data.researchCoverage.map((row) => [row.id, row]));

const reconciledResults = [
  ['claim-candidate-83-mayor-result-2018', 'Voľby primátora 2018', 'primátora Liptovského Hrádku', '2018', '2 831', '96,16 %', 'zvolený'],
  ['claim-candidate-7-mayor-result-2018', 'Voľby primátora 2018', 'primátora Liptovského Mikuláša', '2018', '4 759', '42,07 %', 'nezvolený'],
  ['claim-candidate-72-mayor-result-2018', 'Voľby starostu 2018', 'starostu Ľubele', '2018', '463', '100,00 %', 'zvolený'],
  ['claim-candidate-89-mayor-result-2018', 'Voľby primátora 2018', 'primátora Žiliny', '2018', '3 754', '13,00 %', 'nezvolený'],
  ['claim-candidate-85-city-result-2018', 'Voľby do mestského zastupiteľstva 2018', 'volebnom obvode č. 4 v Čadci', '2018', '606', '2,66 %', 'zvolená'],
  ['claim-candidate-77-city-result-2018', 'Voľby do mestského zastupiteľstva 2018', 'volebnom obvode č. 1 v Liptovskom Hrádku', '2018', '32', '3,78 %', 'nezvolený'],
  ['claim-candidate-1-city-result-2018', 'Voľby do mestského zastupiteľstva 2018', 'volebnom obvode č. 2 v Liptovskom Mikuláši', '2018', '1 163', '8,17 %', 'zvolený'],
  ['claim-candidate-87-city-result-2018', 'Voľby do mestského zastupiteľstva 2018', 'volebnom obvode č. 1 v Žiline', '2018', '844', '4,97 %', 'nezvolený'],
  ['claim-candidate-89-city-result-2018', 'Voľby do mestského zastupiteľstva 2018', 'volebnom obvode č. 3 v Žiline', '2018', '1 131', '6,78 %', 'zvolený'],
  ['claim-candidate-1-regional-result-2017', 'Voľby do ŽSK 2017', 'volebnom obvode Liptovský Mikuláš', '2017', '6 020', '7,54 %', 'zvolený'],
  ['claim-candidate-77-regional-result-2017', 'Voľby do ŽSK 2017', 'volebnom obvode Liptovský Mikuláš', '2017', '1 171', '1,46 %', 'nezvolený'],
  ['claim-candidate-7-regional-result-2017', 'Voľby do ŽSK 2017', 'volebnom obvode Liptovský Mikuláš', '2017', '3 505', '4,39 %', 'nezvolený'],
  ['claim-candidate-25-regional-result-2017', 'Voľby do ŽSK 2017', 'volebnom obvode Liptovský Mikuláš', '2017', '1 531', '1,91 %', 'nezvolený'],
  ['claim-candidate-83-regional-result-2017', 'Voľby do ŽSK 2017', 'volebnom obvode Liptovský Mikuláš', '2017', '7 738', '9,69 %', 'zvolený'],
  ['claim-candidate-87-regional-result-2017', 'Krajské voľby 2017', 'volebnom obvode č. 11', '2017', '6 064', '1,84 %', 'nezvolený'],
  ['claim-candidate-17-mayor-result-2022', 'Voľby primátora 2022', 'primátora Liptovského Mikuláša', '2022', '1 070', '9,51 %', 'nezvolená'],
  ['claim-candidate-78-mayor-result-2022', 'Voľby starostu 2022', 'starostu Veternej Poruby', '2022', '48', '23,76 %', 'nezvolený'],
  ['claim-candidate-85-city-result-2022', 'Voľby do mestského zastupiteľstva 2022', 'volebnom obvode č. 4 v Čadci', '2022', '889', '4,27 %', 'zvolená'],
  ['claim-candidate-76-city-result-2022', 'Voľby do obecného zastupiteľstva 2022', 'volebnom obvode č. 1 v Jakubovanoch', '2022', '57', '5,75 %', 'náhradník'],
  ['claim-candidate-1-city-result-2022', 'Voľby do mestského zastupiteľstva 2022', 'volebnom obvode č. 1 v Liptovskom Mikuláši', '2022', '706', '10,26 %', 'zvolený'],
  ['claim-candidate-70-city-result-2022', 'Voľby do mestského zastupiteľstva 2022', 'volebnom obvode č. 2 v Liptovskom Mikuláši', '2022', '192', '1,43 %', 'náhradník'],
  ['claim-candidate-71-city-result-2022', 'Voľby do obecného zastupiteľstva 2022', 'volebnom obvode č. 1 vo Veternej Porube', '2022', '54', '5,92 %', 'náhradníčka'],
  ['claim-candidate-78-city-result-2022', 'Voľby do obecného zastupiteľstva 2022', 'volebnom obvode č. 1 vo Veternej Porube', '2022', '70', '7,67 %', 'náhradník'],
  ['claim-candidate-90-city-result-2022', 'Voľby do obecného zastupiteľstva 2022', 'volebnom obvode č. 1 v Bystričke', '2022', '367', '10,04 %', 'zvolený'],
  ['claim-candidate-87-city-result-2022', 'Voľby do mestského zastupiteľstva 2022', 'volebnom obvode č. 1 v Žiline', '2022', '1 050', '7,71 %', 'zvolený'],
  ['claim-candidate-89-city-result-2022', 'Voľby do mestského zastupiteľstva 2022', 'volebnom obvode č. 3 v Žiline', '2022', '967', '6,76 %', 'zvolený'],
  ['claim-candidate-60-regional-result-2022', 'Voľby do ŽSK 2022', 'volebnom obvode Liptovský Mikuláš', '2022', '2 238', '2,03 %', 'nezvolená'],
  ['claim-candidate-1-regional-result-2022', 'Voľby do ŽSK 2022', 'volebnom obvode Liptovský Mikuláš', '2022', '8 812', '8,02 %', 'zvolený'],
  ['claim-candidate-70-regional-result-2022', 'Voľby do ŽSK 2022', 'volebnom obvode Liptovský Mikuláš', '2022', '1 116', '1,01 %', 'nezvolený'],
  ['claim-candidate-7-regional-result-2022', 'Voľby do ŽSK 2022', 'volebnom obvode Liptovský Mikuláš', '2022', '3 566', '3,24 %', 'nezvolený'],
  ['claim-candidate-64-regional-result-2022', 'Voľby do ŽSK 2022', 'volebnom obvode Liptovský Mikuláš', '2022', '3 100', '2,82 %', 'nezvolený'],
  ['claim-candidate-25-regional-result-2022', 'Voľby do ŽSK 2022', 'volebnom obvode Liptovský Mikuláš', '2022', '2 070', '1,88 %', 'nezvolený'],
  ['claim-candidate-11-regional-result-2022', 'Voľby do ŽSK 2022', 'volebnom obvode Liptovský Mikuláš', '2022', '3 229', '2,94 %', 'nezvolený'],
  ['claim-candidate-29-regional-result-2022', 'Voľby do ŽSK 2022', 'volebnom obvode Liptovský Mikuláš', '2022', '2 087', '1,90 %', 'nezvolený'],
  ['claim-candidate-90-regional-result-2022', 'Krajské voľby 2022', 'volebnom obvode č. 6', '2022', '2 966', '1,76 %', 'nezvolený'],
] as const;

const correctedPercentages = [
  ['claim-candidate-13-council-substitute-2018', '10,14 %'],
  ['claim-candidate-13-council-result-2022', '9,13 %'],
  ['claim-candidate-72-regional-result-2017', '4,83 %'],
  ['claim-candidate-72-mayor-result-2022', '100,00 %'],
  ['claim-candidate-75-local-result-2018', '3,85 %'],
  ['claim-candidate-75-local-result-2022', '6,82 %'],
  ['claim-candidate-77-mayor-result-2018', '3,56 %'],
  ['claim-candidate-83-mayor-result-2022', '100,00 %'],
  ['claim-candidate-84-local-result-2022', '8,37 %'],
  ['claim-candidate-33-regional-election-2022', '3,13 %'],
  ['claim-candidate-34-regional-election-2022', '3,66 %'],
  ['claim-candidate-36-regional-election-2022', '3,09 %'],
  ['claim-candidate-37-regional-election-2022', '3,30 %'],
  ['claim-candidate-62-region-council-2022', '4,66 %'],
  ['claim-candidate-83-regional-result-2022', '10,65 %'],
  ['claim-candidate-85-zsk-council-2022', '5,04 %'],
  ['claim-candidate-89-zsk-council-2022', '1,79 %'],
  ['claim-candidate-91-zsk-council-2022', '0,35 %'],
  ['claim-candidate-72-regional-result-2022', '6,09 %'],
  ['claim-candidate-84-regional-result-2022', '1,04 %'],
] as const;

describe('public-record evidence', () => {
  it('dates every published claim', () => {
    expect(data.claims.filter((claim) => !claim.period).map((claim) => claim.id)).toEqual([]);
  });

  it('requires an official source for election results, declarations and official outcomes', () => {
    const regulated = data.claims.filter((claim) =>
      ['election_result', 'declaration', 'official_outcome'].includes(claim.kind));

    const missingOfficialSource = regulated
      .filter((claim) => !claim.sourceIds.some((id) => sourcesById.get(id)?.type === 'official'))
      .map((claim) => claim.id);

    expect(missingOfficialSource).toEqual([]);
  });

  it('stores structured office and outcome metadata for every election result', () => {
    const missingElectionMetadata = data.claims
      .filter((claim) => claim.kind === 'election_result' && !claim.election)
      .map((claim) => claim.id);

    expect(missingElectionMetadata).toEqual([]);
  });

  it('builds stable election-history totals for audited candidates', () => {
    for (const candidate of data.candidates) {
      expect(() => summarizeElectionHistory(
        data.claims.filter((claim) => claim.candidateId === candidate.id),
      ), candidate.id).not.toThrow();
    }

    expect(summarizeElectionHistory(data.claims.filter((claim) => claim.candidateId === 'candidate-1')))
      .toMatchObject({
        participations: 14,
        wins: 13,
        deputyWins: 9,
        mayorWins: 4,
        regionalChairWins: 0,
        presidentWins: 0,
      });
    expect(summarizeElectionHistory(data.claims.filter((claim) => claim.candidateId === 'candidate-6')))
      .toMatchObject({
        participations: 7,
        wins: 0,
        deputyWins: 0,
        mayorWins: 0,
        regionalChairWins: 0,
        presidentWins: 0,
      });
    expect(summarizeElectionHistory(data.claims.filter((claim) => claim.candidateId === 'candidate-83')))
      .toMatchObject({
        participations: 9,
        wins: 9,
        deputyWins: 4,
        mayorWins: 5,
        regionalChairWins: 0,
        presidentWins: 0,
      });
  });

  it('locks the audited official result rows, including unsuccessful candidacies', () => {
    for (const [id, office, district, period, votes, percentage, outcome] of reconciledResults) {
      const claim = claimsById.get(id);

      expect(claim, id).toBeDefined();
      expect(claim?.kind, id).toBe('election_result');
      expect(claim?.label.sk, id).toBe(office);
      expect(claim?.period, id).toBe(period);
      expect(claim?.text.sk, id).toContain(district);
      expect(claim?.text.sk, id).toContain(votes);
      expect(claim?.text.sk, id).toContain(percentage);
      expect(claim?.text.sk.endsWith(`; výsledok: ${outcome}.`), id).toBe(true);
    }
  });

  it('preserves exact percentages added during the official-table audit', () => {
    for (const [id, percentage] of correctedPercentages) {
      expect(claimsById.get(id)?.text.sk, id).toContain(percentage);
    }
  });

  it('corrects the 2005 Jaroslav Grešo outcome', () => {
    expect(claimsById.get('claim-candidate-51-regional-election-2005')?.text.sk)
      .toContain('nezvolený');
  });

  it('does not join the Košice politician Juraj Kolesár to the current city candidate', () => {
    expect(claimsById.get('claim-candidate-55-regional-result-2017')).toBeUndefined();
    expect(claimsById.get('claim-candidate-55-nrsr-term7')).toBeUndefined();
    expect(sourcesById.get('nrsr-kolesar-term7')).toBeUndefined();
    expect(coverageById.get('coverage-candidate-55-public_office')).toMatchObject({
      status: 'searched_none',
      sourceIds: [],
    });
    expect(coverageById.get('coverage-candidate-55-previous_elections')).toMatchObject({
      status: 'searched_none',
      sourceIds: [],
    });
  });

  it('locks Dominik Imrich to district 2 in both municipal elections', () => {
    expect(claimsById.get('claim-candidate-75-local-result-2018')).toMatchObject({
      label: { sk: 'Komunálne voľby 2018' },
      period: '2018',
      text: {
        sk: 'Oficiálne výsledky uvádzajú Dominika Imricha vo volebnom obvode č. 2 v Liptovskom Hrádku so 628 hlasmi (3,85 %); výsledok: zvolený.',
      },
    });
    expect(claimsById.get('claim-candidate-75-local-result-2022')).toMatchObject({
      label: { sk: 'Komunálne voľby 2022' },
      period: '2022',
      text: {
        sk: 'Oficiálne výsledky uvádzajú Dominika Imricha vo volebnom obvode č. 2 v Liptovskom Hrádku so 657 hlasmi (6,82 %); výsledok: zvolený.',
      },
    });
  });

  it('does not join ambiguous same-name 2018 rows to current candidates', () => {
    const rejectedCandidateIds = [
      'candidate-8',
      'candidate-20',
      'candidate-22',
      'candidate-24',
      'candidate-48',
      'candidate-53',
      'candidate-78',
      'candidate-80',
    ];

    for (const candidateId of rejectedCandidateIds) {
      const ambiguous = data.claims.filter((claim) =>
        claim.candidateId === candidateId
        && claim.kind === 'election_result'
        && claim.period === '2018');

      expect(ambiguous, candidateId).toEqual([]);
    }

    const otherStaronova = data.claims.filter((claim) =>
      claim.candidateId === 'candidate-46'
      && claim.kind === 'election_result'
      && claim.period === '2018'
      && claim.text.sk.includes('758'));
    expect(otherStaronova).toEqual([]);
  });
});
