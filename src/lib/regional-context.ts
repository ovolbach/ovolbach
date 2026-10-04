import { listPublishedElectionContexts, type ElectionContext } from './load-guide-data';
import type { GuideData } from './schemas';

export interface RegionalElectionContext {
  kind: 'regional';
  regionSlug: string;
  regionName: string;
  year: number;
  snapshotDate: string;
  basePath: string;
  citySlugs: string[];
  data: GuideData;
}

export type ProfilePageContext = ElectionContext | RegionalElectionContext;

export function isRegionalContext(context: ProfilePageContext): context is RegionalElectionContext {
  return 'kind' in context && context.kind === 'regional';
}

export function assembleRegionalContext(contexts: ElectionContext[]): RegionalElectionContext {
  const published = contexts.filter((context) => context.status === 'published');
  const first = published[0];
  if (!first) throw new Error('Regional context needs a published municipality');
  if (published.some((context) => context.year !== first.year || context.regionSlug !== first.regionSlug)) {
    throw new Error('Regional context cannot combine different election cycles');
  }
  const merged = {} as GuideData;
  for (const key of Object.keys(first.data) as Array<keyof GuideData>) {
    const rows = new Map<string, GuideData[typeof key][number]>();
    for (const context of published) for (const row of context.data[key]) {
      const id = 'contestId' in row && key === 'elections' ? row.contestId : row.id;
      const previous = rows.get(id);
      if (previous && JSON.stringify(previous) !== JSON.stringify(row)) throw new Error(`Conflicting ${key} record: ${id}`);
      rows.set(id, row);
    }
    (merged as Record<keyof GuideData, unknown[]>)[key] = [...rows.values()];
  }
  const candidateIds = new Set(merged.candidacies.filter((row) => row.electionId === 'region-chair').map((row) => row.candidateId));
  const candidacies = merged.candidacies.filter((row) => candidateIds.has(row.candidateId));
  const contestIds = new Set(candidacies.map((row) => row.contestId));
  const districtIds = new Set(candidacies.flatMap((row) => row.districtId ? [row.districtId] : []));
  const campaignFinance = merged.campaignFinance.filter((row) => candidateIds.has(row.candidateId));
  const partyIds = new Set(campaignFinance.flatMap((row) => row.partyIds));
  const snapshotDate = published.map((context) => context.snapshotDate).sort().at(-1)!;
  const financeParties = merged.financeParties.filter((row) => partyIds.has(row.id));
  for (const row of [...campaignFinance, ...financeParties]) {
    if (row.checkedAt > snapshotDate) throw new Error(`Finance verification exceeds snapshot: ${row.id}`);
  }
  return {
    kind: 'regional', regionSlug: first.regionSlug, regionName: first.regionName, year: first.year,
    snapshotDate, basePath: `/${first.regionSlug}/${first.year}/`,
    citySlugs: [...new Set(published.map((context) => context.citySlug))].sort(),
    data: {
      candidates: merged.candidates.filter((row) => candidateIds.has(row.id)), candidacies,
      claims: merged.claims.filter((row) => candidateIds.has(row.candidateId)),
      researchCoverage: merged.researchCoverage.filter((row) => candidateIds.has(row.candidateId)),
      campaignFinance, financeParties, sources: merged.sources,
      elections: merged.elections.filter((row) => contestIds.has(row.contestId)),
      districts: merged.districts.filter((row) => districtIds.has(row.id)),
    },
  };
}

export function regionalContexts(contexts: ElectionContext[]): RegionalElectionContext[] {
  const groups = new Map<string, ElectionContext[]>();
  for (const context of contexts.filter((row) => row.status === 'published')) {
    const key = `${context.regionSlug}/${context.year}`;
    const group = groups.get(key) ?? [];
    group.push(context);
    groups.set(key, group);
  }
  return [...groups.values()].map(assembleRegionalContext);
}

export async function listPublishedRegionalContexts(): Promise<RegionalElectionContext[]> {
  return regionalContexts(await listPublishedElectionContexts());
}

export function candidateProfilePath(context: ProfilePageContext, candidateId: string): string {
  const candidate = context.data.candidates.find((row) => row.id === candidateId);
  if (!candidate) throw new Error(`Unknown candidate: ${candidateId}`);
  const regional = context.data.candidacies.some((row) => row.candidateId === candidateId && row.electionId === 'region-chair');
  const base = regional ? `/${context.regionSlug}/${context.year}/` : context.basePath;
  return `${base}kandidat/${candidate.slug}/`;
}

export function publishedProfileRoutes(contexts: ElectionContext[]) {
  const regions = regionalContexts(contexts);
  const result = contexts.filter((context) => context.status === 'published').flatMap((context) => context.data.candidates
    .filter((candidate) => candidateProfilePath(context, candidate.id).startsWith(context.basePath))
    .map((candidate) => ({ context: context as ProfilePageContext, candidateId: candidate.id, slug: candidate.slug,
      path: candidateProfilePath(context, candidate.id), routeSlug: context.citySlug })));
  result.push(...regions.flatMap((context) => context.data.candidates.map((candidate) => ({
    context, candidateId: candidate.id, slug: candidate.slug,
    path: candidateProfilePath(context, candidate.id), routeSlug: context.regionSlug,
  }))));
  if (new Set(result.map((route) => route.path)).size !== result.length) throw new Error('Duplicate profile route');
  return result;
}
