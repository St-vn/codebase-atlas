import type { ReactNode } from 'react';

interface ShellProps {
  canvasChildren?: ReactNode;
  paneChildren?: ReactNode;
}

export function Shell({ canvasChildren, paneChildren }: ShellProps) {
  return (
    <div className="flex flex-row min-h-dvh bg-background text-foreground">
      <div
        data-testid="graph-canvas"
        className="flex-1 overflow-hidden"
      >
        {canvasChildren}
      </div>

      <div
        data-testid="detail-pane"
        className="w-[360px] shrink-0 bg-card border-l border-border overflow-auto"
      >
        {paneChildren ?? (
          <p className="text-muted-foreground text-sm font-sans p-4 m-0">
            Click a node to inspect
          </p>
        )}
      </div>
    </div>
  );
}
