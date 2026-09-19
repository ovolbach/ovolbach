import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const tsxCli = fileURLToPath(new URL('../../node_modules/tsx/dist/cli.mjs', import.meta.url));
const generator = fileURLToPath(new URL('../../scripts/generate-sitemap.ts', import.meta.url));

it('generates route URLs without running SEO metadata validation', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'sitemap-generation-'));
  try {
    await mkdir(join(fixture, 'dist', 'metodika'), { recursive: true });
    await mkdir(join(fixture, 'dist', 'private'), { recursive: true });
    await writeFile(join(fixture, 'dist', 'index.html'), '<!doctype html><html lang="sk"><title>Home</title></html>');
    await writeFile(join(fixture, 'dist', 'metodika', 'index.html'), '<!doctype html><html lang="sk"><title>Method</title></html>');
    await writeFile(join(fixture, 'dist', 'private', 'index.html'), '<!doctype html><html lang="sk"><meta name="robots" content="noindex"></html>');
    await writeFile(join(fixture, 'dist', '404.html'), '<!doctype html><html lang="sk"><title>Missing</title></html>');

    const result = spawnSync(process.execPath, [tsxCli, generator], { cwd: fixture, encoding: 'utf8' });
    expect(result.status, result.stderr || result.stdout).toBe(0);
    const sitemap = await readFile(join(fixture, 'dist', 'sitemap.xml'), 'utf8');
    expect([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1])).toEqual([
      'https://ovolbach.sk/',
      'https://ovolbach.sk/metodika/',
    ]);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
