import { describe, expect, it } from 'vitest';
import { loadElectionContext } from '../../src/lib/load-guide-data';
import { pollingGroupsForContext } from '../../src/lib/polling-groups';

describe('voting-guide polling groups', () => {
  it('includes all Poprad polling stations as a sourced city-wide list', async () => {
    const context = await loadElectionContext({ citySlug: 'poprad', year: 2026 });
    const result = pollingGroupsForContext(context);
    expect(result.cityWide).toBe(true);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0]!.pollingStations).toHaveLength(44);
    expect(result.groups[0]!.sourceIds).toEqual(['pp-polling-2026']);
    expect(result.groups[0]!.name).toContain('Poprad');
    expect(result.groups[0]!.pollingStations.at(-1)!.address).toContain('Seniorpark');
  });
  it('keeps Prešov polling stations assigned to their six official districts', async () => {
    const context = await loadElectionContext({ citySlug: 'presov', year: 2026 });
    const result = pollingGroupsForContext(context);
    expect(result.cityWide).toBe(false);
    expect(result.groups).toHaveLength(6);
    expect(result.groups.flatMap((row) => row.pollingStations)).toHaveLength(66);
  });
  it('keeps Martin’s separate official city-wide list and never reuses it in another year', async () => {
    const context = await loadElectionContext({ citySlug: 'martin', year: 2026 });
    expect(pollingGroupsForContext(context).cityWide).toBe(true);
    expect(pollingGroupsForContext(context).groups[0]!.sourceIds).toEqual(['mt-city-polling-2026', 'mt-town-only-polling-2026']);
    expect(pollingGroupsForContext({ ...context, year: 2030 }).cityWide).toBe(false);
  });
});
