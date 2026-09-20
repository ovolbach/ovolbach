import { baseClaim, baseSource, makeGuideData } from './guide-data';

// Synthetic test people and quotations; never shipped as candidate content.
export function comparisonContextFixture() {
  const data = makeGuideData();
  data.candidates.push({ ...data.candidates[0]!, id: 'candidate-2', slug: 'test-person', displayName: 'Testovacia osoba' });
  data.sources = [
    { ...baseSource, type: 'media', author: 'Testovací autor', publisher: 'Testovací vydavateľ' },
    { ...baseSource, id: 'source-response', type: 'candidate', title: 'Testovacie priame vyjadrenie' },
    { ...baseSource, id: 'source-outcome', type: 'official', title: 'Testovacie oficiálne rozhodnutie' },
  ];
  data.claims = (['fact', 'quote', 'media_report', 'response', 'official_outcome'] as const).map((kind) => ({
    ...baseClaim, id: `context-${kind}`, category: 'controversies', kind,
    label: { sk: `Kontext ${kind}` }, text: { sk: `Testovací text ${kind}` }, period: '2024–2026',
    sourceIds: [kind === 'response' ? 'source-response' : kind === 'official_outcome' ? 'source-outcome' : baseSource.id],
  }));
  return data;
}
