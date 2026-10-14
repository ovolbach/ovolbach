import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadElectionCycle } from '../../src/lib/load-guide-data';

const data = await loadElectionCycle(2026, 'presovsky-kraj');
const path = 'research/presov-poprad-2026-account-events-recheck.json';

describe('traceable PSK account and event recheck', () => {
  it('documents fresh financial and event searches for every one of the 320 candidates', () => {
    expect(existsSync(path)).toBe(true);
    if (!existsSync(path)) return;
    const audit = JSON.parse(readFileSync(path, 'utf8'));
    const expected = data.candidates.map((row) => row.id).sort();
    for (const domain of [audit.finance, audit.events]) {
      expect(domain.people.map((row: { candidateId: string }) => row.candidateId).sort()).toEqual(expected);
      for (const person of domain.people) {
        expect(person.queries.length, person.candidateId).toBeGreaterThan(0);
        for (const query of person.queries) {
          expect(query.q, person.candidateId).toBeTruthy();
          expect(query.checkedAt).toBe('2026-10-14');
          expect(query.receiptSha256).toMatch(/^[a-f0-9]{64}$/);
        }
        expect(person.boundary, person.candidateId).toBeTruthy();
      }
    }
  });

  it('links every exclusion-based public account to the same independently recorded national-register dossier', () => {
    expect(existsSync(path)).toBe(true);
    if (!existsSync(path)) return;
    const audit = JSON.parse(readFileSync(path, 'utf8'));
    expect(audit.finance.registers.map((row: { rowCount: number }) => row.rowCount)).toEqual([6560, 40184, 56, 2472]);
    for (const row of data.campaignFinance) {
      if (row.account.status !== 'verified' || row.account.verificationMethod !== 'register_exclusion') continue;
      const review = audit.finance.verified.find((item: { candidateId: string }) => item.candidateId === row.candidateId);
      expect(review?.exclusionEvidence, row.candidateId).toEqual(row.account.exclusionEvidence);
      expect(row.account.exclusionEvidence?.registers).toEqual(audit.finance.registers.map(
        ({ kind, sourceId, sha256, rowCount, complete }: { kind: string; sourceId: string; sha256: string; rowCount: number; complete: boolean }) => ({ kind, sourceId, sha256, rowCount, complete }),
      ));
    }
  });

  it('records unknown event endings as search limitations rather than inventing public official outcomes', () => {
    expect(existsSync(path)).toBe(true);
    if (!existsSync(path)) return;
    const audit = JSON.parse(readFileSync(path, 'utf8'));
    const recordedClaims = new Set(audit.events.acceptedClaims.map((row: { claimId: string }) => row.claimId));
    for (const claim of data.claims.filter((row) => (row.id.startsWith('recheck-') || row.id.includes('-event-')) && row.category === 'controversies')) {
      expect(recordedClaims.has(claim.id), claim.id).toBe(true);
      if (claim.kind === 'official_outcome') {
        expect(claim.sourceIds.some((sourceId) => data.sources.find((source) => source.id === sourceId)?.type === 'official'), claim.id).toBe(true);
      }
    }
    const kawka = audit.events.people.find((row: { candidateId: string }) => row.candidateId === 'psk-ondrej-kavka');
    expect(kawka.outcomeLimitations.length).toBeGreaterThan(0);
  });
});
