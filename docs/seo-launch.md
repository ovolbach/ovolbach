# SEO a spustenie ovolbach.sk

Stav k 19. 9. 2026: web ešte nie je verejne nasadený. Produkčné HTTP odpovede, kompresiu, cache, indexáciu a Core Web Vitals treba overiť po nasadení.

## Kontrola pred nasadením

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

`npm run build` vytvára `/sitemap.xml` priamo z hotových stránok s platným canonical. `npm run check:seo` kontroluje 99 indexovateľných stránok, ich jedinečné titulky a popisy, jeden H1, slovenský jazyk, OG/Twitter a JSON-LD. `404.html` musí byť mimo sitemap, bez canonical a s `noindex`. Parametre výberu v URL nemenia canonical; v sitemap sú iba základné adresy stránok. `npm run check:html` používa oficiálny W3C Nu Html Checker a ukladá aj upozornenia do `test-results/html-validation.json`.

## Elestio a Nginx

V Elestio otvorte **Security → Nginx configuration → Config** pre vlastnú doménu. Upravte skutočnú konfiguráciu služby; ponechajte existujúce nastavenie certifikátov a cesty ku generovanému `dist/`. Nasledujúce pravidlá ukazujú požadované správanie. Skutočné bloky `server` a koreňový priečinok musia zodpovedať nasadeniu.

```nginx
# V HTTP bloku pre ovolbach.sk aj www.ovolbach.sk a v HTTPS bloku pre www.
# Výnimka pre adresy stránok bez prípony zabezpečí jediné presmerovanie
# napr. http://www.ovolbach.sk/metodika -> https://ovolbach.sk/metodika/.
if ($uri ~ ^(.*/[^/.]+)$) {
    return 301 https://ovolbach.sk$uri/$is_args$args;
}
return 301 https://ovolbach.sk$request_uri;
```

```nginx
# Vo vnútri HTTPS bloku pre ovolbach.sk.
root /ABSOLUTNA/CESTA/K/dist;
index index.html;
error_page 404 /404.html;

location = /404.html { internal; }
location = /index.html { return 301 https://ovolbach.sk/$is_args$args; }
location ~ ^/(.+)/index\.html$ { return 301 https://ovolbach.sk/$1/$is_args$args; }
location / { try_files $uri $uri/ =404; }

# Len súbory Astro s hashom v názve majú dlhú cache.
location ^~ /_astro/ {
    add_header Cache-Control "public, max-age=31536000, immutable" always;
    try_files $uri =404;
}
```

Nginx má pri existujúcom adresári vynútiť koncovú lomku odpoveďou 301. Neznáma adresa s koncovou lomkou musí vrátiť HTTP 404 a obsah `404.html`, nikdy úvodnú stránku s HTTP 200. Skontrolujte `nginx -t` a po zmene konfigurácie konkrétne odpovede nižšie. Ak Elestio používa ďalšiu proxy vrstvu, pravidlá presmerovania nastavte v prvej vrstve, ktorá prijíma požiadavku, aby nevznikli reťazce 301.

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
| `https://ovolbach.sk/neexistujuci-kandidat/` | 404 s vlastnou stránkou |
| `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/og-default.png` | 200 |

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
