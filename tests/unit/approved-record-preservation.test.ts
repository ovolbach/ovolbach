import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { preservesApprovedRecord } from '../helpers/approved-record-preservation';

const audit = JSON.parse(readFileSync('research/martin-media-review-2026.json', 'utf8'));
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

describe('required audited record corrections', () => {
  it('rejects reverting every superseded Martin record, including documented removals', () => {
    for (const row of audit.recordChanges) {
      if (JSON.stringify(row.before) === JSON.stringify(row.after)) continue;
      expect(preservesApprovedRecord(`src/data/${row.path}`, row.id, row.before, hash(row.before)), row.id).toBe(false);
    }
  });

  it('accepts the audited Belousovová follow-up but rejects edits outside the audit', () => {
    const row = audit.recordChanges.find((change: { id: string }) => change.id === 'coverage-candidate-85-controversies');
    const path = `src/data/${row.path}`;
    const expected = hash(row.before);
    expect(preservesApprovedRecord(path, row.id, row.after, expected)).toBe(true);
    expect(preservesApprovedRecord(path, row.id, { ...row.after, checkedAt: row.before.checkedAt }, expected)).toBe(false);
    expect(preservesApprovedRecord(path, row.id, { ...row.after, sourceIds: row.before.sourceIds }, expected)).toBe(false);
  });
});
