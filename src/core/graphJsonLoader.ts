export interface RawNode {
  id: string;
  label: string;
  source_file: string;
  source_location: string | null;
  community: number;
}

export interface RawEdge {
  source: string;
  target: string;
  relation: string;
}

export interface RawGraph {
  nodes: RawNode[];
  edges: RawEdge[];
}

export function loadGraphJson(json: any): RawGraph {
  if (!json || !Array.isArray(json.nodes)) {
    throw new Error('Invalid graph.json: missing nodes');
  }

  const nodes: RawNode[] = json.nodes.map((n: any) => ({
    id: n.id,
    label: n.label,
    source_file: n.source_file,
    source_location: n.source_location ?? null,
    community: n.community,
  }));

  const rawEdges: any[] = Array.isArray(json.links)
    ? json.links
    : Array.isArray(json.edges)
      ? json.edges
      : [];

  const edges: RawEdge[] = rawEdges.map((e: any) => ({
    source: e.source,
    target: e.target,
    relation: e.relation,
  }));

  return { nodes, edges };
}
