import { describe, expect, it } from 'vitest';
import districts from '../../src/data/districts.json';
import { getCityDistrictUrlMappings, getInternalDistrictIdForPublicId } from '../../src/lib/district-url';

describe('city district URL mapping', () => {
  it('maps all eight canonical city district numbers to public URL values', () => {
    const mappings = getCityDistrictUrlMappings(districts);

    expect(mappings).toEqual([
      { publicId: 'district-1', internalId: 'city-1', number: 1 },
      { publicId: 'district-2', internalId: 'city-2', number: 2 },
      { publicId: 'district-3', internalId: 'city-3', number: 3 },
      { publicId: 'district-4', internalId: 'city-4', number: 4 },
      { publicId: 'district-5', internalId: 'city-5', number: 5 },
      { publicId: 'district-6', internalId: 'city-6', number: 6 },
      { publicId: 'district-7', internalId: 'city-7', number: 7 },
      { publicId: 'district-8', internalId: 'city-8', number: 8 },
    ]);
  });

  it('rejects unknown public IDs and duplicate city district numbers', () => {
    const mappings = getCityDistrictUrlMappings(districts);
    expect(getInternalDistrictIdForPublicId(mappings, 'district-99')).toBeUndefined();
    expect(() => getCityDistrictUrlMappings([...districts, { ...districts[0]!, id: 'city-duplicate' }]))
      .toThrow('Duplicate city district number: 1');
  });

  it.each([Number.NaN, Infinity, 0, -1, 1.5, 9])('rejects noncanonical city district number %s', (number) => {
    const invalidDistricts = districts.map((district, index) => index === 0 ? { ...district, number } : district);

    expect(() => getCityDistrictUrlMappings(invalidDistricts)).toThrow(`Invalid city district number: ${number}`);
  });
});
