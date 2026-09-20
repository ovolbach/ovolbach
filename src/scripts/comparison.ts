import type { ComparisonPayload } from '../lib/comparison-payload';
import { sourceMetadata } from '../lib/source-links';
import { assertSafeOutboundSourceUrl } from '../lib/source-url';
import type { Source } from '../lib/schemas';
import type { OfficialCandidacy } from '../lib/official-facts';

type CandidateData = ComparisonPayload['candidates'][number];
type Row = CandidateData['rows'][number];

function element<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  return node;
}

function links(sources: Source[]): HTMLElement {
  const holder = element('span');
  sources.forEach((source) => {
    assertSafeOutboundSourceUrl(source.id, source.url);
    const wrap = element('span');
    wrap.className = 'source-link';
    wrap.dataset.sourceAttribution = '';
    const link = element('a', source.title);
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Zdroj: ${source.title} (otvorí sa v novom okne)`);
    const metadata = element('span', sourceMetadata(source));
    metadata.className = 'source-link__metadata';
    wrap.append(link, metadata);
    holder.append(wrap);
  });
  return holder;
}

function officialFacts(candidacy: OfficialCandidacy): HTMLElement {
  const article = element('article');
  article.className = 'candidacy';
  article.dataset.candidacy = candidacy.id;
  article.append(element('h3', candidacy.election));
  const list = element('dl');
  const fields = [
    ['Číslo na hlasovacom lístku', String(candidacy.ballotNumber)],
    ['Vek', `${candidacy.ageAtElection} rokov`],
    ['Povolanie', candidacy.occupationOfficial],
    ['Volebný obvod', candidacy.district],
    ['Navrhujúci subjekt / postavenie', candidacy.affiliation],
  ];
  fields.forEach(([label, value]) => {
    if (!value) return;
    const field = element('div');
    field.append(element('dt', label), element('dd', value));
    list.append(field);
  });
  article.append(list, links(candidacy.sources));
  return article;
}

function content(target: HTMLElement, row: Row, labels: ComparisonPayload['coverageLabels']): void {
  row.candidacies.forEach((candidacy) => target.append(officialFacts(candidacy)));
  row.claims.forEach((claim) => {
    const article = element('article');
    article.className = claim.kind === 'quote' ? 'claim claim--quote' : 'claim';
    article.dataset.claim = claim.id;
    if (claim.kindLabel) {
      const label = element('p', claim.kindLabel);
      label.className = 'claim__kind';
      article.append(label);
    }
    article.append(element('h3', claim.label));
    if (claim.period) article.append(element('p', claim.period));
    if (claim.kind === 'quote') {
      const quote = element('blockquote');
      quote.append(element('p', claim.text));
      article.append(quote);
    } else article.append(element('p', claim.text));
    article.append(links(claim.sources));
    target.append(article);
  });
  if (row.claims.length || row.candidacies.length) return;
  const status = row.coverage?.status ?? 'pending';
  const paragraph = element('p', labels[status]);
  paragraph.className = 'coverage-status';
  paragraph.dataset.coverageStatus = status;
  paragraph.append(links(row.coverage?.sources ?? []));
  target.append(paragraph);
}

function select(candidates: CandidateData[]): { selection?: CandidateData[]; message: string } {
  const ids = new URLSearchParams(window.location.search).getAll('kandidat');
  if (ids.length > 4) return { message: 'Porovnať možno najviac štyroch kandidátov.' };
  if (ids.length < 2) return { message: 'Vyberte 2 až 4 kandidátov na porovnanie.' };
  if (new Set(ids).size !== ids.length) return { message: 'Výber kandidátov je neplatný: identifikátor sa opakuje.' };
  const found = ids.map((id) => candidates.find((entry) => entry.candidate.id === id));
  return found.some((entry) => !entry)
    ? { message: 'Výber kandidátov je neplatný.' }
    : { selection: found as CandidateData[], message: '' };
}

function table(selection: CandidateData[], payload: ComparisonPayload): HTMLElement {
  const result = element('table');
  result.className = 'comparison-table';
  result.dataset.comparisonTable = '';
  result.append(element('caption', 'Porovnanie kandidátov podľa rovnakých kategórií a zdrojov.'));
  const head = element('thead');
  const header = element('tr');
  header.append(element('th', 'Kategória'));
  selection.forEach((entry) => {
    const th = element('th', entry.candidate.displayName);
    th.scope = 'col';
    th.dataset.comparisonColumn = '';
    th.dataset.candidateId = entry.candidate.id;
    header.append(th);
  });
  head.append(header);
  result.append(head);
  const body = element('tbody');
  payload.categories.forEach((category, index) => {
    const tr = element('tr');
    tr.dataset.comparisonRow = '';
    const th = element('th', category.title);
    th.scope = 'row';
    tr.append(th);
    selection.forEach((entry) => {
      const td = element('td');
      td.dataset.candidate = entry.candidate.displayName;
      content(td, entry.rows[index]!, payload.coverageLabels);
      tr.append(td);
    });
    body.append(tr);
  });
  result.append(body);
  return result;
}

function mobileCards(selection: CandidateData[], payload: ComparisonPayload): HTMLElement {
  const section = element('section');
  section.className = 'comparison-mobile';
  section.dataset.comparisonMobile = '';
  payload.categories.forEach((category, index) => {
    const card = element('section');
    card.className = 'comparison-card';
    card.dataset.comparisonRow = '';
    card.append(element('h2', category.title));
    selection.forEach((entry) => {
      const dl = element('dl');
      const value = element('dd');
      content(value, entry.rows[index]!, payload.coverageLabels);
      dl.append(element('dt', 'Kandidát'), element('dd', entry.candidate.displayName), element('dt', category.title), value);
      card.append(dl);
    });
    section.append(card);
  });
  return section;
}

function render(): void {
  const raw = document.getElementById('comparison-data')?.textContent;
  const output = document.querySelector<HTMLElement>('[data-comparison-output]');
  const status = document.querySelector<HTMLElement>('[data-comparison-status]');
  if (!raw || !output || !status) return;
  const payload = JSON.parse(raw) as ComparisonPayload;
  const result = select(payload.candidates);
  status.textContent = result.message;
  output.replaceChildren();
  if (!result.selection) return;
  const wrap = element('div');
  wrap.className = 'comparison-table-wrap';
  wrap.tabIndex = 0;
  wrap.setAttribute('role', 'region');
  wrap.setAttribute('aria-label', 'Porovnanie kandidátov');
  wrap.append(table(result.selection, payload), mobileCards(result.selection, payload));
  output.append(wrap);
}
window.addEventListener('popstate', render);
render();
