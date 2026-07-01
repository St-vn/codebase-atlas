export type NodeRole = 'entry-point' | 'module' | 'interface' | 'method' | 'leaf';

export interface RoleSignals {
  fanIn: number;
  fanOut: number;
  inheritsIn: number;
  hasContains: boolean;
  isMethodTarget: boolean;
}

export function deriveRole(s: RoleSignals): NodeRole {
  if (s.inheritsIn >= 3) return 'interface';
  if (s.hasContains) return 'module';
  if (s.isMethodTarget) return 'method';
  if (s.fanIn === 0) return 'leaf';
  if (s.fanIn >= 4 && s.fanOut <= 2) return 'entry-point';
  return 'leaf';
}
