---
type: acceptance-criteria
project: codebase-atlas
tier: mvp
date_updated: 2026-07-01
---

# Acceptance Criteria — Codebase Atlas MVP (Gherkin)

## US-001 — Generate index (incl. running graphify)

```gherkin
Scenario: Produce a browsable graph from a codebase path
  Given a maintainer provides a path to a code repository
  And graphify is installed and runnable
  When they run the atlas generate command on that path
  Then graphify's AST extraction produces a graph.json
  And the atlas loads it and renders a graph of nodes and edges
  And the render completes without manual file editing

Scenario: graphify is missing
  Given graphify is not installed
  When the maintainer runs generate
  Then the atlas reports graphify is required with the install command
  And it does not crash or produce a partial graph
```

## US-002 — Typed graph

```gherkin
Scenario: Nodes are typed by role from edge relations
  Given a loaded graph.json with edge relations (imports/calls/inherits/contains)
  When the atlas computes node types
  Then each node has a derived role (entry-point | module | interface | method | leaf)
  And the role is computed deterministically with no LLM call
  And nodes are visually distinguished by role in the graph
```

## US-003 — Gradient search

```gherkin
Scenario: Search brightens matches and fades non-matches by relevance
  Given a rendered graph with all nodes visible at default opacity
  When the developer types a query in the search box
  Then nodes matching the query increase in emphasis (opacity/contrast)
  And non-matching nodes decrease toward the background as a gradient
  And no node is fully removed from view
  When the developer clears the query
  Then all nodes return to default opacity

Scenario: Search stays responsive on large graphs (ties to SCALE-001)
  Given a rendered graph of 1000+ nodes
  When the developer types a query
  Then only affected nodes update
  And the update does not trigger a full re-render of all nodes
```

## US-004 — Detail pane

```gherkin
Scenario: Clicking a node populates the detail pane
  Given a rendered graph
  When the developer clicks a node
  Then a side pane shows the node's label, source file, source location, and derived role
  And the pane lists the node's direct neighbors
  When the developer clicks a neighbor in the pane
  Then the selection moves to that neighbor and the pane updates
```

## US-005 — Clean UI (visual bar deferred to /design)

```gherkin
Scenario: Interface uses a consistent design system
  Given the atlas UI is rendered
  Then all interactive elements use design-system components (no raw/unstyled elements)
  And layout is a stable two-region shell (graph canvas + detail pane)
```

## US-007 — One command

```gherkin
Scenario: One command goes from repo to rendered atlas
  Given a code repository path and graphify installed
  When the maintainer runs a single generate-and-serve command
  Then graphify runs, graph.json is produced, and the UI serves the rendered graph
```
