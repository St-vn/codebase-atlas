import type { RawGraph } from './graphJsonLoader';
import { computeDegrees } from './degree';
import { deriveRole } from './nodeTyper';
import type { NodeRole } from './nodeTyper';

export interface AtlasNode {
  id: string;
  label: string;
  sourceFile: string;
  sourceLocation: string | null;
  community: number;
  role: NodeRole;
  fanIn: number;
  fanOut: number;
}

export interface AtlasEdge {
  source: string;
  target: string;
  relation: string;
}

export interface TypedGraphModel {
  nodes: AtlasNode[];
  edges: AtlasEdge[];
}

export function buildModel(g: RawGraph): TypedGraphModel {
  const degrees = computeDegrees(g);

  const nodes: AtlasNode[] = g.nodes.map((rawNode) => {
    const { fanIn, fanOut } = degrees.get(rawNode.id) ?? { fanIn: 0, fanOut: 0 };

    const inheritsIn = g.edges.filter(
      (e) => e.relation === 'inherits' && e.target === rawNode.id,
    ).length;

    const hasContains = g.edges.some(
      (e) => e.relation === 'contains' && e.source === rawNode.id,
    );

    const isMethodTarget = g.edges.some(
      (e) => e.relation === 'method' && e.target === rawNode.id,
    );

    const role = deriveRole({ fanIn, fanOut, inheritsIn, hasContains, isMethodTarget });

    return {
      id: rawNode.id,
      label: rawNode.label,
      sourceFile: rawNode.source_file,
      sourceLocation: rawNode.source_location,
      community: rawNode.community,
      role,
      fanIn,
      fanOut,
    };
  });

  const edges: AtlasEdge[] = g.edges.map((e) => ({
    source: e.source,
    target: e.target,
    relation: e.relation,
  }));

  return { nodes, edges };
}
