export interface CityDistrictUrlMapping {
  publicId: string;
  internalId: string;
  number: number;
}

interface DistrictRecord {
  id: string;
  kind: string;
  number: number;
}

export function getCityDistrictUrlMappings(districts: readonly DistrictRecord[]): CityDistrictUrlMapping[] {
  const cityDistricts = districts.filter((district) => district.kind === 'city');
  cityDistricts.forEach((district) => {
    if (!Number.isFinite(district.number) || !Number.isInteger(district.number) || district.number < 1 || district.number > 8) {
      throw new Error(`Invalid city district number: ${district.number}`);
    }
  });
  cityDistricts.sort((a, b) => a.number - b.number);
  const numbers = new Set<number>();

  return cityDistricts.map((district) => {
    if (numbers.has(district.number)) throw new Error(`Duplicate city district number: ${district.number}`);
    numbers.add(district.number);
    return { publicId: `district-${district.number}`, internalId: district.id, number: district.number };
  });
}

export function getInternalDistrictIdForPublicId(
  mappings: readonly CityDistrictUrlMapping[],
  publicId: string,
): string | undefined {
  return mappings.find((mapping) => mapping.publicId === publicId)?.internalId;
}
