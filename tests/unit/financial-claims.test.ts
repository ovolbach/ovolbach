import { describe, expect, it } from 'vitest';
import { loadGuideData } from '../../src/lib/load-guide-data';

const data = await loadGuideData();
const sourcesById = new Map(data.sources.map((source) => [source.id, source]));
const claimsById = new Map(data.claims.map((claim) => [claim.id, claim]));

const financialCategories = new Set(['employment_business', 'asset_declarations']);
const registryUrl = /(?:orsr\.sk|zrsr\.sk|rpvs\.gov\.sk|registeruz\.sk|obchodnyvestnik\.justice\.gov\.sk)/i;

type RegistryClaim = Pick<(typeof data.claims)[number], 'id' | 'category' | 'text' | 'sourceIds'>;
type RegistrySource = Pick<(typeof data.sources)[number], 'id' | 'url'>;

function registryClaimsMissingIco(claims: readonly RegistryClaim[], sources: readonly RegistrySource[]) {
  const sourceUrlsById = new Map(sources.map((source) => [source.id, source.url]));

  return claims
    .filter((claim) => claim.category === 'employment_business')
    .filter((claim) => claim.sourceIds.some((id) => registryUrl.test(sourceUrlsById.get(id) ?? '')))
    .filter((claim) => !/IČO\s+\d{8}/u.test(claim.text.sk))
    .map((claim) => claim.id);
}

describe('financial and business evidence', () => {
  it('requires a period and official source for every declaration', () => {
    const declarations = data.claims.filter((claim) => claim.kind === 'declaration');

    expect(declarations.filter((claim) => !claim.period).map((claim) => claim.id)).toEqual([]);
    expect(declarations.filter((claim) =>
      !claim.sourceIds.some((id) => sourcesById.get(id)?.type === 'official'))
      .map((claim) => claim.id)).toEqual([]);
  });

  it('dates every employment or business claim', () => {
    const undated = data.claims
      .filter((claim) => claim.category === 'employment_business' && !claim.period)
      .map((claim) => claim.id);

    expect(undated).toEqual([]);
  });

  it('identifies entities in claims based on business registers', () => {
    expect(registryClaimsMissingIco(data.claims, data.sources)).toEqual([]);
  });

  it('treats ZRSR as registry evidence in the entity-identifier audit', () => {
    const fixtureClaims: RegistryClaim[] = [{
      id: 'fixture-zrsr-missing-ico',
      category: 'employment_business',
      text: { sk: 'Živnostenský register uvádza podnikateľa bez identifikátora.' },
      sourceIds: ['fixture-zrsr'],
    }];
    const fixtureSources: RegistrySource[] = [{
      id: 'fixture-zrsr',
      url: 'https://www.zrsr.sk/zr_vypis.aspx?ID=1',
    }];

    expect(registryClaimsMissingIco(fixtureClaims, fixtureSources))
      .toEqual(['fixture-zrsr-missing-ico']);
  });

  it('keeps the verified SRZ committee member attached to Ladislav Pardel', () => {
    expect(claimsById.get('claim-pardel-srz-control-committee')?.text.sk)
      .toContain('Ladislava Pardela');
    expect(claimsById.get('claim-pardel-srz-control-committee')?.text.sk)
      .not.toContain('Jozefa Pardela');
  });

  it('does not turn the Koli register publication date into a role end date', () => {
    expect(claimsById.get('claim-candidate-55-koli-role-2020')?.period)
      .toBe('od 2016-09-20; záznam 2020-06-12');
  });

  it('describes the GYNEBO source as a new registration', () => {
    expect(sourcesById.get('ov-boda-gynebo-2025')?.title)
      .toBe('GYNEBO s. r. o. – nový zápis');
  });

  it('keeps company finances distinct from personal income', () => {
    const inference = data.claims
      .filter((claim) => financialCategories.has(claim.category))
      .filter((claim) => {
        const withoutExplicitDenials = claim.text.sk.replace(
          /(?:nie údaj o|sa nevykladajú ako|neuvádza|nepreukazuje|nedokladá)[^.;]{0,80}(?:osobný príjem|príjem kandidát(?:a|ky))/giu,
          '',
        );

        return /(?:osobný príjem|príjem kandidát(?:a|ky)|zarobil[ai]?|čistá hodnota|hodnota jeho majetku|hodnota jej majetku)/iu.test(withoutExplicitDenials);
      })
      .map((claim) => claim.id);

    expect(inference).toEqual([]);
  });

  it('keeps both audited coverage categories closed for every candidate', () => {
    for (const candidate of data.candidates) {
      for (const category of financialCategories) {
        const rows = data.researchCoverage.filter((row) =>
          row.candidateId === candidate.id && row.category === category);
        expect(rows, `${candidate.id}:${category}`).toHaveLength(1);
        expect(rows[0]?.status, `${candidate.id}:${category}`).not.toBe('pending');
      }
    }
  });
});
