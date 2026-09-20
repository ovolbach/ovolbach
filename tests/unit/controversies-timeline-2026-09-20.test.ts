import { describe, expect, it } from 'vitest';
import { loadGuideData } from '../../src/lib/load-guide-data';

const data = await loadGuideData();
const claim = (id: string) => data.claims.find((item) => item.id === id);
const source = (id: string) => data.sources.find((item) => item.id === id);
const controversyCoverage = (candidateId: string) => data.researchCoverage
  .find((item) => item.candidateId === candidateId && item.category === 'controversies');

describe('Controversy timelines verified on 2026-09-20', () => {
  it('shows the reported beginning of the Blcháč heliport case before its existing closure', () => {
    expect(claim('claim-candidate-1-heliport-agreement-report-2015')).toMatchObject({
      candidateId: 'candidate-1', category: 'controversies', kind: 'media_report',
      period: '2015', sourceIds: ['pravda-blchac-heliport-charge-2015'],
      checkedAt: '2026-09-20',
    });
    expect(claim('claim-candidate-1-heliport-charge-report-2015')).toMatchObject({
      candidateId: 'candidate-1', category: 'controversies', kind: 'media_report',
      period: '2015-10-14', sourceIds: ['pravda-blchac-heliport-charge-2015'],
      checkedAt: '2026-09-20',
    });
    expect(claim('claim-candidate-1-heliport-charge-annulled-report-2015')).toMatchObject({
      candidateId: 'candidate-1', category: 'controversies', kind: 'media_report',
      period: '2015-10-28', sourceIds: ['tasr-blchac-heliport-repeat-charge-2015'],
    });
    expect(claim('claim-candidate-1-heliport-repeat-charge-report-2015')).toMatchObject({
      candidateId: 'candidate-1', category: 'controversies', kind: 'media_report',
      period: '2015-12-07', sourceIds: ['tasr-blchac-heliport-repeat-charge-2015'],
    });
    expect(claim('claim-candidate-1-heliport-repeat-charge-report-2015')?.text.sk)
      .toContain('TASR 7. decembra 2015');
    expect(claim('claim-blchac-heliport-reported-closure-2018')).toBeDefined();
    expect(controversyCoverage('candidate-1')?.sourceIds).toEqual(expect.arrayContaining([
      'pravda-blchac-heliport-charge-2015',
      'tasr-blchac-heliport-repeat-charge-2015',
      'tasr-blchac-heliport-2018',
    ]));
  });

  it('keeps the museum removal distinct from the later employment settlement', () => {
    expect(claim('claim-candidate-88-museum-removal-report-2023')).toMatchObject({
      candidateId: 'candidate-88', category: 'controversies', kind: 'media_report',
      period: '2023-04', sourceIds: ['aktuality-jurinova-kovacic-dismissal-2025'],
      checkedAt: '2026-09-20',
    });
    expect(claim('claim-candidate-88-museum-court-outcome-2025')).toBeDefined();
    expect(controversyCoverage('candidate-88')?.sourceIds).toContain('aktuality-jurinova-kovacic-dismissal-2025');
  });

  it('shows that the Liptovský Mikuláš schools actually merged', () => {
    expect(claim('claim-candidate-72-school-merger-implemented-2025')).toMatchObject({
      candidateId: 'candidate-72', category: 'controversies', kind: 'fact',
      period: '2025-09-01', sourceIds: ['spslm-school-merger-2025'],
      checkedAt: '2026-09-20',
    });
    expect(claim('claim-candidate-72-school-merger-report')).toBeDefined();
    expect(controversyCoverage('candidate-72')?.sourceIds).toContain('spslm-school-merger-2025');
  });

  it('records the two official non-appointments and the rival 2026 school statements', () => {
    expect(claim('claim-candidate-72-school-first-nonappointment-2026')).toMatchObject({
      candidateId: 'candidate-72', category: 'controversies', kind: 'official_outcome',
      period: '2026-04-29', sourceIds: ['zsk-school-director-first-notice-2026'],
    });
    expect(claim('claim-candidate-72-school-appointment-demand-2026')).toMatchObject({
      candidateId: 'candidate-72', category: 'controversies', kind: 'media_report',
      period: '2026-06-29', sourceIds: ['sp21-school-director-dispute-2026'],
    });
    expect(claim('claim-candidate-72-school-region-response-2026')).toMatchObject({
      candidateId: 'candidate-72', category: 'controversies', kind: 'response',
      period: '2026-06-29', sourceIds: ['sp21-school-director-dispute-2026'],
    });
    expect(claim('claim-candidate-72-school-second-nonappointment-2026')).toMatchObject({
      candidateId: 'candidate-72', category: 'controversies', kind: 'official_outcome',
      period: '2026-07-20', sourceIds: ['zsk-school-director-second-notice-2026'],
    });
    expect(claim('claim-candidate-72-school-third-selection-announced-2026')).toMatchObject({
      candidateId: 'candidate-72', category: 'controversies', kind: 'fact',
      period: '2026-07-30', sourceIds: ['russza-school-director-third-notice-2026'],
    });
    expect(claim('claim-candidate-72-school-third-selection-announced-2026')?.text.sk)
      .toContain('Regionálny úrad školskej správy v Žiline');
    expect(source('russza-school-director-third-notice-2026')).toMatchObject({
      publisher: 'Regionálny úrad školskej správy v Žiline', type: 'official',
      checkedAt: '2026-09-20',
    });
    expect(source('russza-school-director-third-notice-2026')?.url)
      .toContain('/cloud/Vyhlasenie_VK_SOSSaSOSAT_Liptovsky_Mikulas.pdf?');
    expect(controversyCoverage('candidate-72')?.sourceIds).toEqual(expect.arrayContaining([
      'zsk-school-director-first-notice-2026', 'sp21-school-director-dispute-2026',
      'zsk-school-director-second-notice-2026', 'russza-school-director-third-notice-2026',
    ]));
  });

  it('records the ombudsman intervention without inventing an ECHR merits judgment', () => {
    expect(claim('claim-candidate-90-echr-ombudsman-intervention-2026')).toMatchObject({
      candidateId: 'candidate-90', category: 'controversies', kind: 'fact',
      period: '2026-01-13', sourceIds: ['echr-lucansky-notification-2025', 'vop-lucansky-intervention-2026'],
      checkedAt: '2026-09-20',
    });
    expect(claim('claim-candidate-90-echr-ombudsman-intervention-2026')?.text.sk).toContain(
      'nevyjadroval k okolnostiam úmrtia',
    );
    expect(source('vop-lucansky-intervention-2026')?.type).toBe('official');
    expect(controversyCoverage('candidate-90')?.sourceIds).toContain('vop-lucansky-intervention-2026');
  });

  it('records the next stage of the Kapitulík architect-selection dispute as a report', () => {
    expect(claim('claim-candidate-89-architect-election-report-2026')).toMatchObject({
      candidateId: 'candidate-89', category: 'controversies', kind: 'media_report',
      period: '2026-02-17', sourceIds: [
        'sp21-kapitulik-architect-election-2026', 'zilina-architect-vote-2026',
      ],
    });
    expect(source('zilina-architect-vote-2026')?.type).toBe('official');
    expect(controversyCoverage('candidate-89')?.sourceIds).toContain('sp21-kapitulik-architect-election-2026');
    expect(controversyCoverage('candidate-89')?.sourceIds).toContain('zilina-architect-vote-2026');
  });
});
