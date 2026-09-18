const choices = document.querySelectorAll<HTMLInputElement>('[data-compare-candidate]');

function refreshComparisonSelection() {
  const url = new URL(window.location.href);
  const ids = url.searchParams.getAll('kandidat');
  choices.forEach((choice) => {
    choice.checked = ids.includes(choice.dataset.compareCandidate!);
    choice.disabled = !choice.checked && ids.length >= 4;
  });
  document.querySelectorAll<HTMLElement>('[data-compare-selection-status]').forEach((status) => {
    status.textContent = `Vybraní kandidáti: ${ids.length}. Vyberte 2 až 4 kandidátov na porovnanie.`;
  });
  for (const [selector, path] of [['[data-compare-link]', '/porovnat/'], ['[data-compare-catalogue]', '/kandidati/']] as const) {
    document.querySelectorAll<HTMLAnchorElement>(selector).forEach((link) => {
      const target = new URL(url);
      target.pathname = path;
      target.hash = '';
      link.href = `${target.pathname}${target.search}`;
    });
  }
  // Keep selection when following ordinary local navigation or a candidate profile.
  document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]').forEach((link) => {
    const target = new URL(link.href);
    if (target.origin !== url.origin) return;
    target.searchParams.delete('kandidat');
    ids.forEach((id) => target.searchParams.append('kandidat', id));
    link.href = `${target.pathname}${target.search}${target.hash}`;
  });
}

choices.forEach((choice) => choice.addEventListener('change', () => {
  const url = new URL(window.location.href);
  const id = choice.dataset.compareCandidate!;
  const selected = url.searchParams.getAll('kandidat').filter((item) => item !== id);
  if (choice.checked && selected.length < 4) selected.push(id);
  url.searchParams.delete('kandidat');
  selected.forEach((item) => url.searchParams.append('kandidat', item));
  window.history.pushState({}, '', url);
  refreshComparisonSelection();
}));
document.querySelectorAll<HTMLButtonElement>('[data-compare-clear]').forEach((button) => button.addEventListener('click', () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('kandidat');
  window.history.pushState({}, '', url);
  refreshComparisonSelection();
  window.dispatchEvent(new Event('popstate'));
}));
window.addEventListener('popstate', refreshComparisonSelection);
window.addEventListener('guide-filter-change', refreshComparisonSelection);
refreshComparisonSelection();
