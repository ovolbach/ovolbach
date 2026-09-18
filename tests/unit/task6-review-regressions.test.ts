import { describe, expect, it } from 'vitest';
import { loadGuideData } from '../../src/lib/load-guide-data';

const data = await loadGuideData();
const claim = (id: string) => data.claims.find((item) => item.id === id);
const source = (id: string) => data.sources.find((item) => item.id === id);
const coverage = (candidateId: string, category: string) => data.researchCoverage
  .find((item) => item.candidateId === candidateId && item.category === category);

describe('Task 6 reviewed evidence', () => {
  it('preserves hand-checked official election results for districts 7 and 8', () => {
    expect(claim('claim-candidate-64-city-council-2022')).toMatchObject({
      kind: 'election_result',
      period: '2022-10-29',
      text: { sk: 'Vo volebnom obvode č. 7 získal Marek Nemec 597 platných hlasov (14,62 %) a bol zvolený za poslanca.' },
    });
    expect(claim('claim-candidate-69-city-council-2018')).toMatchObject({
      kind: 'election_result',
      period: '2018-11-10',
      text: { sk: 'Vo volebnom obvode č. 8 získal Ľuboš Trizna 567 platných hlasov (75,49 %) a bol zvolený za poslanca.' },
    });
  });

  it('uses a complete verbatim campaign sentence within the quote limit', () => {
    expect(claim('claim-candidate-60-programme-2026')).toMatchObject({
      kind: 'quote',
      text: { sk: '„Dôležitou témou je pre mňa aj ochrana zvierat a hľadanie praktických riešení pre harmonické spolužitie ľudí a zvierat vo verejnom priestore.“' },
    });
  });

  it('distinguishes available declaration indexes from genuine non-applicability', () => {
    expect(coverage('candidate-61', 'asset_declarations')).toMatchObject({ status: 'found' });
    expect(coverage('candidate-62', 'asset_declarations')).toMatchObject({ status: 'found' });
    expect(coverage('candidate-68', 'asset_declarations')).toMatchObject({ status: 'not_applicable', sourceIds: [] });
  });

  it('records Jana Kozmonová’s civic-association role without presenting it as employment or income', () => {
    expect(source('recyklator-paradysio-kozmonova')).toMatchObject({
      url: 'https://www.recyklator.sk/',
      publisher: 'Občianske združenie PARADYSIO',
      type: 'official',
      language: 'sk',
    });
    expect(claim('claim-candidate-68-paradysio-chair')).toMatchObject({
      candidateId: 'candidate-68',
      category: 'employment_business',
      kind: 'fact',
      label: { sk: 'Predsedníčka občianskeho združenia PARADYSIO' },
      text: { sk: 'Web projektu Superhrdina Recyklátor pri kontrole 18. septembra 2026 uvádzal Mgr. Janu Kozmonovú, PhD. ako predsedníčku občianskeho združenia PARADYSIO v Liptovskom Mikuláši.' },
      period: '2026-09-18',
      sourceIds: ['recyklator-paradysio-kozmonova'],
    });
    expect(claim('claim-candidate-68-paradysio-chair')?.text.sk).not.toContain('zamestnan');
    expect(claim('claim-candidate-68-paradysio-chair')?.text.sk).not.toContain('príjm');
    expect(coverage('candidate-68', 'employment_business')?.sourceIds).toContain('recyklator-paradysio-kozmonova');
  });

  it('labels the Czech Barkovci source as Czech', () => {
    expect(source('scenicka-zatva-barkovci-2024')?.language).toBe('cs');
  });

  it('limits Tomáš Martaus’s regional mandate evidence to the verified 2022 election result', () => {
    expect(claim('claim-candidate-62-regional-councillor-current')).toMatchObject({
      label: { sk: 'Zvolenie za poslanca zastupiteľstva ŽSK v roku 2022' },
      period: '2022-10-29',
      sourceIds: ['statistics-regional-results-2022'],
    });
    expect(claim('claim-candidate-62-regional-councillor-current')?.text.sk).toContain('z 29. októbra 2022');
    expect(claim('claim-candidate-62-regional-councillor-current')?.text.sk).not.toContain('2022–2026');
  });

  it('completes all eight categories for every district 7 and 8 candidate', () => {
    const sourceIds = new Set(data.sources.map((item) => item.id));
    for (const candidateId of ['candidate-60', 'candidate-61', 'candidate-62', 'candidate-63', 'candidate-64', 'candidate-65', 'candidate-66', 'candidate-67', 'candidate-68', 'candidate-69']) {
      const rows = data.researchCoverage.filter((item) => item.candidateId === candidateId);
      expect(rows).toHaveLength(8);
      expect(rows.some((item) => item.status === 'pending')).toBe(false);
      for (const row of rows.filter((item) => item.status === 'found')) {
        expect(row.sourceIds.length).toBeGreaterThan(0);
        expect(row.sourceIds.every((sourceId) => sourceIds.has(sourceId))).toBe(true);
      }
    }
  });
});
