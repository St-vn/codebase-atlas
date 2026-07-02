---
type: internal-doc
tags: [docs-internal, design, codebase-atlas]
date_updated: 2026-07-01
status: design-complete
status_detail: MVP (P0+P1) shipped. P2-P5 designed + /audit-spec verified. Ready for /implement.
---

# Codebase Atlas — Spec

**A standalone tool.** Works on any codebase; serves sdlc-engineer as a consumer (e.g.
blast-radius for `/modify`, decision-context injection for `/decide` and `/design`). Not
coupled to any one project — aede is the first target, not the home.

A clean, React-app-quality UI for understanding a codebase: an **index** (the whole
picture — browsable typed graph) and a thin **onboarding** path (a curated tour) layered
on top of it. Backend is stock **graphify**; frontend is custom (React + shadcn/ui +
React Flow) reading graphify's `graph.json`. Purpose: let both a human AND an LLM reach
CTO/tech-lead judgment about a codebase — the *what* (structure) and the *why*
(decisions/tradeoffs).

## Contents
- 1. Goal & non-goals
- 2. The two deliverables (index vs onboarding)
- 3. Architecture (backend / data / frontend)
- 4. The overlap problem and how we sidestep it
- 5. Node typing (deterministic, edge-derived)
- 6. Decision-context (the "reasons" content)
- 7. Frontend stack & UI
- 8. Phased build
- 9. Open items

---

## 1. Goal & non-goals

**Goal.** Understand an unfamiliar (or your own drifted) codebase well enough to make
sound architecture decisions. Two reader states, two products: browse the whole system
(index) and learn it in order (onboarding). Serve both a human and an LLM — decision-context
injected into the agent grounds vibe-coding in the codebase's real decisions.

**Non-goals.** Not rebuilding graphify's extraction/graph-DB/MCP (adopt stock). Not a
force-directed hairball (proven useless for teaching). Not spaced-repetition flashcards
(weak fit for code). Not "diagrams that teach by themselves" (diagrams carry structure,
never reasons).

**Established facts driving this spec** (from 2026-07-01 investigation):
- graphify v0.9.4 already does extraction, `graph.json`, `--watch`, git hooks, MCP
  (`get_node/get_neighbors/get_pr_impact`), and force/tree/callflow HTML. Its human output
  is REFERENCE/LOOKUP, not onboarding (flat report, no reading order, no reasons).
- Its frontend is a monolithic vis-network f-string template — capable but hostile to fork.
  `graph.json` is the clean seam to build a custom frontend on.
- Onboarding is THIN and beat graphify's flat report in an httpx A/B (reading order + one
  flow trace + one tradeoff matrix). It REUSES index structure (communities→sections,
  god-nodes→"start here", betweenness→bridges, surprising-connections→tradeoff seeds).
- Terse tradeoff matrices preserve ~75% of judgment (httpx auth-generator decision: reader
  eliminated 3/4 options from the matrix alone; one line short of 4/4). Measurable via a
  seal-test (LLM given only the entry picks the real choice for the discriminating reason).

---

## 2. The two deliverables

**INDEX = the whole picture (superset).** Every node/edge, searchable, navigable,
blast-radius. The primary deliverable. graphify carries ~90% of the data; we build the UI.

**ONBOARDING = a curated PATH (subset).** Deliberately shows the load-bearing ~20%, in
order, with reasons. Thin. It is a *saved tour* through the index interface, not a separate
app. Cross-links with the index (index node → "new here? start the tour"; tour step → "look
it up in the index").

They share the `graph.json` backend and the same React frontend.

---

## 3. Architecture

```
graphify (STOCK — adopt, do not fork)
├─ extraction (ast + semantic) ──────────► graph.json   ← the clean interface
├─ --watch / git hooks ──────────────────► freshness (structure auto-updates)
└─ MCP server (get_pr_impact, neighbors) ─► blast-radius queries (wire into /modify)
                    │
                    ▼  graph.json (+ derived typing + decision-context)
Codebase Atlas frontend (CUSTOM — React + shadcn/ui + React Flow)
├─ LEFT: index graph — typed nodes, gradient focus+context, search
├─ RIGHT PANE: representation-switch for the selected node/cluster
│     • behavior → sequence/flow (a PATH — no overlap problem)
│     • structure → C4 container (honest bounded, cross-deps labeled)
│     • reasons → decision-context tradeoff matrix for this node
│     • code → source + blast-radius (reverse deps via MCP)
└─ TOUR MODE: onboarding — a saved ordered walk through nodes with reasons
```

**Freshness split** (deterministic vs curated):
- Structure (graph.json) → graphify `--watch`/hooks auto-regenerate. Never drifts silently.
- Reasons/tour (curated) → date-stamped, staleness-warned, human reviews periodically.

---

## 4. The overlap problem (and the sidestep)

Real code doesn't isolate: modules import across cluster boundaries; collapsing a cluster
leaves cross-edges dangling. Hard hierarchical drill-down ("clean C4 levels") is a lie for
real code. We do NOT force isolation. Instead:

- **Left graph — focus + context (degree-of-interest).** Nothing is removed. Pick a focus
  node/cluster; its neighborhood brightens, the rest fades by a GRADIENT (distance-from-focus).
  Cross-links that don't isolate stay visible — honest. Same gradient primitive as search
  (search fades by match-strength; focus fades by graph distance — ONE mechanism).
- **Right pane — switch representation, don't zoom the graph.** A sequence/flow diagram is a
  PATH (start→end), not a region — it threads through overlap without needing to cut it out.
  A C4 container diagram draws the boundary and shows cross-boundary deps as explicit labeled
  external arrows (names the leaks instead of hiding them). Both sidestep the graph-region
  isolation problem by changing representation.

Pane vs modal is UX only (the problem is in the representation, not the window). Use a **pane**
so the index stays visible beside the detail (dual-coding: spatial map + detail together).

---

## 5. Node typing (deterministic, edge-derived)

`graph.json` nodes carry only `community` (topological), `file_type: code`, label — NO
semantic type. But EDGE relations do: `imports_from, contains, method, uses, inherits, calls`.
Derive structural roles with a deterministic pass (no LLM needed):

| Role | Signal |
|---|---|
| Interface / base | many `inherits`-in |
| Container / module | has `contains` children |
| Entry point | high `calls`-in, low `calls`-out |
| Method vs class | `method` edge target |
| Leaf | zero dependents |
| Boundary (safety/trust) | matches known patterns (gate/hooks/auth/secrets) — convention |

Types drive node color + the semantic lens (show only auth-related subgraph, etc.). LLM
classification is OPTIONAL, only for human-readable cluster labels ("transport layer") —
and the decision-context layer supplies those anyway.

---

## 6. Decision-context (the "reasons")

The content that makes the atlas TEACH judgment, not just show structure. Per major
architectural decision: a **terse tradeoff matrix** — options side-by-side ║ chosen ║
discriminating why ║ metric ║ consequence. Compress words, never reasoning.

- **Source:** synthesize from the project's decision docs. aede already has excellent ones
  (`docs-internal/design-decisions/{locked,rejected,deferred}.md` — many with quantified
  tradeoffs). Join locked (chosen) + rejected (alternatives) per decision.
- **Quality gate (seal-test):** an entry is complete iff an LLM given ONLY that entry picks
  the real choice for the DISCRIMINATING reason at high confidence. Generic-reason/mid-confidence
  ⇒ incomplete ⇒ capture the missing tradeoff. Automatable in CI/authoring. (Validated: this
  test caught a deliberately-thin control entry; the httpx matrix scored 75%.)
- **Dual consumer:** rendered in the right pane (human) AND injected into the agent on
  `/decide` `/modify` `/design` (LLM) via aede's `build_system_prompt` mechanism.

---

## 7. Frontend stack & UI

Requirement: clean, React-app-quality UI (not a raw vis-network dump).

- **React + shadcn/ui** — a STANDALONE app (its own repo). shadcn/ui keeps it clean and
  matches the user's existing design taste; not coupled to any consuming project.
- **React Flow** for the graph — best DX for CLEAN custom typed nodes + pane-friendly layout.
  (Alternatives considered: raw vis-network = graphify's look, too utilitarian; cytoscape =
  strong but heavier custom-node styling. React Flow wins on "clean UI + typed nodes".)
- Components: graph canvas (left), detail pane (right, tabbed: behavior/structure/reasons/code),
  search bar (gradient highlight), tour controller (onboarding). State: selection, focus,
  gradient, active representation.

---

## 8. Phased build

- **Phase 0 — data adapter.** Read graphify `graph.json`; run the deterministic node-typing
  pass; expose a clean typed model to the frontend. (Prove on httpx's graph.json.)
- **Phase 1 — index MVP.** React Flow graph, typed-colored nodes, search with GRADIENT
  highlight, click → right pane showing node info + neighbors + code. The "whole picture,
  clean UI" core.
- **Phase 2 — focus+context + blast-radius.** Gradient focus (dim by distance), select →
  reverse-deps highlight (graphify MCP `get_pr_impact`). Wire the same MCP into `/modify`.
- **Phase 3 — reasons pane.** Render decision-context tradeoff matrices per node/cluster.
  Build the synthesizer (locked+rejected → matrices) + seal-test gate.
- **Phase 4 — representation switch.** Right-pane C4 container + sequence/flow diagrams
  (Mermaid) for selected subsystem. Reuse graphify callflow where useful.
- **Phase 5 — onboarding tour.** Saved ordered walk (reading order) through nodes with reasons.
  Thin — reuses everything above.

Ship each phase; Phase 1 alone is already better than graphify's HTML for browsing.

---

## 8b. Cost model — effort & tokens

**Token cost by stage (the key property: the structural half is token-free).**

| Stage | Feeds on | Token cost |
|---|---|---|
| `graph.json` (structure) | AST parse of code | **FREE** — pure parsing. graphify's AST pass; built httpx's 144-node graph with zero tokens. |
| graphify semantic edges | docs/comments (LLM) | costs tokens, but **OPTIONAL** — code-only corpus skips it ("fast path"). aede is mostly code → near-free. |
| Node typing | graph.json edge relations | **FREE** — deterministic pass (imports/calls/inherits/contains patterns). |
| Blast-radius | graph.json / MCP query | **FREE** — graph query. |
| Frontend (index, search, gradient, pane) | graph.json + typing | **FREE** — it's a UI. |
| Reasons / tradeoff matrices | project decision docs | **COSTS tokens** — LLM synthesizes locked+rejected → matrices. One-time per decision, cached, terse. |
| Onboarding tour reading-order | graph + reasons | **small tokens** — LLM curates order once, cached. |

Net: index + typing + blast-radius + graph UI = **token-free** (structure comes from parsing,
not the LLM). Only *reasons* and *tour curation* cost tokens — one-time, cached, small.

**Build effort (real React app, not a script).**

| Phase | Effort |
|---|---|
| P0 adapter (graph.json → typed model) | ~0.5 day (typing script mostly exists) |
| P1 index MVP (React+shadcn+React Flow: typed graph, gradient search, click→pane) | ~2-4 days — the real work; the "clean UI" bar is where time goes |
| P2 focus+context + blast-radius | ~1-2 days |
| P3 reasons pane (synthesizer + seal-test + render) | ~1-2 days |
| P4 representation switch (C4 + sequence Mermaid) | ~1-2 days |
| P5 onboarding tour | ~1 day |

P0+P1 ≈ **3-5 focused days** for a usable thing that already beats graphify's HTML for
browsing. Full vision ≈ ~2 weeks focused. P1 is make-or-break (clean React Flow graph +
typed nodes + gradient + pane). Cheapest proof: P0 + minimal P1 on httpx's existing
graph.json (~1-2 days) before committing to full UI polish.

## 9. Open items

- graphify version pinning (0.9.4+) and how the atlas invokes/refreshes it.
- Whether onboarding "tours" are hand-authored, LLM-drafted + human-curated, or both.
- Exact integration surface with sdlc-engineer (which skills consume the atlas — /modify for
  blast-radius, /decide + /design for decision-context injection).
