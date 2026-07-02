# ADR-003: Blast-radius source — graphify MCP `get_pr_impact` (primary) with direct `graph.json` reverse-edge traversal fallback

**Date:** 2026-07-01
**Status:** Accepted

## Context

Phase 2 (SPEC §8) requires "select → reverse-deps highlight (graphify MCP `get_pr_impact`)".
The atlas already holds the full `TypedGraphModel` (nodes + edges) in memory from `graph.json`,
so reverse-deps (upstream dependents — nodes whose edges point TO the selected node, transitively)
can be computed by a pure-Core reverse-edge BFS with **zero external dependency**. The SPEC
nonetheless names the MCP as the source, and the same MCP is intended to wire into
sdlc-engineer's `/modify` (SPEC §8) — so consistency between the atlas UI and the `/modify`
consumer argues for MCP. The collision: MCP may be unavailable (graphify not running its MCP
server, offline, timeout), and MCP may carry query semantics beyond static reverse-edge
traversal (transitive closure nuance, change-diff-aware impact) that a naive BFS does not.

## Decision

Use **graphify MCP `get_pr_impact` as the primary blast-radius source**, with **direct
`graph.json` reverse-edge traversal (`reverseDepsFromGraph`) as the fallback** when MCP is
unavailable. The atlas's `BlastRadiusClient` (Input adapter, sole MCP touchpoint) tries MCP
first; on any failure (no server, call throws, **3s timeout**, **malformed response**,
**ids not in model**) it falls back to the pure-Core `reverseDepsFromGraph`. The result
carries `source: 'mcp' | 'graph-fallback'` so the UI shows provenance (AVAIL-002). Core's
`BlastRadius` type is source-agnostic — neither the renderer nor the pane knows which path
produced it. **Empty result** (zero dependents — leaf node) is rendered as a "No upstream
dependents" empty state with the source badge still shown (F7), never a missing-section
crash. **Empty graph** (zero nodes) is rendered as an empty-canvas state (AVAIL-003).

## Options considered

| Option | Pros | Cons |
| :--- | :--- | :--- |
| **MCP primary + graph fallback** (chosen) | Consistent with SPEC §8 and the future `/modify` wiring; richer MCP semantics when available; always-available fallback (AVAIL-002); Core stays source-agnostic via the `BlastRadius` type | Two code paths to maintain; fallback is slightly less rich than MCP (no change-diff awareness); MCP adds RPC latency on the hot path |
| MCP only (no fallback) | One path; maximal consistency with `/modify` | Fails closed when MCP unavailable — blast-radius silently missing, violating AVAIL-002; makes the atlas hard-depend on a running MCP server (breaks offline use) |
| Direct `graph.json` traversal only | Zero external dependency; always available; lowest latency; simplest | Diverges from SPEC §8 (MCP named); diverges from the `/modify` consumer (which uses MCP) — two different blast-radius definitions; loses any MCP query semantics; the atlas and `/modify` could disagree on impact |

## Consequences

**Positive:**
- SPEC §8 honored (MCP is the named source) without sacrificing availability (AVAIL-002).
- The atlas UI and the future `/modify` consumer share the same canonical blast-radius
  interface (`get_pr_impact`) — one definition of "impact", not two.
- `BlastRadius.source` makes the fallback honest and visible, not a silent degradation.
- Core (`reverseDepsFromGraph`, `BlastRadius` type) is reusable and testable with no MCP.

**Negative / tradeoffs accepted:**
- Two code paths (MCP call + fallback BFS). The fallback must stay semantically close to MCP's
  reverse-deps or the UI subtly changes on degradation. Documented: fallback = transitive
  reverse-edge BFS; MCP may add change-diff nuance — the difference is the provenance badge.
- MCP RPC latency on the select hot path. Bounded by MCP response time; fallback is sync and
  fast. Acceptable for a click-driven (not per-keystroke) interaction.
- The atlas now has a soft dependency on a running graphify MCP server for the "rich" path.
  This is the intended state — the fallback is the safety net, not the primary.

**Risks:**
- If MCP and fallback disagree materially on impact sets (e.g. MCP follows semantic edges the
  graph.json BFS misses), users see different blast-radius on MCP-up vs MCP-down. Mitigation:
  the `source` badge signals which; ADR-003 documents the fallback's transitive-reverse-edge
  semantics so the gap is known, not hidden.
- If MCP `get_pr_impact` changes shape (graphify version drift), `BlastRadiusClient` is the
  single adapter to update — Core and UI are insulated.

## Reversal cost: Low–Medium (bounded by the adapter boundary)

`BlastRadiusClient` is the sole MCP touchpoint (an Input adapter). Core's `BlastRadius` type
and `reverseDepsFromGraph` are source-agnostic. Switching the primary source (e.g. to a
different blast-radius service, or to fallback-only) is a change to `BlastRadiusClient`'s
dispatch, not a Core or UI rewrite — the same hedge that keeps ADR-001's renderer swappable
keeps ADR-003's blast-radius source swappable. Reversal becomes Medium only if consumers
(`GraphCanvas`, `DetailPane`) start branching on `source` beyond display — keep `source` a
display-only field to hold the line. The id-normalization layer (filtering MCP ids not
present in `model.nodes` / `model.edges`) and the malformed-response guard (rejecting
responses missing `impacted_ids`) belong to `BlastRadiusClient` + `reverseDepsFromGraph`,
not to consumers — keeping that boundary preserves the reversal cost.

**Revisit when:** MCP and fallback diverge enough that users lose trust in the badge (→
converge semantics or pick one), OR the `/modify` consumer wiring settles on a different
blast-radius interface (→ realign `BlastRadiusClient` to match, preserving Core).
