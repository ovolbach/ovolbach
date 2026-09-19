# Source file size audit — 2026-09-19

Scope: all 234 unique URLs in `src/data/sources.json`. The audit requested each URL directly. It used HTTP `HEAD`, a one-byte range request when needed, and streamed five PDFs whose servers did not report a size. The largest PDF was also streamed to confirm its reported size. It did not save source content. Sizes below are MiB (1 MiB = 1,048,576 bytes). Detailed per-source results are in `source-file-sizes-2026-09-19.json`; the reusable command is `node scripts/audit-source-file-sizes.mjs`.

## Direct files

| Type | Files | Total MiB |
| --- | ---: | ---: |
| PDF | 53 | 59.18 |
| ZIP | 2 | 11.94 |
| XLSX | 5 | 7.64 |
| CSV | 21 | 3.20 |
| **Total** | **81** | **81.95** |

Total measured bytes: **85,927,435**. No source URL points directly to an image, audio file, or video file. Of the 44 sources classified as `media`, 43 are pages and one is a PDF.

| Individual file size | Files | Combined MiB |
| --- | ---: | ---: |
| Under 10 KiB | 3 | 0.01 |
| 10–100 KiB | 28 | 1.90 |
| 100 KiB–1 MiB | 33 | 10.94 |
| 1–10 MiB | 16 | 56.77 |
| 10 MiB or more | 1 | 12.33 |

Largest files:

| Source | Type | MiB |
| --- | --- | ---: |
| [2023 National Council annual report](https://www.nrsr.sk/web/Dynamic/Download.aspx?DocID=557895) | PDF | 12.33 |
| [2018 municipal candidate tables](https://volby.statistics.sk/oso/oso2018/files/OSO_2018_okrsky-xlsx.zip) | ZIP | 8.28 |
| [Liptovský Ján council commissions](https://www.liptovskyjan.sk/download_file_f.php?id=1278181) | PDF | 7.43 |
| [TV Liptov November 2025 issue](https://www.mikulas.sk/files/noviny/11-25.pdf) | PDF | 6.48 |
| [2018 municipal results tables](https://volby.statistics.sk/oso/oso2018/files/OSO_2018_xlsx.zip) | ZIP | 3.66 |

Only one file exceeds 10 MiB; none exceeds 20 MiB. File sizes can change at the source, especially for dynamic download endpoints.

## Pages and screenshot estimate

The remaining **153** URLs returned pages. No screenshots were captured. A rough full-page estimate at 1440 px width is:

| Screenshot format | Assumed size per page | 153 pages | Pages plus direct files |
| --- | ---: | ---: | ---: |
| PNG | 0.5–3 MiB | 76.5–459 MiB | 158–541 MiB |
| JPEG, quality around 80 | 0.2–1 MiB | 31–153 MiB | 113–235 MiB |

These are planning ranges, not measured screenshot sizes. Long pages, large images, browser banners, and dynamic content can produce larger captures. Embedded assets are not included in the 81.95 MiB direct-file total.
