import type { ReactNode } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShellProps {
  canvasChildren?: ReactNode;
  paneChildren?: ReactNode;
  paneOpen?: boolean;
  onTogglePane?: () => void;
}

/** Mirrors shadcn Button variant="ghost" size="icon" without importing the ui component. */
function GhostIconButton({
  onClick,
  'aria-label': ariaLabel,
  children,
}: {
  onClick?: () => void;
  'aria-label'?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-transparent',
        'text-sm font-medium whitespace-nowrap transition-all outline-none select-none',
        'hover:bg-accent focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
      )}
    >
      {children}
    </button>
  );
}

export function Shell({
  canvasChildren,
  paneChildren,
  paneOpen = true,
  onTogglePane = () => {},
}: ShellProps) {
  return (
    <div className="flex flex-row min-h-dvh bg-background text-foreground">
      <div
        data-testid="graph-canvas"
        className="flex-1 overflow-hidden relative"
      >
        {canvasChildren}
      </div>

      <aside
        data-testid="detail-pane"
        className={cn(
          'shrink-0 bg-card border-l border-border transition-[width]',
          paneOpen ? 'w-[360px] flex flex-col' : 'w-10',
        )}
      >
        {paneOpen ? (
          <>
            <div className="flex items-center justify-end p-1">
              <GhostIconButton onClick={onTogglePane} aria-label="Collapse pane">
                <PanelRightClose />
              </GhostIconButton>
            </div>
            {paneChildren}
          </>
        ) : (
          <div className="flex items-center justify-center pt-1">
            <GhostIconButton onClick={onTogglePane} aria-label="Expand pane">
              <PanelRightOpen />
            </GhostIconButton>
          </div>
        )}
      </aside>
    </div>
  );
}
