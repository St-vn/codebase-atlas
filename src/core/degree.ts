import type { RawGraph } from './graphJsonLoader';

export function computeDegrees(
  g: RawGraph,
): Map<string, { fanIn: number; fanOut: number }> {
  const map = new Map<string, { fanIn: number; fanOut: number }>();

  for (const node of g.nodes) {
    map.set(node.id, { fanIn: 0, fanOut: 0 });
  }

  for (const edge of g.edges) {
    const src = map.get(edge.source);
    if (src) src.fanOut += 1;

    const tgt = map.get(edge.target);
    if (tgt) tgt.fanIn += 1;
  }

  return map;
}
