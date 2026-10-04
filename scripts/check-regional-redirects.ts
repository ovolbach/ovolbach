import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { request } from 'node:http';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { listPublishedElectionContexts } from '../src/lib/load-guide-data';
import { assembleRegionalContext, candidateProfilePath } from '../src/lib/regional-context';

// Run the production nginx configuration against the actual build, without
// changing the system nginx installation or listening on a public interface.
const nginxBin = process.env.NGINX_BIN;
if (!nginxBin) throw new Error('Set NGINX_BIN to a local nginx executable before running check:redirects');
const execFileAsync = promisify(execFile);
const prefix = await mkdtemp(path.join(tmpdir(), 'regional-redirects-'));
let server: ReturnType<typeof spawn> | undefined;
let configPath: string | undefined;

try {
  const contexts = await listPublishedElectionContexts();
  const region = assembleRegionalContext(contexts);
  const config = await readFile('deploy/nginx/default.conf', 'utf8');
  const site = path.resolve('dist');
  const socket = createServer();
  await new Promise<void>((resolve) => socket.listen(0, '127.0.0.1', resolve));
  const port = (socket.address() as { port: number }).port;
  await new Promise<void>((resolve) => socket.close(() => resolve()));
  await mkdir(path.join(prefix, 'logs'));
  await mkdir(path.join(prefix, 'temp'));
  const configured = config
    .replace('listen 80;', `listen 127.0.0.1:${port};`)
    .replace('listen 80 default_server;', `listen 127.0.0.1:${port} default_server;`)
    .replaceAll('root /usr/share/nginx/html;', `root "${site}";`);
  configPath = path.join(prefix, 'nginx.conf');
  await writeFile(configPath, `worker_processes 1;\npid logs/nginx.pid;\nerror_log logs/error.log;\nevents { worker_connections 64; }\nhttp {\naccess_log off;\nclient_body_temp_path temp/body;\nproxy_temp_path temp/proxy;\nfastcgi_temp_path temp/fastcgi;\nuwsgi_temp_path temp/uwsgi;\nscgi_temp_path temp/scgi;\n${configured}\n}\n`);
  await execFileAsync(nginxBin, ['-t', '-p', `${prefix}/`, '-c', configPath]);
  server = spawn(nginxBin, ['-p', `${prefix}/`, '-c', configPath, '-g', 'daemon off;'], { stdio: 'ignore' });
  const get = (uri: string, host = 'ovolbach.sk') => new Promise<{ status: number; location?: string; body: string }>((resolve, reject) => {
    const client = request({ hostname: '127.0.0.1', port, path: uri, headers: { Host: host }, timeout: 5000 }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk: string) => { body += chunk; });
      response.on('end', () => resolve({ status: response.statusCode!, ...(response.headers.location ? { location: response.headers.location } : {}), body }));
    });
    client.on('error', reject);
    client.on('timeout', () => client.destroy(new Error(`nginx request timed out: ${uri}`)));
    client.end();
  });
  let ready = false;
  for (let attempt = 0; attempt < 50; attempt++) {
    try { await get('/'); ready = true; break; } catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
  }
  assert(ready, 'nginx did not start');

  const redirects = contexts.flatMap((context) => region.data.candidates.map((candidate) => ({
    old: `${context.basePath}kandidat/${candidate.slug}`, target: candidateProfilePath(region, candidate.id),
  })));
  const entries = [...config.matchAll(/^\s*~(\S+)\s+(\/zilinsky-kraj\/2026\/kandidat\/\S+);\s*#\s*candidate-\d+\s*$/gm)];
  for (const [, pattern, target] of entries) {
    if (pattern!.startsWith('^/kandidat/') || pattern!.startsWith('^/liptovsky-mikulas/2026/kandidat/')) {
      redirects.push({ old: pattern!.split('(?:/index')[0]!.slice(1), target: target! });
    }
  }
  const query = '?kandidat=candidate-89&kandidat=candidate-90&x=%2Findex.html';
  let checks = 0;
  for (const redirect of redirects) {
    for (const suffix of ['', '/', '/index.html']) for (const host of ['ovolbach.sk', 'www.ovolbach.sk']) {
      const uri = `${redirect.old}${suffix}${query}`;
      const response = await get(uri, host);
      assert.equal(response.status, 301, `${host}${uri}`);
      assert.equal(response.location, `${host.startsWith('www.') ? 'https://ovolbach.sk' : ''}${redirect.target}${query}`, `${host}${uri}`);
      checks++;
    }
  }
  for (const candidate of region.data.candidates) {
    const route = candidateProfilePath(region, candidate.id);
    const response = await get(`${route}${query}`);
    assert.equal(response.status, 200, route);
    assert(response.body.includes(`data-candidate-id="${candidate.id}"`), `${route}: candidate identity missing`);
    assert(response.body.includes(`href="https://ovolbach.sk${route}"`), `${route}: canonical missing`);
  }
  for (const route of ['/martin/2026/kandidat/not-a-candidate/', '/zilinsky-kraj/2026/kandidat/not-a-candidate/', '/neexistuje/2026/kandidat/anna-belousovova/']) {
    assert.equal((await get(route)).status, 404, route);
  }
  console.log(`nginx: ${checks} redirects checked (${redirects.length} old routes), ${region.data.candidates.length} final profiles return 200, unknown routes return 404`);
} finally {
  if (server && configPath) {
    await execFileAsync(nginxBin, ['-s', 'quit', '-p', `${prefix}/`, '-c', configPath]).catch(() => server?.kill());
    if (server.exitCode === null) await new Promise<void>((resolve) => server!.once('exit', () => resolve()));
  }
  await rm(prefix, { recursive: true, force: true });
}
