import { buildCoverageReport, parseCoverageCliFilter } from '../src/lib/research-report';
import { loadGuideData } from '../src/lib/load-guide-data';

try {
  const report = buildCoverageReport(await loadGuideData(), parseCoverageCliFilter(process.argv.slice(2)));
  console.table(report.candidates.map((candidate) => ({
    candidate: candidate.displayName,
    found: candidate.totals.found,
    searched_none: candidate.totals.searched_none,
    not_applicable: candidate.totals.not_applicable,
    pending: candidate.totals.pending,
    pending_categories: candidate.pendingCategories.join(', '),
  })));
  console.log(`releaseReady=${report.releaseReady} pending=${report.totals.pending}`);
  if (!report.releaseReady) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
