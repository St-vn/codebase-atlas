---
type: requirements
tags: [docs-internal, requirements, codebase-atlas]
date_updated: 2026-07-01
status: spec-draft
phase: P2
---

# Codebase Atlas — Software Requirements Specification (Phase 2: focus+context + blast-radius)

Produced via sdlc-engineer `/spec` (MVP tier). Scoped to P2 per `docs/SPEC.md` §8: "Gradient
focus (dim by distance), select → reverse-deps highlight (graphify MCP `get_pr_impact`). Wire
the same MCP into `/modify`." Extends the MVP SRS (`docs/requirements/SRS.md`, P0+P1) — does
not restate or contradict it.

## 1. Purpose & scope

P2 adds two interaction layers on top of the P1 index MVP, both reusing the existing gradient
opacity primitive (the "ONE mechanism" property, SPEC §4):

1. **Focus+context by graph distance.** Pick a focus node (or cluster); its neighborhood
   brightens, the rest fades by a gradient derived from BFS graph distance. Nothing is removed
   (honest overlap, SPEC §4). Same 0..1 → opacity mapping as search. The CLICK action triggers
   MVP flow C (`ViewportPolicy` recomputes the mount set around the click, ≤ cap); the FOCUS
   GRADIENT recompute (`focusScores` / `combinedOpacity` after mount settles) is **style-only,
   no remount** (contract §7). This two-phase split resolves the MVP contradiction flagged by
   `/audit-spec` (F1).
2. **Blast-radius on select.** Selecting a node highlights its reverse-deps (upstream
   dependents — what a change to that node would impact) via graphify MCP `get_pr_impact`,
   with a graceful fallback to direct `graph.json` reverse-edge traversal when MCP is
   unavailable. Distinct visual channel from the focus gradient (no collision).

Selection couples focus and blast-radius: `select(id)` triggers BOTH (contract §9); `clearFocus()`
clears BOTH (AC US-009 scenario "Clearing focus also clears blast-radius").

**Atlas-side only.** The "Wire the same MCP into `/modify`" clause (SPEC §8) is an
sdlc-engineer/aede consumer concern, NOT a Codebase Atlas deliverable. The atlas exposes
blast-radius via its UI; the `/modify` consumer wiring is tracked as an open item (§6).

## 2. Actors

Reused from MVP SRS §2 (Maintainer, Developer, Agent). No new actor.

| Actor | Role in P2 |
|---|---|
| Maintainer | (unchanged) |
| Developer | Drives focus + reads blast-radius to judge change impact. |
| Agent (LLM) | Still a deferred consumer. The `/modify` agent-side wiring of `get_pr_impact` is out of atlas scope (open item). |

## 3. User stories (P2)

**Must-have (INVEST):**
- **US-008** — Focus+context gradient by graph distance. Selecting/focusing a node brightens
  its BFS neighborhood and fades the rest by distance, reusing the search gradient's 0..1 →
  opacity mechanism. No node fully disappears (floor 0.18). Cross-ref US-009: selection
  triggers BOTH focus and blast-radius (contract §9).
- **US-009** — Blast-radius / reverse-deps highlight on select. Selecting a node highlights
  its upstream dependents (reverse-deps) via graphify MCP `get_pr_impact`, with fallback to
  direct graph traversal when MCP is unavailable. Visually distinct from the focus gradient.
  Cross-ref US-008: the same `select` action drives both; `clearFocus` clears both.

**Should-have:**
- **US-010** — Focus a cluster, not just a node. Focus may be seeded by a set of nodes (e.g. a
  community), not only a single node. SPEC §4 names "focus node/cluster"; same `FocusPolicy`
  mechanism, seed set instead of singleton. The MVP-default gesture is **shift-click**
  multiple nodes → seed set (contract §12); the BFS distance is the minimum over seeds. This
  unblocks P4's declared cluster-selection dependency.

**Deferred (recorded, not in P2):** reasons/tradeoff pane (P3), C4/sequence representation
switch (P4), onboarding tour (P5), agent-injection consumer wiring (`/modify`).

## 4. Acceptance criteria (Gherkin)

See `docs/requirements/acceptance-criteria-P2.md` (US-008, US-009, US-010). Includes the
contract-driven scenarios: multiply/AND combine (contract §8), two-phase focus pipeline
(contract §7), select=focus+blast coupling (contract §9), shift-click cluster gesture
(contract §12), and the empty-blast leaf UI (F7) and focus-on-unmounted re-centering (F9).

## 5. Non-functional requirements

Continues ID numbering from the MVP SRS §5 table (PERF-001..003, SCALE-001, USABILITY-001,
AVAIL-001, SEC-001, MAINT-001).

| ID | Category | Requirement |
|---|---|---|
| PERF-004 | Performance | Focus-gradient recompute (BFS distance over mounted set + combine with matchScores) p95 < 100ms for ≤200 mounted nodes on a typical dev laptop. |
| AVAIL-002 | Availability | Blast-radius degrades to `graph.json` reverse-edge traversal when graphify MCP is unavailable; provenance (`source: mcp \| graph-fallback`) shown in the UI; never crashes. |
| USABILITY-002 | Usability | Blast-radius highlight uses a non-opacity channel (edge stroke emphasis + node ring) distinct from the focus gradient's opacity channel, so the two compose without visual collision. |
| AVAIL-003 | Availability | Empty graph (zero nodes) renders an empty-canvas state with a "No nodes to display" message; no crash (F16). |

**Reused from MVP (still load-bearing in P2):**

| NFR | P2 relevance |
|---|---|
| SCALE-001 | Focus gradient operates on the **mounted** set (already capped by `ViewportPolicy`); focus MUST NOT expand the mount set beyond the cap. Re-styles mounted nodes only — no remount. **Two-phase pipeline (contract §7):** the CLICK action re-runs MVP flow C and may bring new nodes into the mount set (still ≤ cap); the FOCUS GRADIENT recompute then runs style-only over the resulting mounted set. |
| USABILITY-001 | Blast-radius visual treatment follows DESIGN-SYSTEM (Okabe-Ito roles, `--accent` for emphasis, 150–300ms transitions, no emoji). |
| AVAIL-001 | MCP-unavailable is a new graceful-degradation case (→ AVAIL-002); the existing graph.json-missing path is unchanged. |
| MAINT-001 | `FocusPolicy` and `reverseDepsFromGraph` are pure Core, codebase-agnostic; `BlastRadiusClient` is the sole MCP touchpoint (adapter). |
| SEC-001 | Blast-radius shows structural impact (node ids/edges) only; no source content leaves the machine. |

### 5.1 PERF-004 — focus-gradient latency (LOAD-BEARING for UX)

Focus change is not per-keystroke (unlike PERF-002 search), so the latency tolerance is equal
but the recompute is heavier (BFS + combine). The bound (< 100ms for ≤200 mounted nodes) keeps
focus feel as snappy as search. BFS is O(V+E) over the **mounted** subset, not the full graph —
the mount cap (SCALE-001) is what keeps this bounded. `computeFocusScores` signature
(contract §10): `computeFocusScores(model, seedIds, mountedIds: Set<string>, opts)` — BFS
traverses only edges where BOTH endpoints are in `mountedIds`. If focus ever operated on the
full unmounted graph, PERF-004 would break on 1000+ nodes; the invariant "focus styles mounted
nodes only" is the hedge.

## 6. Constraints, dependencies & open items

**Dependencies on P1 (must be shipped first):**
- `TypedGraphModel`, `AtlasNode`, `AtlasEdge`, `ViewState` (incl. `matchScores`, `mountedIds`).
- `ViewportPolicy` mount-capping (SCALE-001) — P2 reuses it unchanged.
- `GraphCanvas` (React Flow output adapter), `SearchBar` (matchScores source), `SelectionState`.
- React Flow remains the sole output adapter (ADR-001). No second renderer.

**Constraints:**
- graphify MCP `get_pr_impact` is the SPEC-named blast-radius source (SPEC §8). Direct
  `graph.json` traversal is the fallback. The choice is documented in ADR-003.
- The focus gradient and the search gradient are ONE mechanism (SPEC §4): both are `Map<id,
  0..1>` → opacity via the DESIGN-SYSTEM scale, combined multiplicatively with floor 0.18
  (contract §8). `combineGradients` is variadic: `combineGradients(...scores, floor = 0.18)`
  reducing via `max(floor, product)` (contract §11). P3/P4 may add further gradient inputs —
  the variadic shape is the extension point.
- The MCP `get_pr_impact` call has a 3s timeout (F5); on timeout, malformed response (F6), or
  ids-not-in-model (F11), the adapter falls through to `reverseDepsFromGraph` with
  `source: 'graph-fallback'` (AVAIL-002).
- Selecting a leaf (zero dependents) renders an honest empty state — no ring, no edge
  emphasis, no crash (F7). Selecting a node outside the current mount set triggers
  `ViewportPolicy` re-centering (≤ cap), then the focus gradient applies (F9).

**Open items (flagged for the lead's consolidation pass / later phases):**
1. **`/modify` consumer wiring (aede-side, NOT atlas-side).** The atlas exposes blast-radius in
   its UI; wiring `get_pr_impact` into sdlc-engineer's `/modify` skill is a separate aede
   concern. Tracked in `docs/SPEC.md` §9 ("exact integration surface with sdlc-engineer").
2. **Shared gradient mechanism across P2/P3/P4.** `combineGradients` is variadic
   (contract §11) and the `focusScores` / `combinedOpacity` slots in `ViewState` are
   introduced here; P3 (reasons) and P4 (representation switch) may add further gradient
   inputs. The combine function is the extension point — keep it the single combiner.
3. **Combine semantics: multiply (AND), not OR (contract §8).** When the focus gradient and
   the search gradient are both active, multiply applies. A node that is a strong match but
   far from focus dims toward the floor 0.18 — this is intentional (honest overlap, SPEC §4):
   relevance is judged on BOTH axes (match AND near-focus). Aligns AC US-008 scenario 2.
4. **Cluster-focus UX (US-010).** The mechanism (`focusSeedIds: Set`) is specced; the MVP
   gesture is **shift-click** multiple nodes → seed set (contract §12). The BFS distance is
   the minimum over seeds; click-order does not matter (set semantics). Other gestures
   (right-click community, pane button) may be added later — the mechanism is the invariant.
5. **Blast-radius pane placement (F15).** Blast-radius is rendered as a `DetailPane` section
   in P2 as an **interim placement**. When P3 introduces the right-pane tab model
   (`PaneTabs`, contract §2) and registers the `code` tab, blast-radius moves into the
   `code` tab. Task 10's section is the rendering substrate; the tab wrapper is P3's job.
   Keeping the placement interim avoids war with P3's `PaneTabs` ownership (contract §2).
6. **Cluster identity semantics (P2↔P4 interface, contract §18).** `view.selection.kind ===
   'cluster'` carries an id derived from the community of the first seed in the shift-clicked
   set. The P2 gesture assumes single-community multi-select — shift-clicking nodes across
   multiple communities is not supported in P2 (the BFS-distance union is still computed over
   the full seed set; only the identity is the first seed's community). Future phases may
   relax this by defining a synthetic cluster id for cross-community selections. P4 reads
   `selection.id` as a community number when `kind === 'cluster'`.

## 7. Traceability

Informal RTM (MVP tier). P2 rows are added to `docs/requirements/RTM.md` by the lead's
consolidation pass (stories US-008..010 → ACs → NFRs PERF-004/AVAIL-002/USABILITY-002/AVAIL-003
→ test files filled during `/tasks` + `/implement`). This SRS does not edit RTM.md.

## 8. Out of scope (this SRS)

Reasons/decision-context synthesis (P3), C4/sequence representation-switch (P4), onboarding
tour (P5), agent-injection consumer wiring, multi-user/distributed concerns (MVP tier — solo
local tool). All recorded in `docs/SPEC.md`.
