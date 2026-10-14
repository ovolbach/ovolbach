import { describe, expect, it } from 'vitest';
import { loadElectionCycle } from '../../src/lib/load-guide-data';
import { financeDutyText, getFinanceDuties } from '../../src/lib/campaign-finance';

describe('PSK finance review', () => {
  it('accounts for every person and every nominating party without equating nomination with campaign spending', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    expect(data.campaignFinance).toHaveLength(320);
    expect(new Set(data.campaignFinance.map((row) => row.candidateId)))
      .toEqual(new Set(data.candidates.map((row) => row.id)));
    for (const record of data.campaignFinance) {
      expect(record.legalSourceIds).toContain('campaign-law-181-2014');
      expect(record.sourceIds).toContain('finance-national-mayors-2026');
      expect(record.candidacySearchNote).toBeTruthy();
    }
    expect(new Set(data.financeParties.map((row) => row.name.toLowerCase())))
      .toEqual(new Set(data.candidacies.flatMap((row) => row.affiliations.map((name) => name.toLowerCase()))));
  });
  it('uses official 2026 populations and retains conditional duties when spending is unestablished', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    for (const [candidateId, population] of [['psk-anton-danko', 47582], ['psk-frantisek-olha', 82217], ['psk-milan-jambor', 7648], ['psk-ingrida-gorcovska', 7064]] as const) {
      const record = data.campaignFinance.find((row) => row.candidateId === candidateId)!;
      expect(record, candidateId).toBeDefined();
      expect(record.headCandidacies, candidateId).toContainEqual(expect.objectContaining({ office: 'mayor', population }));
      if (record.ownExpenses === 'unknown') expect(getFinanceDuties(record).account, candidateId).toBe('conditional');
    }
  });
  it('does not treat an unlisted account as evidence that a chair has no account obligation', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    const record = data.campaignFinance.find((row) => row.candidateId === 'psk-drahomir-cureja')!;
    expect(record).toBeDefined();
    expect(record.account.status).toBe('not_listed');
    expect(record.headCandidacies).toContainEqual(expect.objectContaining({ office: 'region-chair' }));
    expect(getFinanceDuties(record).account).toBe('conditional');
    expect(getFinanceDuties(record).report).toBe('required');
  });
  it('keeps bank-backed expenses separate from attribution through campaign sites and complete national registers', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    for (const [candidateId, url] of [
      ['psk-jozef-kralik', 'https://ib.fio.sk/ib/transparent?a=2303443369'],
      ['psk-frantisek-olha', 'https://ib.fio.sk/ib/transparent?a=2901493956'],
    ] as const) {
      const record = data.campaignFinance.find((row) => row.candidateId === candidateId)!;
      expect(record.account, candidateId).toMatchObject({ status: 'verified', url });
      if (record.account.status === 'verified') {
        expect(new Set(record.account.identity.map((row) => row.attribute))).toEqual(new Set(['municipality', 'office', 'election']));
      }
      expect(record.ownExpenses).toBe('yes');
      expect(getFinanceDuties(record)).toEqual({ account: 'required', report: 'required' });
    }
    for (const id of ['psk-anton-danko', 'psk-rastislav-mochnacky', 'psk-artur-benes', 'psk-roderik-ledecky', 'psk-pavel-hagyari', 'psk-marian-geci', 'psk-samuel-migal']) {
      const record = data.campaignFinance.find((row) => row.candidateId === id)!;
      expect(record.account, id).toMatchObject({ status: 'verified' });
      expect(record.ownExpenses, id).toBe('unknown');
    }
  });
  it('explains conditional duties when an external mayor candidacy has no verified population', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    const record = data.campaignFinance.find((row) => row.candidateId === 'psk-gabriel-jamnicky')!;
    expect(record.otherCandidacies).toBe('not_exhaustive');
    expect(getFinanceDuties(record)).toEqual({ account: 'conditional', report: 'conditional' });
    const text = financeDutyText(record, false);
    expect(text.account).toContain('Povinnosť je podmienená');
    expect(text.report).toContain('Povinnosť je podmienená');
    expect(text.account).not.toContain('nemá túto povinnosť');
    expect(text.report).not.toContain('sa nevzťahuje');
  });
  it('includes parties from confirmed external mayor nominations even when the population is unresolved', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    for (const [candidateId, partyId, municipality] of [
      ['psk-ingrid-dolezalova', 'psk-party-obcianska-konzervativna-strana', 'Lada'],
      ['psk-ingrida-gorcovska', 'psk-party-sloboda-a-solidarita', 'Veľký Šariš'],
      ['psk-miroslav-hvizdos', 'psk-party-smer-socialna-demokracia', 'Široké'],
    ] as const) {
      const record = data.campaignFinance.find((row) => row.candidateId === candidateId)!;
      expect(record.partyIds, candidateId).toContain(partyId);
      expect(record.candidacySearchNote).toContain(municipality);
      expect(record.candidacySearchNote).toContain(data.financeParties.find((row) => row.id === partyId)!.name);
    }
  });
  it('keeps the readable bank pages’ actual titles rather than inventing owner-specific document titles', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    for (const account of ['2303443369', '2901493956']) {
      expect(data.sources.find((row) => row.url === `https://ib.fio.sk/ib/transparent?a=${account}`)?.title)
        .toBe('Internetové bankovníctvo | Fio banka');
    }
  });
});
