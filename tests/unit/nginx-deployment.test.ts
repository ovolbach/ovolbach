import { spawn, execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const nginxBin = process.env.NGINX_BIN;

describe.skipIf(!nginxBin)('deployed nginx routing', () => {
  let prefix: string;
  let configPath: string;
  let port: number;
  let serverProcess: ReturnType<typeof spawn>;

  beforeAll(async () => {
    prefix = await mkdtemp(path.join(tmpdir(), 'volbylm-nginx-test-'));
    const siteDir = path.join(prefix, 'site');
    await mkdir(path.join(prefix, 'logs'));
    await mkdir(path.join(prefix, 'temp'));
    await mkdir(path.join(siteDir, 'foo'), { recursive: true });
    await writeFile(path.join(siteDir, 'index.html'), 'home');
    await writeFile(path.join(siteDir, 'foo', 'index.html'), 'foo');
    await writeFile(path.join(siteDir, '404.html'), 'not found');

    const socket = createServer();
    await new Promise<void>((resolve) => socket.listen(0, '127.0.0.1', resolve));
    port = (socket.address() as { port: number }).port;
    await new Promise<void>((resolve) => socket.close(() => resolve()));

    const serverConfig = await readFile('deploy/nginx/default.conf', 'utf8');
    const root = siteDir.replaceAll('\\', '/');
    const configured = serverConfig
      .replace('listen 80;', `listen 127.0.0.1:${port};`)
      .replace('listen 80 default_server;', `listen 127.0.0.1:${port} default_server;`)
      .replaceAll('root /usr/share/nginx/html;', `root "${root}";`);
    configPath = path.join(prefix, 'nginx.conf');
    await writeFile(
      configPath,
      `worker_processes 1;\npid logs/nginx.pid;\nevents { worker_connections 64; }\nhttp {\n${configured}\n}\n`,
    );

    await execFileAsync(nginxBin!, ['-t', '-p', `${prefix}/`, '-c', configPath]);
    serverProcess = spawn(nginxBin!, ['-p', `${prefix}/`, '-c', configPath, '-g', 'daemon off;'], {
      cwd: path.dirname(nginxBin!),
      windowsHide: true,
      stdio: 'ignore',
    });
    for (let attempt = 0; attempt < 50; attempt += 1) {
      try {
        await fetch(`http://127.0.0.1:${port}/`);
        return;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    throw new Error('nginx did not start');
  }, 15_000);

  afterAll(async () => {
    if (serverProcess) {
      await execFileAsync(nginxBin!, ['-s', 'quit', '-p', `${prefix}/`, '-c', configPath]);
      serverProcess.kill();
    }
    if (prefix) await rm(prefix, { recursive: true, force: true });
  });

  it('serves slash routes and redirects explicit index files to canonical URLs', async () => {
    const base = `http://127.0.0.1:${port}`;
    for (const route of ['/', '/foo/']) {
      const response = await fetch(`${base}${route}`, { redirect: 'manual' });
      expect(response.status, route).toBe(200);
    }
    for (const [route, canonical] of [
      ['/foo?x=1', '/foo/?x=1'],
      ['/index.html', '/'],
      ['/index.html?x=1', '/?x=1'],
      ['/foo/index.html', '/foo/'],
      ['/foo/index.html?x=1', '/foo/?x=1'],
    ]) {
      const response = await fetch(`${base}${route}`, { redirect: 'manual' });
      expect(response.status, route).toBe(301);
      expect(response.headers.get('location'), route).toBe(canonical);
    }
    const queryOnly = await fetch(`${base}/foo/?x=/index.html`, { redirect: 'manual' });
    expect(queryOnly.status).toBe(200);
    const malformed = await fetch(`${base}//evil.example/index.html?x=1`, { redirect: 'manual' });
    expect(malformed.headers.get('location') ?? '').not.toMatch(/^\/\//);
    const missing = await fetch(`${base}/missing/`, { redirect: 'manual' });
    expect(missing.status).toBe(404);
    expect(await missing.text()).toBe('not found');
  });

  it('redirects www requests to the canonical host', async () => {
    const response = await new Promise<{ status: number | undefined; location: string | undefined }>((resolve, reject) => {
      const client = request({ hostname: '127.0.0.1', port, path: '/foo/?x=1', headers: { Host: 'www.ovolbach.sk' } }, (serverResponse) => {
        serverResponse.resume();
        resolve({ status: serverResponse.statusCode, location: serverResponse.headers.location });
      });
      client.on('error', reject);
      client.end();
    });
    expect(response.status).toBe(301);
    expect(response.location).toBe('https://ovolbach.sk/foo/?x=1');
  });

  it('sends historical election URLs directly to their current pages', async () => {
    const base = `http://127.0.0.1:${port}`;
    for (const [route, canonical] of [
      ['/kandidati/', '/liptovsky-mikulas/2026/kandidati/'],
      ['/ako-volit/index.html?x=1', '/liptovsky-mikulas/2026/ako-volit/?x=1'],
      ['/porovnat?volby=mayor', '/liptovsky-mikulas/2026/porovnat/?volby=mayor'],
      ['/kandidat/michal-paska/', '/liptovsky-mikulas/2026/kandidat/michal-paska/'],
      ['/kandidat/tana-sufliarskamgr/index.html', '/liptovsky-mikulas/2026/kandidat/tana-sufliarska/'],
      ['/liptovsky-mikulas/2026/kandidat/tana-sufliarskamgr/', '/liptovsky-mikulas/2026/kandidat/tana-sufliarska/'],
    ]) {
      const response = await fetch(`${base}${route}`, { redirect: 'manual' });
      expect(response.status, route).toBe(301);
      expect(response.headers.get('location'), route).toBe(canonical);
    }
    const unknown = await fetch(`${base}/kandidat/not-a-candidate/`, { redirect: 'manual' });
    expect(unknown.status).toBe(404);
  });

  it('sends historical www URLs to the final canonical host in one hop', async () => {
    const response = await new Promise<{ status: number | undefined; location: string | undefined }>((resolve, reject) => {
      const client = request({ hostname: '127.0.0.1', port, path: '/kandidat/tana-sufliarskamgr/?x=1', headers: { Host: 'www.ovolbach.sk' } }, (serverResponse) => {
        serverResponse.resume();
        resolve({ status: serverResponse.statusCode, location: serverResponse.headers.location });
      });
      client.on('error', reject);
      client.end();
    });
    expect(response.status).toBe(301);
    expect(response.location).toBe('https://ovolbach.sk/liptovsky-mikulas/2026/kandidat/tana-sufliarska/?x=1');
  });
});
