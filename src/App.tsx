import { useState, useMemo } from 'react';
import { loadGraphJson } from './core/graphJsonLoader';
import { buildModel } from './core/typedGraphModel';
import { mountSet } from './core/viewportPolicy';
import { combineGradients } from './core/combineGradients';
import { useAtlasState, type AtlasMcpClient } from './state/useAtlasState';
import { Shell } from './components/Shell';
import { GraphCanvas } from './components/GraphCanvas';
import { SearchBar } from './components/SearchBar';
import { DetailPane } from './components/DetailPane';

interface AppProps {
  initialGraph?: unknown;
  mcp?: AtlasMcpClient;
}

export default function App({ initialGraph, mcp }: AppProps) {
  const [localMatchScores, setLocalMatchScores] = useState<Map<string, number>>(new Map());

  const model = useMemo(() => {
    const raw = loadGraphJson(initialGraph ?? { nodes: [], edges: [] });
    return buildModel(raw);
  }, [initialGraph]);

  const { view, select, selectCluster } = useAtlasState(model, { mcp });

  const mountedIds = useMemo(
    () => mountSet(model.nodes, model.edges, { focusId: view.focusId, cap: 200 }),
    [model, view.focusId],
  );

  // Combine search scores with focus scores for final opacity (floor enforced by combineGradients)
  const combinedOpacity = useMemo(
    () => combineGradients(localMatchScores, view.focusScores),
    [localMatchScores, view.focusScores],
  );

  // F16 (AVAIL-003): empty graph — no nodes, no canvas mount
  if (model.nodes.length === 0) {
    return (
      <Shell
        canvasChildren={
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}
          >
            <span>No nodes to display</span>
          </div>
        }
        paneChildren={
          <DetailPane model={model} focusId={null} onSelect={select} />
        }
      />
    );
  }

  return (
    <Shell
      canvasChildren={
        <>
          <SearchBar nodes={model.nodes} onScores={setLocalMatchScores} />
          <GraphCanvas
            model={model}
            mountedIds={mountedIds}
            matchScores={localMatchScores}
            combinedOpacity={combinedOpacity}
            blastRadius={view.blastRadius ?? undefined}
            onSelect={select}
            onSelectCluster={selectCluster}
          />
        </>
      }
      paneChildren={
        <DetailPane
          model={model}
          focusId={view.focusId}
          onSelect={select}
          blastRadius={view.blastRadius ?? undefined}
        />
      }
    />
  );
}
