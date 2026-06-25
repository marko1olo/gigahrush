import { describe, expect, test } from 'vitest';
import { calculateDamage } from '../src/systems/combat';

describe('calculateDamage', () => {
  test('calculates normal damage correctly', () => {
    expect(calculateDamage(10, 2)).toBe(8);
  });

  test('clamps damage to 0 when armor exceeds base damage', () => {
    expect(calculateDamage(5, 10)).toBe(0);
  });

  test('handles zero values correctly', () => {
    expect(calculateDamage(0, 0)).toBe(0);
    expect(calculateDamage(10, 0)).toBe(10);
    expect(calculateDamage(0, 10)).toBe(0);
  });

  test('handles negative inputs', () => {
    expect(calculateDamage(-10, 0)).toBe(0);
    expect(calculateDamage(10, -5)).toBe(15);
    expect(calculateDamage(-10, -5)).toBe(0);
  });
});
