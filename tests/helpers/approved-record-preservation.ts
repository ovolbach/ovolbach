import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
const cycle = 'src/data/elections/2026/zilinsky-kraj/';
type RecordValue = { id: string; checkedAt?: string; [key: string]: unknown };
type Correction = { path: string; id: string; before: RecordValue | null; after: RecordValue | null };
type DateCorrection = { claimId: string; before: string; after: string };
const corrections: Correction[] = [];
const dates: DateCorrection[] = [];
for (const filename of ['martin-media-review-2026.json', 'ruzomberok-media-review-2026.json', 'dolny-kubin-media-review-2026.json', 'campaign-account-recheck-2026-10-04.json']) {
  const url = new URL(`research/${filename}`, root);
  if (!existsSync(url)) continue;
  const audit = JSON.parse(readFileSync(url, 'utf8'));
  for (const row of audit.recordChanges ?? []) corrections.push({ ...row, path: `src/data/${row.path}` });
  for (const [field, path] of [['sourceChanges', 'src/data/sources.json'], ['claimCorrections', `${cycle}claims.json`], ['coverageChanges', `${cycle}research-coverage.json`]] as const) {
    for (const row of audit[field] ?? []) {
      if (row.before && typeof row.before === 'object') corrections.push({ path, id: row.before.id, before: row.before, after: row.after });
    }
  }
  dates.push(...(audit.claimVerificationDateChanges ?? []));
}
const fingerprint = (value: RecordValue | null | undefined) => value == null ? 'missing' : createHash('sha256').update(JSON.stringify(value)).digest('hex');

/** Require the latest audited state, linked to the protected original by exact recorded corrections. */
export function preservesApprovedRecord(path: string, id: string, current: RecordValue | undefined, expectedHash: string): boolean {
  const currentHash = fingerprint(current);
  // An audit supersedes its before value even when that value is the protected baseline.
  if (corrections.some((row) => row.path === path && row.id === id
    && fingerprint(row.before) === currentHash && fingerprint(row.after) !== currentHash)) return false;
  if (current && path === `${cycle}claims.json`
    && dates.some((row) => row.claimId === id && current.checkedAt === row.before && row.after !== row.before)) return false;
  const queue: Array<RecordValue | null | undefined> = [current];
  const visited = new Set<string>();
  while (queue.length) {
    const value = queue.shift();
    const hash = fingerprint(value);
    if (hash === expectedHash) return true;
    if (visited.has(hash)) continue;
    visited.add(hash);
    for (const row of corrections) if (row.path === path && row.id === id && fingerprint(row.after) === hash) queue.push(row.before);
    if (value && path === `${cycle}claims.json`) {
      for (const row of dates) if (row.claimId === id && value.checkedAt === row.after) queue.push({ ...value, checkedAt: row.before });
    }
  }
  return false;
}
