import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { SITE_URL } from '../src/config/site';

const outputDir = resolve('dist');
const origin = new URL(SITE_URL).origin;

async function htmlFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? htmlFiles(path) : path.endsWith('.html') ? [path] : [];
  }));
  return files.flat();
}

function routeFor(file: string): string {
  const path = relative(outputDir, file).split(sep).join('/');
  return path === 'index.html' ? '/' : `/${path.replace(/index\.html$/u, '')}`;
}

function xmlEscape(value: string): string {
  return value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/"/gu, '&quot;').replace(/'/gu, '&apos;');
}

async function main(): Promise<void> {
  const urls = new Set<string>();
  for (const file of await htmlFiles(outputDir)) {
    const route = routeFor(file);
    if (route === '/404.html') continue;
    const html = await readFile(file, 'utf8');
    if (/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/iu.test(html)) continue;
    urls.add(`${origin}${route}`);
  }
  const sorted = [...urls].sort();
  if (sorted.length === 0) throw new Error('No indexable HTML pages for sitemap');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sorted.map((url) => `  <url><loc>${xmlEscape(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
  await writeFile(join(outputDir, 'sitemap.xml'), sitemap);
  console.log(`Generated sitemap.xml with ${sorted.length} indexable URLs`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
