import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import { loadElectionContext } from '../../src/lib/load-guide-data';

describe('Martin independent source review', () => {
  it('keeps the identity-matched pharmacy role bounded to the reopened institutional page', async () => {
    const { data } = await loadElectionContext({ citySlug: 'martin', year: 2026 });
    expect(data.claims.find((claim) => claim.id === 'mt-lucia-omamikova-pharmacy-role')?.text.sk)
      .toBe('Stránka lekárne Dr. Max v Turanoch uvádza pri mene PharmDr. Lucia Omámiková MPH funkciu „Vedúci lekárnik“.');
  });
  it('excludes the historical and commission joins when Jesenská residence is inconsistent', async () => {
    const { data } = await loadElectionContext({ citySlug: 'martin', year: 2026 });
    expect(data.claims.filter((claim) => claim.candidateId === 'mt-martina-jesenska' && ['previous_elections', 'public_office'].includes(claim.category)))
      .toEqual([]);
  });
  it('locks complete historical result phrases and structured outcomes checked against official CSVs', async () => {
    const expected = JSON.parse(await readFile('tests/fixtures/martin-historical-results.json', 'utf8'));
    const { data } = await loadElectionContext({ citySlug: 'martin', year: 2026 });
    expect(data.claims.filter((claim) => claim.candidateId.startsWith('mt-') && claim.kind === 'election_result')
      .map((claim) => ({ id: claim.id, candidateId: claim.candidateId, text: claim.text.sk, election: claim.election, period: claim.period })))
      .toEqual(expected);
  });

  it('preserves the control commission role explicitly stated by the RPVS document', async () => {
    const { data } = await loadElectionContext({ citySlug: 'martin', year: 2026 });
    expect(data.claims.find((claim) => claim.id === 'mt-milos-hlavaty-employment_business-2')?.text.sk)
      .toBe('Verifikačný dokument z 9. januára 2025 uvádza Miloša Hlavatého medzi členmi kontrolnej komisie Aliancie pre sociálnu ekonomiku na Slovensku, IČO 53064909.');
  });
  it('dates district 3 and 4 occupations to their actual signed lists', async () => {
    const { data } = await loadElectionContext({ citySlug: 'martin', year: 2026 });
    for (const [date, people] of [
      ['9. 9. 2026', ['andrea-baceova', 'robert-kollar', 'stanislav-sturik']],
      ['10. 9. 2026', ['stefan-balosak', 'marian-ferenc', 'veronika-hrklova', 'peter-junas', 'peter-matejka', 'marian-zajasensky']],
    ] as const) {
      for (const person of people) {
        expect(data.claims.find((claim) => claim.id === `mt-${person}-ballot-occupation-1`)?.period)
          .toBe(`kandidátna listina z ${date} pre voľby 24. 10. 2026`);
      }
    }
  });

  it('publishes each dated Vons and Kozák report once and keeps the response separate', async () => {
    const { data } = await loadElectionContext({ citySlug: 'martin', year: 2026 });
    for (const candidateId of ['mt-peter-vons', 'mt-zdenko-kozak']) {
      const claims = data.claims.filter((claim) => claim.candidateId === candidateId);
      expect(claims.filter((claim) => claim.kind === 'media_report')).toHaveLength(1);
      expect(claims.find((claim) => claim.kind === 'media_report')?.category).toBe('media');
      expect(claims.find((claim) => claim.kind === 'response')?.category).toBe('controversies');
    }
  });

  it('uses the canonical commission URL once and the polling PDF original heading', async () => {
    const { data } = await loadElectionContext({ citySlug: 'martin', year: 2026 });
    const commissions = data.sources.filter((source) => source.url.includes('/komisie-mestskeho-zastupitelstva/os-1062'));
    expect(commissions).toHaveLength(1);
    expect(commissions[0]?.url).toBe('https://www.martin.sk/komisie-mestskeho-zastupitelstva/os-1062');
    expect(data.sources.find((source) => source.id === 'mt-city-polling-2026')?.title)
      .toBe('INFORMÁCIA O ČASE A MIESTE KONANIA VOLIEB DO ORGÁNOV SAMOSPRÁVY OBCÍ A ORGÁNOV SAMOSPRÁVNYCH KRAJOV');
  });
});
