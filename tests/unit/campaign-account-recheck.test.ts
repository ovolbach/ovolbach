import { describe, expect, it } from 'vitest';
import { loadElectionContext } from '../../src/lib/load-guide-data';
import { financeSourceIds } from '../../src/lib/campaign-finance';

// Catches a missing, wrong-person or historical account link after the 2026 recheck.
const verifiedAccounts = [
  ['liptovsky-mikulas', 'candidate-85', 'https://ib.fio.sk/ib/transparent?a=2603546837'],
  ['ruzomberok', 'rk-lubomir-kuban', 'https://transparentneucty.sk/#/ucet/SK6909000000005252528488'],
  ['martin', 'mt-renata-habrunova', 'https://ib.vub.sk/pch/transparentne-ucty?iban=SK1102000000007259001151&CN'],
  ['martin', 'mt-jozef-petras', 'https://transparentneucty.sk/#/ucet/SK8209000000005250777501'],
  ['zilina', 'za-rastislav-johanes', 'https://www.unicreditbank.sk/sk/ostatne/transparentny-ucet.html?IBAN=SK4511110000006856301131'],
  ['zilina', 'za-miroslav-sokol', 'https://www.tatrabanka.sk/sk/personal/ucet-platby/transparentne-ucty/ucet/?iban=sk0211000000002973085679'],
  ['dolny-kubin', 'dk-jan-marsinsky', 'https://ib.vub.sk/pch/transparentne-ucty?iban=SK9602000000007289989957&CN'],
  ['dolny-kubin', 'dk-jan-prilepok', 'https://transparentneucty.sk/#/ucet/SK8109000000005193034583'],
] as const;

describe('2026 candidate account identity recheck', () => {
  it.each(verifiedAccounts)('retains the verified account and evidence for %s / %s', async (citySlug, candidateId, url) => {
    const context = await loadElectionContext({ citySlug, year: 2026 });
    const record = context.data.campaignFinance.find((row) => row.candidateId === candidateId);
    expect(record?.account).toMatchObject({ status: 'verified', url });
    expect(record?.checkedAt).toBe('2026-10-04');
    expect(record).toMatchObject({ ownExpenses: 'unknown', campaignOperator: 'unknown', otherCandidacies: 'not_exhaustive' });
    if (!record || record.account.status !== 'verified') return;
    const sourceIds = financeSourceIds(record);
    expect(sourceIds).toContain('campaign-accounts-candidates-2026');
    expect(sourceIds.every((id) => context.data.sources.some((source) => source.id === id))).toBe(true);
    if (candidateId === 'za-miroslav-sokol') {
      expect(sourceIds).toContain('finance-sokol-candidate-account-2026');
    } else {
      expect(sourceIds).toEqual(expect.arrayContaining([
        'finance-national-mayors-2026', 'finance-national-councillors-2026',
        'finance-national-chairs-2026', 'finance-national-regional-councillors-2026',
      ]));
    }
  });

  it('withholds the Danko account while other same-name candidates remain possible owners', async () => {
    const { data } = await loadElectionContext({ citySlug: 'martin', year: 2026 });
    const record = data.campaignFinance.find((row) => row.candidateId === 'mt-jan-danko');
    expect(record?.account.status).toBe('unverified');
    expect(record?.account).not.toHaveProperty('url');
    expect(record?.checkedAt).toBe('2026-10-04');
    expect(record && financeSourceIds(record)).toContain('finance-national-councillors-2026');
    expect(data.sources.some((source) => source.id.startsWith('finance-danko-bank-'))).toBe(false);
  });
});
