# ADR-002: Use shadcn/ui with Base UI primitives (not Radix)

**Date:** 2026-07-01
**Status:** Accepted

## Context

The spec (SPEC, ADR-001, DESIGN-SYSTEM, tasks) called for "shadcn/ui" for the chrome
(Shell, SearchBar, DetailPane) but did not specify the underlying primitive library.
shadcn components are built on a primitive library — historically Radix UI. As of the
shadcn CLI v4 (2026), you can choose **Base UI** (`@base-ui-components/react`, the MUI-team
successor to MUI Base) instead of Radix, via `npx shadcn init --base base` — same component
API and markup, different primitives underneath.

The project owner's stack preference is **Base UI, not Radix**. The initial build wrongly
pulled Radix (the CLI default `--base radix`), which must be corrected.

## Decision

Use **shadcn/ui with Base UI primitives**: `components.json` / init configured with
`--base base`, so installed components import from `@base-ui-components/react` rather than
`@radix-ui/*`. We keep shadcn's component API + Tailwind styling (matching DESIGN-SYSTEM
tokens); only the primitive layer is Base UI.

## Options considered

| Option | Pros | Cons |
| :--- | :--- | :--- |
| **shadcn + Base UI** (chosen) | Owner's preferred primitive; shadcn API + Tailwind unchanged; official CLI support (`--base base`) | Newer path than Radix; slightly less community tooling |
| shadcn + Radix (CLI default) | Most common, most examples | NOT the owner's stack — rejected |
| Hand-rolled Tailwind (no lib) | No dependency | Fails USABILITY-001 "consistent design system"; what the first build wrongly did |

## Consequences

**Positive:**
- Matches the owner's stack; components accessible + consistent; Tailwind/token layer intact.
- shadcn's copy-in model means the primitive is swappable later if needed.

**Negative / tradeoffs:**
- Must remove the Radix components + deps already added by mistake, re-add with `--base base`.

**Risks:**
- Base UI API differs from Radix in places (e.g. Dialog/Popover parts) — component code from
  Radix examples won't copy 1:1; use the Base UI variant from the shadcn registry.

## Reversal cost: Low

shadcn components are copied into `src/components/ui/` — swapping the primitive is re-adding
components with a different `--base`, not a rewrite. The app components consume the shadcn
API, insulated from the primitive choice.

**Supersedes** the implicit "shadcn = Radix" assumption in ADR-001 / DESIGN-SYSTEM.
