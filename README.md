# O voľbách

[ovolbach.sk](https://ovolbach.sk) je otvorený, zdrojovaný a politicky neutrálny volebný sprievodca. Prvá publikovaná dátová sada pokrýva komunálne a krajské voľby 2026 v Liptovskom Mikuláši. Jeden web môže publikovať ďalšie mestá aj roky; staršie roky zostávajú v archíve.

Web nehodnotí kandidátov a neposkytuje volebné odporúčania. Verejné tvrdenia oddeľuje podľa typu, pripája k nim zdroje a uvádza dátum kontroly. Otázky, opravy a žiadosti o odstránenie údajov posielajte na [info@ovolbach.sk](mailto:info@ovolbach.sk).

## Funkcie

- katalóg miest, rokov, kandidátov a kandidatúr,
- výber volebného obvodu,
- porovnanie kandidátov podľa rovnakých faktických kategórií,
- citácie a verejné tvrdenia s odkazmi na pôvodné zdroje,
- statické fulltextové vyhľadávanie cez Pagefind (globálne na úvodnej stránke, filtrované podľa mesta a roku v sprievodcovi),
- kontrola dát, odkazov, súkromia a redakčných pravidiel,
- responzívne a prístupné používateľské rozhranie,
- plne statický výstup bez databázy, analytiky, cookies a úložiska prehliadača.

## Technológie

- [Astro](https://astro.build/)
- TypeScript
- Pagefind
- Vitest
- Playwright

## Požiadavky

- Node.js `>=22.12.0 <25`
- npm

Verziu Node.js určuje aj súbor `.nvmrc`.

## Lokálne spustenie

```bash
npm ci
npm run dev
```

Vývojový server Astro zobrazí lokálnu adresu v termináli.

## Mestá a roky

Úvodná stránka `/` uvádza iba publikované mestá a roky. Sprievodca má adresu `/{mesto}/{rok}/`; katalóg kandidátov, profil, porovnanie, návod na voľbu a podrobný register zdrojov sú pod touto adresou. Staré adresy bez mesta a roku statický výstup negeneruje; produkčný Nginx presmeruje vybrané historické adresy na aktuálny kontext. Metodika je na `/metodika/`; `/zdroje/` slúži ako rozcestník registrov podľa mesta a roku.

Údaje jedného kraja a roka sú v `src/data/elections/{rok}/{kraj}/`. Osoby, tvrdenia a výskumné pokrytie sú v rámci cyklu spoločné; každý kandidát môže mať viac kandidatúr. `regional/config.json` určuje spoločné krajské voľby. `municipalities/{mesto}/config.json` určuje mestské voľby, mestské obvody, príslušný krajský obvod, stav `draft` alebo `published` a dátum overeného snímku. Zdrojový register `src/data/sources.json` je spoločný pre všetky cykly.

Pri pridaní mesta do existujúceho cyklu doplňte mestské voľby, obvody, kandidátov a kandidatúry do cyklových súborov a vytvorte jeho `config.json`. Pri novom roku vytvorte samostatný cyklus; neupravujte historický snímok. `contestId` a ID obvodov musia byť jedinečné, kým `electionId` označuje jeden zo štyroch druhov volieb. Nepriraďujte záznamy osobám podľa mena samotného.

Najdôležitejšie dátové súbory cyklu:

| Súbor | Obsah |
| --- | --- |
| `candidates.json` | osoby a ich verejné profily |
| `candidacies.json` | kandidatúry, čísla na hlasovacích lístkoch a obvody |
| `elections.json` | druhy volieb a pravidlá hlasovania |
| `districts.json` | volebné obvody, ulice a volebné miestnosti |
| `claims.json` | overiteľné tvrdenia a citácie |
| `src/data/sources.json` | spoločné zdroje, vydavatelia a dátumy kontroly |
| `research-coverage.json` | stav kontroly jednotlivých kategórií |

Schémy, väzby a redakčné obmedzenia sú definované v `src/lib/schemas.ts` a `src/lib/validate-dataset.ts`. Publikovať možno iba kontext s ôsmimi záznamami pokrytia na kandidáta a bez stavu `pending`. Pri zmene dát zachovajte väzby na zdroje a presnú atribúciu citácií.

## Dostupné príkazy

| Príkaz | Účel |
| --- | --- |
| `npm run dev` | spustí lokálny vývojový server |
| `npm run check` | skontroluje projekt cez Astro |
| `npm test` | spustí unit a integračné testy |
| `npm run validate:data` | skontroluje pracovnú dátovú sadu |
| `npm run validate:release` | vykoná prísnu kontrolu dát pred vydaním |
| `npm run report:coverage` | vytvorí prehľad pokrytia všetkých publikovaných kontextov; možno pridať `-- --city=liptovsky-mikulas --year=2026` |
| `npm run check:links` | skontroluje dostupnosť externých zdrojov |
| `npm run check:storage` | overí, že web nepoužíva cookies ani úložisko prehliadača |
| `npm run test:e2e` | spustí end-to-end testy v Playwright |
| `npm run build` | validuje dáta, vytvorí produkčný web v `dist/` a vygeneruje sitemap |
| `npm run check:seo` | manuálny SEO audit metadát, štruktúrovaných údajov, canonical a sitemap |
| `npm run check:html` | manuálna kontrola všetkých HTML súborov pomocou W3C Nu Html Checker vrátane `404.html` |
| `npm run preview` | lokálne zobrazí produkčný build |
| `npm run verify` | spustí bežné testy, kontrolu vydania, build, úložiska, externých odkazov a E2E; SEO, HTML a `report:coverage` spustite osobitne |

Pred prvým end-to-end testom môže byť potrebné nainštalovať Chromium:

```bash
npx playwright install chromium
```

## Produkčný build

```bash
npm run build
npm run preview
```

Priečinok `dist/` je generovaný výstup. Neukladá sa do Git repozitára a pri každom nasadení sa vytvorí znova.

SEO a HTML audit spustite ručne po zostavení webu pred jeho prvým publikovaním: `npm run check:seo` a `npm run check:html`. Nie sú súčasťou `build` ani `verify`. Kontrola HTML používa [oficiálny W3C Nu Checker](https://github.com/validator/validator/releases/tag/latest). Prvý beh stiahne príslušný balík Windows, Linux alebo macOS do ignorovaného priečinka `.superpowers/vnu/`; v ďalších behoch použije cache. V offline prostredí možno nastaviť `VNU_JAVA` na Java runtime z oficiálneho balíka alebo `VNU_JAR` na oficiálny `vnu.jar` pri dostupnej Jave 17+. Výstup vrátane upozornení sa uloží do `test-results/html-validation.json`.

## Nasadenie na Elestio

Koreňový [`Dockerfile`](Dockerfile) zostaví obraz: Node.js 22 spustí `npm ci`, `npm run validate:release` a `npm run build`, potom Nginx publikuje výsledný priečinok `dist/`. Konfigurácia statického servera je v [`deploy/nginx/default.conf`](deploy/nginx/default.conf). Kontajner presmeruje `www` na hlavnú doménu, ak reverzný proxy zachová pôvodnú hlavičku `Host`; zároveň vynúti relatívne presmerovanie na koncovú lomku a zobrazí zostavenú `404.html` so stavom HTTP 404.

Elestio musí zostavovať obraz z tohto Dockerfile. Existujúca inštalácia vytvorila na serveri `/opt/app/ovolbach/Dockerfile` a `docker-compose.yml` mimo Git; pred ďalším nasadením overte, že pipeline použije súbory z repozitára a neprepíše ich vlastnou šablónou. Vonkajší reverzný proxy Elestio smeruje na port `172.17.0.1:3028`; jeho doménová a TLS konfigurácia nie je súčasťou tohto repozitára.

## Štruktúra projektu

```text
src/components/   komponenty používateľského rozhrania
src/config/       verejná konfigurácia webu
src/data/         zdrojované volebné dáta
src/layouts/      spoločné rozloženia stránok
src/lib/          schémy, validácia a pomocné funkcie
src/pages/        verejné stránky a trasy
src/scripts/      klientské skripty
src/styles/       globálne štýly a dizajnové tokeny
scripts/          buildové a kontrolné nástroje
tests/            unit, integračné a end-to-end testy
```

## Zodpovedná práca s dátami

Pri vytváraní vlastnej verzie používajte iba údaje relevantné pre verejnú kandidatúru alebo verejnú funkciu. Každé publikované tvrdenie musí mať dohľadateľný zdroj. Nezverejňujte súkromné kontakty, adresy, osobné identifikátory ani nepotvrdené spojenia.

Externé články, dokumenty, fotografie a citácie zostávajú vlastníctvom príslušných autorov a vydavateľov. Licencia repozitára im neprideľuje novú licenciu.

## Licencia

Zdrojový kód je dostupný pod licenciou [MIT](LICENSE).
