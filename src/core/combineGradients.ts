const FLOOR = 0.18;

export function combineGradients(...scores: Map<string, number>[]): Map<string, number> {
  if (scores.length === 0) return new Map();
  const ids = new Set<string>();
  for (const m of scores) for (const k of m.keys()) ids.add(k);
  const out = new Map<string, number>();
  for (const id of ids) {
    let p = 1;
    for (const m of scores) p *= (m.get(id) ?? 1);
    out.set(id, Math.max(FLOOR, p));
  }
  return out;
}
