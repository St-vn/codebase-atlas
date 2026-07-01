---
type: rtm
project: codebase-atlas
tier: mvp
date_updated: 2026-07-01
note: Informal RTM (MVP tier). Test-file column filled during /tasks + /implement.
---

# Requirements Traceability Matrix — Codebase Atlas MVP

| Story | Acceptance Criteria | NFRs touched | Phase | Tests (TBD) |
|---|---|---|---|---|
| US-001 Generate index | AC US-001 (2 scenarios) | PERF-003, AVAIL-001 | P0+P1 | — |
| US-002 Typed graph | AC US-002 | MAINT-001 | P0 | — |
| US-003 Gradient search | AC US-003 (2 scenarios) | PERF-002, SCALE-001 | P1 | — |
| US-004 Detail pane | AC US-004 | — | P1 | — |
| US-005 Clean UI | AC US-005 | USABILITY-001 | P1 | — |
| US-006 Codebase-agnostic adapter | (implied by US-001/002) | MAINT-001 | P0 | — |
| US-007 One command | AC US-007 | PERF-003 | P1 | — |

## Cross-cutting NFR coverage

| NFR | Covered by | Notes |
|---|---|---|
| PERF-001 render | US-002, US-004 | ≤200 nodes p95 < 2s |
| PERF-002 search | US-003 | < 100ms/keystroke |
| PERF-003 generation | US-001, US-007 | token-free, < 60s |
| **SCALE-001 large graphs** | **US-003 (scenario 2)** | **Load-bearing; render-tech choice in /design must satisfy virtualization from start** |
| USABILITY-001 | US-005 | Visual bar → /design (ui-design / ui-ux-pro-max), DEFERRED, flagged |
| AVAIL-001 | US-001 (missing-graphify scenario) | graceful failure |
| SEC-001 | US-004 | locations not secret values; local-only |
| MAINT-001 | US-002, US-006 | codebase-agnostic |

## Open items carried to /design

1. **Render technology** satisfying USABILITY-001 (clean) AND SCALE-001 (virtualization to 1000+ nodes) — the single most important P1 decision.
2. **Visual quality bar** for USABILITY-001 — define via `ui-design` or `ui-ux-pro-max`.
3. Node-typing rules (edge-relation → role mapping) — algorithm detail.
