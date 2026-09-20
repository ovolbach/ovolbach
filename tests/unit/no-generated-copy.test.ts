import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findStaticSiteIssues } from '../../src/lib/static-site-gates';
import { loadAllElectionCycles, loadGlobalSources } from '../../src/lib/load-guide-data';

const root = process.cwd();
const publicRoots = ['src/components', 'src/pages', 'src/data'];
const approvedMethodologyExplanation = 'Web nehodnotí ani neodporúča kandidátov. Nepoužíva skóre, poradia, víťazov, odznaky, sentiment ani odporúčania; zobrazuje len oddeliteľné zdrojované údaje v rovnakých kategóriách.';

async function files(directory: string): Promise<string[]> {
  const entries = await readdir(join(root, directory), { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? files(path) : [path];
  }))).flat();
}

async function publicContent(): Promise<Array<{ path: string; text: string }>> {
  const paths = (await Promise.all(publicRoots.map(files))).flat()
    .filter((path) => /\.(?:astro|json)$/u.test(path));
  return Promise.all(paths.map(async (path) => ({ path, text: await readFile(join(root, path), 'utf8') })));
}

describe('public editorial guardrails', () => {
  it('rejects generated biographies, recommendations, scores, and rankings outside the explicit methodology negation', async () => {
    const content = await publicContent();
    const context = {
      sources: await loadGlobalSources(),
      claims: (await loadAllElectionCycles()).flatMap((cycle) => cycle.claims),
    };
    const violations = content.flatMap(({ path, text }) => {
      if (path.replaceAll('\\', '/') === 'src/pages/metodika.astro') expect(text).toContain(approvedMethodologyExplanation);
      return findStaticSiteIssues(path, text, new Set(), context).map((issue) => `${path}: ${issue}`);
    });

    expect(violations).toEqual([]);
  });

  it('keeps public UI Slovak and ships no unlicensed image markup', async () => {
    const content = await publicContent();
    const violations = content.flatMap(({ path, text }) => {
      const russianLocale = /(?:lang|hreflang)\s*=\s*["'{]ru\b|["']language["']\s*:\s*["']ru["']/iu.test(text);
      const imageMarkup = /<(?:img|picture|source)\b|\.(?:avif|gif|jpe?g|png|svg|webp)\b/iu.test(text);
      return russianLocale || imageMarkup ? [path] : [];
    });

    expect(violations).toEqual([]);
  });
});
