import { describe, expect, it } from 'vitest';
import { findStaticSiteIssues } from '../../src/lib/static-site-gates';
import { baseClaim, baseSource } from '../fixtures/guide-data';

const source = { ...baseSource, title: 'Biography of a winner: best recommendation', url: 'https://example.com/biography/best-winner-recommendation' };
const context = { sources: [source], claims: [] };
const scan = (path: string, data: unknown, sources = [source]) => findStaticSiteIssues(path, JSON.stringify(data), new Set(), { sources, claims: [] });

describe('precise sourced editorial gate', () => {
  it('allows an original Slovak ranking title only inside validated source metadata', () => {
    const original = { ...baseSource, title: 'Poradie kandidátov' };
    const attribution = { sources: [original], claims: [] };
    const html = '<h2 data-source-id="source-1" data-source-field="title">Poradie kandidátov</h2>';
    expect(scan('src/data/sources.json', [original])).toEqual([]);
    expect(findStaticSiteIssues('dist/zdroje/index.html', html, new Set(), attribution)).toEqual([]);
    expect(findStaticSiteIssues('dist/zdroje/index.html', `${html}<p>Poradie kandidátov</p>`, new Set(), attribution))
      .toContain('prohibited public label');
  });
  it('accepts validated original source titles and URLs containing editorial terms', () => {
    expect(scan('src/data/sources.json', [source])).toEqual([]);
  });
  it.each(['quote', 'media_report', 'response', 'official_outcome'] as const)('accepts directly attributed %s text with safe resolved sources', (kind) => {
    expect(scan('src/data/claims.json', [{ ...baseClaim, kind, text: { sk: 'best winner recommendation biography; Poradie kandidátov' } }])).toEqual([]);
  });
  it.each(['label', 'period'] as const)('continues scanning app-authored claim %s', (field) => {
    const claim = { ...baseClaim, kind: 'quote', [field]: field === 'label' ? { sk: 'best winner' } : 'best winner' };
    expect(scan('src/data/claims.json', [claim])).toContain('prohibited public label');
  });
  it('does not exempt factual prose, candidate biographies or arbitrary JSON', () => {
    expect(scan('src/data/claims.json', [{ ...baseClaim, text: { sk: 'best winner' } }])).toContain('prohibited public label');
    expect(scan('src/data/candidates.json', [{ biography: 'best winner' }])).toContain('prohibited public label');
    expect(scan('src/data/other.json', [source])).toContain('prohibited public label');
  });
  it('rejects malformed metadata and unresolved or unsafe quotation sources', () => {
    expect(scan('src/data/sources.json', [{ ...source, biography: 'best winner' }])).not.toEqual([]);
    expect(scan('src/data/sources.json', [{ ...source, url: 'javascript:alert(1)' }])).not.toEqual([]);
    const quote = { ...baseClaim, kind: 'quote', text: { sk: 'best winner' } };
    expect(scan('src/data/claims.json', [quote], [])).toContain('prohibited public label');
    expect(scan('src/data/claims.json', [quote], [{ ...source, url: 'javascript:alert(1)' }])).toContain('prohibited public label');
  });
  it('exempts only the exact attributed source field in generated HTML', () => {
    const html = '<h2 data-source-id="source-1" data-source-field="title">Biography of a winner: best recommendation</h2>';
    expect(findStaticSiteIssues('dist/zdroje/index.html', html, new Set(), context)).toEqual([]);
    expect(findStaticSiteIssues('dist/zdroje/index.html', `${html}<p>best winner</p>`, new Set(), context)).toContain('prohibited public label');
    expect(findStaticSiteIssues('dist/zdroje/index.html', html.replace('source-1', 'missing'), new Set(), context)).toContain('prohibited public label');
  });
  it('exempts exact attributed quotation text, but never a modified quotation or unsourced label', () => {
    const claim = { ...baseClaim, kind: 'quote' as const, text: { sk: 'best winner' } };
    const attribution = { sources: [source], claims: [claim] };
    const html = '<p data-sourced-text="claim-1">best winner</p>';
    expect(findStaticSiteIssues('dist/kandidat/test/index.html', html, new Set(), attribution)).toEqual([]);
    expect(findStaticSiteIssues('dist/kandidat/test/index.html', html.replace('best winner', 'best winner ever'), new Set(), attribution)).toContain('prohibited public label');
  });
});
