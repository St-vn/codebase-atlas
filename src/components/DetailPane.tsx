import type { TypedGraphModel } from '../core/typedGraphModel';

interface DetailPaneProps {
  model: TypedGraphModel;
  focusId: string | null;
  onSelect: (id: string) => void;
}

const TOKENS = {
  bg: '#1E293B',
  text: '#F8FAFC',
  border: '#475569',
  mutedText: '#94A3B8',
  neighborBg: '#0F172A',
  neighborHover: '#334155',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: TOKENS.bg,
  color: TOKENS.text,
  border: `1px solid ${TOKENS.border}`,
  borderRadius: '8px',
  padding: '16px',
  fontFamily: 'monospace',
  fontSize: '14px',
  minWidth: '240px',
};

const labelStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 'bold',
  marginBottom: '8px',
  color: TOKENS.text,
};

const metaRowStyle: React.CSSProperties = {
  color: TOKENS.mutedText,
  marginBottom: '4px',
  fontSize: '12px',
};

const sectionTitleStyle: React.CSSProperties = {
  color: TOKENS.mutedText,
  fontSize: '11px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginTop: '12px',
  marginBottom: '6px',
};

const neighborButtonStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  backgroundColor: TOKENS.neighborBg,
  color: TOKENS.text,
  border: `1px solid ${TOKENS.border}`,
  borderRadius: '4px',
  padding: '6px 10px',
  marginBottom: '4px',
  cursor: 'pointer',
  fontSize: '13px',
  fontFamily: 'monospace',
};

const hintStyle: React.CSSProperties = {
  ...cardStyle,
  color: TOKENS.mutedText,
  fontStyle: 'italic',
};

export function DetailPane({ model, focusId, onSelect }: DetailPaneProps) {
  if (focusId === null) {
    return <div style={hintStyle}>Click a node to inspect it</div>;
  }

  const node = model.nodes.find((n) => n.id === focusId);
  if (!node) {
    return <div style={hintStyle}>Click a node to inspect it</div>;
  }

  const neighborIds = new Set<string>();
  for (const edge of model.edges) {
    if (edge.source === focusId) neighborIds.add(edge.target);
    if (edge.target === focusId) neighborIds.add(edge.source);
  }
  const neighbors = model.nodes.filter((n) => neighborIds.has(n.id));

  return (
    <div style={cardStyle}>
      <div style={labelStyle}>{node.label}</div>
      <div style={metaRowStyle}>Role: {node.role}</div>
      <div style={metaRowStyle}>File: {node.sourceFile}</div>
      {node.sourceLocation && (
        <div style={metaRowStyle}>Location: {node.sourceLocation}</div>
      )}
      <div style={metaRowStyle}>Fan-in: {node.fanIn} / Fan-out: {node.fanOut}</div>

      {neighbors.length > 0 && (
        <>
          <div style={sectionTitleStyle}>Neighbors ({neighbors.length})</div>
          {neighbors.map((nb) => (
            <button
              key={nb.id}
              style={neighborButtonStyle}
              onClick={() => onSelect(nb.id)}
            >
              {nb.label}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
