import React, { useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  type NodeTypes,
  type NodeProps,
} from 'reactflow';
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
      {data.label}
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
  onSelect: (id: string) => void;
}

const COLS = 10;
const COL_GAP = 160;
const ROW_GAP = 80;

export function GraphCanvas({ model, mountedIds, matchScores, onSelect }: GraphCanvasProps) {
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: { id: string }) => {
      onSelect(node.id);
    },
    [onSelect],
  );

  const rfNodes = model.nodes
    .filter((n) => mountedIds.has(n.id))
    .map((n, idx) => ({
      id: n.id,
      type: 'custom' as const,
      position: {
        x: (idx % COLS) * COL_GAP,
        y: Math.floor(idx / COLS) * ROW_GAP,
      },
      data: {
        id: n.id,
        label: n.label,
        role: n.role,
        opacity: matchScores.get(n.id) ?? 1,
        onSelect,
      },
    }));

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: '100%', minHeight: 600 }}>
        <ReactFlow
          nodes={rfNodes}
          edges={[]}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
        />
      </div>
    </ReactFlowProvider>
  );
}
