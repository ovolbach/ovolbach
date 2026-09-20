import { readFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { isoDate, type ElectionId, type GuideData } from './schemas';

const DATA_ROOT = resolve(process.cwd(), 'src/data');
const ELECTIONS_ROOT = join(DATA_ROOT, 'elections');
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
const regionalManifestSchema = z.object({
  regionName: z.string().min(1),
  contestIds: z.object({
    'region-chair': z.string().min(1),
    'region-council': z.string().min(1),
  }).strict(),
}).strict();
export const municipalManifestSchema = z.object({
  cityName: z.string().min(1),
  status: z.enum(['draft', 'published']),
  snapshotDate: isoDate,
  cityDistrictIds: z.array(z.string().min(1)).min(1),
  regionalDistrictId: z.string().min(1),
  contestIds: z.object({
    mayor: z.string().min(1),
    'city-council': z.string().min(1),
  }).strict(),
}).strict();

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

export async function loadGlobalSources(): Promise<GuideData['sources']> {
  return readJson<GuideData['sources']>(join(DATA_ROOT, 'sources.json'));
}

async function directoryNames(path: string): Promise<string[]> {
  return (await readdir(path, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function cyclePath(year: number, regionSlug: string): string {
  if (!Number.isInteger(year) || year < 2000 || year > 2100 || !slugSchema.safeParse(regionSlug).success) {
    throw new Error(`Invalid election cycle: ${year}/${regionSlug}`);
  }
  return join(ELECTIONS_ROOT, String(year), regionSlug);
}

export interface ElectionContextConfig {
  citySlug: string;
  cityName: string;
  year: number;
  regionSlug: string;
  regionName: string;
  status: 'draft' | 'published';
  snapshotDate: string;
  cityDistrictIds: string[];
  regionalDistrictId: string;
  contestIds: Record<ElectionId, string>;
}

export interface ElectionContext extends ElectionContextConfig {
  basePath: string;
  data: GuideData;
}

export function assertUniqueContextRoutes(configs: readonly ElectionContextConfig[]): void {
  const routes = new Set<string>();
  for (const config of configs) {
    const route = `${config.citySlug}/${config.year}`;
    if (routes.has(route)) throw new Error(`Duplicate city/year route: ${route}`);
    routes.add(route);
  }
}

export async function listElectionContextConfigs(): Promise<ElectionContextConfig[]> {
  const configs: ElectionContextConfig[] = [];
  for (const yearName of await directoryNames(ELECTIONS_ROOT)) {
    const year = Number(yearName);
    if (!/^\d{4}$/u.test(yearName) || year < 2000 || year > 2100) throw new Error(`Invalid election year directory: ${yearName}`);
    for (const regionSlug of await directoryNames(join(ELECTIONS_ROOT, yearName))) {
      cyclePath(year, regionSlug);
      const regionPath = cyclePath(year, regionSlug);
      const region = regionalManifestSchema.parse(await readJson(join(regionPath, 'regional', 'config.json')));
      for (const citySlug of await directoryNames(join(regionPath, 'municipalities'))) {
        slugSchema.parse(citySlug);
        const city = municipalManifestSchema.parse(await readJson(join(regionPath, 'municipalities', citySlug, 'config.json')));
        configs.push({
          citySlug, cityName: city.cityName, year, regionSlug, regionName: region.regionName,
          status: city.status, snapshotDate: city.snapshotDate,
          cityDistrictIds: city.cityDistrictIds, regionalDistrictId: city.regionalDistrictId,
          contestIds: { ...city.contestIds, ...region.contestIds },
        });
      }
    }
  }
  assertUniqueContextRoutes(configs);
  return configs;
}

export async function loadElectionCycle(year: number, regionSlug: string): Promise<GuideData> {
  const path = cyclePath(year, regionSlug);
  const [candidates, candidacies, claims, districts, elections, researchCoverage, sources] = await Promise.all([
    readJson<GuideData['candidates']>(join(path, 'candidates.json')),
    readJson<GuideData['candidacies']>(join(path, 'candidacies.json')),
    readJson<GuideData['claims']>(join(path, 'claims.json')),
    readJson<GuideData['districts']>(join(path, 'districts.json')),
    readJson<GuideData['elections']>(join(path, 'elections.json')),
    readJson<GuideData['researchCoverage']>(join(path, 'research-coverage.json')),
    loadGlobalSources(),
  ]);
  return { candidates, candidacies, claims, districts, elections, researchCoverage, sources };
}

export async function loadAllElectionCycles(): Promise<GuideData[]> {
  const configs = await listElectionContextConfigs();
  const unique = new Map(configs.map((config) => [`${config.year}/${config.regionSlug}`, config]));
  return Promise.all([...unique.values()].map((config) => loadElectionCycle(config.year, config.regionSlug)));
}

export function assembleElectionContext(cycle: GuideData, config: ElectionContextConfig): ElectionContext {
  const regionalDistrict = cycle.districts.find((district) => district.id === config.regionalDistrictId && district.kind === 'region');
  if (!regionalDistrict) throw new Error(`Unknown regional district: ${config.regionalDistrictId}`);
  const cityDistricts = config.cityDistrictIds.map((id) => {
    const district = cycle.districts.find((item) => item.id === id && item.kind === 'city');
    if (!district) throw new Error(`Unknown city district: ${id}`);
    return district;
  });
  if (new Set(config.cityDistrictIds).size !== cityDistricts.length) throw new Error(`Duplicate city district in ${config.citySlug}/${config.year}`);

  const elections = (Object.entries(config.contestIds) as Array<[ElectionId, string]>).map(([kind, contestId]) => {
    const matches = cycle.elections.filter((election) => election.contestId === contestId && election.id === kind);
    if (matches.length !== 1) throw new Error(`Expected exactly one ${kind} contest: ${contestId}`);
    return matches[0]!;
  });
  if (new Set(elections.map((election) => election.contestId)).size !== 4) throw new Error(`Duplicate contest in ${config.citySlug}/${config.year}`);
  for (const election of elections) {
    if (!election.electionDate.startsWith(`${config.year}-`)) {
      throw new Error(`Election date ${election.electionDate} does not match context year ${config.year}`);
    }
  }

  const cityDistrictIds = new Set(config.cityDistrictIds);
  for (const candidacy of cycle.candidacies.filter((item) => item.contestId === config.contestIds['city-council'])) {
    if (!cityDistrictIds.has(candidacy.districtId ?? '')) {
      throw new Error(`Unlisted city district in ${candidacy.contestId}: ${candidacy.districtId ?? '<missing>'}`);
    }
  }
  const candidacies = cycle.candidacies.filter((candidacy) => {
    if (candidacy.contestId !== config.contestIds[candidacy.electionId]) return false;
    if (candidacy.electionId === 'city-council') return cityDistrictIds.has(candidacy.districtId ?? '');
    if (candidacy.electionId === 'region-council') return candidacy.districtId === config.regionalDistrictId;
    return candidacy.districtId === undefined;
  });
  const candidateIds = new Set(candidacies.map((candidacy) => candidacy.candidateId));
  const candidates = cycle.candidates.filter((candidate) => candidateIds.has(candidate.id));
  if (candidates.length !== candidateIds.size) throw new Error(`Unknown candidate in ${config.citySlug}/${config.year}`);
  const claims = cycle.claims.filter((claim) => candidateIds.has(claim.candidateId));
  const researchCoverage = cycle.researchCoverage.filter((coverage) => candidateIds.has(coverage.candidateId));
  const districts = [...cityDistricts, regionalDistrict];
  const referencedSourceIds = new Set([
    ...candidates.flatMap((candidate) => [
      ...candidate.sourceIds,
      ...(candidate.images ?? []).flatMap((image) => [image.licenseSourceId, ...(image.permissionSourceId ? [image.permissionSourceId] : [])]),
    ]),
    ...candidacies.flatMap((candidacy) => candidacy.sourceIds),
    ...claims.flatMap((claim) => claim.sourceIds),
    ...researchCoverage.flatMap((coverage) => coverage.sourceIds),
    ...districts.flatMap((district) => [...district.sourceIds, ...district.pollingStations.map((station) => station.sourceId)]),
    ...elections.flatMap((election) => election.sourceIds),
  ]);
  const scopedSources = cycle.sources.filter((source) => referencedSourceIds.has(source.id));
  return {
    ...config,
    basePath: `/${config.citySlug}/${config.year}/`,
    data: { candidates, candidacies, claims, sources: scopedSources, districts, elections, researchCoverage },
  };
}

export async function loadElectionContext({ citySlug, year }: { citySlug: string; year: number }): Promise<ElectionContext> {
  const matches = (await listElectionContextConfigs()).filter((config) => config.citySlug === citySlug && config.year === year);
  if (matches.length !== 1) throw new Error(`Unknown or ambiguous election context: ${citySlug}/${year}`);
  return assembleElectionContext(await loadElectionCycle(year, matches[0]!.regionSlug), matches[0]!);
}

export async function listPublishedElectionContexts(): Promise<ElectionContext[]> {
  const published = (await listElectionContextConfigs()).filter((config) => config.status === 'published');
  return Promise.all(published.map(async (config) => assembleElectionContext(
    await loadElectionCycle(config.year, config.regionSlug), config,
  )));
}

// Transitional API for existing editorial tests; public pages use loadElectionContext.
export async function loadGuideData(): Promise<GuideData> {
  return (await loadElectionContext({ citySlug: 'liptovsky-mikulas', year: 2026 })).data;
}
