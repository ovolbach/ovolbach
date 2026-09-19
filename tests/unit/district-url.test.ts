import { describe, expect, it } from 'vitest';
import districts from '../../src/data/elections/2026/zilinsky-kraj/districts.json';
import { getCityDistrictUrlMappings, getInternalDistrictIdForPublicId } from '../../src/lib/district-url';

describe('city district URL mapping', () => {
  it('maps all eight canonical city district numbers to public URL values', () => {
    const mappings = getCityDistrictUrlMappings(districts);

    expect(mappings).toEqual([
      { publicId: 'district-1', internalId: '2026-lm-city-1', number: 1 },
      { publicId: 'district-2', internalId: '2026-lm-city-2', number: 2 },
      { publicId: 'district-3', internalId: '2026-lm-city-3', number: 3 },
      { publicId: 'district-4', internalId: '2026-lm-city-4', number: 4 },
      { publicId: 'district-5', internalId: '2026-lm-city-5', number: 5 },
      { publicId: 'district-6', internalId: '2026-lm-city-6', number: 6 },
      { publicId: 'district-7', internalId: '2026-lm-city-7', number: 7 },
      { publicId: 'district-8', internalId: '2026-lm-city-8', number: 8 },
    ]);
  });

  it('rejects unknown public IDs and duplicate city district numbers', () => {
    const mappings = getCityDistrictUrlMappings(districts);
    expect(getInternalDistrictIdForPublicId(mappings, 'district-99')).toBeUndefined();
    expect(() => getCityDistrictUrlMappings([...districts, { ...districts[0]!, id: 'city-duplicate' }]))
      .toThrow('Duplicate city district number: 1');
  });

  it('maps a future city year with eleven districts without a fixed maximum', () => {
    const extended = [
      ...districts,
      ...[9, 10, 11].map((number) => ({ ...districts[0]!, id: `2027-city-${number}`, number })),
    ];
    const mappings = getCityDistrictUrlMappings(extended);
    expect(mappings).toHaveLength(11);
    expect(mappings[10]).toEqual({ publicId: 'district-11', internalId: '2027-city-11', number: 11 });
  });

  it.each([Number.NaN, Infinity, 0, -1, 1.5])('rejects noncanonical city district number %s', (number) => {
    const invalidDistricts = districts.map((district, index) => index === 0 ? { ...district, number } : district);

    expect(() => getCityDistrictUrlMappings(invalidDistricts)).toThrow(`Invalid city district number: ${number}`);
  });
});
