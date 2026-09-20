import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('archive validation CLI', () => {
  it('validates the published LM context from the new city/year data layout', () => {
    const result = spawnSync(process.execPath, ['--import', 'tsx', 'scripts/validate-data.ts', '--mode=release'], {
      cwd: process.cwd(), encoding: 'utf8', timeout: 30_000,
    });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
  });

});
