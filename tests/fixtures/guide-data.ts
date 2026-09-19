import type { Claim, Election, GuideData, ResearchCoverage } from '../../src/lib/schemas';

export const baseSource = {
  id: 'source-1',
  url: 'https://example.com/source',
  title: 'Official source',
  publisher: 'Example municipality',
  checkedAt: '2026-09-17',
  language: 'sk' as const,
  type: 'official' as const,
};

export const baseCandidate = {
  id: 'candidate-1',
  slug: 'jana-novakova',
  displayName: 'Jana Nováková',
  givenName: 'Jana',
  familyName: 'Nováková',
  sourceIds: [baseSource.id],
};

export const baseElection: Election = {
  id: 'mayor',
  contestId: '2026-lm-mayor',
  title: { sk: 'Primátor mesta' },
  level: 'city' as const,
  maxSelections: 1,
  electionDate: '2026-10-24',
  sourceIds: [baseSource.id],
};

export const baseCandidacy = {
  id: 'candidacy-1',
  candidateId: baseCandidate.id,
  electionId: 'mayor' as const,
  contestId: '2026-lm-mayor',
  ballotNumber: 1,
  ageAtElection: 40,
  occupationOfficial: 'učiteľka',
  affiliations: [],
  independent: true,
  sourceIds: [baseSource.id],
};

export const baseClaim: Claim = {
  id: 'claim-1',
  candidateId: baseCandidate.id,
  category: 'basic',
  kind: 'fact',
  label: { sk: 'Povolanie' },
  text: { sk: 'Učiteľka.' },
  sourceIds: [baseSource.id],
  checkedAt: '2026-09-17',
};

const categories: Claim['category'][] = [
  'basic', 'employment_business', 'public_office', 'previous_elections',
  'programme_statements', 'asset_declarations', 'media', 'controversies',
];

export const pendingCoverage: ResearchCoverage = {
  id: 'coverage-basic',
  candidateId: baseCandidate.id,
  category: 'basic',
  status: 'pending',
  sourceIds: [],
};

const coverage = (): ResearchCoverage[] => categories.map((category) => ({
  id: `coverage-${category}`,
  candidateId: baseCandidate.id,
  category,
  status: 'found',
  checkedAt: '2026-09-17',
  sourceIds: [baseSource.id],
}));

export function makeGuideData(overrides: Partial<GuideData> = {}): GuideData {
  return {
    candidates: [baseCandidate],
    candidacies: [baseCandidacy],
    claims: [baseClaim],
    sources: [baseSource],
    districts: [],
    elections: [baseElection],
    researchCoverage: coverage(),
    ...overrides,
  };
}
