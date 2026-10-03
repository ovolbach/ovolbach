import { describe, expect, it } from 'vitest';
import { loadElectionContext } from '../../src/lib/load-guide-data';
import { getOfficialCandidacies } from '../../src/lib/official-facts';
import { candidateSeoMetadata } from '../../src/lib/seo-metadata';

describe('source-grounded candidate SEO descriptions', () => {
  it('omits titles when the complete election and district exceed the description limit', async () => {
    const context = await loadElectionContext({ citySlug: 'zilina', year: 2026 });
    for (const id of ['za-jozef-augustin', 'za-veronika-barcikova']) {
      const candidate = context.data.candidates.find((row) => row.id === id)!;
      const candidacies = getOfficialCandidacies(context.data, id);
      const metadata = candidateSeoMetadata(candidate, context.data.candidates, candidacies, context.cityName, context.year);
      expect(metadata.description.length).toBeLessThanOrEqual(165);
      expect(metadata.description).toContain(`${candidate.givenName} ${candidate.familyName}:`);
      expect(metadata.description).toContain(candidacies[0]!.district!.toLowerCase());
      expect(metadata.title).toBe(`${candidate.givenName} ${candidate.familyName} | Žilina 2026`);
    }
  });
});
