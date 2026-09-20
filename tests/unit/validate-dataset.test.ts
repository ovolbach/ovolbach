import { describe, expect, it } from 'vitest';
import { validateDataset } from '../../src/lib/validate-dataset';
import { claimSchema, sourceSchema, candidacySchema, electionSchema } from '../../src/lib/schemas';
import {
  baseCandidate,
  baseCandidacy,
  baseClaim,
  baseElection,
  baseSource,
  makeGuideData,
  pendingCoverage,
} from '../fixtures/guide-data';

describe('validateDataset', () => {
  it('requires a unique contest ID on elections and candidacies', () => {
    expect(electionSchema.safeParse({ ...baseElection, contestId: '2026-lm-mayor' }).success).toBe(true);
    const { contestId: electionContestId, ...electionWithoutContestId } = baseElection;
    expect(electionSchema.safeParse(electionWithoutContestId).success).toBe(false);
    expect(candidacySchema.safeParse({ ...baseCandidacy, contestId: '2026-lm-mayor' }).success).toBe(true);
    const { contestId: candidacyContestId, ...candidacyWithoutContestId } = baseCandidacy;
    expect(candidacySchema.safeParse(candidacyWithoutContestId).success).toBe(false);
  });

  it('allows separate city mayor contests but rejects a candidacy joined to the wrong contest kind', () => {
    const data = makeGuideData({
      elections: [
        { ...baseElection, contestId: '2026-lm-mayor' },
        { ...baseElection, contestId: '2026-rk-mayor' },
      ],
      candidacies: [{ ...baseCandidacy, contestId: '2026-rk-mayor', electionId: 'city-council' }],
    });
    const issues = validateDataset(data, 'draft');
    expect(issues.map((issue) => issue.code)).not.toContain('duplicate_id');
    expect(issues).toContainEqual({
      code: 'wrong_contest_kind', recordId: baseCandidacy.id, referenceId: '2026-rk-mayor',
    });
  });
  it('rejects duplicate IDs', () => {
    const data = makeGuideData({ candidates: [baseCandidate, { ...baseCandidate }] });
    expect(validateDataset(data, 'draft')).toContainEqual({
      code: 'duplicate_id', recordId: baseCandidate.id, referenceId: baseCandidate.id,
    });
  });

  it('rejects a claim whose source does not exist', () => {
    const data = makeGuideData({ claims: [{ ...baseClaim, sourceIds: ['missing-source'] }] });
    expect(validateDataset(data, 'draft')).toContainEqual({
      code: 'unknown_source', recordId: baseClaim.id, referenceId: 'missing-source',
    });
  });

  it('rejects a candidacy whose district does not exist', () => {
    const data = makeGuideData({
      candidacies: [{ ...baseCandidacy, electionId: 'city-council', districtId: 'missing-district' }],
      elections: [{ ...baseElection, id: 'city-council', maxSelections: 'district_seats' }],
    });
    expect(validateDataset(data, 'draft')).toContainEqual({
      code: 'unknown_district', recordId: baseCandidacy.id, referenceId: 'missing-district',
    });
  });

  it('rejects duplicate ballot numbers inside one ballot', () => {
    const data = makeGuideData({
      candidacies: [baseCandidacy, { ...baseCandidacy, id: 'candidacy-2', candidateId: 'candidate-2' }],
      candidates: [baseCandidate, { ...baseCandidate, id: 'candidate-2', slug: 'peter-novak' }],
    });
    expect(validateDataset(data, 'draft').map((issue) => issue.code)).toContain('duplicate_ballot_number');
  });

  it('rejects pending research in release mode', () => {
    const data = makeGuideData({ researchCoverage: [pendingCoverage] });
    expect(validateDataset(data, 'release').map((issue) => issue.code)).toContain('pending_research');
  });

  it('rejects a non-array collection instead of treating it as empty', () => {
    const data = { ...makeGuideData(), candidates: { id: 'not-an-array' } } as unknown as Parameters<typeof validateDataset>[0];
    expect(validateDataset(data, 'release')).toContainEqual({
      code: 'invalid_schema', recordId: 'candidates', referenceId: 'candidates',
    });
  });

  it('requires source traceability for source-backed records', () => {
    const data = makeGuideData({ claims: [{ ...baseClaim, sourceIds: [] }] });
    expect(validateDataset(data, 'draft')).toContainEqual({
      code: 'invalid_schema', recordId: baseClaim.id, referenceId: 'claims',
    });
  });

  it('rejects found non-basic coverage without a matching claim', () => {
    const researchCoverage = makeGuideData().researchCoverage.map((coverage) => (
      coverage.category === 'basic' || coverage.category === 'employment_business'
        ? coverage
        : { ...coverage, status: 'searched_none' as const, sourceIds: [] }
    ));
    const data = makeGuideData({ researchCoverage });

    expect(validateDataset(data, 'draft')).toContainEqual({
      code: 'found_coverage_without_claim',
      recordId: 'coverage-employment_business',
      referenceId: 'candidate-1:employment_business',
    });
  });

  it('rejects a non-basic claim that conflicts with non-found coverage', () => {
    const employmentClaim = {
      ...baseClaim,
      id: 'claim-employment',
      category: 'employment_business' as const,
    };
    const researchCoverage = makeGuideData().researchCoverage.map((coverage) => (
      coverage.category === 'basic'
        ? coverage
        : { ...coverage, status: 'searched_none' as const, sourceIds: [] }
    ));
    const data = makeGuideData({ claims: [baseClaim, employmentClaim], researchCoverage });

    expect(validateDataset(data, 'draft')).toContainEqual({
      code: 'claim_conflicts_with_coverage',
      recordId: employmentClaim.id,
      referenceId: 'coverage-employment_business',
    });
  });

  it('rejects non-calendar ISO dates', () => {
    expect(claimSchema.safeParse({ ...baseClaim, checkedAt: '2026-02-30' }).success).toBe(false);
  });

  it('accepts Czech as a source language', () => {
    expect(sourceSchema.safeParse({ ...baseSource, language: 'cs' }).success).toBe(true);
  });

  it('requires HTTPS sources and rejects duplicate canonical URLs', () => {
    expect(sourceSchema.safeParse({ ...baseSource, url: 'http://example.com/source' }).success).toBe(false);
    const data = makeGuideData({
      sources: [baseSource, { ...baseSource, id: 'source-2' }],
    });
    expect(validateDataset(data, 'draft')).toContainEqual({
      code: 'duplicate_source_url', recordId: 'source-2', referenceId: baseSource.id,
    });
  });

  it('requires coverage for every candidate and category', () => {
    const data = makeGuideData({ researchCoverage: [] });
    expect(validateDataset(data, 'draft')).toContainEqual({
      code: 'missing_research_coverage', recordId: baseCandidate.id, referenceId: 'basic',
    });
  });

  it('rejects a city-council candidacy using a region district', () => {
    const district = {
      id: 'zsk-5', kind: 'region' as const, number: 5, name: 'ŽSK 5', seats: 1,
      areas: ['Žilina'], pollingStations: [], sourceIds: ['source-1'],
    };
    const data = makeGuideData({
      districts: [district],
      candidacies: [{ ...baseCandidacy, electionId: 'city-council', districtId: district.id }],
      elections: [{ ...baseElection, id: 'city-council', maxSelections: 'district_seats' }],
    });
    expect(validateDataset(data, 'draft')).toContainEqual({
      code: 'wrong_district_kind', recordId: baseCandidacy.id, referenceId: district.id,
    });
  });

  it('requires districts for council candidacies and forbids them for mayoral candidacies', () => {
    const missing = makeGuideData({
      candidacies: [{ ...baseCandidacy, electionId: 'city-council' }],
      elections: [{ ...baseElection, id: 'city-council', maxSelections: 'district_seats' }],
    });
    const unexpected = makeGuideData({ candidacies: [{ ...baseCandidacy, districtId: 'city-1' }] });
    expect(validateDataset(missing, 'draft')).toContainEqual({ code: 'missing_district', recordId: baseCandidacy.id });
    expect(validateDataset(unexpected, 'draft')).toContainEqual({
      code: 'unexpected_district', recordId: baseCandidacy.id, referenceId: 'city-1',
    });
  });
});
