import {
  candidateSchema, candidacySchema, claimSchema, districtSchema, electionSchema,
  researchCoverageSchema, sourceSchema,
  type ClaimCategory, type GuideData, type ValidationIssue,
} from './schemas';

export type { GuideData, ValidationIssue } from './schemas';

const categories: ClaimCategory[] = [
  'basic', 'employment_business', 'public_office', 'previous_elections',
  'programme_statements', 'asset_declarations', 'media', 'controversies',
];

type CollectionName = keyof GuideData;

const schemas = {
  candidates: candidateSchema,
  candidacies: candidacySchema,
  claims: claimSchema,
  sources: sourceSchema,
  districts: districtSchema,
  elections: electionSchema,
  researchCoverage: researchCoverageSchema,
} as const;

function push(issues: ValidationIssue[], code: string, recordId: string, referenceId?: string) {
  issues.push(referenceId === undefined ? { code, recordId } : { code, recordId, referenceId });
}

function identifiers<T extends { id: string }>(
  records: T[],
  issues: ValidationIssue[],
) {
  const ids = new Set<string>();
  for (const record of records) {
    if (ids.has(record.id)) push(issues, 'duplicate_id', record.id, record.id);
    ids.add(record.id);
  }
  return ids;
}

function checkSourceIds(records: Array<{ id: string; sourceIds: string[] }>, sourceIds: Set<string>, issues: ValidationIssue[]) {
  for (const record of records) {
    for (const sourceId of record.sourceIds) {
      if (!sourceIds.has(sourceId)) push(issues, 'unknown_source', record.id, sourceId);
    }
  }
}

export function validateDataset(data: GuideData, mode: 'draft' | 'release'): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const validated = {} as GuideData;

  for (const collection of Object.keys(schemas) as CollectionName[]) {
    const schema = schemas[collection];
    const rawRecords = data[collection];
    if (!Array.isArray(rawRecords)) {
      push(issues, 'invalid_schema', collection, collection);
      (validated as Record<CollectionName, unknown[]>)[collection] = [];
      continue;
    }
    const records: unknown[] = rawRecords;
    const validRecords: unknown[] = [];
    records.forEach((record, index) => {
      const result = schema.safeParse(record);
      if (!result.success) {
        const rawId = typeof record === 'object' && record !== null && 'id' in record && typeof record.id === 'string'
          ? record.id : `${collection}:${index}`;
        push(issues, 'invalid_schema', rawId, collection);
      } else {
        validRecords.push(result.data);
      }
    });
    (validated as Record<CollectionName, unknown[]>)[collection] = validRecords;
  }

  const sourceIds = identifiers(validated.sources, issues);
  const sourceByUrl = new Map<string, string>();
  for (const source of validated.sources) {
    const url = new URL(source.url).href;
    const prior = sourceByUrl.get(url);
    if (prior) push(issues, 'duplicate_source_url', source.id, prior);
    else sourceByUrl.set(url, source.id);
  }
  const candidateIds = identifiers(validated.candidates, issues);
  const districtIds = identifiers(validated.districts, issues);
  const contestIds = identifiers(validated.elections.map((election) => ({ id: election.contestId })), issues);
  identifiers(validated.candidacies, issues);
  identifiers(validated.claims, issues);
  identifiers(validated.researchCoverage, issues);

  const slugs = new Set<string>();
  for (const candidate of validated.candidates) {
    if (slugs.has(candidate.slug)) push(issues, 'duplicate_slug', candidate.id, candidate.slug);
    slugs.add(candidate.slug);
  }

  checkSourceIds(validated.candidates, sourceIds, issues);
  checkSourceIds(validated.candidacies, sourceIds, issues);
  checkSourceIds(validated.claims, sourceIds, issues);
  checkSourceIds(validated.districts, sourceIds, issues);
  checkSourceIds(validated.elections, sourceIds, issues);
  checkSourceIds(validated.researchCoverage, sourceIds, issues);
  for (const candidate of validated.candidates) {
    for (const image of candidate.images ?? []) {
      if (!sourceIds.has(image.licenseSourceId)) push(issues, 'unknown_image_license_source', candidate.id, image.licenseSourceId);
      if (image.permissionSourceId && !sourceIds.has(image.permissionSourceId)) push(issues, 'unknown_image_permission_source', candidate.id, image.permissionSourceId);
    }
  }
  for (const district of validated.districts) {
    for (const station of district.pollingStations) {
      if (!sourceIds.has(station.sourceId)) push(issues, 'unknown_source', district.id, station.sourceId);
    }
  }

  for (const claim of validated.claims) {
    if (!candidateIds.has(claim.candidateId)) push(issues, 'unknown_candidate', claim.id, claim.candidateId);
  }
  for (const coverage of validated.researchCoverage) {
    if (!candidateIds.has(coverage.candidateId)) push(issues, 'unknown_candidate', coverage.id, coverage.candidateId);
    if (mode === 'release' && coverage.status === 'pending') push(issues, 'pending_research', coverage.id);
  }

  const ballots = new Map<string, string>();
  for (const candidacy of validated.candidacies) {
    if (!candidateIds.has(candidacy.candidateId)) push(issues, 'unknown_candidate', candidacy.id, candidacy.candidateId);
    if (!contestIds.has(candidacy.contestId)) push(issues, 'unknown_election', candidacy.id, candidacy.contestId);
    const contest = validated.elections.find((election) => election.contestId === candidacy.contestId);
    if (contest && contest.id !== candidacy.electionId) push(issues, 'wrong_contest_kind', candidacy.id, candidacy.contestId);
    if (candidacy.districtId && !districtIds.has(candidacy.districtId)) push(issues, 'unknown_district', candidacy.id, candidacy.districtId);

    if (candidacy.electionId === 'city-council' || candidacy.electionId === 'region-council') {
      if (!candidacy.districtId) {
        push(issues, 'missing_district', candidacy.id);
      } else {
        const district = validated.districts.find(({ id }) => id === candidacy.districtId);
        const requiredKind = candidacy.electionId === 'city-council' ? 'city' : 'region';
        if (district && district.kind !== requiredKind) push(issues, 'wrong_district_kind', candidacy.id, candidacy.districtId);
      }
    } else if (candidacy.districtId) {
      push(issues, 'unexpected_district', candidacy.id, candidacy.districtId);
    }

    const ballotKey = `${candidacy.contestId}:${candidacy.districtId ?? ''}:${candidacy.ballotNumber}`;
    if (ballots.has(ballotKey)) push(issues, 'duplicate_ballot_number', candidacy.id, ballots.get(ballotKey));
    else ballots.set(ballotKey, candidacy.id);
  }

  const coverageKeys = new Set<string>();
  const coverageByKey = new Map<string, GuideData['researchCoverage'][number]>();
  for (const coverage of validated.researchCoverage) {
    const key = `${coverage.candidateId}:${coverage.category}`;
    if (coverageKeys.has(key)) push(issues, 'duplicate_research_coverage', coverage.id, key);
    coverageKeys.add(key);
    coverageByKey.set(key, coverage);
  }
  for (const candidate of validated.candidates) {
    for (const category of categories) {
      if (!coverageKeys.has(`${candidate.id}:${category}`)) push(issues, 'missing_research_coverage', candidate.id, category);
    }
  }

  const claimKeys = new Set<string>();
  for (const claim of validated.claims) {
    if (claim.category === 'basic') continue;
    const key = `${claim.candidateId}:${claim.category}`;
    claimKeys.add(key);
    const coverage = coverageByKey.get(key);
    if (coverage && coverage.status !== 'found') {
      push(issues, 'claim_conflicts_with_coverage', claim.id, coverage.id);
    }
  }
  for (const coverage of validated.researchCoverage) {
    if (coverage.category === 'basic' || coverage.status !== 'found') continue;
    const key = `${coverage.candidateId}:${coverage.category}`;
    if (!claimKeys.has(key)) push(issues, 'found_coverage_without_claim', coverage.id, key);
  }

  return issues.sort((left, right) =>
    left.code.localeCompare(right.code) || left.recordId.localeCompare(right.recordId) || (left.referenceId ?? '').localeCompare(right.referenceId ?? ''),
  );
}
