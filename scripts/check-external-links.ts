import { checkExternalLinks } from '../src/lib/check-external-links';
import { loadAllElectionCycles, loadGlobalSources } from '../src/lib/load-guide-data';

const [sources, cycles] = await Promise.all([loadGlobalSources(), loadAllElectionCycles()]);
const accounts = cycles.flatMap((cycle) => [
  ...cycle.campaignFinance.flatMap((record) => record.account.status === 'verified' ? [{ id: record.id, url: record.account.url }] : []),
  ...cycle.financeParties.flatMap((party) => party.account.status === 'registered' ? [{ id: party.id, url: party.account.url }] : []),
]);
const results = await checkExternalLinks([...sources, ...accounts], fetch);
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
