---
type: design-system
project: codebase-atlas
tier: mvp
date_updated: 2026-07-01
source: sdlc-engineer ui-ux-pro-max (v2.5.0) + Okabe-Ito accessible categorical palette
defines: USABILITY-001 (the "clean UI" quality bar)
---

# Codebase Atlas — Design System (USABILITY-001 bar)

The visual quality bar the P1 UI tasks (Shell, GraphCanvas, SearchBar, DetailPane) build
against. Aesthetic target: developer tool, dark, information-dense but clean —
Linear/Vercel-dashboard feel. Generated via `ui-ux-pro-max` + accessible categorical palette.

## Style

- **Dark Mode (OLED) only** for MVP. Deep slate background, high contrast, WCAG AAA.
- Minimal glow on emphasis; smooth 150–300ms transitions; visible focus rings always.
- SVG icons only (**Lucide**) — never emoji. Consistent stroke width (1.5px).

## Core color tokens (shadcn/tailwind CSS variables)

| Role | Hex | CSS var |
|---|---|---|
| Background | `#0F172A` | `--background` |
| Foreground | `#F8FAFC` | `--foreground` |
| Card/surface | `#1E293B` | `--card` |
| Muted | `#272F42` | `--muted` |
| Muted foreground | `#64748B` | `--muted-foreground` |
| Border | `#475569` | `--border` |
| Primary | `#1E293B` | `--primary` |
| Accent (run/active green) | `#22C55E` | `--accent` |
| Destructive | `#EF4444` | `--destructive` |
| Ring (focus) | `#22C55E` | `--ring` |

## Node-role palette (categorical, colorblind-safe — Okabe-Ito)

Node color encodes ROLE (from NodeTyper). Okabe-Ito is the documented colorblind-safe
categorical set; each pairs with an ICON so color is never the only signal
(`color-not-only` a11y rule).

| Role | Hex | Icon (Lucide) | Shape hint |
|---|---|---|---|
| entry-point | `#E69F00` (orange) | `LogIn` / `Play` | ring/halo — it's where things start |
| module | `#56B4E9` (sky) | `Package` | rounded square |
| interface | `#009E73` (green) | `Plug` | diamond |
| method | `#CC79A7` (mauve) | `Function` | small pill |
| leaf | `#94A3B8` (slate-muted) | `Dot` | plain node |

Rules: every node shows icon + label, not color alone. Node border brightens on focus/hover.
Role colors keep ≥3:1 contrast vs `--background` (large-glyph threshold).

## Gradient-opacity scale (search + focus — the US-003 core)

Search relevance and focus distance both map to node opacity as a **gradient, never binary**.

| matchScore / relevance | opacity | meaning |
|---|---|---|
| 1.0 (exact/focus) | `1.0` | full emphasis, slight glow |
| 0.7 (strong) | `0.85` | clearly visible |
| 0.4 (partial/fuzzy) | `0.55` | dimmed but readable |
| 0.15 (weak) | `0.30` | receding |
| 0.05 (floor) | `0.18` | **never below this** — nothing fully disappears (honest overlap) |

Opacity animates 150ms ease-out. Updates via node **style props only** — never remount
(ADR-001 / SCALE-001). Non-matches fade toward `--background`; matches gain opacity + a
1px `--accent` ring.

## Typography

- **Mono (labels, code, node names):** Fira Code — 400/500/600.
- **Sans (UI chrome, pane prose):** Fira Sans — 300/400/500/600.
- Type scale: 12 / 13 / 14 / 16 / 20 / 24. Node labels 13 mono. Pane body 14 sans.
- Tabular figures for any counts (fanIn/fanOut, neighbor counts).

## Layout — two-region shell

- **Left (graph canvas):** flex-1, fills viewport, dark canvas. React Flow.
- **Right (detail pane):** fixed ~360px, `--card` surface, `--border` left divider,
  resizable (shadcn `ResizablePanel`). Collapses on empty selection to a hint state.
- **Top:** thin toolbar — search input (left), node/edge count + role legend (right).
- 8px spacing rhythm. `min-h-dvh`. Focus rings `--ring` (2px) on all interactive elements.

## Interaction states

| Element | Default | Hover | Active/Selected | Disabled |
|---|---|---|---|---|
| Node | role color, icon+label | border brightens, `cursor-pointer` | `--accent` ring + opacity 1 | opacity floor |
| Search input | `--muted` bg | border `--border`→lighter | `--ring` focus ring | — |
| Neighbor (pane) | text `--foreground` | `--muted` bg | navigates (onSelect) | — |
| Pane empty | "Click a node to inspect" hint | — | — | — |

Press feedback ≤100ms. No layout shift on state change (opacity/color/ring only).

## Anti-patterns (avoid)

- Emoji as icons; raw hex in components (use tokens); light-mode default; binary
  show/hide on search (must be gradient); animating width/height (transform/opacity only);
  removing focus rings; color-only role encoding (always icon too).

## Pre-delivery checklist (USABILITY-001 acceptance)

- [ ] Dark OLED theme, tokens only (no raw hex in components)
- [ ] Node roles: distinct color + icon (colorblind-safe, not color-alone)
- [ ] Search = gradient opacity, floor 0.18, no node fully hidden, style-only update
- [ ] Two-region shell, resizable pane, 8px rhythm
- [ ] Lucide SVG icons, 1.5px stroke, consistent sizing
- [ ] Visible focus rings, cursor-pointer, 150–300ms transitions
- [ ] Contrast: text ≥4.5:1, node glyphs ≥3:1 vs background
- [ ] prefers-reduced-motion respected
