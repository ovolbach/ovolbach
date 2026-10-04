import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadElectionContext } from '../../src/lib/load-guide-data';

const loadCity = () => loadElectionContext({ citySlug: 'ruzomberok', year: 2026 });

describe('Ružomberok additional media review, 3 October 2026', () => {
  it('adds the custody appeal without turning it into a verdict on guilt', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'rk-robert-dubravec-custody-appeal-2018')).toMatchObject({
      category: 'controversies', kind: 'media_report', period: '3. júla 2018',
      text: { sk: 'TASR 3. 7. 2018 informovala, že Najvyšší súd SR nevyhovel sťažnosti prokurátora proti rozhodnutiu nevziať Róberta Dúbravca do väzby.' },
      sourceIds: ['rk-dubravec-custody-appeal-2018'], checkedAt: '2026-10-03',
    });
  });

  it('preserves both the police report and Kuráň’s complaint against its conclusion', async () => {
    const { data } = await loadCity();
    for (const [id, kind] of [
      ['rk-jan-kuran-hyros-police-report-2020', 'media_report'],
      ['rk-jan-kuran-hyros-police-response-2020', 'response'],
    ] as const) {
      expect(data.claims.find((claim) => claim.id === id)).toMatchObject({
        candidateId: 'rk-jan-kuran', category: 'controversies', kind,
        sourceIds: ['rk-magazin-hyros-followup-2020'], checkedAt: '2026-10-03',
      });
    }
  });

  it('publishes the responses alongside newly added disputed reports', async () => {
    const { data } = await loadCity();
    for (const [candidateId, sourceId] of [
      ['rk-martin-alusic', 'rk-alusic-controller-dispute-2021'],
      ['candidate-87', 'stvr-choma-tolls-response-2023'],
      ['candidate-88', 'sp21-jurinova-vszp-response-2026'],
    ] as const) {
      const claims = data.claims.filter((claim) => claim.candidateId === candidateId && claim.sourceIds.includes(sourceId));
      expect(claims.some((claim) => claim.kind === 'media_report'), candidateId).toBe(true);
      expect(claims.some((claim) => claim.kind === 'response'), candidateId).toBe(true);
    }
    expect(data.claims.find((claim) => claim.id === 'claim-candidate-90-stairs-allegation-2026')?.kind).toBe('media_report');
    expect(data.claims.find((claim) => claim.id === 'claim-candidate-90-stairs-response-2026')).toMatchObject({
      kind: 'response', sourceIds: ['kanal1-lucansky-incident-response-2026'],
    });
  });

  it('keeps museum litigation stages atomic and attributed to the report', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'claim-candidate-88-museum-court-outcome-2025')?.text.sk)
      .toBe('Aktuality.sk podľa vyjadrenia hovorkyne ŽSK 26. 5. 2025 uviedli, že prvostupňový súd označil výpoveď Michala Kovačica za neplatnú.');
    for (const id of ['claim-candidate-88-museum-appeal-report-2025', 'claim-candidate-88-museum-settlement-report-2025']) {
      expect(data.claims.find((claim) => claim.id === id)?.kind, id).toBe('media_report');
    }
  });

  it('preserves the final displayed title of the council report', async () => {
    const { data } = await loadCity();
    expect(data.sources.find((source) => source.id === 'rk-council-live-report-2025-11-05')?.title)
      .toBe('Schválili rozpočet. A vyhoveli petícii. S otáznikom...');
  });

  it('keeps the construction chronology and scope of committee consultation precise', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'claim-rk-patrik-habo-cutkovska-business-report-2025')?.text.sk)
      .toBe('Postoj v reportáži opísal, ako Patrik Habo a Ľubomír Sidor budovali areál U dobrého pastiera v Čutkovskej doline.');
    expect(data.claims.find((claim) => claim.id === 'claim-rk-martin-papco-property-exchange-response-2026')?.text.sk)
      .toBe('Martin Papčo v ankete Ružomberského hlasu odôvodnil svoj hlas proti zámeru zámeny majetku tým, že návrh neprešiel riadnym pripomienkovaním komisií.');
    expect(data.sources.find((source) => source.id === 'aktuality-jurinova-kovacic-dismissal-2025')?.title)
      .toBe('Odvolaný riaditeľ Liptovského múzea vyhral spor o jeho výpovedi, dostane odškodné');
  });

  it('includes the reported rejection of the Bešeňová plant and identifies it as an agency report', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'claim-rk-martin-baran-hydro-rejection-report-2017')).toMatchObject({
      candidateId: 'rk-martin-baran', kind: 'media_report', period: 'správa 21. februára 2017',
      text: { sk: 'TASR 21. 2. 2017 informovala, že Ministerstvo životného prostredia SR zamietlo výstavbu malej vodnej elektrárne v Bešeňovej pre ochranu územia rieky Váh.' },
      sourceIds: ['rk-baran-hydro-tasr-2017'],
    });
  });

  it('records all people, original media claims, actual searches and bounded event timelines', async () => {
    const path = new URL('../../research/ruzomberok-media-review-2026.json', import.meta.url);
    expect(existsSync(path)).toBe(true);
    const audit = JSON.parse(readFileSync(path, 'utf8'));
    const { data } = await loadCity();
    expect(audit.snapshotDate).toBe('2026-10-03');
    expect(audit.candidates.map((row: { candidateId: string }) => row.candidateId).toSorted())
      .toEqual(data.candidates.map((row) => row.id).toSorted());
    expect(new Set(audit.candidates.map((row: { candidateId: string }) => row.candidateId)).size).toBe(79);
    for (const person of audit.candidates) {
      expect(person.queries.length, person.candidateId).toBeGreaterThanOrEqual(2);
      expect(person.checkedAt, person.candidateId).toBe('2026-10-03');
      expect(person.limits, person.candidateId).toBeDefined();
    }
    const reviewed = audit.candidates.flatMap((row: { existingClaimIds: string[] }) => row.existingClaimIds).toSorted();
    expect(reviewed).toEqual(audit.baselineMediaClaimIds.toSorted());
    for (const chain of audit.eventChains) {
      expect(chain.candidateIds.length).toBeGreaterThan(0);
      expect(chain.origin).toBeDefined();
      expect(chain.latest).toBeDefined();
      expect(chain.outcomeStatus).toMatch(/^(official_procedural|official_final|reported_only|unresolved|not_applicable)$/);
      expect(chain.limits.length).toBeGreaterThan(0);
    }
    const sources = new Map(data.sources.map((row) => [row.id, row]));
    for (const id of audit.addedClaimIds) {
      const claim = data.claims.find((row) => row.id === id);
      expect(claim, id).toBeDefined();
      expect(claim!.period, id).toBeTruthy();
      if (claim!.kind === 'official_outcome') {
        expect(claim!.sourceIds.some((sourceId) => sources.get(sourceId)?.type === 'official'), id).toBe(true);
      }
    }
    expect(data.sources.some((row) => row.url.includes('f3rv4093rizplfrieb3b25r5'))).toBe(false);
  });
});
