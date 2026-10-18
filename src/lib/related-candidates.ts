import type { ElectionContext } from './load-guide-data';
import { candidateProfilePath, isRegionalContext, type ProfilePageContext } from './regional-context';
import type { ElectionId, Source } from './schemas';
import { getCandidateProfile } from './selectors';
import { resolveRecordSources } from './source-links';

export interface RelatedCandidateGroup {
  id: string;
  contestId: string;
  electionId: ElectionId;
  title: string;
  districtId?: string;
  districtName?: string;
  candidates: Array<{ candidateId: string; displayName: string; ballotNumber: number; href: string }>;
  sources: Source[];
}

export function getRelatedCandidateGroups(
  context: ProfilePageContext,
  candidateId: string,
  publishedContexts: readonly ElectionContext[],
): RelatedCandidateGroup[] {
  const candidacies = getCandidateProfile(context.data, candidateId).candidacies;
  if (isRegionalContext(context)) {
    candidacies.sort((left, right) => Number(right.electionId === 'region-chair') - Number(left.electionId === 'region-chair'));
  }
  const contexts = publishedContexts
    .filter((city) => city.status === 'published' && city.regionSlug === context.regionSlug && city.year === context.year)
    .toSorted((left, right) => Number(right.basePath === context.basePath) - Number(left.basePath === context.basePath)
      || left.citySlug.localeCompare(right.citySlug, 'sk'));
  const groups: RelatedCandidateGroup[] = [];
  const seenBallots = new Set<string>();

  for (const own of candidacies) {
    const key = JSON.stringify([own.contestId, own.districtId]);
    if (seenBallots.has(key)) continue;
    seenBallots.add(key);
    // Regional profile data intentionally omits everyone except chair candidates.
    // Resolve peers from a complete published municipal context instead.
    const city = contexts.find((item) => item.data.candidacies.some((row) => row.id === own.id
      && row.candidateId === candidateId && row.contestId === own.contestId && row.districtId === own.districtId));
    if (!city) throw new Error(`${own.id}: missing published ballot context`);
    const peers = city.data.candidacies
      .filter((row) => row.candidateId !== candidateId && row.electionId === own.electionId
        && row.contestId === own.contestId && row.districtId === own.districtId)
      .toSorted((left, right) => left.ballotNumber - right.ballotNumber || left.id.localeCompare(right.id, 'sk'));
    if (peers.length === 0) continue;
    const election = city.data.elections.find((row) => row.contestId === own.contestId && row.id === own.electionId);
    if (!election) throw new Error(`${own.id}: unknown election ${own.contestId}`);
    const district = own.districtId ? city.data.districts.find((row) => row.id === own.districtId) : undefined;
    if (own.districtId && !district) throw new Error(`${own.id}: unknown district ${own.districtId}`);
    const candidatesById = new Map(city.data.candidates.map((row) => [row.id, row]));
    const uniquePeers = [...new Map(peers.map((row) => [row.candidateId, row])).values()];
    const records = uniquePeers.map((candidacy) => {
      const candidate = candidatesById.get(candidacy.candidateId);
      if (!candidate) throw new Error(`${candidacy.id}: unknown candidate ${candidacy.candidateId}`);
      return { candidate, candidacy };
    });
    groups.push({
      id: own.id,
      contestId: own.contestId,
      electionId: own.electionId,
      title: election.title.sk,
      ...(district ? { districtId: district.id, districtName: district.name } : {}),
      candidates: records.map(({ candidate, candidacy }) => ({
        candidateId: candidate.id,
        displayName: candidacy.displayNameOfficial ?? candidate.displayName,
        ballotNumber: candidacy.ballotNumber,
        href: candidateProfilePath(city, candidate.id),
      })),
      sources: resolveRecordSources([
        election, ...(district ? [district] : []),
        ...records.flatMap(({ candidate, candidacy }) => [candidate, candidacy]),
      ], city.data.sources),
    });
  }
  return groups;
}
