import { describe, expect, it } from 'vitest';
import { loadGlobalSources } from '../../src/lib/load-guide-data';

describe('historical source URLs', () => {
  it.each([
    ['statistics-nrsr-candidates-2010', 'https://volby.statistics.sk/nrsr/nrsr2010/info/regkand.jsp%40lang%3Dsk.htm'],
    ['statistics-ep-candidates-2009', 'https://volby.statistics.sk/ep/ep2009/info/regkand_slov.html'],
    ['statistics-ep-elected-2009', 'https://volby.statistics.sk/ep/ep2009/sr/tab608c7.html?lang=sk'],
    ['statistics-ep-results-2019', 'https://volby.statistics.sk/opendata/eup/2019/EP_2019_SK_tab07a.csv'],
    ['statistics-ep-candidates-2024', 'https://volby.statistics.sk/opendata/eup/2024/EP2024_SK_tab0b.csv'],
    ['statistics-ep-results-2024', 'https://volby.statistics.sk/opendata/eup/2024/EP2024_SK_tab07a.csv'],
    ['statistics-osk-elected-2013', 'https://volby.statistics.sk/opendata/osk/2013/1.kolo/OSK_2013_1kolo_tab04.csv'],
    ['statistics-osk-results-2013', 'https://volby.statistics.sk/opendata/osk/2013/1.kolo/OSK_2013_1kolo_tab08.csv'],
    ['statistics-osk-candidates-2013', 'https://volby.statistics.sk/osk/osk2013/staticcontent/kandidati/ZA_poslanec.pdf'],
    ['bratislavske-noviny-raca-candidates-2014', 'https://www.bratislavskenoviny.sk/samosprava/38113-volby-2014-zoznam-kandidatov-mestska-cast-raca'],
  ])('%s points to the accessible canonical document', async (id, url) => {
    const source = (await loadGlobalSources()).find((item) => item.id === id);
    expect(source?.url).toBe(url);
  });

  it('preserves the original English title of the 2006 candidate register', async () => {
    const source = (await loadGlobalSources()).find((item) => item.id === 'statistics-nrsr-candidates-2006');
    expect(source?.title).toBe('List of candidates');
    expect(source?.language).toBe('en');
  });
});
