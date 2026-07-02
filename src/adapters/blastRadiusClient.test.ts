import { describe, it, expect, vi } from 'vitest';
import { fetchBlastRadius } from './blastRadiusClient';
import type { TypedGraphModel } from '../core/typedGraphModel';

const model: TypedGraphModel = {
  nodes: [{id:'a',label:'a',sourceFile:'a',sourceLocation:null,community:0,role:'leaf',fanIn:0,fanOut:0},
          {id:'b',label:'b',sourceFile:'b',sourceLocation:null,community:0,role:'module',fanIn:0,fanOut:0}],
  edges: [{source:'b',target:'a',relation:'calls'}],
};

describe('fetchBlastRadius (ADR-003: MCP primary + fallback + F5/F6/F11 guards)', () => {
  it('uses MCP get_pr_impact when available and sets source=mcp', async () => {
    const mcp = { call: vi.fn().mockResolvedValue({ impacted_ids: ['b'], impact_edges: [{source:'b',target:'a',relation:'calls'}] }) };
    const r = await fetchBlastRadius('a', { mcp, model });
    expect(mcp.call).toHaveBeenCalledWith('get_pr_impact', expect.objectContaining({ node_id: 'a' }));
    expect(r.source).toBe('mcp');
    expect(r.impactedIds).toEqual(['b']);
  });
  it('falls back to reverseDepsFromGraph when MCP throws, sets source=graph-fallback', async () => {
    const mcp = { call: vi.fn().mockRejectedValue(new Error('connection refused')) };
    const r = await fetchBlastRadius('a', { mcp, model });
    expect(r.source).toBe('graph-fallback');
    expect(r.impactedIds).toEqual(['b']);
  });
  it('falls back when no MCP client provided', async () => {
    const r = await fetchBlastRadius('a', { model });
    expect(r.source).toBe('graph-fallback');
    expect(r.impactedIds).toEqual(['b']);
  });
  it('F5: MCP call that never resolves → fallback fires within 3s timeout', async () => {
    // Mock MCP that never resolves.
    const mcp = { call: vi.fn().mockReturnValue(new Promise(() => {})) };
    const start = Date.now();
    const r = await fetchBlastRadius('a', { mcp, model, timeoutMs: 50 }); // 50ms in test for speed; prod default 3000
    const elapsed = Date.now() - start;
    expect(r.source).toBe('graph-fallback');
    expect(r.impactedIds).toEqual(['b']);
    expect(elapsed).toBeLessThan(500); // well under the test timeout
  });
  it('F6: MCP returns malformed response (no impacted_ids) → fallback', async () => {
    const mcp = { call: vi.fn().mockResolvedValue({}) }; // no impacted_ids, no impact_edges
    const r = await fetchBlastRadius('a', { mcp, model });
    expect(r.source).toBe('graph-fallback');
    expect(r.impactedIds).toEqual(['b']);
  });
  it('F6: MCP returns null → fallback', async () => {
    const mcp = { call: vi.fn().mockResolvedValue(null) };
    const r = await fetchBlastRadius('a', { mcp, model });
    expect(r.source).toBe('graph-fallback');
  });
  it('F11: MCP returns ids not in model → result filters to model-known ids', async () => {
    const mcp = { call: vi.fn().mockResolvedValue({ impacted_ids: ['b', 'x', 'y'], impact_edges: [{source:'b',target:'a',relation:'calls'}, {source:'x',target:'a',relation:'calls'}] }) };
    const r = await fetchBlastRadius('a', { mcp, model });
    // 'x' and 'y' are not in model.nodes — dropped.
    expect(r.source).toBe('mcp');
    expect(r.impactedIds).toEqual(['b']);
    expect(r.impactEdges).toEqual([{source:'b',target:'a',relation:'calls'}]);
  });
});
