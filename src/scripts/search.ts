import { safeInternalSearchUrl } from '../lib/search-url';

interface SearchResultData {
  url: string;
  meta: { title?: string };
  excerpt: string;
}

interface PagefindModule {
  search(query: string, options?: { filters: { city: string; year: string } }): Promise<{ results: Array<{ data(): Promise<SearchResultData> }> }>;
}

const searchForm = document.querySelector<HTMLFormElement>('[data-search-form]');
const input = document.querySelector<HTMLInputElement>('[data-search-input]');
const results = document.querySelector<HTMLOListElement>('[data-search-results]');
const searchStatus = document.querySelector<HTMLElement>('[data-search-status]');
let pagefind: Promise<PagefindModule> | undefined;
let searchVersion = 0;
const pagefindPath = '/pagefind/pagefind.js';
const importFromUrl = new Function('url', 'return import(url)') as (url: string) => Promise<PagefindModule>;
const contexts = JSON.parse(searchForm?.dataset.searchContexts ?? '[]') as Array<{ citySlug: string; cityName: string; year: number }>;

function loadPagefind(): Promise<PagefindModule> {
  pagefind ??= importFromUrl(pagefindPath);
  return pagefind;
}

function clearResults(): void {
  results?.replaceChildren();
}

function resultLink(result: SearchResultData): HTMLAnchorElement | undefined {
  const url = safeInternalSearchUrl(result.url, window.location.origin);
  if (!url) return undefined;
  const link = document.createElement('a');
  link.href = url;
  link.textContent = result.meta.title ?? result.url;
  return link;
}

function renderResult(result: SearchResultData): HTMLLIElement | undefined {
  const link = resultLink(result);
  if (!link) return undefined;
  const item = document.createElement('li');
  const path = new URL(link.href).pathname;
  const context = contexts.find(({ citySlug, year }) => path.startsWith(`/${citySlug}/${year}/`));
  if (context) {
    const label = document.createElement('span');
    label.className = 'search-result-context';
    label.textContent = `${context.cityName} · ${context.year}`;
    item.append(label);
  }
  const excerpt = document.createElement('p');
  excerpt.textContent = result.excerpt.replace(/<[^>]*>/gu, '');
  item.append(link, excerpt);
  return item;
}

async function search(query: string): Promise<void> {
  const version = ++searchVersion;
  const term = query.trim();
  clearResults();
  if (!term) {
    if (searchStatus) searchStatus.textContent = 'Začnite písať hľadaný výraz.';
    return;
  }

  if (searchStatus) searchStatus.textContent = 'Hľadám…';
  try {
    const city = searchForm?.dataset.searchCity;
    const year = searchForm?.dataset.searchYear;
    const found = await (await loadPagefind()).search(term, city && year ? { filters: { city, year } } : undefined);
    const details = await Promise.all(found.results.slice(0, 10).map((result) => result.data()));
    if (version !== searchVersion) return;
    const rendered = details.map(renderResult).filter((result): result is HTMLLIElement => result !== undefined);
    results?.append(...rendered);
    if (searchStatus) searchStatus.textContent = `Výsledky hľadania: ${rendered.length}.`;
  } catch {
    if (version === searchVersion && searchStatus) searchStatus.textContent = 'Vyhľadávanie teraz nie je dostupné.';
  }
}

if (input) {
  input.form?.addEventListener('submit', (event) => {
    event.preventDefault();
    void search(input.value);
  });
  input.addEventListener('focus', () => { void loadPagefind(); }, { once: true });
  input.addEventListener('input', () => { void search(input.value); });
}
