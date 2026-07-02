---
type: requirements
tags: [docs-internal, requirements, codebase-atlas]
date_updated: 2026-07-01
status: spec-draft
phase: P5
---

# Codebase Atlas — SRS (Phase 5: Onboarding Tour)

Produced via sdlc-engineer `/spec` (MVP tier). Scoped to **P5 — onboarding tour** (SPEC §8 P5,
§2 "two deliverables", §8b cost). P5 is THIN: a saved ordered walk through the index
interface, not a separate app. It reuses P1 (index graph), P3 (reasons / tradeoff matrices),
and optionally P4 (representation tabs).

## 1. Purpose & scope

Deliver the onboarding product: a curated reading-order walk through the load-bearing ~20% of
the codebase, with reasons. The tour is a **saved ordered walk** (`tour.json`) plus a
**controller** that drives the existing index (focus, active right-pane tab) — it does NOT
render its own graph (SPEC §2; ADR-001 stays sole renderer). Cross-links both ways: index
node → "new here? start the tour"; tour step → "look it up in the index".

Token cost (SPEC §8b): curation is small-token, one-time, cached. Structural inputs
(communities, god-nodes, betweenness) are token-free (pure Core on `TypedGraphModel`).

## 2. Actors

| Actor | Role in P5 |
|---|---|
| Maintainer | Runs the atlas; refreshes the tour when graph.json changes. |
| Developer | Steps through the tour to learn the codebase in order. |
| Onboarding author / curator | Authors or curates the tour (LLM-drafted, human-curated, or both — ADR-007). |

## 3. User stories (P5)

**Must-have (INVEST):**
- **US-018** — Start a tour and step through nodes in reading order (play / next / prev / jump).
- **US-019** — A tour step shows the node + its reasons (P3 tradeoff matrix) and offers a cross-link to the index ("look it up in the index").
- **US-020** — Tours are saved and loaded (`tour.json`); stale tours are warned (reuse P3 FRESH-001).
- **US-021** — An index node offers a "new here? start the tour" cross-link entry point.

**Deferred (recorded, not in P5):** multi-audience tour branching, tour analytics, agent-injection of tour content, cluster-level tour steps (F12 — `clusterId` schema removed; deferred until a phase implements cluster-level focus steps).

## 4. Acceptance criteria (Gherkin)

See `docs/requirements/acceptance-criteria-P5.md` (US-018..US-021).

## 5. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| **COST-004** | **Cost** | **Tour curation is small-token, one-time per (graphHash, audience), cached as `tour.json`. Bounded: curation runs only when the cache is missing or stale — never per launch.** |
| FRESH-001 (reused from P3) | Freshness | Tours are curated content → date-stamped + graphHash-stamped; staleness-warned on load (reuse P3's `checkStaleness` from `src/core/staleness.ts` — do not duplicate per contract §5; F3/F4). |
| USABILITY-004 | Usability | The tour is THIN: terse narrative ("compress words, never reasoning"), no bloat to the index, no second graph renderer. Controller drives existing panes. THIN is enforced by file count: 6 core modules + 2 React components (`TourControllerHost` + `TourCrossLinks`) — see ARCHITECTURE-P5 §'Reused vs new' (F16). |

### 5.1 COST-004 — Tour curation is bounded and cached (LOAD-BEARING for the "small tokens" claim)

**Requirement.** SPEC §8b promises onboarding tour reading-order curation is "small tokens —
LLM curates order once, cached." This MUST hold: curation runs only when `tour.json` is
absent or stale (graphHash mismatch / dateStamp age per FRESH-001). A normal launch loads
the cache — zero tokens.

**Bound:** one curation pass produces one `tour.json` for one (graphHash, audience). Inputs
to the LLM are the graph-metrics extractors output (communities/god-nodes/bridges — token-free)
plus P3 `TradeoffMatrix` ids (terse). Output is an ordered step list + terse narratives — not
full prose. **`curateTour` stamps `tour.metadata.graphHash = currentGraphHash` at write time** (F6)
so a freshly-curated tour is never immediately reported as stale-graph on its next load.

## 6. Constraints & dependencies

- **P1 index (REQUIRED):** tour steps reference `AtlasNode.id`; `TourController` drives
  `SelectionState.focusId` + the existing `GraphCanvas`. No P1 → no tour.
- **P3 reasons (REQUIRED):** tour steps reference a P3 `TradeoffMatrix.id` (a stable slug
  derived from the decision title per ARCHITECTURE-P3 §'Data model' — contract §4). The tour
  does NOT redefine the matrix or its id scheme. P3's `checkStaleness` (from
  `src/core/staleness.ts`) is REUSED for tour staleness (FRESH-001) — not duplicated
  (contract §5; F3/F4).
- **P3 right-pane tabs (REQUIRED for tab model):** `TourStep.representationHint` is typed
  `TabId | null` and imports `TabId` from P3's `src/components/PaneTabs.tsx` (contract §3).
  P5 does NOT define its own tab enum (F5). The four values are
  `'behavior' | 'structure' | 'reasons' | 'code'`; the registered tab set is whatever P3/P4
  register — if `representationHint` is a tab P4 hasn't registered, the controller falls
  back to `'reasons'` (F11).
- **P4 representations (OPTIONAL enrichment):** when P4 ships, `representationHint` resolves
  to a real `behavior` / `structure` tab via `RepresentationContent` (P3/P4 contract). P4
  absent → the hint for `'behavior'` / `'structure'` is ignored; the controller projects it
  onto the registered tab set, falling back to `'reasons'` (F11). The tour still works.
- `tour.json` lives alongside `graph.json` (same L2 container — no new backend, SPEC §2).

## 7. Traceability

Informal RTM (MVP tier). P5 rows append to `docs/requirements/RTM.md` during consolidation:
US-018..021 → ACs → NFRs COST-004 / FRESH-001 / USABILITY-004 → (future) test files.

## 8. Open items

- **Tour authoring mode** — resolved in `docs/adr/ADR-007-tour-format-and-authoring.md`
  (SPEC §9 open item #2: hand-authored vs LLM-drafted+human-curated vs both → BOTH, via
  the `curatedBy` field).
- **Tour content versioning** — `TourMetadata.version` + `dateStamp` + `graphHash` are
  defined; the human-review cadence (how often a curator re-walks a stale tour) is a
  process decision, not a schema decision. Tracked, not blocking.
- **P3 / P4 interface finalization** — P3 `TradeoffMatrix.id` (stable slug — contract §4) and
  P3 `TabId` (contract §3) are referenced by interface; if those phases refine the interface,
  P5's `reasonRef` / `representationHint` fields adjust (low cost — string fields typed by
  an imported union). Concrete references (no longer "not yet present" per F8):
  `docs/design/ARCHITECTURE-P3.md` §'Data model' (`TradeoffMatrix` interface) and §'Critical
  flows' B (`checkStaleness` flow).
- **Cluster-level tour steps** — deferred (F12). `TourStep.clusterId` was removed from the
  schema; cluster-level focus steps require a phase that implements cluster-level focus
  steps. P2 US-010 (cluster-focus gesture) is for the *focus* gradient only, not for tour
  steps.
- **Graceful degradation matrix** (F9, F10, F11, F13, F14, F15) — explicit ACs added; see
  `acceptance-criteria-P5.md`.
