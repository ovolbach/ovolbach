import type { Source } from './schemas';

export interface LinkResult {
  url: string;
  finalUrl: string;
  sourceIds: string[];
  status?: number;
  reachable: boolean;
  needsManualReview: boolean;
  timedOut: boolean;
  attempts: number;
  error?: string;
}

export interface LinkCheckDependencies {
  timeoutMs?: number;
  setTimeout?: (callback: () => void, ms: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
  createAbortController?: () => AbortController;
}

const MANUAL_REVIEW_STATUSES = new Set([401, 403, 405, 429]);

function sourceGroups(sources: readonly Source[]): Array<{ url: string; sourceIds: string[] }> {
  const groups = new Map<string, string[]>();
  for (const source of sources) {
    const sourceIds = groups.get(source.url) ?? [];
    sourceIds.push(source.id);
    groups.set(source.url, sourceIds);
  }
  return [...groups].map(([url, sourceIds]) => ({ url, sourceIds }));
}

export async function checkExternalLinks(
  sources: readonly Source[],
  fetcher: typeof fetch,
  dependencies: LinkCheckDependencies = {},
): Promise<LinkResult[]> {
  const timeoutMs = dependencies.timeoutMs ?? 15_000;
  const schedule = dependencies.setTimeout ?? ((callback: () => void, ms: number) => globalThis.setTimeout(callback, ms));
  const cancel = dependencies.clearTimeout ?? ((handle: unknown) => globalThis.clearTimeout(handle as ReturnType<typeof setTimeout>));
  const createAbortController = dependencies.createAbortController ?? (() => new AbortController());

  return Promise.all(sourceGroups(sources).map(async ({ url, sourceIds }) => {
    let lastError: unknown;
    let timedOut = false;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const controller = createAbortController();
      let attemptTimedOut = false;
      const timeout = schedule(() => {
        attemptTimedOut = true;
        controller.abort();
      }, timeoutMs);

      try {
        const response = await fetcher(url, {
          method: 'GET',
          headers: { Range: 'bytes=0-0' },
          redirect: 'follow',
          signal: controller.signal,
        });
        const status = response.status;
        const needsManualReview = MANUAL_REVIEW_STATUSES.has(status);
        return {
          url,
          finalUrl: response.url || url,
          sourceIds,
          status,
          reachable: (status >= 200 && status < 400) || needsManualReview,
          needsManualReview,
          timedOut: false,
          attempts: attempt,
        };
      } catch (error) {
        lastError = error;
        timedOut ||= attemptTimedOut;
      } finally {
        cancel(timeout);
      }
    }

    return {
      url,
      finalUrl: url,
      sourceIds,
      reachable: false,
      needsManualReview: false,
      timedOut,
      attempts: 2,
      error: timedOut ? `Request timed out after ${timeoutMs}ms` : String(lastError),
    };
  }));
}
