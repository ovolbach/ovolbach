import type { Claim, ClaimCategory, ElectionHistoryOffice, ResearchCoverage } from './schemas';

export interface ElectionHistorySummary {
  participations: number;
  wins: number;
  deputyWins: number;
  mayorWins: number;
  regionalChairWins: number;
  presidentWins: number;
  sourceIds: string[];
}

const DEPUTY_OFFICES = new Set<ElectionHistoryOffice>([
  'municipal_council',
  'regional_council',
  'national_council',
  'european_parliament',
]);

export function summarizeElectionHistory(claims: Claim[]): ElectionHistorySummary {
  const contests = new Map<string, NonNullable<Claim['election']>>();
  const eligibleClaims: Claim[] = [];

  for (const claim of claims) {
    const year = Number.parseInt(claim.period?.slice(0, 4) ?? '', 10);
    if (!claim.election || !Number.isInteger(year) || year < 2000) continue;

    const previous = contests.get(claim.election.contestId);
    if (previous && (previous.office !== claim.election.office || previous.outcome !== claim.election.outcome)) {
      throw new Error(`Conflicting election metadata for ${claim.election.contestId}`);
    }
    contests.set(claim.election.contestId, claim.election);
    eligibleClaims.push(claim);
  }

  const participations = [...contests.values()].filter((record) => record.outcome !== 'withdrawn');
  const participatingIds = new Set([...contests.entries()]
    .filter(([, record]) => record.outcome !== 'withdrawn')
    .map(([contestId]) => contestId));
  const elected = participations.filter((record) => record.outcome === 'elected');
  return {
    participations: participations.length,
    wins: elected.length,
    deputyWins: elected.filter((record) => DEPUTY_OFFICES.has(record.office)).length,
    mayorWins: elected.filter((record) => record.office === 'mayor').length,
    regionalChairWins: elected.filter((record) => record.office === 'regional_chair').length,
    presidentWins: elected.filter((record) => record.office === 'president').length,
    sourceIds: [...new Set(eligibleClaims
      .filter((claim) => participatingIds.has(claim.election!.contestId))
      .flatMap((claim) => claim.sourceIds))],
  };
}

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
