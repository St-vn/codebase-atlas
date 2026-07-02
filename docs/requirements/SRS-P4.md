---
type: requirements
tags: [docs-internal, requirements, codebase-atlas]
date_updated: 2026-07-01
status: spec-draft
phase: P4
---

# Codebase Atlas — SRS (Phase 4: Representation Switch)

Produced via sdlc-engineer `/spec` (MVP tier). Scoped to P4 — the right-pane **behavior** and
**structure** representation tabs. Extends the MVP SRS (`docs/requirements/SRS.md`, P0+P1).
See `docs/SPEC.md` §3 (architecture), §4 (the overlap sidestep — LOAD-BEARING for P4), §8 P4.

## 1. Purpose & scope

P4 delivers two of the four right-pane representations from SPEC §3:
- **structure → C4 container** for a selected cluster/subsystem (honest bounded, cross-deps
  labeled — the §4 honesty property).
- **behavior → sequence/flow** for a behavior path (a PATH start→end, threads through overlap
  without cutting it).

Both render as **Mermaid** in the right pane (NOT React Flow — React Flow stays the sole graph
renderer per ADR-001). Both are **derived from the typed graph** (`graph.json` + NodeTyper
output) — token-free (SPEC §8b).

Out of scope this SRS: **reasons** tab (P3), **code** tab (partly P2 blast-radius). P4
coordinates with P3 on the shared right-pane tab model (see §7).

## 2. Actors

Reuse MVP actors (`docs/requirements/SRS.md` §2): Maintainer, Developer. No new actors. The
Agent (LLM) consumer remains deferred past MVP.

## 3. User stories (P4)

INVEST-checked. Canonical IDs per `docs/CROSS-PHASE-CONTRACT.md` §1: P4 owns **US-015,
US-016, US-017** (sequential, no gaps, no collisions). US-014 belongs to P3 (decision-doc
sourcing) and is NOT reused.

- **US-015** — View a C4 container diagram for a selected cluster/subsystem.
  The developer selects a cluster (community) or subsystem node; the right pane **structure**
  tab renders a C4 container diagram (Mermaid) with the boundary drawn and member containers
  inside.
- **US-016** — View a sequence/flow diagram for a behavior path.
  The developer selects an entry-point node (or any node with a call path); the right pane
  **behavior** tab renders a sequence/flow diagram (Mermaid) tracing the call path start→end.
- **US-017** — Cross-boundary dependencies are shown, not hidden (THE §4 HONESTY PROPERTY).
  When a C4 diagram is rendered for a cluster, dependencies crossing the cluster boundary
  appear as **explicit labeled external arrows** naming the leak (target + relation), not
  omitted or silently absorbed.

## 4. Acceptance criteria (Gherkin)

See `docs/requirements/acceptance-criteria-P4.md` (US-015, US-016, US-017). US-017 has a
dedicated scenario asserting cross-boundary deps are labeled external arrows.

## 5. Non-functional requirements

Canonical IDs per `docs/CROSS-PHASE-CONTRACT.md` §1. P4 owns **PERF-005** and
**USABILITY-003**. P4 has no cost NFR — the token-free property is asserted by reference
to SPEC §8b in prose (see §6 below).

| ID | Category | Requirement |
|---|---|---|
| PERF-005 | Performance | Mermaid render of a ≤50-node subsystem C4 or sequence diagram completes < 300ms p95 (derive + emit) on a typical dev laptop. Larger subsystems degrade gracefully (LOD/cap), never hang. |
| USABILITY-003 | Usability | Diagrams are readable: no hairball, follow DESIGN-SYSTEM (dark OLED), Mermaid theme maps to design tokens, role colors via classDef (Okabe-Ito), and each role color has WCAG contrast ratio >= 3:1 against the dark background `#0F172A`. Cross-boundary arrows visually distinct from in-boundary edges. |

### 5.1 PERF-005 — diagram render latency (load-bearing for large subsystems)

The right pane must stay responsive when a developer selects a large cluster. A naive Mermaid
render of a 200-container C4 diagram janks the pane. Strategy:
- **Derivation caps the diagram**: C4Derivation emits at most N containers per boundary
  (`maxContainers` opt, default 50; LOD — collapse the rest into a single "...and K more"
  container); SequenceDerivation caps the path length (truncate with a labeled "...continues"
  step, set `truncated`).
- **Honesty preserved under LOD**: LOD collapses containers VISUALLY only — the data-layer
  `crossBoundaryDeps` list is NEVER truncated or hidden regardless of cap (§4 honesty property
  is structural, see `US-017`).
- **Render is async**: derivation (pure, fast) runs synchronously; Mermaid parse+render is
  queued so the pane never blocks the graph canvas.
- Acceptance target: ≤50-node subsystem < 300ms; larger subsystems cap + degrade, never hang.

## 6. Constraints & dependencies

- **Depends on P1** (shipped): `TypedGraphModel`, `AtlasNode` (`community`, `role`), `AtlasEdge`
  (`relation`), `NodeTyper`. P4 derives from these — no new extraction.
- **Depends on P2 US-010** (cluster-focus gesture, `docs/CROSS-PHASE-CONTRACT.md` §12, §18):
  P4 consumes P2's `view.selection.kind === 'cluster'` (a discriminated union field on P2's
  `ViewState.view.selection`) produced by P2's shift-click multiple-nodes gesture. P4 does
  **not** read `SelectionState.focusSeedIds` directly; it goes through P2's `view.selection`
  discriminator. P4 has no task that builds cluster-selection UX — the shift-click selection
  mechanism is P2's job. If P2 lands first, P4 reads `view.selection.kind === 'cluster'`
  from P2's `ViewState`; if P4 lands first, it stubs the consumer until P2 ships.
- **Coordinates with P3** on the **right-pane tab model** (behavior/structure/reasons/code)
  — see §7. P3 owns the tab chrome (`PaneTabs` + `TabId`); P4 owns the `behavior` and
  `structure` tab CONTENT (see §7 + ADR-006).
- **Mermaid** is the diagram format (ADR-006). Renders in-browser; no server.
- **graphify callflow** (SPEC §8 "reuse where useful"): investigated in ADR-006. graphify
  emits callflow as **HTML** (SPEC §1 investigation), not structured data. Decision: re-derive
  sequence from `graph.json` call edges. `CallflowAdapter` is a future alternative input that
  would replace the `graph.json` derivation path entirely (not a seam that enriches
  `SequenceDerivation`; see ADR-006 Consequences and the contract §19 downgrade).
- **Token cost = FREE per SPEC §8b.** P4's pipeline is pure deterministic graph traversal
  + Mermaid render; no LLM in derivation or render. This is asserted by reference to
  SPEC §8b (no NFR ID — see `docs/CROSS-PHASE-CONTRACT.md` §1, COST-003 decision: "drop
  the NFR ID; reference SPEC §8b in prose").

## 7. Cross-phase consistency

- **Shared right-pane tab model (P3 + P4):** SPEC §7 defines the right pane as tabbed
  (behavior/structure/reasons/code). **P3 owns the tab chrome** (`PaneTabs` + `ViewState.activeTab`
  + the exported `TabId` type). **P4 owns the behavior/structure tab CONTENT** via
  `RepresentationContent` (previously called `RepresentationSwitch` — renamed per
  `docs/CROSS-PHASE-CONTRACT.md` §2 to drop the tab-ownership claim). P4 registers its
  two tabs into P3's `PaneTabs` via the `TabRegistration` API:
  `tabs: [{id:'behavior', label, content: <BehaviorDiagram />}, {id:'structure', label, content: <StructureDiagram />}]`.
  P4 imports `type TabId` from P3's `src/components/PaneTabs.tsx` (does NOT define it
  locally). The tab model (active-tab id, tab registry) is unified under P3 — not
  duplicated per phase.
- **React Flow boundary (ADR-001):** C4/sequence are Mermaid in the right pane, NOT React Flow.
  The graph canvas (left) is unchanged. Do not confuse the two renderers.
- **Core purity:** `C4Derivation` and `SequenceDerivation` are pure Core functions on
  `TypedGraphModel` — renderer-agnostic, testable without Mermaid. Renderers are output adapters.
  The Core boundary is also enforced by an AST-based import check (see plan Task 9; ADR-006 hedge
  is locked by a parser-level test, not a substring scan).

## 8. Open items

- **graphify callflow data availability:** graphify v0.9.4 emits callflow as HTML only
  (SPEC §1). If a future graphify version exposes structured callflow data (JSON), a
  `CallflowAdapter` could REPLACE the `graph.json` derivation path entirely (per
  `docs/CROSS-PHASE-CONTRACT.md` §19 — the adapter is a future alternative INPUT, not a
  seam that enriches `SequenceDerivation`). For P4, re-derive from `graph.json` call edges.
  Tracked open; does not block P4.
- **Large-subsystem LOD thresholds:** container-cap (`maxContainers` default 50 per PERF-005
  §5.1) and path-length-cap values are tunable; calibrate against the httpx + aede
  fixtures during `/implement`.
- **Mermaid theme parity with DESIGN-SYSTEM:** exact token → themeVariable mapping finalized
  in `docs/design/ARCHITECTURE-P4.md` §"Mermaid theme"; must satisfy USABILITY-003 contrast
  (each role color >= 3:1 against `#0F172A`).

## 9. Traceability

Informal RTM (MVP tier). P4 rows appended in the consolidated `docs/requirements/RTM.md` by
the lead: US-015/016/017 → AC-P4 → test files (filled during `/tasks` + `/implement`).

## 10. Out of scope (this SRS)

Reasons/decision-context synthesis (P3), agent-injection, onboarding tour (P5), C4 levels
beyond container (component-level drill-down is NOT built — SPEC §4 rejects forced isolation;
P4 draws ONE bounded level per selected cluster, cross-deps labeled).
