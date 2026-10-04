import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadElectionContext } from '../../src/lib/load-guide-data';
import baseline from '../fixtures/dolny-kubin-media-baseline.json';

const auditPath = 'research/dolny-kubin-media-review-2026.json';
const readAudit = () => existsSync(auditPath) ? JSON.parse(readFileSync(auditPath, 'utf8')) : undefined;
const loadCity = () => loadElectionContext({ citySlug: 'dolny-kubin', year: 2026 });

describe('Dolný Kubín additional media and event continuity review', () => {
  // Catches silently unreviewed people or dropped old reports in a supposedly complete audit.
  it('accounts for all 59 people and all 82 previously published media-related claims', async () => {
    const audit = readAudit();
    expect(audit).toBeDefined();
    if (!audit) return;
    expect(audit.snapshotDate).toBe('2026-10-03');
    expect(audit.candidates.map((row: { candidateId: string }) => row.candidateId).toSorted()).toEqual(baseline.candidateIds.toSorted());
    const reviewed = audit.candidates.flatMap((row: { existingClaimIds: string[] }) => row.existingClaimIds).toSorted();
    expect(reviewed).toEqual(baseline.mediaClaimIds.toSorted());
    for (const person of audit.candidates) {
      expect(person.queries.length, person.candidateId).toBeGreaterThanOrEqual(2);
      expect(person.checkedAt, person.candidateId).toBe('2026-10-03');
      expect(Array.isArray(person.reopenedSources), person.candidateId).toBe(true);
      expect(person.limits.length, person.candidateId).toBeGreaterThan(0);
    }
  });

  // Catches a source-less invented ending, wrong-person join or missing beginning/response boundary.
  it('ties every recorded origin and latest stage to existing sources and preserves uncertainty', async () => {
    const audit = readAudit();
    expect(audit).toBeDefined();
    if (!audit) return;
    const { data } = await loadCity();
    const people = new Set(data.candidates.map((row) => row.id));
    const sources = new Map(data.sources.map((row) => [row.id, row]));
    const claims = new Map(data.claims.map((row) => [row.id, row]));
    const traced = new Set(audit.eventChains.flatMap((chain: { origin: { claimIds: string[] }; intermediate: { claimIds: string[] }[]; responses: { claimIds: string[] }[]; latest: { claimIds: string[] } }) =>
      [chain.origin, ...(chain.intermediate ?? []), ...(chain.responses ?? []), chain.latest].flatMap((step) => step.claimIds)));
    for (const id of [...baseline.mediaClaimIds, ...audit.addedClaimIds]) expect(traced.has(id), id).toBe(true);
    for (const chain of audit.eventChains) {
      expect(chain.candidateIds.length, chain.id).toBeGreaterThan(0);
      expect(chain.candidateIds.every((id: string) => people.has(id)), chain.id).toBe(true);
      expect(chain.outcomeStatus, chain.id).toMatch(/^(official_procedural|official_final|reported_only|unresolved|not_applicable)$/);
      expect(chain.limits.length, chain.id).toBeGreaterThan(0);
      for (const step of [chain.origin, ...(chain.intermediate ?? []), ...(chain.responses ?? []), chain.latest]) {
        expect(step, chain.id).toBeDefined();
        expect(step.date, chain.id).toBeTruthy();
        expect(step.sourceIds.length, chain.id).toBeGreaterThan(0);
        expect(step.sourceIds.every((id: string) => sources.has(id)), chain.id).toBe(true);
        for (const id of step.claimIds) {
          expect(claims.has(id), id).toBe(true);
          expect(chain.candidateIds.includes(claims.get(id)!.candidateId), id).toBe(true);
        }
      }
    }
    for (const id of audit.addedClaimIds) {
      const claim = claims.get(id);
      expect(claim, id).toBeDefined();
      expect(claim!.period, id).toBeTruthy();
      expect(claim!.checkedAt, id).toBe('2026-10-03');
      if (claim!.kind === 'official_outcome') expect(claim!.sourceIds.some((sourceId) => sources.get(sourceId)?.type === 'official'), id).toBe(true);
    }
  });

  // Catches collateral edits outside this explicitly authorized media refresh.
  it('preserves the approved official roster, finance evidence and full historical election results', async () => {
    const { data } = await loadCity();
    expect(data.candidacies).toEqual(baseline.candidacies);
    // Later, separately audited account research may update only the account and its date.
    const rechecked = new Set(['candidate-85', 'dk-jan-marsinsky', 'dk-jan-prilepok']);
    for (const approved of baseline.campaignFinance) {
      const current = data.campaignFinance.find((row) => row.id === approved.id);
      expect(current, approved.id).toBeDefined();
      if (rechecked.has(approved.candidateId)) {
        expect({ ...current, account: approved.account, checkedAt: approved.checkedAt }, approved.id).toEqual(approved);
      } else {
        expect(current, approved.id).toEqual(approved);
      }
    }
    expect(data.claims.filter((row) => row.kind === 'election_result')).toEqual(baseline.electionResults);
  });

  it('includes the missed follow-up responses without presenting them as official findings', async () => {
    const { data } = await loadCity();
    for (const [id, person, period] of [
      ['dkm0-belousovova-rizman-followup', 'candidate-85', '2026-01-30'],
      ['dkm0-kapitulik-fiabane-followup', 'candidate-89', '2026-02-25'],
      ['dkm0-lucansky-echr-response-march', 'candidate-90', '2026-03-06'],
    ]) {
      const row = data.claims.find((claim) => claim.id === id);
      expect(row, id).toBeDefined();
      expect(row).toMatchObject({ candidateId: person, kind: 'response', period });
    }
    const advertisement = data.claims.find((row) => row.id === 'dkm0-kapitulik-fiabane-followup');
    expect(advertisement?.text.sk).toContain('politická reklama');
    const courtResponse = data.claims.find((row) => row.id === 'dkm0-lucansky-echr-response-march');
    expect(courtResponse?.text.sk).toContain('nie o rozhodnutie ESĽP');
  });

  it('records the missing parliamentary motion between the incident and the reported committee decision', () => {
    const audit = readAudit();
    const chain = audit?.eventChains.find((row: { id: string }) => row.id === 'belousovova-slap-2010');
    expect(chain?.origin.date).toBe('2010-08-10');
    expect(chain?.intermediate).toContainEqual(expect.objectContaining({ date: '2010-08-11', claimIds: ['dkm0-belousovova-disciplinary-motion'] }));
    expect(chain?.latest.date).toBe('2010-09-02');
    expect(chain?.outcomeStatus).toBe('reported_only');
  });

  it('keeps the limited Winton audit separate from the later canoeing complaint', async () => {
    const { data } = await loadCity();
    const audit = readAudit();
    const finding = data.claims.find((row) => row.id === 'dkm1-brunckova-winton-invoices-outcome');
    expect(finding).toMatchObject({ candidateId: 'dk-katarina-brunckova', kind: 'official_outcome' });
    expect(finding?.text.sk).toContain('siedmich faktúr');
    expect(finding?.text.sk).toContain('11 200 eur');
    expect(finding?.text.sk).toContain('vybranej vzorky');
    expect(finding?.period).toContain('2025-05-12');
    expect(audit?.eventChains.find((row: { id: string }) => row.id === 'dkm1-chain-stanovsky-kosice')?.outcomeStatus).toBe('unresolved');
  });

  it('includes the missed procedural TSS decision without claiming personal exoneration or finality', async () => {
    const { data } = await loadCity();
    const row = data.claims.find((claim) => claim.id === 'dkm1-tss-procedural-stop-2022');
    expect(row).toMatchObject({ candidateId: 'dk-katarina-brunckova', kind: 'official_outcome' });
    expect(row?.text.sk).toContain('procesné');
    expect(row?.text.sk).toContain('preskúmať znovu');
    expect(row?.period).toContain('právoplatnosť samostatne neoverená');
  });

  it('preserves the correct person named in Bruncková’s original response', async () => {
    const { data } = await loadCity();
    const row = data.claims.find((claim) => claim.id === 'dkm1-brunckova-tss-response-2020');
    expect(row?.text.sk).toContain('Františka Hodorovského');
    expect(row?.text.sk).not.toContain('Juraja Hodorovského');
  });

  it('keeps the school objection and the director’s later explanation together without inventing a ruling', async () => {
    const { data } = await loadCity();
    const objection = data.claims.find((row) => row.id === 'dkm2-lavrik-school-objection-20251120');
    const explanation = data.claims.find((row) => row.candidateId === 'dk-peter-strezo' && row.category === 'controversies' && row.period === '2026-02-12');
    const earlierParticipant = data.claims.find((row) => row.id === 'dkm1-jurcikova-school-discussion-response-20251120');
    expect(objection).toMatchObject({ candidateId: 'dk-michal-lavrik', kind: 'response', period: '2025-11-20' });
    expect(explanation?.kind).toBe('response');
    expect(earlierParticipant?.kind).toBe('response');
    const audit = readAudit();
    expect(audit?.eventChains.some((chain: { candidateIds: string[]; origin: { date: string }; latest: { date: string }; outcomeStatus: string }) =>
      chain.candidateIds.includes('dk-peter-strezo') && chain.origin.date === '2025-11-20' && chain.latest.date === '2026-02-12'
      && ['reported_only', 'unresolved'].includes(chain.outcomeStatus))).toBe(true);
  });

  it('attributes the younger Stanovský disciplinary report to journalism and preserves the older person separately', async () => {
    const { data } = await loadCity();
    const disciplinary = data.claims.find((row) => row.id === 'dkm2-younger-stanovsky-disciplinary-report-20241129');
    expect(disciplinary).toMatchObject({ candidateId: 'dk-martin-stanovsky-30', kind: 'media_report', category: 'controversies' });
    expect(disciplinary?.period).toContain('presný dátum rozhodnutia neoverený');
    const olderReports = data.claims.filter((row) => row.id.startsWith('dkm1-') && row.candidateId === 'dk-martin-stanovsky-53' && row.category === 'controversies');
    expect(olderReports.some((row) => row.period?.includes('2024'))).toBe(true);
    expect(olderReports.every((row) => row.id !== disciplinary?.id)).toBe(true);
  });
});
