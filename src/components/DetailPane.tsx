import type { TypedGraphModel } from '../core/typedGraphModel';
import type { BlastRadius } from '../adapters/blastRadiusClient';
import { Badge } from '@/components/ui/badge';

interface DetailPaneProps {
  model: TypedGraphModel;
  focusId: string | null;
  onSelect: (id: string) => void;
  blastRadius?: BlastRadius;
}

const ROLE_COLORS: Record<string, string> = {
  entry: 'bg-role-entry',
  module: 'bg-role-module',
  interface: 'bg-role-interface',
  method: 'bg-role-method',
  leaf: 'bg-role-leaf',
};

function getRoleDotClass(role: string): string {
  // role values: 'entry-point', 'module', 'interface', 'method', 'leaf'
  const key = role.replace('-point', '').split('-')[0];
  return ROLE_COLORS[key] ?? 'bg-muted-foreground';
}

export function DetailPane({ model, focusId, onSelect, blastRadius }: DetailPaneProps) {
  if (focusId === null) {
    return (
      <div className="bg-card border border-border rounded-md p-4 font-sans text-sm text-muted-foreground italic min-w-[240px]">
        Click a node to inspect it
      </div>
    );
  }

  const node = model.nodes.find((n) => n.id === focusId);
  if (!node) {
    return (
      <div className="bg-card border border-border rounded-md p-4 font-sans text-sm text-muted-foreground italic min-w-[240px]">
        Click a node to inspect it
      </div>
    );
  }

  const neighborIds = new Set<string>();
  for (const edge of model.edges) {
    if (edge.source === focusId) neighborIds.add(edge.target);
    if (edge.target === focusId) neighborIds.add(edge.source);
  }
  const neighbors = model.nodes.filter((n) => neighborIds.has(n.id));

  return (
    <div className="bg-card border border-border rounded-md p-4 font-mono text-sm text-foreground min-w-[240px]">
      {/* Node label */}
      <div className="text-base font-semibold text-foreground mb-2 font-mono">
        {node.label}
      </div>

      {/* Role badge */}
      <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
        <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${getRoleDotClass(node.role)}`} />
        <span>Role: {node.role}</span>
      </div>

      {/* File */}
      <div className="text-muted-foreground text-xs mb-1">
        File: {node.sourceFile}
      </div>

      {/* Location */}
      {node.sourceLocation && (
        <div className="text-muted-foreground text-xs mb-1">
          Location: {node.sourceLocation}
        </div>
      )}

      {/* Fan stats */}
      <div className="text-muted-foreground text-xs mb-1">
        Fan-in: {node.fanIn} / Fan-out: {node.fanOut}
      </div>

      {/* Neighbors */}
      {neighbors.length > 0 && (
        <div className="mt-3">
          <div className="text-muted-foreground text-[11px] uppercase tracking-widest mb-1.5">
            Neighbors ({neighbors.length})
          </div>
          <div className="flex flex-col gap-1">
            {neighbors.map((nb) => (
              <button
                key={nb.id}
                onClick={() => onSelect(nb.id)}
                className="
                  block w-full text-left
                  text-foreground font-mono text-[13px]
                  bg-background border border-border rounded
                  px-2 py-1
                  cursor-pointer
                  hover:bg-muted
                  transition-colors duration-150
                "
              >
                {nb.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Blast-radius section (F15 interim placement; moves to code tab in P3) */}
      {blastRadius && (
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-muted-foreground text-[11px] uppercase tracking-widest">
              Blast Radius
            </div>
            {blastRadius.source === 'mcp' ? (
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                MCP
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                graph fallback
              </Badge>
            )}
          </div>
          {blastRadius.impactedIds.length === 0 ? (
            <div className="text-muted-foreground text-xs italic">
              No upstream dependents
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {blastRadius.impactedIds.map((impactedId) => {
                const impactedNode = model.nodes.find((n) => n.id === impactedId);
                const label = impactedNode?.label ?? impactedId;
                return (
                  <button
                    key={impactedId}
                    onClick={() => onSelect(impactedId)}
                    className="
                      block w-full text-left
                      text-foreground font-mono text-[13px]
                      bg-background border border-border rounded
                      px-2 py-1
                      cursor-pointer
                      hover:bg-muted
                      transition-colors duration-150
                    "
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
