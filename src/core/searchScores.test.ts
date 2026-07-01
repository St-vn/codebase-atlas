import { describe, it, expect } from 'vitest';
import { matchScores } from './searchScores';

const nodes = [
  { id:'a', label:'client.py' },
  { id:'b', label:'auth.py' },
  { id:'c', label:'transport.py' },
] as any;

describe('matchScores (US-003 gradient)', () => {
  it('returns 0..1 scores', () => {
    const s = matchScores(nodes, 'cli');
    const vals = [...s.values()];
    expect(Math.max(...vals)).toBeLessThanOrEqual(1);
    expect(Math.min(...vals)).toBeGreaterThanOrEqual(0);
  });
  it('is a gradient, not binary — some score strictly between 0 and 1', () => {
    const s = matchScores(nodes, 'cli');
    const vals = [...s.values()];
    expect(vals.some(v => v > 0 && v < 1)).toBe(true);
  });
  it('non-matches never fully disappear (>= floor)', () => {
    const s = matchScores(nodes, 'client');
    expect(s.get('b')!).toBeGreaterThan(0); // auth.py doesn't match 'client' but keeps a floor
  });
  it('empty query → all default (1)', () => {
    const s = matchScores(nodes, '');
    expect([...s.values()].every(v => v === 1)).toBe(true);
  });
  it('exact/prefix match scores highest', () => {
    const s = matchScores(nodes, 'client.py');
    expect(s.get('a')!).toBeGreaterThan(s.get('b')!);
  });
});
