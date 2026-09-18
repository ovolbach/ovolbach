import { describe, expect, it } from 'vitest';
import { loadGuideData } from '../../src/lib/load-guide-data';

const data = await loadGuideData();
const claim = (id: string) => data.claims.find((item) => item.id === id);
const source = (id: string) => data.sources.find((item) => item.id === id);
const coverage = (candidateId: string, category: string) => data.researchCoverage
  .find((item) => item.candidateId === candidateId && item.category === category);

describe('Task 7 reviewed evidence', () => {
  it('uses non-applicability for Jana Chlustinová after finding no public office', () => {
    expect(coverage('candidate-86', 'public_office')).toMatchObject({ status: 'searched_none' });
    expect(coverage('candidate-86', 'asset_declarations')).toMatchObject({
      status: 'not_applicable',
      sourceIds: [],
    });

    const rows = data.researchCoverage.filter((item) => (
      Number(item.candidateId.replace('candidate-', '')) >= 85
      && Number(item.candidateId.replace('candidate-', '')) <= 91
    ));
    expect(rows.reduce<Record<string, number>>((counts, row) => {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
      return counts;
    }, {})).toEqual({ found: 46, searched_none: 8, not_applicable: 2 });
  });

  it('preserves complete source punctuation for short direct quotations', () => {
    expect(claim('claim-candidate-85-programme-formation-2026')).toMatchObject({
      kind: 'quote',
      text: { sk: '„Formujem si určitý tím a dávame dokopy programové priority, aby to nebola len taká povinná jazda, ale aby vystihovali skutočné potreby kraja,“' },
    });
    expect(claim('claim-candidate-87-programme-transport-2026')).toMatchObject({
      kind: 'quote',
      text: { sk: '„Doprava zadarmo pre študentov a dôchodcov“' },
    });
    expect(claim('claim-candidate-87-media-interview-2025')).toMatchObject({
      kind: 'quote',
      text: { sk: '„Platí, že prioritou zostáva dobudovanie základnej diaľničnej siete – to znamená, že potrebujeme dobudovať D1 a vybudovať D3 a R4.“' },
    });
    expect(claim('claim-candidate-89-programme-housing-2026')).toMatchObject({
      kind: 'quote',
      text: { sk: '„Župa zabezpečí výstavbu dostupného nájomného bývania v celom kraji“' },
    });
    expect(claim('claim-candidate-90-programme-region-2026')).toMatchObject({
      kind: 'quote',
      text: { sk: '„Žilinský kraj je klenot Slovenska.“' },
    });

    for (const id of [
      'claim-candidate-85-programme-formation-2026',
      'claim-candidate-87-programme-transport-2026',
      'claim-candidate-87-media-interview-2025',
      'claim-candidate-89-programme-housing-2026',
      'claim-candidate-90-programme-region-2026',
    ]) {
      const words = claim(id)?.text.sk.match(/[\p{L}\p{N}]+/gu) ?? [];
      expect(words.length).toBeLessThanOrEqual(25);
    }
  });

  it('uses an attributed paraphrase when the complete KSS sentence exceeds the quote limit', () => {
    expect(claim('claim-candidate-91-programme-economy-2026')).toMatchObject({
      kind: 'fact',
      text: {
        sk: 'Milan Pova v autorskom texte KSS napísal, že Slovensko zostáva závislé od exportne orientovaného priemyslu, najmä automobilovej výroby, a od zahraničného dopytu. Text nie je označený ako program pre ŽSK.',
      },
    });
    expect(claim('claim-candidate-91-programme-economy-2026')?.text.sk).not.toMatch(/[„“]/);
  });

  it('removes the family relation from the Choma office-rent claim', () => {
    expect(claim('claim-candidate-87-office-rent-report-2015')).toMatchObject({
      kind: 'media_report',
      text: {
        sk: 'Aktuality.sk v roku 2015 informovali, že Igor Choma si poslaneckú kanceláriu prenajímal od spoločnosti, pri ktorej článok opisoval osobné prepojenie. Ide o tvrdenie média, nie o úradné zistenie.',
      },
    });
    expect(claim('claim-candidate-87-office-rent-report-2015')?.text.sk).not.toMatch(/zať|rodin/i);
    expect(claim('claim-candidate-87-office-rent-response-2015')?.kind).toBe('response');
  });

  it('keeps the museum litigation as a non-final media report with a separate response', () => {
    expect(claim('claim-candidate-88-museum-court-outcome-2025')).toMatchObject({
      kind: 'media_report',
      text: {
        sk: 'Aktuality.sk na základe vyjadrenia hovorkyne ŽSK uviedli, že prvostupňový súd označil výpoveď za neplatnú. Kraj podal odvolanie, potom sa dohodol na mimosúdnom vyrovnaní; zastupiteľstvo schválilo viac ako 60-tisíc eur. Nejde o konečné rozhodnutie odvolacieho súdu.',
      },
    });
    expect(claim('claim-candidate-88-museum-response-2025')?.kind).toBe('response');
  });

  it('attributes the reported dismissal reason to Kapitulík while retaining the official removal fact', () => {
    expect(claim('claim-candidate-89-dismissal-outcome-2025')?.kind).toBe('official_outcome');
    expect(claim('claim-candidate-89-dismissal-report-2025')).toMatchObject({
      kind: 'response',
      text: {
        sk: 'Martin Kapitulík pre Žilinský večerník uviedol, že primátor ako jediný dôvod odvolania označil nezvolenie Rudolfa Chodelku a Kapitulíkovo angažovanie sa pri tajnom hlasovaní. Ide o Kapitulíkovu verziu udalostí.',
      },
    });
  });

  it('retains the ECHR uncertainty hedge without implying a merits finding', () => {
    expect(claim('claim-candidate-90-echr-domestic-outcome-2025')?.text.sk).toBe(
      'Oznámenie ESĽP uvádza, že vyšetrovanie úmrtia Milana Lučanského bolo zastavené so záverom o samovražde a bez zistenia trestného činu; ďalšie vyšetrovanie zrejme pokračovalo.',
    );
    expect(claim('claim-candidate-90-echr-procedural-status-2025')?.text.sk).toContain(
      'nie je rozhodnutím o ich dôvodnosti',
    );
  });

  it('keeps company history within the periods and activities stated by official sources', () => {
    expect(claim('claim-candidate-87-employment-history')?.text.sk).toBe(
      'Profil Ministerstva dopravy uvádza manažérske pozície vo Váhostave v rokoch 1987 – 1999, neskoršie pôsobenie v BCI a PROMA, vedenie NDS v rokoch 2006 – 2010 a vo Váhostave v rokoch 2019 – 2023 členstvo v predstavenstve a predsedníctvo dozornej rady.',
    );
    expect(claim('claim-candidate-89-business-history-2023')?.text.sk).toBe(
      'Mesto Žilina pri vymenovaní viceprimátora v januári 2023 uviedlo, že Martin Kapitulík začal podnikať počas vysokej školy a jeho spoločnosti sa venovali najmä správe a prenájmu nehnuteľností.',
    );
  });

  it('uses the exact official PDF title and signed media byline', () => {
    expect(source('zilina-kapitulik-dismissal-official-2025')?.title).toBe(
      'Zápisnica č. 9/2025 Kooperačnej rady UMR Žilina',
    );
    expect(source('zilinskyvecernik-kapitulik-dismissal-2025')?.author).toBe('- r -');
  });
});
