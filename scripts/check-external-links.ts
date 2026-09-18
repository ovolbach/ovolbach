import { checkExternalLinks } from '../src/lib/check-external-links';
import { loadGuideData } from '../src/lib/load-guide-data';

const results = await checkExternalLinks((await loadGuideData()).sources, fetch);
console.table(results.map((result) => ({
  status: result.status ?? 'transport error',
  reachable: result.reachable,
  manual_review: result.needsManualReview,
  timed_out: result.timedOut,
  url: result.url,
  final_url: result.finalUrl,
  sources: result.sourceIds.join(', '),
})));

if (results.some((result) => !result.reachable)) process.exitCode = 1;
