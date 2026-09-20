import { spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const auditScript = fileURLToPath(new URL('../../scripts/audit-source-file-sizes.mjs', import.meta.url));

it('measures a file body when HEAD fails and the range response has no size', async () => {
  const body = Buffer.from('sample PDF body');
  const server = createServer((request, response) => {
    if (request.method === 'HEAD') {
      request.socket.destroy();
      return;
    }
    response.writeHead(request.headers.range ? 206 : 200, {
      'Content-Type': 'application/pdf',
      'Transfer-Encoding': 'chunked',
    });
    response.end(request.headers.range ? body.subarray(0, 1) : body);
  });
  const fixture = await mkdtemp(join(tmpdir(), 'source-size-audit-'));
  try {
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing test server port');
    await mkdir(join(fixture, 'scripts'), { recursive: true });
    await mkdir(join(fixture, 'src', 'data'), { recursive: true });
    await mkdir(join(fixture, 'docs'), { recursive: true });
    await copyFile(auditScript, join(fixture, 'scripts', 'audit-source-file-sizes.mjs'));
    await writeFile(join(fixture, 'src', 'data', 'sources.json'), JSON.stringify([{
      id: 'unsized-file', type: 'official', url: `http://127.0.0.1:${address.port}/file.pdf`,
    }]));

    const exitCode = await new Promise<number | null>((resolve, reject) => {
      const child = spawn(process.execPath, [join(fixture, 'scripts', 'audit-source-file-sizes.mjs')], { cwd: fixture });
      child.on('error', reject);
      child.on('close', resolve);
    });
    expect(exitCode).toBe(0);
    const date = new Date().toISOString().slice(0, 10);
    const report = JSON.parse(await readFile(join(fixture, 'docs', `source-file-sizes-${date}.json`), 'utf8'));
    expect(report.rows[0]).toMatchObject({ bytes: body.length, method: 'counted-body', isFile: true });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await rm(fixture, { recursive: true, force: true });
  }
});
