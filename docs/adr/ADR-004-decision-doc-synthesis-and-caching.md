# ADR-004: Configurable decision-doc path with per-decision LLM synthesis and doc-hash caching

**Date:** 2026-07-01
**Status:** Accepted

## Context

Codebase Atlas is standalone — it must source decision-context from ANY target repo, not
just aede. SPEC §6 names the join: locked (chosen) + rejected (alternatives) per decision,
synthesized into terse tradeoff matrices. aede has excellent decision docs
(`docs-internal/design-decisions/{locked,rejected,deferred}.md`, many with quantified
tradeoffs) — one instance of a convention, not the universal layout. SPEC §8b flags P3 as
the FIRST token-costing phase: synthesis is one-time per decision, cached, terse. The
strategy must be project-agnostic (MAINT-002), bound the token cost (COST-001), and never
re-synthesize unchanged docs. The LLM must be swappable without touching Core.

## Decision

1. **Sourcing:** a configurable decision-docs directory, discovered by default search
   patterns (`docs-internal/design-decisions/`, `docs/adr/`, `docs/decisions/`) under the
   target repo root; overridable by config. aede's path is one instance. Missing docs
   degrade gracefully (empty state, no crash — US-014). **Malformed docs** (no H2 headings /
   title mismatch between locked and rejected / locked without rejected / rejected without
   locked) are reported with the searched file path (never silent empty).
2. **Synthesis:** per-decision LLM call joining locked + rejected by decision title into a
   `TradeoffMatrix`. The LLM lives behind an injected `LLMClient` interface; Core imports no
   SDK. **Concrete adapter in `src/adapters/llmClient.ts`** (HTTP to configured endpoint,
   API key + opt-in from config/env, timeout via `AbortController`, error handling — no
   hardcoded URLs, no telemetry). Prompt instruction: "compress words, never reasoning"
   (COST-002). **Synthesis is gated on `opt-in === true`** (SEC-002). LLM failure / timeout
   returns a defined error Result (no crash, no partial matrix).
3. **Caching:** `MatrixCache` (class) keyed by decision id, with `sourceDocHash` stored on
   each entry. `get(id, hash)` returns the entry ONLY on hash match. `put(entry)` **refuses
   entries with `sealTestResult.passed === false`** (QUAL-001 enforcement). `load(filePath)`
   resets to empty + logs warning on corrupt JSON (does NOT throw). Persisted to
   `.atlas/matrix-cache.json`. Regeneration happens ONLY on doc-hash change (COST-001).
   Cache hit means render is token-free. **No parallel `docHashByDecisionId` map — single
   source of truth on the entry itself.**
4. **Staleness:** `src/core/staleness.ts` exports the **generic `checkStaleness(stamped,
   input): StalenessResult`** (P3 defines; P5 imports — see `docs/CROSS-PHASE-CONTRACT.md`
   §5). P3's decision-doc staleness calls `checkStaleness({hash: sourceDocHash, date:
   synthesizedAt}, {currentHash, ageDaysWindow})`. A thin `stalenessOf` wrapper is kept
   for P3's own call sites. `TradeoffMatrix.id` is a **stable slug derived from the
   decision title** — canonical key for P5 `TourStep.reasonRef`; same decision doc ⇒ same
   `id` (deterministic).
5. **Authoring + CI:** the gate is exposed as `bin/seal-test.ts` (authoring CLI) and
   `.github/workflows/seal-test.yml` (CI on doc change) — ADR-005's dual-site gate is
   built.

## Options considered

| Option | Pros | Cons |
| :--- | :--- | :--- |
| **Configurable path + per-decision synth + doc-hash cache** (chosen) | Project-agnostic; bounded one-time cost; free render on cache hit; LLM swappable; regenerates only what changed | Markdown heading-join is heuristic; a cache file must be committed or regenerated per repo |
| Convention-only auto-discovery + batch synthesis (one big call) | One LLM call total; simpler cache | One bad/long decision blows the context window; no per-decision retry; harder to cache partially; ties success to one prompt |
| Hand-authored matrices (no LLM) | Zero tokens; full author control | Doesn't scale to many decisions; defeats the "synthesize from existing docs" intent; every repo's authors must hand-write matrices — high friction |

## Consequences

**Positive:**
- Project-agnostic (MAINT-002): aede is one configured instance, not hardcoded.
- Token cost is bounded and one-time (COST-001): one synth per decision per doc-hash; cache
  hit makes the right pane token-free; only changed decisions re-synthesize on refresh.
- The LLM is an interface (`LLMClient`) — swapping provider/model is a one-file change in
  the adapter, Core untouched. Reversal stays cheap.
- Graceful missing-docs (US-014): repos without decision docs get an empty state, not a crash.

**Negative / tradeoffs accepted:**
- Joining locked + rejected by H2 heading is a heuristic; repos with non-standard doc layouts
  need a project-specific parser (open item, SRS-P3 §9).
- A cache file (`.atlas/matrix-cache.json`) must be committed per repo or regenerated on
  clone — a small workflow cost.
- The LLM cost is real (first token-costing phase); bounded but non-zero.

**Risks:**
- A decision doc with no H2 headings yields no decisions; the loader reports this with the
  searched file path (not silently empty). Same for title mismatches and locked/rejected
  pairing.
- Hash collisions (sha8) — acceptable for a local cache; upgrade to sha16 if ever an issue.
- LLM failure / timeout — handled via the `Result` return type from `synthesizeDecision` and
  a defined "synthesis failed" UI state; no crash, no partial matrix.
- Corrupt cache file — `MatrixCache.load` resets to empty + logs warning; the app continues,
  synthesis re-runs on next refresh.

## Reversal cost: Low–Medium

The three pieces are independently swappable: the loader path is config; the LLM is an
interface; the cache is a file. Swapping any one leaves the others intact. The Core types
(`TradeoffMatrix`, `DecisionContextEntry`) are stable across all three options — the
artifact shape does not change if we later switch to batch synthesis or hand-authoring.

**Revisit when:** a target repo's decision docs don't fit the heading-join convention (→ add
a project-specific parser behind the same loader interface); or LLM cost becomes prohibitive
(→ batch synthesis, or fall back to hand-authored matrices for stable decisions);
or opt-in is rarely granted in practice (→ consider a local-only heuristic synthesis
behind the same `LLMClient` interface).
