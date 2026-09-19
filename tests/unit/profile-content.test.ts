import { describe, expect, it } from 'vitest';
import { coverageMessage, coverageTitle, summarizeElectionHistory } from '../../src/lib/profile-content';
import type { Claim } from '../../src/lib/schemas';

describe('profile coverage content', () => {
  it('renders searched_none as the approved neutral sentence', () => {
    expect(coverageMessage('searched_none')).toBe('Vo verejne dostupných zdrojoch sa údaj nenašiel.');
  });

  it('renders not_applicable without claiming a search occurred', () => {
    expect(coverageMessage('not_applicable')).toBe('Údaj sa na kandidáta nevzťahuje.');
  });

  it('keeps pending distinct from searched_none', () => {
    expect(coverageTitle('pending')).toBe('Údaje sa overujú.');
    expect(coverageMessage('pending')).toBe('Údaje sa overujú.');
  });

  it('counts unique election participations and elected offices since 2000', () => {
    const base: Omit<Claim, 'id' | 'period' | 'election'> = {
      candidateId: 'candidate-test',
      category: 'previous_elections',
      kind: 'election_result',
      label: { sk: 'Voľby' },
      text: { sk: 'Výsledok.' },
      sourceIds: ['source-test'],
      checkedAt: '2026-09-18',
    };
    const claims: Claim[] = [
      {
        ...base,
        id: 'council-win',
        period: '2002',
        election: { contestId: 'oso-2002-council', office: 'municipal_council', outcome: 'elected' },
      },
      {
        ...base,
        id: 'mayor-win',
        period: '2006',
        sourceIds: ['mayor-source'],
        election: { contestId: 'oso-2006-mayor', office: 'mayor', outcome: 'elected' },
      },
      {
        ...base,
        id: 'national-substitute',
        period: '2023',
        election: { contestId: 'nrsr-2023', office: 'national_council', outcome: 'substitute' },
      },
      {
        ...base,
        id: 'national-substitute-duplicate',
        period: '2023-10-25',
        election: { contestId: 'nrsr-2023', office: 'national_council', outcome: 'substitute' },
      },
      {
        ...base,
        id: 'president-loss',
        period: '2024',
        election: { contestId: 'prez-2024', office: 'president', outcome: 'not_elected' },
      },
      {
        ...base,
        id: 'pre-cutoff-win',
        period: '1998',
        election: { contestId: 'oso-1998-mayor', office: 'mayor', outcome: 'elected' },
      },
      {
        ...base,
        id: 'withdrawn-national',
        period: '2020',
        sourceIds: ['withdrawn-source'],
        election: { contestId: 'nrsr-2020', office: 'national_council', outcome: 'withdrawn' },
      },
    ];

    expect(summarizeElectionHistory(claims)).toEqual({
      participations: 4,
      wins: 2,
      deputyWins: 1,
      mayorWins: 1,
      regionalChairWins: 0,
      presidentWins: 0,
      sourceIds: ['source-test', 'mayor-source'],
    });
  });
});
