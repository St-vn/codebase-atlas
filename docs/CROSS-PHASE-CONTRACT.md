---
type: consolidation
tags: [docs-internal, consolidation, codebase-atlas]
date_updated: 2026-07-01
status: binding
purpose: Resolves cross-phase collisions and interface-ownership conflicts surfaced by /audit-spec (DIR) on P2-P5 artifacts. Binding on all phases.
---

# Cross-Phase Consolidation Contract

Produced by the lead after running `/audit-spec` (DIR protocol) on P2-P5 specs.
All four phases FAILED audit (scores 58-60/100). This document records the
binding decisions that resolve the blockers; each phase's remediation agent
applies them to that phase's files only.

## 1. Canonical ID map (resolves all US- and NFR-ID collisions)

User stories — renumbered sequentially, no gaps, no collisions:

| Phase | User stories (canonical) | Was |
|---|---|---|
| P2 | US-008, US-009, US-010 | unchanged |
| P3 | US-011, US-012, US-013, US-014 | unchanged |
| P4 | **US-015, US-016, US-017** | was US-014, US-015, US-016 |
| P5 | **US-018, US-019, US-020, US-021** | was US-017, US-018, US-019, US-020 |

NFRs — canonical ownership, first definer wins; later phases mint new IDs:

| NFR ID | Owner | Definition (authoritative) |
|---|---|---|
| PERF-001/002/003 | MVP | (unchanged) |
| PERF-004 | **P2** | focus-gradient recompute p95 < 100ms for <=200 mounted nodes |
| **PERF-005** | **P4** | Mermaid render <=50-node subsystem < 300ms p95 (was P4's PERF-004) |
| SCALE-001 | MVP | (unchanged) |
| USABILITY-001 | MVP | (unchanged) |
| USABILITY-002 | **P2** | blast-radius non-opacity channel distinct from focus gradient |
| **USABILITY-003** | **P4** | diagram readability + Mermaid theme + cross-boundary arrows distinct (was P4's USABILITY-002) |
| **USABILITY-004** | **P5** | tour is THIN: terse narrative, no bloat, no second graph renderer (was P5's USABILITY-002) |
| AVAIL-001 | MVP | (unchanged) |
| AVAIL-002 | **P2** | MCP-unavailable degrades to graph.json reverse-edge fallback |
| SEC-001 | MVP | (unchanged) |
| SEC-002 | **P3** | decision-doc text egresses only to configured LLM endpoint |
| MAINT-001 | MVP | (unchanged) |
| MAINT-002 | **P3** | decision-doc convention project-agnostic |
| COST-001 | **P3** | one-time LLM synthesis per decision, doc-hash cached |
| COST-002 | **P3** | matrix-cell terseness (word cap; compress words, never reasoning) |
| **COST-003** | **P4** | P4 token-free — OR drop the NFR and reference SPEC §8b directly. **Decision: drop the NFR ID; reference SPEC §8b in prose.** P4 has no cost NFR. |
| **COST-004** | **P5** | tour curation small-token, one-time per (graphHash, audience), cached (was P5's COST-002) |
| FRESH-001 | **P3** (definer) | date-stamped; staleness on hash mismatch OR age > window. **P5 reuses by-reference** (see §5). |
| QUAL-001 | **P3** | seal-test confidence >= 0.8 (4/5 runs) |

ADR numbering: ADR-003 (P2), ADR-004/005 (P3), ADR-006 (P4), ADR-007 (P5) — no collisions, unchanged.

## 2. Right-pane tab model — ownership resolved

**Decision: P3 owns the tab chrome. P4 owns behavior/structure content. No war.**

- **`PaneTabs` (P3)** — the shared tab container. Renders the tab bar + the active
  tab's content slot. Owns `activeTab` state in `ViewState`. Exports:
  - `type TabId = 'behavior' | 'structure' | 'reasons' | 'code'` (P3 defines; P4/P5 import)
  - `interface TabRegistration { id: TabId; label: string; content: ReactNode }`
  - Props: `tabs: TabRegistration[]`, `activeTab: TabId`, `onTabChange(id: TabId)`
  - P3 registers the `reasons` tab (content = `ReasonsPane`).
- **`RepresentationSwitch` (P4)** — RENAMED to **`RepresentationContent`**. Provides
  the behavior/structure tab CONTENT. Registers `{id:'behavior',...}` and
  `{id:'structure',...}` into `PaneTabs` via the `TabRegistration` API. Does NOT
  own the chrome. (P4's ARCHITECTURE-P4 line 57 "RepresentationSwitch owns the
  tab model" is struck — P3 owns the chrome.)
- **`ReasonsPane` (P3)** — content for the `reasons` tab.
- **Code tab content** — P2's blast-radius section is the substrate for the future
  `code` tab. P2 does NOT build the tab wrapper; it renders blast-radius as a
  DetailPane section with an open item noting "moves into `code` tab when P3
  ships PaneTabs." (See §8.)
- **`ViewState.activeTab: TabId`** — added by P3 to ViewState (ARCHITECTURE-P3 +
  plan Task 7). P5's TourController SETS it via the existing mechanism; does not
  redefine it.

This resolves: P3's `PaneTabs` vs P4's `RepresentationSwitch` ownership war, and
P5's `RepresentationHint` enum ownership violation (P5 imports `TabId` from P3's
`PaneTabs` module).

## 3. `TabId` enum ownership

- Defined in P3's `src/components/PaneTabs.tsx` (or a co-located `tabs.ts`).
- P4 imports `TabId` from `PaneTabs` to register behavior/structure tabs.
- P5 imports `TabId` for `TourStep.representationHint: TabId | null`. P5 does NOT
  define the enum. (P5's `RepresentationHint` is removed; replaced by `TabId`.)

## 4. `TradeoffMatrix.id` contract (P3 defines, P5 consumes)

- P3 documents: `id` is a **stable slug derived from the decision title**,
  immutable across re-synthesis, canonical key for P5 `TourStep.reasonRef`.
- P3 adds a Task 2 test: same decision doc → same `id` (deterministic).
- P5's `reasonRef: string` references this id. No mismatch.

## 5. Staleness reuse contract — P3 refactors, P5 imports the generic

**Decision: P3 exports a generic `checkStaleness`; P5 imports it.**

- P3 refactors `src/core/staleness.ts` to export:
  ```typescript
  type Stamped = { hash: string; date: string }; // ISO date
  type StalenessInput = { currentHash: string; ageDaysWindow: number };
  type StalenessResult = { kind: 'fresh' | 'hash-mismatch' | 'age-stale'; message: string };
  export function checkStaleness(stamped: Stamped, input: StalenessInput): StalenessResult;
  ```
- P3's decision-doc staleness calls `checkStaleness({hash: sourceDocHash, date: synthesizedAt}, {currentHash, ageDaysWindow})`.
- P5's tour staleness calls `checkStaleness({hash: graphHash, date: dateStamp}, {currentHash: currentGraphHash, ageDaysWindow})`.
- P3 keeps a thin `stalenessOf` wrapper for its own backward-compat OR renames
  its call site. Either way, `checkStaleness` is the exported cross-phase function.
- P5's invariant test regex updates to match `checkStaleness` from `./staleness`
  (NOT `freshness` / `reasonsFreshness` — those tokens do not exist in P3).
- `StalenessResult` is shared; P5 does not redefine it.

## 6. `curateTour` reasons input — aligns to P3's `MatrixCache`

- P5's `curateTour` accepts P3's `MatrixCache` (or `Map<string, DecisionContextEntry>`)
  directly and projects internally to `{decisionId, bindNodeIds: string[]}`.
- P5 adds a small `projectReasonsForCuration(matrixCache)` function + test against
  a P3-shaped fixture.
- P5's Task 9 fixture updates to use P3's `DecisionContextEntry` shape.

## 7. P2 focus action — two-phase pipeline (resolves MVP contradiction)

**Decision: separate the click→mount phase from the gradient-recompute phase.**

- The CLICK action triggers MVP flow C: `ViewportPolicy` recomputes the mount set
  around the clicked node (still <= cap). New nodes may enter the mounted set.
- The FOCUS GRADIENT recompute (`focusScores`/`combinedOpacity` after mount
  settles) is **style-only, no remount**. Operates on the post-click mounted set.
- P2 updates SRS-P2 §5 and ARCHITECTURE-P2 flow D to state this explicitly.
- "Focus on an unmounted node" is now well-defined: click → mount re-centers on
  it (<= cap) → gradient applies to the re-centered mounted set.

## 8. P2 combine semantics — multiply (AND), AC corrected

**Decision: keep multiply (AND). Fix the AC. SPEC §4's honest overlap is the goal.**

- AC US-008 scenario 2 rewritten to remove OR language:
  - "And a node that is a strong match AND near focus is brightest"
  - "And a node that is a weak match AND far from focus is dimmest (at floor 0.18, still present)"
  - "And a node that is a strong match but far from focus dims to floor (intentional honest overlap)"
- SRS-P2 §6 open item 3 aligned with the corrected AC.

## 9. P2 select = focus + blast coupling — kept, ACs corrected

**Decision: keep the coupling. Fix the ACs to state it.**

- AC US-008 and US-009 update: "When the developer selects a node (triggering
  both focus and blast-radius)..."
- Add cross-reference between US-008 and US-009 noting the coupling.
- Add AC US-009 scenario: "Given a selected node with active blast-radius / When
  the developer clears focus / Then the blast-radius is also cleared." Task 9
  test asserts `view.blastRadius === null` after `clearFocus`.

## 10. P2 `computeFocusScores` — restricted to mounted subset

- Signature: `computeFocusScores(model, seedIds, mountedIds: Set<string>, opts)`.
- BFS traverses only edges where both endpoints are in `mountedIds`.
- Add a test: 1000-node model + 10-node `mountedIds` → BFS touches <= mounted
  edge count. Locks PERF-004's bound.

## 11. P2 `combineGradients` — variadic signature

- `combineGradients(...scores: Map<string, number>[], floor = 0.18)` reducing via
  `max(floor, product)`.
- Task 2 test calls `combineGradients(match, focus)` (still works) + add a 3-input
  test case to lock extensibility for P3/P4.

## 12. P2 US-010 cluster-focus gesture — specified

- Gesture: **shift-click multiple nodes → seed set**. Add a Task 12 implementing
  this + an AC scenario: "Given the developer shift-clicks nodes X and Y / When
  the focus-seed set is {X,Y} / Then the focus gradient is computed from both
  seeds (BFS distance = min over seeds)."
- This unblocks P4's cluster-selection dependency (P4 declares P2 US-010 dep).

## 13. P3 real LLM adapter — added

- Add a task implementing `src/adapters/llmClient.ts` (HTTP to configured
  endpoint, API key from env/config, timeout, error handling) +
  `src/adapters/sealTestClient.ts`.
- Wire into the E2E task (Task 12) with a real-or-integration-double LLM.
- P3 is now genuinely the "first token-costing phase."

## 14. P3 authoring CLI + CI workflow — added

- Add a task for `bin/seal-test.ts` (CLI invoking `runSealTest` + `gateEntry` on
  decision docs).
- Add a task for `.github/workflows/seal-test.yml` (run seal-test on doc-change
  PRs).
- ADR-005's dual-site gate is now built.

## 15. P3 SEC-002 opt-in — implemented

- Add a config task: read LLM config (endpoint, API key, opt-in flag) from a
  config file/env. Gate synthesis on `opt-in === true`.
- Test: synthesis skipped/refused without opt-in.
- Extend the egress guard (Task 10) to also scan `src/adapters/llmClient.ts`
  for hardcoded URLs / telemetry calls.

## 16. P3 QUAL-001 enforcement — tested

- Add Task 7 test: render `ReasonsPane` with `sealTestResult.passed === false` →
  assert "incomplete" state shown, NOT the matrix table.
- Add Task 11 test: controller with cached incomplete entry → does not render
  the matrix.
- Add Task 4 test: `cache.put` refuses incomplete entries (or `cache.get` flags
  them).

## 17. P4 §4 honesty property — K-edge test

- Add a test with K=3+ cross-boundary edges asserting:
  1. `deriveC4` returns exactly K `CrossBoundaryDep` entries.
  2. Each has non-empty `label`/`toLabel`/`relation`.
  3. The rendered Mermaid contains exactly K dashed external arrows with the K
     distinct labels.
- Add a negative test: mutate the diagram by removing one dep → render-side test
  fails.

## 18. P4 cluster-selection — declared P2 dependency

- SRS-P4 §6 declares: P4 depends on P2 US-010 (cluster-focus) for cluster
  selection UX. P4 consumes `selection.kind === 'cluster'` produced by P2's
  shift-click gesture (§12 above).
- No P4 task builds cluster-selection UX (it's P2's job).

## 19. P4 CallflowAdapter seam — wired or downgraded

- **Decision: downgrade ADR-006's claim.** `deriveSequence(model, {entryId,
  maxPath})` stays as-is (no callflow param). ADR-006's "enrich
  SequenceDerivation" wording is replaced with "CallflowAdapter is a future
  alternative input that would replace the graph.json derivation path entirely."
  Remove "the seam is the derivation input."

## 20. P4 Core boundary guard — AST-based

- Replace the substring `/mermaid/` check with an AST-based import check
  (ts-morph or a regex targeting `import.*from.*mermaid`). Exclude comments.
- Add a second assertion: no `src/core/*.ts` imports from `src/adapters/`.

## 21. P5 `curateTour` stamps `graphHash` — tested

- `curateTour(model, reasons, {currentGraphHash, ...})` stamps
  `tour.metadata.graphHash = currentGraphHash`.
- Task 9 test asserts `tour.metadata.graphHash === currentGraphHash`.
- Resolves "freshly-curated tour is immediately stale."

## 22. P5 stale "P3 not yet present" flag — removed

- ARCHITECTURE-P5 §'Flagged': remove "not yet present at authoring time."
- Replace with concrete references to ARCHITECTURE-P3 §'Data model'
  (TradeoffMatrix interface) and §'Critical flows' B (stalenessOf flow).

## 23. P5 phantom `degree.ts` — corrected

- ARCHITECTURE-P5 §'Reused vs new': change "extends degree.ts (fanIn/fanOut)"
  to "reuses `AtlasNode.fanIn`/`fanOut` fields (populated by NodeTyper)."
- Plan Task 2 already reads the field directly — no code change, just doc fix.

## 24. P5 THIN invariant — component consolidation

- Merge `StartTourLink` + `LookUpInIndexLink` into a single
  `TourCrossLinks` component. New-file count drops from 9 to 8.
- ARCHITECTURE-P5 §'Reused vs new' lists all 8 new files explicitly with
  one-line justifications (each S-complexity, single-purpose).

## 25. P5 mermaid component placement — split

- Mermaid: `CTRL_FSM[TourController FSM — Core, pure state machine]` under Core,
  `CTRL_HOST[TourControllerHost — Adapters_Out, React]` under Adapters_Out.
- Show `CTRL_FSM → CTRL_HOST → CANVAS/PANE`.

## 26. Structural gaps to close (per phase)

Each phase's remediation agent also closes the lower-severity structural gaps
listed in that phase's audit findings (MCP timeout/malformed response, empty
graph/subsystem/sequence, cycles, >cap degradation, LLM failure, corrupt
cache/tour.json, dangling reasonRef, mid-playback index click, blast-radius
placement open item, etc.). The audit findings list is the worklist.

## Invariants this contract preserves

- ADR-001: React Flow sole graph renderer; Core imports nothing from React Flow.
- ADR-002: shadcn + Base UI.
- SPEC §4: ONE gradient mechanism (search + focus share `combineGradients`).
- SPEC §2: onboarding is THIN, reuses the index interface, not a separate app.
- SPEC §8b: P2/P4 token-free; P3/P5 small-token-cached.
- Hexagonal boundary: Core pure; adapters at edges.
