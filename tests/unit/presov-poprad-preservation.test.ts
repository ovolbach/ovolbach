import { restoreAuditedFile } from '../helpers/history-audit-preservation';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import original from '../fixtures/presov-poprad-zilina-preservation.json';

it('adds a PSK cycle without altering any approved Žilina-cycle data or snapshots', () => {
  for (const [file, expected] of Object.entries(original)) {
    expect(createHash('sha256').update(restoreAuditedFile(`src/data/${file}`, readFileSync(`src/data/${file}`, 'utf8'))).digest('hex'), file).toBe(expected);
  }
});
