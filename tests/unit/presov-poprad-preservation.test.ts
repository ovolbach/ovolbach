import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import original from '../fixtures/presov-poprad-zilina-preservation.json';

it('adds a PSK cycle without altering any approved Žilina-cycle data or snapshots', () => {
  for (const [file, expected] of Object.entries(original)) {
    expect(createHash('sha256').update(readFileSync(`src/data/${file}`)).digest('hex'), file).toBe(expected);
  }
});
