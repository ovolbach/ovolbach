# Kontrola vydania — 2026-09-19

Publikovaný dátový snímok zostáva k 2026-09-18. Táto kontrola sa týka presunu dát a stránok do kontextu `/liptovsky-mikulas/2026/`, historických volebných výsledkov a opravy odkazov. Nejde o ľudské redakčné ani právne stanovisko.

## Rozsah a výsledky

- 1 cyklus, 1 publikovaný kontext, 91 kandidátov, 576 tvrdení.
- 728 záznamov výskumného pokrytia: `found` 401, `searched_none` 273, `not_applicable` 54, `pending` 0.
- 234 zdrojov a 234 jedinečných HTTPS adries.
- `npm test`: exit 0, 26 súborov a 241 testov úspešných.
- `npm run validate:data`: exit 0, `issues=0`.
- `npm run validate:release`: exit 0, `issues=0`.
- `npm run report:coverage`: exit 0, `releaseReady=true pending=0` (samostatná kontrola).
- `npm run build`: exit 0, 99 statických stránok, kontrola Astro bez chýb a varovaní.
- `npm run check:storage`: exit 0.
- `npm run check:links`: exit 0 po oprave odkazov (samostatná kontrola; test dostupnosti, nie obsahová verifikácia).
- `npm run test:e2e`: exit 0, 96 úspešných, 2 zámerne preskočené testy; jeden ručne spustený preview server bol po teste zastavený a port 4321 už nepočúval.
- `git diff --check`: exit 0.

## Opravy a hranice overenia

Prvá sieťová kontrola našla 10 adries s HTTP 404, všetky medzi novými historickými zdrojmi. Náhradné priame adresy oficiálnych tabuliek a kandidátnych registrov, ako aj článku Bratislavských novín, boli osobitne otvorené (HTTP 200/206); pôvodné nefunkčné adresy sa nepoužívajú. Regresný test pre tieto adresy zlyhal 10/10 pred opravou a prešiel 10/10 po nej. Metadáta článku boli zosúladené s titulkom a dátumom dostupnej stránky; anglický register kandidátov z roku 2006 má pôvodný anglický názov.

Nezávislá automatizovaná read-only kontrola zistila, že súhrnné počty historických volieb nemali pri sebe odkazy na zdroje a započítavali stiahnutú kandidatúru ako účasť. Súhrny teraz pripájajú zdroje podkladových výsledkov a stiahnutie nepočítajú ako účasť; zvolenie nie je nazvané výkonom mandátu. Cielené unit a E2E testy najprv zlyhali a po úprave prešli.

Kontrola dostupnosti adries sama nepotvrdzuje obsah každého historického riadku ani totožnosť každej osoby. Automatizované nezávislé čítanie kontrolovalo vybrané zdroje, nie úplnú manuálnu revíziu všetkých nových historických tvrdení. Žiadne chýbajúce odpovede alebo výsledky sa z nedostupných adries nerekonštruovali.
