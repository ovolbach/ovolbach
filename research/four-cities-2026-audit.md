# Štyri nové mestá 2026 — záverečný audit

Výskum a snímka: **15. október 2026**. Voľby: **24. október 2026**. Zmena pridáva Trnavu, Trenčín, Nitru a Banskú Bystricu; základ je commit `07dbcae`. Pôvodných 27 cyklových súborov a všetkých 1 828 existujúcich zdrojových záznamov zostáva bez zmeny vrátane dátumov snímok. Regresné testy overujú každý pôvodný SHA256.

| Mesto / kraj | Osoby | Kandidatúry: primátor / MsZ / predseda / kraj | Tvrdenia | Zdroje návrhu | found / searched_none |
| --- | ---: | --- | ---: | ---: | --- |
| Trnava / trnavsky-kraj | 135 | 6 / 111 / 7 / 50 = 174 | 300 | 141 | 373 / 707 |
| Trenčín / trenciansky-kraj | 114 | 4 / 78 / 4 / 52 = 138 | 366 | 192 | 404 / 508 |
| Nitra / nitriansky-kraj | 166 | 4 / 123 / 7 / 89 = 223 | 593 | 295 | 466 / 862 |
| Banská Bystrica / banskobystricky-kraj | 131 | 6 / 105 / 7 / 59 = 177 | 412 | 232 | 481 / 567 |
| Spolu | **546** | **20 / 417 / 25 / 250 = 712** | **1 671** | zdieľané zdroje sa nesčítavajú | **1 724 / 2 644** |

Pridaných je **793 jedinečných globálnych zdrojových záznamov**, spolu ich je 2 621. Zdrojové počty návrhov zahŕňajú zdieľané existujúce originály. Každá osoba má presne osem kategórií: spolu **4 368**, z toho **0 pending** a 0 `not_applicable`. Financie majú 546 samostatných záznamov. Výstup publikuje šesť krajov, jedenásť miest a 1 326 jedinečných profilových adries; 43 predsedníckych profilov je zdieľaných v rámci kraja a zachováva všetky overené miestne kandidatúry. Nové mestá majú spolu 252 okrskov (47/52/74/79).

## Výskumné dôkazy a rozsah

Šestnásť miestnych kandidátnych PDF a všetky štyri celoštátne XLSX registre boli pred uzavretím znovu získané; všetky telá majú rovnaký SHA256 ako pri úplnom riadkovom porovnaní. Priame krajské originály NSK sú navyše bajtovo totožné s mestskými kópiami. Overené boli zodpovedné mestské aj krajské indexy, opravy a oznámenia vzdania sa kandidatúry. Registrované riadky sa pri neskoršej správe o vzdaní nevymazávajú. Trnavský protokol z 13. októbra potvrdzuje Ľubicu Horváthovú, č.3; správa TASR/STVR o Tomášovi Sobotovi je oddelená mediálna atribúcia bez vymysleného formálneho potvrdenia komisie.

Krajské obvody 7/9/3/1 obsahujú úplné zoznamy 50/52/89/59 osôb bez filtra bydliska na mesto; mandáty sú 9/9/13/8. Mestské obvody majú 27/25/31/31 mandátov. Nitra: všetkých 22 strán rozpisu 74 okrskov bolo vizuálne prečítaných, vrátane opravy 28/29 a vstupu z Petzwalovej ulice. Banská Bystrica: všetky štyri strany a 79 riadkov boli nezávisle skontrolované; explicitné hlavičky určujú skupiny 12/6/23/6/17/8/7. Tlačené odlišnosti Němcovej/Ďumbier 17 sa zachovávajú. Októbrové oznámenie neodôvodňuje žiadnu ďalšiu odvodenú zmenu adresy.

Denníky `research/{mesto}-2026.json` uchovávajú skutočné dotazy, originálne čítania/SHA256, dôvody spojenia identity, vylúčené menovce a prístupové hranice. Základná kategória vychádza z priameho úradného porovnania; sedem ďalších kategórií a financie majú spolu 4 368 základných osobných dotazov. Ďalšie cielené dotazy majú vlastné účtenky v `actual-query-receipts.json`; opakované referencie na jednu odpoveď sa nepočítajú ako nové volania. `searched_none` je dokončené ohraničené hľadanie k dátumu snímky, nikdy tvrdenie o neexistencii informácií. Neprijaté sľubné stopy boli rozhodnuté jednotlivo; platené, neprístupné a identifikačne nejednoznačné materiály sa nenahrádzajú úryvkami vyhľadávača.

Nezávislé celoštátne finančné porovnanie reprodukovalo 784 prijatých riadkov,100 vylúčených riadkov menovcov a 0 vynechaných straníckych nominácií pre 546 osôb. Právne povinnosti zohľadňujú aj kandidatúry mimo sprievodcu. Neznámy počet obyvateľov alebo neúplný rozsah ostáva výslovnou podmienkou; výnimka `register_exclusion` sa na nový súbor nepoužíva. Mičegov vlastný web dokladá IBAN bez konštruovanej bankovej URL. Pri dvoch straníckych odkazoch bol po nezávislom porovnaní doslovného úradného href odstránený iba vonkajší biely znak; IBAN a fragment zostali presné.

## Nezávislé preskúmanie a opravy

Čítajúce kontroly overili identitu, finančné spojenia, vlastné osobné bloky obchodných registrov, historické výsledky a legendy, mediálne originály, odpovede a posledné doložené procesné štádiá. Preskúmané sú všetky nové rizikové udalosti; Nitra samostatne 29 tvrdení/10 osôb/17 originálov, Trenčín 16 udalostných tvrdení, Trnava 20 a Banská Bystrica 27. Priame preberané citáty typu `quote`:0; verejné vety sú neutrálne atómové preformulovania doložených faktov s atribúciou.

Opravy uzavreli rozdelenie Bodisových troch pracovných vzťahov a dvoch Vnukových funkcií PPA, samostatné vyhlásenie konkurzu/oddlženie, presné náhradnícke a späťvzaté výsledky, doplnenie dvoch predsedníckych výsledkov TTSK 2022, odstránenie nepodloženého odvodenia vládneho vymenovania a zamestnávateľa Švehlu, odlíšenie dátumov rozhodnutia a publikácie aj opravu zdrojových titulov/vydavateľov. Stabilné existujúce zdrojové ID a metadáta sa nemenili. Päť URL opráv CSRT bolo prijatých iba po opätovnom získaní a porovnaní celého normalizovaného textu; významové a podpisové parametre sa neskracovali.

Posúdenia a samostatné záznamy vyriešenia sú v [balíku dôkazov](four-cities-2026/evidence-manifest.json); [záverečná kontrola exportov](four-cities-2026/export-review.json) a [kontrola posledných zmien](four-cities-2026/final-delta-review.json) majú 0 otvorených zistení. Ich hashe označujú presný kontrolovaný medzisnímok; neskoršie opravy majú vlastné dôkazy. Automatizované nezávislé posúdenie nie je ľudský redakčný ani právny posudok.

Surové originály, súkromné adresy, úplné dátumy narodenia a bankové transakcie ostávajú mimo sledovaného/verejného exportu. Objavovacie názvy s kopírovaným obsahom sa neexportujú; denník uchováva cesty redakcie, SHA256 pôvodných hodnôt a presný odtlačok súkromného denníka. Verejné zdrojové názvy zostávajú názvami dokumentov; API index bez vlastného titulu má stručný opis namiesto omylom vloženého celého JSON tela.

## Samostatné čerstvé technické brány

| Presný príkaz | Exit | Výsledok |
| --- | ---: | --- |
| `NGINX_BIN=/tmp/ovolbach-nginx/extracted/usr/sbin/nginx npm test` | 0 | 520 passed, 0 skipped; 63 files; real nginx tests enabled. |
| `npm run validate:data` | 0 | cycles=6 contexts=11 published=11 regional=6 issues=0 |
| `npm run validate:release` | 0 | cycles=6 contexts=11 published=11 regional=6 issues=0 |
| `npm run report:coverage` | 0 | releaseReady=true pending=0; all eight categories per person. |
| `npm run build` | 0 | 1397 HTML files; 1379 indexable pages; Astro 0 errors/warnings/hints; Pagefind sk. |
| `npm run check:seo` | 0 | 1379 canonical indexable; 17 noindex comparison tools; 1 noindex 404. |
| `VNU_JAVA=/home/sergey/codex/ovolbach/ovolbach/.superpowers/vnu/vnu-runtime-image/bin/java npm run check:html` | 0 | Nu Checker 26.10.2:1397 HTML,0 errors,0 warnings. |
| `npm run check:storage` | 0 | No prohibited persistence, tracking, unlicensed markup or public editorial labels. |
| `npm run check:links` | 1 | 2668 initial URL groups:30 failures;49 manual-review statuses. Recovery 23;7 unchanged old sources remain unavailable. Four delta checks cover final URLs. |
| `CI=1 PLAYWRIGHT_BROWSERS_PATH=/tmp/uctomost-browsers LD_LIBRARY_PATH=/tmp/uctomost-browser-libs/usr/lib/x86_64-linux-gnu npm run test:e2e -- --config=.internal/playwright-four-cities.config.ts --workers=2 --timeout=120000 --max-failures=1` | 0 | 292 passed,2 desktop-only mobile-layout skips;294 original+new cases,0 retries. |
| `NGINX_BIN=/tmp/ovolbach-nginx/extracted/usr/sbin/nginx npm run check:redirects` | 0 | 294 redirects/49 old routes;43 shared chair profiles 200;unknown routes 404. |
| `git diff --check` | 0 | No whitespace errors. |

Prehliadače používali práve tento checkout a jeho konečnú čerstvú zostavu na vyhradenom porte 45479. Lokálna konfigurácia zachováva všetky pôvodné súbory, desktop/mobile projekty a obsahové tvrdenia; mení port, pracovný adresár a explicitný 120-sekundový limit. Dva preskoky sú pôvodné mobilné porovnávacie rozloženia v desktop projekte a vykonali sa v mobile. V konečnom behu nie sú opakovania. Metadáta dát a výsledky sú v [strojovom manifeste](four-cities-2026/verification.json), HTML report v `html-validation.json`. SHA256 surových logov sú v `verification-log-receipts.json`; surové logy ostávajú mimo Git, lebo RED výstup pred redakciou môže obsahovať súkromné údaje.

## Neúspešné pokusy, RED/GREEN a hranice

Pred zmenou dát zlyhalo 8 kontrol chýbajúcich miest. Zachované sú RED/GREEN pre presný historický výsledok náhradníka a Viskupiča, oddelené procesné rozhodnutia, Nitra 28/29, zdrojové a identifikačné spojenia, IBAN bez vymyslenej URL, súkromie,79 BB okrskov, API-titul a dva stranícke odkazy. Unicode hranice redakčného strážcu povoľujú riadne mená Skorec/Modranka a naďalej odmietajú hodnotiace označenia;63 cielených testov prešlo. Kontrola verejného textu má 30-sekundový testovací limit pre zväčšený reálny register, nezmenené obsahové tvrdenia a nulový nález.

Prvý sandboxový unit beh mal 473 pass/3 socketové chyby/4 preskoky; sieťovo povolený základ 476 pass/4 preskoky. Po publikovaní zlyhalo jedno očakávanie starého počtu miest; po úprave zoznamu na 11 sa pri paralelnej HTML validácii objavil samostatný 5-sekundový CLI timeout. Izolovaný beh 519 testov prešiel, konečný rozšírený beh 520 tiež. Žiadne staré dátové overenie nebolo vypnuté.

Prvý E 2 E neprešiel čakaním na štandardný port 4321: ten obsadzoval iný existujúci preview s 404; proces nebol zastavený. Oddelený port odstránil tento problém. Nasledovala oprava ESM načítania novej JSON fixture. Beh s 10 neaktuálnymi očakávaniami (8 porovnaní počítalo aj mobilnú kópiu;2 globálne dátumy čakali 14.10.) bol zastavený po 182 pass,2 skip,1 interrupted,99 notrun; exit 130. Následný beh 2 workerov skončil 180 pass/1 AXE timeout 30 s/1 interrupted/110 notrun/2 skip, exit 1. Dotknutá stránka `/zilina/2026/zdroje/` potom prešla samostatne s 1 workerom/120 s za 35,1 s. Príčina času sa definitívne nepripisuje iba CPU konkurencii. Konečný úplný beh s explicitným limitom prešiel 292 pass/2 skip,exit 0. Obsahové a prístupové tvrdenia zostali zachované.

Globálna brána odkazov ostáva **exit 1**. Pôvodných 2 668 URL malo 2 111 HTTP 200,477 HTTP 206,1 HTTP 202,48 HTTP 403,1 HTTP 429,5 HTTP 503,1 HTTP 404 a 24 transportných chýb. HTTP 403/429 je 49 ručných kontrol, nie automatické obsahové schválenie. Následný opakovaný beh obnovil 23 z 30 neúspešných adries; všetky nové originály boli znovu získané a overené. Pre BBSK chýbal serverom posielaný medzičlánokGeoTrust; jeho podpis overil systémový dôveryhodný koreň a všetkých 7 originálov bolo znovu načítaných s aktívnym overením názvu hosta aj certifikačnej reťaze. Telá a celé texty sú identické. Pätnásť nových timeoutovNR SR sa obnovilo pri opakovaní; stará stránka školy sa tiež obnovila. Pôvodný neúspešný výsledok sa nemení na úspešný.

Naďalej nedostupné sú iba nezmenené staré zdroje: päť stránok `lubokuban.sk` (HTTP 503: profily Dubravec/Páleš/Stupák/Betko a program), `mt-city-polling-2026` (HTTP 404) a `za-c-slysko-programme` (DNS). Sú uvedené jednotlivo v `external-links-recovery-results.json`; ich staré tvrdenia a dátumy sa v tejto práci neupravovali. Štyri dodatočné overeniaURL pokrývajú dve nové stranícke stránky a konečné normalizované bankové odkazy. [Úplný dôkaz pokrytia](four-cities-2026/external-link-coverage.json) má 0 neoverených konečnýchURL; dve staré podoby s vonkajšímNBSP sú vyradené iba z konečných href.

Pokrytie je uzavreté k snímke, nie záruka budúcej dostupnosti alebo úplnosti sveta verejných informácií. Nezistená odpoveď, výsledok konania, počet obyvateľov ani prevádzkovateľ kampane sa nedopĺňa odhadom. Verejný jazyk zostáva slovenčina, schémy a verejné API sa nerozširujú.

## Prenos do hlavného lokálneho checkoutu

Po dokončení kontrol bolo 102 presne overených pracovných súborov prenesených do pôvodne čistého hlavného checkoutu na základe `07dbcae`; história Git sa nemenila. V hlavnom checkoutu znovu prešlo **520 unit testov** a čerstvý `npm run build`. Všetkých **1397 HTML** a všetok JavaScript/CSS sú bajtovo totožné s úplne overeným E2E výstupom. Pri opätovnej tvorbe sa líšilo iba sedem generovaných Pagefind metadata/filter súborov; tieto rozdiely sú zaznamenané a nezamieňajú sa za bitovú totožnosť celého buildu.

Nad touto čerstvou hlavnou zostavou preto samostatne prešlo ďalších **60 E2E kontrol, 0 preskokov**, vrátane všetkých štyroch nových miest, krajských profilov, porovnania, vyhľadávania a izolačných kontrol všetkých šiestich krajov, mobilnej dostupnosti a stránok bez JavaScriptu. [Dôkaz hlavného checkoutu](four-cities-2026/main-checkout-verification.json) uvádza presné príkazy, výsledky a odtlačky logov. Obsah a SHA256 dočasnej lokálnej Playwright konfigurácie sú uložené vo `verification.json`, aby bol presný príkaz reprodukovateľný. Surové originály a súkromné logy zostávajú mimo exportu.
