import type { GuideData } from './schemas';
import candidacies from '../data/candidacies.json';
import candidates from '../data/candidates.json';
import claims from '../data/claims.json';
import districts from '../data/districts.json';
import elections from '../data/elections.json';
import researchCoverage from '../data/research-coverage.json';
import sources from '../data/sources.json';

export async function loadGuideData(): Promise<GuideData> {
  return {
    candidates,
    candidacies,
    claims,
    sources,
    districts,
    elections,
    researchCoverage,
  } as GuideData;
}
