import { describe, expect, it } from 'vitest';
import { sourceSchema } from '../../src/lib/schemas';
import { resolveSourceLinks, resolveRecordSources } from '../../src/lib/source-links';

const officialSource = {
  id: 'official-roster',
  url: 'https://www.example.gov.sk/roster.pdf',
  title: 'Oficiálny zoznam',
  publisher: 'Mesto',
  checkedAt: '2026-09-17',
  language: 'sk' as const,
  type: 'official' as const,
};

describe('source links', () => {
  it('joins adjacent record attribution once per source, preserving original order', () => {
    expect(resolveRecordSources([
      { id: 'candidate', sourceIds: [officialSource.id] },
      { id: 'candidacy', sourceIds: [officialSource.id] },
    ], [officialSource])).toEqual([officialSource]);
  });
  it('does not hide an unsourced record behind another sourced record', () => {
    expect(() => resolveRecordSources([
      { id: 'candidate', sourceIds: [] },
      { id: 'candidacy', sourceIds: [officialSource.id] },
    ], [officialSource])).toThrow('candidate: sourceIds must not be empty');
  });
  it('resolves a valid official HTTPS source', () => {
    expect(resolveSourceLinks('claim-1', [officialSource.id], [officialSource])).toEqual([officialSource]);
    expect(sourceSchema.safeParse(officialSource).success).toBe(true);
  });

  it('rejects an unknown source ID with record context', () => {
    expect(() => resolveSourceLinks('claim-17', ['missing-source'], [officialSource]))
      .toThrow('claim-17: unknown source ID missing-source');
  });

  it('rejects an empty source list for a sourced record', () => {
    expect(() => resolveSourceLinks('claim-17', [], [officialSource]))
      .toThrow('claim-17: sourceIds must not be empty');
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,unsafe',
    'https://user:pass@example.com/secret',
    'https:example.com/ambiguous',
  ])('rejects unsafe source URL %s', (url) => {
    expect(sourceSchema.safeParse({ ...officialSource, url }).success).toBe(false);
  });

  it('rejects an insecure HTTP source URL', () => {
    expect(sourceSchema.safeParse({ ...officialSource, url: 'http://www.example.gov.sk/roster.pdf' }).success).toBe(false);
  });
});
