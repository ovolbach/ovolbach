import { describe, expect, it } from 'vitest';
import { listPublishedElectionContexts, loadElectionContext } from '../../src/lib/load-guide-data';
import { assembleRegionalContext, candidateProfilePath, publishedProfileRoutes, regionalContexts } from '../../src/lib/regional-context';
import { getRegionalChairBallot } from '../../src/lib/selectors';

const zilina = (await listPublishedElectionContexts()).filter((row) => row.regionSlug === 'zilinsky-kraj' && row.year === 2026);
const presov = await Promise.all(['poprad', 'presov'].map(async (citySlug) => ({
  ...await loadElectionContext({ citySlug, year: 2026 }), status: 'published' as const,
})));

describe('independent regional cycles', () => {
  it('keeps both chair ballots and their profile identities isolated', () => {
    const regions = regionalContexts([...zilina, ...presov]);
    expect(regions).toHaveLength(2);
    const psk = regions.find((row) => row.regionSlug === 'presovsky-kraj')!;
    expect(getRegionalChairBallot(psk.data).candidates.map((row) => row.candidacy.ballotNumber))
      .toEqual(Array.from({ length: 11 }, (_, i) => i + 1));
    expect(psk.data.candidates.every((row) => row.id.startsWith('psk-'))).toBe(true);
    expect(psk.citySlugs).toEqual(['poprad', 'presov']);
    for (const city of presov) {
      expect(candidateProfilePath(city, 'psk-milan-majersky')).toBe('/presovsky-kraj/2026/kandidat/milan-majersky/');
      expect(() => candidateProfilePath(city, 'candidate-85')).toThrow('Unknown candidate');
    }
    expect(() => assembleRegionalContext([...zilina, ...presov])).toThrow('different election cycles');
  });
  it('keeps all 460 old routes and publishes each new person once across the two city contexts', () => {
    const old = publishedProfileRoutes(zilina);
    const routes = publishedProfileRoutes([...zilina, ...presov]);
    expect(old).toHaveLength(460);
    expect(routes.filter((row) => !row.candidateId.startsWith('psk-'))).toEqual(old);
    expect(routes.filter((row) => row.candidateId.startsWith('psk-'))).toHaveLength(320);
    expect(new Set(routes.map((row) => row.path)).size).toBe(780);
  });
  it('retains the complete regional districts, including candidates outside the cities', () => {
    for (const [index, number, count] of [[0, 6, 49], [1, 7, 114]] as const) {
      const city = presov[index]!;
      expect(city.data.candidacies.filter((row) => row.electionId === 'region-council')).toHaveLength(count);
      expect(city.data.candidacies.filter((row) => row.electionId === 'region-council')
        .every((row) => row.districtId === `2026-psk-region-${number}`)).toBe(true);
    }
    expect(presov[0]!.data.candidates.some((row) => row.id === 'psk-gabriel-bodnar')).toBe(true);
    expect(presov[1]!.data.candidates.some((row) => row.id === 'psk-jan-pavuk-59')).toBe(true);
    expect(presov[1]!.data.candidates.some((row) => row.id === 'psk-jan-pavuk-69')).toBe(true);
  });
});
