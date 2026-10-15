import { readFileSync } from 'node:fs';

type Row = { id: string; candidateId?: string; [key: string]: unknown };
export type AuditedChange = { path: string; id: string; beforeIndex: number | null; before: Row | null; after: Row | null };
const audit = JSON.parse(readFileSync(new URL('../../research/four-cities-history-2000-recheck.json', import.meta.url), 'utf8'));

export function restoreAuditedRecords<T extends { id: string; candidateId?: string }>(path: string, records: T[], changes: AuditedChange[] = audit.recordChanges): T[] {
  const candidateIds = new Set(records.map((row) => row.candidateId).filter((id) => typeof id === 'string'));
  const applicable = changes.filter((change) => {
    const candidateId = (change.after ?? change.before)?.candidateId;
    return `src/data/${change.path}` === path && (candidateId === undefined || candidateIds.has(candidateId));
  });
  for (const change of applicable) {
    const current = records.find((row) => row.id === change.id);
    if (JSON.stringify(current ?? null) !== JSON.stringify(change.after)) {
      throw new Error(`${path}:${change.id}: current value differs from the exact audited after value`);
    }
  }
  const byId = new Map(applicable.map((change) => [change.id, change]));
  const restored = records.filter((row) => !byId.has(row.id) || byId.get(row.id)!.before !== null)
    .map((row) => (byId.get(row.id)?.before ?? row) as T);
  for (const change of applicable.filter((row) => row.before !== null && row.after === null)
    .sort((a, b) => a.beforeIndex! - b.beforeIndex!)) {
    if (change.beforeIndex === null) throw new Error(`${path}:${change.id}: missing original index`);
    restored.splice(change.beforeIndex, 0, change.before as T);
  }
  return restored;
}

export function restoreAuditedFile(path: string, raw: string): string {
  const configChange = (audit.configChanges ?? []).find((row: { path: string }) => `src/data/${row.path}` === path);
  if (configChange) {
    if (JSON.stringify(JSON.parse(raw)) !== JSON.stringify(configChange.after)) throw new Error(`${path}: unaudited config value`);
    if (JSON.stringify(JSON.parse(configChange.beforeRaw)) !== JSON.stringify(configChange.before)) throw new Error(`${path}: inconsistent original bytes`);
    return configChange.beforeRaw;
  }
  const applicable = audit.recordChanges.some((row: AuditedChange) => `src/data/${row.path}` === path);
  return applicable ? JSON.stringify(restoreAuditedRecords(path, JSON.parse(raw)), null, 2) + '\n' : raw;
}
