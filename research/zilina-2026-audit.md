# Žilina 2026 — research and release audit

Snapshot: **3 October 2026**. Election date: **24 October 2026**. Research, independent review and all required release gates are complete. The municipality configuration is `published`; builds include `/zilina/2026/` and its candidate, voting, source and comparison routes.

The work is isolated in `/tmp/ovolbach-zilina-2026`, branch `codex/zilina-2026`, based on `bf7b081abc1c2dc8f508024eee984953c3781b93`. This audit describes the local release-ready checkout; it does not claim deployment. The original working checkout contains concurrent work, so comparisons use the base commit directly.

## Official scope and coverage

| Contest | Candidacies | Seats |
| --- | ---: | ---: |
| Mayor of Žilina | 8 | 1 |
| Municipal council | 94 | 31 |
| ŽSK council, district 11 | 83 | 12 |
| ŽSK chair | 7 | 1 |
| Total | 192 | |

There are **135 people**: 128 new people and seven previously researched regional-chair people. Martin Kapitulík also appears in the municipal and regional council lists. The 185 new candidacy records preserve ballot-specific names/titles, ages, occupations, nominations, numbers and districts. Shared people, chair candidacies, finance and research records retain their original fields and verification dates.

All 135 people have exactly eight coverage records: **1,080 records, 526 `found`, 552 `searched_none`, two `not_applicable`, zero `pending`**. The context contains 854 claims: 744 new claims (265 basic/official-ballot facts and 479 additional research claims) and 110 inherited claims. There are 208 new historical result claims. `searched_none` means no sufficiently reliable publishable finding in the documented public search as of the stated date, never nonexistence.

Municipal district seats are `[5,4,5,7,3,2,2,3]`. All 80 polling stations and their complete street coverage are retained, including PDF page continuations. The no-street surname split is A–J at station 1 and K–Ž at station 80, the latter in district 3. District 6 uses stations 55, 66, 67, 72 and 73; numbering does not establish district membership.

Original PDFs were opened from the [municipal election page](https://zilina.sk/volby-do-organov-uzemnej-samospravy-2026/). Kerning artifacts were checked against rendered originals. Michal Milo's municipal lists state `JUDr., PaedDr., LL.M.` while the regional list states `JUDr. PaedDr., PhD.`; the municipal display form and a sourced note preserve the discrepancy without inferring qualifications. Official roster fields and complete historical-result phrases are fixture-locked.

## Evidence and financial boundaries

Ballot occupation describes the 2026 list, not verified current employment. Past election outcomes do not prove uninterrupted service. Identity joins use the name plus at least two additional matching attributes. Conflicting namesakes are excluded, including Rakša's separate Veronika Barčíková result and the unrelated Ivan Magát extremism record. Company seat was not treated as personal residence.

The full current Ministry candidate-account registry (275 entries) was opened and searched for all 128 new full names. Five name matches were found. Exact campaign-account references and additional identity attributes verify Cibulka, Kozlík and Fiabáne. Johanes and Sokol remain unverified name matches; no bank link or unmatched account detail is exposed in public records or committed receipts. The other 123 records are `not_listed` within the searched registry only. Expenses/operators remain unknown where unconfirmed; candidacies outside this guide remain `not_exhaustive`.

Official population 79,218 supports the Žilina mayor finance records. Three new party names were searched in the full current Ministry party-account registry: Pirátska strana - Slovensko, Spoločne občania Slovenska, and Život - národná strana. No entries were located; this does not establish absence of an account or campaign.

Registered roles use reopened official extracts and dated identity bridges. Declarations use exact accessible values/wording; index-only claims state only that a declaration was published. Blocked attachments were not reconstructed. Candidate programmes and self-published work histories retain attribution and periods. Sponsored material is identified as candidate/PR material. Reports, responses and official outcomes remain separate; unlocated later case outcomes or repayment performance are not inferred.

No new portraits or quotations were added. Public text consists of atomic factual restatements, not generated biographies. Aggregate paraphrases per new media/candidate original peak at 198 whitespace-delimited words for the combined CVČ source; this measurement is not a legal opinion. Raw originals/private identity details remain outside Git.

[Structured receipts](zilina-2026.json) retain individual category searches, opened originals, identity bridges, exclusions, financial checks and access limits. Immutable cohort receipt hashes and source capture hashes identify reviewed evidence.

## Independent review and corrections

The independent read-only review and two bounded supplements are in [the complete report](zilina-2026-review.md). The reviewer independently reconciled all 185 new official ballot rows, 80 polling stations, 208 historical numerical results, the complete finance search, and high-risk registered-role, declaration, identity and media facts. Seven shared chair rows were checked against the official list. Remaining source families received risk-focused review, not exhaustive absence certification.

Three optional claims/sources were removed because current originals were inaccessible: Balogová's Klub za ZA profile (DNS failure), Jantošík's SAK trainee page (404/generic redirect), and Bienik's party CV (500). Old cached reads cannot establish current access or registration. Balogová's programme coverage is now truthfully `searched_none`; other categories retain independent findings. Access attempts/exclusions remain in the receipt.

The first Bulvár allegation now preserves Fiabáne's unnamed opponent instead of assigning it to Johanes; the denial remains a separate attributed response. Editorial-token collisions were resolved through a source-ID rename and three meaning-preserving wording changes without changing the guardrail. Chvíľa's source title now matches the complete original header, `Ing. DUŠAN CHVÍĽA, MBA`.

The standalone SEO gate found two descriptions over 165 characters. The only runtime change uses verified given/family names when the full display name would make the complete election/district context too long. Augustín changes from 170 to 150 characters and Barčiková from 171 to 154. Comparison of all 305 context-specific profiles found only those two description changes; titles and existing-city metadata remain identical. The reviewer checked this source-title correction and runtime change separately.

Final review found no unresolved factual, editorial or implementation blocker, conditional on fresh release gates. Those gates subsequently passed. Public data/runtime hashes match final reviewed hashes. Later edits were limited to this audit/receipt/manifest, copying the complete review, a test-only non-null assertion, and correcting Cibulka's E2E expected order to the existing UI order (mayor, municipal council, regional council). The manifest preserves initial review-input hashes separately from final hashes.

Automated review is not human editorial/legal approval. It does not judge voting merits, programme feasibility, undiscovered records, blocked declaration contents, or unlocated later case outcomes.

## Regression and preservation evidence

- Baseline `npm test`: exit 0, 291 passed, four skipped. Default sandbox initially prevented three local socket tests; permitted execution passed.
- Missing-city unit RED: eight failures before integration. Draft roster/history checks later passed except the deliberately unpublished-city invariant. Draft browser checks failed while routes were absent.
- Access and Bulvár regressions failed before correction; combined targeted GREEN passed both tests (10 unrelated tests skipped).
- The first final unit gate failed one editorial guardrail (302 passed, four skipped). Meaning-preserving source/text changes resolved it; the fresh full run passed.
- The real-record SEO regression failed at 170 characters before the runtime fix, then passed. One build found a possibly undefined array access in the new test; a type-only assertion resolved it.
- The first full E2E run had 10 failures, 156 passes and two skips: eight Chromium resource/navigation failures in long loops and two incorrect Cibulka order assertions. Captures were relocated out of the temporary filesystem and the order assertion was corrected. A diagnostic desktop/mobile run passed six selected checks, then the fresh full suite passed below. No application/Playwright configuration workaround was introduced.

Final fieldwise comparison with the base commit passed for all nine data files: every original candidate, candidacy, claim, district, contest, coverage, finance, party and source record is unchanged. Global totals are 291 people, 387 candidacies, 1,741 claims, 2,328 coverage records, 291 finance records, 27 party records and 682 sources. Existing Liptovský Mikuláš and Ružomberok context counts remain unchanged.

## Fresh final gates

Every command below completed with **exit code 0**. Standalone checks were run separately from the build. Logs and the W3C JSON report are retained outside Git under `/tmp/zilina-research/final-*`.

| Command | Observed result |
| --- | --- |
| `npm test` | 304 passed, four skipped; 36 files passed, one skipped |
| `npm run validate:data` | One cycle, three contexts, three published, zero issues |
| `npm run validate:release` | One cycle, three contexts, three published, zero issues |
| `npm run report:coverage` | All three contexts release-ready; zero pending |
| `npm run build` | Astro: zero errors, warnings or hints; 324 HTML pages, 320 search-indexed pages |
| `npm run check:seo` | 320 canonical indexable pages, three noindex comparison tools, one noindex 404 |
| `VNU_JAVA=/home/sergey/codex/ovolbach/ovolbach/.superpowers/vnu/vnu-runtime-image/bin/java npm run check:html` | W3C Nu 26.10.2: 324 HTML files, zero errors/warnings |
| `npm run check:storage` | No prohibited browser-storage use |
| `ulimit -n 8192; npm run check:links` | 703 URLs accepted by the checker; seven manual-review responses (six 403, one 429) |
| `ulimit -n 8192; PLAYWRIGHT_BROWSERS_PATH=/tmp/uctomost-browsers LD_LIBRARY_PATH=/tmp/uctomost-browser-libs/usr/lib/x86_64-linux-gnu npm run test:e2e -- --workers=1` | 166 passed, two skipped, desktop/mobile; all 135 city profiles and every claim-source link exercised |
| `git diff --check` and `git diff --cached --check` | No whitespace errors |

Full-suite skips are inherited optional cases; no new skip was added. Browser checks cover scoped/global search, all four ballots, finance visibility, legal notices, no cookies/storage/application cross-origin requests, and accessibility. Preview port 4321 was confirmed closed after cleanup.

## Access and environment limits

Six of seven link-check manual cases are unchanged inherited sources/accounts: Droppa's Denník N article, Nemec's SNN article, Choma's Denník E article, Belousovová's Ženský web article, Kapitulík's Tatra account and the Progresívne Slovensko account. The new case is Mičo's official MZV profile: direct HTTP returned 403, but the complete canonical original was read through the web reader and independently reopened. A successful checker exit does not mean these responses were HTTP 200 or that bank transactions were audited.

Fiabáne's initial extraction returned a JavaScript shell; existing Chromium rendered the original with HTTP 200 and complete programme/account text. Kozlík's ordinary Python request returned 403; the canonical original was fully accessible through the web reader. New finance records use reopened current Ministry 2026 FAQs instead of a blocked old Slov-Lex endpoint. Inaccessible regional declaration attachments remain index-only, with per-record limitations.

Native app setup failed because the chat directory is the repository parent; a real `git worktree` was created. Native attachment rejected the unmanaged worktree. Later sandbox setup failed on synthetic `/tmp/.git` quota; permitted execution succeeded. Temporary capture writes also reached quota despite free filesystem capacity. All captures were preserved under `/home/sergey/codex/ovolbach/.research-captures/zilina-2026/`, with `/tmp/zilina-research` and its cohort-B path retained as symlinks; paths/hashes remain valid. Descriptor limits were raised only for affected commands. These environment adjustments do not change public data.
