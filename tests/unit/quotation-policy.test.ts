import { describe, expect, it } from 'vitest';
import { loadGuideData } from '../../src/lib/load-guide-data';

const data = await loadGuideData();
const claimsById = new Map(data.claims.map((claim) => [claim.id, claim]));
const sourcesById = new Map(data.sources.map((source) => [source.id, source]));
const attributedKinds = new Set(['quote', 'media_report', 'response', 'official_outcome']);

function wordCount(text: string) {
  return text
    .replace(/[„“]/gu, '')
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .length;
}

function quotedSegments(text: string) {
  return [...text.matchAll(/„([^“]+)“/gu)]
    .map((match) => match[1])
    .filter((excerpt): excerpt is string => excerpt !== undefined);
}

describe('quotation and attributed-source policy', () => {
  it('keeps every quoted excerpt at or below 25 words', () => {
    const overlong = data.claims.flatMap((claim) =>
      quotedSegments(claim.text.sk)
        .filter((excerpt) => wordCount(excerpt) > 25)
        .map(() => claim.id),
    );

    expect(overlong).toEqual([]);
  });

  it('stores quote claims as explicit quoted excerpts', () => {
    const unquoted = data.claims
      .filter((claim) => claim.kind === 'quote')
      .filter((claim) => quotedSegments(claim.text.sk).length === 0)
      .map((claim) => claim.id);

    expect(unquoted).toEqual([]);
  });

  it('accounts for every quoted segment by claim kind', () => {
    const segmentsByKind = data.claims.reduce<Record<string, number>>((totals, claim) => {
      totals[claim.kind] = (totals[claim.kind] ?? 0) + quotedSegments(claim.text.sk).length;
      return totals;
    }, {});

    expect(segmentsByKind.quote).toBe(33);
    expect(segmentsByKind.response).toBe(2);
    expect(Object.values(segmentsByKind).reduce((total, count) => total + count, 0)).toBe(35);
  });

  it.each([
    [
      'claim-candidate-44-programme-audit-2026',
      '„Pred samotnou výstavbou bytov treba najprv urobiť kompletný audit nájomcov, ktorým sa nikto za dvadsať rokov ešte nezaoberal.“',
    ],
    [
      'claim-drahovzal-programme-healthcare-2026',
      '„…chce pokračovať v podpore toho, aby si Liptovský Mikuláš udržal kvalitnú zdravotnú starostlivosť…“',
    ],
    [
      'claim-geci-programme-development-2026',
      '„Chce preto podporovať rozvoj, ktorý je ekonomicky zodpovedný, myslí na životné prostredie…“',
    ],
    [
      'claim-candidate-64-programme-2026',
      '„Palúdzka je môj domov, preto mi na nej záleží celý život.“',
    ],
  ])('locks the source-verified wording for %s', (claimId, expected) => {
    expect(claimsById.get(claimId)?.text.sk).toBe(expected);
  });

  it('does not store search-result pages as sources', () => {
    const searchResultSources = data.sources
      .filter((source) => /(?:^|\.)(?:google|bing|duckduckgo)\./u.test(new URL(source.url).hostname))
      .map((source) => source.id);

    expect(searchResultSources).toEqual([]);
  });

  it('uses the publisher canonical URL for the Pravda heliport report', () => {
    expect(sourcesById.get('tasr-blchac-heliport-2018')?.url).toBe(
      'https://www.pravda.sk/spravy/domace/clanok/460387-prokurator-zastavil-trestne-stihanie-primatora-l-mikulasa-v-kauze-heliport',
    );
  });

  it('requires attributable authorship for media used as quoted or reported evidence', () => {
    const relevantSourceIds = new Set(
      data.claims
        .filter((claim) => attributedKinds.has(claim.kind))
        .flatMap((claim) => claim.sourceIds),
    );

    const unattributedMedia = [...relevantSourceIds]
      .map((sourceId) => sourcesById.get(sourceId))
      .filter((source) => source?.type === 'media' && !source.author)
      .map((source) => source?.id);

    expect(unattributedMedia).toEqual([]);
  });
});
