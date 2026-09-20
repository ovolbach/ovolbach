import { describe, expect, it } from 'vitest';
import { buildCoverageReport, parseCoverageCliFilter } from '../../src/lib/research-report';
import { baseCandidate, baseCandidacy, baseSource, makeGuideData } from '../fixtures/guide-data';
import type { Candidate, ResearchCoverage } from '../../src/lib/schemas';

const categories = [
  'basic',
  'employment_business',
  'public_office',
  'previous_elections',
  'programme_statements',
  'asset_declarations',
  'media',
  'controversies',
] as const;

function coverage(candidateId: string, pending: string[] = []): ResearchCoverage[] {
  return categories.map((category) => ({
    id: `coverage-${candidateId}-${category}`,
    candidateId,
    category,
    status: pending.includes(category) ? 'pending' : 'found',
    checkedAt: '2026-09-17',
    sourceIds: pending.includes(category) ? [] : [baseSource.id],
  }));
}

describe('buildCoverageReport', () => {
  it('reports every missing category for a candidate', () => {
    const data = makeGuideData({
      researchCoverage: coverage(baseCandidate.id, ['employment_business', 'public_office']),
    });

    const report = buildCoverageReport(data, { electionId: 'mayor' });

    expect(report.candidates[0]).toMatchObject({
      candidateId: 'candidate-1',
      totalCategories: 8,
      pendingCategories: ['employment_business', 'public_office'],
      totals: { found: 6, searched_none: 0, not_applicable: 0, pending: 2 },
    });
    expect(report.releaseReady).toBe(false);
  });

  it('maps public city district filters by canonical district number', () => {
    const data = makeGuideData({
      districts: [{
        id: 'city-1', kind: 'city', number: 1, name: 'District 1', seats: 1, areas: [], pollingStations: [], sourceIds: [baseSource.id],
      }],
      candidacies: [{ ...baseCandidacy, electionId: 'city-council', districtId: 'city-1' }],
    });

    const report = buildCoverageReport(data, { districtId: 'district-1' });

    expect(report.candidates.map((candidate) => candidate.candidateId)).toEqual(['candidate-1']);
  });

  it('accepts the region-district public filter', () => {
    const data = makeGuideData({
      districts: [{
        id: 'zsk-5', kind: 'region', number: 5, name: 'Region district 5', seats: 1, areas: [], pollingStations: [], sourceIds: [baseSource.id],
      }],
      candidacies: [{ ...baseCandidacy, electionId: 'region-council', districtId: 'zsk-5' }],
    });

    const report = buildCoverageReport(data, { districtId: 'region-district-5' });

    expect(report.candidates.map((candidate) => candidate.candidateId)).toEqual(['candidate-1']);
  });

  it('includes a candidate once when matching multiple filtered candidacies', () => {
    const data = makeGuideData({
      candidacies: [
        baseCandidacy,
        { ...baseCandidacy, id: 'candidacy-2', electionId: 'city-council', districtId: 'city-1' },
      ],
      districts: [{
        id: 'city-1', kind: 'city', number: 1, name: 'District 1', seats: 1, areas: [], pollingStations: [], sourceIds: [baseSource.id],
      }],
    });

    const report = buildCoverageReport(data);

    expect(report.candidates).toHaveLength(1);
    expect(report.candidates[0]?.candidateId).toBe('candidate-1');
  });

  it('fails clearly for unknown or unsupported filters', () => {
    const data = makeGuideData();

    expect(() => buildCoverageReport(data, { electionId: 'unknown-election' })).toThrow('Unknown election filter: unknown-election');
    expect(() => buildCoverageReport(data, { districtId: 'district-99' })).toThrow('Unknown city district filter: district-99');
    expect(() => buildCoverageReport(data, { districtId: 'city-1' })).toThrow('Unsupported district filter: city-1');
  });

  it('rejects explicit empty or whitespace-only filters instead of reporting every candidate', () => {
    const data = makeGuideData();

    expect(() => buildCoverageReport(data, { electionId: '' })).toThrow('Invalid election filter: value must not be empty');
    expect(() => buildCoverageReport(data, { electionId: '   ' })).toThrow('Invalid election filter: value must not be empty');
    expect(() => buildCoverageReport(data, { districtId: '' })).toThrow('Invalid district filter: value must not be empty');
    expect(() => buildCoverageReport(data, { districtId: '   ' })).toThrow('Invalid district filter: value must not be empty');
  });

  it('parses CLI filters without treating blank or duplicate options as absent', () => {
    expect(() => parseCoverageCliFilter(['--election='])).toThrow('Invalid election filter: value must not be empty');
    expect(() => parseCoverageCliFilter(['--district=   '])).toThrow('Invalid district filter: value must not be empty');
    expect(() => parseCoverageCliFilter(['--election=mayor', '--election=city-council']))
      .toThrow('Election filter provided more than once');
    expect(() => parseCoverageCliFilter(['--district=district-1', '--district=district-2']))
      .toThrow('District filter provided more than once');
    expect(parseCoverageCliFilter(['--election=mayor', '--district=district-1']))
      .toEqual({ electionId: 'mayor', districtId: 'district-1' });
  });

  it('fails clearly for an ambiguous public district filter', () => {
    const data = makeGuideData({
      districts: [
        { id: 'city-1a', kind: 'city', number: 1, name: 'District 1A', seats: 1, areas: [], pollingStations: [], sourceIds: [baseSource.id] },
        { id: 'city-1b', kind: 'city', number: 1, name: 'District 1B', seats: 1, areas: [], pollingStations: [], sourceIds: [baseSource.id] },
      ],
    });

    expect(() => buildCoverageReport(data, { districtId: 'district-1' })).toThrow('Ambiguous city district filter: district-1');
  });

  it('provides exactly eight statuses even when coverage records are absent', () => {
    const report = buildCoverageReport(makeGuideData({ researchCoverage: [] }));

    expect(report.candidates[0]?.categories).toHaveLength(8);
    expect(report.candidates[0]?.categories.map((category) => category.status)).toEqual([
      'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending',
    ]);
  });

  it('sorts rows by family name, given name, then id and marks completed coverage ready', () => {
    const adam: Candidate = { ...baseCandidate, id: 'a', givenName: 'Adam', familyName: 'Novak', displayName: 'Adam Novak' };
    const bea: Candidate = { ...baseCandidate, id: 'b', givenName: 'Bea', familyName: 'Novak', displayName: 'Bea Novak' };
    const anna: Candidate = { ...baseCandidate, id: 'c', givenName: 'Anna', familyName: 'Adamcova', displayName: 'Anna Adamcova' };
    const adamLater: Candidate = { ...baseCandidate, id: 'z', givenName: 'Adam', familyName: 'Novak', displayName: 'Adam Novak II' };
    const data = makeGuideData({
      candidates: [bea, adamLater, adam, anna],
      candidacies: [
        { ...baseCandidacy, candidateId: bea.id, id: 'candidacy-b' },
        { ...baseCandidacy, candidateId: adam.id, id: 'candidacy-a' },
        { ...baseCandidacy, candidateId: anna.id, id: 'candidacy-c' },
        { ...baseCandidacy, candidateId: adamLater.id, id: 'candidacy-z' },
      ],
      researchCoverage: [...coverage(adam.id), ...coverage(bea.id), ...coverage(anna.id), ...coverage(adamLater.id)],
    });

    const report = buildCoverageReport(data);

    expect(report.candidates.map((candidate) => candidate.candidateId)).toEqual(['c', 'a', 'z', 'b']);
    expect(report.releaseReady).toBe(true);
  });

  it('counts searched_none as completed without validating source relationships', () => {
    const completed = coverage(baseCandidate.id).map((record) => (
      record.category === 'employment_business'
        ? { ...record, status: 'searched_none' as const, sourceIds: [] }
        : record.category === 'asset_declarations'
          ? { ...record, status: 'not_applicable' as const, sourceIds: [] }
          : record
    ));

    const report = buildCoverageReport(makeGuideData({ researchCoverage: completed }));

    expect(report.candidates[0]?.totals).toEqual({ found: 6, searched_none: 1, not_applicable: 1, pending: 0 });
    expect(report.releaseReady).toBe(true);
  });
});
