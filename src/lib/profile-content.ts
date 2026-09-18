import type { ClaimCategory, ResearchCoverage } from './schemas';

export const PROFILE_CATEGORIES: Array<{ id: ClaimCategory; title: string }> = [
  { id: 'basic', title: 'Základné údaje' },
  { id: 'employment_business', title: 'Zamestnanie a podnikanie' },
  { id: 'public_office', title: 'Verejné funkcie' },
  { id: 'previous_elections', title: 'Predchádzajúce voľby' },
  { id: 'programme_statements', title: 'Programové vyjadrenia' },
  { id: 'asset_declarations', title: 'Majetkové priznania' },
  { id: 'media', title: 'Médiá' },
  { id: 'controversies', title: 'Kontroverzie' },
];

export function coverageTitle(status: ResearchCoverage['status']): string {
  if (status === 'pending') return 'Údaje sa overujú.';
  if (status === 'searched_none') return 'Vo verejne dostupných zdrojoch sa údaj nenašiel.';
  if (status === 'not_applicable') return 'Údaj sa na kandidáta nevzťahuje.';
  return 'Údaje sú dostupné.';
}

export function coverageMessage(status: ResearchCoverage['status']): string {
  return coverageTitle(status);
}

export function claimKindLabel(kind: string): string | undefined {
  if (kind === 'fact') return 'Fakt';
  if (kind === 'quote') return 'Citát';
  if (kind === 'election_result') return 'Výsledok volieb';
  if (kind === 'declaration') return 'Vyhlásenie';
  if (kind === 'media_report') return 'Mediálna správa';
  if (kind === 'response') return 'Vyjadrenie kandidáta';
  if (kind === 'official_outcome') return 'Oficiálny výsledok';
  return undefined;
}
