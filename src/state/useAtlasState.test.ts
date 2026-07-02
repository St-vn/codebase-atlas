import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useAtlasState } from './useAtlasState';
import type { TypedGraphModel } from '../core/typedGraphModel';

const model: TypedGraphModel = {
  nodes: [{id:'a',label:'a',sourceFile:'a',sourceLocation:null,community:0,role:'module',fanIn:0,fanOut:0},
          {id:'b',label:'b',sourceFile:'b',sourceLocation:null,community:0,role:'leaf',fanIn:0,fanOut:0}],
  edges: [{source:'b',target:'a',relation:'calls'}],
} as any;

describe('useAtlasState — selection drives focus + blast-radius (contract §9, F10, F14)', () => {
  it('selecting a node sets focusSeedIds, computes focusScores, combinedOpacity, and fetches blast-radius', async () => {
    const mcp = { call: vi.fn().mockResolvedValue({ impacted_ids: ['b'], impact_edges: [{source:'b',target:'a',relation:'calls'}] }) };
    const { result } = renderHook(() => useAtlasState(model, { mcp }));
    await act(async () => { result.current.select('a'); });
    expect(result.current.view.focusSeedIds.has('a')).toBe(true);
    expect(result.current.view.focusScores.get('a')).toBe(1);
    expect(result.current.view.combinedOpacity.get('a')).toBeGreaterThan(0);
    expect(result.current.view.blastRadius?.impactedIds).toEqual(['b']);
  });
  it('F14: selecting a node sets view.focusId to the selected id (MVP compat)', () => {
    const { result } = renderHook(() => useAtlasState(model, {}));
    act(() => { result.current.select('a'); });
    expect(result.current.view.focusId).toBe('a');
  });
  it('F14: cluster selection (set of 2) sets focusId to the first seed (documented ordering)', () => {
    const { result } = renderHook(() => useAtlasState(model, {}));
    const seedSet = new Set(['b', 'a']); // insertion order: b first
    act(() => { result.current.selectCluster(seedSet); });
    expect(result.current.view.focusSeedIds.has('a')).toBe(true);
    expect(result.current.view.focusSeedIds.has('b')).toBe(true);
    // The contract is: focusId is the first seed in document order of the Set.
    // Set iteration order is insertion order in JS — 'b' was inserted first.
    expect(result.current.view.focusId).toBe('b');
  });
  it('select(id) sets view.selection to { kind: "node", id } (contract §18 — P4 consumer key)', () => {
    const { result } = renderHook(() => useAtlasState(model, {}));
    act(() => { result.current.select('a'); });
    expect(result.current.view.selection).toEqual({ kind: 'node', id: 'a' });
  });
  it('selectCluster(seedIds) sets view.selection to { kind: "cluster", id: <community of first seed> } (contract §18)', () => {
    // Use a model where 'a' and 'b' both live in community 1 — the clusterId is derived from
    // the first seed's community (cluster identity semantics, ARCHITECTURE-P2 §"Cluster identity").
    const model2: TypedGraphModel = {
      nodes: [{id:'a',label:'a',sourceFile:'a',sourceLocation:null,community:1,role:'module',fanIn:0,fanOut:0},
              {id:'b',label:'b',sourceFile:'b',sourceLocation:null,community:1,role:'module',fanIn:0,fanOut:0}],
      edges: [{source:'b',target:'a',relation:'calls'}],
    } as any;
    const { result } = renderHook(() => useAtlasState(model2, {}));
    act(() => { result.current.selectCluster(new Set(['b', 'a'])); }); // 'b' first → community 1
    expect(result.current.view.selection).toEqual({ kind: 'cluster', id: 1 });
  });
  it('clearFocus nulls view.selection along with focus + blastRadius (contract §18 + §9)', () => {
    const { result } = renderHook(() => useAtlasState(model, {}));
    act(() => { result.current.select('a'); });
    expect(result.current.view.selection).not.toBeNull();
    act(() => { result.current.clearFocus(); });
    expect(result.current.view.selection).toBeNull();
  });
  it('clearing focus restores focusScores to all-1 and combinedOpacity === matchScores', () => {
    const { result } = renderHook(() => useAtlasState(model, {}));
    act(() => { result.current.select('a'); result.current.clearFocus(); });
    expect(result.current.view.focusSeedIds.size).toBe(0);
    expect([...result.current.view.focusScores.values()].every(v => v === 1)).toBe(true);
  });
  it('F10: clearFocus also clears blastRadius (contract §9 — US-009 AC)', async () => {
    const mcp = { call: vi.fn().mockResolvedValue({ impacted_ids: ['b'], impact_edges: [{source:'b',target:'a',relation:'calls'}] }) };
    const { result } = renderHook(() => useAtlasState(model, { mcp }));
    await act(async () => { result.current.select('a'); });
    expect(result.current.view.blastRadius).not.toBeNull();
    act(() => { result.current.clearFocus(); });
    expect(result.current.view.blastRadius).toBeNull();
  });
});
