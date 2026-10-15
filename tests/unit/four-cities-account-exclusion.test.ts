import { describe, expect, it } from 'vitest';
import { loadElectionCycle } from '../../src/lib/load-guide-data';
import { campaignFinanceSchema } from '../../src/lib/schemas';

const regions = ['trnavsky-kraj', 'trenciansky-kraj', 'nitriansky-kraj', 'banskobystricky-kraj'];
const cycles = await Promise.all(regions.map((region) => loadElectionCycle(2026, region)));
const registers = [
  ['mayor', 'finance-national-mayors-2026'], ['city-council', 'finance-national-councillors-2026'],
  ['region-chair', 'finance-national-chairs-2026'], ['region-council', 'finance-national-regional-councillors-2026'],
];

function dossier(candidateId: string) {
  return {
    ...cycles[0]!.campaignFinance[0]!, candidateId,
    account: {
      status: 'verified', verificationMethod: 'register_exclusion', identity: [],
      iban: 'SK6183300000002503499252', sourceIds: ['account-original'],
      exclusionEvidence: {
        scope: 'four-cities-2026', checkedAt: '2026-10-15',
        registers: registers.map(([kind, sourceId]) => ({ kind, sourceId, sha256: 'a'.repeat(64), rowCount: 100, complete: true })),
        matches: [{ candidateId, name: 'Test', municipality: 'Test', ageAtElection: 40,
          sourceIds: ['finance-national-mayors-2026'], decision: 'retained', reason: 'Jediná doložená osoba po vylúčení menovcov.' }],
        remainingCandidateId: candidateId, accountSourceIds: ['account-original'],
      },
    },
  };
}

describe('the user-approved fixed four-city campaign-account cohort', () => {
  it('accepts a complete exclusion dossier for each of the 546 approved candidate IDs', () => {
    const candidates = cycles.flatMap((data) => data.candidates);
    expect(candidates).toHaveLength(546);
    expect(new Set(candidates.map((person) => person.id)).size).toBe(546);
    for (const person of candidates) expect(campaignFinanceSchema.safeParse(dossier(person.id)).success, person.id).toBe(true);
  });

  it.each(['ttsk-unapproved-person', 'tsk-unapproved-person', 'nsk-unapproved-person', 'bbsk-unapproved-person', 'psk-marian-geci', 'candidate-85'])
    ('does not authorize another candidate through a matching prefix: %s', (candidateId) => {
      expect(campaignFinanceSchema.safeParse(dossier(candidateId)).success).toBe(false);
    });

  it('rejects two retained namesakes, missing registers, an unrelated scope and a later review date', () => {
    const candidateId = cycles[0]!.candidates[0]!.id;
    const two = dossier(candidateId);
    two.account.exclusionEvidence.matches.push({ ...two.account.exclusionEvidence.matches[0]!, candidateId: 'namesake' });
    expect(campaignFinanceSchema.safeParse(two).success).toBe(false);
    const missing = dossier(candidateId); missing.account.exclusionEvidence.registers.pop();
    expect(campaignFinanceSchema.safeParse(missing).success).toBe(false);
    const wrongScope = dossier(candidateId); wrongScope.account.exclusionEvidence.scope = 'presovsky-kraj-2026';
    expect(campaignFinanceSchema.safeParse(wrongScope).success).toBe(false);
    const future = dossier(candidateId); future.account.exclusionEvidence.checkedAt = '2026-10-16';
    expect(campaignFinanceSchema.safeParse(future).success).toBe(false);
  });

  it('retains the two-attribute requirement for direct and candidate-site verification', () => {
    for (const verificationMethod of ['direct', 'candidate_site']) {
      const row = dossier(cycles[0]!.candidates[0]!.id);
      expect(campaignFinanceSchema.safeParse({ ...row, account: {
        status: 'verified', verificationMethod, identity: [], iban: row.account.iban, sourceIds: ['account-original'],
      } }).success).toBe(false);
    }
  });
});
