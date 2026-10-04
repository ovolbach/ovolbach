# Integrácia Žiliny do main — 4. október 2026

Zlúčenie spája main `3f278fd3b9b95e509aa12b6834430c541ebf64c5` a Žilinu `23ebba0b225dbc8486e628cee3abbcef3e5326f0`. Verejná snímka zostáva **2026-10-03**. Nevznikli nové verejné tvrdenia ani skutkové opravy.

Deväť JSON kolekcií presne zodpovedá trojcestnému zlúčeniu podľa ID; voľby používajú `contestId`. Overenie potvrdilo nula sémantických konfliktov a zachovanie rodičovských záznamov. Čistý merge strom má štyri mestské kontexty, 408 osôb, 535 kandidatúr, 2319 tvrdení, 3264 záznamov pokrytia a 950 zdrojov. Každá osoba má osem kategórií a nula `pending`. README a testy zachovávajú obe mestá; pôvodné historické audity Žiliny sa nemenili.

Ochrana údajov kontroluje pôvodné záznamy namiesto celých rastúcich kolekcií. Pripúšťa iba presné opravy z dokončených auditov. Nezávislý čítajúci recenzent `/root/zilina_main_merge_review` našiel P2: prvý návrh pomocníka mohol prijať starú hodnotu namiesto povinnej opravy. Regresný test najprv zlyhal (1 failed, 1 passed, exit 1), potom prešlo 41 cielených testov. Pomocník teraz odmieta nahradené pôvodné aj medziľahlé hodnoty a obnovu odstránených záznamov. Opakované posúdenie P2 uzavrelo bez nových nálezov a overilo 18 kontrolných súčtov. Dátové zlúčenie recenzent nezávisle potvrdil.

## Samostatné brány čistého merge stromu

| Príkaz | Exit | Výsledok |
| --- | --- | --- |
| `npm test` | 0 | 358 passed, 4 skipped; 42 passed files, 1 skipped |
| `npm run validate:data` | 0 | cycles=1 contexts=4 published=4 issues=0 |
| `npm run validate:release` | 0 | cycles=1 contexts=4 published=4 issues=0 |
| `npm run report:coverage` | 0 | 408 candidates; 3264 coverage records; releaseReady=true; pending=0 |
| `npm run build` | 0 | 448 canonical indexable pages, 453 HTML files; no Astro errors/warnings/hints |
| `npm run check:seo` | 0 | 448 canonical indexable, 4 noindex comparison tools, 1 noindex 404 |
| `VNU_JAVA=/home/sergey/codex/ovolbach/ovolbach/.superpowers/vnu/vnu-runtime-image/bin/java npm run check:html` | 0 | 453 HTML files; W3C Nu Checker 26.10.2: 0 errors, 0 warnings |
| `npm run check:storage` | 0 | exit 0 |
| `npm run check:links` | 0 | 975 URLs: 716 HTTP200, 241 HTTP206, 17 HTTP403, 1 HTTP429; 18 manual review, no transport failures |
| `ulimit -n 65536; PLAYWRIGHT_BROWSERS_PATH=/tmp/uctomost-browsers LD_LIBRARY_PATH=/tmp/uctomost-browser-libs/usr/lib/x86_64-linux-gnu npm run test:e2e -- --config=.superpowers/sdd/2026-10-04-zilina-main-merge/playwright-shm.config.ts --workers=1` | 0 | 188 passed, 2 skipped; 190 original desktop/mobile cases, no retries |
| `git diff --check` | 0 | exit 0 |

Doplnkové `npm run check` skončilo s exit 0: 144 súborov, 0 errors/warnings/hints. `git diff --cached --check` tiež prešlo. Presné logy a SHA-256 sú v sprievodnom manifeste. Strojový HTML výsledok sa uchováva mimo dočasného priečinka Playwright.

Štyri vynechané unit testy Nginx vyžadujú nenastavený `NGINX_BIN`. Dve E2E kontroly mobilného rozloženia sa štandardne preskočia na desktope a vykonajú na mobile.

Prvý E2E beh skončil s 185 úspešnými testami, dvoma preskokmi a tromi navigačnými chybami Chromium pri dlhých obchodoch profilov. Diagnostický beh týchto troch scenárov prešiel po odstránení predvoleného `--disable-dev-shm-usage`; potom prešlo všetkých 190 pôvodných scenárov (188 passed, 2 skipped, exit 0). Pomocná lokálna konfigurácia ponecháva pôvodné testy, projekty, timeouty a tvrdenia. Používa `slowMo: 50`, jedného workera a limit 65536 deskriptorov. Príčina prostredia nie je definitívne dokázaná; neúspešný log zostáva zachovaný. Opakovaná HTML kontrola bez `VNU_JAVA` zlyhala pri extrakcii automatickej inštalácie; s existujúcim oficiálnym Nu Checker následne skontrolovala všetkých 453 HTML bez chýb alebo upozornení.

HTTP dostupnosť sama nepotvrdzuje obsah. Sedemnásť odpovedí 403 a jedna 429 zostávajú na ručné posúdenie; obmedzenia pôvodných výskumných auditov platia naďalej. Automatizované posúdenie nie je ľudský redakčný ani právny posudok.

## Nezakommitovaná práca hlavného checkout

Pred presunom bolo mimo Git zálohovaných 20 upravených sledovaných a 21 nesledovaných súborov Dolného Kubína a Ružomberka. Tieto zmeny nie sú súčasťou merge commitu. Plán obnovy zachováva oba dátové príspevky a päť miest bez konfliktov hodnôt. Spoločné oficiálne CSV volieb NR SR 2023 má jednu canonical URL: lokálny `dk-national-elected-2023-csv` sa odkazuje na schválený `za-a-nrsr-2023-tab06`. Dve lokálne fixture menia iba osem referencií zdroja; výsledkové výroky, dátumy a skutkové hodnoty sa nemenia.

Pôvodný nezakommitovaný checkout mal päť zlyhaní unit testov: chronológia Dolného Kubína, zachovanie jeho sprievodcov, ochrana pôvodných záznamov Martina, počet tvrdení existujúcich miest v Martin teste a menovci v SEO slugs. Osobitná kópia obnovy mala rovnakých päť zlyhaní a navyše ochranu Žiliny, ktorá zachytila ten istý nesúlad spoločnej coverage položky. Tieto nedokončené lokálne testy sa nepovažujú za úspešné brány čistého merge stromu. Samotné zlúčenie sa overilo osobitne.

Skutočný presun main a zachovanie pracovných súborov sa doložia externým potvrdením v `/home/sergey/codex/ovolbach/.research-captures/zilina-main-merge-2026`; pôvodná záloha zostáva dostupná.
