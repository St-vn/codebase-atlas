import { describe, it, expect } from 'vitest';
import { deriveRole } from './nodeTyper';

describe('deriveRole', () => {
  it('is deterministic — same input, same role', () => {
    const input = { fanIn: 5, fanOut: 0, inheritsIn: 4, hasContains: false, isMethodTarget: false };
    expect(deriveRole(input)).toBe(deriveRole(input));
  });
  it('high inherits-in → interface', () => {
    expect(deriveRole({ fanIn: 4, fanOut: 1, inheritsIn: 4, hasContains: false, isMethodTarget: false })).toBe('interface');
  });
  it('has contains children → module', () => {
    expect(deriveRole({ fanIn: 2, fanOut: 2, inheritsIn: 0, hasContains: true, isMethodTarget: false })).toBe('module');
  });
  it('method target → method', () => {
    expect(deriveRole({ fanIn: 1, fanOut: 0, inheritsIn: 0, hasContains: false, isMethodTarget: true })).toBe('method');
  });
  it('zero dependents → leaf', () => {
    expect(deriveRole({ fanIn: 0, fanOut: 2, inheritsIn: 0, hasContains: false, isMethodTarget: false })).toBe('leaf');
  });
  it('high calls-in low calls-out → entry-point', () => {
    expect(deriveRole({ fanIn: 8, fanOut: 1, inheritsIn: 0, hasContains: false, isMethodTarget: false })).toBe('entry-point');
  });
});
