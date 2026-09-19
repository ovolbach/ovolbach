# SEO a spustenie ovolbach.sk

Stav k 19. 9. 2026: web ešte nie je verejne nasadený. Produkčné HTTP odpovede, kompresiu, cache, indexáciu a Core Web Vitals treba overiť po nasadení.

## Jednorazová kontrola pred prvým nasadením

```text
npm test
npm run validate:data
npm run validate:release
npm run report:coverage
npm run build
npm run check:seo
npm run check:html
npm run check:storage
npm run check:links
npm run test:e2e
git diff --check
```

Z pohľadu SEO `npm run build` iba vytvára `/sitemap.xml` z indexovateľných statických trás; nespúšťa SEO ani HTML audit. `npm run check:seo` sa spúšťa ručne a kontroluje 99 indexovateľných stránok, ich jedinečné titulky a popisy, jeden H1, slovenský jazyk, OG/Twitter a JSON-LD. `404.html` musí byť mimo sitemap, bez canonical a s `noindex`. Parametre výberu v URL nemenia canonical; v sitemap sú iba základné adresy stránok. Ručný `npm run check:html` používa oficiálny W3C Nu Html Checker a ukladá aj upozornenia do `test-results/html-validation.json`.

## Elestio a Nginx

Požiadavka prechádza cez Cloudflare a reverzný proxy Elestio na Nginx v kontajneri `ovolbach` (port `172.17.0.1:3028`). Repozitár obsahuje [`Dockerfile`](../Dockerfile) a [`deploy/nginx/default.conf`](../deploy/nginx/default.conf). Po nasadení nového obrazu bude statický Nginx na porte 80 posielať relatívne presmerovanie na koncovú lomku (`absolute_redirect off`), aby verejná HTTPS adresa nepresmerovala späť na HTTP. Chybový stav 404 zobrazí zostavený súbor `dist/404.html` a zachová HTTP 404.

Na serveri sa HTTPS konfigurácia hlavnej domény nachádza v `/opt/elestio/nginx/conf.d/ovolbach.sk.conf`; konfigurácia `www` je v susednom `www.ovolbach.sk.conf` a presmerúva na hlavnú doménu. Sú to súbory spravované Elestio mimo repozitára. Priama úprava `/etc/nginx/conf.d/default.conf` v bežiacom kontajneri by sa pri ďalšej zostave stratila. Pôvodný Dockerfile a `docker-compose.yml` na serveri sú mimo Git, preto pred nasadením overte, že Elestio použije sledovaný Dockerfile z repozitára. Pred spustením nového obrazu skontrolujte `nginx -t` a po nasadení odpovede nižšie.

Nginx má pri existujúcom adresári vynútiť koncovú lomku odpoveďou 301. Neznáma adresa s koncovou lomkou musí vrátiť HTTP 404 a obsah `404.html`, nikdy úvodnú stránku s HTTP 200. Priamy prístup k `/404.html` môže vonkajší proxy Elestio obslúžiť vlastným interným pravidlom; kontrolujte telo odpovede na neznámu adresu.

Elestio má v publikovanom príklade globálnej konfigurácie zapnutý gzip cez `server-gzip.conf`. Potvrďte skutočnú odpoveď s `Accept-Encoding: gzip` a, ak je modul dostupný, aj `br`. Kompresiu HTML a cache hlavičky treba overiť na nasadenom webe. `robots.txt`, `sitemap.xml`, `llms.txt` a samotné HTML nech majú krátku cache; hashované súbory `/_astro/` môžu mať dlhú nemennú cache.

## HTTP kontrola po nasadení

Použite `curl -sSI` a vypnite automatické nasledovanie presmerovaní. Každá kanonická stránka v `sitemap.xml` má vrátiť 200. Overte najmä:

| Adresa | Očakávaná odpoveď |
| --- | --- |
| `https://ovolbach.sk/` | 200 |
| `https://ovolbach.sk/metodika/` | 200 |
| `https://ovolbach.sk/liptovsky-mikulas/2026/kandidati/` | 200 |
| `https://ovolbach.sk/liptovsky-mikulas/2026/porovnat/` | 200 |
| `http://ovolbach.sk/metodika` | jeden 301 na `https://ovolbach.sk/metodika/` |
| `http://www.ovolbach.sk/metodika` | jeden 301 na `https://ovolbach.sk/metodika/` |
| `https://www.ovolbach.sk/metodika/` | jeden 301 na `https://ovolbach.sk/metodika/` |
| `https://ovolbach.sk/metodika` | jeden 301 na `https://ovolbach.sk/metodika/` |
| `https://ovolbach.sk/metodika/index.html?x=1` | jeden 301 na `https://ovolbach.sk/metodika/?x=1` |
| `https://ovolbach.sk/neexistujuci-kandidat/` | 404 s vlastnou stránkou |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/og-default.png` | 200 |

Jediný prechod z HTTP variantov závisí od pravidiel Cloudflare a vonkajšieho proxy Elestio; samotný Dockerfile mení odpovede statického kontajnera.

Skontrolujte aj kanonickú adresu s parametrom `?kandidat=...`: HTML má stále obsahovať canonical bez parametra. Pred publikáciou sitemap skontrolujte, že neobsahuje `404.html`, parametre ani duplicity.

## Validácia a meranie po nasadení

1. Potvrďte vlastníctvo `ovolbach.sk` cez DNS v Google Search Console a Bing Webmaster Tools. Odošlite `https://ovolbach.sk/sitemap.xml` a sledujte indexáciu a chyby pokrytia. Seznam nie je cieľový trh.
2. Skontrolujte verejnú vzorku hlavnej stránky, katalógu, profilu a metodiky cez [W3C Nu Validator](https://validator.w3.org/nu/). Skontrolujte JSON-LD cez [Google Rich Results Test](https://search.google.com/test/rich-results) a [Schema.org Validator](https://validator.schema.org/). Bežné `WebPage` nemusí získať rozšírený výsledok.
3. V [PageSpeed Insights](https://pagespeed.web.dev/) zmerajte mobil aj desktop pre hlavnú stránku, prehľad mesta, katalóg a profil. Pre dostupné poľné údaje sledujte 75. percentil: LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1. Ak poľné údaje ešte chýbajú, zaznamenajte to samostatne a riešte zistenia z laboratórneho merania.
4. Skontrolujte v prehliadači obsah hlavných stránok bez JavaScriptu. Stránka porovnania bez JavaScriptu ukazuje popis nástroja a odkazy; zostavená tabuľka vyžaduje JavaScript. Indexuje sa iba základná `/porovnat/`.

Pri lokálnej zostave majú najväčšie stránky tieto veľkosti; gzip a Brotli sú výpočty nad súborom, nie potvrdenie odpovedí servera:

| Stránka | HTML | gzip | Brotli |
| --- | ---: | ---: | ---: |
| Prehľad mesta | ~1,93 MB | ~90 kB | ~14 kB |
| Porovnanie | ~0,97 MB | ~81 kB | ~48 kB |
| Katalóg | ~0,46 MB | ~26 kB | ~14 kB |

Veľké HTML môže mať aj po kompresii vysoké náklady na parsovanie a DOM. Po prvom PageSpeed meraní posúďte najmä prehľad mesta a porovnanie. Na webe nie sú obrázky kandidátov. Ak sa neskôr pridajú obrázky s doloženou licenciou, pridajte rozmery, vecný `alt`, responzívne varianty a WebP/AVIF. Web je zatiaľ len po slovensky, preto sa nepoužívajú `hreflang` ani `x-default`.
