export interface MountOpts {
  focusId: string | null;
  cap: number;
}

/**
 * SCALE-001: Never mount more than `cap` nodes.
 *
 * If focusId is given, BFS from focus over undirected adjacency built from edges,
 * collecting node ids until size === cap. If BFS exhausts before cap, fill with
 * remaining nodes up to cap.
 *
 * If no focus, take the first `cap` node ids.
 *
 * Always returns a Set with size <= cap.
 */
export function mountSet(
  nodes: { id: string }[],
  edges: { source: string; target: string }[],
  opts: MountOpts,
): Set<string> {
  const { focusId, cap } = opts;
  const result = new Set<string>();

  if (focusId === null) {
    for (const node of nodes) {
      if (result.size >= cap) break;
      result.add(node.id);
    }
    return result;
  }

  // Build undirected adjacency map from edges
  const adj = new Map<string, string[]>();
  for (const edge of edges) {
    if (!adj.has(edge.source)) adj.set(edge.source, []);
    if (!adj.has(edge.target)) adj.set(edge.target, []);
    adj.get(edge.source)!.push(edge.target);
    adj.get(edge.target)!.push(edge.source);
  }

  // BFS from focus
  const queue: string[] = [focusId];
  const visited = new Set<string>([focusId]);

  while (queue.length > 0 && result.size < cap) {
    const current = queue.shift()!;
    result.add(current);

    if (result.size >= cap) break;

    const neighbors = adj.get(current) ?? [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  // Fill remaining capacity with nodes not yet in the set
  if (result.size < cap) {
    for (const node of nodes) {
      if (result.size >= cap) break;
      if (!result.has(node.id)) {
        result.add(node.id);
      }
    }
  }

  return result;
}
