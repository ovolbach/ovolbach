import { buildCoverageReport, parseCoverageCliFilter } from '../src/lib/research-report';
import { listPublishedElectionContexts } from '../src/lib/load-guide-data';

try {
  const args = process.argv.slice(2);
  const cityArgs = args.filter((arg) => arg.startsWith('--city='));
  const yearArgs = args.filter((arg) => arg.startsWith('--year='));
  if (cityArgs.length > 1 || yearArgs.length > 1) throw new Error('City and year filters may each appear only once');
  const city = cityArgs[0]?.slice('--city='.length);
  const year = yearArgs[0] ? Number(yearArgs[0].slice('--year='.length)) : undefined;
  if (city !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(city)) throw new Error(`Invalid city filter: ${city}`);
  if (yearArgs.length && (!Number.isInteger(year) || year! < 2000 || year! > 2100)) throw new Error(`Invalid year filter: ${yearArgs[0]}`);
  const filter = parseCoverageCliFilter(args.filter((arg) => !arg.startsWith('--city=') && !arg.startsWith('--year=')));
  const contexts = (await listPublishedElectionContexts()).filter((context) =>
    (city === undefined || context.citySlug === city) && (year === undefined || context.year === year));
  if (contexts.length === 0) throw new Error('No published contexts match city/year filters');

  let pending = 0;
  for (const context of contexts) {
    const report = buildCoverageReport(context.data, filter);
    console.log(context.basePath);
    console.table(report.candidates.map((candidate) => ({
      candidate: candidate.displayName,
      found: candidate.totals.found,
      searched_none: candidate.totals.searched_none,
      not_applicable: candidate.totals.not_applicable,
      pending: candidate.totals.pending,
      pending_categories: candidate.pendingCategories.join(', '),
    })));
    pending += report.totals.pending;
  }
  console.log(`releaseReady=${pending === 0} pending=${pending}`);
  if (pending > 0) process.exitCode = 1;
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
