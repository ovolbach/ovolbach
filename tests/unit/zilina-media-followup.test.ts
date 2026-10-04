import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { loadElectionContext } from '../../src/lib/load-guide-data';
import protectedRecords from '../fixtures/zilina-media-protected.json';
import { validateDataset } from '../../src/lib/validate-dataset';
import { preservesApprovedRecord } from '../helpers/approved-record-preservation';

const root = new URL('../../', import.meta.url);
const read = (path: string) => JSON.parse(readFileSync(new URL(path, root), 'utf8'));
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const scope = new Set(protectedRecords.scopeCandidateIds);
const load = async () => (await loadElectionContext({ citySlug: 'zilina', year: 2026 })).data;

describe('Žilina additional media research', () => {
  it('preserves other cities, shared chair candidates, official ballots and historical research', () => {
    expect(scope.size).toBe(128);
    for (const [path, expected] of Object.entries(protectedRecords.unchangedFiles)) {
      if (!Array.isArray(read(path))) expect(hash(read(path)), path).toBe(expected);
    }
    for (const [path, expectedRecords] of Object.entries(protectedRecords.recordHashes)) {
      const records = read(path) as Array<{ id: string; contestId?: string }>;
      const current = new Map(records.map((row) => [path.endsWith('/elections.json') ? row.contestId : row.id, row]));
      for (const [id, expected] of Object.entries(expectedRecords)) {
        expect(preservesApprovedRecord(path, id, current.get(id), expected), `${path}:${id}`).toBe(true);
      }
    }
  });

  it('records a completed individual search for all 128 people with a bounded chronology', () => {
    const path = new URL('research/zilina-media-2026.json', root);
    expect(existsSync(path), 'the follow-up must retain an auditable search receipt').toBe(true);
    if (!existsSync(path)) return;
    const report = JSON.parse(readFileSync(path, 'utf8'));
    expect(report.baseCommit).toBe(protectedRecords.baseCommit);
    expect(report.checkedAt).toBe('2026-10-03');
    const receipts = report.candidates;
    expect(receipts.find((row: { candidateId: string }) => row.candidateId === 'za-miroslav-sokol').existingStoryChronologies.length).toBeGreaterThan(0);
    expect(receipts.map((row: { candidateId: string }) => row.candidateId).sort()).toEqual([...scope].sort());
    for (const row of receipts) {
      expect(row.queries.length, row.candidateId).toBeGreaterThan(0);
      expect(row).toHaveProperty('existingStoryChronologies');
      expect(row).toHaveProperty('limitations');
    }
  });

  it('adds accessible signed reporting for formerly missed mayor media mentions', async () => {
    const data = await load();
    expect(data.sources.find((s) => s.id === 'za-media-root-mayor-media-2026')).toMatchObject({ type: 'media', author: 'Dominika Rovňanová', publishedAt: '2026-09-07' });
    for (const candidateId of ['za-ivan-magat', 'za-michal-milo', 'za-bohumil-kostolny', 'za-anton-kozlik']) {
      expect(data.researchCoverage.find((r) => r.candidateId === candidateId && r.category === 'media')).toMatchObject({ status: 'found' });
      expect(data.claims.some((r) => r.candidateId === candidateId && r.category === 'media' && r.sourceIds.includes('za-media-root-mayor-media-2026'))).toBe(true);
    }
  });

  it('does not present ordered or cooperative campaign interviews as independent journalism', async () => {
    const data = await load();
    expect(data.sources.find((s) => s.id === 'za-a-sp21-0')?.type).toBe('candidate');
    expect(data.sources.find((s) => s.id === 'za-b-delincak-media')?.type).toBe('candidate');
    expect(data.claims.find((c) => c.id === 'claim-za-lubomir-bechny-sp21-media-0')?.text.sk).toMatch(/objednan|objednáv/i);
    expect(data.claims.find((c) => c.id === 'claim-za-b-branislav-delincak-delincak-media-report')?.text.sk).toMatch(/spoluprác/i);
  });

  it('keeps the Korytnačka police decision bounded to its reported non-final 2022 status', async () => {
    const data = await load();
    expect(data.claims.find((c) => c.id === 'claim-za-media-root-peter-cibulka-korytnacka-status')).toMatchObject({
      kind: 'media_report', period: '2022-03-07',
      text: { sk: 'Aktuality.sk 7. marca 2022 uviedli, že policajné rozhodnutie vo veci pozemku pod Korytnačkou ešte nenadobudlo právoplatnosť.' },
    });
  });

  it('separates ŽPS litigation, settlement approval and the continuing Mirage appeal', async () => {
    const data = await load();
    expect(data.claims.find((c) => c.id === 'claim-za-media-root-peter-fiabane-zps-status')).toMatchObject({ kind: 'response', period: '2024-09-20' });
    const approval = data.claims.find((c) => c.id === 'claim-za-media-root-peter-fiabane-settlement-approval');
    expect(approval).toMatchObject({ kind: 'official_outcome', period: '2024-09-24', sourceIds: ['za-media-root-karpatska-2024-resolution'] });
    expect(approval?.text.sk).toContain('schválilo uzatvorenie zmluvy');
    expect(data.claims.find((c) => c.id === 'claim-za-media-root-peter-fiabane-mirage-city-status')).toMatchObject({
      kind: 'response', period: '2026-01-26',
      text: { sk: 'Mesto Žilina 26. januára 2026 uviedlo, že konanie o vecnom bremene pokračuje po jeho odvolaní na Krajskom súde v Žiline.' },
    });
    expect(data.claims.find((c) => c.id === 'claim-za-media-root-peter-fiabane-mirage-company-response')?.kind).toBe('response');
  });

  it('adds the Bulvár owner response and identifies the latest candidate advertising', async () => {
    const data = await load();
    expect(data.claims.find((c) => c.id === 'claim-za-media-root-peter-fiabane-bulvar-owner-response')).toMatchObject({ kind: 'response', period: '2025-12-01' });
    expect(data.sources.find((s) => s.id === 'za-media-root-bulvar-paid-2026')).toMatchObject({ type: 'candidate', publishedAt: '2026-09-30' });
    const response = data.claims.find((c) => c.id === 'claim-za-media-root-peter-fiabane-bulvar-paid-response');
    expect(response?.text.sk).toContain('označenom Inzercia');
    expect(response?.kind).toBe('response');
  });

  it('keeps the 2019 CVČ administrative action separate from the later reported judicial reversal', async () => {
    const data = await load();
    expect(data.claims.find((c) => c.id === 'claim-za-media-root-eva-dobsovic-mjartan-cvc-dismissal-date')).toMatchObject({
      kind: 'official_outcome', period: '2019-10-25',
      text: { sk: 'Správa mestského úradu z 2. decembra 2019 uvádza, že riaditeľka žilinského CVČ bola na návrh rady školského zariadenia odvolaná 25. októbra 2019.' },
    });
    expect(data.claims.find((c) => c.id === 'claim-za-eva-dobsovic-mjartan-cvc-dismissal-reported-2021')?.kind).toBe('media_report');
  });

  it('pairs the historical Johanes hospital report with his response without claiming a final employment outcome', async () => {
    const data = await load();
    expect(data.claims.find((c) => c.id === 'claim-za-media-root-rastislav-johanes-hospital-report')).toMatchObject({ kind: 'media_report', period: '2013-02-04' });
    expect(data.claims.find((c) => c.id === 'claim-za-media-root-rastislav-johanes-hospital-response')).toMatchObject({ kind: 'response', period: '2013-02-18' });
    const text = data.claims.filter((c) => c.id.startsWith('claim-za-media-root-rastislav-johanes-hospital')).map((c) => c.text.sk).join(' ');
    expect(text).not.toMatch(/promile|viróz|vysoký tlak|právoplatne|skončenie pracovného pomeru/);
  });

  it('pairs newly found advertising, chalet and Oksana allegations with separately attributed responses', async () => {
    const data = await load();
    for (const prefix of ['za-media-c-plesinger-advertising', 'za-media-c-strba-soar', 'za-media-c-slota-oksana']) {
      expect(data.claims.find((c) => c.id === `${prefix}-report`)?.kind).toBe('media_report');
      expect(data.claims.find((c) => c.id === `${prefix}-response`)?.kind).toBe('response');
    }
    expect(data.claims.find((c) => c.id === 'za-media-c-strba-soar-response')?.text.sk).toContain('päť až desať percent');
  });

  it('keeps creditor protection and architect appointment within the decisions actually documented', async () => {
    const data = await load();
    const protection = data.claims.find((c) => c.id === 'za-media-c-ryban-creditor-protection');
    expect(protection).toMatchObject({ kind: 'official_outcome', sourceIds: ['za-media-c-ryban-protection-2019'] });
    expect(protection?.text.sk).toContain('11. marca 2019');
    expect(protection?.text.sk).toContain('18. marca 2019');
    expect(protection?.text.sk).not.toMatch(/splnil|ukončil|zbavený dlhov/);
    const appointment = data.claims.find((c) => c.id === 'za-media-c-turcanyiova-selection-outcome');
    expect(appointment?.kind).toBe('official_outcome');
    expect(appointment?.text.sk).toContain('29/2026');
    expect(appointment?.text.sk).not.toMatch(/bez konfliktu|vyvrátil|očistil/);
  });


  it('recovers Čorba’s early response and bounds the later ARDSYSTÉM agreement to the company', async () => {
    const data = await load();
    expect(data.claims.find((c) => c.id === 'za-media-a-corba-flat-first-report-2014')).toMatchObject({ kind: 'media_report', period: '2014-02-02' });
    expect(data.claims.find((c) => c.id === 'za-media-a-corba-flat-own-response-2014')?.kind).toBe('response');
    const settlement = data.claims.find((c) => c.id === 'za-media-a-delincak-company-settlement-2024');
    expect(settlement?.kind).toBe('official_outcome');
    expect(settlement?.text.sk).toContain('596/2024');
    expect(settlement?.text.sk).toContain('spoločnosťou ARDSYSTÉM');
    expect(settlement?.text.sk).not.toMatch(/zaplatil|očistený|nevinný|oslobodený/);
    expect(data.claims.find((c) => c.id === 'za-media-a-cader-oneway-city-assessment-2026')?.kind).toBe('response');
  });

  it('labels the newly located Barčíková programme as ordered candidate content', async () => {
    const data = await load();
    expect(data.sources.find((s) => s.id === 'za-media-a-barcikova-school-buses-2022')?.type).toBe('candidate');
    const programme = data.claims.find((c) => c.id === 'za-media-a-barcikova-school-buses-statement-2022');
    expect(programme?.category).toBe('programme_statements');
    expect(programme?.text.sk).toContain('objednanom kandidátskom texte');
    expect(data.researchCoverage.find((r) => r.candidateId === 'za-veronika-barcikova' && r.category === 'programme_statements')?.sourceIds).toContain('za-media-a-barcikova-school-buses-2022');
  });


  it('separates Kavecká’s reported criminal case from the later administrative sanction on Kunerad', async () => {
    const data = await load();
    expect(data.claims.find((c) => c.id === 'za-media-b-kavecka-complaint-dismissed')?.kind).toBe('media_report');
    expect(data.claims.find((c) => c.id === 'za-media-b-kavecka-response-jan2022')?.kind).toBe('response');
    const fine = data.claims.find((c) => c.id === 'za-media-b-kunerad-administrative-fine');
    expect(fine).toMatchObject({ kind: 'official_outcome', period: 'rozhodnutie 2025-06-12' });
    expect(fine?.text.sk).toBe('ÚVO v rozhodnutí z 12. júna 2025 uložil obci Kunerad pokutu 6 000 eur za porušenia pri obstarávaní výstavby nájomných bytov. Ide o správnu sankciu obci.');
    expect(data.claims.find((c) => c.id === 'za-media-b-kunerad-administrative-lawsuit')?.text.sk).toContain('právoplatnosť 4. februára 2025');
  });

  it('joins Janík using the institutional identity bridge and keeps the renewed Camase investigation as reported', async () => {
    const data = await load();
    expect(data.claims.find((c) => c.id === 'za-media-b-janik-camase-own-response')?.kind).toBe('response');
    expect(data.claims.find((c) => c.id === 'za-media-b-janik-camase-director-response')?.kind).toBe('response');
    const latest = data.claims.find((c) => c.id === 'za-media-b-janik-camase-later-investigation-report');
    expect(latest).toMatchObject({ kind: 'media_report', period: 'začatie stíhania 2026-02-03; správa 2026-02-09' });
    expect(latest?.text.sk).not.toMatch(/Janík bol obvinený|Janíka odsúdil|právoplatne/);
  });


  it('classifies the explicitly marked Juriš PR interview as candidate content', async () => {
    const data = await load();
    expect(data.sources.find((s) => s.id === 'za-b-juris-media')?.type).toBe('candidate');
    expect(data.claims.find((c) => c.id === 'claim-za-b-jozef-juris-juris-media-report')?.text.sk).toContain('označený ako PR');
  });

  it('keeps the sanctions petition court ruling on the committee and ICJK findings attributed', async () => {
    const data = await load();
    const ruling = data.claims.find((c) => c.id === 'za-media-c-slota-petition-court-outcome');
    expect(ruling?.kind).toBe('official_outcome');
    expect(ruling?.text.sk).toContain('20. novembra 2025');
    expect(ruling?.text.sk).toContain('sťažnosť petičného výboru');
    expect(ruling?.text.sk).not.toMatch(/Slota.*odsúdený|Slotovu sťažnosť/);
    expect(data.sources.find((source) => source.id === 'za-media-c-slota-icjk-investigation-2025')?.url).toBe('https://www.icjk.sk/419/Platena-nenavist-Utoky-na-novinarov-najviac-sponzorovali-politici-na-Slovensku-a-v-Madarsku-platformy-nezakrocili');
    const investigation = data.claims.filter((c) => c.sourceIds.includes('za-media-c-slota-icjk-investigation-2025'));
    expect(investigation.length).toBe(2);
    for (const claim of investigation) expect(claim.kind).toBe('media_report');
  });


  it('retains the original institutional parking response and does not invent an inability to postpone', async () => {
    const data = await load();
    expect(data.claims.find((c) => c.id === 'za-media-b-jantosik-parking-city-response')?.text.sk).toBe('Mesto Žilina podľa správy Dominiky Rovňanovej na Žilinak.sk z 12. júla 2024 uviedlo, že regulované parkovanie na sídliskách zavádza etapovito po dohode s poslancami mestského zastupiteľstva.');
    expect(data.claims.find((c) => c.id === 'za-media-b-kavecka-response-jan2022')?.text.sk).toContain('dokázať pred súdom');
  });


  it('supports every positive category with a claim and avoids duplicate announcements', async () => {
    const data = await load();
    expect(validateDataset(data, 'release')).toEqual([]);
    const announcement = data.claims.filter((c) => c.candidateId === 'za-miroslav-sokol' && c.category === 'media' && c.period === '2026-05-26' && c.sourceIds.includes('za-b-sokol-tasr'));
    expect(announcement.map((c) => c.id)).toEqual(['claim-za-b-miroslav-sokol-sokol-tasr-report']);
  });

});
