import { describe, expect, it } from 'vitest';
import * as dataLoader from '../../src/lib/load-guide-data';
import type { GuideData } from '../../src/lib/schemas';
import { getBallotSelectionLimit, getBallotsForDistrict } from '../../src/lib/selectors';
import { baseCandidate, baseCandidacy, baseClaim, baseElection, baseSource, makeGuideData } from '../fixtures/guide-data';

const assembly = (dataLoader as unknown as {
  assembleElectionContext?: (cycle: GuideData, config: unknown) => {
    basePath: string;
    data: GuideData;
    regionalDistrictId: string;
  };
}).assembleElectionContext;

const candidate = (id: string) => ({ ...baseCandidate, id, slug: id, displayName: id });
const contest = (id: string, kind: typeof baseElection.id, level: 'city' | 'region') => ({
  ...baseElection, id: kind, contestId: id, level,
});
const candidacy = (id: string, candidateId: string, contestId: string, electionId: typeof baseElection.id, districtId?: string) => ({
  ...baseCandidacy, id, candidateId, contestId, electionId, ...(districtId ? { districtId } : {}),
});
const district = (id: string, kind: 'city' | 'region', number: number, seats: number) => ({
  id, kind, number, seats, name: id, areas: [], pollingStations: [], sourceIds: [baseSource.id],
});

const cycle = makeGuideData({
  candidates: ['lm', 'rk', 'chair', 'zsk5', 'zsk8'].map(candidate),
  candidacies: [
    candidacy('lm-mayor', 'lm', '2026-lm-mayor', 'mayor'),
    candidacy('lm-council', 'lm', '2026-lm-council', 'city-council', '2026-lm-city-1'),
    candidacy('rk-mayor', 'rk', '2026-rk-mayor', 'mayor'),
    candidacy('rk-council', 'rk', '2026-rk-council', 'city-council', '2026-rk-city-5'),
    candidacy('region-chair', 'chair', '2026-zsk-chair', 'region-chair'),
    candidacy('region-5', 'zsk5', '2026-zsk-council', 'region-council', '2026-zsk-region-5'),
    candidacy('region-8', 'zsk8', '2026-zsk-council', 'region-council', '2026-zsk-region-8'),
  ],
  claims: [{ ...baseClaim, candidateId: 'lm' }, { ...baseClaim, id: 'rk-claim', candidateId: 'rk' }],
  districts: [
    district('2026-lm-city-1', 'city', 1, 4),
    ...[1, 2, 3, 4, 5].map((number) => district(`2026-rk-city-${number}`, 'city', number, number === 5 ? 12 : 1)),
    district('2026-zsk-region-5', 'region', 5, 6),
    district('2026-zsk-region-8', 'region', 8, 5),
  ],
  elections: [
    contest('2026-lm-mayor', 'mayor', 'city'), { ...contest('2026-lm-council', 'city-council', 'city'), maxSelections: 'district_seats' as const },
    contest('2026-rk-mayor', 'mayor', 'city'), { ...contest('2026-rk-council', 'city-council', 'city'), maxSelections: 'district_seats' as const },
    contest('2026-zsk-chair', 'region-chair', 'region'), { ...contest('2026-zsk-council', 'region-council', 'region'), maxSelections: 'district_seats' as const },
  ],
});

const config: dataLoader.ElectionContextConfig = {
  citySlug: 'ruzomberok', cityName: 'Ružomberok', year: 2026,
  regionSlug: 'zilinsky-kraj', regionName: 'Žilinský samosprávny kraj',
  status: 'draft', snapshotDate: '2026-09-18',
  cityDistrictIds: [1, 2, 3, 4, 5].map((number) => `2026-rk-city-${number}`),
  regionalDistrictId: '2026-zsk-region-8',
  contestIds: {
    mayor: '2026-rk-mayor', 'city-council': '2026-rk-council',
    'region-chair': '2026-zsk-chair', 'region-council': '2026-zsk-council',
  },
};

describe('election context', () => {
  it('loads the shared source register independently of one city view', async () => {
    const loader = dataLoader as unknown as { loadGlobalSources?: () => Promise<GuideData['sources']> };
    const sources = await loader.loadGlobalSources?.();
    expect(sources).toHaveLength(252);
    expect(new Set(sources?.map((source) => source.url)).size).toBe(252);
  });

  it('loads only published city/year contexts from election manifests', async () => {
    const loader = dataLoader as unknown as {
      listPublishedElectionContexts?: () => Promise<Array<{ citySlug: string; year: number; basePath: string; data: GuideData }>>;
    };
    const published = await loader.listPublishedElectionContexts?.();
    expect(published?.map((context) => context.basePath)).toEqual(['/liptovsky-mikulas/2026/']);
    expect(published?.[0]?.data.candidates).toHaveLength(91);
    expect(published?.[0]?.data.candidacies).toHaveLength(109);
    expect(published?.[0]?.data.claims).toHaveLength(602);
  });

  it('scopes Ružomberok to its five city districts and regional district 8', () => {
    const context = assembly?.(cycle, config);
    expect(context?.basePath).toBe('/ruzomberok/2026/');
    expect(context?.data.districts.filter((item) => item.kind === 'city').map((item) => item.seats)).toEqual([1, 1, 1, 1, 12]);
    expect(context?.data.districts.filter((item) => item.kind === 'region').map((item) => item.number)).toEqual([8]);
    expect(context?.data.candidates.map((item) => item.id)).toEqual(['rk', 'chair', 'zsk8']);
    expect(context?.data.candidacies.map((item) => item.id)).toEqual(['rk-mayor', 'rk-council', 'region-chair', 'region-8']);
    expect(context?.data.claims.map((item) => item.id)).toEqual(['rk-claim']);
  });

  it('derives both council ballot limits from their own districts in Ružomberok', () => {
    const context = assembly?.(cycle, config);
    expect(context).toBeDefined();
    const ballots = getBallotsForDistrict(context!.data, '2026-rk-city-5', context!.regionalDistrictId);
    expect(getBallotSelectionLimit(ballots[1]!)).toBe(12);
    expect(getBallotSelectionLimit(ballots[3]!)).toBe(5);
  });

  it('rejects two regions claiming the same city and year URL', () => {
    expect(() => dataLoader.assertUniqueContextRoutes([
      config,
      { ...config, regionSlug: 'another-region' },
    ])).toThrow('Duplicate city/year route: ruzomberok/2026');
  });

  it('rejects copied contests whose election dates belong to an older year', () => {
    expect(() => assembly?.(cycle, { ...config, year: 2030 }))
      .toThrow('Election date 2026-10-24 does not match context year 2030');
  });

  it('rejects impossible snapshot calendar dates in municipal config', () => {
    const manifest = {
      cityName: config.cityName, status: config.status, snapshotDate: '2030-99-99',
      cityDistrictIds: config.cityDistrictIds, regionalDistrictId: config.regionalDistrictId,
      contestIds: { mayor: config.contestIds.mayor, 'city-council': config.contestIds['city-council'] },
    };
    expect(dataLoader.municipalManifestSchema.safeParse(manifest).success).toBe(false);
  });

  it('shares the regional chair without adding another city or district council roster', () => {
    const lm = assembly?.(cycle, {
      ...config, citySlug: 'liptovsky-mikulas', cityName: 'Liptovský Mikuláš',
      cityDistrictIds: ['2026-lm-city-1'], regionalDistrictId: '2026-zsk-region-5',
      contestIds: { ...config.contestIds, mayor: '2026-lm-mayor', 'city-council': '2026-lm-council' },
    });
    expect(lm?.data.candidates.map((item) => item.id)).toEqual(['lm', 'chair', 'zsk5']);
    expect(lm?.data.candidacies.filter((item) => item.electionId === 'region-chair')).toHaveLength(1);
    expect(lm?.data.candidacies.some((item) => item.id === 'region-8')).toBe(false);
  });

  it('rejects a missing assigned regional district instead of falling back to another one', () => {
    expect(() => assembly?.(cycle, { ...config, regionalDistrictId: 'unknown' }))
      .toThrow('Unknown regional district: unknown');
  });

  it('rejects an omitted city district with registered council candidates', () => {
    expect(() => assembly?.(cycle, { ...config, cityDistrictIds: config.cityDistrictIds.slice(0, 4) }))
      .toThrow('Unlisted city district in 2026-rk-council: 2026-rk-city-5');
  });

  it('keeps the 2026 context intact when a later year changes district boundaries', () => {
    const archive = assembly?.(cycle, config);
    const futureCycle = makeGuideData({
      ...cycle,
      districts: [district('2027-rk-city-1', 'city', 1, 6), district('2027-rk-city-2', 'city', 2, 10), district('2027-zsk-region-8', 'region', 8, 5)],
      elections: cycle.elections.filter((item) => ['2026-rk-mayor', '2026-rk-council', '2026-zsk-chair', '2026-zsk-council'].includes(item.contestId))
        .map((item) => ({ ...item, contestId: item.contestId.replace('2026-', '2027-'), electionDate: '2027-10-24' })),
      candidacies: cycle.candidacies.filter((item) => ['rk-mayor', 'rk-council', 'region-chair', 'region-8'].includes(item.id))
        .map((item) => ({ ...item, contestId: item.contestId.replace('2026-', '2027-'),
          ...(item.districtId ? { districtId: item.districtId === '2026-rk-city-5' ? '2027-rk-city-2' : '2027-zsk-region-8' } : {}),
        })),
    });
    const future = assembly?.(futureCycle, {
      ...config, year: 2027, snapshotDate: '2027-09-18', cityDistrictIds: ['2027-rk-city-1', '2027-rk-city-2'],
      regionalDistrictId: '2027-zsk-region-8',
      contestIds: Object.fromEntries(Object.entries(config.contestIds).map(([kind, id]) => [kind, id.replace('2026-', '2027-')])),
    });
    expect(future?.data.districts.filter((item) => item.kind === 'city').map((item) => item.seats)).toEqual([6, 10]);
    expect(archive?.data.districts.filter((item) => item.kind === 'city').map((item) => item.seats)).toEqual([1, 1, 1, 1, 12]);
  });
});
