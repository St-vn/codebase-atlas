---
type: requirements
project: codebase-atlas
tier: mvp
phase: P3
tags: [docs-internal, requirements, acceptance-criteria, codebase-atlas]
date_updated: 2026-07-01
---

# Acceptance Criteria — Codebase Atlas Phase 3 (Gherkin)

## US-011 — View decision-context tradeoff matrix

```gherkin
Scenario: Selecting a node with a bound decision context renders a terse tradeoff matrix
  Given a rendered atlas with a loaded typed graph
  And a complete decision-context entry bound to the selected node exists in the cache
  When the developer selects the node and opens the "reasons" tab in the right pane
  Then the pane renders a matrix with columns: options | chosen | discriminatingWhy | metric | consequence
  And the chosen option is marked
  And no cell exceeds the word cap (COST-002)
  And the render required no LLM call (cache hit, COST-001)

Scenario: A node with no bound decision context shows a graceful empty state
  Given a node with no bound decision-context entry
  When the developer opens the "reasons" tab
  Then the pane shows a "no decision context recorded for this node" state
  And it does not crash or render a partial matrix
```

## US-012 — Seal-test quality gate

```gherkin
Scenario: A complete matrix passes the seal-test
  Given a synthesized tradeoff matrix with a discriminating reason and metric
  When the seal-test runs with the chosen option hidden and 5 independent LLM runs
  Then the LLM picks the real chosen option in at least 4 of 5 runs (confidence >= 0.8)
  And the entry is marked complete

Scenario: A deliberately-thin control entry is blocked by the seal-test
  Given a matrix entry with a generic reason and no discriminating metric
  When the seal-test runs
  Then the LLM picks the real chosen option in fewer than 4 of 5 runs (mid-confidence)
  And the entry is marked incomplete
  And the gate names the missing discriminating tradeoff

Scenario: Incomplete entries are blocked at authoring and CI
  Given an incomplete decision-context entry
  When the author runs the seal-test locally or CI runs it on a doc change
  Then the gate fails with a message naming the missing tradeoff
  And the incomplete entry is not rendered as a complete matrix in the pane
```

## US-013 — Cached and staleness-warned

```gherkin
Scenario: Matrices are synthesized once and served from cache by doc hash
  Given decision docs already synthesized into cached matrices
  When the developer opens the reasons pane for a bound node
  Then the matrix is served from cache with no LLM call
  And synthesis is not re-run for unchanged docs

Scenario: A changed decision doc marks its matrices stale and triggers regeneration
  Given cached matrices for a decision doc
  When the doc changes (hash mismatch) on refresh
  Then the bound matrices are marked stale
  And the pane shows a staleness warning with the last synthesis date-stamp
  And the next refresh re-synthesizes only the changed decision

Scenario: Age-stale matrices warn even without a doc change
  Given a matrix whose date-stamp is older than the review window
  When the developer opens the reasons pane
  Then the pane shows a "reasons stale - review decision docs" warning
```

## US-014 — Configurable decision-doc sourcing

```gherkin
Scenario: Decision docs are discovered at a configured path and joined per decision
  Given a target repo with locked and rejected decision docs at a configured directory
  When the maintainer runs synthesis
  Then the loader reads locked + rejected docs and joins them per decision title
  And produces one tradeoff matrix per decision bound to the relevant nodes

Scenario: Missing decision docs degrade gracefully
  Given a target repo with no discoverable decision docs
  When the maintainer runs synthesis
  Then the atlas reports "no decision docs found" with the searched patterns
  And the reasons pane shows an empty state (no crash, no partial matrices)

Scenario: Malformed decision docs are reported with the searched file path (no silent empty)
  Given a decision doc with one of: no H2 headings / title mismatch between locked and rejected / locked without rejected / rejected without locked
  When the maintainer runs synthesis
  Then the atlas reports the specific malformation with the searched file path
  And synthesis is skipped for that doc (no partial matrix, no silent empty result)
  And the reasons pane shows an empty state for the affected nodes (no crash)
```

## Cross-cutting — matrix validation (rejection criteria)

```gherkin
Scenario: A matrix with zero options is rejected at validation
  Given a synthesized matrix with options: []
  When validateMatrix runs
  Then it returns {ok: false, errors: [/no options/i]}

Scenario: A matrix whose chosen option is not in the options list is rejected
  Given a matrix with chosenOption: "Ghost" and options: ["A", "B"]
  When validateMatrix runs
  Then it returns {ok: false, errors: [/chosen.*not.*in.*options/i]}
```

## Cross-cutting — LLM / seal-test failure handling

```gherkin
Scenario: LLM failure during synthesis is reported, not crashed
  Given a configured LLM that throws / times out
  When the synthesizer runs
  Then it returns a defined error / Result (no uncaught exception)
  And the controller renders a "synthesis failed" state in the pane (no crash, no partial matrix)

Scenario: SealTestClient failure is recorded as a miss, not a crash
  Given a SealTestClient whose pickRealOption throws / returns null / returns an unknown option
  When the seal-test runs
  Then the run counts as a miss
  And the final result is a defined SealTestResult (confidence < 1.0 in that run)
  And the gate still produces a verdict (does not throw)
```

## Cross-cutting — cache corruption tolerance

```gherkin
Scenario: A corrupt matrix-cache.json resets to empty, not crash
  Given a .atlas/matrix-cache.json with invalid JSON
  When the app starts and MatrixCache.load runs
  Then the cache resets to empty
  And a warning is logged
  And the app continues (no crash, synthesis re-runs on next refresh)
```

## Cross-cutting — PaneTabs contract

```gherkin
Scenario: PaneTabs renders the 'reasons' tab with ReasonsPane content
  Given a PaneTabs instance with the reasons tab registered
  When the developer selects a node and ViewState.activeTab is 'reasons'
  Then PaneTabs renders the ReasonsPane content
  And clicking a different registered tab changes ViewState.activeTab

Scenario: Incomplete entries (sealTestResult.passed === false) render as incomplete, not as a complete matrix
  Given a DecisionContextEntry with sealTestResult.passed === false
  When the reasons pane renders the bound node
  Then the pane shows the "incomplete" state with the missingTradeoffHint
  And the matrix table is NOT rendered as a complete matrix
```
