# ADR-005: Seal-test quality gate at authoring + CI with confidence >= 0.8 (4 of 5 runs)

**Date:** 2026-07-01
**Status:** Accepted

## Context

SPEC §6 defines the quality gate for a decision-context entry: an entry is complete iff an
LLM given ONLY that entry picks the real choice for the DISCRIMINATING reason at high
confidence. Generic-reason / mid-confidence means incomplete means capture the missing
tradeoff. The gate is automatable in CI and authoring. Validated evidence (SPEC §6): the
test caught a deliberately-thin control entry; the httpx matrix scored 75%. SPEC §1 notes
the httpx matrix was "one line short of 4/4" — i.e., 75% is the benchmark for "nearly
complete, needs one more tradeoff." We need a concrete threshold and a decision on where the
gate runs.

## Decision

The seal-test runs at **authoring-time** (the local CLI `bin/seal-test.ts` the author/curator
runs after editing decision docs) AND in **CI on doc change** (the GitHub Actions workflow
`.github/workflows/seal-test.yml` that calls the same CLI on doc-change PRs). The LLM is
given the entry with the chosen-option marker HIDDEN and must pick the chosen option from
the discriminating reason. **5 independent runs**; the entry passes iff the LLM picks the
real chosen option in **>= 4 of 5 runs (confidence >= 0.8)**. Below threshold means
incomplete means the gate names the missing tradeoff (`missingTradeoffHint`) and CI blocks.
The LLM lives behind an injected `SealTestClient` interface; Core imports no SDK. A
concrete adapter lives in `src/adapters/sealTestClient.ts` (HTTP, config, timeout — same
SEC-002 posture as ADR-004's `llmClient`).

**Failure tolerance:** `SealTestClient.pickRealOption` returning `null` / throwing / returning
an option not in the matrix are all counted as a **miss**, not a crash. The seal-test
always returns a defined `SealTestResult` and `gateEntry` always returns a verdict.

## Options considered

| Option | Pros | Cons |
| :--- | :--- | :--- |
| **Authoring + CI, threshold 0.8 (4/5)** (chosen) | Catches thin entries at write time AND blocks regressions in CI; 5 runs is cheap; 4/5 tolerates one stochastic miss; httpx's 75% sits just below — correctly flagged "one line short" | 5 LLM calls per entry at authoring/CI (bounded, not at render); threshold tuned to one validated data point |
| Authoring-time only | Fast author feedback; no CI cost | No regression guard — a doc edit could silently thin a matrix post-merge |
| CI only | Blocks bad merges; no local setup | Slow author loop (find out only on push); no local authoring aid |
| Threshold 1.0 (5/5) | Strictest | Flaky on LLM stochasticity — one noisy run fails a good entry |
| Threshold 0.6 (3/5) | Tolerant | Lets generic reasons through; contradicts the "high confidence" bar |

## Consequences

**Positive:**
- Automatable, dual-site gate (QUAL-001): thin entries blocked at write time and in CI.
- The 0.8 threshold is faithful to the validated data: the thin control entry scored well
  below; httpx at 75% is correctly flagged as "nearly complete — add one discriminating
  tradeoff," which is exactly the gate's job (SPEC §1: httpx was one line short).
- Stored on the entry (`sealTestResult`) — completeness is part of the artifact, so the pane
  never renders an incomplete matrix as complete.
- The `SealTestClient` interface makes the seal-test model swappable without touching Core.

**Negative / tradeoffs accepted:**
- 5 LLM calls per entry at authoring/CI (not at render — render is cache-only, COST-001).
- Threshold is calibrated to one validated data point (httpx + the thin control); may need
  tuning as more entries are tested.

**Risks:**
- LLM stochasticity: a good entry might fail 2/5 by chance. Mitigation: 4/5 tolerates one
  miss; re-run on a borderline fail.
- A category of entries passes 0.8 with a reason that is discriminating-but-wrong (picks the
  real choice for the wrong reason). The gate tests discriminating power, not correctness —
  author review still required.
- LLM failure / `null` return: counted as a miss (handled — not a crash). The gate still
  produces a verdict; CI blocks.

## Reversal cost: Low

The threshold (0.8), run count (5), and gate location (authoring CLI + CI) are each a single
constant/config. Swapping any one leaves the `SealTest` orchestration and `SealTestResult`
shape intact.

**Revisit when:** a category of entries routinely passes 0.8 but reads as generic (→ raise
threshold or add a second signal); or 5-run stochasticity is too noisy (→ increase to 7
runs, threshold 5/7 ≈ 0.71 — a different tradeoff, revisit deliberately).
