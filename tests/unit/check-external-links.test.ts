import { describe, expect, it } from 'vitest';
import { checkExternalLinks } from '../../src/lib/check-external-links';
import { baseSource } from '../fixtures/guide-data';

const sources = (urls: string[]) => urls.map((url, index) => ({
  ...baseSource,
  id: `source-${index + 1}`,
  url,
}));

describe('checkExternalLinks', () => {
  it('deduplicates URLs while retaining all linked source IDs', async () => {
    let calls = 0;
    const result = await checkExternalLinks(sources(['https://example.test/a', 'https://example.test/a']), async () => {
      calls += 1;
      return new Response('', { status: 200 });
    });

    expect(calls).toBe(1);
    expect(result).toMatchObject([{ url: 'https://example.test/a', sourceIds: ['source-1', 'source-2'], reachable: true }]);
  });

  it('sends a ranged GET and follows redirects', async () => {
    let request: RequestInit | undefined;
    const result = await checkExternalLinks(sources(['https://example.test/a']), async (_url, init) => {
      request = init;
      return { status: 302, url: 'https://example.test/final' } as Response;
    });

    expect(request).toMatchObject({ method: 'GET', headers: { Range: 'bytes=0-0' }, redirect: 'follow' });
    expect(result[0]).toMatchObject({ reachable: true, finalUrl: 'https://example.test/final', status: 302 });
  });

  it('retries one transport failure before returning a reachable result', async () => {
    let attempts = 0;
    const result = await checkExternalLinks(sources(['https://example.test/a']), async () => {
      attempts += 1;
      if (attempts === 1) throw new TypeError('network down');
      return new Response(null, { status: 204 });
    });

    expect(attempts).toBe(2);
    expect(result[0]).toMatchObject({ reachable: true, status: 204 });
  });

  it('reports timeout aborts after one retry without a network call', async () => {
    let aborted = 0;
    let scheduled: (() => void) | undefined;
    const result = await checkExternalLinks(
      sources(['https://example.test/a']),
      async (_url, init) => {
        scheduled?.();
        if (init?.signal?.aborted) throw new DOMException('Aborted', 'AbortError');
        throw new Error('Expected timeout to abort request');
      },
      {
        setTimeout: (callback) => {
          scheduled = callback;
          return 1;
        },
        clearTimeout: () => undefined,
        createAbortController: () => ({
          signal: { get aborted() { return aborted > 0; } } as AbortSignal,
          abort: () => { aborted += 1; },
        } as AbortController),
      },
    );

    expect(aborted).toBe(2);
    expect(result[0]).toMatchObject({ reachable: false, timedOut: true, attempts: 2 });
  });

  it('treats 401, 403, 405, and 429 as reachable but reviewable', async () => {
    const result = await checkExternalLinks(
      sources([
        'https://example.test/auth-required',
        'https://example.test/forbidden',
        'https://example.test/method-not-allowed',
        'https://example.test/rate-limited',
      ]),
      async (url) => new Response('', {
        status: url.toString().includes('auth-required') ? 401
          : url.toString().includes('forbidden') ? 403
            : url.toString().includes('method-not-allowed') ? 405
              : 429,
      }),
    );

    expect(result.map((link) => link.status)).toEqual([401, 403, 405, 429]);
    expect(result.every((link) => link.reachable)).toBe(true);
    expect(result.every((link) => link.needsManualReview)).toBe(true);
  });

  it('reports 404 without retrying or mutating source records', async () => {
    const input = Object.freeze(sources(['https://example.test/missing']));
    let calls = 0;
    const result = await checkExternalLinks(input, async () => {
      calls += 1;
      return new Response('', { status: 404 });
    });

    expect(calls).toBe(1);
    expect(result[0]).toMatchObject({ reachable: false, needsManualReview: false, status: 404 });
    expect(input[0]?.checkedAt).toBe('2026-09-17');
  });
});
