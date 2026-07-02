---
type: requirements
tags: [docs-internal, requirements, acceptance-criteria, codebase-atlas]
date_updated: 2026-07-01
phase: P4
---

# Acceptance Criteria — Codebase Atlas Phase 4 (Gherkin)

Mirrors `docs/requirements/acceptance-criteria.md` format. Covers US-015, US-016, US-017
(canonical IDs per `docs/CROSS-PHASE-CONTRACT.md` §1).
US-017 scenario "Cross-boundary dependencies are shown, not hidden" is the §4 honesty
property — load-bearing.

## US-015 — View a C4 container diagram for a selected cluster

```gherkin
Scenario: Selecting a cluster renders a C4 container diagram in the structure tab
  Given a rendered atlas with a loaded typed graph
  When the developer selects a cluster (community) in the graph
  Then the right pane shows a "structure" tab
  And the structure tab renders a C4 container diagram (Mermaid) for that cluster
  And the diagram draws a boundary around the cluster
  And member nodes appear as containers inside the boundary

Scenario: C4 diagram is derived without an LLM call
  Given a loaded typed graph (graph.json + NodeTyper output)
  When the C4 container diagram is derived for a selected cluster
  Then the derivation uses only deterministic graph traversal
  And no LLM or network call is made in the pipeline

Scenario: Selecting an empty cluster renders an honest empty-boundary state
  Given a typed graph with a cluster that has no member nodes
  When the developer selects that cluster
  Then the structure tab renders a C4 diagram with an empty boundary (zero containers)
  And the diagram is non-crashing and shows a labeled empty subgraph or "empty cluster" placeholder
  And crossBoundaryDeps is an empty list (honesty = accurate, not fabricated)
```

## US-016 — View a sequence/flow diagram for a behavior path

```gherkin
Scenario: Selecting an entry point renders a sequence diagram in the behavior tab
  Given a rendered atlas with a loaded typed graph
  When the developer selects an entry-point node (or any node with a call path)
  Then the right pane shows a "behavior" tab
  And the behavior tab renders a sequence/flow diagram (Mermaid) tracing the call path
  And the diagram is a PATH from start to end (ordered messages, not a region)

Scenario: Sequence threads through overlap without cutting it
  Given a call path that crosses multiple clusters
  When the sequence diagram is derived
  Then the path includes messages across cluster boundaries
  And no cluster is cut out or hidden to make the path isolate

Scenario: Selecting an entry point with no call path renders an honest empty-sequence state
  Given a typed graph with an entry-point node that has no outgoing calls
  When the developer selects that entry point
  Then the behavior tab renders a sequenceDiagram with a single participant and an explicit "no calls" Note
  And messages.length === 0 and truncated === false (the render is honest, not silent)
  And the render is non-crashing

Scenario: A cyclic call path is terminated safely without revisiting nodes
  Given a typed graph with a cyclic call path (A -> B -> C -> A)
  When the sequence diagram is derived from entry A
  Then no node appears twice in steps
  And the path terminates when no unvisited successors remain
  And truncated is false if the cycle is fully traversed
```

## US-017 — Cross-boundary dependencies are shown, not hidden (§4 HONESTY PROPERTY)

```gherkin
Scenario: Cross-boundary dependencies are shown, not hidden
  Given a selected cluster that has dependencies crossing its boundary
  When the C4 container diagram is derived and rendered
  Then each cross-boundary dependency appears as an explicit external arrow
  And the arrow is labeled with the target and the relation (it NAMES the leak)
  And no cross-boundary dependency is omitted or silently absorbed into the boundary

Scenario: Cross-boundary arrows are visually distinct from in-boundary edges
  Given a rendered C4 diagram with both in-boundary and cross-boundary edges
  Then the cross-boundary external arrows are visually distinguishable
  And they point to a node or label outside the boundary
  And a cluster with zero cross-boundary edges renders an empty leak set (honesty is accurate, not fabricated)

Scenario: Honesty is preserved under LOD (>50-node subsystem)
  Given a selected cluster with 200+ member nodes
  When the C4 diagram is derived with maxContainers = 50
  Then at most 50 containers are emitted
  And an "...and K more" collapse container is present
  And crossBoundaryDeps lists ALL cross-boundary edges regardless of cap (LOD does not compromise honesty)
```
