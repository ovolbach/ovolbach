import type { CampaignFinance, FinanceParty } from './schemas';

export type FinanceDuty = 'required' | 'not_required' | 'conditional';

export function getFinanceDuties(facts: Pick<CampaignFinance, 'headCandidacies' | 'ownExpenses' | 'otherCandidacies' | 'campaignOperator'>): { account: FinanceDuty; report: FinanceDuty } {
  const eligibleHeads = facts.headCandidacies.filter((head) => head.office === 'region-chair' || (head.population ?? 0) > 5000);
  if (eligibleHeads.length === 0) {
    const duty = facts.otherCandidacies === 'exhaustive' ? 'not_required' : 'conditional';
    return { account: facts.ownExpenses === 'no' ? 'not_required' : duty, report: duty };
  }
  return {
    account: facts.ownExpenses === 'yes' ? 'required' : facts.ownExpenses === 'no' ? 'not_required' : 'conditional',
    report: eligibleHeads.some((head) => head.independent) || facts.ownExpenses === 'yes' || facts.campaignOperator === 'candidate' || facts.campaignOperator === 'both'
      ? 'required'
      : facts.ownExpenses === 'no' && (facts.campaignOperator === 'party' || facts.campaignOperator === 'none') && facts.otherCandidacies === 'exhaustive'
        ? 'not_required' : 'conditional',
  };
}

export function reportDeadline(electionDate: string): string {
  const date = new Date(`${electionDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 30);
  return date.toISOString().slice(0, 10);
}

export function financeSourceIds(record: CampaignFinance): string[] {
  return [...new Set([
    ...record.sourceIds, ...record.legalSourceIds, ...record.expenseSourceIds, ...record.operatorSourceIds,
    ...record.headCandidacies.flatMap((head) => head.sourceIds),
    ...(record.account.status === 'verified'
      ? [...record.account.sourceIds, ...record.account.identity.flatMap((item) => item.sourceIds)]
      : record.account.sourceIds),
    ...(record.reportSourceId ? [record.reportSourceId] : []),
  ])];
}

export function partyFinanceSourceIds(party: FinanceParty): string[] {
  return [...new Set([...party.sourceIds, ...(party.reportSourceId ? [party.reportSourceId] : [])])];
}
