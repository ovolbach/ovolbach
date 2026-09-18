import { describe, expect, it } from 'vitest';
import { loadGuideData } from '../../src/lib/load-guide-data';

const data = await loadGuideData();
const claim = (id: string) => data.claims.find((item) => item.id === id);
const source = (id: string) => data.sources.find((item) => item.id === id);

describe('Task 4 reviewed evidence', () => {
  it('uses evidence dates for the Urbanovič, Grešo and Chrapčiak records', () => {
    expect(source('aktuality-urbanovic-zupny-dom')?.publishedAt).toBe('2021-09-28');
    expect(claim('claim-candidate-47-media-zupny-dom')?.period).toBe('2021-09-28');

    expect(claim('claim-candidate-51-asge-transport')).toMatchObject({
      period: '2026-09-18',
      text: {
        sk: 'Pri kontrole 18. septembra 2026 oficiálny register cestnej dopravy uvádzal Jaroslava Greša ako vedúceho dopravy spoločnosti AŠGE, s.r.o.',
      },
    });

    expect(source('aos-chrapciak-report')).toMatchObject({
      title: 'Výročná správa o činnosti za rok 2011',
      publisher: 'Akadémia ozbrojených síl generála Milana Rastislava Štefánika',
    });
    expect(claim('claim-candidate-39-aos-personnel-role')).toMatchObject({
      period: '2011',
      text: {
        sk: 'Výročná správa AOS za rok 2011 uvádza Ing. Martina Chrapčiaka ako vedúceho skupiny personálnych služieb.',
      },
    });
  });

  it('keeps only complete verbatim sentences as quotes and labels paraphrases by kind', () => {
    expect(claim('claim-candidate-34-programme-2026')).toMatchObject({
      kind: 'quote',
      text: {
        sk: '„Záleží mu na tom, aby rozhodnutia mesta vychádzali z reálnych potrieb ľudí a aby sa rozvoj Liptovského Mikuláša premietal do kvality života jeho obyvateľov.“',
      },
    });
    expect(claim('claim-candidate-35-programme-2026')).toMatchObject({
      kind: 'quote',
      text: {
        sk: '„Ako poslanec sa chcem venovať ďalšiemu skvalitňovaniu verejného priestoru na Podbrezinách – obnove ciest a chodníkov, parkovaniu, vnútroblokom, zeleni a bezpečnému pohybu obyvateľov.“',
      },
    });
    expect(claim('claim-candidate-40-programme-2026')).toMatchObject({
      kind: 'fact',
      text: {
        sk: 'Kandidátsky profil uvádza, že Jana Junasová Klímová chce svoje skúsenosti využiť pri rozvoji mesta, dostupných verejných služieb, školstva, športu, kultúry, ochrany životného prostredia a zodpovedného hospodárenia s verejnými financiami.',
      },
    });
    expect(claim('claim-candidate-39-media-water-2025')).toMatchObject({
      kind: 'media_report',
      text: {
        sk: 'STVR citovala Martina Chrapčiaka, podľa ktorého by uvedený odber vody znemožnil migráciu rýb, zlikvidoval biotop a rieka by v podstate zmizla.',
      },
    });
    expect(claim('claim-candidate-51-media-autoskola-2026')).toMatchObject({
      kind: 'media_report',
      text: {
        sk: 'Noviny.sk citovali Jaroslava Greša, podľa ktorého nejde o bežnú prax, je nad rámec učebných osnov a vystúpenie kompetentných ľudí v uniforme má väčšiu váhu.',
      },
    });
  });
});
