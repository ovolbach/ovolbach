import { describe, expect, it } from 'vitest';
import { loadGuideData } from '../../src/lib/load-guide-data';

const data = await loadGuideData();
const claim = (id: string) => data.claims.find((item) => item.id === id);
const source = (id: string) => data.sources.find((item) => item.id === id);
const coverage = (candidateId: string, category: string) => data.researchCoverage
  .find((item) => item.candidateId === candidateId && item.category === category);

describe('Task 8 reviewed evidence', () => {
  it('closes every district-5 candidate without weakening the release gate', () => {
    const ids = new Set(data.candidacies
      .filter((item) => item.electionId === 'region-council' && item.districtId === 'zsk-5')
      .map((item) => item.candidateId));
    const rows = data.researchCoverage.filter((item) => ids.has(item.candidateId));
    expect(ids.size).toBe(30);
    expect(rows).toHaveLength(240);
    expect(rows.some((item) => item.status === 'pending')).toBe(false);
  });

  it('keeps company roles distinct from employment and income', () => {
    for (const id of [
      'claim-candidate-77-company-role',
      'claim-candidate-81-company-manager',
      'claim-candidate-82-lawyer-business',
    ]) {
      expect(claim(id)?.text.sk).toMatch(/nedokladá|nepreukazuje|nie dôkaz/);
      expect(claim(id)?.text.sk).toMatch(/príj/);
    }
  });

  it('separates reports, responses and later official state', () => {
    expect(claim('claim-candidate-72-school-merger-report')?.kind).toBe('media_report');
    expect(claim('claim-candidate-72-school-merger-response')?.kind).toBe('response');
    expect(claim('claim-candidate-72-school-merger-later-state')).toBeUndefined();
    expect(claim('claim-candidate-76-parking-report')?.kind).toBe('media_report');
    expect(claim('claim-candidate-76-parking-response')?.kind).toBe('response');
  });

  it('does not turn unrelated public positions into a 2026 regional programme', () => {
    for (const candidateId of ['candidate-70','candidate-71','candidate-72','candidate-73','candidate-74','candidate-75','candidate-76','candidate-77','candidate-78','candidate-79','candidate-80','candidate-81','candidate-82','candidate-83','candidate-84']) {
      const row = data.researchCoverage.find((item) => item.candidateId === candidateId && item.category === 'programme_statements');
      expect(row?.status).toBe('searched_none');
    }
  });

  it('uses a reachable media report instead of the removed broken quote page', () => {
    expect(claim('claim-candidate-83-waste-statement')).toBeUndefined();
    expect(claim('claim-candidate-83-mayor-media-2022')?.kind).toBe('media_report');
  });

  it('uses Imrich official occupation, publication date, result and declaration', () => {
    expect(claim('claim-candidate-75-education-sport')).toMatchObject({
      period: '2024 – 2026',
      text: { sk: expect.stringContaining('reprezentant v karate, ekonóm') },
    });
    expect(claim('claim-candidate-75-education-sport')?.text.sk).not.toContain('vedúci pracovník');
    expect(source('euba-imrich-profile')?.publishedAt).toBe('2024-07-25');
    expect(claim('claim-candidate-75-local-result-2022')).toMatchObject({
      kind: 'election_result', period: '2022', text: { sk: expect.stringContaining('657') },
    });
    expect(claim('claim-candidate-75-declaration-2025')).toMatchObject({
      kind: 'declaration', period: '2025', sourceIds: ['lhr-declarations'],
    });
    expect(coverage('candidate-75', 'asset_declarations')?.status).toBe('found');
    expect(source('olympic-imrich-profile')).toBeUndefined();
    expect(claim('claim-candidate-75-olympic-profile')).toBeUndefined();
  });

  it('records Racko 1,480 votes as the 2023 election and removes weak 2009 join', () => {
    expect(source('minv-nrsr-results-2020')).toBeUndefined();
    expect(source('minv-nrsr-results-2023')).toMatchObject({ publishedAt: '2023-09-30' });
    expect(claim('claim-candidate-82-nrsr-result-2020')).toBeUndefined();
    expect(claim('claim-candidate-82-nrsr-result-2023')).toMatchObject({
      period: '2023', sourceIds: ['minv-nrsr-results-2023'],
    });
    expect(claim('claim-candidate-82-regional-result-2009')).toBeUndefined();
  });

  it('dates and attributes the Jančuška parking report exactly', () => {
    expect(source('tnlive-demanovska-parking-2025')).toBeUndefined();
    expect(source('tnlive-demanovska-parking-2026')?.publishedAt).toBe('2026-04-13');
    for (const id of ['claim-candidate-76-parking-report','claim-candidate-76-parking-response','claim-candidate-76-parking-media']) {
      expect(claim(id)?.period).toBe('2026-04-13');
      expect(claim(id)?.sourceIds).toEqual(['tnlive-demanovska-parking-2026']);
    }
    const response = claim('claim-candidate-76-parking-response')?.text.sk ?? '';
    for (const cost of ['nájom za pozemky', 'údržbu parkovacej plochy', 'osvetlenie parkovacej plochy', 'vysýpanie smetných košov', 'parkomatov', 'parkovčíkmi']) {
      expect(response).toContain(cost);
    }
    expect(response).not.toContain('VZN č. 03/2025');
    expect(response).not.toContain('tarifného pásma');
    expect(response).not.toContain('verejnú dopravu');
    expect(response).not.toMatch(/výsledok sporu/i);
  });

  it('keeps Gemzický merger attributions exact', () => {
    expect(source('stvr-school-merger-2025')?.publishedAt).toBe('2025-02-21');
    const response = claim('claim-candidate-72-school-merger-response')?.text.sk ?? '';
    expect(response).toContain('našli nejakú zhodu');
    expect(response).toContain('rozvojovú cestu pre poľnohospodárske odbory');
    expect(response).toContain('dostatok finančných prostriedkov a dostatok zamestnancov');
    expect(response).toContain('rozvíjať kvalitné vzdelávanie');
    expect(response).not.toContain('koordinácii');
    expect(response).not.toContain('Potrebu udržať kvalitu');
    expect(response).not.toContain('demografi');
    expect(response).not.toContain('Jurinová zdôraznila kvalitu');
  });

  it('adds official 2022 outcomes and Náhlik presidential result', () => {
    expect(claim('claim-candidate-72-regional-result-2022')).toMatchObject({
      kind: 'election_result', text: { sk: expect.stringContaining('6 696') },
    });
    expect(claim('claim-candidate-84-regional-result-2022')).toMatchObject({
      kind: 'election_result', text: { sk: expect.stringContaining('1 149') },
    });
    expect(claim('claim-candidate-80-presidential-result-2024')).toMatchObject({
      kind: 'election_result', text: { sk: expect.stringContaining('3 111') },
    });
  });

  it('uses the exact Čonka notice metadata and no weak historical election joins', () => {
    expect(source('justice-execution-conka-2024')).toMatchObject({
      title: '075 EX 40/24', publishedAt: '2024-04-30',
    });
    expect(claim('claim-candidate-70-execution-notice-2024')).toMatchObject({ kind: 'fact' });
    expect(claim('claim-candidate-70-execution-notice-2024')?.text.sk).toContain('právoplatného rozkazu o uložení pokuty RVPS');
    expect(claim('claim-candidate-70-regional-results-2005')).toBeUndefined();
    expect(claim('claim-candidate-70-regional-results-2009')).toBeUndefined();
    expect(claim('claim-candidate-70-regional-candidacy-2022')).toBeDefined();
    expect(source('statistics-regional-results-2005')?.title).toContain('neboli zvolení');
  });

  it('keeps Chovan employment evidence roster-only', () => {
    expect(source('registeruz-liptor-1559020')).toBeUndefined();
    expect(source('peniaze-liptor-chovan')).toBeUndefined();
    expect(claim('claim-candidate-74-company-role')).toBeUndefined();
    expect(claim('claim-candidate-74-official-occupation')).toMatchObject({
      sourceIds: ['zsk-district-5-roster-2026'],
      text: { sk: expect.stringContaining('invalidný dôchodca') },
    });
  });

  it('has the reviewed Task 8 coverage totals', () => {
    const rows = data.researchCoverage.filter((item) => {
      const n = Number(item.candidateId.replace('candidate-', ''));
      return n >= 70 && n <= 84 && item.category !== 'basic';
    });
    expect(rows.reduce<Record<string, number>>((counts, row) => {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
      return counts;
    }, {})).toEqual({ found: 43, searched_none: 50, not_applicable: 12 });
  });
});
