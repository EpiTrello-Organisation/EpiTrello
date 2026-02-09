import { describe, it, expect } from 'vitest';
import { LABELS } from './labels';

describe('constants/labels', () => {
  it('exports LABELS as an array with 6 entries', () => {
    expect(Array.isArray(LABELS)).toBe(true);
    expect(LABELS).toHaveLength(6);
  });

  it('each label has a valid hex color string', () => {
    const hex = /^#[0-9A-Fa-f]{6}$/;

    for (const l of LABELS) {
      expect(l).toHaveProperty('color');
      expect(typeof l.color).toBe('string');
      expect(l.color).toMatch(hex);
    }
  });

  it('colors are unique (no duplicates)', () => {
    const colors = LABELS.map((l) => l.color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('matches the expected color palette (order matters)', () => {
    expect(LABELS.map((l) => l.color)).toEqual([
      '#1F7A4C',
      '#8B6B00',
      '#B35A00',
      '#B0372E',
      '#7B3FA6',
      '#1B5DBF',
    ]);
  });
});
