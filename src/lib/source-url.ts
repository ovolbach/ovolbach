export function isSafeOutboundSourceUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value)) return false;

  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:')
      && url.hostname.length > 0
      && url.username.length === 0
      && url.password.length === 0;
  } catch {
    return false;
  }
}

export function assertSafeOutboundSourceUrl(recordId: string, value: string): void {
  if (!isSafeOutboundSourceUrl(value)) {
    throw new Error(`${recordId}: unsafe source URL ${value}`);
  }
}
