import { describe, it, expect } from 'vitest';
import { reverseDepsFromGraph } from './reverseDeps';
import type { TypedGraphModel } from './typedGraphModel';

const model: TypedGraphModel = {
  nodes: [{id:'a',label:'a',sourceFile:'a',sourceLocation:null,community:0,role:'leaf',fanIn:0,fanOut:0},
          {id:'b',label:'b',sourceFile:'b',sourceLocation:null,community:0,role:'module',fanIn:0,fanOut:0},
          {id:'c',label:'c',sourceFile:'c',sourceLocation:null,community:0,role:'entry-point',fanIn:0,fanOut:0}],
  edges: [{source:'b',target:'a',relation:'calls'},{source:'c',target:'b',relation:'calls'}],
};

describe('reverseDepsFromGraph (AVAIL-002 fallback, F11 id normalization)', () => {
  it('returns transitive upstream dependents of a node', () => {
    const r = reverseDepsFromGraph(model, 'a');
    expect(r.impactedIds).toEqual(expect.arrayContaining(['b','c']));
    expect(r.impactedIds).not.toContain('a');
  });
  it('impactEdges are the reverse-dep edges', () => {
    const r = reverseDepsFromGraph(model, 'a');
    expect(r.impactEdges.length).toBe(2);
    expect(r.impactEdges.every(e => e.target === 'a' || r.impactedIds.includes(e.target))).toBe(true);
  });
  it('no dependents → empty result, no crash', () => {
    const r = reverseDepsFromGraph(model, 'c');
    expect(r.impactedIds).toEqual([]);
    expect(r.impactEdges).toEqual([]);
  });
  it('normalizes impactedIds against model.nodes (F11)', () => {
    // Caller passes a candidate list that includes ids not in the model; they must be filtered out.
    const candidates = ['b', 'ghost-1', 'c', 'ghost-2'];
    const r = reverseDepsFromGraph(model, 'a', { candidateIds: candidates });
    expect(r.impactedIds.sort()).toEqual(['b', 'c']);
  });
  it('normalizes impactEdges against model.edges (F11)', () => {
    // Edges that reference ids not in the model are dropped.
    const candidates = ['b'];
    const r = reverseDepsFromGraph(model, 'a', { candidateIds: candidates });
    expect(r.impactEdges.every(e => model.nodes.some(n => n.id === e.source) && model.nodes.some(n => n.id === e.target))).toBe(true);
  });
});
