import { describe, expect, it } from 'vitest';
import * as catalogue from '../../src/lib/regional-context';
import type { ElectionContext } from '../../src/lib/load-guide-data';

const context = (regionSlug: string, regionName: string, citySlug: string, cityName: string, year = 2026, status: 'draft' | 'published' = 'published') => ({
  regionSlug, regionName, citySlug, cityName, year, status, basePath: `/${citySlug}/${year}/`,
}) as ElectionContext;

describe('city catalogue grouped under region and year', () => {
  it('keeps cities in their own region/year and hides drafts while sorting Slovak names', () => {
    const groups = (catalogue as unknown as { groupCityCatalogue?: (rows: ElectionContext[]) => Array<{ regionSlug: string; year: number; basePath: string; cities: ElectionContext[] }> }).groupCityCatalogue?.([
      context('zilinsky-kraj', 'Žilinský samosprávny kraj', 'zilina', 'Žilina'),
      context('presovsky-kraj', 'Prešovský samosprávny kraj', 'presov', 'Prešov'),
      context('presovsky-kraj', 'Prešovský samosprávny kraj', 'poprad', 'Poprad'),
      context('zilinsky-kraj', 'Žilinský samosprávny kraj', 'dolny-kubin', 'Dolný Kubín'),
      context('presovsky-kraj', 'Prešovský samosprávny kraj', 'presov', 'Prešov', 2022),
      context('presovsky-kraj', 'Prešovský samosprávny kraj', 'bardejov', 'Bardejov', 2026, 'draft'),
    ]);
    expect(groups?.map(({ regionSlug, year, basePath, cities }) => ({ regionSlug, year, basePath, cities: cities.map((row) => row.citySlug) }))).toEqual([
      { regionSlug: 'presovsky-kraj', year: 2026, basePath: '/presovsky-kraj/2026/', cities: ['poprad', 'presov'] },
      { regionSlug: 'presovsky-kraj', year: 2022, basePath: '/presovsky-kraj/2022/', cities: ['presov'] },
      { regionSlug: 'zilinsky-kraj', year: 2026, basePath: '/zilinsky-kraj/2026/', cities: ['dolny-kubin', 'zilina'] },
    ]);
  });
});
