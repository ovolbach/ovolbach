import type { ClaimCategory, GuideData, ResearchCoverage } from './schemas';

export const RESEARCH_CATEGORIES = [
  'basic',
  'employment_business',
  'public_office',
  'previous_elections',
  'programme_statements',
  'asset_declarations',
  'media',
  'controversies',
] as const satisfies readonly ClaimCategory[];

type CoverageStatus = ResearchCoverage['status'];

export interface ResearchFilter {
  electionId?: string;
  districtId?: string;
}

export interface CoverageTotals {
  found: number;
  searched_none: number;
  not_applicable: number;
  pending: number;
}

export interface CategoryCoverageStatus {
  category: ClaimCategory;
  status: CoverageStatus;
}

export interface CandidateCoverageReport {
  candidateId: string;
  displayName: string;
  categories: CategoryCoverageStatus[];
  totalCategories: number;
  pendingCategories: ClaimCategory[];
  totals: CoverageTotals;
  releaseReady: boolean;
}

export interface CoverageReport {
  candidates: CandidateCoverageReport[];
  totals: CoverageTotals;
  releaseReady: boolean;
}

function requiredFilterValue(value: string, name: 'election' | 'district'): string {
  if (value.trim().length === 0) {
    throw new Error(`Invalid ${name} filter: value must not be empty`);
  }
  return value;
}

function optionalFilterValue(value: string | undefined, name: 'election' | 'district'): string | undefined {
  return value === undefined ? undefined : requiredFilterValue(value, name);
}

export function parseCoverageCliFilter(args: string[]): ResearchFilter {
  const filter: ResearchFilter = {};
  let hasElectionFilter = false;
  let hasDistrictFilter = false;

  for (const argument of args) {
    if (argument.startsWith('--election=')) {
      if (hasElectionFilter) throw new Error('Election filter provided more than once');
      filter.electionId = requiredFilterValue(argument.slice('--election='.length), 'election');
      hasElectionFilter = true;
    } else if (argument.startsWith('--district=')) {
      if (hasDistrictFilter) throw new Error('District filter provided more than once');
      filter.districtId = requiredFilterValue(argument.slice('--district='.length), 'district');
      hasDistrictFilter = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return filter;
}

function emptyTotals(): CoverageTotals {
  return { found: 0, searched_none: 0, not_applicable: 0, pending: 0 };
}

function compareText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function resolveDistrictId(data: GuideData, districtFilter: string): string {
  const cityMatch = /^district-(\d+)$/.exec(districtFilter);
  const regionMatch = /^region-district-(\d+)$/.exec(districtFilter);

  if (!cityMatch && !regionMatch) {
    throw new Error(`Unsupported district filter: ${districtFilter}. Use district-N or region-district-N.`);
  }

  const number = Number((cityMatch ?? regionMatch)![1]);
  const kind = cityMatch ? 'city' : 'region';
  const matches = data.districts.filter((district) => district.kind === kind && district.number === number);

  if (matches.length === 0) {
    throw new Error(`Unknown ${kind === 'city' ? 'city' : 'region'} district filter: ${districtFilter}`);
  }
  if (matches.length > 1) {
    throw new Error(`Ambiguous ${kind === 'city' ? 'city' : 'region'} district filter: ${districtFilter}`);
  }

  return matches[0]!.id;
}

function validateElectionFilter(data: GuideData, electionId: string): void {
  if (!data.elections.some((election) => election.id === electionId)) {
    throw new Error(`Unknown election filter: ${electionId}`);
  }
}

function candidateCategories(candidateId: string, coverage: ResearchCoverage[]): CategoryCoverageStatus[] {
  return RESEARCH_CATEGORIES.map((category) => {
    const matches = coverage.filter((record) => record.candidateId === candidateId && record.category === category);
    if (matches.length > 1) {
      throw new Error(`Duplicate coverage records for candidate ${candidateId}, category ${category}`);
    }
    return { category, status: matches[0]?.status ?? 'pending' };
  });
}

function totalsFor(categories: CategoryCoverageStatus[]): CoverageTotals {
  return categories.reduce<CoverageTotals>((totals, category) => {
    totals[category.status] += 1;
    return totals;
  }, emptyTotals());
}

export function buildCoverageReport(data: GuideData, filter: ResearchFilter = {}): CoverageReport {
  const electionId = optionalFilterValue(filter.electionId, 'election');
  const districtFilter = optionalFilterValue(filter.districtId, 'district');
  if (electionId) validateElectionFilter(data, electionId);
  const districtId = districtFilter ? resolveDistrictId(data, districtFilter) : undefined;

  const matchingCandidacies = data.candidacies.filter((candidacy) => (
    (!electionId || candidacy.electionId === electionId)
    && (!districtId || candidacy.districtId === districtId)
  ));

  if ((electionId || districtFilter) && matchingCandidacies.length === 0) {
    throw new Error(`No candidates match filters: election=${electionId ?? '*'}, district=${districtFilter ?? '*'}`);
  }

  const candidateIds = new Set(matchingCandidacies.map((candidacy) => candidacy.candidateId));
  const candidates = data.candidates
    .filter((candidate) => candidateIds.has(candidate.id))
    .sort((left, right) => (
      compareText(left.familyName, right.familyName)
      || compareText(left.givenName, right.givenName)
      || compareText(left.id, right.id)
    ))
    .map((candidate) => {
      const categories = candidateCategories(candidate.id, data.researchCoverage);
      const totals = totalsFor(categories);
      return {
        candidateId: candidate.id,
        displayName: candidate.displayName,
        categories,
        totalCategories: RESEARCH_CATEGORIES.length,
        pendingCategories: categories.filter((category) => category.status === 'pending').map((category) => category.category),
        totals,
        releaseReady: totals.pending === 0,
      };
    });

  const totals = candidates.reduce<CoverageTotals>((aggregate, candidate) => ({
    found: aggregate.found + candidate.totals.found,
    searched_none: aggregate.searched_none + candidate.totals.searched_none,
    not_applicable: aggregate.not_applicable + candidate.totals.not_applicable,
    pending: aggregate.pending + candidate.totals.pending,
  }), emptyTotals());

  return { candidates, totals, releaseReady: totals.pending === 0 };
}
