import { describe, expect, it } from 'vitest';
import { coverageMessage, coverageTitle } from '../../src/lib/profile-content';

describe('profile coverage content', () => {
  it('renders searched_none as the approved neutral sentence', () => {
    expect(coverageMessage('searched_none')).toBe('Vo verejne dostupných zdrojoch sa údaj nenašiel.');
  });

  it('renders not_applicable without claiming a search occurred', () => {
    expect(coverageMessage('not_applicable')).toBe('Údaj sa na kandidáta nevzťahuje.');
  });

  it('keeps pending distinct from searched_none', () => {
    expect(coverageTitle('pending')).toBe('Údaje sa overujú.');
    expect(coverageMessage('pending')).toBe('Údaje sa overujú.');
  });
});
