# Kontrola histórie volieb od roku 2000 v štyroch mestách

Verejný rez: 15. 10. 2026. Overená skupina: 496 osôb, 624 aktuálnych kandidatúr a 3968 záznamov pokrytia. Priama kontrola 24 pravidelných kombinácií funkcie a cyklu tvorí 11904 osobných kontrol; dodatkové voľby sa vedú osobitne. Doplnených bolo 333 výsledkov a opravených 29 statusov na náhradníka. Pôvodné audity sú zachované.

| Mesto | Osoby | Aktuálne kandidatúry | Nové výsledky | Opravy statusu | Vylúčené zhody | Zadržané zhody |
|---|---:|---:|---:|---:|---:|---:|
|Prešov|217|269|133|0|93|265|
|Poprad|114|144|45|0|25|110|
|Martin|124|155|140|29|39|104|
|Dolný Kubín|59|74|19|3|16|24|

Mestské pohľady sa prekrývajú cez spoločných kandidátov na predsedu kraja; súčty stĺpcov preto nie sú jedinečné celkové počty. Podrobné prírastky a úplné opravy before/after sú v [city-reports.json](city-reports.json) a [hlavnom audite](../four-cities-history-2000-recheck.json). Každý prijatý riadok vrátane identity, hlasov, dátumu a súradníc originálu je v [accepted-roster.json](accepted-roster.json).

## Overené opravy a výnimky

- Patrik Tomič 2010: mestská kronika potvrdzuje vzdanie sa kandidatúry; 59 hlasov z centrálnej tabuľky ostáva uvedených, ale výsledok sa nezapočíta medzi účasti.
- Martin 2010: nezávislá obrazová kontrola odhalila desať vynechaných výsledkov. Opakované OCR fragmenty jednej tabuľkovej bunky sa zlučujú podľa strany, riadka a hlasov. Dve nekompatibilné historické vekové zhody sú vylúčené.
- Peter Török 2014 ostáva zadržaný pre nejasný referenčný deň veku. Pri prijatých vekových spojeniach test overuje aj spoločný prienik možných dátumov narodenia naprieč cyklami.
- Zápis 2005 „žilinksy kraj“ bol porovnaný so správne označenou samostatnou tabuľkou zvolených. Žiadny výsledok sa nepripísal iba podľa mena.
- Zdokumentované zmeny spoločných krajských profilov sa premietajú do všetkých siedmich dotknutých mestských rezov. Dátumy ostatných kategórií a ich údaje ostali zachované.

## Archívne medzery

### Prešov

- Úplné celoštátne zoznamy neúspešných a stiahnutých komunálnych kandidatúr z rokov 2002/2006/2010 sa v otvorenom centrálnom archíve nenašli. Kroniky dopĺňajú iba výslovne uvedené výsledky; kronika 2002 neobsahuje úplný menný výsledok poslancov.
- Časť výsledkov poslancov 2014 zostáva zadržaná, pretože v otvorených podkladoch nebol potvrdený presný osobitný status.

### Poprad

- Staré mestské a centrálne archívy neposkytujú úplné kandidátne zoznamy a výsledky poslancov 2002/2006/2010.
- Zoznamy kandidátov 2018 a uverejnenie zvolených boli otvorené; pri niektorých nezvolených chýba potvrdený zoznam náhradníkov. Samotný príznak nezvolenia sa nemení na náhradníka.

### Martin

- Zápisnica a vyhlásenie kandidatúry 2010 boli porovnané vrátane obrazových strán. Plné komunálne podklady 2002/2006 a niektoré historické kandidátne listiny iných obcí chýbajú.
- Peter Török 2014: vyhlásenie z 8. 10. 2014 uvádza 46 rokov, 2018 uvádza 51. Pri predpoklade veku ku dňu volieb sú intervaly nezlučiteľné; nie je potvrdené, ku ktorému dňu sa vek 2014 vzťahuje. Nový výsledok 2014 sa nezverejňuje; nejde o dôkaz menovca.
- Zdenka Lacková 2010 vek 60 a Bibiana Panisová 2010 vek 38 sú vylúčené pre nesúlad s aktuálnym vekom 59/55. Juraj Diabelko 2010/2014: zmenu obce Martin→Vrútky nenahrádza domnienka o trvalom pobyte; spojenie používa vek a úplnú konkrétnu stranu SMER-SD, overenú aj v riadku 2022 spojenom cez vek a obec.

### Dolný Kubín

- Pri komunálnych cykloch 2002/2006/2010 chýbajú úplné zoznamy všetkých kandidátov s overiteľnými identifikačnými znakmi. Priezviská v starých zápisniciach samy nestačia na spojenie.
- Oficiálna história Malatinej uvádza pre rok 2014 dátum 24. 11.; výsledok používa dátum celoštátneho volebného zdroja 15. 11. 2014. Nevyvodzuje sa nepretržitý výkon funkcie.

### Spoločné hranice

- Celoštátne tabuľky 2001 a časť 2009 nemajú potrebný vek alebo obec pri každom výsledku. Mená bez dvoch ďalších znakov zostávajú zadržané.
- Doplňujúce voľby: otvorených 58 rodín dátum/funkcia. Staré zoznamy 2007–2014 sú iba zvolení starostovia; úplné rady, nezvolení a stiahnutí chýbajú. Úplnosť dodatkov 2000–2006 sa nepotvrdila.
- Krajské druhé kolá 2001/2005/2009/2013 sa zlučujú do jednej súťaže. Stiahnuté kandidatúry sa nezapočítavajú.
- Samostatné kohorty Žiliny a Ružomberka neboli rozšírené. Zmeny spoločných krajských kandidátov sa prejavia aj v ich pohľadoch a v Liptovskom Mikuláši.
- Zachovaný výsledok Igora Chomu 2018 v Žiline: zdroj potvrdzuje nezvolenie a identita má vek/obec; presný podtyp náhradníka nebol pri tejto kontrole potvrdený. Je oddelený v retained-results.json a nie je označený za nové úplné zosúladenie.

## Kontroly a dohľadateľnosť

Výsledky príkazov, návraty a samostatná kontrola odkazov sú v [verification.json](verification.json). Nezávislá kontrola a presné rozhodnutia sú v [independent-review.json](independent-review.json). Výsledok searched_none znamená iba „v zdokumentovaných verejných podkladoch sa prijateľný údaj nenašiel“, nie neprítomnosť kandidatúry. Originály so súkromnými adresami sú mimo verejného exportu; audit uchováva nevyhnutné riadky aSHA-256. Stránka nebola nasadená.

## Rozhodnutia pri kontrole

- Na objavenie zhôd sa normalizujú mená; na prijatie je potrebné meno a dva odlišné ďalšie znaky. Vek s rovnakým krajským obvodom nepotvrdzuje historické bydlisko.
- Pri zhodnom pôvodnom výsledku sa zachováva schválené znenie a pôvodné odkazy. Nové doklady a ich odtlačky sú v audite.
- Spoločné krajské profily vyžadujú rovnaký verejný rez vo všetkých dotknutých mestských pohľadoch; dátumy ostatných kategórií sa tým nemenia.
- Nejasný vek, menovec alebo nepomenovaný príznak nezvolenia sa nenahrádza domnienkou. Neúplný archív nepotvrdzuje neprítomnosť účasti.
- Výnimky z testov zachovania sú obmedzené na presné záznamy pred zmenou a po zmene vrátane pôvodných bajtov konfigurácie.

Po odpočítaní štyroch stiahnutých kandidatúr obsahujú štyri overované funkcie 819 doložených účastí a 365 zvolení. [Počty podľa osoby](candidate-totals.json) oddeľujú tieto štyri funkcie od všetkých ostatných zachovaných druhov volieb. Počty vylúčených a zadržaných zhôd sú riadky zdrojových tabuliek; dve rovnaké mená alebo opakované doloženie v dvoch dokumentoch nepredstavujú dve prijaté účasti.

Overenie: 588 modulových testov prešlo. Zo 294 nakonfigurovaných prehliadačových scenárov prešlo 290 v celej sade a dva opravené scenáre pri opakovaní; dva mobilné testy sú na desktope zámerne preskočené. Zostavenie, release validácia, SEO, HTML, úložisko a skutočné nginx presmerovania prešli. Globálna kontrola odkazov skončila s kódom 1: 73 starších URL nebolo dosiahnuteľných; všetkých 57 nových URL bolo dostupných. Pôvodné neúspešné pokusy zostávajú osobitne zaznamenané.
