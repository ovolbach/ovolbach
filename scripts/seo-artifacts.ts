import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import { SITE_URL } from '../src/config/site';

const outputDir = resolve('dist');
const origin = new URL(SITE_URL).origin;
const errors: string[] = [];

function fail(file: string, message: string): void {
  errors.push(`${file}: ${message}`);
}

async function htmlFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(path) : path.endsWith('.html') ? [path] : [];
  }));
  return nested.flat().sort();
}

function attribute(tag: string, name: string): string | undefined {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return tag.match(new RegExp(`(?:^|\\s)${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'iu'))?.slice(1).find(Boolean);
}

function tags(html: string, tagName: string): string[] {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'giu'))].map((match) => match[0]);
}

function meta(html: string, key: 'name' | 'property', value: string): string | undefined {
  const matches = tags(html, 'meta').filter((tag) => attribute(tag, key) === value);
  return matches.length === 1 ? attribute(matches[0]!, 'content') : undefined;
}

function expectedType(pathname: string): string {
  if (pathname === '/metodika/') return 'AboutPage';
  if (pathname === '/' || pathname === '/zdroje/' || /^\/[^/]+\/\d{4}\/(?:|kandidati\/|zdroje\/)$/u.test(pathname)) return 'CollectionPage';
  return 'WebPage';
}

function routeFor(file: string): string {
  const path = relative(outputDir, file).split(sep).join('/');
  return path === 'index.html' ? '/' : `/${path.replace(/index\.html$/u, '')}`;
}

function xmlEscape(value: string): string {
  return value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;').replace(/"/gu, '&quot;').replace(/'/gu, '&apos;');
}

async function main(): Promise<void> {
  const mode = process.argv[2] ?? '--check';
  if (!['--check', '--write-sitemap'].includes(mode)) throw new Error(`Unknown mode: ${mode}`);
  const files = await htmlFiles(outputDir);
  const titles = new Map<string, string>();
  const descriptions = new Map<string, string>();
  const canonicals: string[] = [];
  let errorPageCount = 0;

  for (const file of files) {
    const route = routeFor(file);
    const html = await readFile(file, 'utf8');
    const label = relative(outputDir, file).split(sep).join('/');
    const title = html.match(/<title>([^<]*)<\/title>/iu)?.[1];
    const description = meta(html, 'name', 'description');
    const h1Count = [...html.matchAll(/<h1\b/giu)].length;
    if (attribute(tags(html, 'html')[0] ?? '', 'lang') !== 'sk') fail(label, 'html lang must be sk');
    if (!title) fail(label, 'missing title');
    if (!description) fail(label, 'missing description');
    if (h1Count !== 1) fail(label, `expected one H1, found ${h1Count}`);
    if (/\bhreflang\s*=/iu.test(html)) fail(label, 'hreflang is not applicable to the Slovak-only site');

    const canonicalTags = tags(html, 'link').filter((tag) => attribute(tag, 'rel') === 'canonical');
    const canonical = canonicalTags.length === 1 ? attribute(canonicalTags[0]!, 'href') : undefined;
    if (route === '/404.html') {
      errorPageCount += 1;
      if (canonicalTags.length) fail(label, '404 page must not have a canonical');
      if (meta(html, 'name', 'robots') !== 'noindex') fail(label, '404 page must be noindex');
      if (!html.includes('legal-notice')) fail(label, '404 page lacks legal notice');
      continue;
    }

    const expectedCanonical = `${origin}${route}`;
    if (canonical !== expectedCanonical) fail(label, `canonical must be ${expectedCanonical}`);
    if (meta(html, 'name', 'robots')?.includes('noindex')) fail(label, 'indexable page has noindex');
    if (title) {
      if (titles.has(title)) fail(label, `duplicate title with ${titles.get(title)}`);
      titles.set(title, label);
    }
    if (description) {
      if (descriptions.has(description)) fail(label, `duplicate description with ${descriptions.get(description)}`);
      descriptions.set(description, label);
    }

    for (const [key, value] of [
      ['og:title', title], ['og:description', description], ['og:url', expectedCanonical],
      ['og:image', `${origin}/og-default.png`], ['og:locale', 'sk_SK'],
    ]) {
      if (meta(html, 'property', key!) !== value) fail(label, `missing or incorrect ${key}`);
    }
    if (meta(html, 'name', 'twitter:card') !== 'summary_large_image') fail(label, 'missing Twitter card');
    if (meta(html, 'name', 'twitter:title') !== title) fail(label, 'incorrect Twitter title');
    if (meta(html, 'name', 'twitter:description') !== description) fail(label, 'incorrect Twitter description');

    const jsonLd = html.match(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/iu)?.[1];
    if (!jsonLd) fail(label, 'missing JSON-LD');
    else {
      try {
        const data = JSON.parse(jsonLd) as { '@context'?: string; '@graph'?: Array<{ '@type'?: string; url?: string; about?: { '@type'?: string } }> };
        const graph = data['@graph'] ?? [];
        const page = graph.find((node) => node.url === expectedCanonical && node['@type'] === expectedType(route));
        if (data['@context'] !== 'https://schema.org' || !page) fail(label, 'JSON-LD page type or URL does not match HTML');
        if (graph.some((node) => node['@type'] === 'ProfilePage')) fail(label, 'unsupported ProfilePage markup');
        if (route === '/' && !graph.some((node) => node['@type'] === 'WebSite')) fail(label, 'homepage lacks WebSite markup');
        if (route.includes('/kandidat/') && page?.about?.['@type'] !== 'Person') fail(label, 'candidate page lacks Person subject');
        if (route !== '/' && !graph.some((node) => node['@type'] === 'BreadcrumbList')) fail(label, 'interior page lacks breadcrumbs');
      } catch {
        fail(label, 'invalid JSON-LD');
      }
    }
    canonicals.push(expectedCanonical);
  }

  if (errorPageCount !== 1) fail('404.html', `expected one custom 404 page, found ${errorPageCount}`);
  const robots = await readFile(join(outputDir, 'robots.txt'), 'utf8').catch(() => '');
  if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) fail('robots.txt', 'missing sitemap directive');
  const llms = await readFile(join(outputDir, 'llms.txt'), 'utf8').catch(() => '');
  if (!llms.includes(`${origin}/metodika/`) || !llms.includes(`${origin}/zdroje/`)) fail('llms.txt', 'missing methodology or sources link');
  await readFile(join(outputDir, 'og-default.png')).catch(() => fail('og-default.png', 'missing social image'));

  const urls = [...new Set(canonicals)].sort();
  if (urls.length !== canonicals.length) fail('sitemap.xml', 'duplicate canonical URL');
  if (errors.length) {
    console.error(errors.slice(0, 30).join('\n'));
    if (errors.length > 30) console.error(`... and ${errors.length - 30} more errors`);
    throw new Error(`SEO audit failed: ${errors.length} issue(s)`);
  }

  const sitemapPath = join(outputDir, 'sitemap.xml');
  if (mode === '--write-sitemap') {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${xmlEscape(url)}</loc></url>`).join('\n')}\n</urlset>\n`;
    await writeFile(sitemapPath, sitemap);
  } else {
    const sitemap = await readFile(sitemapPath, 'utf8').catch(() => '');
    const found = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/gu)].map((match) => match[1]);
    if (found.length !== urls.length || found.some((url, index) => url !== urls[index])) throw new Error('sitemap.xml does not match indexable canonical HTML pages');
  }
  console.log(`SEO audit passed: ${urls.length} canonical indexable pages, 1 noindex 404`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
