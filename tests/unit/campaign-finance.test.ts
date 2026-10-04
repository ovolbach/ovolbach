import { describe, expect, it } from 'vitest';
import { getFinanceDuties, reportDeadline } from '../../src/lib/campaign-finance';
import { loadGuideData } from '../../src/lib/load-guide-data';
import { validateDataset } from '../../src/lib/validate-dataset';
import { makeGuideData } from '../fixtures/guide-data';
import { assembleElectionContext, loadElectionContext } from '../../src/lib/load-guide-data';

const head = { office: 'mayor' as const, locality: 'Liptovský Mikuláš', population: 29598, independent: true, sourceIds: ['source-1'] };
const facts = { headCandidacies: [head], ownExpenses: 'unknown' as const, otherCandidacies: 'not_exhaustive' as const, campaignOperator: 'unknown' as const };

describe('campaign finance legal duties', () => {
  it('separates the spending-dependent account from an independent head report', () => {
    expect(getFinanceDuties(facts)).toEqual({ account: 'conditional', report: 'required' });
    expect(getFinanceDuties({ ...facts, ownExpenses: 'yes' })).toEqual({ account: 'required', report: 'required' });
    expect(getFinanceDuties({ ...facts, ownExpenses: 'no' })).toEqual({ account: 'not_required', report: 'required' });
  });
  it('does not infer personal spending from a party nomination', () => {
    expect(getFinanceDuties({ ...facts, headCandidacies: [{ ...head, independent: false }] })).toEqual({ account: 'conditional', report: 'conditional' });
    expect(getFinanceDuties({ ...facts, headCandidacies: [{ ...head, independent: false }], ownExpenses: 'yes' })).toEqual({ account: 'required', report: 'required' });
    expect(getFinanceDuties({ ...facts, headCandidacies: [{ ...head, independent: false }], ownExpenses: 'no', campaignOperator: 'party', otherCandidacies: 'exhaustive' })).toEqual({ account: 'not_required', report: 'not_required' });
  });
  it('requires a report for a party head running a personal campaign even with zero spending', () => {
    expect(getFinanceDuties({ ...facts, headCandidacies: [{ ...head, independent: false }], ownExpenses: 'no', campaignOperator: 'candidate' })).toEqual({ account: 'not_required', report: 'required' });
    expect(getFinanceDuties({ ...facts, headCandidacies: [{ ...head, independent: false }], ownExpenses: 'no' }).report).toBe('conditional');
    expect(getFinanceDuties({ ...facts, headCandidacies: [], ownExpenses: 'no' })).toEqual({ account: 'not_required', report: 'conditional' });
  });
  it('does not exempt a council candidate whose external candidacies are not established', () => {
    expect(getFinanceDuties({ ...facts, headCandidacies: [] })).toEqual({ account: 'conditional', report: 'conditional' });
    expect(getFinanceDuties({ ...facts, headCandidacies: [], otherCandidacies: 'exhaustive' })).toEqual({ account: 'not_required', report: 'not_required' });
  });
  it('handles the population threshold and a simultaneous regional head candidacy', () => {
    expect(getFinanceDuties({ ...facts, headCandidacies: [{ ...head, population: 5000 }], otherCandidacies: 'exhaustive', ownExpenses: 'yes' })).toEqual({ account: 'not_required', report: 'not_required' });
    expect(getFinanceDuties({ ...facts, headCandidacies: [{ ...head, population: 5001 }], ownExpenses: 'yes' }).account).toBe('required');
    expect(getFinanceDuties({ ...facts, headCandidacies: [{ ...head, population: 5000 }, { office: 'region-chair', locality: 'ŽSK', independent: false, sourceIds: ['source-1'] }], ownExpenses: 'yes' })).toEqual({ account: 'required', report: 'required' });
  });
  it('calculates thirty calendar days after the election across month and year boundaries', () => {
    expect(reportDeadline('2026-10-24')).toBe('2026-11-23');
    expect(reportDeadline('2026-12-20')).toBe('2027-01-19');
  });
});

describe('finance release data', () => {
  it('requires exactly one sourced finance record per published person without adding a ninth research category', async () => {
    const data = await loadGuideData();
    expect(data.campaignFinance).toHaveLength(91);
    expect(new Set(data.campaignFinance.map((row) => row.candidateId)).size).toBe(91);
    expect(data.researchCoverage).toHaveLength(91 * 8);
    expect(validateDataset(data, 'release')).toEqual([]);
    for (const row of data.campaignFinance) {
      expect(row.checkedAt).toBe(row.candidateId === 'candidate-85' ? '2026-10-04' : '2026-10-03');
      expect(row.electionDate).toBe('2026-10-24');
      expect(row.sourceIds.length).toBeGreaterThan(0);
    }
  });
  it('includes head candidacies outside the catalogue using the 2026 municipal rosters and population', async () => {
    const data = await loadGuideData();
    expect(data.campaignFinance.find((row) => row.candidateId === 'candidate-72')?.headCandidacies).toContainEqual(expect.objectContaining({ office: 'mayor', locality: 'Ľubeľa', population: 1192 }));
    for (const candidateId of ['candidate-77', 'candidate-83']) {
      expect(data.campaignFinance.find((row) => row.candidateId === candidateId)?.headCandidacies).toContainEqual(expect.objectContaining({ office: 'mayor', locality: 'Liptovský Hrádok', population: 6974 }));
    }
  });
  it('retains account identity, external candidacy and party evidence when scoping a context', async () => {
    const context = await loadElectionContext({ citySlug: 'liptovsky-mikulas', year: 2026 });
    const extra = { ...context.data.campaignFinance[0]!, id: 'unrelated-finance', candidateId: 'unrelated-person', partyIds: ['unrelated-party'] };
    const cycle = { ...context.data, campaignFinance: [...context.data.campaignFinance, extra], financeParties: [...context.data.financeParties, { id: 'unrelated-party', name: 'Unrelated party', electionDate: '2026-10-24', checkedAt: '2026-10-03', sourceIds: ['unrelated-source'], account: { status: 'not_listed' as const } }], sources: [...context.data.sources, { ...context.data.sources[0]!, id: 'unrelated-source', url: 'https://example.com/unrelated' }] };
    const scoped = assembleElectionContext(cycle, context).data;
    expect(scoped.campaignFinance).toHaveLength(91);
    expect(scoped.financeParties.some((party) => party.id === 'unrelated-party')).toBe(false);
    expect(scoped.sources.some((source) => source.id === 'unrelated-source')).toBe(false);
    expect(scoped.sources.map((source) => source.id)).toEqual(expect.arrayContaining(['lhr-mayor-roster-2026', 'kapitulik-campaign-account-2026', 'campaign-law-181-2014', 'campaign-accounts-parties-2026']));
  });
  it('rejects missing records, dangling parties, sources and personal account joins by name only', async () => {
    const data = await loadGuideData();
    expect(validateDataset({ ...data, campaignFinance: [] }, 'release')).toContainEqual({ code: 'missing_campaign_finance', recordId: data.candidates[0]!.id });
    const row = data.campaignFinance[0]!;
    const altered = { ...row, partyIds: ['missing-party'], sourceIds: ['missing-source'], account: { status: 'verified', url: 'https://example.com/account', sourceIds: ['source-1'], identity: [] } };
    expect(validateDataset({ ...data, campaignFinance: [altered, ...data.campaignFinance.slice(1)] } as typeof data, 'release').map((issue) => issue.code)).toContain('invalid_schema');
    expect(validateDataset({ ...data, campaignFinance: [{ ...row, partyIds: ['missing-party'], sourceIds: ['missing-source'] }, ...data.campaignFinance.slice(1)] }, 'release').map((issue) => issue.code)).toEqual(expect.arrayContaining(['unknown_finance_party', 'unknown_source']));
  });
  it('rejects missing coalition members and financial verification beyond the published snapshot', async () => {
    const data = await loadGuideData();
    const row = data.campaignFinance[0]!;
    expect(validateDataset({ ...data, campaignFinance: [{ ...row, partyIds: [] }, ...data.campaignFinance.slice(1)] }, 'release').map((issue) => issue.code)).toContain('missing_finance_nomination');
    const context = await loadElectionContext({ citySlug: 'liptovsky-mikulas', year: 2026 });
    expect(() => assembleElectionContext({ ...data, campaignFinance: [{ ...row, checkedAt: '2026-10-05' }, ...data.campaignFinance.slice(1)] }, context)).toThrow('Finance verification exceeds snapshot');
  });
  it('keeps account evidence and legal exemption independent, allowing voluntary council accounts', () => {
    const data = makeGuideData();
    const row = { ...data.campaignFinance[0]!, headCandidacies: [], otherCandidacies: 'exhaustive' as const, account: { status: 'verified' as const, url: 'https://example.com/account', sourceIds: ['source-1'], identity: [{ attribute: 'municipality' as const, value: 'LM', sourceIds: ['source-1'] }, { attribute: 'election' as const, value: '2026', sourceIds: ['source-1'] }] } };
    expect(getFinanceDuties(row).account).toBe('not_required');
    expect(validateDataset({ ...data, candidacies: [], campaignFinance: [row] }, 'draft').map((issue) => issue.code)).not.toContain('invalid_schema');
  });
});
