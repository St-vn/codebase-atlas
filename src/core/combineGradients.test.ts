import { describe, it, expect } from 'vitest';
import { combineGradients } from './combineGradients';

describe('combineGradients (ONE mechanism — SPEC §4, contract §11)', () => {
  it('multiplies match and focus, floor 0.18 (2-ary backward-compat)', () => {
    const match = new Map([['a',1],['b',0.5],['c',0.05]]);
    const focus = new Map([['a',1],['b',0.8],['c',0.18]]);
    const out = combineGradients(match, focus);
    expect(out.get('a')).toBeCloseTo(1);
    expect(out.get('b')).toBeCloseTo(0.4);
    expect(out.get('c')).toBeGreaterThanOrEqual(0.18); // floor
  });
  it('when focus is all-1, result === match (MVP behavior preserved)', () => {
    const match = new Map([['a',0.5]]);
    const focus = new Map([['a',1]]);
    expect(combineGradients(match, focus).get('a')).toBeCloseTo(0.5);
  });
  it('when match is all-1, result === focus', () => {
    const match = new Map([['a',1]]);
    const focus = new Map([['a',0.3]]);
    expect(combineGradients(match, focus).get('a')).toBeCloseTo(0.3);
  });
  it('never returns below 0.18', () => {
    const out = combineGradients(new Map([['a',0.01]]), new Map([['a',0.01]]));
    expect(out.get('a')).toBeGreaterThanOrEqual(0.18);
  });
  it('variadic: 3 inputs reduce via max(floor, product) (F12, contract §11)', () => {
    // P3/P4 will add more gradient inputs; verify the variadic shape is the contract.
    const a = new Map([['x', 1.0], ['y', 0.5]]);
    const b = new Map([['x', 0.8], ['y', 1.0]]);
    const c = new Map([['x', 0.5], ['y', 0.4]]);
    const out = combineGradients(a, b, c);
    expect(out.get('x')).toBeCloseTo(Math.max(0.18, 1.0 * 0.8 * 0.5)); // 0.4
    expect(out.get('y')).toBeCloseTo(Math.max(0.18, 0.5 * 1.0 * 0.4)); // 0.2
  });
  it('variadic: missing id on any input is treated as 1 (inactive axis)', () => {
    const a = new Map([['x', 0.5]]);
    const b = new Map(); // empty
    const out = combineGradients(a, b);
    expect(out.get('x')).toBeCloseTo(0.5);
  });
  it('variadic: zero inputs → empty map (defensive)', () => {
    expect(combineGradients().size).toBe(0);
  });
});
