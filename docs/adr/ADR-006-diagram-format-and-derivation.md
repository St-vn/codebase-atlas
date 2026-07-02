# ADR-006: Use Mermaid for C4 + sequence diagrams, derived from graph.json (graphify callflow reuse deferred)

**Date:** 2026-07-01
**Status:** Accepted

## Context

Phase 4 (SPEC §8 P4) delivers the right-pane **structure** (C4 container) and **behavior**
(sequence/flow) representations. SPEC §4 is load-bearing: the right pane **switches
representation** to sidestep the graph-region overlap problem — a sequence is a PATH (threads
through overlap), a C4 draws a boundary and **labels cross-boundary deps as external arrows**
(names the leaks, never hides them). SPEC §8 adds "reuse graphify callflow where useful."

Four constraints collide:
1. The diagram must render **in the right pane of a React app** (USABILITY-003) — it lives
   in the browser, beside the graph canvas, themed to DESIGN-SYSTEM (dark OLED).
2. The pipeline must be **token-free** (SPEC §8b) — no LLM in derivation. P4 has no cost
   NFR; the token-free property is asserted by reference to SPEC §8b per
   `docs/CROSS-PHASE-CONTRACT.md` §1 (COST-003 decision: drop the NFR ID).
3. The derivation must be **pure Core** (hexagonal boundary, ADR-001 spirit) — testable without
   a renderer, swappable format.
4. graphify's callflow output, per the SPEC §1 investigation, is **HTML** (a vis-network
   f-string template), not structured data — there is no clean JSON seam to consume.

## Decision

Use **Mermaid** as the diagram format for both C4 container and sequence/flow. Derive both
**from `graph.json` + NodeTyper output** via pure Core functions (`C4Derivation`,
`SequenceDerivation`). **Defer** graphify callflow reuse: re-derive sequence from `graph.json`
call edges now. `CallflowAdapter` is a future alternative INPUT that, if a future graphify
version exposes structured callflow JSON, would REPLACE the `graph.json` derivation path
entirely (it would become a new `SequenceDiagram` source) — it does NOT enrich
`SequenceDerivation` and it is not a derivation-input seam (downgraded per
`docs/CROSS-PHASE-CONTRACT.md` §19).

Renderers (`C4DiagramRenderer`, `SequenceDiagramRenderer`) are the sole Mermaid touchpoints —
output adapters, never imported by Core. Mermaid is a runtime dependency of the output adapters
only. The Core/Mermaid boundary is enforced by an AST-based import check (ts-morph or a
regex targeting `import.*from.*mermaid`, excluding comments) — not a brittle substring scan.

## Options considered

| Option | Pros | Cons |
| :--- | :--- | :--- |
| **Mermaid + derive from graph.json** (chosen) | Renders in-browser, no server; themeable to DESIGN-SYSTEM via themeVariables + classDef; text-based (diffable, testable); derivation is pure Core, format-swappable; token-free; no coupling to graphify's HTML callflow | Mermaid parse cost scales with diagram size (needs PERF-005 LOD caps); C4 is not a first-class Mermaid shape (rendered as flowchart subgraphs — adequate for one bounded level) |
| Mermaid + consume graphify callflow data | Reuses graphify's callflow work directly | graphify v0.9.4 emits callflow as HTML only — no structured data to consume; would require parsing HTML or forking graphify; couples P4 to graphify's callflow format |
| Graphviz/dot instead of Mermaid | Mature layout, strong for directed graphs | Renders to SVG/PNG, not a live React component; theming to DESIGN-SYSTEM is harder; heavier pipeline (needs viz.js/wasm in-browser); less diffable source |
| Hand-rolled SVG | Full control of layout + theme | Reimplements sequence + C4 layout from scratch; high effort (~weeks not days); violates MVP-tier "do not over-engineer"; no community layout algorithms |

## Consequences

**Positive:**
- Mermaid renders in-browser with one dependency; themed to dark OLED (USABILITY-003).
- Derivation is pure Core on `TypedGraphModel` — testable with Vitest, no Mermaid in tests.
  Format is swappable (Graphviz later) without touching Core — mirrors the ADR-001 hedge.
  The Core/Mermaid boundary is locked by an AST-based import check (plan Task 9).
- Token-free (SPEC §8b): deterministic graph traversal, no LLM.
- The §4 honesty property is structural: `C4Diagram.crossBoundaryDeps` is a first-class field;
  the renderer MUST emit each as a labeled external arrow — testable as a data invariant.
  A K-edge test (plan Task 2) locks the honesty property: `deriveC4` returns exactly K
  `CrossBoundaryDep` entries for K cross-boundary edges, and the rendered Mermaid contains
  exactly K dashed external arrows with the K distinct labels. A negative test mutates the
  diagram by removing one dep and asserts the render-side test fails.
- `CallflowAdapter` stays available as a future alternative input — it would REPLACE the
  `graph.json` derivation path, not enrich it. No current code depends on this contract.

**Negative / tradeoffs accepted:**
- Mermaid C4 is flowchart-subgraph-based, not a native C4 shape — fine for ONE bounded level
  per cluster (which is all SPEC §4 asks; deeper drill-down is explicitly out of scope).
- PERF-005 requires LOD caps (container-cap, path-length-cap) in derivation; without them a
  200-container diagram janks the pane. Caps are tunable, calibrated in `/implement`.
  Honesty preserved: LOD caps containers visually only — `crossBoundaryDeps` is never
  LOD-truncated.
- We add Mermaid as a dependency (render-only, output adapters). Widely used, MIT-licensed,
  Vite-compatible.

**Risks:**
- Mermaid theme parity with DESIGN-SYSTEM is imperfect (Mermaid's themeVariables don't map 1:1
  to every token). Mitigation: `classDef` for role colors; verify contrast in USABILITY-003
  test (each role color >= 3:1 against `#0F172A`).
- If graphify later exposes structured callflow richer than `graph.json` call edges, we
  re-evaluate the `CallflowAdapter` — but P4 ships without it.

## Reversal cost: Low to Medium (bounded by the Core/adapter boundary)

Swapping Mermaid for Graphviz (or hand-rolled SVG) is a renderer-level change: replace
`C4DiagramRenderer` + `SequenceDiagramRenderer` (output adapters). Core derivation
(`C4Derivation`, `SequenceDerivation`) and the `C4Diagram`/`SequenceDiagram` data types are
untouched — they are pure data, renderer-agnostic. Keep the boundary clean and reversal stays
cheap; couple Core to Mermaid and it becomes the rewrite the hexagon was built to avoid.

**Revisit when:** graphify exposes structured callflow JSON (→ `CallflowAdapter` replaces
the `graph.json` derivation path entirely — it is a new `SequenceDiagram` source, NOT an
enrichment of `SequenceDerivation`), OR Mermaid render latency exceeds PERF-005 even with
LOD caps (→ evaluate Graphviz/viz.js or a canvas renderer, keeping Core + the diagram
data types).
