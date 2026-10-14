import { describe, expect, it } from 'vitest';
import { loadElectionCycle } from '../../src/lib/load-guide-data';
import { summarizeElectionHistory } from '../../src/lib/profile-content';
import { regionalCandidacyUpdates } from '../../src/lib/regional-context';

describe('independently reviewed PSK identity and event boundaries', () => {
  it('preserves verified business roles while excluding the documented same-name and same-age mismatches', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    const text = (id: string) => data.claims.filter((row) => row.candidateId === id && row.category === 'employment_business')
      .map((row) => row.text.sk).join('\n');
    expect(text('psk-jozef-kralik')).toContain('KRALIK.Partners');
    expect(text('psk-jozef-kralik')).not.toContain('plgd.dev');
    expect(text('psk-artur-benes')).not.toContain('BeneSport');
    expect(text('psk-martin-estocak')).not.toContain('JOB4U');
    expect(text('psk-frantisek-olha')).not.toContain('DMSTECH');
    expect(text('psk-jan-stanko')).toContain('spoločníka');
    expect(text('psk-jan-stanko')).not.toContain('konateľa');
  });
  it('keeps reported withdrawals distinct from the commission’s dated formal receipt', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    expect(data.candidacies.filter((row) => row.electionId === 'region-chair')).toHaveLength(11);
    expect(data.claims.filter((row) => row.candidateId === 'psk-judita-lassakova' && row.kind === 'official_outcome'))
      .toContainEqual(expect.objectContaining({ period: '2026-10-06', sourceIds: ['psk-withdrawal-2026'] }));
    for (const id of ['psk-zoltan-kaso', 'psk-monika-leskova']) {
      expect(data.claims.some((row) => row.candidateId === id && row.kind === 'media_report' && /vzdani[ea]/.test(row.text.sk)), id).toBe(true);
      expect(data.claims.some((row) => row.candidateId === id && row.kind === 'official_outcome' && /vzdani[ea]/.test(row.text.sk)), id).toBe(false);
    }
  });
  it('retains the official end of a bankruptcy separately from its earlier procedural notice', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    const events = data.claims.filter((row) => row.candidateId === 'psk-zoltan-kaso' && row.category === 'controversies');
    expect(events).toContainEqual(expect.objectContaining({ kind: 'official_outcome', period: '2024-09-16',
      text: { sk: expect.stringContaining('zrušení konkurzu') } }));
    expect(events).toContainEqual(expect.objectContaining({ kind: 'official_outcome', period: '2023-05-18' }));
  });
  it('gives every historical result its structured office and complete outcome', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    for (const claim of data.claims.filter((row) => row.kind === 'election_result')) {
      expect(claim.election, claim.id).toBeDefined();
    }
    expect(data.claims.find((row) => row.id === 'claim-psk-patrik-frantiska-previous_elections-1')).toMatchObject({
      text: { sk: 'Vo voľbách do zastupiteľstva Prešovského samosprávneho kraja v roku 2017 vo volebnom obvode č. 6 získal Patrik Františka 861 hlasov (0,72 %). Výsledok podľa Štatistického úradu SR: nezvolený; náhradník.' },
      election: { contestId: 'presovsky-kraj-region-council-2017', office: 'regional_council', outcome: 'substitute' },
    });
  });
  it('counts each confirmed election once and preserves official council substitute statuses', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    for (const [candidateId, wins] of [['psk-milan-mazurek', 1], ['psk-jan-stanko', 0]] as const) {
      const claims = data.claims.filter((row) => row.candidateId === candidateId && row.period?.startsWith('2022') && row.election?.office === 'regional_council');
      expect(claims, candidateId).toHaveLength(1);
      expect(summarizeElectionHistory(claims)).toMatchObject({ participations: 1, wins });
    }
    expect(data.claims.find((row) => row.id === 'claim-psk-jan-stanko-regional-9-result-2022')).toMatchObject({
      text: { sk: 'Vo voľbách krajského zastupiteľstva v roku 2022 v obci Parihuzovce, volebnom obvode č. 9 získal kandidát Ján STANKO 365 hlasov (1,16 %). Výsledok podľa Štatistického úradu SR: nezvolený; náhradník.' },
      election: { office: 'regional_council', outcome: 'substitute' },
    });
  });
  it('preserves the official X withdrawal-or-recall status rather than counting it as participation', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    for (const id of ['psk-marian-saraka', 'psk-ivan-zaborsky']) {
      const claims = data.claims.filter((row) => row.candidateId === id && row.period === '2022' && row.election?.office === 'mayor');
      expect(claims).toHaveLength(1);
      expect(claims[0]?.election?.outcome, id).toBe('withdrawn');
      expect(claims[0]?.text.sk).toContain('kandidát sa vzdal alebo bol odvolaný');
      expect(summarizeElectionHistory(claims).participations).toBe(0);
    }
  });
  it('surfaces dated formal registration changes separately from reported announcements and other years', async () => {
    const data = await loadElectionCycle(2026, 'presovsky-kraj');
    expect(regionalCandidacyUpdates({ year: 2026, data }).map((row) => row.id))
      .toEqual(['claim-psk-judita-lassakova-withdrawal-2026']);
    expect(regionalCandidacyUpdates({ year: 2025, data })).toEqual([]);
  });
});
