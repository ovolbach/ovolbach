import martinStations from '../data/elections/2026/zilinsky-kraj/municipalities/martin/polling-stations.json';
import popradStations from '../data/elections/2026/presovsky-kraj/municipalities/poprad/polling-stations.json';
import type { ElectionContext } from './load-guide-data';
import type { District } from './schemas';

interface PollingGroup {
  id: string;
  anchor: string;
  name: string;
  pollingStations: District['pollingStations'];
  sourceIds: string[];
}

export function pollingGroupsForContext(context: ElectionContext): { cityWide: boolean; groups: PollingGroup[] } {
  const cityWide = context.year === 2026 && (
    (context.citySlug === 'martin' && context.regionSlug === 'zilinsky-kraj')
    || (context.citySlug === 'poprad' && context.regionSlug === 'presovsky-kraj')
  );
  if (cityWide) {
    const martin = context.citySlug === 'martin';
    return { cityWide, groups: [{
      id: `${context.citySlug}-${context.year}-polling`, anchor: `miestnosti-${context.citySlug}-${context.year}`,
      name: `Volebné okrsky v meste ${context.cityName}`,
      pollingStations: martin ? martinStations : popradStations,
      sourceIds: martin ? ['mt-city-polling-2026', 'mt-town-only-polling-2026'] : ['pp-polling-2026'],
    }] };
  }
  return { cityWide, groups: context.data.districts.filter((district) => district.kind === 'city')
    .toSorted((a, b) => a.number - b.number)
    .map((district) => ({ ...district, anchor: `miestnosti-obvod-${district.number}` })) };
}
