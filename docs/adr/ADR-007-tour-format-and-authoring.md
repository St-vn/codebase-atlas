# ADR-007: Tour format (JSON), authoring mode (LLM-drafted + human-curated), and index reuse

**Date:** 2026-07-01
**Status:** Accepted

## Context

SPEC §8 P5 defines the onboarding tour as "a saved ordered walk (reading order) through nodes
with reasons. Thin — reuses everything above." SPEC §2 sharpens this: onboarding is "a saved
tour through the index interface, not a separate app" — it shares `graph.json` and the same
React frontend, cross-linking both ways with the index. SPEC §8b bounds the cost: "Onboarding
tour reading-order | graph + reasons | small tokens — LLM curates order once, cached." SPEC
§3 requires curated content (tours, reasons) to be date-stamped and staleness-warned. SPEC §9
open item #2 leaves the authoring mode open: "Whether onboarding 'tours' are hand-authored,
LLM-drafted + human-curated, or both."

This ADR resolves three coupled decisions: the tour's on-disk format, its authoring mode
(open item #2), and how it reuses the index interface (not a separate app).

## Decision

1. **Tour format:** a JSON document (`tour.json`) saved alongside `graph.json`, conforming
   to the `Tour` / `TourStep` / `TourMetadata` schema (ARCHITECTURE-P5). Steps reference
   existing `AtlasNode.id` and P3 `TradeoffMatrix` id by reference — they never duplicate
   node or matrix data. `TourMetadata` carries `dateStamp` + `graphHash` (FRESH-001) and a
   `curatedBy` enum.

2. **Authoring mode: BOTH — LLM-drafted + human-curated** (resolves SPEC §9 open item #2).
   The curation pipeline produces an LLM draft from token-free graph metrics
   (communities/god-nodes/betweenness) + terse P3 matrix refs (small tokens, one-time,
   cached — COST-004). A human review pass (aede's seal-test quality bar) may then edit and
   re-save with `curatedBy = 'llm-drafted+human-curated'`. The `curatedBy` field records
   which path produced a given tour, so all three modes (LLM-drafted, human-authored,
   LLM-drafted+human-curated) coexist per-tour.

3. **Index reuse:** the tour is a **controller**, not a renderer. `TourController` emits
   `focusId` + `activeTab` commands consumed by the existing `GraphCanvas` (ADR-001 sole
   renderer) and right-pane tabs (P3 reasons / P4 representations). It renders no graph of
   its own. Cross-links both ways: index node → "new here? start the tour"; tour step →
   "look it up in the index" (exits tour, keeps focus).

## Options considered (authoring mode)

| Option | Pros | Cons |
| :--- | :--- | :--- |
| **LLM-drafted + human-curated (BOTH)** (chosen) | Honors §8b "LLM curates once, cached" AND aede's seal-test quality bar; `curatedBy` supports all three modes per-tour; human review is one-time then cached | Needs a curation tool + a human review step (but only once per tour) |
| Hand-authored only | Full control; zero token cost | Doesn't scale; §8b explicitly assigns ordering to the LLM; manual ordering of 144 nodes is error-prone; no seal-test enforcement |
| LLM-only, no curation | Zero human effort | Fails the seal-test quality bar (generic/mid-confidence narratives); no override path; locks out the human-authored case |

## Consequences

**Positive:**
- One curation pipeline supports all three authoring modes via `curatedBy` — no fork in the schema.
- `tour.json` is a simple cached file: re-curation is a re-run, not a rewrite (low reversal cost).
- Index reuse means no second renderer — ADR-001's hedge stays intact; the tour inherits any
  future renderer swap for free.
- Staleness reuses P3's `checkStaleness` (FRESH-001) — no duplicate logic. P5 imports
  `checkStaleness` from `src/core/staleness.ts` and delegates tour staleness to it
  (cross-phase contract §5).

**Negative / tradeoffs accepted:**
- A human review step exists for the quality bar — but only once per tour, then cached
  (COST-004). A purely LLM-drafted tour is still valid (`curatedBy = 'llm-drafted'`) for
  maintainers who opt out of review.
- The tour's quality depends on P3 matrix quality — a thin P3 matrix yields a thin tour step.
  Mitigation: the seal-test gate lives in P3; P5 inherits its output.

**Risks:**
- If `curatedBy` is mislabeled, staleness/quality signals lie. Mitigation: `TourSerializer`
  validates the enum + `dateStamp` on load (Task 1 / Task 3 tests). Staleness reuses P3's
  `checkStaleness` (imported from `src/core/staleness.ts` per cross-phase contract §5) — no
  duplicate freshness arithmetic; `graphHash` is stamped by `curateTour` at write time
  (contract §21 / F6) so a freshly-curated tour is never immediately stale-graph. A
  dangling `reasonRef` (P3 matrix removed) and a deleted `nodeId` (P1 node removed) both
  degrade gracefully (US-018/019 ACs; F9, F10) — the tour continues, with placeholders.
- If P3's `TradeoffMatrix` interface shifts, `reasonRef` strings dangle. Mitigation: low-cost
  field; cross-phase contract pins `TradeoffMatrix.id` to a stable slug
  (derived from the decision title; contract §4). P5's `validateTourAgainstModel` (Task 11)
  reports missing refs and the right-pane shows a "reasons not yet synthesized" placeholder
  (F10).

## Reversal cost: Low

`tour.json` is a cached file — changing the schema or the authoring-mode policy is a
re-curation, not a code rewrite. The index-reuse decision is locked by ADR-001: reversing it
would mean building a second graph renderer, which ADR-001 already hedges against (and which
SCALE-001 / USABILITY-004 — P5's THIN invariant — forbid). The `curatedBy` enum is additive —
adding a fourth mode does not break existing tours.

**Revisit when:** a target codebase's tour quality fails the seal-test under
`curatedBy = 'llm-drafted'` without human review (→ tighten the default to
`llm-drafted+human-curated`), OR tour consumers need richer per-step content than terse
narratives allow (→ extend `TourStep`, keep references intact).
