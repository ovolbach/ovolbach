# Nezávislé preskúmanie dodatočného mediálneho auditu Žiliny

Snímok: 3. október 2026. Čitateľ: samostatný automatický agent `/root/zilina_media_followup_review`, bez predchádzajúceho kontextu implementácie a bez oprávnenia meniť súbory. Východiskový HEAD: `8a02b12829b09025902a89d6d72ab20a89cf23fc`.

Preskúmaná bola tretia zmrazená verzia, manifest SHA256 `926df1ebd0cadc3267c2df0391b4532b9ebcf1b2ef8fa80bd0d4fcbba7ce1c61`. Všetkých osem kontrolných súčtov súborov, 83 kvitancií prístupu k originálom a štyri pôvodné skupinové kvitancie sa nezávisle zhodovali. Presné vstupy a následné doplnenie výsledkov brán sú v [manifeste](zilina-media-2026-review-manifest.json).

## Rozsah a výsledok

Čitateľ preskúmal celý rozdiel: 110 nových tvrdení, 80 nových zdrojov, tri opravy typu zdroja, dve opravy atribúcie existujúcich tvrdení a 58 zmien pokrytia. Skontroloval znenie tvrdení, metadáta a zachytené originály, identifikačné spojenia, súkromie a autorské hranice, všetkých 128 individuálnych záznamov, 532 priradení dotazov a 70 časových osí. Všetkých 49 pôvodných mediálnych a sporných tvrdení v rozsahu má znovu otvorený podklad a zaznamenanú časovú os. Správy, odpovede, správne rozhodnutia a nedokončené konania zostali rozlíšené.

Nezávislé porovnanie normalizovaných celých mien s dátami Liptovského Mikuláša/Ružomberka, Dolného Kubína a Martina potvrdilo iba sedem vylúčených spoločných osôb `candidate-85` až `candidate-91`; zhodoval sa aj ich vek a úradné povolanie. Žiadne nové ani zmenené tvrdenie či pokrytie nepatrí mimo 128-osobový rozsah. Kandidátky, kandidatúry, financie, obvody, voľby a štyri historické výskumné súbory Žiliny zostali identické s východiskom.

**Záver čitateľa:** v tretej zmrazenej verzii nezostalo žiadne opraviteľné zistenie. Redakčná pripravenosť sa vzťahuje na presne uvedené vstupy; podmienkou pripravenosti vydania bol ešte výsledok záverečných prehliadačových skúšok implementátora.

## Vyriešené zistenia

- Duplicitné nové oznámenie kandidatúry Miroslava Sokola bolo odstránené. Pôvodné tvrdenie zostalo zachované a dostalo ohraničenú časovú os s podkladom TASR.
- Verejný zdroj ICJK používa kanonickú čítačku článku. Bežný verejný článkový payload zostáva len dôkazom prístupu; úplný text podporuje pripísané hodnotenie aj datované doplnenie bez odpovede kandidáta.
- Z denníka bol odstránený prekonaný kontrolný súčet pracovnej kópie článku o petícii. Zachovaná kvitancia sa zhoduje s uloženým originálom.
- Zaradenie správ o Plešingerovi a Štrbovi zodpovedá mediálnemu pokrytiu; ich odpovede zostali oddelené v sporných témach. Neutrálnejší nadpis Laurenčíkovho tvrdenia nemení podanie po lehote ani jeho zdroj a neoslabuje statický jazykový filter.

Čitateľ samostatne spustil `npm test -- tests/unit/zilina-media-followup.test.ts`: **19 úspešných testov, exit 0**. Súbory nemenil a úplné prehliadačové brány nevykonával. Výsledky všetkých jedenástich brán vykonaných implementátorom sú samostatne v [audite](zilina-media-2026-audit.md).

## Hranice preskúmania

Kontrola overuje zdokumentovaný podklad k 3. októbru 2026. Vyhľadávanie nedokazuje neprítomnosť všetkých existujúcich článkov. Nedostupný obsah SME nebol prijatý ako nový podklad; pri použitých HTTP-blokovaných origináloch sú zachytené úplné čítačky vydavateľa. Kontrola nepotvrdzuje pravdivosť mediálnych obvinení ani neskorší nedohľadaný výsledok konania. Automatické preskúmanie nie je ľudský redakčný ani právny posudok.

Po tomto preskúmaní boli doplnené iba tento záznam, manifest a skutočné výsledky brán v auditnom dokumente. Verejné údaje, individuálny denník a testové vstupy zostali zhodné s treťou zmrazenou verziou; manifest odlišuje tieto dokumentačné doplnenia od nezávisle preskúmaných vstupov.
