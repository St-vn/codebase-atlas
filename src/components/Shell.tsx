import type { ReactNode } from 'react';

interface ShellProps {
  canvasChildren?: ReactNode;
  paneChildren?: ReactNode;
}

const tokens = {
  background: '#0F172A',
  card: '#1E293B',
  border: '#475569',
  foreground: '#F8FAFC',
  mutedForeground: '#64748B',
} as const;

export function Shell({ canvasChildren, paneChildren }: ShellProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        minHeight: '100dvh',
        background: tokens.background,
        color: tokens.foreground,
      }}
    >
      <div
        data-testid="graph-canvas"
        style={{
          flex: 1,
          overflow: 'hidden',
        }}
      >
        {canvasChildren}
      </div>

      <div
        data-testid="detail-pane"
        style={{
          width: '360px',
          flexShrink: 0,
          background: tokens.card,
          borderLeft: `1px solid ${tokens.border}`,
          overflow: 'auto',
        }}
      >
        {paneChildren ?? (
          <p
            style={{
              color: tokens.mutedForeground,
              fontSize: '14px',
              padding: '16px',
              margin: 0,
              fontFamily: 'sans-serif',
            }}
          >
            Click a node to inspect
          </p>
        )}
      </div>
    </div>
  );
}
