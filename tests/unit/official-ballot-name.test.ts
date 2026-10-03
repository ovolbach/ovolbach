import { describe, expect, it } from 'vitest';
import { loadElectionContext } from '../../src/lib/load-guide-data';
import { getOfficialCandidacies } from '../../src/lib/official-facts';
import { candidacySchema } from '../../src/lib/schemas';

describe('contest-specific official names and titles', () => {
  it('accepts a sourced ballot name and rejects a blank one', async () => {
    const { data } = await loadElectionContext({ citySlug: 'liptovsky-mikulas', year: 2026 });
    const candidacy = data.candidacies[0]!;
    expect(candidacySchema.safeParse({ ...candidacy, displayNameOfficial: 'Ján BLCHÁČ, Ing., PhD.' }).success).toBe(true);
    expect(candidacySchema.safeParse({ ...candidacy, displayNameOfficial: ' ' }).success).toBe(false);
    expect(candidacySchema.safeParse(candidacy).success).toBe(true);
  });

  it('retains a contest name rather than replacing it with the shared person heading', async () => {
    const { data } = await loadElectionContext({ citySlug: 'liptovsky-mikulas', year: 2026 });
    const candidacy = data.candidacies[0]!;
    Object.assign(candidacy, { displayNameOfficial: 'Ján BLCHÁČ, Ing., PhD.' });
    expect(getOfficialCandidacies(data, candidacy.candidateId).find((row) => row.id === candidacy.id))
      .toMatchObject({ displayNameOfficial: 'Ján BLCHÁČ, Ing., PhD.' });
  });
});
