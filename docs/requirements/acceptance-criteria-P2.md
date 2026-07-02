---
type: requirements
tags: [docs-internal, requirements, acceptance-criteria, codebase-atlas]
date_updated: 2026-07-01
phase: P2
---

# Acceptance Criteria — Codebase Atlas Phase 2 (Gherkin)

Declarative scenarios for US-008, US-009, US-010. Mirrors `acceptance-criteria.md` format.
Extends the MVP ACs — does not modify US-001..US-007 scenarios.

> **§7 Cross-ref (focus action two-phase pipeline, contract §7).** The CLICK action
> triggers MVP flow C (`ViewportPolicy` recomputes the mount set, ≤ cap); the FOCUS
> GRADIENT recompute is style-only, no remount. The mounted set is the substrate the
> gradient is computed over.
>
> **§9 Cross-ref (select = focus + blast coupling, contract §9).** US-008 (focus) and
> US-009 (blast-radius) are coupled via the selection action: `select(id)` triggers BOTH
> focus (US-008) and blast-radius (US-009); `clearFocus()` clears BOTH. ACs below make
> this explicit.

## US-008 — Focus+context gradient by graph distance

```gherkin
Scenario: Focusing a node brightens its neighborhood and fades the rest by distance
  Given a rendered graph with a focusable node
  When the developer focuses a node
  Then the focused node and its BFS neighborhood increase in emphasis as a gradient by graph distance
  And nodes beyond the neighborhood fade toward the background as a gradient
  And no node is fully removed from view (opacity floor 0.18)
  And the update changes node style props only, never remounting the canvas

Scenario: Focus gradient composes with search gradient via one mechanism (multiply / AND, contract §8)
  Given the developer has an active search query and then focuses a node
  Then each node's opacity reflects both its search match strength and its focus distance
  And a node that is a strong match AND near focus is brightest
  And a node that is a weak match AND far from focus is dimmest (at floor 0.18, still present)
  And a node that is a strong match but far from focus dims to the floor (intentional honest overlap)
  And no node's opacity falls below 0.18

Scenario: Clearing focus restores the search-only gradient
  Given a graph with an active focus and an active search query
  When the developer clears the focus
  Then opacities return to the search-gradient values alone
  And no remount occurs

Scenario: Focusing an unmounted node re-centers the mount set, then applies the gradient (contract §7)
  Given a focus target that is outside the current mount cap
  When the developer clicks it
  Then ViewportPolicy re-centers the mount set on the new focus (size ≤ cap)
  And the focus gradient is computed over the re-centered mounted set
  And the gradient applies as style-only updates — no full-canvas remount

Scenario: Selecting a node triggers BOTH focus and blast-radius (contract §9)
  Given a rendered graph
  When the developer selects a node
  Then the focus gradient updates for that node (US-008)
  And the blast-radius is fetched and rendered (US-009)
  And both are driven by the same selection action

Scenario: A single click sets view.selection to a node-typed discriminator (contract §18)
  Given the developer clicks a node
  When select() runs
  Then view.selection.kind === 'node'
  And view.selection.id === clickedNodeId
```

## US-009 — Blast-radius / reverse-deps highlight on select

```gherkin
Scenario: Selecting a node highlights its upstream dependents via MCP
  Given a rendered graph with graphify MCP available
  When the developer selects a node
  Then the node's reverse-deps (upstream dependents) are fetched via MCP get_pr_impact
  And those dependents receive a distinct highlight (edge stroke emphasis + node ring)
  And the highlight uses a non-opacity channel so it does not collide with the focus gradient
  And the detail pane indicates the blast-radius source as MCP

Scenario: Blast-radius degrades gracefully when MCP is unavailable
  Given graphify MCP is not available
  When the developer selects a node
  Then the atlas falls back to direct graph.json reverse-edge traversal
  And the dependents are highlighted as above
  And the detail pane indicates the blast-radius source as fallback
  And the atlas does not crash or omit the blast-radius

Scenario: Blast-radius and focus gradient compose without collision
  Given a selected node with both an active focus gradient and an active blast-radius
  Then the focus gradient controls node opacity
  And the blast-radius controls edge stroke and node ring
  And a reverse-dep that is far from focus is dimmed by opacity but still shows its blast ring
  And a non-reverse-dep near focus is bright but shows no blast ring

Scenario: Clearing focus also clears blast-radius (contract §9)
  Given a selected node with an active blast-radius
  When the developer clears the focus
  Then the blast-radius is also cleared
  And the detail pane no longer shows a blast-radius section
  And no reverse-dep ring or edge emphasis remains

Scenario: Selecting a leaf node (zero dependents) renders an honest empty state (F7)
  Given a selected node that is a leaf (zero upstream dependents)
  When the developer selects it
  Then the detail pane shows "No upstream dependents"
  And no blast ring or edge emphasis is rendered
  And the source badge still shows provenance (MCP or graph-fallback, AVAIL-002)
  And the atlas does not crash
```

## US-010 — Focus a cluster, not just a node

```gherkin
Scenario: Focusing a set of nodes brightens the union neighborhood
  Given a rendered graph and a set of seed nodes (e.g. a community)
  When the developer focuses that cluster
  Then the focus gradient is computed from the union of BFS distances from all seeds
  And nodes near any seed brighten; the rest fade by distance
  And no node is fully removed (floor 0.18)
  And the same FocusPolicy mechanism is used as for a single-node focus

Scenario: Cluster-focus via shift-click multi-select gesture (contract §12)
  Given the developer shift-clicks nodes X and Y in any order
  When the focus-seed set is {X, Y}
  Then the focus gradient is computed from both seeds
  And for any node N, its BFS distance to the seed set is the minimum distance to X or Y
  And the result is the same regardless of click order (set semantics)

Scenario: A shift-click multi-select sets view.selection to a cluster-typed discriminator (contract §18)
  Given the developer shift-clicks nodes X and Y, both in community C
  When selectCluster() runs
  Then view.selection.kind === 'cluster'
  And view.selection.id === C (the community of the first seed)
```
