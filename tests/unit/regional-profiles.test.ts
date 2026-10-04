import { describe, expect, it } from 'vitest';
import { loadElectionCycle } from '../../src/lib/load-guide-data';
import { getOfficialCandidacies } from '../../src/lib/official-facts';

describe('shared candidate official contests', () => {
  it('keeps Žilina council metadata when the cycle also contains other city councils', async () => {
    const cycle = await loadElectionCycle(2026, 'zilinsky-kraj');
    const facts = getOfficialCandidacies(cycle, 'candidate-89');
    const city = facts.find((row) => row.id === 'candidacy-candidate-89-city-council')!;
    expect(city.election).toContain('Žilina');
    expect(city.sources.map((row) => row.id)).toContain('za-council-roster-2026');
    expect(city.sources.map((row) => row.id)).not.toContain('lm-city-council-roster-2026');
  });
});
