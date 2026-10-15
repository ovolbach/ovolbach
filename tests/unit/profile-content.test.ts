import { describe, expect, it } from 'vitest';
import { PROFILE_CATEGORIES, coverageMessage, coverageTitle, summarizeElectionHistory } from '../../src/lib/profile-content';
import type { Claim } from '../../src/lib/schemas';

describe('profile coverage content', () => {
  it('uses the approved heading for publicly documented events and proceedings', () => {
    expect(PROFILE_CATEGORIES.find((category) => category.id === 'controversies')?.title)
      .toBe('Verejne doložené udalosti a konania');
  });

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

  it.each(['2000', '2022-10-29', '29. 10. 2022', '29.10.2022', '29. októbra 2022', 'voľby 29. októbra 2022', 'Voľby 4.11.2017', 'Voľby 2022'])
    ('counts a historical result with period %s', (period) => {
      expect(summarizeElectionHistory([result(period)]).participations).toBe(1);
    });

  it.each(['1999', '29. 10. 1998', '1998–2002', '2022–2026', 'voľby bez dátumu', '12022'])
    ('does not guess an eligible election year from period %s', (period) => {
      expect(summarizeElectionHistory([result(period)]).participations).toBe(0);
    });

  it('counts two rounds of the same historical contest once and separate offices independently', () => {
    const firstRound = result('9. 11. 2013');
    const secondRound = { ...result('23. novembra 2013'), id: 'second-round' };
    const council = { ...result('9. 11. 2013'), id: 'council', election: {
      contestId: 'regional-council-2013', office: 'regional_council' as const, outcome: 'substitute' as const,
    } };
    expect(summarizeElectionHistory([firstRound, secondRound, council])).toMatchObject({
      participations: 2, wins: 1, regionalChairWins: 1, deputyWins: 0,
    });
  });

  it('excludes withdrawals in Slovak-date periods and detects contradictory results', () => {
    const withdrawn = { ...result('29. októbra 2022'), election: {
      contestId: 'regional-chair-test', office: 'regional_chair' as const, outcome: 'withdrawn' as const,
    } };
    expect(summarizeElectionHistory([withdrawn])).toMatchObject({ participations: 0, wins: 0, sourceIds: [] });
    const lost = { ...result('2022'), id: 'conflict', election: {
      ...result('2022').election!, outcome: 'not_elected' as const,
    } };
    expect(() => summarizeElectionHistory([result('29. októbra 2022'), lost])).toThrow('Conflicting election metadata');
  });

  it('counts distinct offices sharing a legacy election ID and excludes withdrawn-office sources', () => {
    const mayor = { ...result('voľby 29. 10. 2022'), sourceIds: ['mayor-source'], election: {
      contestId: 'municipal-2022', office: 'mayor' as const, outcome: 'not_elected' as const,
    } };
    const council = { ...result('2022'), id: 'council-result', sourceIds: ['council-source'], election: {
      contestId: 'municipal-2022', office: 'municipal_council' as const, outcome: 'elected' as const,
    } };
    expect(summarizeElectionHistory([mayor, council])).toMatchObject({ participations: 2, wins: 1, deputyWins: 1 });
    expect(summarizeElectionHistory([{ ...mayor, election: { ...mayor.election, outcome: 'withdrawn' } }, council]))
      .toMatchObject({ participations: 1, wins: 1, sourceIds: ['council-source'] });
  });
});

function result(period: string): Claim {
  return {
    id: 'historical-result', candidateId: 'candidate-test', category: 'previous_elections', kind: 'election_result',
    label: { sk: 'Výsledok volieb' }, text: { sk: 'Oficiálny výsledok: zvolený.' }, period,
    sourceIds: ['source-test'], checkedAt: '2026-10-15',
    election: { contestId: 'regional-chair-test', office: 'regional_chair', outcome: 'elected' },
  };
}
