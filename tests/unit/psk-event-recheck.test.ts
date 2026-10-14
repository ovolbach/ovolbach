import { describe, expect, it } from 'vitest';
import { loadElectionCycle } from '../../src/lib/load-guide-data';

const data = await loadElectionCycle(2026, 'presovsky-kraj');

describe('PSK event context and procedural boundaries', () => {
  it.each([
    'claim-psk-jozef-stefanak-controversies-1',
    'claim-psk-peter-dzurilla-controversies-1',
    'claim-psk-jozef-svagerko-controversies-1',
    'review-psk-milan-mazurek-controversies-1',
    'review-psk-jan-stanko-controversies-1',
    'review-psk-milan-majersky-controversies-1',
  ])('shows the reported event %s in the same section as the response', (claimId) => {
    expect(data.claims.find((claim) => claim.id === claimId)).toMatchObject({ category: 'controversies', kind: 'media_report' });
    expect(data.claims.filter((claim) => claim.id === claimId)).toHaveLength(1);
  });

  it('does not leave a profile with reactions but no reported event in the event section', () => {
    for (const response of data.claims.filter((claim) => claim.category === 'controversies' && claim.kind === 'response')) {
      const context = data.claims.filter((claim) => claim.candidateId === response.candidateId && claim.category === 'controversies'
        && ['media_report', 'official_outcome', 'fact'].includes(claim.kind));
      expect(context.length, response.id).toBeGreaterThan(0);
    }
  });

  it('keeps the appeal-era Sabaka report non-final and the bankruptcy termination separate from the earlier notice', () => {
    expect(data.claims.find((claim) => claim.id === 'review-psk-milan-mazurek-controversies-2'))
      .toMatchObject({ kind: 'media_report', text: { sk: expect.stringContaining('nebol právoplatný') } });
    const kaso = data.claims.filter((claim) => claim.candidateId === 'psk-zoltan-kaso' && claim.category === 'controversies');
    expect(kaso).toContainEqual(expect.objectContaining({ kind: 'official_outcome', period: '2024-09-16', text: { sk: expect.stringContaining('zrušení konkurzu') } }));
    expect(kaso).toContainEqual(expect.objectContaining({ kind: 'official_outcome', period: '2023-05-18' }));
  });

  it('publishes the newsroom correction beside the disputed Eštočák complaint allegation', () => {
    expect(data.claims.find((claim) => claim.id === 'claim-psk-martin-estocak-event-stadium-reported-allegation'))
      .toMatchObject({ category: 'controversies', kind: 'media_report' });
    expect(data.claims.find((claim) => claim.id === 'claim-psk-martin-estocak-event-stadium-correction'))
      .toMatchObject({ category: 'controversies', kind: 'response', text: { sk: expect.stringContaining('nebol osobou, ktorá podala trestné oznámenie') } });
  });

  it('retains the referral to an administrative authority as a reported procedural stage in the Kavka case', () => {
    expect(data.claims.find((claim) => claim.id === 'claim-psk-ondrej-kavka-event-dogs-referral'))
      .toMatchObject({ kind: 'media_report', text: { sk: expect.stringContaining('podozrenie z priestupku') } });
  });
});
