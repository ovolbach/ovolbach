import type { Source } from './schemas';
import { assertSafeOutboundSourceUrl } from './source-url';

export const SOURCE_TYPE_LABELS: Record<Source['type'], string> = {
  official: 'Oficiálny dokument', candidate: 'Materiál kandidáta', media: 'Mediálny zdroj',
};

export function sourceMetadata(source: Source): string {
  return `${SOURCE_TYPE_LABELS[source.type]}, ${source.author ? `${source.author}, ` : ''}${source.publisher}${source.publishedAt ? `, ${source.publishedAt}` : ''}, overené ${source.checkedAt}`;
}

export function resolveSourceLinks(recordId: string, sourceIds: string[], sources: Source[]): Source[] {
  if (sourceIds.length === 0) {
    throw new Error(`${recordId}: sourceIds must not be empty`);
  }

  const sourcesById = new Map(sources.map((source) => [source.id, source]));
  return sourceIds.map((sourceId) => {
    const source = sourcesById.get(sourceId);
    if (!source) throw new Error(`${recordId}: unknown source ID ${sourceId}`);
    assertSafeOutboundSourceUrl(`${recordId}: source ID ${sourceId}`, source.url);
    return source;
  });
}

export function resolveRecordSources(records: Array<{ id: string; sourceIds: string[] }>, sources: Source[]): Source[] {
  const resolved = records.flatMap((record) => resolveSourceLinks(record.id, record.sourceIds, sources));
  return [...new Map(resolved.map((source) => [source.id, source])).values()];
}
