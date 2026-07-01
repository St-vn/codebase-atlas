import { useState, useMemo } from 'react';
import { loadGraphJson } from './core/graphJsonLoader';
import { buildModel } from './core/typedGraphModel';
import { mountSet } from './core/viewportPolicy';
import { Shell } from './components/Shell';
import { GraphCanvas } from './components/GraphCanvas';
import { SearchBar } from './components/SearchBar';
import { DetailPane } from './components/DetailPane';

interface AppProps {
  initialGraph?: unknown;
}

export default function App({ initialGraph }: AppProps) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [matchScores, setMatchScores] = useState<Map<string, number>>(new Map());

  const model = useMemo(() => {
    const raw = loadGraphJson(initialGraph ?? { nodes: [], edges: [] });
    return buildModel(raw);
  }, [initialGraph]);

  const mountedIds = useMemo(
    () => mountSet(model.nodes, model.edges, { focusId, cap: 200 }),
    [model, focusId],
  );

  return (
    <Shell
      canvasChildren={
        <>
          <SearchBar nodes={model.nodes} onScores={setMatchScores} />
          <GraphCanvas
            model={model}
            mountedIds={mountedIds}
            matchScores={matchScores}
            onSelect={setFocusId}
          />
        </>
      }
      paneChildren={
        <DetailPane model={model} focusId={focusId} onSelect={setFocusId} />
      }
    />
  );
}
