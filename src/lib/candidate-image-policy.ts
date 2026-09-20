import { loadAllElectionCycles, loadGlobalSources } from './load-guide-data';
import type { Candidate, Source } from './schemas';

/**
 * Future candidate photos enter this allowlist only through `Candidate.images`:
 * a declared license, its source record, and (for permission) a permission source.
 * Rendering code must still use a concrete allowlisted URL; dynamic or editorial
 * image construction remains forbidden by the static gate.
 */
export function deriveCandidateImageAllowlist(
  candidateRecords: Candidate[],
  sourceRecords: Source[],
): ReadonlySet<string> {
  const sourceIds = new Set(sourceRecords.map(({ id }) => id));
  const allowed = new Set<string>();
  for (const candidate of candidateRecords) {
    for (const image of candidate.images ?? []) {
      const hasLicenseEvidence = sourceIds.has(image.licenseSourceId) && candidate.sourceIds.includes(image.licenseSourceId);
      const hasPermissionEvidence = image.license !== 'permission'
        || (image.permissionSourceId !== undefined && sourceIds.has(image.permissionSourceId) && candidate.sourceIds.includes(image.permissionSourceId));
      if (hasLicenseEvidence && hasPermissionEvidence) allowed.add(image.url);
    }
  }
  return allowed;
}

export async function loadCandidateImageAllowlist(): Promise<ReadonlySet<string>> {
  const cycles = await loadAllElectionCycles();
  return deriveCandidateImageAllowlist(cycles.flatMap((cycle) => cycle.candidates), await loadGlobalSources());
}
