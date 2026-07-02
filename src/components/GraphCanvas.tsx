import React, { useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Handle,
  Position,
  type NodeTypes,
  type NodeProps,
  type Edge,
} from 'reactflow';
import dagre from 'dagre';
import type { TypedGraphModel } from '../core/typedGraphModel';
import type { NodeRole } from '../core/nodeTyper';

const ROLE_COLORS: Record<NodeRole, string> = {
  'entry-point': '#E69F00',
  'module': '#56B4E9',
  'interface': '#009E73',
  'method': '#CC79A7',
  'leaf': '#94A3B8',
};

interface CustomNodeData {
  id: string;
  label: string;
  role: NodeRole;
  opacity: number;
  onSelect: (id: string) => void;
}

function CustomNode({ data }: NodeProps<CustomNodeData>) {
  return (
    <div
      data-testid={`rf-node-${data.id}`}
      style={{
        background: ROLE_COLORS[data.role] ?? '#94A3B8',
        opacity: data.opacity,
        padding: '6px 10px',
        borderRadius: 4,
        fontSize: 12,
        color: '#fff',
        cursor: 'pointer',
        minWidth: 80,
        textAlign: 'center',
      }}
      onClick={() => data.onSelect(data.id)}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      {data.label}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

interface GraphCanvasProps {
  model: TypedGraphModel;
  mountedIds: Set<string>;
  matchScores: Map<string, number>;
  combinedOpacity?: Map<string, number>;
  onSelect: (id: string) => void;
}

const NODE_WIDTH = 120;
const NODE_HEIGHT = 40;
const COLS = 10;
const COL_GAP = 160;
const ROW_GAP = 80;

function computeDagreLayout(
  nodeIds: string[],
  edges: Array<{ source: string; target: string }>,
): Map<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 40, ranksep: 80 });
  g.setDefaultEdgeLabel(() => ({}));
  nodeIds.forEach((id) => g.setNode(id, { width: NODE_WIDTH, height: NODE_HEIGHT }));
  edges.forEach((e) => g.setEdge(e.source, e.target));
  dagre.layout(g);
  return new Map(
    nodeIds.map((id) => {
      const p = g.node(id);
      return [id, { x: p.x, y: p.y }];
    }),
  );
}

export function GraphCanvas({ model, mountedIds, matchScores, combinedOpacity, onSelect }: GraphCanvasProps) {
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: { id: string }) => {
      onSelect(node.id);
    },
    [onSelect],
  );

  // Build edges where both endpoints are mounted
  const rfEdges: Edge[] = model.edges
    .filter((e) => mountedIds.has(e.source) && mountedIds.has(e.target))
    .map((e, idx) => ({
      id: `e-${e.source}-${e.target}-${idx}`,
      source: e.source,
      target: e.target,
      style: { stroke: '#475569', strokeWidth: 1 },
    }));

  // Compute dagre positions for mounted nodes
  const mountedNodeIds = model.nodes
    .filter((n) => mountedIds.has(n.id))
    .map((n) => n.id);

  const dagrePositions = computeDagreLayout(mountedNodeIds, rfEdges);

  const rfNodes = model.nodes
    .filter((n) => mountedIds.has(n.id))
    .map((n, idx) => {
      const pos = dagrePositions.get(n.id);
      const position = pos
        ? { x: pos.x, y: pos.y }
        : { x: (idx % COLS) * COL_GAP, y: Math.floor(idx / COLS) * ROW_GAP };
      return {
        id: n.id,
        type: 'custom' as const,
        position,
        data: {
          id: n.id,
          label: n.label,
          role: n.role,
          opacity: combinedOpacity?.get(n.id) ?? matchScores.get(n.id) ?? 1,
          onSelect,
        },
      };
    });

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: '100%', minHeight: 600 }}>
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
        />
      </div>
    </ReactFlowProvider>
  );
}
