---
type: rtm
project: codebase-atlas
tier: mvp
date_updated: 2026-07-01
note: Informal RTM (MVP tier). Test-file column filled during /tasks + /implement. P2-P5 rows added 2026-07-01 after /audit-spec + remediation.
---

# Requirements Traceability Matrix — Codebase Atlas MVP

## MVP (P0 + P1) — SHIPPED

| Story | Acceptance Criteria | NFRs touched | Phase | Tests (TBD) |
|---|---|---|---|---|
| US-001 Generate index | AC US-001 (2 scenarios) | PERF-003, AVAIL-001 | P0+P1 | — |
| US-002 Typed graph | AC US-002 | MAINT-001 | P0 | — |
| US-003 Gradient search | AC US-003 (2 scenarios) | PERF-002, SCALE-001 | P1 | — |
| US-004 Detail pane | AC US-004 | — | P1 | — |
| US-005 Clean UI | AC US-005 | USABILITY-001 | P1 | — |
| US-006 Codebase-agnostic adapter | (implied by US-001/002) | MAINT-001 | P0 | — |
| US-007 One command | AC US-007 | PERF-003 | P1 | — |

## P2 — focus+context + blast-radius (DESIGNED, ready for /implement)

| Story | Acceptance Criteria | NFRs touched | Phase | Tests (TBD) |
|---|---|---|---|---|
| US-008 Focus+context gradient (BFS distance, mounted-subset BFS, click→mount→gradient two-phase pipeline, select=focus+blast coupling, clearFocus clears blast) | AC-P2 US-008 (4 scenarios) | PERF-004 (focus-gradient p95 < 100ms, ≤200 mounted), SCALE-001 | P2 | — |
| US-009 Blast-radius / reverse-deps highlight on select (edge stroke + node ring, MCP with graph.json fallback, malformed/timeout handling, leaf node empty state) | AC-P2 US-009 (4 scenarios) | AVAIL-002 (MCP fallback), USABILITY-002 (blast non-opacity channel), PERF-004 | P2 | — |
| US-010 Cluster-focus via shift-click multi-select gesture (selection.kind = 'cluster', clusterId = first-seed community) | AC-P2 US-010 (2 scenarios) | — | P2 | — |

## P3 — reasons pane (DESIGNED, ready for /implement)

| Story | Acceptance Criteria | NFRs touched | Phase | Tests (TBD) |
|---|---|---|---|---|
| US-011 View decision-context tradeoff matrix for a node/cluster (right-pane "reasons" tab; terse matrix) | AC-P3 US-011 | COST-002 (cell word cap), FRESH-001, USABILITY-001, AVAIL-001 (reused) | P3 | — |
| US-012 Seal-test quality gate (LLM picks real option at ≥0.8 confidence, 4/5 runs; authoring CLI + CI workflow) | AC-P3 US-012 | QUAL-001, SEC-002, MAINT-002 | P3 | — |
| US-013 Reasons cached (doc-hash keyed) + staleness-warned (hash-mismatch or age > 90d) | AC-P3 US-013 | FRESH-001, COST-001 (one-time synth, cached), QUAL-001, AVAIL-001 (reused), USABILITY-001 (reused) | P3 | — |
| US-014 Configurable decision-doc sourcing (project-agnostic; aede is one configured instance; malformed docs reported not silent) | AC-P3 US-014 | MAINT-002, SEC-002 | P3 | — |

## P4 — representation switch (DESIGNED, ready for /implement)

| Story | Acceptance Criteria | NFRs touched | Phase | Tests (TBD) |
|---|---|---|---|---|
| US-015 View C4 container diagram for selected cluster (Mermaid, cross-boundary deps as labeled external arrows — §4 honesty) | AC-P4 US-015 (3 scenarios including empty cluster) | USABILITY-003 (diagram readability, ≥3:1 contrast), PERF-005 (Mermaid ≤50-node <300ms p95) | P4 | — |
| US-016 View sequence/flow diagram for a behavior path (Mermaid, threads through overlap, cycle-safe, empty-sequence honest state) | AC-P4 US-016 (3 scenarios including empty sequence) | PERF-005, USABILITY-003 | P4 | — |
| US-017 Cross-boundary dependencies shown not hidden (§4 honesty — K-edge test at K=3 and K=50/LOD cap) | AC-P4 US-017 (3 scenarios) | USABILITY-003 | P4 | — |

**P4 dependencies (per contract §18):** P4 consumes P2's `view.selection.kind === 'cluster'` (shift-click gesture) for cluster selection. P4 imports `TabId`/`TabRegistration` from P3's `PaneTabs`. P4's `RepresentationContent` registers behavior/structure tabs into P3's `PaneTabs`.

## P5 — onboarding tour (DESIGNED, ready for /implement)

| Story | Acceptance Criteria | NFRs touched | Phase | Tests (TBD) |
|---|---|---|---|---|
| US-018 Start a tour, step through nodes in reading order (play/next/prev/jump; mid-playback non-tour click pauses + retains position; deleted-nodeId degrades gracefully) | AC-P5 US-018 (4 scenarios) | USABILITY-004 (tour THIN: terse narrative, no second renderer) | P5 | — |
| US-019 Tour step shows node + reasons (reasonRef = P3 TradeoffMatrix.id; dangling reasonRef shows placeholder; cross-link to index) | AC-P5 US-019 (2 scenarios) | FRESH-001 (reused by-reference from P3), USABILITY-004 | P5 | — |
| US-020 Tours saved/loaded + staleness-warned (graphHash mismatch or age > window; corrupt tour.json degrades to no-tour mode) | AC-P5 US-020 (2 scenarios) | FRESH-001 (reused), COST-004 (curation small-token, one-time per (graphHash, audience), cached) | P5 | — |
| US-021 Index node → "new here? start the tour" cross-link (TourCrossLinks component; P4-absent tab falls back to 'reasons') | AC-P5 US-021 (1 scenario) | USABILITY-004 | P5 | — |

**P5 dependencies (per contract §3–§6):** P5 imports `TabId` from P3's `PaneTabs`. P5 imports `checkStaleness` from P3's `src/core/staleness.ts`. P5's `curateTour` accepts P3's `MatrixCache` (or `Map<string, DecisionContextEntry>` alternate per contract §6). `TourStep.reasonRef` is P3's `TradeoffMatrix.id` (stable slug).

## Cross-cutting NFR coverage

| NFR | Owner | Covered by | Notes |
|---|---|---|---|
| PERF-001 render | MVP | US-002, US-004 | ≤200 nodes p95 < 2s |
| PERF-002 search | MVP | US-003 | < 100ms/keystroke |
| PERF-003 generation | MVP | US-001, US-007 | token-free, < 60s |
| PERF-004 focus-gradient | **P2** | US-008 | < 100ms p95 for ≤200 mounted nodes; locked via 1000-node BFS + p95 timing test |
| PERF-005 Mermaid render | **P4** | US-015, US-016 | ≤50-node subsystem < 300ms p95; larger degrade via maxContainers cap (never LOD-truncate crossBoundaryDeps — §4 honesty) |
| SCALE-001 large graphs | MVP | US-003 (scenario 2), US-008 | Load-bearing; virtualization from start; mount cap maintained under focus |
| USABILITY-001 visual bar | MVP | US-005 | DESIGN-SYSTEM.md defines tokens |
| USABILITY-002 blast non-opacity | **P2** | US-009 | Distinct from focus gradient; edge stroke + node ring |
| USABILITY-003 diagram readability | **P4** | US-015, US-016 | Mermaid theme + ≥3:1 contrast vs #0F172A |
| USABILITY-004 tour THIN | **P5** | US-018–US-021 | Terse narrative, no second renderer, controller drives index |
| AVAIL-001 | MVP | US-001 (missing-graphify) | graceful failure on missing/malformed graph.json |
| AVAIL-002 MCP fallback | **P2** | US-009 | graph.json reverse-edge traversal when MCP unavailable; source provenance badge |
| AVAIL-003 empty graph | **P2** | US-008 | empty-canvas state, no crash (zero nodes) |
| SEC-001 | MVP | US-004 | locations not secret values; local-only |
| SEC-002 LLM egress | **P3** | US-012, US-014 | egresses ONLY to configured LLM endpoint; explicit opt-in; no telemetry |
| MAINT-001 | MVP | US-002, US-006 | codebase-agnostic |
| MAINT-002 decision-doc convention | **P3** | US-014 | project-agnostic; aede is one configured instance |
| COST-001 LLM synth | **P3** | US-013 | one-time per decision, doc-hash cached; cache hit = zero LLM at render |
| COST-002 matrix terseness | **P3** | US-011 | cell ≤ word cap; compress words, never reasoning |
| COST-004 tour curation | **P5** | US-020 | small-token, one-time per (graphHash, audience), cached |
| FRESH-001 staleness | **P3** (defines); P5 reuses by-reference | US-013, US-019, US-020 | date-stamped; staleness on hash mismatch OR age > window. P3 exports generic `checkStaleness(Stamped, StalenessInput): StalenessResult` in `src/core/staleness.ts` |
| QUAL-001 seal-test | **P3** | US-012 | LLM picks real option at ≥0.8 confidence (4/5 runs); incomplete entries blocked at authoring + CI |

## Open items carried to /design (updated 2026-07-01)

1. ~~Render technology~~ — **RESOLVED** (ADR-001: React Flow with culling-first architecture)
2. ~~Visual quality bar~~ — **RESOLVED** (`docs/design/DESIGN-SYSTEM.md`)
3. ~~Node-typing rules~~ — **RESOLVED** (ARCHITECTURE.md §'Node typing')

## P2-P5 cross-phase contract

All P2-P5 designs are governed by `docs/CROSS-PHASE-CONTRACT.md` (binding 2026-07-01). Key decisions: canonical ID map (P2=US-008-010, P3=US-011-014, P4=US-015-017, P5=US-018-021), tab-model ownership (P3 owns `PaneTabs`/`TabId`; P4 owns behavior/structure CONTENT), `checkStaleness` polymorphic signature (P3 exports, P5 imports), `TradeoffMatrix.id` stable-slug contract, `curateTour` reasons input aligned to P3's `MatrixCache` (or `Map<string, DecisionContextEntry>` alternate).

## Audit trail

- 2026-07-01: First `/audit-spec` (DIR) on P2-P5 specs — all 4 phases FAILED (58-60/100). 5 ID collisions, tab-model ownership war, ownership violations, broken reuse contracts, +40 lower-severity gaps.
- 2026-07-01: Remediation via cross-phase contract — 60+ individual fixes across the spec set.
- 2026-07-01: Re-audit — P4 PASSED (92/100), P3 improved to 85, P2 (70) and P5 (78) failed on residual cross-phase interface gaps and `MatrixCache` shape mismatch.
- 2026-07-01: Final blocker round — P2 added `selection.kind` discriminator, P5 rewrote `MatrixCache` fixture to use the contract-allowed `Map` alternate, P4 added `ts-morph` dep + fixed regex. All targeted fixes verified in source.
