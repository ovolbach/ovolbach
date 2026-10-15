import { restoreAuditedRecords } from '../helpers/history-audit-preservation';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { listPublishedElectionContexts, loadElectionCycle } from '../../src/lib/load-guide-data';
import { validateDataset } from '../../src/lib/validate-dataset';

describe('audited Poprad and Prešov release', () => {
  it('publishes both researched cities with eight completed categories for every person', async () => {
    const contexts = await listPublishedElectionContexts();
    expect(contexts.filter((row) => row.regionSlug === 'presovsky-kraj').map((row) => row.basePath))
      .toEqual(['/poprad/2026/', '/presov/2026/']);
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    expect(data.researchCoverage).toHaveLength(320 * 8);
    expect(data.researchCoverage.some((row) => row.status === 'pending')).toBe(false);
    expect(validateDataset(data, 'release')).toEqual([]);
  });
  it('retains actual category search receipts and original-source checks in the research journal', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    const journal = JSON.parse(readFileSync('research/presov-poprad-2026.json', 'utf8'));
    const previousCoverage = restoreAuditedRecords('src/data/elections/2026/presovsky-kraj/research-coverage.json', data.researchCoverage);
    expect(journal.snapshotDate).toBe('2026-10-14');
    expect(journal.people.map((row: { candidateId: string }) => row.candidateId).sort())
      .toEqual(data.candidates.map((row) => row.id).sort());
    for (const person of journal.people) {
      expect(person.categories, person.candidateId).toHaveLength(8);
      for (const category of person.categories) {
        const coverage = previousCoverage.find((row) => row.candidateId === person.candidateId && row.category === category.category);
        expect(category.status).toBe(coverage?.status);
        expect(category.queries.length, `${person.candidateId}/${category.category}`).toBeGreaterThan(0);
        expect(category.boundary).toBeTruthy();
        expect(category.sourceFamiliesChecked.length).toBeGreaterThan(0);
        expect(category.status).not.toBe('pending');
      }
    }
    expect(journal.originals.length).toBeGreaterThan(300);
    expect(journal.originals.filter((row: { sha256?: string }) => row.sha256).length).toBeGreaterThan(300);
  });
});
