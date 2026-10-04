import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadElectionContext, loadGlobalSources } from '../../src/lib/load-guide-data';
import { createComparisonPayload } from '../../src/lib/comparison-payload';

const loadCity = () => loadElectionContext({ citySlug: 'martin', year: 2026 });

describe('Martin additional media review, 3 October 2026', () => {
  it('does not label another person’s response as the candidate’s own statement', async () => {
    const { data } = await loadCity();
    const payload = createComparisonPayload(data);
    const response = payload.candidates.find((row) => row.candidate.id === 'candidate-89')?.rows
      .flatMap((row) => row.claims).find((claim) => claim.id === 'claim-candidate-89-fiabane-dismissal-response-2025');
    expect(response?.kindLabel).toBe('Reakcia');
  });
  it('separates the reported first-instance museum judgment from appeal and settlement', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'claim-candidate-88-museum-court-outcome-2025')?.text.sk)
      .toBe('Aktuality.sk podľa vyjadrenia hovorkyne ŽSK 26. 5. 2025 uviedli, že prvostupňový súd označil výpoveď Michala Kovačica za neplatnú.');
    for (const id of ['claim-candidate-88-museum-appeal-report-2025', 'claim-candidate-88-museum-settlement-report-2025']) {
      expect(data.claims.find((claim) => claim.id === id)).toMatchObject({
        candidateId: 'candidate-88', kind: 'media_report', category: 'controversies',
        sourceIds: ['aktuality-jurinova-kovacic-dismissal-2025'], checkedAt: '2026-10-03',
      });
    }
  });

  it('includes Chlustinová’s reopened media mention with the exact editorial byline', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'claim-candidate-86-media-teaching-profile-2026')).toMatchObject({
      candidateId: 'candidate-86', category: 'media', kind: 'media_report',
      text: { sk: 'Noviny.sk 29. 9. 2026 uviedlo, že Jana Chlustinová v minulosti pôsobila ako učiteľka na základných školách na Orave.' },
      sourceIds: ['noviny-chairs-profile-2026'], checkedAt: '2026-10-03',
    });
    expect(data.sources.find((source) => source.id === 'noviny-chairs-profile-2026'))
      .toMatchObject({ author: 'redakcia/NIT', publishedAt: '2026-09-29', type: 'media' });
    expect(data.researchCoverage.find((row) => row.candidateId === 'candidate-86' && row.category === 'media'))
      .toMatchObject({ status: 'found', sourceIds: ['noviny-chairs-profile-2026'] });
  });

  it('includes the later authored Belousovová response without presenting its allegations as findings', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'mt-mr-belousovova-rizman-followup-2026')).toMatchObject({
      candidateId: 'candidate-85', category: 'controversies', kind: 'response',
      text: { sk: 'Anna Belousovová v autorskom stanovisku zverejnenom v Hlavných správach 30. 1. 2026 odmietla ospravedlnenie Jurajovi Rizmanovi aj odstránenie jeho fotografie z predchádzajúceho článku.' },
      sourceIds: ['mt-mr-belousovova-rizman-followup-source-2026'], checkedAt: '2026-10-03', period: '2026-01-30',
    });
    expect(data.sources.find((source) => source.id === 'mt-mr-belousovova-rizman-followup-source-2026'))
      .toMatchObject({ author: 'Anna Belousovová', publishedAt: '2026-01-30' });
  });

  it('records all 124 people, actual individual searches and every original media record', async () => {
    const path = new URL('../../research/martin-media-review-2026.json', import.meta.url);
    expect(existsSync(path)).toBe(true);
    const audit = JSON.parse(readFileSync(path, 'utf8'));
    const { data } = await loadCity();
    expect(audit.snapshotDate).toBe('2026-10-03');
    expect(audit.baselineCommit).toBe('7e90ec2');
    expect(audit.candidates.map((row: { candidateId: string }) => row.candidateId).toSorted())
      .toEqual(data.candidates.map((row) => row.id).toSorted());
    expect(new Set(audit.candidates.map((row: { candidateId: string }) => row.candidateId)).size).toBe(124);
    for (const person of audit.candidates) {
      expect(person.queries.length, person.candidateId).toBeGreaterThanOrEqual(2);
      expect(person.checkedAt, person.candidateId).toBe('2026-10-03');
      expect(person.limits, person.candidateId).toBeDefined();
    }
    const reviewed = audit.candidates.flatMap((row: { existingClaimIds: string[] }) => row.existingClaimIds).toSorted();
    expect(reviewed).toEqual(audit.baselineMediaClaimIds.toSorted());
    const chained = new Set(audit.eventChains.flatMap((row: { existingClaimIds: string[] }) => row.existingClaimIds));
    for (const id of audit.baselineMediaClaimIds) expect(chained.has(id), id).toBe(true);
    for (const chain of audit.eventChains) {
      expect(chain.candidateIds.length, chain.id).toBeGreaterThan(0);
      expect(chain.origin, chain.id).toBeDefined();
      expect(chain.latest, chain.id).toBeDefined();
      expect(chain.outcomeStatus, chain.id).toMatch(/^(official_procedural|official_final|reported_only|unresolved|not_applicable)$/);
      expect(chain.limits.length, chain.id).toBeGreaterThan(0);
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
  });

  it('distinguishes accepted records from withheld proposals in every candidate receipt', async () => {
    const audit = JSON.parse(readFileSync(new URL('../../research/martin-media-review-2026.json', import.meta.url), 'utf8'));
    expect(audit.actualQueries).toHaveLength(446);
    expect(audit.method.actualExecutedQueries).toBe(446);
    expect(audit.candidates.flatMap((person: { acceptedAddedClaimIds: string[] }) => person.acceptedAddedClaimIds).toSorted())
      .toEqual(audit.addedClaimIds.toSorted());
    expect(audit.candidates.find((person: { candidateId: string }) => person.candidateId === 'mt-lubomir-vanko'))
      .toMatchObject({ acceptedAddedClaimIds: ['mt-mr-vanko-museum-report'], withheldProposedClaimIds: ['mt-mr-florian-soi-fine', 'mt-mr-vanko-soi-response'] });
    // Chronology-only originals also live in the shared register; profiles load their own referenced subset.
    const sources = new Set((await loadGlobalSources()).map((source) => source.id));
    const chained = new Set(audit.eventChains.flatMap((chain: { addedClaimIds: string[] }) => chain.addedClaimIds));
    for (const id of audit.addedClaimIds) expect(chained.has(id), id).toBe(true);
    for (const chain of audit.eventChains) {
      for (const stage of [chain.origin, ...chain.developments, chain.latest]) {
        for (const id of [...(stage.sourceIds ?? []), ...(stage.sourceId ? [stage.sourceId] : [])]) {
          expect(sources.has(id), `${chain.id}:${id}`).toBe(true);
        }
      }
    }
  });

  it('keeps reopened source headings exact while retaining their approved IDs', async () => {
    const { data } = await loadCity();
    for (const [id, title] of [
      ['aktuality-jurinova-kovacic-dismissal-2025', 'Odvolaný riaditeľ Liptovského múzea vyhral spor o jeho výpovedi, dostane odškodné'],
      ['tasr-zsk-chair-registration-2026', 'V Žilinskom kraji zaregistrovali sedem kandidátov na funkciu predsedu'],
      ['zilinskyvecernik-kapitulik-dismissal-2025', 'EXKLUZÍVNE – Kapitulík skončil ako viceprimátor: Prečo ma odvolali?'],
      ['mt-c3-panisova-sme', 'Personálne rošády v Smere sa dotkli aj Turca'],
      ['mt-c3-adamko-water-stvr', 'Matka s ťažko chorými deťmi zostala bez vody. Opravu potrubia mala zaplatiť zo svojho. Napokon sa dočkala pomoci'],
      ['mt-c3-cicmanec-bear-stvr', 'Medveď napadol staršiu ženu v centre Blatnice za bieleho dňa. Vybehol na ňu a poškrabal ju na tvári'],
    ]) expect(data.sources.find((source) => source.id === id)?.title, id).toBe(title);
  });

  it('retains later developments and labels a paid hospital statement as the candidate’s response', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'mt-mr-jurinova-hospital-followup-2026')).toMatchObject({
      candidateId: 'candidate-88', kind: 'response', period: '2026-09-09',
      text: { sk: 'Erika Jurinová v platenom rozhovore v Žilinskom večerníku 9. 9. 2026 žiadala od VšZP rovnaké a transparentné pravidlá platieb krajským nemocniciam.' },
    });
    expect(data.sources.find((source) => source.id === 'mt-mr-jurinova-paid-interview-2026')?.type).toBe('candidate');
    expect(data.claims.find((claim) => claim.id === 'mt-mr-kapitulik-digital-twin-progress-2026')).toMatchObject({
      candidateId: 'candidate-89', kind: 'media_report', period: '2026-08-13',
      text: { sk: 'Martin Kapitulík v rozhovore Jakuba Samka pre Security Magazín z 13. 8. 2026 uviedol, že integrácia mestských systémov ešte prebiehala a plne funkčné digitálne dvojča očakával ako budúci výsledok.' },
    });
  });

  it('includes the withdrawn voting proposal and bounds the petition result to its actual decision', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'mt-mr-thomka-rules-withdrawn')?.text.sk)
      .toBe('Aktuality.sk uviedli, že návrh Stanislava Thomku na spoločný čas hlasovaní bol po kritike stiahnutý.');
    expect(data.claims.find((claim) => claim.id === 'mt-mr-petras-petition-street-outcome2026')).toMatchObject({
      kind: 'official_outcome', sourceIds: ['mt-mr-petras-petition-result'],
      text: { sk: 'Mesto Martin pri vybavení petície P2/26 dospelo k záveru, že premenovanie Moskovskej ulice v tom čase nebolo v súlade s verejným záujmom.' },
    });
    expect(data.claims.find((claim) => claim.id === 'mt-mr-petras-petition-cinema-outcome2026')?.text.sk)
      .toBe('Mesto Martin vo výsledku vybavenia petície P2/26 uviedlo, že spoločnosť prevádzkujúcu Kino Moskva informovalo o doručenej petícii.');
  });

  it('withholds inaccessible SOI originals and limits SIH’s denial to the identified funds', async () => {
    const { data } = await loadCity();
    expect(data.claims.some((claim) => ['mt-mr-florian-soi-fine', 'mt-mr-vanko-soi-response'].includes(claim.id))).toBe(false);
    expect(data.sources.some((source) => source.id === 'mt-mr-florian-soi-2017')).toBe(false);
    const audit = JSON.parse(readFileSync(new URL('../../research/martin-media-review-2026.json', import.meta.url), 'utf8'));
    expect(audit.withheldFindings).toEqual(expect.arrayContaining([
      expect.objectContaining({ sourceId: 'mt-mr-florian-soi-2017', accessStatus: 'live_404_cached_original_only' }),
    ]));
    expect(data.claims.find((claim) => claim.id === 'mt-mr-drienok-sih-response')?.text.sk)
      .toBe('Slovak Investment Holding v stanovisku doplnenom do článku Aktuality.sk z 5. júla 2023 uviedol, že o investíciách fondu nerozhoduje a nezastavil žiadnu investíciu z fondov na podporu sociálnej ekonomiky.');
  });

  it('retains the later broadcast and meeting stages and both accounts of the commission dispute', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'mt-mr-thomka-broadcast-later-2023')).toMatchObject({
      kind: 'fact', sourceIds: ['mt-mr-broadcast-report-2023'], period: '2023',
    });
    expect(data.claims.find((claim) => claim.id === 'mt-mr-uhercik-population-meeting-not-opened')).toMatchObject({
      candidateId: 'mt-michal-uhercik', kind: 'media_report', sourceIds: ['mt-mr-martin-quorum-tasr-2025'],
    });
    expect(data.claims.find((claim) => claim.id === 'mt-mr-ftorek-commission-lechan-response2021')?.text.sk)
      .toBe('Martin Lechan pre Aktuality.sk uviedol, že návrh na odvolanie Milana Ftoreka z komisie nesúvisel s jeho kritikou parkovacej politiky.');
    const audit = JSON.parse(readFileSync(new URL('../../research/martin-media-review-2026.json', import.meta.url), 'utf8'));
    const chain = audit.eventChains.find((row: { id: string }) => row.id === 'mt-mr-chain-ftorek-commission2021');
    expect(chain.developments).toEqual(expect.arrayContaining([expect.objectContaining({ claimIds: ['mt-mr-ftorek-commission-response2021'] })]));
    expect(chain.latest.claimIds).toEqual(['mt-mr-ftorek-commission-lechan-response2021']);
  });

  it('traces announced Martin mayoral candidacies through the official registration', () => {
    const audit = JSON.parse(readFileSync(new URL('../../research/martin-media-review-2026.json', import.meta.url), 'utf8'));
    for (const id of ['mt-mr-chain-ftorek-candidacy2026', 'mt-mr-chain-petras-candidacy2026', 'mt-mr-record-hubacek-nomination-report']) {
      expect(audit.eventChains.find((chain: { id: string }) => chain.id === id)).toMatchObject({
        latest: { date: '2026-09-08', sourceId: 'mt-municipal-roster-2026' }, outcomeStatus: 'official_procedural',
      });
    }
  });

  it('uses the date of Lepej’s own official district list', () => {
    const audit = JSON.parse(readFileSync(new URL('../../research/martin-media-review-2026.json', import.meta.url), 'utf8'));
    expect(audit.eventChains.find((chain: { id: string }) => chain.id === 'mt-mr-chain-lepej-team').latest)
      .toMatchObject({ date: '2026-09-08' });
    const uhercik = audit.eventChains.find((chain: { id: string }) => chain.id === 'mt-mr-chain-uhercik-candidacy');
    expect(uhercik.limits.join(' ')).toContain('8. až 10. septembra 2026');
  });

  it('dates the roof completion report without inventing a completion day', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'mt-mr-hudec-stadium-roof-later')).toMatchObject({
      period: 'správa 21. októbra 2025',
      text: { sk: 'Martinské noviny v októbri 2025 informovali o dokončení rekonštrukcie strechy zimného štadióna.' },
    });
    const audit = JSON.parse(readFileSync(new URL('../../research/martin-media-review-2026.json', import.meta.url), 'utf8'));
    expect(audit.eventChains.find((chain: { id: string }) => chain.id === 'mt-mr-chain-hudec-stadium-roof').latest.summary)
      .toBe('Podpísaný článok v októbri 2025 informoval o dokončení rekonštrukcie strechy zimného štadióna.');
  });

  it('registers the Ftorek TASR original once at the canonical URL declared by NewsArticle', async () => {
    const { data } = await loadCity();
    expect(data.sources.filter((source) => source.url.includes('/976596-clanok.html'))).toHaveLength(1);
    expect(data.sources.find((source) => source.id === 'mt-c3-ftorek-candidacy-tasr')?.url)
      .toBe('https://www.teraz.sk/regiony/kandidaturu-na-primatora-martina-ohla/976596-clanok.html');
    expect(data.claims.some((claim) => claim.sourceIds.includes('mt-ftorek-team-tasr-2026'))).toBe(false);
  });

  it('retains reopened TASR reports with verified identity bridges and removes inaccessible programme assertions', async () => {
    const { data } = await loadCity();
    expect(data.claims.find((claim) => claim.id === 'mt-marek-pacalaj-hk-martin-2018')?.sourceIds)
      .toEqual(['mt-pacalaj-hockey-tasr-20180616', 'mt-mr-pacalaj-return-20250614', 'mt-mr-pacalaj-roster-20260912']);
    expect(data.claims.find((claim) => claim.id === 'mt-martin-hudec-hospital-report-2019')?.sourceIds)
      .toEqual(['mt-hudec-hospital-tasr-20191213', 'mt-mr-hudec-appointment-20190328']);
    for (const [candidateId, id] of [
      ['mt-marek-pacalaj', 'mt-marek-pacalaj-programme_statements-123'],
      ['mt-martin-hudec', 'mt-martin-hudec-programme_statements-129'],
    ]) {
      expect(data.claims.some((claim) => claim.id === id), id).toBe(false);
      expect(data.researchCoverage.find((row) => row.candidateId === candidateId && row.category === 'programme_statements'))
        .toMatchObject({ status: 'searched_none', sourceIds: [] });
    }
  });
});
