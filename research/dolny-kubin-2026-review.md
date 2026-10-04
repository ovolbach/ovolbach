# Independent review — Dolný Kubín 2026

Reviewed on 3 October 2026 against base `bf7b081`, in `/tmp/ovolbach-dolny-kubin-2026`, after the final five coverage additions, Grísová/Vajdulák corrections and the subsequent SAK source removals. This review made no changes to product files, Git, the index or HEAD. Only this report and its manifest were written in scratch.

**Verdict:** no unresolved actionable editorial, data or code finding in the reviewed final diff. The independent review is complete. This is an automated read-only review, not human editorial or legal approval. It does not certify the full release gates, which the implementer is running separately.

## Scope and evidence

Reviewed the complete addition, new public claims and source metadata, finance records, candidate research receipts, city configuration, historical-result fixture and new unit/E2E tests. The city scope is 59 people (52 new and seven shared chair candidates), 74 candidacies across four contests (5/42/20/7), four city districts with 5/6/4/1 seats, a three-seat regional district and 18 polling stations. The snapshot is 3 October 2026; the election is 24 October 2026.

Independently requested or opened 50 exact original URLs using the web tool or public HTTP reads, inspected original PDF/XLSX documents and register contents, and compared high-risk facts rather than checking reachability alone. [dolny-kubin-2026-review-manifest.json](dolny-kubin-2026-review-manifest.json) records every exact independently opened URL, its result/access limits, the final reviewed file hashes and fresh checks. Independent reopening was selective and concentrated on finance, person identity, disputed reports, procedural status, exact quotations and election outcomes; it was not an independent re-fetch of every source in the dataset.

## Findings and fixes confirmed

There are no open severity findings. The following findings raised during review are resolved in the inspected final files; locations refer to the final claims JSON.

- **P1, business identity joins:** initial cohort-three receipts used company location as though it were the person's municipality. Final joins have direct declaration or person-level RPVS evidence for Fačko (line 22022), Bukna (22040), Šuňalová (22058), Harezník (22076) and Mních (22556). Kováčik (22094) is joined through the own institutional profile/profession, matching entity identifier and register age evidence. Original documents were independently reopened. Company seats are no longer treated as personal residence evidence.
- **P2, public identity bridge:** Vajdulák's Art AIR claim now exposes the official 2024 declaration alongside ORSR (line 20639). Independently reopened declaration page 28 directly links the titled person and the company role; the register establishes the role commencement date.
- **P3, Slovak grammar and quotation boundaries:** Grísová's full historical-result phrase and its fixture now use feminine forms (line 20371). Earlier malformed name declensions and role grammar were corrected. Kubáň's quotation (line 21188) preserves the actual first-person fragment with a leading ellipsis and excludes invented attribution inside the quoted text. Joppa's quotation preserves the exact full source sentence. The two new quotations contain 11 and 12 words.
- **Category-support gaps:** the final four media publication facts (beginning at line 23417) match independently verified author/agency and publication dates without repeating the allegation details. Kubáň's public-office fact (line 23485) is supported by the original December 2022 municipal newsletter, page 6, and expressly bounded to that period. It does not infer uninterrupted service through 2026.

## High-risk conclusions

The two Martin Stanovský profiles remain separate: the 30-year-old MSc., MPA executive and the 53-year-old entrepreneur. The SITA article explicitly identifies the older person. His allegations and response are separate attributed claims; the younger profile receives neither. No unsupported official outcome is supplied.

Briestenský's NATURAL SYSTEM entry (line 19789) reports commencement of a company-dissolution proceeding, not a completed dissolution or personal criminal finding. Person identity is supported by the official declaration and person-level OV record. Gajdoš uses the valid 9 September 2023 repeat-election result, with 196 votes, instead of preserving the annulled 2022 result as a valid mandate. The reopened original ŽSK commission report, pages 9–10, confirms substitute status for Mních, Harezník, Dráb, Markulček and Šuňalová. The fixture locks complete result objects and outcomes rather than unsafe elected-word substring checks.

Three public campaign-account links have identity support: Briestenský, Jurčíková and Bruncková. Both Fio pages independently confirm account-owner/campaign evidence. Bruncková's campaign IBAN matches the ministry register exactly; the Tatra banka page returned HTTP 403, so no inaccessible account transactions, balances or expenditure are inferred. Name-only ministry entries for Prílepok and Maršinský remain unverified and expose no account URL. All 52 new records retain unknown own expenditure and campaign operator, and an explicitly non-exhaustive boundary for other candidacies. Campaign accounts are not presented as personal wealth.

Media reports preserve attribution and procedural uncertainty, with candidate/institutional responses separated. The Červeňová procedural report remains attributed journalism rather than an official final outcome. Declaration claims use the accessible official contents or index only, without family assets, estimated net worth or inaccessible attachment reconstruction. No private addresses, full birth dates, personal contacts or irrelevant family information were found in new public claim text.

Research receipts document category searches, access limitations, exclusions and identity evidence. Discovery-only ORSR person-search pages are excluded from the public source register; their URLs remain in audit discovery records. Canonical source remapping is reflected in product and receipt references. Shared chair records and previously approved city records retain their original dates and contents.

## Fresh verification and limits

The read-only structural assertion script exited 0: 52 new people, 248 new claims, 416 new coverage records (eight per person, zero pending), 52 new finance records, 67 historical-result fixture objects exactly matching the claims, and 516 unique HTTPS source URLs. Claim source/date/period integrity and audit/product category consistency passed. Each found non-basic category has a supporting claim; basic facts use sourced candidate/ballot fields. Semantic comparison with `git show bf7b081` confirmed unchanged approved records in six historical data arrays. `git diff --check` exited 0.

The new unit tests check full result phrases, namesake/allegation boundaries, verified/unverified account exposure, privacy, quotation attribution, Vajdulák's declaration citation and Grísová's grammar. E2E tests cover the city routes, district selection limits, all profile source links, finance and accessibility. Their successful execution, build output and the remaining standalone release checks are not asserted by this reviewer; release requires the implementer's fresh gate evidence.

Source-access limits are explicit in the manifest. In particular, the large Briestenský campaign bundle was inspected as static embedded data without executing JavaScript; Bruncková's campaign was accessible with requests despite other access methods failing. ZRSR/ŽSK access gaps recorded by researchers remain boundaries rather than reconstructed facts. The reviewer did not independently establish current Kubáň office beyond the bounded 2022 newsletter fact.

**Cases considered outside the authorized plan:** none (`[]`).

## Final follow-up addendum — inaccessible SAK sources and E2E origin checks

Independently requested both exact SAK URLs and confirmed HTTP 404. `dk-bencurova-sak-register` and `dk-bukna-sak-c3` are absent from the public source register. Bencúrová's current SAK registration claim is removed; her employment/business coverage is supported only by the period-bounded official 2026 ballot occupation. Bukna's company-role claim retains the independently reopened ORSR and official 2024 municipal declaration, with no reliance on the inaccessible SAK page. The documented access history preserves the URLs and removal reason.

A **P3 audit-only stale reference** was found during this follow-up: Bencúrová's candidate receipt still listed the removed claim and presented the rejected SAK match as positive identity evidence. This is now resolved: `claimIds` points to the retained ballot-occupation claim, identity evidence is limited to the official ballot, the previous SAK discovery is explicitly excluded, and contradictory access wording is removed. Fresh recursive checks find no dangling active audit source or claim references. Removed IDs retained in the correction history are deliberate historical records.

Reviewed changes to `tests/e2e/campaign-finance.spec.ts`, `district-and-catalogue.spec.ts` and `privacy-accessibility.spec.ts`. Replacing the fixed port-4321 origin with `new URL(baseURL!).origin` preserves exact same-origin equality against the configured test server; it does not accept the current page's arbitrary origin or permit external requests. Both normal and isolated preview configurations provide `baseURL`. Existing assertions for cookies, storage, service workers, caches, legal notices, serious/critical accessibility violations and internal-link HTTP 200 responses remain. The six added Dolný Kubín routes extend the same privacy/accessibility checks. The adjustment supports the isolated preview port without weakening the gate.

Final fresh read-only structural checks exited 0 with **248 new claims and 516 global sources**, plus unchanged 52 new people, 416 coverage records, 52 finance records and 67 exact historical-result fixture records. All 5,770 product source references resolve. The full structural review was rerun successfully for these final counts, and `git diff --check` exited 0. Manifest hashes were refreshed for the final product and reviewed tests. The manifest now records 50 independently requested/opened URLs, including the two excluded live-404 sources. Full-suite passing remains outside this review and is not asserted.

**Follow-up verdict:** no unresolved actionable findings. Cases outside the authorized plan remain empty; the existing-test origin adjustment is necessary support for the authorized isolated verification.

## Integration follow-up — preservation of concurrent Ružomberok research

Reviewed the integration in `/home/sergey/codex/ovolbach/ovolbach` using the independently reviewed isolated worktree, `integration-receipt.json` and the exact incoming-main backup at `integration-before`. The applicable AGENTS instructions match the already reviewed worktree. No product, index, Git or HEAD edits were made.

**Integration verdict:** no unresolved finding. Each of the nine incoming data/source arrays is preserved as an exact ordered prefix. Every appended object equals the reviewed Dolný Kubín delta relative to `bf7b081`, including all fields and source references. The independently checked record comparisons are:

| Array | Existing main records preserved | Identical DK additions |
| --- | ---: | ---: |
| Finance parties | 24 | 1 |
| Candidate finance | 163 | 52 |
| Candidacies | 202 | 67 |
| People | 163 | 52 |
| Claims | 1,080 | 248 |
| Districts | 15 | 5 |
| Contests | 6 | 2 |
| Coverage | 1,304 | 416 |
| Sources | 472 | 100 |

The 67 new candidacy objects combine with seven existing shared regional-chair objects to give 74 city-context candidacies. The integrated cycle has 572 unique source IDs and URLs. DK's context was independently derived from the production loader's documented selection rules: **59 people, 74 candidacies, 372 claims, 195 sources and 472 coverage records**. LM remains 91 people/109 candidacies, with 618 claims; RK remains 79 people/100 candidacies, with 586 claims. The higher claim counts include the concurrent research and shared candidates.

**Review boundary:** the DK factual/editorial diff is the 248 added claims and associated data already independently examined in this report. The separate Ružomberok media review was independently considered by its own research/review task. This integration follow-up verifies preservation, not the truth of that separate work. Its incoming baseline contains 83 added claims, 31 changed older claims, 54 changed coverage records, 56 added sources and 22 source-metadata changes relative to `bf7b081`; all remain exactly unchanged after DK integration. The concurrent README research paragraph is also preserved.

New DK config, fixtures and test files match the reviewed worktree byte for byte, except that the DK roster regression test now expects LM/RK claim counts 618/586 instead of 604/503. Those are the independently derived combined-context counts; no other assertion in that test changed. The research receipt was identical at inspection time. Supporting context and slug tests retain the existing LM and Urbanovič assertions, select LM by its city key rather than array position after adding a third city, and explicitly lock both Stanovský slugs. The three E2E changes remain equivalent to the origin/privacy changes already reviewed above. Integration receipt before/after hashes passed for product and tests.

Fresh read-only integration comparisons, concurrent-delta counts and context/source assertions all exited 0. `git diff --check` exited 0. The manifest contains separate final-main hashes and integrated counts while retaining the isolated-review evidence. Full required gate results and later audit bookkeeping remain the implementer's verification responsibility; this review does not assert their success.

**Cases outside the authorized integration review:** none. The independently reviewed Ružomberok research is explicitly outside this reviewer’s factual reassessment; its preservation is within scope and passed.

## Closing audit metadata follow-up

Read the completed main-folder `research/dolny-kubin-2026-audit.md` and structured research receipt against the saved final logs in `.superpowers/dk-validation`. No product/test object changed after the integration review; their recorded hashes still match. This stage performed no new network research and did not rerun full gates. It checks the implementer's recorded execution evidence and final metadata, superseding the earlier stages' pre-gate evidence boundary.

All ten gate-log SHA-256 values in the audit match the corresponding saved logs. Their output supports the recorded summaries: unit 311 passed/4 skipped; data and release validation zero issues across three published contexts; coverage zero pending; build 248 pages/244 indexed and zero Astro errors, warnings or hints; SEO 244 canonical pages, three noindex comparison tools and a noindex 404; HTML 248 files with zero errors/warnings; the storage command has no failure output; E2E 164 passed/2 skipped. The log hash and summary are corroborated here; command exit-code metadata is the implementer's recorded evidence, rather than a claim that this reviewer reran those commands.

Independently parsed the complete link-log rows: 593 URLs, zero unreachable and 11 manual-review responses, matching the final summary and documented access limits. The final targeted log reports 12 passed in two files. The targeted privacy receipt matches the audit exactly: 603 scratch text files, 149 labelled full-birth-date patterns, 67 compared public/receipt/fixture files and zero literal matches. Its stated limitation is retained; it does not claim general absence of all private data.

The independent-review status is `complete`, with zero unresolved findings. There is no pending review/browser-gate status in the final published audit. Active source/claim references resolve and do not use either removed SAK source or the removed Bencúrová current-registration claim. Their remaining identifiers occur only as intentional removal/history records. The separate Ružomberok factual review remains outside this reviewer’s reassessment.

A fresh reviewer `git diff --check` exited 0 after reading the completed audit. Final audit-document hashes and saved-log hashes are recorded separately in the manifest. **Closing verdict: no unresolved audit metadata or reference finding.**
