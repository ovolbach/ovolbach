import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('coverage report CLI', () => {
  it('labels the published city and year and accepts a city/year filter', () => {
    const result = spawnSync(process.execPath, [
      '--import', 'tsx', 'scripts/report-coverage.ts', '--city=liptovsky-mikulas', '--year=2026',
    ], { cwd: process.cwd(), encoding: 'utf8', timeout: 30_000 });
    expect(result.status, `${result.stdout}\n${result.stderr}`).toBe(0);
    expect(result.stdout).toContain('/liptovsky-mikulas/2026/');
    expect(result.stdout).toContain('releaseReady=true pending=0');
  });
});
