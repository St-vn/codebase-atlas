# ADR-001: Use React Flow with a culling-first architecture for the graph canvas

**Date:** 2026-07-01
**Status:** Accepted

## Context

Codebase Atlas renders graphify's `graph.json` as an interactive graph. Two requirements
collide: **USABILITY-001** demands a clean, React-app-quality UI with a design system
(shadcn/ui), custom typed node cards, and a detail pane — which lives in HTML/React. **SCALE-001**
(load-bearing) demands the graph stay interactive from ~150 nodes (httpx) up to 1000+
(full-repo scans), with virtualization required from the start because retrofitting it is a
render-layer rewrite. DOM/SVG renderers are pretty but strain at scale; WebGL/canvas
renderers scale but render nodes as pixels, unable to host shadcn components inside a node.
A naive choice fails one requirement or the other.

## Decision

We will use **React Flow** for the graph canvas, built from P1 on a **culling-first
architecture**: the full node set lives in the data model but is **never mounted raw**. The
renderer only ever mounts the focused neighborhood (viewport culling + `onlyRenderVisibleElements`
+ level-of-detail cluster collapse). Gradient search and focus+context update node **data/style
props**, never remount the graph.

## Options considered

| Option | Pros | Cons |
| :--- | :--- | :--- |
| **React Flow** (chosen) | Native custom HTML/React nodes; shadcn drops into nodes and pane; excellent DX; React-native state | SVG/DOM-based — janks if the full 1000+ node set is mounted; requires a hard "never mount everything" discipline |
| Sigma.js | WebGL, handles 10k+ nodes effortlessly | Nodes are WebGL primitives — cannot host shadcn cards; custom styling via shaders; needs a React wrapper; clean-UI-in-nodes impossible |
| react-force-graph | Canvas/WebGL, scales to thousands | Nodes are canvas draw calls, not components; limited clean-UI control; force layout less suited to a curated map |
| Cytoscape.js | Mature, canvas, scales well | Styling via its own stylesheet language, not shadcn; heavier custom-node work; wrapper needed |

## Consequences

**Positive:**
- Clean UI (USABILITY-001) is native — shadcn nodes + pane, no fighting the renderer.
- SCALE-001 is satisfied by **capping mounted nodes**, which the atlas's own focus+context
  philosophy already requires (it forbids the full-node hairball — the useless view already
  rejected in design). The scaling strategy and the UX philosophy are the same mechanism.
- Reversal is **bounded**: the P0 adapter (`graph.json` → typed data model) decouples the
  data model from the renderer. If React Flow's canvas is ever insufficient, only the
  graph-canvas component swaps to a WebGL renderer while React nodes/pane/search stay.

**Negative / tradeoffs accepted:**
- A hard architectural invariant — **"never mount the full node set"** — must be enforced
  and TESTED from P1, not left as a convention.
- Search/focus MUST update node data (style props), never trigger a full remount — an
  invariant on the update path.
- We give up the ability to render a true 5000-node zoomed-out overview hairball. This is
  intentional; that view was already rejected as useless for comprehension.

**Risks:**
- If the invariant is violated (someone renders all nodes), it janks — so it needs a test
  guard, not just discipline.
- If a focused neighborhood legitimately exceeds ~300 mounted nodes, LOD/clustering must
  kick in; if it doesn't, perf degrades before the WebGL escape hatch is needed.

## Reversal cost: Medium (bounded by the adapter boundary)

Swapping the graph-canvas component for a WebGL renderer (Sigma/react-force-graph) is a
component-level change, not a rewrite, **because** the P0 adapter isolates the typed data
model from the renderer. Keep that boundary clean and the reversal stays cheap. Couple UI to
the renderer and it becomes the rewrite SCALE-001 warned about — so the boundary itself is
the hedge.

**Revisit when:** a real target's focused neighborhood routinely exceeds ~300 mounted nodes
and janks (→ add LOD/clustering first), OR users genuinely need a zoomed-out full-graph
overview (→ evaluate a WebGL canvas layer, keeping the React UI).
