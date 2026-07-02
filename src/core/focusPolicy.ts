import type { TypedGraphModel, AtlasEdge } from './typedGraphModel';
const FLOOR = 0.18;
export function computeFocusScores(
  model: TypedGraphModel,
  seedIds: Set<string>,
  mountedIds: Set<string>,
  opts: { maxDist?: number } = {},
  hooks?: { _onEdgeVisit?: (e: AtlasEdge) => void } // test instrumentation, optional
): Map<string, number> {
  const maxDist = opts.maxDist ?? 4;
  if (seedIds.size === 0) return new Map([...mountedIds].map(id => [id, 1] as [string, number])); // all → 1
  const dist = new Map<string, number>();
  const q: string[] = [];
  for (const s of seedIds) {
    if (!mountedIds.has(s)) continue; // seed outside mount → ignored
    dist.set(s, 0); q.push(s);
  }
  // Build an adjacency restricted to mountedIds (only edges where BOTH endpoints ∈ mountedIds).
  // The _onEdgeVisit hook fires ONLY for edges the implementation actually traverses (i.e. mounted
  // edges) — placing it BEFORE the mounted check would over-count and break the F4/PERF-004 test
  // (999 visits on a 1000-node model instead of ≤ 9). The 1000-node test asserts this.
  const adj = new Map<string, string[]>();
  for (const e of model.edges) {
    if (!mountedIds.has(e.source) || !mountedIds.has(e.target)) continue;
    hooks?._onEdgeVisit?.(e);
    (adj.get(e.source) ?? adj.set(e.source, []).get(e.source)!).push(e.target);
    (adj.get(e.target) ?? adj.set(e.target, []).get(e.target)!).push(e.source);
  }
  while (q.length) {
    const cur = q.shift()!;
    const d = dist.get(cur)!;
    if (d >= maxDist) continue;
    for (const next of adj.get(cur) ?? []) {
      if (!dist.has(next)) { dist.set(next, d + 1); q.push(next); }
    }
  }
  const scores = new Map<string, number>();
  for (const id of mountedIds) {
    const d = dist.get(id);
    scores.set(id, d == null ? FLOOR : Math.max(FLOOR, 1 - d / maxDist));
  }
  return scores;
}
