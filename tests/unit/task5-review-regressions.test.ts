import { describe, expect, it } from 'vitest';
import { loadGuideData } from '../../src/lib/load-guide-data';

const data = await loadGuideData();
const claim = (id: string) => data.claims.find((item) => item.id === id);
const source = (id: string) => data.sources.find((item) => item.id === id);
const coverage = (candidateId: string, category: string) => data.researchCoverage
  .find((item) => item.candidateId === candidateId && item.category === category);

describe('Task 5 reviewed evidence', () => {
  it('does not attribute an AGRIA board role to Marta Jančušová', () => {
    expect(claim('claim-candidate-56-agria-board-role-2022')).toBeUndefined();
    expect(source('rpvs-agria-jancusova-2022')).toBeUndefined();
    expect(coverage('candidate-56', 'employment_business')).toMatchObject({
      status: 'found',
      sourceIds: ['lm-city-council-roster-2026', 'ov-zuma-agro-jancusova-2026'],
    });
  });

  it('preserves Milota Nahálková current role and primary campaign quote verbatim', () => {
    expect(claim('claim-candidate-58-tv-liptov-role')).toMatchObject({
      period: '2026-09-18',
      text: {
        sk: 'Oficiálna stránka mesta pri kontrole 18. septembra 2026 uvádzala Milotu Nahálkovú ako riaditeľku a šéfredaktorku vysielania TV Liptov.',
      },
    });
    expect(claim('claim-candidate-58-programme-2026')).toMatchObject({
      kind: 'quote',
      text: {
        sk: '„Venovať sa chcem najmä uliciam a chodníkom, verejným priestorom, zeleni, infraštruktúre a službám, ktoré ovplyvňujú každodenný život obyvateľov.“',
      },
    });
  });

  it('joins the Juraj Kolesár interview to a primary identity profile', () => {
    expect(source('indicia-kolesar-profile')).toMatchObject({
      url: 'https://www.indicia.sk/prednasatelia/mgr-juraj-kolesar',
      title: 'Mgr. Juraj Kolesár',
      publisher: 'Indícia, n.o.',
      type: 'official',
    });
    expect(claim('claim-candidate-55-media-luzifcak-2026')?.sourceIds).toEqual([
      'youtube-luzifcak-kolesar-2026',
      'indicia-kolesar-profile',
    ]);
    expect(coverage('candidate-55', 'media')?.sourceIds).toEqual([
      'youtube-luzifcak-kolesar-2026',
      'indicia-kolesar-profile',
    ]);
  });

  it('keeps all eight coverage rows complete with valid found sources', () => {
    const sourceIds = new Set(data.sources.map((item) => item.id));
    for (const candidateId of ['candidate-54', 'candidate-55', 'candidate-56', 'candidate-57', 'candidate-58', 'candidate-59']) {
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
