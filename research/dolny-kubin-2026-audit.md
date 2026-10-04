# Dolný Kubín 2026 — research and release audit

Research snapshot: **3 October 2026**. Election date: **24 October 2026**, 07:00–20:00. The project exposes `/dolny-kubin/2026/`, the candidate catalogue, 59 profiles, comparison tool, voting guide and source register. Changes are in the main working folder and remain uncommitted; no production deployment was performed.

## Verified scope

| Official registered contest | Candidacies | Seats |
| --- | ---: | ---: |
| Mayor | 5 | 1 |
| Municipal council | 42 | 16 |
| ŽSK council, district 3 | 20 | 3 |
| ŽSK chair | 7 | 1 |
| Total | 74 | |

The roster contains 59 distinct people: 52 newly researched people and seven regional-chair candidates shared with the other cities. Four municipal districts have 5, 6, 4 and 1 seats, with 18 polling stations. The official lists establish titles, spelling, ballot numbers, age at the election, occupations, affiliations, district and ordering. The live polling PDF assigns Jána Hollého to station 4; a cached station-14 reading was excluded.

Martin Stanovský, age 30, MSc., MPA, and Martin Stanovský, age 53, are distinct people with distinct profiles. Katarína Bruncková's mayoral, municipal-council and regional-council entries belong to one verified person. Cross-candidacy affiliations remain attached to their respective ballots.

The final city context contains **372 sourced claims, 195 referenced sources, 472 coverage records and 59 finance records**. This task adds 248 claims, 100 unique public source URLs, 416 coverage and 52 finance records for its 52 new people. The shared cycle now contains 215 people, 269 candidacies, 1,328 claims and 1,720 coverage records; the global register contains 572 unique HTTPS URLs.

## Research coverage

| Category | found | searched_none | not_applicable | pending |
| --- | ---: | ---: | ---: | ---: |
| basic | 59 | 0 | 0 | 0 |
| employment_business | 59 | 0 | 0 | 0 |
| public_office | 29 | 30 | 0 | 0 |
| previous_elections | 36 | 23 | 0 | 0 |
| programme_statements | 16 | 43 | 0 | 0 |
| asset_declarations | 20 | 37 | 2 | 0 |
| media | 26 | 33 | 0 | 0 |
| controversies | 9 | 50 | 0 | 0 |
| Total | 254 | 216 | 2 | 0 |

Exactly eight category records exist for every person. The 52 new people have 207 `found` and 209 `searched_none` records, with no `pending` or `not_applicable` records. `searched_none` means no usable evidence was found in the documented public-source search by its verification date; it does not establish that the information does not exist. Official ballot occupations are published as dated ballot facts, without asserting current employment or register membership.

[The structured research receipt](dolny-kubin-2026.json) records each person's actual queries, reopened originals, category evidence, identity attributes, exclusions, access limits and finance searches. The original official lists, district documents and used historical tables were read directly. Their fetch results and hashes are recorded. Seventeen discovery-only ORSR person-search URLs were kept in the search history and excluded from the public source register; 29 canonical-URL source aliases were reconciled without duplicating URLs or changing inherited metadata.

## Evidence boundaries and corrections

Historical election results are locked as 67 complete result objects and full phrases in a regression fixture, including elected, non-elected and substitute status. Gajdoš's valid 9 September 2023 repeat election, with 196 votes, replaces use of the annulled 2022 election as a valid mandate. Original 2022 regional commission pages 9–10 establish substitute outcomes where a blank export field alone would not. Dated results do not establish uninterrupted service through today.

Business joins use a person's municipality and year/age, or a direct institutional or declaration bridge, alongside the name and role. A company's registered office is not the person's residence. Fačko, Bukna, Šuňalová, Harezník, Mních and Kováčik have explicit person-level bridges. Vajdulák's public Art AIR claim exposes both the ORSR extract and the official 2024 declaration. Company roles, turnover and proceedings are not treated as personal employment, income or wealth. Briestenský's company entry preserves commencement of a dissolution proceeding, without inferring completed dissolution or personal wrongdoing.

The SITA allegation and response refer expressly to the older Martin Stanovský and are separate attributed claims. Bruncková, Červeňová and Kubáň reporting preserves attribution, responses and the dated procedural boundary. A journalistic account of a procedural review is not stored as an official final outcome. Four separate media-publication facts support their media coverage category without duplicating allegation details. Kubáň's regional-office fact uses page 6 of the original December 2022 municipal newsletter and is bounded to that period.

The two short quotations were checked verbatim against reopened originals and preserve attribution, first person and punctuation. Kubáň's fragment retains its leading ellipsis. Grísová's complete result phrase and fixture use feminine forms. Declaration claims contain only accessible official content or the accessible index entry; inaccessible attachments, spouses' assets and estimated net worth are not reconstructed.

Two SAK URLs returned live HTTP404 and were excluded. Bencúrová's unsupported current-register claim was removed; her employment-category evidence is limited to the official ballot occupation. Bukna's company role remains supported by accessible ORSR and the official declaration. The obsolete SAK positive receipt was moved to exclusion history, and active audit references were corrected with a failing regression before the fix.

## Finance

All 52 new exact names were searched in the reopened ministry candidate-account register. Briestenský, Jurčíková and Bruncková have three verified campaign-account links, supported by candidate-owned 2026 mayoral campaign context, city and an explicit link or matching IBAN. Both Fio pages independently confirm the owner/campaign match. Bruncková's owned campaign IBAN matches the ministry record; Tatra banka returned HTTP403, so no transactions, balance or expenditure are inferred.

Name-only ministry entries for Maršinský and Prílepok remain `unverified` and expose no bank URL. The other 47 new records are `not_listed`, which refers only to the checked register. One newly relevant party record, Bratia Slovenska, is added. All 52 new records retain unknown spending and campaign operator, with external candidacies explicitly `not_exhaustive`. Conditional legal duties are not converted into financial exemptions or claims of noncompliance. Bank links are ordinary external links; the site does not fetch or embed bank data.

## Integration and independent review

The independently reviewed addition was developed against `bf7b081` in an isolated worktree. A separately completed Ružomberok media review was already present in the main folder during integration. Its 83 appended claims, 31 historical claim corrections, 54 coverage changes, 56 added sources and 22 source-metadata changes were preserved exactly; those changes belong to its separate audit. This task did not redate or rewrite those records.

Fieldwise checks preserve all nine pre-integration arrays as exact ordered prefixes and confirm that every appended Dolný Kubín object equals the independently reviewed task data. The seven shared chair profiles inherit 14 further claims from the separate review; this explains the final city's 372 claims instead of the isolated 358. Liptovský Mikuláš remains at 91 people, 109 candidacies and 618 claims; Ružomberok remains at 79 people, 100 candidacies and 586 claims. Preservation regressions use these verified main-folder counts. README and existing context tests combine both additions.

[The independent automated read-only review](dolny-kubin-2026-review.md) requested or reopened 50 original URLs, concentrating on finance, identity, quotations, election outcomes and disputes. It confirmed the documented fixes and exact preservation during integration. No actionable finding remains. [Its manifest](dolny-kubin-2026-review-manifest.json) distinguishes the isolated reviewed hashes from the final main integration hashes; it does not claim human editorial or legal approval or implementer's full-gate success.

RED evidence covers the missing official city roster, historical result boundaries, public declaration bridge, feminine result grammar, five missing category-support claims, inaccessible SAK evidence and obsolete audit references. All twelve city regressions pass within the final full suite. Existing context/name-slug tests were adjusted for the additional city and namesakes. Existing same-origin browser checks now compare against the configured `baseURL`, retaining exact origin equality and all privacy/accessibility assertions. Six city routes extend the privacy suite.

A targeted privacy comparison inspected 603 scratch text captures, extracted 149 labelled full-birth-date patterns and compared them against 67 city HTML/receipt/fixture files. It found zero literal matches. Claim-text regressions and independent review additionally inspect private identity/contact prose. This targeted comparison is not a general proof about every form of private data; raw captures and private identity details are excluded from the repository.

## Final verification

Fresh commands below ran on the combined main-folder data; their exit codes and output were inspected separately. Existing Chromium and W3C Nu installations were reused. Temporary browser profiles and final logs use ignored project directories after confirmed `/tmp` quota/resource errors. The isolated browser configuration uses port4327, one worker and the unchanged desktop/mobile projects; it prevents reuse of another city's preview on port4321.

| Command | Exit | Verified result |
| --- | ---: | --- |
| `npm test` | 0 | 311 passed, 4 skipped; 37 files passed, 1 skipped |
| `npm run validate:data` | 0 | 1 cycle, 3 contexts, 3 published, 0 issues |
| `npm run validate:release` | 0 | 1 cycle, 3 contexts, 3 published, 0 issues |
| `npm run report:coverage` | 0 | All three contexts release-ready; 0 pending |
| `npm run build` | 0 | Astro: 0 errors, warnings or hints; 248 pages built, 244 indexed |
| `npm run check:seo` | 0 | 244 canonical indexable pages; 3 noindex comparison tools; 1 noindex 404 |
| `npm run check:html` | 0 | W3C Nu26.10.2: 248 HTML files; 0 errors, 0 warnings |
| `npm run check:storage` | 0 | No prohibited storage, tracking or editorial issue |
| `npm run check:links` | 0 | 593 URLs; 0 unreachable; 11 manual-review responses |
| `npm run test:e2e -- --config=.superpowers/dk-playwright.config.ts --workers=1` | 0 | 164 passed, 2 skipped across desktop and mobile |
| `git diff --check` | 0 | No whitespace errors; freshly rerun after final documentation |

Four inherited unit skips are Nginx deployment checks because Nginx is unavailable. Two browser cases are desktop executions of mobile-only assertions. Earlier single-city test assumptions, configured-port assumptions and browser temporary-directory failures were diagnosed and corrected before these fresh checks. No release, source, privacy or accessibility gate was weakened. The first source sweep's two404 failures were resolved by excluding unsupported evidence rather than changing link-check rules. A quota-truncated combined build/log was rerun in the project directory.

## Access limits and residual uncertainty

The complete final source sweep checks 593 distinct URLs with zero unreachable results and 11 manual-review responses. Four inherited media endpoints return403/429, four new media/candidate-statement endpoints return403, and three Tatra banka endpoints return403. Applicable original text, byline, date and claims were reopened through available access methods during research, and high-risk originals were independently reviewed. Account identity uses its recorded accessible campaign/registry evidence; an endpoint's reachability alone does not prove an identity, balance or expense.

ZRSR TLS/access failures, the Slov-Lex bot restriction, ambiguous namesakes and unlocated later responses/outcomes are documented in individual receipts. Reopened ministry FAQs independently support applicable finance duties. Conflicting Ľorko municipality evidence without a direct bridge was excluded. Source availability may change after the snapshot.

This completes the documented public-source research for the official registered roster within its evidence boundaries. It does not assert exhaustive lifetime history, complete external candidacies, private finances or inaccessible facts. All 59 profiles resolve in desktop and mobile checks; every rendered claim exposes all referenced sources. Tested city routes create no cookies or browser storage, make no application cross-origin requests and have no serious or critical axe finding. Comparison remains noindex and outside the sitemap.
