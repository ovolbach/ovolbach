import { describe, expect, it } from 'vitest';
import { createComparisonPayload } from '../../src/lib/comparison-payload';
import { comparisonContextFixture } from '../fixtures/comparison-context';
import { baseCandidacy, makeGuideData } from '../fixtures/guide-data';
import { loadGuideData } from '../../src/lib/load-guide-data';

describe('integration comparison projections', () => {
  it('retains canonical claim labels, period, author and source type', () => {
    const payload = createComparisonPayload(comparisonContextFixture());
    const claims = payload.candidates[0]!.rows[7]!.claims;
    expect(claims).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'quote', kindLabel: 'Citát', label: 'Kontext quote', period: '2024–2026', sources: [expect.objectContaining({ author: 'Testovací autor', type: 'media' })] }),
      expect.objectContaining({ kind: 'fact', kindLabel: 'Fakt' }),
      expect.objectContaining({ kind: 'media_report', kindLabel: 'Mediálna správa' }),
      expect.objectContaining({ kind: 'response', kindLabel: 'Vyjadrenie kandidáta' }),
      expect.objectContaining({ kind: 'official_outcome', kindLabel: 'Oficiálny výsledok' }),
    ]));
  });

  it('projects sourced official candidacy facts into the basic row', () => {
    const payload = createComparisonPayload(makeGuideData({ claims: [] }));
    expect(payload.candidates[0]!.rows[0]).toEqual(expect.objectContaining({ candidacies: [expect.objectContaining({
      id: 'candidacy-1', election: 'Primátor mesta', ballotNumber: 1, ageAtElection: 40,
      occupationOfficial: 'učiteľka', affiliation: 'Nezávislý kandidát', sources: [expect.objectContaining({ id: 'source-1' })],
    })] }));
  });

  it('rejects missing candidacy sources instead of showing unsupported basic facts', () => {
    expect(() => createComparisonPayload(makeGuideData({ candidacies: [{ ...baseCandidacy, sourceIds: [] }] }))).toThrow('candidacy-1: sourceIds must not be empty');
  });

  it('keeps canonical multi-ballot order after input data is reversed', async () => {
    const data = await loadGuideData();
    data.candidacies = data.candidacies.slice().reverse();
    const basic = createComparisonPayload(data).candidates.find((entry) => entry.candidate.id === 'candidate-1')!.rows[0]!;
    expect(basic.candidacies.map((record) => [record.electionId, record.ballotNumber])).toEqual([
      ['mayor', 1], ['city-council', 1], ['region-council', 1],
    ]);
  });

  it('fails closed on missing election or district source relationships', async () => {
    for (const collection of ['elections', 'districts'] as const) {
      const data = structuredClone(await loadGuideData());
      data[collection][0]!.sourceIds = [];
      expect(() => createComparisonPayload(data)).toThrow('sourceIds must not be empty');
    }
  });
});
