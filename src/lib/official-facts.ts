import type { Candidacy, GuideData } from './schemas';
import { getCandidateProfile } from './selectors';
import { resolveRecordSources } from './source-links';

export function affiliationLabel(candidacy: Candidacy): string {
  return [candidacy.independent ? 'Nezávislý kandidát' : '', ...candidacy.affiliations].filter(Boolean).join('; ');
}

export function getOfficialCandidacies(data: GuideData, candidateId: string) {
  return getCandidateProfile(data, candidateId).candidacies.map((candidacy) => {
    const election = data.elections.find((item) => item.id === candidacy.electionId);
    if (!election) throw new Error(`${candidacy.id}: unknown election ${candidacy.electionId}`);
    const district = candidacy.districtId ? data.districts.find((item) => item.id === candidacy.districtId) : undefined;
    if (candidacy.districtId && !district) throw new Error(`${candidacy.id}: unknown district ${candidacy.districtId}`);
    // Resolve every contributing record separately: an empty source list must fail closed.
    const sources = resolveRecordSources([candidacy, election, ...(district ? [district] : [])], data.sources);
    return {
      id: candidacy.id, electionId: election.id, election: election.title.sk,
      district: district?.name, ballotNumber: candidacy.ballotNumber,
      ageAtElection: candidacy.ageAtElection, occupationOfficial: candidacy.occupationOfficial,
      affiliation: affiliationLabel(candidacy),
      sources,
    };
  });
}

export type OfficialCandidacy = ReturnType<typeof getOfficialCandidacies>[number];
