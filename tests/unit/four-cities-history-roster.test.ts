import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadElectionCycle, loadGlobalSources } from '../../src/lib/load-guide-data';
import { summarizeElectionHistory } from '../../src/lib/profile-content';
import type { Claim } from '../../src/lib/schemas';

interface ReviewedContest {
  candidateId: string;
  contestId: string;
  office: NonNullable<Claim['election']>['office'];
  outcome: NonNullable<Claim['election']>['outcome'];
  claimIds: string[];
  sourceIds: string[];
}
const read = (name: string): ReviewedContest[] => JSON.parse(readFileSync(
  new URL(`../../research/four-cities-2026-recheck/${name}`, import.meta.url), 'utf8'));
const reviewed = read('history-accepted-roster.json');
const retainedOtherOffices = read('history-retained-other-offices.json');
const changedClaims: Claim[] = JSON.parse(readFileSync(
  new URL('../../research/four-cities-2026-recheck/history-proposals.json', import.meta.url), 'utf8')).claimUpserts.concat(
  JSON.parse(readFileSync(new URL('../../research/four-cities-2026-recheck/history-delta-002-reviewed-additions.json', import.meta.url), 'utf8')).claimUpserts);
const cycles = await Promise.all(['trnavsky-kraj', 'trenciansky-kraj', 'nitriansky-kraj', 'banskobystricky-kraj']
  .map((region) => loadElectionCycle(2026, region)));
const claims = cycles.flatMap((cycle) => cycle.claims);
const claimById = new Map(claims.map((claim) => [claim.id, claim]));
const sourceIds = new Set((await loadGlobalSources()).map((source) => source.id));

describe('independent reviewed election roster and public totals', () => {
  it('keeps one reviewed entry for each candidate, office and actual contest, including two-round elections', () => {
    const keys = [...reviewed, ...retainedOtherOffices].map((row) => `${row.candidateId}/${row.office}/${row.contestId}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('binds every reviewed contest to published claims with the same office and complete outcome', () => {
    for (const row of [...reviewed, ...retainedOtherOffices]) {
      expect(row.claimIds.length, row.contestId).toBeGreaterThan(0);
      expect(row.sourceIds.length, row.contestId).toBeGreaterThan(0);
      for (const id of row.sourceIds) expect(sourceIds.has(id), `${row.contestId}: ${id}`).toBe(true);
      for (const id of row.claimIds) {
        expect(claimById.get(id), id).toMatchObject({ candidateId: row.candidateId,
          election: { contestId: row.contestId, office: row.office, outcome: row.outcome } });
      }
    }
  });

  it('locks the complete result phrase for every generated changed claim, including losses and withdrawals', () => {
    const phrases = { elected: 'zvolený.', not_elected: 'nezvolený.', substitute: 'náhradník.' };
    for (const proposed of changedClaims.filter((claim) => claim.id.includes('-history-') && claim.election)) {
      const published = claimById.get(proposed.id)!;
      expect(published, proposed.id).toBeDefined();
      const outcome = published.election!.outcome;
      const resultPhrase = published.text.sk.split(';').at(-1)?.trim();
      if (outcome === 'withdrawn') {
        expect(resultPhrase, proposed.id).toMatch(/^oficiálny stav: vzdal sa kandidatúry alebo bol odvolaný\. Výsledková tabuľka uvádza \d+ hlasov \(\d+,\d{2} %\)\.$/u);
      } else {
        expect(resultPhrase?.replace(/^konečný /u, ''), proposed.id).toBe(`oficiálny výsledok: ${phrases[outcome]}`);
      }
    }
  });

  it('preserves the limited nonwinner wording of the four retained Trnava results', () => {
    const expected = {
      'ttsk-ivana-varga-babelova-previous_elections-1-2026': 'V oficiálnej výsledkovej tabuľke volieb 2018 v Trnave, obvod2, má Ivana Varga Babeľová 446 hlasov (2,25 %). Tabuľka ho/ju neoznačuje ako zvoleného kandidáta.',
      'ttsk-marian-kubal-previous_elections-1-2026': 'V oficiálnej výsledkovej tabuľke volieb 2018 v Trnave, obvod5, má Marián Kubál 374 hlasov (3,45 %). Tabuľka ho/ju neoznačuje ako zvoleného kandidáta.',
      'ttsk-kristina-rysava-previous_elections-1-2026': 'V oficiálnej výsledkovej tabuľke volieb 2018 v Trnave, obvod4, má Kristína Ryšavá 581 hlasov (2,83 %). Tabuľka ho/ju neoznačuje ako zvoleného kandidáta.',
      'ttsk-stanislav-surin-previous_elections-1-2026': 'V oficiálnej výsledkovej tabuľke volieb 2018 v Trnave, obvod1, získal Stanislav Šurin 389 hlasov (3,20 %); tabuľka ho neoznačuje ako zvoleného kandidáta.',
    };
    for (const [id, text] of Object.entries(expected)) {
      expect(claimById.get(id)?.text.sk, id).toBe(text);
      expect(claimById.get(id)?.election?.outcome, id).toBe('not_elected');
    }
  });

  it('reconciles all 546 displayed participation and victory totals against the separate reviewed roster', () => {
    const roster = [...reviewed, ...retainedOtherOffices];
    const rosterClaims = new Set(roster.flatMap((row) => row.claimIds));
    for (const claim of claims.filter((row) => row.election)) expect(rosterClaims.has(claim.id), claim.id).toBe(true);
    const people = cycles.flatMap((cycle) => cycle.candidates);
    expect(people).toHaveLength(546);
    for (const person of people) {
      const participating = roster.filter((row) => row.candidateId === person.id && row.outcome !== 'withdrawn');
      const wins = participating.filter((row) => row.outcome === 'elected');
      expect(summarizeElectionHistory(claims.filter((row) => row.candidateId === person.id)), person.id).toMatchObject({
        participations: participating.length,
        wins: wins.length,
        deputyWins: wins.filter((row) => ['municipal_council', 'regional_council', 'national_council', 'european_parliament'].includes(row.office)).length,
        mayorWins: wins.filter((row) => row.office === 'mayor').length,
        regionalChairWins: wins.filter((row) => row.office === 'regional_chair').length,
        presidentWins: wins.filter((row) => row.office === 'president').length,
      });
    }
  });
});
