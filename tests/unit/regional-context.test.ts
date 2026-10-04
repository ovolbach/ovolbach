import { describe, expect, it } from 'vitest';
import { listPublishedElectionContexts } from '../../src/lib/load-guide-data';
import { getOfficialCandidacies } from '../../src/lib/official-facts';
import { validateDataset } from '../../src/lib/validate-dataset';
import { assembleRegionalContext, candidateProfilePath, publishedProfileRoutes } from '../../src/lib/regional-context';

const cities = await listPublishedElectionContexts();
const region = assembleRegionalContext(cities);

describe('one regional profile per chair candidate', () => {
  it('publishes 460 unique identities and routes, including seven regional profiles', () => {
    const routes = publishedProfileRoutes(cities);
    expect(routes).toHaveLength(460);
    expect(new Set(routes.map((route) => route.candidateId)).size).toBe(460);
    expect(new Set(routes.map((route) => route.path)).size).toBe(460);
    expect(routes.filter((route) => route.path.startsWith('/zilinsky-kraj/2026/'))).toHaveLength(7);
    expect(routes.find((route) => route.candidateId === 'candidate-85')?.path)
      .toBe('/zilinsky-kraj/2026/kandidat/anna-belousovova/');
  });

  it('links every municipal occurrence of a chair candidate to the same profile', () => {
    for (const city of cities) {
      expect(candidateProfilePath(city, 'candidate-85')).toBe('/zilinsky-kraj/2026/kandidat/anna-belousovova/');
      expect(candidateProfilePath(city, 'candidate-89')).toBe('/zilinsky-kraj/2026/kandidat/martin-kapitulik/');
    }
    const martin = cities.find((city) => city.citySlug === 'martin')!;
    expect(candidateProfilePath(martin, 'mt-marek-belak')).toBe('/martin/2026/kandidat/marek-belak/');
    expect(() => candidateProfilePath(martin, 'unknown')).toThrow('Unknown candidate');
  });

  it('deduplicates published research without losing the dual and triple candidacies', () => {
    expect(region.data.candidates).toHaveLength(7);
    expect(region.data.candidacies).toHaveLength(10);
    expect(region.data.researchCoverage).toHaveLength(56);
    expect(region.snapshotDate).toBe('2026-10-04');
    expect(region.citySlugs).toEqual(['dolny-kubin', 'liptovsky-mikulas', 'martin', 'ruzomberok', 'zilina']);
    expect(validateDataset(region.data, 'release')).toEqual([]);
    expect(getOfficialCandidacies(region.data, 'candidate-89').map((row) => row.election))
      .toContain('Voľby do Mestského zastupiteľstva mesta Žilina');
    for (const collection of ['claims', 'researchCoverage', 'campaignFinance'] as const) {
      const expected = new Map(cities.flatMap<{ id: string; candidateId: string }>((city) => city.data[collection])
        .filter((row) => region.data.candidates.some((candidate) => candidate.id === row.candidateId))
        .map((row) => [row.id, row]));
      expect(new Map(region.data[collection].map((row) => [row.id, row]))).toEqual(expected);
    }
  });

  it('excludes unpublished municipal candidacies and keeps the latest published snapshot', () => {
    const altered = cities.map((city) => city.citySlug === 'zilina' ? { ...city, status: 'draft' as const } : city);
    const published = assembleRegionalContext(altered);
    expect(published.data.candidacies.some((row) => row.contestId === '2026-za-city-council')).toBe(false);
    expect(published.citySlugs).not.toContain('zilina');
    expect(() => assembleRegionalContext([])).toThrow();
    expect(() => assembleRegionalContext([cities[0]!, { ...cities[1]!, year: 2030 }])).toThrow();
    expect(assembleRegionalContext(cities.map((city, index) => index === 0 ? { ...city, snapshotDate: '2026-10-05' } : city)).snapshotDate)
      .toBe('2026-10-05');
  });

  it('rejects contradictory shared identities and finance verified after the snapshot', () => {
    const contradictory = cities.map((city, index) => index === 0 ? {
      ...city, data: { ...city.data, candidates: city.data.candidates.map((candidate) => candidate.id === 'candidate-85'
        ? { ...candidate, slug: 'different-identity' } : candidate) },
    } : city);
    expect(() => assembleRegionalContext(contradictory)).toThrow('Conflicting candidates record: candidate-85');
    const futureFinance = cities.map((city) => ({
      ...city, data: { ...city.data, campaignFinance: city.data.campaignFinance.map((record) => record.candidateId === 'candidate-85'
        ? { ...record, checkedAt: '2026-10-05' } : record) },
    }));
    expect(() => assembleRegionalContext(futureFinance)).toThrow('Finance verification exceeds snapshot');
  });
});
