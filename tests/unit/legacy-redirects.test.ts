import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadGuideData } from '../../src/lib/load-guide-data';
import { listPublishedElectionContexts } from '../../src/lib/load-guide-data';
import { candidateProfilePath } from '../../src/lib/regional-context';

const { candidates } = await loadGuideData();
const contexts = await listPublishedElectionContexts();
const lm = contexts.find((context) => context.citySlug === 'liptovsky-mikulas')!;

const basePath = '/liptovsky-mikulas/2026';
const config = readFileSync(path.join(process.cwd(), 'deploy/nginx/default.conf'), 'utf8');
const mapBody = config.match(/map \$uri \$legacy_target \{([\s\S]*?)\n\}/)?.[1] ?? '';
const entries = [...mapBody.matchAll(/^\s*~(\S+)\s+(\S+);(?:\s*#\s*(candidate-\d+))?\s*$/gm)].map((match) => ({
  pattern: match[1]!,
  target: match[2]!,
  candidateId: match[3],
}));

function redirectFor(uri: string): string | undefined {
  return entries.find(({ pattern }) => new RegExp(pattern).test(uri))?.target;
}

describe('legacy election URLs', () => {
  it('redirects old public pages to the same Liptovský Mikuláš 2026 pages', () => {
    expect(redirectFor('/kandidati/')).toBe(`${basePath}/kandidati/`);
    expect(redirectFor('/ako-volit/')).toBe(`${basePath}/ako-volit/`);
    expect(redirectFor('/porovnat/')).toBe(`${basePath}/porovnat/`);
  });

  it('redirects profiles visible in Google to their current candidate pages', () => {
    expect(redirectFor('/kandidat/michal-paska/')).toBe(`${basePath}/kandidat/michal-paska/`);
    expect(redirectFor('/kandidat/tana-sufliarskamgr/')).toBe(`${basePath}/kandidat/tana-sufliarska/`);
    expect(redirectFor('/kandidat/miroslav-parobekmgr/')).toBe(`${basePath}/kandidat/miroslav-parobek/`);
    expect(redirectFor('/kandidat/adam-lucanskying/')).toBe('/zilinsky-kraj/2026/kandidat/adam-lucansky/');
  });

  it('covers every historical candidate without changing identity', () => {
    const cityless = entries.filter(({ pattern }) => pattern.startsWith('^/kandidat/'));
    const nested = entries.filter(({ pattern }) => pattern.startsWith(`^${basePath}/kandidat/`));
    expect(cityless).toHaveLength(91);
    expect(nested).toHaveLength(67);
    for (const candidate of candidates) {
      const aliases = cityless.filter(({ candidateId }) => candidateId === candidate.id);
      expect(aliases, candidate.id).toHaveLength(1);
      const alias = aliases[0]!;
      expect(alias.target).toBe(candidateProfilePath(lm, candidate.id));
      const oldSlug = alias.pattern.match(/^\^\/kandidat\/([a-z0-9-]+)\(\?:/)?.[1];
      expect(oldSlug, candidate.id).toBeTruthy();
      const formerNested = nested.filter(({ candidateId }) => candidateId === candidate.id);
      expect(formerNested, candidate.id).toHaveLength(oldSlug === candidate.slug ? 0 : 1);
      const oldNested = formerNested[0];
      if (oldNested) {
        expect(oldNested.target).toBe(alias.target);
        expect(oldNested.pattern).toContain(`/kandidat/${oldSlug}(?:`);
      }
    }
  });

  it('redirects all 35 municipal chair profiles directly, in every URL variant', () => {
    const chairs = candidates.filter((candidate) => lm.data.candidacies.some((row) => row.candidateId === candidate.id && row.electionId === 'region-chair'));
    expect(chairs).toHaveLength(7);
    for (const context of contexts) {
      for (const candidate of chairs) {
        for (const suffix of ['', '/', '/index.html']) {
          expect(redirectFor(`${context.basePath}kandidat/${candidate.slug}${suffix}`))
            .toBe(`/zilinsky-kraj/2026/kandidat/${candidate.slug}/`);
        }
      }
    }
    expect(redirectFor('/martin/2026/kandidat/not-a-candidate/')).toBeUndefined();
    expect(redirectFor('/martin/2030/kandidat/anna-belousovova/')).toBeUndefined();
    expect(redirectFor('/neexistuje/2026/kandidat/anna-belousovova/')).toBeUndefined();
  });

  it('handles URL variants but leaves unrelated routes untouched', () => {
    for (const uri of ['/kandidati', '/kandidati/index.html']) {
      expect(redirectFor(uri)).toBe(`${basePath}/kandidati/`);
    }
    for (const uri of ['/kandidat/michal-paska', '/kandidat/michal-paska/index.html']) {
      expect(redirectFor(uri)).toBe(`${basePath}/kandidat/michal-paska/`);
    }
    for (const uri of ['/', '/zdroje/', '/metodika/', '/kandidat/not-a-candidate/']) {
      expect(redirectFor(uri)).toBeUndefined();
    }
  });
});
