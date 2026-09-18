const forms = document.querySelectorAll<HTMLFormElement>('[data-district-form]');
const electionSelect = document.querySelector<HTMLSelectElement>('[data-election-select]');
const selectionStatus = document.querySelector<HTMLElement>('[data-selection-status]');
const districtSections = document.querySelectorAll<HTMLElement>('[data-district]');
const catalogueSections = document.querySelectorAll<HTMLElement>('[data-catalogue-election]');

function selectedDistrict(): string | null {
  const district = new URL(window.location.href).searchParams.get('obvod');
  if (!district) return null;
  const option = Array.from(forms[0]?.querySelectorAll<HTMLOptionElement>('option[value]') ?? [])
    .find((item) => item.value === district);
  return option?.dataset.internalDistrict ?? 'invalid';
}

function applySelection(): void {
  const district = selectedDistrict();
  const election = new URL(window.location.href).searchParams.get('volby');
  const invalidDistrict = district === 'invalid';
  const validElection = electionSelect && Array.from(electionSelect.options).some((option) => option.value && option.value === election);

  forms.forEach((form) => {
    const select = form.querySelector<HTMLSelectElement>('[data-district-select]');
    if (select) select.value = Array.from(select.options).find((item) => item.dataset.internalDistrict === district)?.value ?? '';
  });
  if (electionSelect) electionSelect.value = validElection ? election! : '';

  districtSections.forEach((section) => {
    if (district && !invalidDistrict && section.dataset.district === district) section.dataset.selected = 'true';
    else delete section.dataset.selected;
  });
  catalogueSections.forEach((section) => {
    section.hidden = Boolean(!validElection || invalidDistrict || section.dataset.catalogueElection !== election
      || (election === 'city-council' && section.dataset.district !== district));
  });

  if (selectionStatus) selectionStatus.textContent = invalidDistrict
    ? 'Neplatný volebný obvod. Vyberte si obvod zo zoznamu.'
    : electionSelect && !validElection
      ? (election ? 'Neplatné voľby. Vyberte voľby zo zoznamu.' : 'Vyberte voľby a pri mestskom zastupiteľstve aj volebný obvod.')
      : electionSelect && election !== 'city-council' ? 'Zobrazené sú vybrané voľby.'
        : district ? 'Zobrazený je vybraný volebný obvod.' : 'Vyberte volebný obvod.';
  window.dispatchEvent(new Event('guide-filter-change'));
}

function updateFilter(name: string, value: string) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(name, value);
  else url.searchParams.delete(name);
  url.hash = '';
  window.history.pushState({}, '', url);
  applySelection();
}

forms.forEach((form) => {
  const select = form.querySelector<HTMLSelectElement>('[data-district-select]');
  if (!select) return;
  select.addEventListener('change', () => updateFilter('obvod', select.value));
  form.addEventListener('submit', (event) => { event.preventDefault(); updateFilter('obvod', select.value); });
});
electionSelect?.addEventListener('change', () => updateFilter('volby', electionSelect.value));
electionSelect?.form?.addEventListener('submit', (event) => {
  event.preventDefault(); updateFilter('volby', electionSelect.value);
});
window.addEventListener('popstate', applySelection);
document.documentElement.classList.add('district-selection-ready');
if (window.location.hash) {
  const url = new URL(window.location.href);
  url.hash = '';
  window.history.replaceState({}, '', url);
}
applySelection();
