import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { listElectionContextConfigs, loadElectionContext } from '../../src/lib/load-guide-data';
import { summarizeElectionHistory } from '../../src/lib/profile-content';

const root = 'research/four-cities-history-2000-recheck/';
const read = (name: string) => JSON.parse(readFileSync(root + name, 'utf8'));

describe('four-city historical election recheck since 2000', () => {
  it('traces every accepted contest to its public claim and reopened originals without duplicates', async () => {
    const contexts = await Promise.all(['presov', 'poprad', 'martin', 'dolny-kubin'].map((citySlug) => loadElectionContext({ citySlug, year: 2026 })));
    const claims = new Map(contexts.flatMap(({ data }) => data.claims.map((claim) => [claim.id, claim] as const)));
    const receipts = new Set(read('journal.json').sourceReceipts.map((row: any) => row.key));
    const roster = read('accepted-roster.json');
    expect(roster).toHaveLength(822);
    expect(new Set(roster.map((row: any) => `${row.candidateId}/${row.office}/${row.date}/${row.locality}/${row.district}`)).size).toBe(822);
    for (const row of roster) {
      const claim = claims.get(row.claimId);
      expect(claim, row.claimId).toBeDefined();
      expect(claim?.candidateId, row.claimId).toBe(row.candidateId);
      expect(claim?.election, row.claimId).toEqual({ contestId: row.contestId, office: row.office, outcome: row.outcome });
      expect(new Set(row.identityJoin.attributes.map((attribute: any) => attribute.type)).size, row.claimId).toBeGreaterThanOrEqual(2);
      for (const key of row.sourceKeys) expect(receipts.has(key), `${row.claimId}/${key}`).toBe(true);
    }
    expect([...claims.values()].filter((claim) => claim.election && ['mayor', 'municipal_council', 'regional_chair', 'regional_council'].includes(claim.election.office))).toHaveLength(823);
  });
  it.each([
    ['mt-peter-kasuba', 'Peter Kašuba', 5, 1378, 'elected', 'zvolený'],
    ['mt-tibor-adamko', 'Tibor Adamko', 4, 460, 'elected', 'zvolený'],
    ['mt-lubomir-vanko', 'Ľubomír Vaňko', 5, 965, 'elected', 'zvolený'],
    ['mt-daniel-diskanec', 'Daniel Diškanec', 5, 515, 'substitute', 'nezvolený; náhradník'],
    ['mt-tomas-zanovit', 'Tomáš Zanovit', 6, 748, 'elected', 'zvolený'],
    ['mt-peter-torok', 'Peter Török', 6, 624, 'elected', 'zvolený'],
    ['mt-peter-matejka', 'Peter Matejka', 6, 480, 'elected', 'zvolený'],
    ['mt-marian-fedor', 'Marián Fedor', 7, 575, 'elected', 'zvolený'],
    ['mt-juraj-diabelko', 'Juraj Diabelko', 5, 203, 'substitute', 'nezvolený; náhradník'],
    ['mt-michal-kral', 'Michal Kráľ', 1, 464, 'substitute', 'nezvolený; náhradník'],
  ] as const)('retains the independently reviewed Martin 2010 row for %s', async (id, name, district, votes, outcome, phrase) => {
    const { data } = await loadElectionContext({ citySlug: 'martin', year: 2026 });
    const result = data.claims.filter((claim) => claim.candidateId === id && claim.election?.office === 'municipal_council' && claim.period?.startsWith('2010'));
    expect(result).toHaveLength(1);
    expect(result[0]!.text.sk).toBe(`Vo voľbách do obecného alebo mestského zastupiteľstva v roku 2010 v území Martin (volebný obvod č. ${district}) je pri mene ${name} uvedených ${votes} hlasov. Oficiálny výsledok: ${phrase}.`);
    expect(result[0]!.election?.outcome).toBe(outcome);
  });

  it('requires a common possible birth interval across every accepted age-based identity join', () => {
    const roster = read('accepted-roster.json');
    const intervals = new Map<string, Array<[number, number]>>();
    const interval = (date: string, age: number): [number, number] => {
      const [year, month, day] = date.split('-').map(Number) as [number, number, number];
      return [Date.UTC(year - age - 1, month - 1, day) + 86400000, Date.UTC(year - age, month - 1, day)];
    };
    for (const row of roster) {
      for (const attribute of row.identityJoin.attributes) {
        if (attribute.type !== 'age') continue;
        const existing = intervals.get(row.candidateId) ?? [interval(attribute.currentDate, attribute.current)];
        intervals.set(row.candidateId, [...existing, interval(attribute.date, attribute.historical)]);
      }
    }
    for (const [id, ranges] of intervals) {
      expect(Math.max(...ranges.map(([start]) => start)), id).toBeLessThanOrEqual(Math.min(...ranges.map(([, end]) => end)));
    }
  });

  it('withholds the Török age-reference conflict and excludes the two incompatible Martin 2010 ages', () => {
    const withheld = read('withheld-matches.json');
    expect(withheld.some((row: any) => row.candidateId === 'mt-peter-torok' && row.record.datasetId === '2014-municipal_council' && row.reason.includes('age reference'))).toBe(true);
    for (const [id, age] of [['mt-zdenka-lackova', 60], ['mt-bibiana-panisova', 38]] as const) {
      expect(read('exclusions.json').some((row: any) => row.candidateId === id && row.record.datasetId === '2010-municipal_council' && row.record.age === age)).toBe(true);
    }
  });
  it('keeps the full corrected Choma 2017 substitute wording and count', async () => {
    const { data } = await loadElectionContext({ citySlug: 'martin', year: 2026 });
    const result = data.claims.find((claim) => claim.id === 'claim-candidate-87-regional-result-2017')!;
    expect(result.text.sk).toBe('Oficiálne výsledky uvádzajú Igora Chomu vo volebnom obvode č. 11 so 6 064 hlasmi (1,84 %); výsledok: nezvolený; náhradník.');
    expect(result.election?.outcome).toBe('substitute');
    expect(summarizeElectionHistory([result])).toMatchObject({ participations: 1, wins: 0 });
  });
  it('recovers the 2005 elected row despite the official result table region spelling error', async () => {
    const { data } = await loadElectionContext({ citySlug: 'martin', year: 2026 });
    const result = data.claims.filter((claim) => claim.candidateId === 'mt-peter-kasuba' &&
      claim.election?.office === 'regional_council' && claim.period?.startsWith('2005'));
    expect(result).toHaveLength(1);
    expect(result[0]!.text.sk).toBe('Vo voľbách do zastupiteľstva samosprávneho kraja v roku 2005 v území Žilinský kraj (volebný obvod č. 6) je pri mene Peter Kašuba uvedených 1582 hlasov. Oficiálny výsledok: zvolený.');
    expect(result[0]!.election?.outcome).toBe('elected');
  });
  it('dates every city view exposing the changed shared profiles to the same public snapshot', async () => {
    const cities = ['presov', 'poprad', 'martin', 'dolny-kubin', 'zilina', 'ruzomberok', 'liptovsky-mikulas'];
    const configs = (await listElectionContextConfigs()).filter((row) => cities.includes(row.citySlug));
    expect(configs).toHaveLength(7);
    expect(configs.map((row) => row.snapshotDate)).toEqual(cities.map(() => '2026-10-15'));
  });
  it('preserves the formally withdrawn 2010 Tomič candidacy without counting a participation', async () => {
    const { data } = await loadElectionContext({ citySlug: 'presov', year: 2026 });
    const result = data.claims.filter((claim) => claim.candidateId === 'psk-patrik-tomic' &&
      claim.election?.office === 'mayor' && claim.period?.startsWith('2010'));
    expect(result).toHaveLength(1);
    expect(result[0]!.text.sk).toBe('Vo voľbách starostu obce alebo primátora mesta v roku 2010 v území Prešov je pri mene Patrik Tomič uvedených 59 hlasov. Oficiálny výsledok: kandidát sa vzdal kandidatúry.');
    expect(result[0]!.election?.outcome).toBe('withdrawn');
    expect(summarizeElectionHistory(result)).toMatchObject({ participations: 0, wins: 0 });
  });

  it('reads the Martin 2010 vote cell separately from the party-code cell', async () => {
    const { data } = await loadElectionContext({ citySlug: 'martin', year: 2026 });
    const result = data.claims.filter((claim) => claim.candidateId === 'mt-tatiana-cervenova' &&
      claim.election?.office === 'municipal_council' && claim.period?.startsWith('2010'));
    expect(result).toHaveLength(1);
    expect(result[0]!.text.sk).toBe('Vo voľbách do obecného alebo mestského zastupiteľstva v roku 2010 v území Martin (volebný obvod č. 1) je pri mene Tatiana Červeňová uvedených 876 hlasov. Oficiálny výsledok: zvolený.');
    expect(result[0]!.election?.outcome).toBe('elected');
  });
  it('journals every scoped person against all 24 regular office/cycles', async () => {
    expect(existsSync(root + 'journal.json')).toBe(true);
    const journal = read('journal.json');
    const contexts = await Promise.all(['presov', 'poprad', 'martin', 'dolny-kubin']
      .map((citySlug) => loadElectionContext({ citySlug, year: 2026 })));
    const people = new Set(contexts.flatMap(({ data }) => data.candidates.map(({ id }) => id)));
    const candidacies = new Set(contexts.flatMap(({ data }) => data.candidacies.map(({ id }) => id)));
    const coverage = new Map(contexts.flatMap(({ data }) => data.researchCoverage.map((row) => [row.id, row] as const)));
    expect(people.size).toBe(496);
    expect(candidacies.size).toBe(624);
    expect(coverage.size).toBe(3968);
    expect([...coverage.values()].some((row) => row.status === 'pending')).toBe(false);
    for (const id of people) expect([...coverage.values()].filter((row) => row.candidateId === id)).toHaveLength(8);
    expect(journal.scope.candidateIds.toSorted()).toEqual([...people].toSorted());
    const expected = [...people].flatMap((id) => [
      ...[2002, 2006, 2010, 2014, 2018, 2022].flatMap((year) =>
        ['mayor', 'municipal_council'].map((office) => `${id}/${year}-${office}`)),
      ...[2001, 2005, 2009, 2013, 2017, 2022].flatMap((year) =>
        ['regional_chair', 'regional_council'].map((office) => `${id}/${year}-${office}`)),
    ]).sort();
    const regular = journal.personCycleCoverage.filter((row: { datasetId: string }) => /^\d{4}-(mayor|municipal_council|regional_chair|regional_council)$/.test(row.datasetId));
    expect(regular.map((row: { candidateId: string; datasetId: string }) => `${row.candidateId}/${row.datasetId}`).sort()).toEqual(expected);
    expect(regular).toHaveLength(11904);
  });

  it('publishes the missing 2013 results with their complete official outcomes', async () => {
    const martin = await loadElectionContext({ citySlug: 'martin', year: 2026 });
    const kubin = await loadElectionContext({ citySlug: 'dolny-kubin', year: 2026 });
    const presov = await loadElectionContext({ citySlug: 'presov', year: 2026 });
    for (const [data, candidateId, outcome, text] of [
      [martin.data, 'mt-tatiana-cervenova', 'elected', 'Vo voľbách do zastupiteľstva samosprávneho kraja v roku 2013 v území Žilinský kraj (volebný obvod č. 6) je pri mene Tatiana Červeňová uvedených 3649 hlasov. Oficiálny výsledok: zvolený.'],
      [kubin.data, 'dk-jozef-brtos', 'not_elected', 'Vo voľbách do zastupiteľstva samosprávneho kraja v roku 2013 v území Žilinský kraj (volebný obvod č. 3) je pri mene Jozef Brtoš uvedených 405 hlasov. Oficiálny výsledok: nezvolený.'],
      [presov.data, 'psk-jan-ahlers', 'elected', 'Vo voľbách do zastupiteľstva samosprávneho kraja v roku 2013 v území Prešovský kraj (volebný obvod č. 7) je pri mene Ján Ahlers uvedených 4694 hlasov. Oficiálny výsledok: zvolený.'],
    ] as const) {
      const result = data.claims.filter((claim) => claim.candidateId === candidateId &&
        claim.election?.office === 'regional_council' && claim.period?.startsWith('2013'));
      expect(result, candidateId).toHaveLength(1);
      expect(result[0]!.election?.outcome).toBe(outcome);
      expect(result[0]!.text.sk).toBe(text);
      expect(result[0]!.checkedAt).toBe('2026-10-15');
    }
  });
});
