import { assembleElectionContext, listElectionContextConfigs, loadElectionCycle } from '../src/lib/load-guide-data';
import { validateDataset } from '../src/lib/validate-dataset';

const modeArgument = process.argv.find((argument) => argument.startsWith('--mode='));

if (modeArgument !== '--mode=draft' && modeArgument !== '--mode=release') throw new Error('Expected --mode=draft or --mode=release');
const mode = modeArgument.slice('--mode='.length) as 'draft' | 'release';
const configs = await listElectionContextConfigs();
if (configs.length === 0) throw new Error('No election contexts configured');
if (mode === 'release' && !configs.some((config) => config.status === 'published')) throw new Error('No published election contexts configured');

const cycles = new Map<string, Awaited<ReturnType<typeof loadElectionCycle>>>();
let issueCount = 0;
for (const config of configs) {
  const key = `${config.year}/${config.regionSlug}`;
  let cycle = cycles.get(key);
  if (!cycle) {
    cycle = await loadElectionCycle(config.year, config.regionSlug);
    cycles.set(key, cycle);
    for (const issue of validateDataset(cycle, 'draft')) {
      console.error([key, issue.code, issue.recordId, issue.referenceId].filter(Boolean).join(' '));
      issueCount++;
    }
  }
  try {
    const context = assembleElectionContext(cycle, config);
    const contextMode = mode === 'release' && config.status === 'published' ? 'release' : 'draft';
    for (const issue of validateDataset(context.data, contextMode)) {
      console.error([context.basePath, issue.code, issue.recordId, issue.referenceId].filter(Boolean).join(' '));
      issueCount++;
    }
  } catch (error) {
    console.error(`${config.citySlug}/${config.year}: ${error instanceof Error ? error.message : error}`);
    issueCount++;
  }
}
console.log(`cycles=${cycles.size} contexts=${configs.length} published=${configs.filter((config) => config.status === 'published').length} issues=${issueCount}`);
if (issueCount > 0) process.exitCode = 1;
