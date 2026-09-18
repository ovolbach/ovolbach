import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { findStaticSiteIssues } from '../../src/lib/static-site-gates';
import { safeInternalSearchUrl } from '../../src/lib/search-url';
import { candidateImageAllowlist, deriveCandidateImageAllowlist } from '../../src/lib/candidate-image-policy';
import type { Candidate, Source } from '../../src/lib/schemas';

const fixtures = join(process.cwd(), 'tests/fixtures/static-site-gates');

async function scanFixture(name: string) {
  return findStaticSiteIssues(`src/fixture/${name}`, await readFile(join(fixtures, name), 'utf8'));
}

describe('static site security and editorial gates', () => {
  it.each([
    ['src/pages/kandidati/index.astro', 'slovak-ranking-label.astro'],
    ['dist/kandidati/index.html', 'generated-slovak-ranking-label.html'],
  ])('rejects app-authored Slovak ranking labels in %s', async (path, fixture) => {
    const markup = await readFile(join(fixtures, fixture), 'utf8');
    for (const label of ['Poradie kandidátov', 'PORADIE KANDIDÁTOV', 'poradie kandidatov', 'Poradie kandida\u0301tov']) {
      expect(findStaticSiteIssues(path, markup.replace('Poradie kandidátov', label)), label)
        .toContain('prohibited public label');
    }
  });

  it.each([
    ['tsx-label.tsx', 'prohibited public label'],
    ['tsx-raw-label.tsx', 'prohibited public label'],
    ['tsx-expression-label.tsx', 'prohibited public label'],
    ['js-dom-label.js', 'prohibited public label'],
    ['unicode-service-worker.ts', 'service worker'],
    ['computed-service-worker.ts', 'service worker'],
    ['entity-label.html', 'prohibited public label'],
    ['concat-storage.ts', 'localStorage'],
    ['concat-label.ts', 'prohibited public label'],
    ['russian-label.html', 'prohibited public label'],
    ['worker-alias.ts', 'service worker'],
    ['service-worker-token.ts', 'service worker'],
    ['worker-content.mjs', 'service worker content'],
    ['cache-alias.ts', 'Cache Storage'],
    ['cache-storage-token.ts', 'Cache Storage'],
    ['unicode-cache.ts', 'Cache Storage'],
    ['css-image.css', 'unlicensed image rendering'],
    ['js-image.js', 'unlicensed image rendering'],
    ['svg-image.svg', 'unlicensed image rendering'],
    ['create-element-ns.ts', 'unlicensed image rendering'],
    ['nonstandard-image-assignment.ts', 'unlicensed image rendering'],
    ['astro-inline-style.astro', 'unlicensed image rendering'],
    ['bracket-image-assignment.ts', 'unlicensed image rendering'],
    ['set-attribute-image.ts', 'unlicensed image rendering'],
    ['style-set-property.ts', 'unlicensed image rendering'],
    ['neutral-constructor.ts', 'worker'],
    ['event-push.js', 'worker runtime'],
    ['event-message.js', 'worker runtime'],
    ['svg-visible-copy.svg', 'prohibited public label'],
    ['mask-url.css', 'unlicensed image rendering'],
    ['border-url.css', 'unlicensed image rendering'],
    ['unquoted-svg-use.svg', 'unlicensed image rendering'],
    ['unquoted-svg-image.svg', 'unlicensed image rendering'],
  ])('fails closed for %s', async (name, rule) => {
    expect(await scanFixture(name)).toContain(rule);
  });

  it('allows only the exact methodology neutrality explanation', () => {
    const exact = 'Web nehodnotí ani neodporúča kandidátov. Nepoužíva skóre, poradia, víťazov, odznaky, sentiment ani odporúčania; zobrazuje len oddeliteľné zdrojované údaje v rovnakých kategóriách.';
    expect(findStaticSiteIssues('src/pages/metodika.astro', exact)).toEqual([]);
    expect(findStaticSiteIssues('src/pages/metodika.astro', `${exact}<p>Víťaz volieb</p>`)).toContain('prohibited public label');
    expect(findStaticSiteIssues('src/pages/kandidat/test.astro', exact)).toContain('prohibited public label');
  });

  it('rejects generated service-worker and manifest paths', () => {
    expect(findStaticSiteIssues('dist/service-worker.js', '')).toContain('service worker artifact');
    expect(findStaticSiteIssues('dist/manifest.webmanifest', '{}')).toContain('service worker artifact');
    expect(findStaticSiteIssues('dist/precache-worker.mjs', '')).toContain('service worker artifact');
  });

  it('scans generated visible HTML and limits the methodology exception to its exact page', () => {
    expect(findStaticSiteIssues('dist/kandidati/index.html', '<main><p>Najlepší kandidát</p></main>')).toContain('prohibited public label');
    expect(findStaticSiteIssues('dist/metodika/index.html', '<main><p>Web nehodnotí ani neodporúča kandidátov. Nepoužíva skóre, poradia, víťazov, odznaky, sentiment ani odporúčania; zobrazuje len oddeliteľné zdrojované údaje v rovnakých kategóriách.</p></main>')).toEqual([]);
  });

  it('scans generated inline styles, worker chunks, and SVG visible text', async () => {
    expect(findStaticSiteIssues('dist/example/index.html', await readFile(join(fixtures, 'generated-inline-style.html'), 'utf8'))).toContain('unlicensed image rendering');
    expect(findStaticSiteIssues('dist/_astro/a8f31.js', await readFile(join(fixtures, 'worker-chunk.js'), 'utf8'))).toContain('worker runtime');
    expect(findStaticSiteIssues('dist/assets/label.svg', await readFile(join(fixtures, 'svg-visible-copy.svg'), 'utf8'))).toContain('prohibited public label');
  });

  it('allows generic audio/video sources but blocks picture image sources', () => {
    expect(findStaticSiteIssues('src/example.html', '<audio><source src="podcast.mp3"></audio>')).not.toContain('unlicensed image rendering');
    expect(findStaticSiteIssues('src/example.html', '<picture><source srcset="candidate.webp"></picture>')).toContain('unlicensed image rendering');
  });

  it('fails closed for unquoted generated image URLs while retaining audio source behavior', () => {
    expect(findStaticSiteIssues('dist/example/index.html', '<img src=/candidate.webp>')).toContain('unlicensed image rendering');
    expect(findStaticSiteIssues('dist/example/index.html', '<picture><source srcset=/candidate.webp></picture>')).toContain('unlicensed image rendering');
    expect(findStaticSiteIssues('dist/example/index.html', '<audio><source src=/podcast.mp3></audio>')).not.toContain('unlicensed image rendering');
  });

  it('allowlists only exact quoted or unquoted HTML and SVG image references', () => {
    const allowed = new Set(['/candidate.webp']);
    expect(findStaticSiteIssues('src/example.html', '<img src=/candidate.webp>', allowed)).not.toContain('unlicensed image rendering');
    expect(findStaticSiteIssues('src/example.html', '<img src=/other.webp>', allowed)).toContain('unlicensed image rendering');
    expect(findStaticSiteIssues('src/example.svg', '<svg><use href=/other.svg#icon /></svg>', allowed)).toContain('unlicensed image rendering');
  });
});

describe('Pagefind result URL safety', () => {
  const origin = 'https://ovolbach.sk';

  it.each([
    ['https://evil.example/path', undefined],
    ['//evil.example/path', undefined],
    ['javascript:alert(1)', undefined],
    ['data:text/html,unsafe', undefined],
    ['blob:https://ovolbach.sk/id', undefined],
    ['https://user:pass@ovolbach.sk/path', undefined],
    ['/%zz', undefined],
    ['/kandidat/a/../b/?x=1#source', '/kandidat/b/?x=1#source'],
    ['https://ovolbach.sk/zdroje/', '/zdroje/'],
  ])('normalizes or rejects %s', (value, expected) => {
    expect(safeInternalSearchUrl(value, origin)).toBe(expected);
  });
});

describe('candidate image allowlist', () => {
  const source = { id: 'source-license' } as Source;
  const candidate = {
    id: 'candidate-1',
    sourceIds: ['source-license'],
    images: [{ url: '/images/licensed.webp', license: 'CC-BY-4.0', licenseSourceId: 'source-license' }],
  } as Candidate;

  it('starts empty and requires canonical candidate license evidence for future assets', () => {
    expect(candidateImageAllowlist).toEqual(new Set());
    expect(deriveCandidateImageAllowlist([candidate], [source])).toEqual(new Set(['/images/licensed.webp']));
    expect(deriveCandidateImageAllowlist([{ ...candidate, sourceIds: [] }], [source])).toEqual(new Set());
  });

  it('rejects rendered images that are dynamic or absent from a non-empty allowlist', () => {
    const allowed = new Set(['/images/licensed.webp']);
    expect(findStaticSiteIssues('src/example.astro', '<img src="/images/licensed.webp">', allowed)).not.toContain('unlicensed image rendering');
    expect(findStaticSiteIssues('src/example.astro', '<img src={candidate.image.url}>', allowed)).toContain('unlicensed image rendering');
  });
});
