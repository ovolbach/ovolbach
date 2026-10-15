# Banská Bystrica 2026 — výskumný audit

Snímka a záverečné overenie: **15. október 2026**. Voľby: **24. október 2026**. Stav mestského manifestu: `published` po uzavretí výskumu, čítaní originálov a nezávislom preskúmaní; technické brány a ich konečné výsledky dokumentuje spoločný audit.

| Položka | Presný počet |
| --- | ---: |
| Osoby | 131 |
| Kandidatúry v rozsahu sprievodcu | 177 |
| Primátor / mestské zastupiteľstvo / predseda kraja / krajské zastupiteľstvo | 6 / 105 / 7 / 59 |
| Atómové tvrdenia | 412 |
| Zdrojové záznamy výskumného návrhu vrátane zdieľaných zdrojov | 232 |
| Pokrytie: found / searched_none / pending | 481 / 567 / 0 |
| Samostatné finančné záznamy | 131 |
| Mestské volebné okrsky | 79 |

Mestské mandáty podľa obvodov: 6 / 2 / 9 / 2 / 7 / 3 / 2, spolu 31. Krajský obvod č. 1 má 8 mandátov; jeho zoznam je úplný vrátane obyvateľov ďalších obcí. Štyri miestne kandidátne listiny a celé štyri celoštátne registre boli pred uzavretím opätovne stiahnuté. Všetky ich SHA256 zodpovedajú originálom použitým pri porovnaní každého registrovaného riadka; riadkové dôkazy sú v `banska-bystrica-2026-roster.json` a spoločnom `four-cities-2026/official-final-recheck.json`.

Každá osoba má presne osem kategórií. `banska-bystrica-2026.json` uchováva skutočné osobné dotazy, čítania originálov a ich odtlačky, dôvody spojenia identity, vylúčené menovce a prístupové hranice. Základné údaje pochádzajú z priamych oficiálnych riadkov. `found` mimo základnej kategórie má prijaté tvrdenie a zdroje; `searched_none` znamená iba nedostatočný nález po dokončenom ohraničenom vyhľadávaní k dátumu snímky. Neznamená neexistenciu údajov.

Financie zahŕňajú aj overené kandidatúry a stranícke nominácie mimo tohto mesta. Neoverený počet obyvateľov alebo neúplný rozsah vyhľadania ponecháva podmienenú povinnosť, nie výnimku. Metóda `register_exclusion` sa nepoužíva. Vlastníctvo osobného účtu, účet strany a prevádzkovanie či výdavky kampane sú odlišné skutočnosti. Spoločné nezávislé porovnanie reprodukovalo 784 prijatých celoštátnych riadkov pre 546 osôb, vylúčilo 100 riadkov menovcov a nezistilo vynechanú stranícku nomináciu.

Správa TASR/STVR o Tomášovi Sobotovi ostáva mediálnou správou; bez potvrdenia volebnej komisie sa registrovaný riadok neodstraňuje. Všetkých 79 okrskov bolo ručne prepísaných zo štyroch strán PDF; explicitné hlavičky potvrdzujú priradenie 12/6/23/6/17/8/7 k siedmim obvodom. Riadok 17 zachováva Němcovej a riadok 21 tlačené Ďumbier 17. Sedem krajských originálov bolo opätovne získaných s overeným TLS reťazcom; všetky zodpovedajú pôvodným telám aj textom.

Nezávislé posúdenia sú v adresári `four-cities-2026`: banska-bystrica-events-accounts-review.json, banska-bystrica-media-review.json, banska-bystrica-polling-review.json, banska-bystrica-tls-review.json. Spoločný `finance-identity-review.json` kontroluje financie a identitu; `export-review.json` kontroluje súkromie, každú oficiálnu kandidatúru a pokrytie. Posúdenia sú automatizované čítajúce kontroly, nie ľudský redakčný alebo právny posudok. Revízie starších snapshotov sa nemenia; neskoršie opravy majú samostatné záznamy vyriešenia.

Surové originály, presné dátumy narodenia, súkromné adresy a bankové transakčné riadky zostávajú mimo sledovaného a verejného exportu. Vyhľadávacie úryvky slúžili iba na objavenie stôp. Dlhé alebo súkromné objavovacie názvy sa neexportujú; ich úplné SHA256 a cesty redakcie ostávajú v denníku. Nové tvrdenia neobsahujú preberané priame citáty (`quote`: 0); používajú neutrálne zdrojované skutkové vety a presnú atribúciu vlastných vyjadrení a správ.

Výsledky príkazov, RED/GREEN, globálne nedostupné staré odkazy a opakované transportné kontroly: [spoločný záverečný audit](four-cities-2026-audit.md). Odtlačky dôkazov: [manifest](four-cities-2026/evidence-manifest.json).
