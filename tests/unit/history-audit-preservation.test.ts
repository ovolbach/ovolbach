import { expect, it } from 'vitest';
import { restoreAuditedRecords } from '../helpers/history-audit-preservation';

const before = [{ id: 'a', value: 1 }, { id: 'b', value: 2 }, { id: 'c', value: 3 }];
const changes = [
  { path: 'example.json', id: 'b', beforeIndex: 1, before: before[1]!, after: { id: 'b', value: 20 } },
  { path: 'example.json', id: 'c', beforeIndex: 2, before: before[2]!, after: null },
  { path: 'example.json', id: 'd', beforeIndex: null, before: null, after: { id: 'd', value: 4 } },
];

it('restores only exact audited additions, corrections and removals in their original order', () => {
  expect(restoreAuditedRecords('src/data/example.json', [before[0]!, { id: 'b', value: 20 }, { id: 'd', value: 4 }], changes)).toEqual(before);
});

it('rejects an unaudited value or a missing audited addition', () => {
  expect(() => restoreAuditedRecords('src/data/example.json', [before[0]!, { id: 'b', value: 21 }, { id: 'd', value: 4 }], changes)).toThrow('b');
  expect(() => restoreAuditedRecords('src/data/example.json', [before[0]!, { id: 'b', value: 20 }], changes)).toThrow('d');
});
