import type { OfficialCandidacy } from './official-facts';
import type { Candidate, ElectionId } from './schemas';

const ELECTION_LABELS: Record<ElectionId, string> = {
  mayor: 'voľby primátora mesta',
  'city-council': 'voľby do mestského zastupiteľstva',
  'region-chair': 'voľby predsedu kraja',
  'region-council': 'voľby do krajského zastupiteľstva',
};

export function candidateSeoMetadata(
  candidate: Candidate,
  allCandidates: Candidate[],
  candidacies: OfficialCandidacy[],
  cityName: string,
  year: number,
): { title: string; description: string } {
  const primary = candidacies[0];
  if (!primary) throw new Error(`${candidate.id}: candidate profile needs an official candidacy`);

  const plainName = `${candidate.givenName} ${candidate.familyName}`;
  const hasNamesake = allCandidates.some((other) => other.id !== candidate.id
    && `${other.givenName} ${other.familyName}` === plainName);
  const title = `${hasNamesake ? candidate.displayName : plainName} | ${cityName} ${year}`;

  const district = primary.district ? `, ${primary.district.toLowerCase()}` : '';
  const base = `${candidate.displayName}: ${ELECTION_LABELS[primary.electionId]}, ${cityName} ${year}${district}.`;
  const subject = primary.affiliation ? ` Navrhujúci subjekt / postavenie: ${primary.affiliation}.` : '';
  const occupation = ` Povolanie v zozname: ${primary.occupationOfficial}.`;
  const description = base.length + subject.length + occupation.length <= 165
    ? base + subject + occupation
    : base.length + subject.length <= 165
      ? base + subject
      : base.length + occupation.length <= 165
        ? base + occupation
        : base;

  return { title, description };
}
