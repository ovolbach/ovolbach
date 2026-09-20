import { claimSchema, sourceSchema, type Claim, type Source } from './schemas';
import { resolveSourceLinks } from './source-links';

const exactMethodologyExplanation = 'Web nehodnotí ani neodporúča kandidátov. Nepoužíva skóre, poradia, víťazov, odznaky, sentiment ani odporúčania; zobrazuje len oddeliteľné zdrojované údaje v rovnakých kategóriách.';

const prohibitedLabel = /(?:best\w*|worst\w*|najlep\w*|najhor\w*|\u043b\u0443\u0447\u0448\w*|\u0445\u0443\u0434\u0448\w*|winner|winning|winners|víťaz\w*|\u043f\u043e\u0431\u0435\u0434\u0438\u0442\u0435\u043b\w*|summary|summaries|súhrn\w*|zhrnut\w*|\u0438\u0442\u043e\u0433\w*|\u0440\u0435\u0437\u044e\u043c\u0435\w*|recommend\w*|odporúč\w*|odporuc\w*|\u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\w*|score\w*|skóre|skore|rating\w*|rank\w*|poradie|rebríč\w*|rebric\w*|\u0440\u0435\u0439\u0442\u0438\u043d\u0433\w*|\u043e\u0446\u0435\u043d\u043a\w*|biograph\w*|biografia\w*|životopis\w*|profile summary|profilov[ýy] súhrn|kandidátsk[yiý] súhrn)/iu;
function decodeEscapes(value: string): string {
  return value
    .replace(/\\u\{([\da-f]+)\}/giu, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/\\u([\da-f]{4})/giu, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/\\x([\da-f]{2})/giu, (_, code) => String.fromCharCode(Number.parseInt(code, 16)));
}

function decodeHtmlEntities(value: string): string {
  const named: Record<string, string> = { amp: '&', apos: "'", colon: ':', gt: '>', lt: '<', nbsp: ' ', quot: '"' };
  return value
    .replace(/&#x([\da-f]+);/giu, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/gu, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&([a-z]+);/giu, (entity, name) => named[name.toLowerCase()] ?? entity);
}

function joinSimpleStrings(value: string): string {
  let joined = value;
  let previous = '';
  while (previous !== joined) {
    previous = joined;
    joined = joined.replace(/(['"`])([^'"`\\]*)\1\s*\+\s*(['"`])([^'"`\\]*)\3/gu, '$1$2$4$1');
  }
  return joined;
}

export function normalizeStaticText(value: string): string {
  return joinSimpleStrings(decodeHtmlEntities(decodeEscapes(value))).normalize('NFKC').toLocaleLowerCase('sk');
}

function hasServiceWorkerArtifact(path: string): boolean {
  const normalized = path.replaceAll('\\', '/').toLowerCase();
  return /(?:^|\/)(?:service[-_]?worker|sw|workbox|precache|runtime[-_]?cache|worker)[\w.-]*\.(?:[cm]?[jt]s|json|webmanifest)$/u.test(normalized)
    || /(?:^|\/)(?:manifest|webmanifest)(?:[.-][\w-]+)?\.(?:json|webmanifest)$/u.test(normalized);
}

function hasImageRendering(path: string, normalized: string): boolean {
  const isPagefindAsset = path.replaceAll('\\', '/').toLowerCase().startsWith('dist/pagefind/');
  if (isPagefindAsset) return false;
  const imageSource = /<\s*(?:img|picture|image)\b|<\s*picture\b[^>]*>[^]*?<\s*source\b|<\s*source\b[^>]*\bsrcset\s*=/u.test(normalized);
  const externalSvgReference = /<\s*svg\b[^>]*>[^]*?<\s*image\b|<\s*use\b[^>]*\b(?:href|xlink:href)\s*=\s*(?!(?:['"])?#)/u.test(normalized);
  const inlineStyleImage = /\bstyle\s*=\s*(?:['"][^'"]*\burl\s*\(|\{\{[^}]*\burl\s*\()/u.test(normalized)
    || /<\s*style\b[^>]*>[^]*?\burl\s*\(/u.test(normalized)
    || /\.style\s*\.\s*(?:setproperty\s*\([^,]+,\s*|\w+\s*=\s*)['"][^'"]*\burl\s*\(/u.test(normalized)
    || /\bcsstext\s*=\s*['"][^'"]*\burl\s*\(/u.test(normalized);
  return imageSource
    || externalSvgReference
    || /(?:document\s*\.)?createelement(?:ns)?\([^)]*['"](?:img|image|picture|source|svg)['"]/u.test(normalized)
    || /new\s+image\s*\(/u.test(normalized)
    || /\b(?:img|image|picture|photo|avatar|graphic|svg|source|node|element)\w*\s*\.\s*(?:src|srcset|href)\s*=/u.test(normalized)
    || /\b\w+\s*\[\s*['"](?:src|srcset|href)['"]\s*\]\s*=/u.test(normalized)
    || /\.\s*setattribute\s*\(\s*['"](?:src|srcset|href)['"]\s*,/u.test(normalized)
    || /(?:data|blob)\s*:\s*image\//u.test(normalized)
    || inlineStyleImage
    || (/\.css$/u.test(path) && /\burl\s*\(/u.test(normalized));
}

function imageReferences(normalized: string): string[] {
  const attribute = /\b(?:src|srcset|href)\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>"'=]+))/gu;
  const cssUrl = /\burl\s*\(\s*['"]?([^'"\s)]+)['"]?\s*\)/gu;
  const propertyAssignment = /\.\s*(?:src|srcset|href)\s*=\s*['"]([^'"]+)['"]/gu;
  const bracketAssignment = /\[\s*['"](?:src|srcset|href)['"]\s*\]\s*=\s*['"]([^'"]+)['"]/gu;
  const attributeMutation = /\.\s*setattribute\s*\(\s*['"](?:src|srcset|href)['"]\s*,\s*['"]([^'"]+)['"]/gu;
  return [...normalized.matchAll(attribute), ...normalized.matchAll(cssUrl), ...normalized.matchAll(propertyAssignment), ...normalized.matchAll(bracketAssignment), ...normalized.matchAll(attributeMutation)]
    .map((match) => match.slice(1).find((value): value is string => value !== undefined))
    .filter((url): url is string => url !== undefined);
}

function hasUnlicensedImageRendering(path: string, normalized: string, allowedImageUrls: ReadonlySet<string>): boolean {
  if (!hasImageRendering(path, normalized)) return false;
  if (allowedImageUrls.size === 0) return true;
  const references = imageReferences(normalized);
  return references.length === 0 || references.some((url) => !allowedImageUrls.has(url));
}

function isMethodologyPath(path: string): boolean {
  return ['src/pages/metodika.astro', 'dist/metodika/index.html'].includes(path.replaceAll('\\', '/'));
}

function visibleHtmlText(value: string): string {
  return value.replace(/<!--[^]*?-->|<(?:script|style)\b[^>]*>[^]*?<\/(?:script|style)>|<[^>]+>/giu, ' ');
}

function visibleSvgText(value: string): string {
  return [...value.matchAll(/<(?:text|tspan|title|desc)\b[^>]*>([^]*?)<\/(?:text|tspan|title|desc)>/giu)]
    .map(([, text]) => text === undefined ? '' : visibleHtmlText(text))
    .join(' ');
}

function codeLiterals(value: string): string {
  return [...joinSimpleStrings(value).matchAll(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/gu)]
    .map(([literal]) => literal.slice(1, -1))
    .join(' ');
}

function jsxVisibleText(value: string): string {
  return [...value.matchAll(/>([^<>{][^<>{]*)</gu)].map(([, text]) => text).join(' ');
}

function sourceEditorialText(path: string, value: string): string {
  if (/\.astro$/iu.test(path)) {
    const markup = value
      .replace(/^---[^]*?---\s*/u, '')
      .replace(/\{[^{}]*\}/gu, ' ');
    return `${visibleHtmlText(markup)} ${codeLiterals(value)}`;
  }
  if (/\.html$/iu.test(path)) return visibleHtmlText(value);
  if (/\.svg$/iu.test(path)) return visibleSvgText(value);
  if (/\.json$/iu.test(path)) return value;
  if (!/\.(?:ts|tsx|js|jsx|mjs|cjs)$/iu.test(path)) return '';
  return visibleHtmlText(`${codeLiterals(value)} ${/\.tsx?$/iu.test(path) ? jsxVisibleText(value) : ''}`);
}

export interface EditorialContext { sources: Source[]; claims: Claim[]; }

function validatedSources(sources: Source[]): Source[] {
  const result = sourceSchema.array().safeParse(sources);
  if (!result.success || new Set(result.data.map((source) => source.id)).size !== result.data.length) return [];
  return sources;
}

function isAttributedText(value: unknown, sources: Source[]): boolean {
  const parsed = claimSchema.safeParse(value);
  if (!parsed.success) return false;
  const claim = parsed.data;
  if (!['quote', 'media_report', 'response', 'official_outcome'].includes(claim.kind)) return false;
  try { resolveSourceLinks(claim.id, claim.sourceIds, sources); return true; }
  catch { return false; }
}

function attributedEditorialText(path: string, value: string, context: EditorialContext, issues: Set<string>): string {
  const sources = validatedSources(context.sources);
  if (path === 'src/data/sources.json' || path === 'src/data/claims.json' || /src\/data\/elections\/\d{4}\/[a-z0-9-]+\/claims\.json$/u.test(path)) {
    try {
      const json: unknown = JSON.parse(value);
      if (path === 'src/data/sources.json') {
        const records = sourceSchema.array().parse(json);
        if (new Set(records.map((source) => source.id)).size !== records.length) throw new Error('duplicate source');
        // Only original source metadata is exempt. Unknown fields fail strict parsing.
        return JSON.stringify(records.map(({ title, url, author, publisher, ...record }) => record));
      }
      const records = claimSchema.array().parse(json);
      return JSON.stringify(records.map((claim) => {
        try { resolveSourceLinks(claim.id, claim.sourceIds, sources); }
        catch { issues.add('invalid claim attribution'); }
        return isAttributedText(claim, sources) ? { ...claim, text: { sk: '' } } : claim;
      }));
    } catch {
      issues.add('invalid sourced data');
      return value;
    }
  }
  if (!/\.html$/iu.test(path)) return value;
  // Match a single text-only element, verify its exact field against validated data.
  // Neither a wrapper marker nor a matching phrase elsewhere can exempt UI prose.
  return value.replace(/<([a-z][\w-]*)\b([^>]*\bdata-(?:source-id|sourced-text)\s*=\s*"[^"]+"[^>]*)>([^<]*)<\/\1>/giu, (whole, _tag: string, attributes: string, text: string) => {
    const sourceId = /\bdata-source-id="([^"]+)"/u.exec(attributes)?.[1];
    const field = /\bdata-source-field="(title|publisher|author)"/u.exec(attributes)?.[1] as 'title' | 'publisher' | 'author' | undefined;
    const source = sources.find((item) => item.id === sourceId);
    const claimId = /\bdata-sourced-text="([^"]+)"/u.exec(attributes)?.[1];
    const claim = context.claims.find((item) => item.id === claimId);
    const expected = source && field ? source[field] : claim && isAttributedText(claim, sources) ? claim.text.sk : undefined;
    return expected !== undefined && decodeHtmlEntities(text) === expected ? '' : whole;
  });
}

export function findStaticSiteIssues(path: string, value: string, allowedImageUrls: ReadonlySet<string> = new Set(), context: EditorialContext = { sources: [], claims: [] }): string[] {
  const normalizedPath = path.replaceAll('\\', '/');
  const normalized = normalizeStaticText(value);
  const issues = new Set<string>();

  if (/\bdocument\s*(?:\.\s*cookie\b|\[\s*['"]cookie['"]\s*\])/u.test(normalized)) issues.add('document.cookie');
  if (/\blocalstorage\b/u.test(normalized)) issues.add('localStorage');
  if (/\bsessionstorage\b/u.test(normalized)) issues.add('sessionStorage');
  if (/\bindexeddb\s*(?:\.\s*(?:open|deletedatabase)\b|\[\s*['"](?:open|deletedatabase)['"]\s*\])/u.test(normalized)) issues.add('IndexedDB');
  if (/\b(?:caches|cachestorage)\b/u.test(normalized)) issues.add('Cache Storage');
  if (/\bservice[-_]?worker\b/u.test(normalized)) issues.add('service worker');
  if (/\b(?:new\s+(?:shared)?worker|(?:shared)?worker\b|worker[-_]?loader|\?worker\b)/u.test(normalized)) issues.add('worker');
  for (const match of normalized.matchAll(/\b(?:const|let|var)\s+(\w+)\s*=\s*navigator\s*(?:\.\s*serviceworker\b|\[\s*\(?\s*['"]serviceworker['"][^\]]*\])/gu)) {
    if (new RegExp(`\\b${match[1]}\\s*\\.\\s*register\\b`, 'u').test(normalized)) issues.add('service worker');
  }
  if (/(?:google-analytics\.com|googletagmanager\.com|plausible\.io|matomo\.cloud|segment\.com|mixpanel\.com|hotjar\.com)/u.test(normalized)) issues.add('analytics host');
  if (/(?:gtag\(|fbq\(|_paq\.push|analytics\.track\()/u.test(normalized)) issues.add('tracking script');
  if (hasServiceWorkerArtifact(normalizedPath)) issues.add('service worker artifact');
  if (/(?:addeventlistener\s*\(\s*['"]fetch['"]|skipwaiting\s*\(|clients\s*\.\s*claim\s*\(|importscripts\s*\(|\bworkbox\b)/u.test(normalized)) issues.add('service worker content');
  if (/(?:addeventlistener\s*\(\s*['"](?:fetch|push|sync|periodicsync|notificationclick|message)['"]|\b(?:self|globalthis)\s*\.\s*on(?:fetch|push|sync|periodicsync|notificationclick|message)\s*=|\bclients\b|importscripts\s*\(|\bworkbox\b)/u.test(normalized)) issues.add('worker runtime');
  if (hasUnlicensedImageRendering(normalizedPath, normalized, allowedImageUrls)) issues.add('unlicensed image rendering');

  const attributedText = attributedEditorialText(normalizedPath, value, context, issues);
  const editorialText = isMethodologyPath(normalizedPath)
    ? attributedText.replaceAll(exactMethodologyExplanation, '')
    : attributedText;
  const outputText = normalizedPath.startsWith('dist/') && normalizedPath.endsWith('.html')
    ? visibleHtmlText(editorialText)
    : sourceEditorialText(normalizedPath, editorialText);
  if (!normalizedPath.startsWith('dist/pagefind/') && prohibitedLabel.test(normalizeStaticText(outputText))) issues.add('prohibited public label');
  if (/(?:lang|hreflang)\s*=\s*["']ru\b|[\u0400-\u04ff]/u.test(value)) issues.add('Russian locale or UI');

  return [...issues].sort();
}
