# Codebase Atlas

A standalone tool that turns any codebase into an interactive, clean UI for **understanding**
it — not just navigating it. It serves [sdlc-engineer](https://github.com/St-vn/sdlc-engineer)
as a consumer (blast-radius for `/modify`, decision-context for `/decide` and `/design`).

Two deliverables, one graph backend:

- **Index** — the whole picture: a browsable, typed dependency graph with gradient search,
  focus+context, and a detail pane.
- **Onboarding** (later phase) — a thin curated *tour* through the index: reading order +
  the reasons (decisions/tradeoffs) behind the architecture.

Purpose: let both a **human** and an **LLM** reach CTO/tech-lead judgment about a codebase —
the *what* (structure, extracted token-free from source) and the *why* (decisions/tradeoffs).

## Status

Early. MVP (P0 adapter + P1 index) is spec'd, designed, and task-broken under `docs/`.
Built by dogfooding sdlc-engineer on itself.

## How it works

```
codebase ──► graphify (AST parse, token-free) ──► graph.json
                                                      │
                              ┌───────────────────────┘
                              ▼
        Codebase Atlas (React + shadcn/ui + React Flow)
        ├─ typed graph (roles derived from edge relations)
        ├─ gradient search (fade by relevance, never binary)
        ├─ focus + context (dim by graph distance — no fake isolation)
        └─ detail pane (node info + neighbors, later: reasons/blast-radius)
```

## Stack

React + TypeScript + Vite + shadcn/ui + React Flow. Vitest for tests. Backend: stock
[graphify](https://github.com/safishamsi/graphify) (v0.9.4+).

## Docs

- `docs/SPEC.md` — full design notes
- `docs/requirements/` — SRS, acceptance criteria, RTM
- `docs/design/` — architecture, design system
- `docs/adr/` — architecture decisions
- `docs/plans/` — TDD task breakdown

## License

MIT
