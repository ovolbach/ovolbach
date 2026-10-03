# Dodatočný mediálny audit Žilina 2026

Snímok: **3. október 2026**. Východiskový commit: `8a02b12829b09025902a89d6d72ab20a89cf23fc`; izolovaný worktree `/tmp/ovolbach-zilina-2026`, vetva `codex/zilina-2026`.

Preverených bolo 128 osôb. Sedem spoločných kandidátov na predsedu kraja (`candidate-85` až `candidate-91`) bolo úplne vylúčených; oficiálne kandidátky, financie, ostatné mestá a pôvodný audit zostali bez zmeny. Porovnanie mien zahŕňalo Liptovský Mikuláš/Ružomberok, Dolný Kubín a Martin. Jednotlivé dotazy, otvorené originály, identifikačné spojenia, vylúčenia, prístupové obmedzenia a časové osi sú v [strojovom denníku](zilina-media-2026.json).

## Zmeny a významné doplnenia

- 110 nových atómových tvrdení, 80 nových kanonických zdrojov, tri opravy typu zdroja a dve opravy atribúcie existujúceho tvrdenia. Zmenených je 58 záznamov pokrytia; počet záznamov zostal rovnaký. Žilina má 964 tvrdení a 1 080 záznamov pokrytia: 557 `found`, 521 `searched_none`, dva `not_applicable`, nula `pending`.
- Denník obsahuje 532 priradení vykonaných dotazov ku konkrétnym osobám a 70 časových osí. Časová os uvádza prvé dohľadané zmienky, priebežné správy a odpovede, posledné dostupné pokračovanie a hranicu hľadania výsledku. Nejde o tvrdenie, že boli nájdené všetky existujúce články.
- Doplnené boli podpísané mediálne zmienky štyroch kandidátov na primátora, skorá odpoveď Pavla Čorbu, odpovede účastníkov sporu o Bulvár, reklamu a Park Residence, historické vyjadrenia k nemocnici a nové profesijné či komunitné zmienky.
- Konanie Kuneradu pred ÚVO a správnym súdom je oddelené od trestných správ o Monike Kaveckej. Sankcia z roku 2025 bola uložená obci. Správa o projekte Camase z februára 2026 zostáva pripísaná médiu; netvrdí obvinenie Tomáša Janíka ani konečné rozhodnutie.
- Dohoda ARDSYSTÉM je úkonom spoločnosti; prevod či predaj majetku neukončuje samostatnú trestnú vec. Pri Korytnačke sa zachováva vtedajší neprávoplatný stav policajného rozhodnutia, pri ŽPS podané odvolanie a pri Mirage posledná dohľadaná odpoveď mesta.
- ICJK je uvedené ako autor hodnotenia sponzorovaného príspevku Pavla Slotu; jeho datované doplnenie sa odlišuje od vlastnej odpovede kandidáta. Rozhodnutie Ústavného súdu sa týka petičného výboru, nie osobnej viny kandidáta.

## Opravy pôvodu materiálov

`za-a-sp21-0` je objednaný rozhovor Ľubomíra Bechného; existujúca formulácia teraz obsahuje tento pôvod. `za-b-delincak-media` výslovne vznikol v spolupráci s Branislavom Delinčákom; platba sa z toho nevyvodzuje. `za-b-juris-media` obsahuje označenie PR už v pôvodnom tvrdení, opravený bol typ zdroja na `candidate`. Nové PR materiály Barčíkovej, Kubíka a Marčana sa používajú len ako vlastné programové vyjadrenia. Nový materiál Fiabáneho na SP21 je označený ako Inzercia a použitý ako jeho odpoveď.

Čepecov duel má napriek historickému URL slugu s iným menom správny úplný titulok a obsah; nepodložená oprava titulku nebola vykonaná. Duplicity pôvodných publikácií medzi skupinami sa zlúčili na jeden kanonický zdroj.

## Hranice dokazovania a prístup

Súkromné adresy, celé dátumy narodenia, kontakty, rodinné vzťahy a nesúvisiace zdravotné podrobnosti nie sú súčasťou nových verejných tvrdení. Zámena menovcov, najmä Ivana Magáta, Petra Cibulku a Igora Rybana, je v denníku výslovne vylúčená. Hodnota projektu či výťažok organizácie sa nepovažuje za osobný príjem.

Originály, úplné kópie a vyhľadávacie kvitancie sú mimo Git v `/home/sergey/codex/ovolbach/.research-captures/zilina-media-2026`; denník uchováva cesty a SHA256. Blokovanie HTTP, paywall alebo prázdny JavaScriptový obal nie sú dôkazom obsahu. Použité sú dostupné úplné čítačky vydavateľa, oficiálne dokumenty a bežný verejný článkový payload ICJK. Nedostupné septembrové SME zmienky o Slotovi, nepodpísané zoznamy, agregátory, odhady programov a nejednoznačné registrové záznamy nepodporujú nové tvrdenia. Pri nedohľadanom konečnom výsledku zostáva obmedzenie otvorené; `searched_none` znamená len výsledok zdokumentovaného verejného hľadania k dátumu snímku.

## RED/GREEN a nezávislé preskúmanie

Cielená sada preveruje ochranu záznamov mimo rozsahu, všetkých 128 individuálnych kvitancií, atribúciu PR a odpovedí, neprávoplatné rozhodnutia, subjekt správnej sankcie a hranice súdneho/podnikového výsledku. RED bol zaznamenaný pred príslušnými doplneniami; záverečná úprava presnej odpovede k parkovaniu mala samostatný RED. GREEN: 19 testov, exit 0. Samostatný čitateľ preskúmal tretiu zmrazenú verziu bez ďalších opraviteľných zistení; výsledok je v [nezávislom preskúmaní](zilina-media-2026-review.md) a kontrolné súčty v [manifeste](zilina-media-2026-review-manifest.json). Samostatne overil 19 cielených testov, 83 kvitancií prístupu, štyri skupinové kvitancie, všetkých 128 záznamov a 70 časových osí vrátane 49 existujúcich mediálnych/sporných tvrdení. Automatická kontrola nie je ľudský redakčný ani právny posudok.

## Čerstvé overenia vydania

Všetkých jedenásť požadovaných brán vykonal implementátor na konečných dátach tretej preskúmanej verzie. Každá nižšie uvedená brána má vlastný skutočný exit 0; výsledok pokrytia nenahrádza validáciu vydania. Presné príkazy, logy, SHA256 a úprava tempa prehliadača sú v manifeste. Štyri unit skúšky Nginx sa podľa existujúceho skipIf nevykonali, pretože NGINX_BIN nebol nastavený. Dve výlučne mobilné E2E skúšky sú v desktop projekte preskočené a v mobile vykonané. Nijaký test nebol vyradený kvôli tejto zmene.

| Príkaz | Exit | Výsledok |
| --- | --- | --- |
| `npm test` | 0 | 323 úspešných, 4 zámerne preskočené; 37 úspešných súborov, jeden preskočený |
| `npm run validate:data` | 0 | 1 cyklus, 3 kontexty, 3 publikované; 0 problémov |
| `npm run validate:release` | 0 | 1 cyklus, 3 kontexty, 3 publikované; 0 problémov |
| `npm run report:coverage` | 0 | releaseReady=true; 0 pending; Žilina 135 osôb/1 080 kategórií |
| `npm run build` | 0 | 137 Astro súborov: 0 chýb/upozornení/hintov; 324 HTML; 320 stránok v indexe Pagefind |
| `npm run check:seo` | 0 | 320 indexovateľných kanonických stránok; 3 noindex porovnania; 1 noindex 404 |
| `npm run check:html` | 0 | W3C Nu 26.10.2: 324 HTML, 0 chýb, 0 upozornení |
| `npm run check:storage` | 0 | 0 problémov s nepovoleným ukladaním v prehliadači |
| `npm run check:links` | 0 | 783 URL; 579 HTTP 200, 195 HTTP 206, 8 HTTP 403, 1 HTTP 429; 9 ručných kontrol |
| `npm run test:e2e -- --workers=1 (zdedená konfigurácia, slowMo 50 ms)` | 0 | 166 úspešných, 2 zámerne preskočené; desktop aj mobile; všetkých 168 scenárov |
| `git diff --check` | 0 | 0 chýb bielych znakov |

Deväť stavov HTTP 403/429 je podľa existujúcej kontroly označených na ručné preskúmanie, nie potvrdených ako plne čitateľné týmto HTTP testom. Dva nové blokované zdroje (Johanes a Strieženec na MY/SME) majú samostatne otvorené úplné čítačky vydavateľa a zachytené podklady; sedem ostatných blokovaných zdrojov alebo účtov je mimo tejto úpravy. Kontrola dostupnosti URL nepotvrdzuje obsah článku. Pri ICJK je verejným odkazom čítačka článku; jej bežný verejný payload je iba dokladom prístupu. Pagefind uvádza, že nepodporuje slovenské stemming; ide o existujúce obmedzenie vyhľadávania.

Prvý úplný unit a dátový priechod zlyhal na nesúlade mediálnej kategórie dvoch nových tvrdení s pokrytím a na podreťazci zakázaného výrazu v nadpise. Opravené bolo zaradenie správ Plešingera/Štrbu a neutrálne pomenovanie podania po lehote; validátory ani jazykový filter sa nemenili. Nezávislé preskúmanie tiež odstránilo duplicitnú novú správu o Sokolovi, doplnilo jej ohraničenú časovú os, vrátilo kanonický odkaz ICJK a odstránilo prekonaný hash pracovnej kópie. Nasledoval nový RED/GREEN aj úplný unit/dátový priechod.

Prvý celý E2E priechod mal exit 1: 165 úspešných, dva preskočené a jeden zlyhaný scenár pre 91 nezmenených profilov Liptovského Mikuláša. Chromium hlásil ERR_INSUFFICIENT_RESOURCES; adresné opakovania bez zmeny tempa tiež zachytili ERR_ABORTED a rovnakú chybu zdrojov na rôznych profiloch. Zvýšenie limitu deskriptorov na 65 536 samo nestačilo. Rovnaký scenár prešiel s launchOptions.slowMo=50; potom bol úspešne zopakovaný celý 168-scenárový súbor s jedným workerom. Ignorovaná lokálna konfigurácia dedí pôvodnú konfiguráciu, oba projekty, viewporty a všetky očakávania; iba spomaľuje ovládacie príkazy o 50 ms. Presná vnútorná príčina vyčerpania Chromium nebola potvrdená. Aplikácia, testy ani ich limity sa kvôli tomu nemenili.

Pri E2E boli použité existujúce lokálne Chromium balíky v /tmp/uctomost-browsers a knižnice v /tmp/uctomost-browser-libs/usr/lib/x86_64-linux-gnu. W3C kontrola použila už existujúci lokálny Java runtime. Preview používa port 4321. Pôvodné neúspešné logy aj úspešné opakovania zostali zachované mimo Git. Po zmrazení boli doplnené iba výsledky overení a tieto dokumentačné artefakty; konečné dáta a testové vstupy sa zhodujú s nezávisle preskúmanou verziou.
