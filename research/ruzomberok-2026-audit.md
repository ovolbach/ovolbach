# Ružomberok 2026 — research and release audit

Research snapshot: **3 October 2026**. Election date: **24 October 2026**. The local project now exposes `/ruzomberok/2026/`, its catalogue, 79 candidate profiles, comparison tool, voting guide and source register. This audit records the uncommitted workspace change; no production deployment was performed.

## Verified scope

| Official registered contest | Candidacies | Seats |
| --- | ---: | ---: |
| Mayor of Ružomberok | 4 | 1 |
| Municipal council | 62 | 16 |
| ŽSK council, district 8 | 27 | 5 |
| ŽSK chair | 7 | 1 |
| Total | 100 | |

There are 79 distinct people: 72 newly researched people and seven regional-chair candidates shared with Liptovský Mikuláš. The five municipal districts have 1, 1, 1, 1 and 12 seats, with 24 polling stations. Official ordering, titles, spelling, ballot numbers, ages, occupations and affiliations were reconciled against the original lists. Ján Kuráň is one person with three candidacies. Official `Ján KRÁL` and `Pavel ŠÍPOŠ` spellings are retained.

The Ružomberok context contains **503 sourced claims, 240 referenced sources, 79 campaign-finance records and 632 coverage records**. The shared cycle contains 163 people, 202 candidacies, 997 claims, 1,304 coverage records and 163 finance records; its global source register contains 416 unique URLs. New research contributes 393 claims for the 72 new people and two dated additions for shared candidates.

## Research coverage

| Category | found | searched_none | not_applicable | pending |
| --- | ---: | ---: | ---: | ---: |
| basic | 79 | 0 | 0 | 0 |
| employment_business | 79 | 0 | 0 | 0 |
| public_office | 40 | 39 | 0 | 0 |
| previous_elections | 52 | 27 | 0 | 0 |
| programme_statements | 42 | 37 | 0 | 0 |
| asset_declarations | 21 | 56 | 2 | 0 |
| media | 39 | 40 | 0 | 0 |
| controversies | 16 | 63 | 0 | 0 |
| Total | 368 | 262 | 2 | 0 |

Every person has exactly eight records. `searched_none` records a completed, bounded public-source search as of its actual verification date. It does not establish nonexistence. The official ballot occupation supports a bounded ballot fact; it does not prove present employment or a current registered business role.

[The structured research receipt](ruzomberok-2026.json) records individual queries, opened originals, source references, identity bridges, exclusions, financial searches and access limits. The seven shared candidates retain their earlier claim verification dates. A separate 18 September–3 October refresh records late campaign changes without silently redating the earlier evidence.

## Evidence and editorial checks

All 104 new historical election-result phrases are locked in a regression fixture, including complete elected, non-elected and substitute outcomes. Official tables prove the dated result; they do not establish uninterrupted current service.

Business roles were checked against applicable current ORSR extracts. Person-level official notices or direct institutional/campaign bridges supply the additional identity attributes. Company seats were excluded as evidence of a person's municipality. Full private birth dates were compared only in scratch captures; public records retain the minimum necessary municipality and year/age evidence. The ambiguous Rákoši–FERA role and conflicting Šrámek/Ondrejka namesakes were excluded.

Programmes and direct statements retain attribution and their own periods. Four altered quotations were corrected against reopened originals: Kubáň's punctuation and three quotations whose attribution had been inserted into the quoted text. Source titles remain verbatim. Their HTML attribution markers now sit on the exact title anchors; the editorial checker is unchanged.

Reports, responses and official outcomes are separate. The Dúbravec reporting preserves accusation and procedural custody status. Alušic's statement about law-firm turnover is his attributed response. The jointly signed MBK response is recorded for both Kubáň and Klopta. Štreit's company insolvency is distinct from a personal proceeding. Páleš and Ondrejka have dated historical official insolvency outcomes, including the located notices ending the procedures; no present debt or personal-income conclusion is inferred. Páleš's discharge wording retains its exact statutory scope. Unlocated later responses or reversals are documented as search limits.

Alušic and Kuráň have personal campaign accounts verified with additional identity attributes and current campaign links. Kubáň's name-only register match remains unverified and is not exposed as a bank link. Other candidacies outside the guide are explicitly `not_exhaustive`; spending and account operators remain unconfirmed where evidence was not available. Three newly relevant nominating-party finance records were added without changing earlier party records.

## Shared-candidate additions and explicit correction

The original registered regional-chair list contains seven people. A TASR report published by STVR on 29 September describes Lučanský's announcement in the JOJ 24 debate on 28 September that he was withdrawing in Choma's favour. `claim-candidate-90-withdrawal-announcement-2026` records that dated, attributed report. An accessible commission filing or acceptance was not independently located; no legal ballot-status conclusion is inferred and the original registered ordering is retained.

The signed Michal Motúz article published on 30 September supports one candidate-attributed Belousovová proposal about road and bridge renewal. `claim-candidate-85-roads-statement-2026-09-30` records the proposal as reporting, with its publication date. It does not assert that the proposal was implemented. The Kapitulík film-office discovery was excluded: one canonical source was blocked, the accessible alternative had an unspecified author and PR label, and the reopened candidate programme did not contain the statement.

One previously approved claim was deliberately corrected under the project's inaccessible-source rule. The sole source for `claim-candidate-88-zsk-chair-current`, `zsk-jurinova-profile`, repeatedly timed out. The reopened official European Committee of the Regions profile independently identifies Jurinová as ŽSK chair. The claim now attributes the actual issuer and is bounded to verification on 3 October, rather than asserting uninterrupted 2017–2026 service. The unreferenced inaccessible source was removed. The full old/new receipt and regression are recorded in the structured audit.

Fieldwise comparison with the original dataset confirms that all original people, candidacies, districts, election contests and campaign-finance records are unchanged. All 602 original claim IDs remain; only the Jurinová claim has corrected content. Two shared-candidate claims were appended, so Liptovský Mikuláš now exposes 604 claims. Original coverage changes are limited to Jurinová/public_office, Lučanský/media and Belousovová/programme_statements. Other original source metadata and coverage are unchanged. Election records were compared by `contestId`, because `electionId` is reused across cities.

## Regression evidence and independent review

The city roster, district boundaries, cross-candidacy join, eight-category coverage, finance identity, 104 historical results, source identity bridges and procedural outcomes have focused regressions. Additional recorded RED/GREEN checks include:

- Detailed audit consistency: RED exit 1; GREEN exit 0 after synchronising official-outcome statuses and supporting identity sources.
- Shared chair office and Lučanský announcement: RED exit 1, two failing checks; GREEN exit 0.
- Belousovová late programme reporting: RED exit 1; GREEN exit 0, 20/20 Ružomberok tests.
- Rendered original source titles: browser RED exit 1; GREEN exit 0 after moving title attribution markers to anchors.
- City URL mappings: old tests exposed cross-city district-number collisions; tests now load the intended city and separately check Ružomberok's mappings.

An independent automated read-only reviewer reopened official and other canonical originals for high-risk identity, finance, quotation and controversy records. It independently verified the shared-candidate updates and source-title correction. All actionable findings were corrected. [The independent review](ruzomberok-2026-review.md) records its own checks and limits; it is not human editorial or legal approval.

A final privacy scan compared 326 labelled full-date patterns from scratch source captures against the 25 modified/untracked workspace files then present and found zero literal matches. The regression additionally rejects private identity/contact prose in new public claims. Raw captures and private comparison data are not included in the repository.

## Final validation gates

All commands below were run on the final production data and their exit codes and output were inspected. Browser commands used the existing Chromium installation via `PLAYWRIGHT_BROWSERS_PATH=/tmp/uctomost-browsers` and its existing library directory. Sandbox permission was needed for local preview/tsx sockets and read-only network checks.

| Command | Exit | Verified result |
| --- | ---: | --- |
| `npm test` | 0 | 291 passed, 4 skipped; 34 files passed, 1 skipped |
| `npm run validate:data` | 0 | 1 cycle, 2 contexts, 2 published, 0 issues |
| `npm run validate:release` | 0 | 1 cycle, 2 contexts, 2 published, 0 issues |
| `npm run report:coverage` | 0 | Both city contexts release-ready; 0 pending |
| `npm run build` | 0 | Type check passed; 184 pages built; 181 pages indexed |
| `npm run check:seo` | 0 | 181 canonical indexable pages; 2 noindex comparison tools; 1 noindex 404 |
| `npm run check:html` | 0 | W3C Nu: 184 HTML files, 0 errors, 0 warnings |
| `npm run check:storage` | 0 | No prohibited storage, tracking or editorial finding |
| `npm run check:links` | 0 | 434 URLs checked, 0 unreachable; 6 manual-review responses |
| `npm run test:e2e` | 0 | 144 passed, 2 skipped, desktop and mobile |
| `git diff --check` | 0 | No whitespace errors |

The four unit skips belong to Nginx deployment tests because Nginx is not installed in this environment. The two browser skips are desktop executions of assertions intended only for the mobile project. All 79 Ružomberok profiles resolve; every rendered claim exposes every referenced source. Browser checks found no serious accessibility issue, cookies, browser persistence or application cross-origin requests on the tested routes.

An earlier link sweep exited 1 for the old ŽSK page; the documented official-source correction resolves that failure. An earlier storage/editorial check exited 1 because original source titles lacked exact HTML attribution; the marker correction resolves that failure. An intermediate build type error in a new test tuple and old single-city test assumptions were corrected before the final GREEN runs. Gate logic was not weakened.

## Access limits and residual uncertainty

The final link checker flags six responses for manual review: three earlier media sources returned 403, the new Ženskýweb article returned 429, and two earlier Tatra banka links returned 403. The original media pages were reopened through the browser, including the exact author, date and relevant text. The Belousovová article was independently reopened by both researcher and reviewer. The two bank endpoints require a browser/account-specific rendering check; inherited account identity evidence retains its actual earlier verification date. A reachable endpoint or a JavaScript landing page does not independently verify an account identity or a balance.

NR SR live retrieval of the Páleš declaration returned 403 to the reviewer. The researcher successfully downloaded the original during this session; the reviewer independently inspected that capture and its hash. The claim states only the exact accessible declaration category and amount. Other failed original/index attempts, excluded records and unlocated responses are listed in the structured receipts. Source availability can change after this snapshot.

The work completes the documented research for the official registered roster within these evidence boundaries. It does not claim exhaustive lifetime history, complete external candidacies, present private finances or inaccessible facts.
