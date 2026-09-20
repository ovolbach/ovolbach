import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { findStaticSiteIssues } from '../src/lib/static-site-gates';
import { loadCandidateImageAllowlist } from '../src/lib/candidate-image-policy';
import { loadAllElectionCycles, loadGlobalSources } from '../src/lib/load-guide-data';

const root = process.cwd();
const roots = ['src', 'dist'];
const sourceTextFile = /\.(?:astro|json|ts|tsx|js|jsx|mjs|cjs|css|html|svg|webmanifest)$/iu;
const generatedTextFile = /\.(?:html|js|css|json|webmanifest|mjs|cjs|svg)$/iu;
const serviceWorkerOrManifest = /(?:^|\\|\/)(?:service[-_]?worker|sw|workbox|precache|runtime[-_]?cache|worker|manifest|webmanifest)[\w.-]*$/iu;

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(join(root, directory), { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  }))).flat();
}

const paths = (await Promise.all(roots.map(files))).flat().filter((path) =>
  (path.startsWith('src') ? sourceTextFile.test(path) : (generatedTextFile.test(path) || serviceWorkerOrManifest.test(path)))
    && path.replaceAll('\\', '/') !== 'src/lib/static-site-gates.ts'
    && !path.replaceAll('\\', '/').startsWith('dist/pagefind/'),
);
const failures: string[] = [];
const editorialContext = {
  sources: await loadGlobalSources(),
  claims: (await loadAllElectionCycles()).flatMap((cycle) => cycle.claims),
};
const candidateImageAllowlist = await loadCandidateImageAllowlist();
for (const path of paths) {
  const text = await readFile(join(root, path), 'utf8');
  for (const issue of findStaticSiteIssues(path, text, candidateImageAllowlist, editorialContext)) failures.push(`${path}: ${issue}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
