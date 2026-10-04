import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { loadElectionContext } from '../../src/lib/load-guide-data';

const loadCity = () => loadElectionContext({ citySlug: 'dolny-kubin', year: 2026 });

describe('Dolný Kubín evidence boundaries', () => {
  it('locks the complete externally verified historical result phrases and outcomes', async () => {
    const fixture = JSON.parse(await readFile('tests/fixtures/dolny-kubin-election-results.json', 'utf8'));
    const { data } = await loadCity();
    const results = data.claims.filter((claim) => claim.candidateId.startsWith('dk-') && claim.kind === 'election_result')
      .map(({ id, candidateId, text, period, election, sourceIds }) => ({ id, candidateId, text, period, election, sourceIds }));
    expect(fixture.length).toBeGreaterThan(60);
    expect(results).toEqual(fixture);
    expect(data.claims.filter((claim) => claim.candidateId === 'dk-tomas-gajdos' && claim.kind === 'election_result')
      .map((claim) => claim.election?.contestId)).toEqual(['2023-dk-city-3']);
  });

  it('keeps allegations on the correctly identified older Stanovský and preserves his response', async () => {
    const { data } = await loadCity();
    const claims = data.claims.filter((claim) => ['dk-martin-stanovsky-53-sita-complaint-2025', 'dk-martin-stanovsky-53-sita-response-2025'].includes(claim.id));
    expect(claims.map((claim) => claim.kind)).toEqual(['media_report', 'response']);
    expect(claims.every((claim) => claim.candidateId === 'dk-martin-stanovsky-53')).toBe(true);
    expect(claims.every((claim) => claim.sourceIds.includes('dk-sita-kanoistika-complaint-response-2025'))).toBe(true);
    expect(claims[0]?.text.sk).toContain('podozrenie');
    expect(claims[1]?.text.sk).toContain('odmietol');
    expect(data.claims.some((claim) => claim.candidateId === 'dk-martin-stanovsky-30' && claim.sourceIds.includes('dk-sita-kanoistika-complaint-response-2025'))).toBe(false);
  });

  it('exposes the declaration bridge for Vajdulák and the full feminine Grísová result', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'dk-leonard-vajdulak-art-air-role')?.sourceIds)
      .toContain('dk-city-declarations-2024-current');
    expect(data.claims.find((claim) => claim.id === 'dk-vladimira-grisova-council-substitute-2022')?.text.sk)
      .toBe('Vo voľbách 29. októbra 2022 je Vladimíra Grísová uvedená ako náhradníčka na poslankyňu Mestského zastupiteľstva v Dolnom Kubíne v obvode č. 5. Kandidovala za HLAS – sociálna demokracia a získala 232 platných hlasov (2,51 % hlasov odovzdaných kandidátom v obvode).');
  });

  it('publishes only verified account links and bounds incomplete financial research', async () => {
    const { data } = await loadCity();
    const verified = {
      'dk-jan-briestensky': 'https://ib.fio.sk/ib/transparent?a=2903484252',
      'dk-katarina-brunckova': 'https://www.tatrabanka.sk/sk/personal/ucet-platby/transparentne-ucty/ucet/?iban=sk5611000000002979115779',
      'dk-emilia-jurcikova': 'https://ib.fio.sk/ib/transparent?a=2802973882',
    };
    for (const [candidateId, url] of Object.entries(verified)) {
      const record = data.campaignFinance.find((row) => row.candidateId === candidateId);
      expect(record?.account).toMatchObject({ status: 'verified', url });
      if (record?.account.status === 'verified') {
        expect(new Set(record.account.identity.map((item) => item.attribute)).size).toBeGreaterThanOrEqual(2);
        expect(record.account.identity.every((item) => item.sourceIds.length > 0)).toBe(true);
      }
    }
    for (const candidateId of ['dk-jan-prilepok', 'dk-jan-marsinsky']) {
      const record = data.campaignFinance.find((row) => row.candidateId === candidateId);
      expect(record?.account.status).toBe('unverified');
      expect(record?.account).not.toHaveProperty('url');
    }
    for (const record of data.campaignFinance.filter((row) => row.candidateId.startsWith('dk-'))) {
      expect(record).toMatchObject({ ownExpenses: 'unknown', campaignOperator: 'unknown', otherCandidacies: 'not_exhaustive' });
    }
  });

  it('keeps exact quotations separate from added attribution and excludes private identity prose', async () => {
    const { data } = await loadCity();
    const quotes = data.claims.filter((claim) => claim.candidateId.startsWith('dk-') && claim.kind === 'quote');
    expect(quotes.length).toBeGreaterThanOrEqual(2);
    for (const claim of quotes) expect(claim.text.sk, claim.id).not.toMatch(/napísal:|povedal:|v rozhovore pre|v podpísanom príhovore/);
    const text = data.claims.filter((claim) => claim.candidateId.startsWith('dk-')).map((claim) => claim.text.sk).join('\n');
    expect(text).not.toMatch(/Dátum narodenia|rodné číslo|trvalý pobyt|bydlisko:|nar\.\s*\d{1,2}\.\s*\d{1,2}\.\s*\d{4}/i);
  });

  it('omits inaccessible advocate records and retains the accessible Bukna identity bridge', async () => {
    const { data } = await loadCity();
    expect(data.sources.some((source) => ['dk-bencurova-sak-register', 'dk-bukna-sak-c3'].includes(source.id))).toBe(false);
    expect(data.claims.find((claim) => claim.id === 'dk-radoslava-bencurova-sak-advocate')).toBeUndefined();
    expect(data.claims.find((claim) => claim.id === 'dk-ondrej-bukna-c3-1')?.sourceIds)
      .toEqual(['dk-orsr-bukna', 'dk-city-declarations-2024-current']);
  });
});
