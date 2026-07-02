import { describe, it, expect } from 'vitest';
import { computeFocusScores } from './focusPolicy';
import type { TypedGraphModel } from './typedGraphModel';

const model: TypedGraphModel = {
  nodes: [{id:'a',label:'a.py',sourceFile:'a',sourceLocation:null,community:0,role:'module',fanIn:1,fanOut:1},
          {id:'b',label:'b.py',sourceFile:'b',sourceLocation:null,community:0,role:'leaf',fanIn:1,fanOut:0},
          {id:'c',label:'c.py',sourceFile:'c',sourceLocation:null,community:0,role:'leaf',fanIn:0,fanOut:0}],
  edges: [{source:'a',target:'b',relation:'calls'},{source:'b',target:'c',relation:'calls'}],
};

describe('computeFocusScores (US-008 gradient, contract §10)', () => {
  it('returns 0..1 scores, same shape as matchScores, floor 0.18', () => {
    const s = computeFocusScores(model, new Set(['a']), new Set(['a','b','c']), { maxDist: 2 });
    expect(s.get('a')).toBe(1);                 // seed → full
    expect(s.get('b')).toBeGreaterThan(0); // dist 1
    expect(s.get('b')).toBeLessThan(1);
    const vals = [...s.values()];
    expect(Math.min(...vals)).toBeGreaterThanOrEqual(0.18); // floor
  });
  it('unreachable node gets floor, not zero', () => {
    const s = computeFocusScores(model, new Set(['a']), new Set(['a','b','c']), { maxDist: 2 });
    expect(s.get('c')!).toBeGreaterThanOrEqual(0.18);
    expect(s.get('c')!).toBeLessThanOrEqual(0.30);
  });
  it('empty seed set → all default (1)', () => {
    const s = computeFocusScores(model, new Set(), new Set(['a','b','c']));
    expect([...s.values()].every(v => v === 1)).toBe(true);
  });
  it('BFS is restricted to the mountedIds subset (F4, contract §10)', () => {
    // 1000-node chain model + 10-node mountedIds → BFS touches at most the edges among mounted nodes.
    const big: TypedGraphModel = {
      nodes: Array.from({length: 1000}, (_, i) => ({
        id: String(i), label: `n${i}`, sourceFile: '', sourceLocation: null,
        community: 0, role: 'leaf' as const, fanIn: 0, fanOut: 1,
      })),
      edges: Array.from({length: 999}, (_, i) => ({ source: String(i), target: String(i+1), relation: 'calls' as const })),
    };
    const mounted = new Set(Array.from({length: 10}, (_, i) => String(i)));
    let visits = 0;
    // Spy: counts edges the impl ACTUALLY TRAVERSES (i.e. edges where BOTH endpoints ∈ mountedIds).
    // The hook fires ONLY after the mounted-edge check — see implementation note in §Implementation goal.
    const s = computeFocusScores(big, new Set(['0']), mounted, { maxDist: 9 }, { _onEdgeVisit: () => visits++ });
    expect(visits).toBeLessThanOrEqual(9); // ≤ mounted edge count (chain of 10 → 9 edges)
    expect(s.size).toBeLessThanOrEqual(10);
  });

  it('PERF-004 runtime: p95 of focus recompute < 100ms for ≤200 mounted nodes on a 1000-node model', () => {
    // Locks the latency bound that the bounded-BFS structural test cannot — the hook counts edges,
    // but does not measure wall-clock time. PERF-004 is a p95 wall-clock bound; this is the perf test.
    const big: TypedGraphModel = {
      nodes: Array.from({length: 1000}, (_, i) => ({
        id: String(i), label: `n${i}`, sourceFile: '', sourceLocation: null,
        community: 0, role: 'leaf' as const, fanIn: 0, fanOut: 1,
      })),
      edges: Array.from({length: 999}, (_, i) => ({ source: String(i), target: String(i+1), relation: 'calls' as const })),
    };
    const mountedIds200 = new Set(Array.from({length: 200}, (_, i) => String(i)));
    const seeds = new Set(['0']);
    // Warmup (JIT + Map allocation paths).
    for (let i = 0; i < 10; i++) computeFocusScores(big, seeds, mountedIds200, { maxDist: 9 });
    // Measure 100 iterations; take p95.
    const times: number[] = [];
    for (let i = 0; i < 100; i++) {
      const t0 = performance.now();
      computeFocusScores(big, seeds, mountedIds200, { maxDist: 9 });
      times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    const p95 = times[Math.floor(times.length * 0.95)];
    expect(p95).toBeLessThan(100); // PERF-004 bound (ms)
  });
});
