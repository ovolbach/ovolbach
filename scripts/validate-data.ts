import { readFile } from 'node:fs/promises';
import { validateDataset, type GuideData } from '../src/lib/validate-dataset';

const modeArgument = process.argv.find((argument) => argument.startsWith('--mode='));

if (modeArgument !== '--mode=draft' && modeArgument !== '--mode=release') {
  throw new Error('Expected --mode=draft or --mode=release');
}

const files = {
  candidates: 'src/data/candidates.json',
  candidacies: 'src/data/candidacies.json',
  claims: 'src/data/claims.json',
  sources: 'src/data/sources.json',
  districts: 'src/data/districts.json',
  elections: 'src/data/elections.json',
  researchCoverage: 'src/data/research-coverage.json',
} as const;

const entries = await Promise.all(Object.entries(files).map(async ([collection, path]) => [
  collection,
  JSON.parse(await readFile(path, 'utf8')),
]));
const data = Object.fromEntries(entries) as GuideData;
const issues = validateDataset(data, modeArgument.slice('--mode='.length) as 'draft' | 'release');

for (const issue of issues) {
  console.error([issue.code, issue.recordId, issue.referenceId].filter(Boolean).join(' '));
}

if (issues.length > 0) process.exitCode = 1;
