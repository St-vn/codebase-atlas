import type { TypedGraphModel, AtlasEdge } from './typedGraphModel';
export interface ReverseDeps { impactedIds: string[]; impactEdges: AtlasEdge[]; }

export function reverseDepsFromGraph(
  model: TypedGraphModel,
  nodeId: string,
  opts?: { candidateIds?: string[]; candidateEdges?: AtlasEdge[] }
): ReverseDeps {
  const validNodeIds = new Set(model.nodes.map(n => n.id));
  const impactEdges: AtlasEdge[] = [];
  // BFS produces impactedIds/impactEdges by default.
  const impacted = new Set<string>();
  const queue = [nodeId];
  const seen = new Set<string>([nodeId]);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const e of model.edges) {
      if (e.target === cur && !seen.has(e.source)) {
        seen.add(e.source); impacted.add(e.source); impactEdges.push(e); queue.push(e.source);
      }
    }
  }
  // F11: if the caller provided MCP candidates, use them after normalization instead.
  if (opts?.candidateIds) {
    impacted.clear();
    for (const id of opts.candidateIds) if (validNodeIds.has(id)) impacted.add(id);
  }
  if (opts?.candidateEdges) {
    impactEdges.length = 0;
    for (const e of opts.candidateEdges) {
      if (validNodeIds.has(e.source) && validNodeIds.has(e.target)) impactEdges.push(e);
    }
  } else if (opts?.candidateIds) {
    // Build impactEdges from surviving candidate ids.
    impactEdges.length = 0;
    for (const e of model.edges) {
      if (e.target === nodeId && impacted.has(e.source)) impactEdges.push(e);
    }
  }
  return { impactedIds: [...impacted], impactEdges };
}
