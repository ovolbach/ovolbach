import { describe, expect, it } from 'vitest';
import { campaignFinanceSchema } from '../../src/lib/schemas';
import { loadElectionCycle } from '../../src/lib/load-guide-data';
import { financeSourceIds, getFinanceDuties } from '../../src/lib/campaign-finance';
import { validateDataset } from '../../src/lib/validate-dataset';

const data = await loadElectionCycle(2026, 'presovsky-kraj');
const record = data.campaignFinance.find((row) => row.candidateId === 'psk-marian-geci')!;
const nationalRegisters = [
  ['mayor', 'finance-national-mayors-2026'],
  ['city-council', 'finance-national-councillors-2026'],
  ['region-chair', 'finance-national-chairs-2026'],
  ['region-council', 'finance-national-regional-councillors-2026'],
] as const;

function byExclusion() {
  return {
    ...record,
    account: {
      status: 'verified' as const, url: 'https://ib.fio.sk/ib/transparent?a=2403587220',
      sourceIds: ['geci-fio-account-original'], identity: [], verificationMethod: 'register_exclusion' as const,
      exclusionEvidence: {
        scope: 'presovsky-kraj-2026' as const, checkedAt: '2026-10-14',
        registers: nationalRegisters.map(([kind, sourceId]) => ({ kind, sourceId, sha256: 'a'.repeat(64), rowCount: 100, complete: true as const })),
        matches: [{ candidateId: 'psk-marian-geci', name: 'Marián Geci', municipality: 'Roztoky', ageAtElection: 56,
          sourceIds: ['finance-national-chairs-2026'], decision: 'retained' as const,
          reason: 'Jediná zhodná osoba v štyroch úplných celoštátnych zoznamoch.' }],
        remainingCandidateId: 'psk-marian-geci', accountSourceIds: ['geci-fio-account-original'],
      },
    },
  };
}

describe('PSK campaign account attribution evidence', () => {
  it('accepts a single remaining candidate with complete four-contest evidence without invented identity attributes', () => {
    const result = campaignFinanceSchema.safeParse(byExclusion());
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.account.status).toBe('verified');
    expect(getFinanceDuties(result.data)).toEqual({ account: 'conditional', report: 'required' });
    expect(validateDataset({ ...data, campaignFinance: data.campaignFinance.map((row) => row.id === record.id ? result.data : row) }, 'release')).toEqual([]);
    expect(financeSourceIds(result.data)).toEqual(expect.arrayContaining(nationalRegisters.map(([, sourceId]) => sourceId)));
  });

  it('rejects two plausible namesakes even when all registers were read', () => {
    const row = byExclusion();
    row.account.exclusionEvidence.matches.push({ ...row.account.exclusionEvidence.matches[0]!, candidateId: 'psk-other-geci', municipality: 'Prešov' });
    expect(campaignFinanceSchema.safeParse(row).success).toBe(false);
  });

  it('rejects missing, repeated and incomplete national registers', () => {
    const missing = byExclusion(); missing.account.exclusionEvidence.registers.pop();
    expect(campaignFinanceSchema.safeParse(missing).success).toBe(false);
    const repeated = byExclusion(); repeated.account.exclusionEvidence.registers[3] = repeated.account.exclusionEvidence.registers[0]!;
    expect(campaignFinanceSchema.safeParse(repeated).success).toBe(false);
    const incomplete = byExclusion();
    expect(campaignFinanceSchema.safeParse({ ...incomplete, account: { ...incomplete.account, exclusionEvidence: {
      ...incomplete.account.exclusionEvidence, registers: incomplete.account.exclusionEvidence.registers.map((row, i) => i ? row : { ...row, complete: false }),
    } } }).success).toBe(false);
  });

  it('rejects a dossier about another candidate, a later review, and the exception outside this cohort', () => {
    const wrongPerson = byExclusion(); wrongPerson.account.exclusionEvidence.remainingCandidateId = 'psk-samuel-migal';
    expect(campaignFinanceSchema.safeParse(wrongPerson).success).toBe(false);
    const future = byExclusion(); future.account.exclusionEvidence.checkedAt = '2026-10-15';
    expect(campaignFinanceSchema.safeParse(future).success).toBe(false);
    expect(campaignFinanceSchema.safeParse({ ...byExclusion(), candidateId: 'candidate-85' }).success).toBe(false);
  });

  it('keeps existing two-attribute requirements for direct and candidate-site attribution', () => {
    const old = data.campaignFinance.find((row) => row.candidateId === 'psk-jozef-kralik')!;
    expect(campaignFinanceSchema.safeParse(old).success).toBe(true);
    for (const verificationMethod of [undefined, 'direct', 'candidate_site']) {
      expect(campaignFinanceSchema.safeParse({ ...old, account: { ...old.account, verificationMethod, identity: [] } }).success).toBe(false);
    }
    expect(campaignFinanceSchema.safeParse({ ...old, account: { ...old.account, verificationMethod: 'candidate_site' } }).success).toBe(true);
  });

  it('rejects unknown or non-official register references in the exclusion dossier', () => {
    const row = byExclusion();
    row.account.exclusionEvidence.registers[0]!.sourceId = 'missing-roster' as never;
    const parsed = campaignFinanceSchema.safeParse(row);
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(validateDataset({ ...data, campaignFinance: data.campaignFinance.map((item) => item.id === record.id ? parsed.data : item) }, 'release').map((issue) => issue.code))
      .toEqual(expect.arrayContaining(['unknown_source', 'invalid_exclusion_register']));
  });

  it('rejects a retained namesake whose age disagrees with the official candidate ballot', () => {
    const row = byExclusion(); row.account.exclusionEvidence.matches[0]!.ageAtElection = 57;
    const parsed = campaignFinanceSchema.parse(row);
    expect(validateDataset({ ...data, campaignFinance: data.campaignFinance.map((item) => item.id === record.id ? parsed : item) }, 'release').map((issue) => issue.code))
      .toContain('exclusion_identity_mismatch');
  });

  it('rejects a retained-person proof that does not reference any of the complete official registers', () => {
    const row = byExclusion(); row.account.exclusionEvidence.matches[0]!.sourceIds = ['geci-fio-account-original'];
    const parsed = campaignFinanceSchema.parse(row);
    expect(validateDataset({ ...data, campaignFinance: data.campaignFinance.map((item) => item.id === record.id ? parsed : item) }, 'release').map((issue) => issue.code))
      .toContain('invalid_exclusion_match');
  });

  it('permits a voluntary council account without establishing spending or a head-account duty', () => {
    const parsed = campaignFinanceSchema.parse({ ...byExclusion(), headCandidacies: [], otherCandidacies: 'exhaustive' });
    expect(parsed.ownExpenses).toBe('unknown');
    expect(getFinanceDuties(parsed)).toEqual({ account: 'not_required', report: 'not_required' });
  });

  it('accepts an IBAN published by the candidate without inventing a bank-page URL', () => {
    const old = data.campaignFinance.find((row) => row.candidateId === 'psk-jozef-kralik')!;
    const account = { ...old.account, url: undefined, iban: 'SK6809000000005192445639', verificationMethod: 'candidate_site' };
    expect(campaignFinanceSchema.safeParse({ ...old, account }).success).toBe(true);
    expect(campaignFinanceSchema.safeParse({ ...old, account: { ...account, iban: undefined } }).success).toBe(false);
  });
});

describe('candidate-owned campaign links with inaccessible bank applications', () => {
  it.each([
    ['psk-anton-danko', 'https://www.transparentneucty.sk/#/ucet/SK1009000000005251304925'],
    ['psk-artur-benes', 'https://ib.vub.sk/pch/transparentne-ucty?iban=SK2002000000007251888755&CN'],
    ['psk-roderik-ledecky', 'https://ib.vub.sk/pch/transparentne-ucty?iban=SK5502000000007293487351&CN'],
    ['psk-rastislav-mochnacky', 'https://www.transparentneucty.sk/#/ucet/SK7609000000005248302072'],
  ])('exposes the directly published account for %s without inferring expenses', (candidateId, url) => {
    const row = data.campaignFinance.find((item) => item.candidateId === candidateId)!;
    expect(row.account).toMatchObject({ status: 'verified', verificationMethod: 'candidate_site', url });
    expect(row.ownExpenses).toBe('unknown');
    expect(row.expenseSourceIds).toEqual([]);
  });

  it('retains the exact candidate-published Hagyari IBAN without a guessed bank URL', () => {
    const row = data.campaignFinance.find((item) => item.candidateId === 'psk-pavel-hagyari')!;
    expect(row.account).toMatchObject({ status: 'verified', verificationMethod: 'candidate_site', iban: 'SK6809000000005192445639' });
    expect(row.account).not.toHaveProperty('url');
    expect(row.ownExpenses).toBe('unknown');
  });

  it.each([
    ['psk-marian-geci', 'https://ib.fio.sk/ib/transparent?a=2403587220'],
    ['psk-samuel-migal', 'https://www.tatrabanka.sk/sk/personal/ucet-platby/transparentne-ucty/ucet/?iban=sk5511000000002974103031'],
    ['psk-ingrida-gorcovska', 'https://www.tatrabanka.sk/sk/personal/ucet-platby/transparentne-ucty/ucet/?iban=sk0211000000002978098057'],
    ['psk-peter-visnovsky', 'https://ib.fio.sk/ib/transparent?a=2403465039'],
    ['psk-viliam-kall', 'https://ib.fio.sk/ib/transparent?a=2903571719'],
  ])('exposes %s with a complete candidate-specific exclusion dossier', (candidateId, url) => {
    const row = data.campaignFinance.find((item) => item.candidateId === candidateId)!;
    expect(row.account).toMatchObject({ status: 'verified', verificationMethod: 'register_exclusion', url,
      exclusionEvidence: { remainingCandidateId: candidateId, scope: 'presovsky-kraj-2026' } });
    if (row.account.status !== 'verified') return;
    expect(row.account.exclusionEvidence?.registers).toHaveLength(4);
    expect(row.account.identity).toEqual([]);
  });
});
