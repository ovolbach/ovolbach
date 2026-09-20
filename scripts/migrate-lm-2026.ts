import { mkdir, readFile, rename, writeFile, unlink, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// One-time structural migration. Preserve candidate, claim, coverage and source records verbatim.
const sourceDir = resolve(process.cwd(), 'src/data');
const targetDir = join(sourceDir, 'elections', '2026', 'zilinsky-kraj');
const expectedCounts = { candidates: 91, candidacies: 109, claims: 576, districts: 9, elections: 4, 'research-coverage': 728 } as const;
const contestIds: Record<string, string> = {
  mayor: '2026-lm-mayor',
  'city-council': '2026-lm-city-council',
  'region-chair': '2026-zsk-region-chair',
  'region-council': '2026-zsk-region-council',
};
const districtId = (oldId: string): string => oldId.startsWith('city-')
  ? `2026-lm-${oldId}` : oldId === 'zsk-5' ? '2026-zsk-region-5' : (() => { throw new Error(`Unexpected district ${oldId}`); })();

for (const [name, expected] of Object.entries(expectedCounts)) {
  const raw = await readFile(join(sourceDir, `${name}.json`), 'utf8');
  const records = JSON.parse(raw) as Array<{ id: string }>;
  if (records.length !== expected) throw new Error(`${name}: expected ${expected} records, found ${records.length}`);
  try {
    await access(join(targetDir, `${name}.json`));
    throw new Error(`Target already exists: ${name}.json`);
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error;
  }
}

await mkdir(targetDir, { recursive: true });
for (const name of ['candidates', 'claims', 'research-coverage'] as const) {
  await rename(join(sourceDir, `${name}.json`), join(targetDir, `${name}.json`));
}

for (const name of ['candidacies', 'districts', 'elections'] as const) {
  const oldPath = join(sourceDir, `${name}.json`);
  const newPath = join(targetDir, `${name}.json`);
  const records = JSON.parse(await readFile(oldPath, 'utf8')) as Array<Record<string, unknown>>;
  const transformed = records.map((record) => {
    if (name === 'districts') return { ...record, id: districtId(record.id as string) };
    if (name === 'elections') return {
      ...record,
      contestId: contestIds[record.id as string],
      ...(record.id === 'region-council'
        ? { maxSelections: 'district_seats', sourceIds: ['zsk-districts-seats-2026'] }
        : {}),
    };
    return {
      ...record,
      contestId: contestIds[record.electionId as string],
      ...(record.districtId ? { districtId: districtId(record.districtId as string) } : {}),
    };
  });
  if (name !== 'districts' && transformed.some((record) => !('contestId' in record) || !record.contestId)) throw new Error(`${name}: unknown contest`);
  await writeFile(newPath, `${JSON.stringify(transformed, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  if ((JSON.parse(await readFile(newPath, 'utf8')) as unknown[]).length !== records.length) throw new Error(`${name}: written count differs`);
  await unlink(oldPath);
}

console.log(`Moved LM 2026 election records to ${targetDir}`);
