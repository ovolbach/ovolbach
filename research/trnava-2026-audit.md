# Trnava 2026 — výskumný audit

Snímka a záverečné overenie: **15. október 2026**. Voľby: **24. október 2026**. Stav mestského manifestu: `published` po uzavretí výskumu, čítaní originálov a nezávislom preskúmaní; technické brány a ich konečné výsledky dokumentuje spoločný audit.

| Položka | Presný počet |
| --- | ---: |
| Osoby | 135 |
| Kandidatúry v rozsahu sprievodcu | 174 |
| Primátor / mestské zastupiteľstvo / predseda kraja / krajské zastupiteľstvo | 6 / 111 / 7 / 50 |
| Atómové tvrdenia | 300 |
| Zdrojové záznamy výskumného návrhu vrátane zdieľaných zdrojov | 141 |
| Pokrytie: found / searched_none / pending | 373 / 707 / 0 |
| Samostatné finančné záznamy | 135 |
| Mestské volebné okrsky | 47 |

Mestské mandáty podľa obvodov: 5 / 6 / 6 / 5 / 4 / 1, spolu 27. Krajský obvod č. 7 má 9 mandátov; jeho zoznam je úplný vrátane obyvateľov ďalších obcí. Štyri miestne kandidátne listiny a celé štyri celoštátne registre boli pred uzavretím opätovne stiahnuté. Všetky ich SHA256 zodpovedajú originálom použitým pri porovnaní každého registrovaného riadka; riadkové dôkazy sú v `trnava-2026-roster.json` a spoločnom `four-cities-2026/official-final-recheck.json`.

Každá osoba má presne osem kategórií. `trnava-2026.json` uchováva skutočné osobné dotazy, čítania originálov a ich odtlačky, dôvody spojenia identity, vylúčené menovce a prístupové hranice. Základné údaje pochádzajú z priamych oficiálnych riadkov. `found` mimo základnej kategórie má prijaté tvrdenie a zdroje; `searched_none` znamená iba nedostatočný nález po dokončenom ohraničenom vyhľadávaní k dátumu snímky. Neznamená neexistenciu údajov.

Financie zahŕňajú aj overené kandidatúry a stranícke nominácie mimo tohto mesta. Neoverený počet obyvateľov alebo neúplný rozsah vyhľadania ponecháva podmienenú povinnosť, nie výnimku. Metóda `register_exclusion` sa nepoužíva. Vlastníctvo osobného účtu, účet strany a prevádzkovanie či výdavky kampane sú odlišné skutočnosti. Spoločné nezávislé porovnanie reprodukovalo 784 prijatých celoštátnych riadkov pre 546 osôb, vylúčilo 100 riadkov menovcov a nezistilo vynechanú stranícku nomináciu.

Oficiálny protokol z 13. októbra potvrdzuje vzdanie sa kandidatúry Ľubice Horváthovej. Registrovaný riadok č. 3 zostáva zachovaný a stav má samostatné datované tvrdenie. Historické výsledky predsedu kraja Berényi/Viskupič 2022 boli osobitne doplnené a presne overené.

Nezávislé posúdenia sú v adresári `four-cities-2026`: trnava-events-accounts-review.json, trnava-business-review.json, trnava-history-review.json. Spoločný `finance-identity-review.json` kontroluje financie a identitu; `export-review.json` kontroluje súkromie, každú oficiálnu kandidatúru a pokrytie. Posúdenia sú automatizované čítajúce kontroly, nie ľudský redakčný alebo právny posudok. Revízie starších snapshotov sa nemenia; neskoršie opravy majú samostatné záznamy vyriešenia.

Surové originály, presné dátumy narodenia, súkromné adresy a bankové transakčné riadky zostávajú mimo sledovaného a verejného exportu. Vyhľadávacie úryvky slúžili iba na objavenie stôp. Dlhé alebo súkromné objavovacie názvy sa neexportujú; ich úplné SHA256 a cesty redakcie ostávajú v denníku. Nové tvrdenia neobsahujú preberané priame citáty (`quote`: 0); používajú neutrálne zdrojované skutkové vety a presnú atribúciu vlastných vyjadrení a správ.

Výsledky príkazov, RED/GREEN, globálne nedostupné staré odkazy a opakované transportné kontroly: [spoločný záverečný audit](four-cities-2026-audit.md). Odtlačky dôkazov: [manifest](four-cities-2026/evidence-manifest.json).
