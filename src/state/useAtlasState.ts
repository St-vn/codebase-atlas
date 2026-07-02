import { useState, useCallback } from 'react';
import type { TypedGraphModel } from '../core/typedGraphModel';
import { computeFocusScores } from '../core/focusPolicy';
import { combineGradients } from '../core/combineGradients';
import { matchScores } from '../core/searchScores';
import { mountSet } from '../core/viewportPolicy';
// Blast-radius goes THROUGH the adapter (ADR-003 / F13): state never touches MCP directly.
import { fetchBlastRadius, type BlastRadius, type McpClient } from '../adapters/blastRadiusClient';

/** MCP client interface (re-exported from the adapter). */
export type AtlasMcpClient = McpClient;

/** Blast-radius result (re-exported from the adapter). */
export type BlastRadiusResult = BlastRadius;

/** Discriminated union for the current selection. */
export type Selection =
  | { kind: 'node'; id: string }
  | { kind: 'cluster'; id: number };

/** Extended view state managed by this hook. */
export interface ViewState {
  focusId: string | null;
  focusSeedIds: Set<string>;
  focusScores: Map<string, number>;
  matchScores: Map<string, number>;
  combinedOpacity: Map<string, number>;
  blastRadius: BlastRadiusResult | null;
  selection: Selection | null;
  query: string;
}

const DEFAULT_CAP = 200;

/** Blast-radius fetch delegates entirely to the adapter (ADR-003: sole MCP touchpoint). */
function fetchBlast(
  nodeId: string,
  model: TypedGraphModel,
  mcp?: AtlasMcpClient,
): Promise<BlastRadiusResult> {
  return fetchBlastRadius(nodeId, { mcp, model });
}

function buildInitialView(model: TypedGraphModel): ViewState {
  const mountedIds = mountSet(model.nodes, model.edges, { focusId: null, cap: DEFAULT_CAP });
  const ms = matchScores(model.nodes, '');
  const fs = computeFocusScores(model, new Set(), mountedIds);
  const co = combineGradients(ms, fs);
  return {
    focusId: null,
    focusSeedIds: new Set(),
    focusScores: fs,
    matchScores: ms,
    combinedOpacity: co,
    blastRadius: null,
    selection: null,
    query: '',
  };
}

export interface UseAtlasStateOpts {
  mcp?: AtlasMcpClient;
}

export interface UseAtlasStateReturn {
  view: ViewState;
  select(id: string): void;
  selectCluster(seedIds: Set<string>): void;
  clearFocus(): void;
  setSearch(query: string): void;
}

export function useAtlasState(
  model: TypedGraphModel,
  opts: UseAtlasStateOpts,
): UseAtlasStateReturn {
  const [view, setView] = useState<ViewState>(() => buildInitialView(model));

  const select = useCallback((id: string) => {
    // Synchronous state update first.
    setView(prev => {
      const mountedIds = mountSet(model.nodes, model.edges, { focusId: id, cap: DEFAULT_CAP });
      const seedIds = new Set([id]);
      const fs = computeFocusScores(model, seedIds, mountedIds);
      const co = combineGradients(prev.matchScores, fs);
      return {
        ...prev,
        focusId: id,
        focusSeedIds: seedIds,
        focusScores: fs,
        combinedOpacity: co,
        selection: { kind: 'node', id },
      };
    });

    // Async blast-radius fetch — update separately.
    fetchBlast(id, model, opts.mcp).then(br => {
      setView(prev => ({ ...prev, blastRadius: br }));
    }).catch(() => {/* ignore */});
  }, [model, opts.mcp]);

  const selectCluster = useCallback((seedIds: Set<string>) => {
    const firstSeed = seedIds.values().next().value as string;
    const firstNode = model.nodes.find(n => n.id === firstSeed);
    const communityId = firstNode?.community ?? 0;

    setView(prev => {
      const mountedIds = mountSet(model.nodes, model.edges, { focusId: firstSeed, cap: DEFAULT_CAP });
      const fs = computeFocusScores(model, seedIds, mountedIds);
      const co = combineGradients(prev.matchScores, fs);
      return {
        ...prev,
        focusId: firstSeed,
        focusSeedIds: new Set(seedIds),
        focusScores: fs,
        combinedOpacity: co,
        selection: { kind: 'cluster', id: communityId },
      };
    });
  }, [model]);

  const clearFocus = useCallback(() => {
    setView(prev => {
      const mountedIds = mountSet(model.nodes, model.edges, { focusId: null, cap: DEFAULT_CAP });
      const fs = computeFocusScores(model, new Set(), mountedIds);
      const co = combineGradients(prev.matchScores, fs);
      return {
        ...prev,
        focusId: null,
        focusSeedIds: new Set(),
        focusScores: fs,
        combinedOpacity: co,
        blastRadius: null,
        selection: null,
      };
    });
  }, [model]);

  const setSearch = useCallback((query: string) => {
    setView(prev => {
      const ms = matchScores(model.nodes, query);
      const co = combineGradients(ms, prev.focusScores);
      return { ...prev, query, matchScores: ms, combinedOpacity: co };
    });
  }, [model]);

  return { view, select, selectCluster, clearFocus, setSearch };
}
