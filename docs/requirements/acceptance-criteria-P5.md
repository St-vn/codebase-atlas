---
type: requirements
tags: [docs-internal, requirements, acceptance-criteria, codebase-atlas]
date_updated: 2026-07-01
phase: P5
---

# Acceptance Criteria — Codebase Atlas P5 (Gherkin)

## US-018 — Start a tour and step through nodes in reading order

```gherkin
Scenario: A developer starts the tour and steps forward through the reading order
  Given a loaded atlas with a cached tour.json
  When the developer starts the tour
  Then the tour controller loads the tour and shows step 0
  And the index focuses the step 0 node (existing GraphCanvas, no second graph)
  When the developer advances to the next step
  Then the focus moves to the step 1 node in order
  And the step counter reflects the current position in the tour

Scenario: A developer steps backward and jumps to a specific step
  Given a tour in progress at step 3
  When the developer goes to the previous step
  Then the focus moves back to the step 2 node
  When the developer jumps to a step by id
  Then the focus moves directly to that step's node

Scenario: A tour step that references a deleted node is skipped gracefully (F9)
  Given a tour with a step whose nodeId is no longer in TypedGraphModel.nodes
  When the controller advances to that step
  Then the right pane shows a "node no longer exists" message
  And the controller advances to the next valid step
  And the tour does not crash

Scenario: A tour step whose reasonRef is not in P3's MatrixCache is shown a placeholder (F10)
  Given a tour step whose reasonRef is not in P3's MatrixCache (decision not yet synthesized)
  When the controller advances to that step
  Then the right pane shows a "reasons not yet synthesized" placeholder
  And the tour continues to the next step

Scenario: A tour step whose representationHint targets a tab P4 hasn't registered falls back to 'reasons' (F11)
  Given a tour step with representationHint='code' and the 'code' tab is not registered (P4 absent)
  When the controller advances to that step
  Then the active tab is set to 'reasons'
  And the tour continues normally

Scenario: A developer clicks a non-tour index node mid-playback (F13)
  Given a tour in progress at step 3
  When the developer clicks a non-tour index node
  Then the tour pauses
  And the index focus moves to the clicked node
  And the tour controller retains its position for resume
  When the developer clicks "resume tour"
  Then the tour resumes from the saved position
```

## US-019 — Tour step shows node + reasons + cross-link to index

```gherkin
Scenario: A tour step drives the right pane to show the node's reasons
  Given a tour step whose node has a P3 tradeoff matrix (reasonRef set)
  When the controller advances to that step
  Then the right pane's active tab is set to "reasons" (existing tab — no new tab invented)
  And the P3 tradeoff matrix for the referenced node is rendered
  And a terse step narrative is shown ("compress words, never reasoning")

Scenario: A tour step offers a cross-link back to the index
  Given a tour step with crossLinkToIndex enabled
  When the developer clicks "look it up in the index"
  Then tour mode exits
  And the index remains focused on the current step's node
  And the developer can browse the index freely from that node
```

## US-020 — Tour saved/loaded + staleness-warned

```gherkin
Scenario: A tour is saved to and loaded from tour.json alongside graph.json
  Given a curated tour
  When the serializer saves it
  Then a tour.json is written next to graph.json
  When the atlas loads on a later launch
  Then the tour is loaded from tour.json with no re-curation (COST-004)

Scenario: A stale tour is warned, not silently served
  Given a tour.json whose graphHash does not match the current graph.json
  When the atlas loads the tour
  Then a staleness warning is shown (reuse P3 FRESH-001 mechanism — checkStaleness)
  And the developer is offered a re-curate action

Scenario: A corrupt tour.json at app load degrades to no-tour mode (F14)
  Given a tour.json with malformed JSON or an unparseable schema
  When the app loads
  Then the app degrades to no-tour mode
  And the "new here? start the tour" cross-link is hidden
  And a non-blocking warning is shown to the user

Scenario: A tour with graphHash undefined is treated as fresh on first load (F15)
  Given a tour with metadata.graphHash undefined
  When checkTourStaleness is called
  Then it returns 'fresh' (no baseline to compare)
  And the tour is loaded without warning
  # Note: in practice curateTour stamps graphHash (F6) so this only happens for hand-authored tours
  # explicitly omitting the field. The check is defensive.
```

## US-021 — Index node → "new here? start the tour" cross-link

```gherkin
Scenario: A node in the index offers an entry point to the tour
  Given a rendered index with a cached tour.json
  When the developer selects a node that is the tour's first step
  Then the detail pane offers a "new here? start the tour" cross-link
  When the developer clicks it
  Then the tour controller starts the tour at step 0
  And the index focus follows the tour steps
```
