---
type: srs
project: codebase-atlas
tier: mvp
scope: P0+P1 (adapter + index)
date_updated: 2026-07-01
status: draft
---

# Codebase Atlas — Software Requirements Specification (MVP: P0+P1)

Produced via sdlc-engineer `/spec` (MVP tier). Scoped to the P0 adapter + P1 index MVP.
Later phases (focus+context, blast-radius, reasons pane, representation-switch, onboarding
tour) are recorded in `docs/SPEC.md` §8 and are OUT of this SRS scope.

## 1. Purpose & scope

Codebase Atlas is a standalone tool that turns any codebase into an interactive, clean UI
for understanding it. It serves sdlc-engineer as a consumer (blast-radius, decision-context)
in later phases. This SRS covers the MVP: generate a typed graph from a repo (running
graphify) and browse it (typed nodes, gradient search, detail pane) in a polished UI.

First target codebase: **aede**. Test fixture: **httpx** (`graph.json` already exists).

## 2. Actors

| Actor | Role in MVP |
|---|---|
| Maintainer | Runs the atlas against a repo; refreshes it. |
| Developer | Browses the rendered graph to understand the system. |
| Agent (LLM) | Consumer of the data — DEFERRED past MVP; noted not built. |

## 3. User stories (MVP)

**Must-have (INVEST):**
- **US-001** — Generate the index from a codebase (incl. running graphify).
- **US-002** — View the codebase as a typed graph (roles derived from edge relations).
- **US-003** — Search with gradient emphasis (matches brighten, non-matches fade; no removal).
- **US-004** — Inspect a node in a detail pane (label, file, location, role, neighbors).
- **US-005** — Read the graph in a clean UI (consistent design system).
- **US-007** — One command: repo → graphify → rendered atlas.

**Should-have:**
- **US-006** — Adapter (graph.json → typed model) is codebase-agnostic.

**Deferred (recorded, not in MVP):** focus+context drill-down, blast-radius, reasons/tradeoff
pane, C4/sequence representation-switch, onboarding tour, agent-injection consumer.

## 4. Acceptance criteria (Gherkin)

See `docs/requirements/acceptance-criteria.md` (US-001..US-005, US-007).

## 5. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| PERF-001 | Performance | Graph ≤200 nodes renders interactive p95 < 2s on a typical dev laptop. |
| PERF-002 | Performance | Gradient search updates < 100ms per keystroke for ≤200 nodes. |
| PERF-003 | Performance | graphify AST extraction is token-free; generate on ≤200-file repo < 60s end-to-end. |
| **SCALE-001** | **Scalability** | **See §5.1 — load-bearing, documented. The render approach MUST be virtualization-capable from the start.** |
| USABILITY-001 | Usability | Consistent design system, zero raw/unstyled interactive elements. Visual quality bar defined in `/design` (via `ui-design` or `ui-ux-pro-max`) — DEFERRED, flagged, must not be forgotten. |
| AVAIL-001 | Availability | Local single-user tool; no uptime SLA. Graceful failure on missing/malformed graph.json (show error, no crash). |
| SEC-001 | Security | Reads local code only; no code content leaves the machine in MVP. Detail pane shows source LOCATIONS not secret VALUES. |
| MAINT-001 | Maintainability | Adapter is codebase-agnostic; no target-project hardcoding. |

### 5.1 SCALE-001 — Graph rendering must be optimized for large graphs (LOAD-BEARING)

**Requirement.** The atlas MUST remain interactive on large graphs, not only the ≤200-node
MVP case. A full-repo scan (not just the core subset) produces hundreds to thousands of
nodes — graphify produced 144 for httpx from a partial corpus; a full aede/SaaS scan will
exceed this.

**MVP acceptance target:** ≤200 nodes at PERF-001/002 metrics.

**Documented scaling target (architecture constraint on P1, NOT a later optimization):**
- MUST degrade gracefully to **1000+ nodes** without UI jank.
- Render strategy MUST support: **node virtualization / viewport culling** (render only
  visible nodes), **level-of-detail** (collapse or simplify distant clusters), and
  **edge handling that doesn't force full re-render** on pan/zoom.
- Gradient search and focus+context MUST operate on the **data model**, updating only
  affected nodes — never a full DOM re-render of all nodes.

**Why it is load-bearing (not deferrable):** retrofitting virtualization is effectively a
rewrite of the render layer. The P1 render technology choice (React Flow vs a
virtualization-first canvas/WebGL approach like Sigma.js / react-force-graph / regl) MUST be
made against this constraint in `/design`. A naive full-DOM React Flow render of 1000+ nodes
janks; if React Flow is chosen it must be with virtualization/`onlyRenderVisibleElements`
configured from the start.

**Open decision for /design:** which render tech satisfies both the "clean UI" bar
(USABILITY-001) AND SCALE-001. This is the single most important P1 architecture decision.

## 6. Constraints & dependencies

- **graphify** (v0.9.4+) is a runtime dependency — provides AST extraction → graph.json,
  `--watch`/hooks, MCP. Adopted stock, not forked.
- `graph.json` is the stable interface between graphify and the atlas.
- Structural pipeline (graph.json, typing, render) is **token-free** (parsing, not LLM).

## 7. Traceability

Informal RTM (MVP tier): see `docs/requirements/RTM.md` — stories → ACs → (future) test files.

## 8. Out of scope (this SRS)

Reasons/decision-context synthesis, tradeoff-matrix rendering, agent-injection, C4/sequence
diagrams, onboarding tour. All recorded in `docs/SPEC.md`; specced in a later `/spec` pass.
