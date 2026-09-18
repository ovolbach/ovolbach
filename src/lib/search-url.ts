export function safeInternalSearchUrl(value: string, origin: string): string | undefined {
  try {
    const base = new URL(origin);
    const url = new URL(value, base);
    if (!['http:', 'https:'].includes(url.protocol) || url.origin !== base.origin || url.username || url.password) return undefined;
    if (!url.pathname.startsWith('/')) return undefined;
    decodeURIComponent(url.pathname);
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return undefined;
  }
}
