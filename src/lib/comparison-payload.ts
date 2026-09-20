import { claimKindLabel, coverageTitle, PROFILE_CATEGORIES } from './profile-content';
import { getOfficialCandidacies } from './official-facts';
import { getComparisonRows } from './selectors';
import type { GuideData, ResearchCoverage } from './schemas';
import { resolveSourceLinks } from './source-links';

export function createComparisonPayload(data: GuideData) {
  return {
    categories: PROFILE_CATEGORIES,
    coverageLabels: {
      found: coverageTitle('found'),
      pending: coverageTitle('pending'),
      searched_none: coverageTitle('searched_none'),
      not_applicable: coverageTitle('not_applicable'),
    } satisfies Record<ResearchCoverage['status'], string>,
    candidates: data.candidates.map((candidate) => ({
      candidate: { id: candidate.id, displayName: candidate.displayName, slug: candidate.slug },
      rows: getComparisonRows(data, [candidate.id]).map((row) => ({
        category: row.category,
        candidacies: row.category === 'basic' ? getOfficialCandidacies(data, candidate.id) : [],
        claims: row.cells[0]!.claims.map((claim) => ({
          id: claim.id,
          kind: claim.kind,
          kindLabel: claimKindLabel(claim.kind),
          label: claim.label.sk,
          text: claim.text.sk,
          period: claim.period,
          sources: resolveSourceLinks(claim.id, claim.sourceIds, data.sources),
        })),
        coverage: row.cells[0]!.researchCoverage && {
          id: row.cells[0]!.researchCoverage.id,
          status: row.cells[0]!.researchCoverage.status,
          sources: row.cells[0]!.researchCoverage.sourceIds.length > 0
            ? resolveSourceLinks(row.cells[0]!.researchCoverage.id, row.cells[0]!.researchCoverage.sourceIds, data.sources)
            : [],
        },
      })),
    })),
  };
}

export type ComparisonPayload = ReturnType<typeof createComparisonPayload>;
