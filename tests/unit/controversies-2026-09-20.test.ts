import { describe, expect, it } from 'vitest';
import { loadGuideData } from '../../src/lib/load-guide-data';

const data = await loadGuideData();
const claim = (id: string) => data.claims.find((item) => item.id === id);
const source = (id: string) => data.sources.find((item) => item.id === id);
const coverage = (candidateId: string) => data.researchCoverage
  .find((item) => item.candidateId === candidateId && item.category === 'controversies');

describe('Verified controversy additions on 2026-09-20', () => {
  it('attributes Drahovzal court reporting to SITA without claiming a primary court record', () => {
    expect(claim('claim-candidate-3-sita-court-verdict-2018')).toMatchObject({
      candidateId: 'candidate-3', category: 'controversies', kind: 'media_report',
      period: '2018-11-29', checkedAt: '2026-09-20',
      sourceIds: ['sita-drahovzal-court-2018'],
    });
    expect(claim('claim-candidate-3-sita-court-finality-2018')).toMatchObject({
      candidateId: 'candidate-3', kind: 'media_report', sourceIds: ['sita-drahovzal-court-2018'],
    });
    expect(claim('claim-candidate-3-sita-court-verdict-2018')?.text.sk).toContain('SITA');
    expect(claim('claim-candidate-3-sita-court-finality-2018')?.text.sk).toContain('SITA');
    expect(data.claims.filter((item) => item.candidateId === 'candidate-3'
      && item.category === 'controversies' && item.kind === 'official_outcome')).toHaveLength(0);
    expect(coverage('candidate-3')).toMatchObject({
      status: 'found', checkedAt: '2026-09-20', sourceIds: ['sita-drahovzal-court-2018'],
    });
    expect(source('sita-drahovzal-court-2018')).toMatchObject({
      publisher: 'SITA', author: 'SITA', publishedAt: '2018-11-29',
      checkedAt: '2026-09-20', type: 'media',
    });
  });

  it('separates the Belousovová report, her response and attributed committee follow-up', () => {
    expect(claim('claim-candidate-85-sita-slap-report-2010')).toMatchObject({
      candidateId: 'candidate-85', kind: 'media_report',
      period: '2010-08-10', sourceIds: ['sita-belousovova-slap-2010'],
    });
    expect(claim('claim-candidate-85-sita-slap-response-2010')).toMatchObject({
      candidateId: 'candidate-85', kind: 'response',
      period: '2010-08-10', sourceIds: ['sita-belousovova-slap-2010'],
    });
    expect(claim('claim-candidate-85-sita-committee-report-2010')).toMatchObject({
      candidateId: 'candidate-85', kind: 'media_report',
      period: '2010-09-02', sourceIds: ['sita-belousovova-committee-2010'],
    });
    expect(claim('claim-candidate-85-sita-committee-report-2010')?.text.sk).toContain('SITA');
    expect(data.claims.filter((item) => item.candidateId === 'candidate-85'
      && item.category === 'controversies' && item.kind === 'official_outcome')).toHaveLength(0);
    expect(coverage('candidate-85')?.sourceIds).toEqual(expect.arrayContaining([
      'hlavnespravy-belousovova-rizman-2026',
      'sita-belousovova-slap-2010', 'sita-belousovova-committee-2010',
    ]));
  });

  it('keeps the Choma procurement chronology through the superseding 2025 decision', () => {
    expect(claim('claim-candidate-87-audi-first-contract-2016')).toMatchObject({
      candidateId: 'candidate-87', kind: 'media_report',
      period: '2016-07-16', sourceIds: ['dennike-choma-audi-first-2016'],
    });
    expect(claim('claim-candidate-87-audi-first-contract-2016')?.text.sk).toContain('79 440');
    expect(claim('claim-candidate-87-audi-first-cancelled-2016')).toMatchObject({
      candidateId: 'candidate-87', kind: 'media_report',
      sourceIds: ['dennike-choma-audi-first-2016'],
    });
    expect(claim('claim-candidate-87-audi-second-contract-2016')).toMatchObject({
      candidateId: 'candidate-87', kind: 'fact',
      period: '2016-07-20', sourceIds: ['uvo-choma-audi-decision-2025'],
    });
    expect(claim('claim-candidate-87-audi-second-contract-2016')?.text.sk).toContain('71 777');
    expect(claim('claim-candidate-87-audi-uvo-decision-2017')).toMatchObject({
      candidateId: 'candidate-87', kind: 'official_outcome', period: '2017-03-16',
      sourceIds: ['uvo-choma-audi-decision-2017', 'ssba-choma-audi-judgment-2024'],
    });
    expect(claim('claim-candidate-87-audi-uvo-decision-2017')?.text.sk).toContain('zrušil');
    expect(claim('claim-candidate-87-audi-court-annulment-2024')).toMatchObject({
      candidateId: 'candidate-87', kind: 'official_outcome', period: '2024-11-28',
      sourceIds: ['ssba-choma-audi-judgment-2024'],
    });
    expect(claim('claim-candidate-87-audi-uvo-closure-2025')).toMatchObject({
      candidateId: 'candidate-87', kind: 'official_outcome', period: '2025-03-20',
      sourceIds: ['uvo-choma-audi-decision-2025'],
    });
    expect(claim('claim-candidate-87-audi-court-annulment-2024')?.text.sk).toContain('zrušil');
    expect(claim('claim-candidate-87-audi-uvo-closure-2025')?.text.sk).toContain('zastavila');
    expect(source('dennike-choma-audi-first-2016')?.author).toBe('Daniela Krajanová');
    expect(coverage('candidate-87')?.sourceIds).toEqual(expect.arrayContaining([
      'aktuality-choma-office-rent-2015',
      'dennike-choma-audi-first-2016',
      'uvo-choma-audi-decision-2017', 'ssba-choma-audi-judgment-2024',
      'uvo-choma-audi-decision-2025',
    ]));
  });

  it('adds Fiabáne’s view separately from the unchanged Kapitulík response', () => {
    expect(claim('claim-candidate-89-fiabane-dismissal-response-2025')).toMatchObject({
      candidateId: 'candidate-89', kind: 'response',
      period: '2025-12-13', checkedAt: '2026-09-20',
      sourceIds: ['tasr-kapitulik-fiabane-2025'],
    });
    expect(claim('claim-candidate-89-fiabane-dismissal-response-2025')?.text.sk).toContain('Fiabáne');
    expect(claim('claim-candidate-89-dismissal-response-2025')).toBeDefined();
    expect(coverage('candidate-89')?.sourceIds).toEqual(expect.arrayContaining([
      'zilina-kapitulik-dismissal-official-2025',
      'zilinskyvecernik-kapitulik-dismissal-2025',
      'tasr-kapitulik-fiabane-2025',
    ]));
    expect(source('tasr-kapitulik-fiabane-2025')).toMatchObject({
      author: 'TASR', publishedAt: '2025-12-13', checkedAt: '2026-09-20',
    });
  });
});
