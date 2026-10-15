# Trenčín 2026 — výskumný audit

Snímka a záverečné overenie: **15. október 2026**. Voľby: **24. október 2026**. Stav mestského manifestu: `published` po uzavretí výskumu, čítaní originálov a nezávislom preskúmaní; technické brány a ich konečné výsledky dokumentuje spoločný audit.

| Položka | Presný počet |
| --- | ---: |
| Osoby | 114 |
| Kandidatúry v rozsahu sprievodcu | 138 |
| Primátor / mestské zastupiteľstvo / predseda kraja / krajské zastupiteľstvo | 4 / 78 / 4 / 52 |
| Atómové tvrdenia | 366 |
| Zdrojové záznamy výskumného návrhu vrátane zdieľaných zdrojov | 192 |
| Pokrytie: found / searched_none / pending | 404 / 508 / 0 |
| Samostatné finančné záznamy | 114 |
| Mestské volebné okrsky | 52 |

Mestské mandáty podľa obvodov: 6 / 7 / 7 / 5, spolu 25. Krajský obvod č. 9 má 9 mandátov; jeho zoznam je úplný vrátane obyvateľov ďalších obcí. Štyri miestne kandidátne listiny a celé štyri celoštátne registre boli pred uzavretím opätovne stiahnuté. Všetky ich SHA256 zodpovedajú originálom použitým pri porovnaní každého registrovaného riadka; riadkové dôkazy sú v `trencin-2026-roster.json` a spoločnom `four-cities-2026/official-final-recheck.json`.

Každá osoba má presne osem kategórií. `trencin-2026.json` uchováva skutočné osobné dotazy, čítania originálov a ich odtlačky, dôvody spojenia identity, vylúčené menovce a prístupové hranice. Základné údaje pochádzajú z priamych oficiálnych riadkov. `found` mimo základnej kategórie má prijaté tvrdenie a zdroje; `searched_none` znamená iba nedostatočný nález po dokončenom ohraničenom vyhľadávaní k dátumu snímky. Neznamená neexistenciu údajov.

Financie zahŕňajú aj overené kandidatúry a stranícke nominácie mimo tohto mesta. Neoverený počet obyvateľov alebo neúplný rozsah vyhľadania ponecháva podmienenú povinnosť, nie výnimku. Metóda `register_exclusion` sa nepoužíva. Vlastníctvo osobného účtu, účet strany a prevádzkovanie či výdavky kampane sú odlišné skutočnosti. Spoločné nezávislé porovnanie reprodukovalo 784 prijatých celoštátnych riadkov pre 546 osôb, vylúčilo 100 riadkov menovcov a nezistilo vynechanú stranícku nomináciu.

Nepodložené odvodenie vymenovania z úvodnej stránky ministerstva aj zamestnávateľ bez druhého identifikačného mosta boli odstránené. Mičegov vlastný web potvrdzuje IBAN; banková URL sa z neho nekonštruuje. Dátum schválenia zápisnice sa nepoužíva ako dátum publikácie.

Nezávislé posúdenia sú v adresári `four-cities-2026`: trencin-events-finance-review.json, trencin-final-identity-review.json. Spoločný `finance-identity-review.json` kontroluje financie a identitu; `export-review.json` kontroluje súkromie, každú oficiálnu kandidatúru a pokrytie. Posúdenia sú automatizované čítajúce kontroly, nie ľudský redakčný alebo právny posudok. Revízie starších snapshotov sa nemenia; neskoršie opravy majú samostatné záznamy vyriešenia.

Surové originály, presné dátumy narodenia, súkromné adresy a bankové transakčné riadky zostávajú mimo sledovaného a verejného exportu. Vyhľadávacie úryvky slúžili iba na objavenie stôp. Dlhé alebo súkromné objavovacie názvy sa neexportujú; ich úplné SHA256 a cesty redakcie ostávajú v denníku. Nové tvrdenia neobsahujú preberané priame citáty (`quote`: 0); používajú neutrálne zdrojované skutkové vety a presnú atribúciu vlastných vyjadrení a správ.

Výsledky príkazov, RED/GREEN, globálne nedostupné staré odkazy a opakované transportné kontroly: [spoločný záverečný audit](four-cities-2026-audit.md). Odtlačky dôkazov: [manifest](four-cities-2026/evidence-manifest.json).
