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

export function financeDutyText(record: CampaignFinance, hasPartyNomination: boolean): { account: string; report: string } {
  const duties = getFinanceDuties(record);
  const eligibleHead = record.headCandidacies.some((head) => head.office === 'region-chair' || (head.population ?? 0) > 5000);
  const unresolvedEligibility = !eligibleHead && record.otherCandidacies === 'not_exhaustive';
  const conditional = 'Povinnosť je podmienená ďalšou kandidatúrou a počtom obyvateľov obce. Rozsah overenia je uvedený nižšie.';
  return {
    account: unresolvedEligibility && duties.account === 'conditional' ? conditional
      : !eligibleHead && !unresolvedEligibility ? 'Pre samostatnú poslaneckú kandidatúru sa nevyžaduje. Kandidát na starostu alebo primátora obce do 5 000 obyvateľov tiež nemá túto povinnosť.'
      : duties.account === 'required' ? 'Vyžaduje sa pre vlastné financovanie kampane.'
      : duties.account === 'not_required' ? 'Nevyžaduje sa, ak kandidát nevynakladá žiadne prostriedky na vlastnú kampaň.'
      : `Vyžaduje sa, ak kandidát vynakladá prostriedky na vlastnú kampaň.${hasPartyNomination ? ' Samotná nominácia stranou neurčuje, kto kampaň financuje.' : ''}`,
    report: unresolvedEligibility ? conditional
      : !eligibleHead ? 'Pre samostatnú poslaneckú kandidatúru sa nevyžaduje verejná správa kandidáta podľa § 6 ods. 15. Táto povinnosť sa nevzťahuje ani na starostu alebo primátora obce do 5 000 obyvateľov.'
      : duties.report === 'required' ? 'Vyžaduje sa verejná správa kandidáta podľa § 6 ods. 15.'
      : duties.report === 'not_required' ? 'Samostatná správa kandidáta sa nevyžaduje, ak jeho kampaň financuje iba strana; strana vykazuje svoje výdavky.'
      : 'Vyžaduje sa pri vlastnej kampani kandidáta podľa § 6 ods. 15 a 17. Pri kampani financovanej iba stranou vykazuje výdavky strana.',
  };
}

export function financeSourceIds(record: CampaignFinance): string[] {
  return [...new Set([
    ...record.sourceIds, ...record.legalSourceIds, ...record.expenseSourceIds, ...record.operatorSourceIds,
    ...record.headCandidacies.flatMap((head) => head.sourceIds),
    ...(record.account.status === 'verified'
      ? [...record.account.sourceIds, ...record.account.identity.flatMap((item) => item.sourceIds),
        ...(record.account.exclusionEvidence ? [
          ...record.account.exclusionEvidence.registers.map((row) => row.sourceId),
          ...record.account.exclusionEvidence.matches.flatMap((row) => row.sourceIds),
          ...record.account.exclusionEvidence.accountSourceIds,
        ] : [])]
      : record.account.sourceIds),
    ...(record.reportSourceId ? [record.reportSourceId] : []),
  ])];
}

export function partyFinanceSourceIds(party: FinanceParty): string[] {
  return [...new Set([...party.sourceIds, ...(party.reportSourceId ? [party.reportSourceId] : [])])];
}
