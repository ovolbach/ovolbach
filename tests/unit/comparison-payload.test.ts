import { describe, expect, it } from 'vitest';
import { createComparisonPayload } from '../../src/lib/comparison-payload';
import { loadGuideData } from '../../src/lib/load-guide-data';
import { PROFILE_CATEGORIES, coverageTitle } from '../../src/lib/profile-content';

const data = await loadGuideData();

describe('comparison payload', () => {
  it('serializes canonical category and coverage labels', () => {
    const payload = createComparisonPayload(data);
    expect(payload.categories).toEqual(PROFILE_CATEGORIES);
    expect(payload.coverageLabels.pending).toBe(coverageTitle('pending'));
  });

  it('fails closed for a factual claim without a source', () => {
    const invalid = structuredClone(data);
    invalid.claims = [{ id: 'claim-missing-source', candidateId: 'candidate-1', category: 'basic', kind: 'fact', label: { sk: 'Test' }, text: { sk: 'Test' }, sourceIds: [], checkedAt: '2026-09-17' }];
    expect(() => createComparisonPayload(invalid)).toThrow('claim-missing-source: sourceIds must not be empty');
  });

  it('fails closed for a factual claim with an unknown source', () => {
    const invalid = structuredClone(data);
    invalid.claims = [{ id: 'claim-unknown-source', candidateId: 'candidate-1', category: 'basic', kind: 'fact', label: { sk: 'Test' }, text: { sk: 'Test' }, sourceIds: ['missing'], checkedAt: '2026-09-17' }];
    expect(() => createComparisonPayload(invalid)).toThrow('claim-unknown-source: unknown source ID missing');
  });
});
