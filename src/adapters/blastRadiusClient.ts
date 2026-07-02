import type { TypedGraphModel, AtlasEdge } from '../core/typedGraphModel';
import { reverseDepsFromGraph } from '../core/reverseDeps';

export interface BlastRadius {
  focusNodeId: string;
  impactedIds: string[];
  impactEdges: AtlasEdge[];
  source: 'mcp' | 'graph-fallback';
}

export interface McpClient {
  call(method: string, params: Record<string, unknown>): Promise<unknown>;
}

const DEFAULT_TIMEOUT_MS = 3000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('mcp timeout')), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

export async function fetchBlastRadius(
  nodeId: string,
  ctx: { mcp?: McpClient; model: TypedGraphModel; timeoutMs?: number }
): Promise<BlastRadius> {
  if (ctx.mcp) {
    try {
      const res = await withTimeout(ctx.mcp.call('get_pr_impact', { node_id: nodeId }), ctx.timeoutMs ?? DEFAULT_TIMEOUT_MS);
      // F6: malformed-response guard. Treat anything not a {impacted_ids: string[]} shape as failure.
      if (!res || !Array.isArray((res as { impacted_ids?: unknown }).impacted_ids)) throw new Error('malformed mcp response');
      const candidates = (res as { impacted_ids: string[]; impact_edges?: AtlasEdge[] }).impacted_ids;
      const candidateEdges = (res as { impacted_ids: string[]; impact_edges?: AtlasEdge[] }).impact_edges ?? [];
      // F11: normalize against model — Task 3's reverseDepsFromGraph does the filtering.
      const fb = reverseDepsFromGraph(ctx.model, nodeId, { candidateIds: candidates, candidateEdges });
      return { focusNodeId: nodeId, ...fb, source: 'mcp' };
    } catch { /* fall through to graph fallback */ }
  }
  const fb = reverseDepsFromGraph(ctx.model, nodeId);
  return { focusNodeId: nodeId, ...fb, source: 'graph-fallback' };
}
