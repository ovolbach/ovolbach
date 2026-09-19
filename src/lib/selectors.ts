import type {
  Candidate,
  Candidacy,
  Claim,
  ClaimCategory,
  District,
  Election,
  ElectionId,
  GuideData,
  ResearchCoverage,
  Source,
} from './schemas';
import { summarizeElectionHistory, type ElectionHistorySummary } from './profile-content';

const CLAIM_CATEGORIES: ClaimCategory[] = [
  'basic',
  'employment_business',
  'public_office',
  'previous_elections',
  'programme_statements',
  'asset_declarations',
  'media',
  'controversies',
];

const BALLOT_ORDER: ElectionId[] = ['mayor', 'city-council', 'region-chair', 'region-council'];

export interface BallotCandidate extends Candidate {
  candidacy: Candidacy;
  electionHistory: ElectionHistorySummary;
}

export interface BallotView {
  election: Election;
  district?: District;
  candidates: BallotCandidate[];
}

export function getBallotSelectionLimit(ballot: BallotView): number {
  if (ballot.election.maxSelections !== 'district_seats') return ballot.election.maxSelections;
  if (!ballot.district) throw new Error(`Missing district for ${ballot.election.contestId} selection limit`);
  return ballot.district.seats;
}

export interface CandidateProfile {
  candidate: Candidate;
  candidacies: Candidacy[];
  claims: Claim[];
  researchCoverage: ResearchCoverage[];
}

export interface ComparisonCell {
  candidateId: string;
  claims: Claim[];
  researchCoverage: ResearchCoverage | undefined;
}

export interface ComparisonRow {
  category: ClaimCategory;
  cells: ComparisonCell[];
}

function byBallotNumber(left: Candidacy, right: Candidacy): number {
  const ballotNumber = left.ballotNumber - right.ballotNumber;
  if (ballotNumber !== 0) return ballotNumber;
  return left.id.localeCompare(right.id, 'sk');
}

function byElectionAndBallot(left: Candidacy, right: Candidacy): number {
  const election = BALLOT_ORDER.indexOf(left.electionId) - BALLOT_ORDER.indexOf(right.electionId);
  if (election !== 0) return election;
  return byBallotNumber(left, right);
}

function byClaim(left: Claim, right: Claim): number {
  const category = CLAIM_CATEGORIES.indexOf(left.category) - CLAIM_CATEGORIES.indexOf(right.category);
  if (category !== 0) return category;

  const period = (left.period ?? '').localeCompare(right.period ?? '', 'sk');
  if (period !== 0) return period;
  return left.id.localeCompare(right.id, 'sk');
}

function byPeriodAndId(left: Claim, right: Claim): number {
  const period = (left.period ?? '').localeCompare(right.period ?? '', 'sk');
  if (period !== 0) return period;
  return left.id.localeCompare(right.id, 'sk');
}

function candidateById(data: GuideData, candidateId: string): Candidate {
  const candidate = data.candidates.find((record) => record.id === candidateId);
  if (!candidate) throw new Error(`Unknown candidate: ${candidateId}`);
  return candidate;
}

function electionById(data: GuideData, electionId: ElectionId): Election {
  const matches = data.elections.filter((election) => election.id === electionId);
  if (matches.length !== 1) throw new Error(`Expected exactly one election: ${electionId}`);
  return matches[0]!;
}

function regionalDistrictForContext(data: GuideData, regionalDistrictId: string) {
  const matches = data.districts.filter((district) => district.id === regionalDistrictId && district.kind === 'region');
  if (matches.length !== 1) throw new Error(`Expected exactly one regional district: ${regionalDistrictId}`);
  return matches[0]!;
}

export function getBallotsForDistrict(data: GuideData, districtId: string, regionalDistrictId: string): BallotView[] {
  const district = data.districts.find((record) => record.id === districtId);
  if (!district) throw new Error(`Unknown district: ${districtId}`);
  if (district.kind !== 'city') throw new Error(`Expected city district: ${districtId}`);
  const regionalDistrict = regionalDistrictForContext(data, regionalDistrictId);

  return BALLOT_ORDER.map((electionId) => {
    const election = electionById(data, electionId);
    const ballotDistrictId = electionId === 'city-council'
      ? district.id
      : electionId === 'region-council'
        ? regionalDistrict.id
        : undefined;
    const candidates = data.candidacies
      .filter((candidacy) => candidacy.electionId === electionId && candidacy.districtId === ballotDistrictId)
      .slice()
      .sort(byBallotNumber)
      .map((candidacy) => ({
        ...candidateById(data, candidacy.candidateId),
        candidacy,
        electionHistory: summarizeElectionHistory(
          data.claims.filter((claim) => claim.candidateId === candidacy.candidateId),
        ),
      }));

    return { election, candidates, ...(ballotDistrictId ? { district: data.districts.find((item) => item.id === ballotDistrictId)! } : {}) };
  });
}

export function getCandidateProfile(data: GuideData, candidateId: string): CandidateProfile {
  const candidate = candidateById(data, candidateId);
  return {
    candidate,
    candidacies: data.candidacies.filter((record) => record.candidateId === candidateId).slice().sort(byElectionAndBallot),
    claims: data.claims.filter((record) => record.candidateId === candidateId).slice().sort(byClaim),
    researchCoverage: data.researchCoverage.filter((record) => record.candidateId === candidateId),
  };
}

export function getComparisonRows(data: GuideData, candidateIds: string[]): ComparisonRow[] {
  if (candidateIds.length === 0) return [];
  candidateIds.forEach((candidateId) => candidateById(data, candidateId));

  return CLAIM_CATEGORIES.map((category) => ({
    category,
    cells: candidateIds.map((candidateId) => ({
      candidateId,
      claims: data.claims
        .filter((claim) => claim.candidateId === candidateId && claim.category === category)
        .slice()
        .sort(byPeriodAndId),
      researchCoverage: data.researchCoverage.find(
        (coverage) => coverage.candidateId === candidateId && coverage.category === category,
      ),
    })),
  }));
}

export function getSourceRegister(data: GuideData | Source[]): Source[] {
  const sources = Array.isArray(data) ? data : data.sources;
  return sources.slice().sort((left, right) => {
    const publisher = left.publisher.localeCompare(right.publisher, 'sk');
    if (publisher !== 0) return publisher;
    const date = (left.publishedAt ?? '').localeCompare(right.publishedAt ?? '');
    if (date !== 0) return date;
    const title = left.title.localeCompare(right.title, 'sk');
    if (title !== 0) return title;
    return left.id.localeCompare(right.id, 'sk');
  });
}
