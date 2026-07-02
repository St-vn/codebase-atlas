---
type: requirements
project: codebase-atlas
tier: mvp
scope: P3 (reasons pane)
tags: [docs-internal, requirements, codebase-atlas]
date_updated: 2026-07-01
status: spec-draft
phase: P3
---

# Codebase Atlas — Software Requirements Specification (Phase 3: Reasons Pane)

Produced via sdlc-engineer `/spec` (MVP tier). Scoped to P3 — the "reasons" layer. Adds
decision-context tradeoff matrices per node/cluster, synthesized from the target project's
decision docs, with a seal-test quality gate. Depends on P1 (index + node selection);
independent of P2 (focus+context/blast-radius). P2 stories US-008..010 are reserved; P3
starts at US-011 to avoid collision.

**First token-costing phase** (SPEC §8b): all prior phases (graph.json, typing, render,
search) are token-free. P3 introduces one LLM-backed component (the synthesizer) — one-time
per decision, cached, terse.

## 1. Purpose & scope

Render the *why*: per major architectural decision bound to a node/cluster, a terse tradeoff
matrix — options ║ chosen ║ discriminating why ║ metric ║ consequence (SPEC §6). "Compress
words, never reasoning." **Single consumer: the human reads the matrix in the right pane.**
The host project's agent may consume the synthesized matrix artifact (e.g.
`.atlas/matrices.json`) via its own `build_system_prompt` — that is an **open integration
surface, not a P3 deliverable** (boundary noted, not built).

## 2. Actors

| Actor | Role in P3 |
|---|---|
| Maintainer | Runs synthesis; refreshes matrices when decision docs change. |
| Developer | Reads tradeoff matrices in the right pane to reach judgment. |
| Author/Curator | Authors/curates decision docs; runs `bin/seal-test.ts` at authoring time; resolves incomplete entries. |
| Agent (LLM) | (Out of P3 scope.) May consume the synthesized matrix artifact via the host's `build_system_prompt` — integration surface, not built by the atlas. |

## 3. User stories (P3, INVEST)

**Must-have:**
- **US-011** — View the decision-context tradeoff matrix for a selected node/cluster in the right-pane "reasons" tab.
- **US-012** — Seal-test quality gate: incomplete entries (generic reason / mid-confidence) are blocked at authoring and CI.
- **US-013** — Reasons are cached (doc-hash keyed) and staleness-warned when decision docs change or age past the review window.

**Should-have:**
- **US-014** — Decision docs are sourced from a configurable path (project-agnostic); missing docs degrade gracefully.

**Deferred (recorded, not in P3):** agent-injection via `build_system_prompt` (host-project concern), P4 representation switch, P5 onboarding tour (reuses reasons).

## 4. Acceptance criteria (Gherkin)

See `docs/requirements/acceptance-criteria-P3.md` (US-011..US-014).

## 5. Non-functional requirements

| ID | Category | Requirement |
|---|---|---|
| **COST-001** | **Cost** | **See §5.1 — load-bearing. One-time LLM synthesis per decision, doc-hash cached; regeneration only on doc change; cache hit = zero LLM calls at render.** |
| COST-002 | Cost | Terse matrices: each cell ≤ word cap (compress words, never reasoning); options ≤ N per matrix. |
| **FRESH-001** | **Freshness** | **See §5.1. Matrices date-stamped; staleness warned on doc-hash mismatch OR age past review window (default 90 days). Shared `checkStaleness` generic — P5 imports.** |
| **QUAL-001** | **Quality** | **See §5.1 — load-bearing. Seal-test: LLM given only the entry picks the real chosen option for the discriminating reason at confidence ≥ 0.8 (4/5 runs). Incomplete entries never rendered as complete.** |
| SEC-002 | Security | Decision-doc text egresses ONLY to the user-configured LLM endpoint (explicit opt-in); no other egress; no telemetry; config-only (no hardcoded URLs). |
| MAINT-002 | Maintainability | Decision-doc convention is project-agnostic; aede's `docs-internal/design-decisions/` is one configured instance, not hardcoded. |
| USABILITY-001 | Usability | (Reused from MVP.) UI follows DESIGN-SYSTEM (dark OLED, terse, tokens, Lucide). ReasonsPane / PaneTabs conform. |
| AVAIL-001 | Availability | (Reused from MVP.) Graceful degradation: missing decision docs, corrupt cache, LLM failure / timeout, malformed docs all show defined empty / error states — no crash, no partial matrix, no silent empty result. |

### 5.1 Load-bearing NFRs

**COST-001 — token cost is bounded and one-time.** P3 is the FIRST token-costing phase
(SPEC §8b). The synthesizer is the sole token-costing component. Invariants: (a) at most
one LLM synthesis call per decision per doc-hash; (b) cache hit at render makes the right
pane token-free; (c) per-decision input ≤ ~4k tokens, output ≤ ~1k tokens (terse). The
seal-test makes 5 short calls per entry at authoring/CI time — bounded, not at render.

**FRESH-001 — curated content is date-stamped and staleness-warned.** Structure
(graph.json) auto-refreshes via graphify (P0); reasons are curated and CAN drift. Every
`DecisionContextEntry` carries `synthesizedAt` (ISO date). Staleness triggers: (a)
`sourceDocHash` mismatch on refresh → "doc changed — regenerate"; (b) age > review window
→ "reasons stale — review decision docs". Warning shown in the pane; never silent drift.

**QUAL-001 — the seal-test gates completeness.** SPEC §6: an entry is complete iff an LLM
given ONLY the entry picks the real choice for the DISCRIMINATING reason at high
confidence. Threshold: **≥ 0.8 (4 of 5 independent runs)**. Validated evidence (SPEC §6):
the test caught a deliberately-thin control entry; the httpx matrix scored 75% — just
below the 0.8 bar, correctly flagging it as "one line short" (SPEC §1). Runs at authoring
(local CLI) AND in CI on doc change. Below threshold ⇒ incomplete ⇒ warn + name the
missing tradeoff; CI blocks. Generic-reason / mid-confidence entries do not render as
complete matrices.

## 6. Constraints & dependencies

- **Depends on P1:** `TypedGraphModel` + `AtlasNode` ids + `community` ids + `SelectionState`
  (`focusId`) — matrices bind to these. `ViewState.activeTab: TabId` is introduced by P3 and
  set by the controller (P5's `TourController` SETS it via the existing mechanism).
- **Independent of P2:** P3 can ship before or after focus+context/blast-radius.
- **LLM dependency:** a user-configured LLM endpoint + API key + explicit opt-in flag
  (config file or env). The synthesizer + seal-test are behind injected `LLMClient` /
  `SealTestClient` interfaces with concrete adapters in `src/adapters/`. Synthesis is
  GATED on `opt-in === true` (no call, no egress without opt-in). Mockable for tests; no
  hard dependency on a specific provider in Core.
- **Decision-doc convention:** configurable directory; default search patterns
  `docs-internal/design-decisions/{locked,rejected,deferred}.md`, `docs/adr/`, `docs/decisions/`.
  aede is one instance. Malformed docs (no H2 headings / title mismatch / locked without
  rejected / rejected without locked) are reported with the searched file path — never
  silently empty.
- **Right-pane tab model:** P3 owns the chrome (`PaneTabs`); P3 registers the `reasons`
  tab; P4's `RepresentationContent` registers `behavior`/`structure` via the
  `TabRegistration` API. `PaneTabs` exports `TabId` and `TabRegistration` for P4/P5 to
  import. `code` tab content is future (P2 blast-radius section is the substrate).

## 7. Traceability

Informal RTM (MVP tier). P3 rows to be appended to `docs/requirements/RTM.md` by the lead
during consolidation. Stories → ACs (`acceptance-criteria-P3.md`) → (future) test files per
the P3 task plan.

## 8. Out of scope (this SRS)

- Agent-injection via the host project's `build_system_prompt` (atlas produces the matrix
  artifact; the host consumes it — open integration surface, not built by the atlas).
- P4 representation switch (C4 container / sequence-flow Mermaid) — P4's
  `RepresentationContent` registers `behavior`/`structure` tabs into P3's `PaneTabs`.
- P5 onboarding tour (reuses reasons via `TourStep.reasonRef` → `TradeoffMatrix.id`).
- Hand-authoring matrices as the primary path (it is an ADR-004 fallback option, not the
  chosen synthesis strategy).

## 9. Open items

1. **LLM model + provider** for synthesis and seal-test — user config (config file or
   env: endpoint, API key, opt-in flag); default for the first build TBD (pick a cheap,
   fast model for the seal-test's 5 runs). Synthesis is gated on `opt-in === true`.
2. **Decision-doc convention for non-aede repos** — auto-discovery heuristics beyond the
   default search patterns; project-specific parsers.
3. **Matrix artifact export** — whether the atlas exposes `.atlas/matrices.json` for the
   host's `build_system_prompt` to consume (likely yes; the export shape is the integration
   boundary; the agent-export is a host-side concern, not P3's deliverable).
4. **Right-pane tab chrome** — RESOLVED: `PaneTabs` (P3 owns) wraps `DetailPane`. P3
   registers the `reasons` tab; P4 registers `behavior`/`structure` via `TabRegistration`.
