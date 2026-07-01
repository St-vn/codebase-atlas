const FLOOR = 0.12;

export function matchScores(
  nodes: { id: string; label: string }[],
  query: string,
): Map<string, number> {
  const scores = new Map<string, number>();

  if (!query || !query.trim()) {
    for (const node of nodes) {
      scores.set(node.id, 1);
    }
    return scores;
  }

  const q = query.toLowerCase();

  for (const node of nodes) {
    const label = node.label.toLowerCase();
    let score: number;

    if (label === q) {
      score = 1.0;
    } else if (label.startsWith(q)) {
      score = 0.85;
    } else if (label.includes(q)) {
      score = 0.55;
    } else {
      score = FLOOR;
    }

    scores.set(node.id, score);
  }

  return scores;
}
