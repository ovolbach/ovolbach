import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';

const dist = resolve('dist');
const reportPath = resolve('test-results/html-validation.json');

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(path) : Promise.resolve(path.endsWith('.html') ? [path] : []);
  }));
  return files.flat().sort();
}

async function checkerCommand(files) {
  const options = ['--format', 'json', '--stdout', ...files];
  const bundledJava = resolve('.superpowers/vnu/vnu-runtime-image/bin', process.platform === 'win32' ? 'java.exe' : 'java');
  if (process.env.VNU_JAVA) return { command: process.env.VNU_JAVA, args: ['-m', 'vnu/nu.validator.client.SimpleCommandLineValidator', ...options] };
  if (process.env.VNU_JAR) return { command: 'java', args: ['-jar', process.env.VNU_JAR, ...options] };
  if (!existsSync(bundledJava)) {
    const asset = { win32: 'vnu.windows.zip', linux: 'vnu.linux.zip', darwin: 'vnu.osx.zip' }[process.platform];
    if (!asset) throw new Error(`Unsupported platform: ${process.platform}. Set VNU_JAVA or VNU_JAR.`);
    const cache = resolve('.superpowers/vnu');
    await mkdir(cache, { recursive: true });
    const archive = join(cache, asset);
    console.log(`Downloading official W3C Nu Checker: ${asset}`);
    const response = await fetch(`https://github.com/validator/validator/releases/download/latest/${asset}`);
    if (!response.ok) throw new Error(`Nu Checker download failed: HTTP ${response.status}`);
    const data = Buffer.from(await response.arrayBuffer());
    if (data.length < 1_000_000) throw new Error('Nu Checker download is unexpectedly small');
    await writeFile(archive, data);
    const extracted = spawnSync('tar', ['-xf', archive, '-C', cache], { encoding: 'utf8' });
    if (extracted.status !== 0 || !existsSync(bundledJava)) {
      throw new Error(`Nu Checker extraction failed: ${extracted.error ?? extracted.stderr}`);
    }
  }
  return { command: bundledJava, args: ['-m', 'vnu/nu.validator.client.SimpleCommandLineValidator', ...options] };
}

async function main() {
  const files = await htmlFiles(dist);
  if (files.length === 0 || !files.includes(join(dist, '404.html'))) {
    throw new Error('dist must contain HTML pages and 404.html before validation');
  }

  const { command, args } = await checkerCommand(files);
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  if (result.error) throw result.error;
  let response;
  try {
    response = JSON.parse(result.stdout);
  } catch {
    throw new Error(`Nu Checker returned no valid JSON (exit ${result.status}). ${result.stderr || result.stdout}`);
  }
  if (!Array.isArray(response.messages) || !response.version) {
    throw new Error('Nu Checker response has no version or messages array');
  }

  const messages = response.messages.map((message) => ({
    ...message,
    file: message.url?.startsWith('file:')
      ? decodeURIComponent(new URL(message.url).pathname).replace(/^\/(?=[A-Za-z]:)/u, '').split('/').join(sep)
      : message.url,
  }));
  const errors = messages.filter((message) => message.type === 'error' || message.type === 'non-document-error');
  const warnings = messages.filter((message) => message.subType === 'warning');
  const report = {
    checkedAt: new Date().toISOString(),
    checker: 'W3C Nu Html Checker',
    version: response.version,
    filesChecked: files.length,
    errorCount: errors.length,
    warningCount: warnings.length,
    messages,
  };
  await mkdir(resolve('test-results'), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`W3C Nu Checker ${response.version}: ${files.length} HTML files, ${errors.length} errors, ${warnings.length} warnings`);
  console.log(`Report: ${reportPath}`);
  for (const issue of errors.slice(0, 20)) {
    console.error(`${issue.file ?? 'unknown'}:${issue.lastLine ?? '?'}: ${issue.message}`);
  }
  if (result.status !== 0 || errors.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
