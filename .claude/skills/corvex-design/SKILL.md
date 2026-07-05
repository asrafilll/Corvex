---
name: corvex-design
description: Corvex design system — Linear-like density, shadcn/ui from @repo/ui, base-mira purple theme (shadcn preset b5x0FmNlI). Use when building or styling any UI in apps/platform or apps/admin — new pages, components, dialogs, tables, badges, status colors, spacing, dark mode.
---

# Corvex Design

Linear-inspired: dense, quiet, keyboard-fast. Neutral surfaces; purple only where attention belongs.

Style locked 2026-07-05: user picked "Variant A — Linear Dense" from the 5-way `/prototype-styles` bake-off (dark three-pane, compact rows, violet accent) over document / dashboard / terminal / soft-studio directions. Layout rules below encode that choice.

## Theme

Tokens live in `packages/ui/src/styles.css` (`:root` + `.dark`). Canonical values from shadcn preset `b5x0FmNlI` ("base-mira") are in [THEME.md](THEME.md) — apply/verify against that file, never invent color values. Key facts:

- Base: neutral. Primary: purple `oklch(0.491 0.27 292.581)` light / `oklch(0.432 0.232 292.759)` dark.
- `--radius: 0.45rem` (preset overrides template's 0.625rem).
- Dark mode = `.dark` class on root. Every screen must look right in both modes — use token classes (`bg-background`, `text-muted-foreground`), never hardcoded colors.

## Components

- Import ONLY from `@repo/ui/components/*` (57 components exist — check before building anything custom). Never import Radix directly, never add another component library.
- Icons: `lucide-react` only, default `size-4` (`size-3.5` inside badges/table rows).
- Toasts: `sonner`. Empty states: `empty.tsx`. Loading: `skeleton.tsx`/`spinner.tsx`.
- `cn()` from `@repo/ui/lib/utils` for conditional classes.

## Density & layout

- Body text `text-sm`; secondary metadata `text-xs text-muted-foreground`. Page titles `text-lg font-semibold` — nothing larger inside the app shell.
- Pages: existing sidebar shell (`modules/app-shell`). Page = sticky header row (title left, actions right, `h-12 border-b px-4`) + content `px-4 py-4`. Full-width; no centered max-width containers for list/detail views.
- Tables/lists: compact rows (`py-2`), hover `hover:bg-muted/50`, whole row clickable for navigation.
- Project detail = three-pane: app sidebar | main content (`min-w-0 flex-1`) | right properties rail (`w-64 border-l px-4 py-4 text-xs`). Rail = label/value metadata pairs (label `text-muted-foreground`, value beneath) — customer, budget, paid `text-emerald-600 dark:text-emerald-400`, outstanding `text-amber-600 dark:text-amber-400` — then compact milestone checklist and masked secret list. No card grid on project detail; the rail replaces it.
- Detail header = breadcrumb row (`h-12 border-b px-5`): parent crumb muted / name / status pill, due date pushed right.
- Section headers (task groups, rail sections): `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground` + muted count.
- Task lists: flat dense rows, never cards. Grouped by status (In Progress → Todo → Done). Row = `h-8 items-center gap-2.5` in a `divide-y border-y` list: priority dot left, title, due date right `text-xs text-muted-foreground`. Done rows `text-muted-foreground line-through`.
- Cards elsewhere (dashboard, settings): `gap-4` grid, one `Card` per domain section, `CardTitle` = `text-sm font-medium`.
- Create = `Dialog` with short form; edit = inline where cheap (status `Select`, checkbox toggles), dialog otherwise. Forms: `field.tsx` + zod, labels above inputs, one column.

## Color discipline

- Surfaces stay neutral. Purple (`primary`) only: primary buttons, active nav item, focus rings, selected states.
- Semantic status colors (the only non-token colors allowed; always pair with dark variant):

| Meaning | Classes |
|---|---|
| Project Lead / Task Todo | `text-muted-foreground` (neutral) |
| Active / InProgress | `text-violet-600 dark:text-violet-400` |
| OnHold | `text-amber-600 dark:text-amber-400` |
| Completed / Done | `text-emerald-600 dark:text-emerald-400` |
| Cancelled | `text-muted-foreground line-through` |
| Priority Urgent | `text-red-600 dark:text-red-400` |
| Priority High | `text-orange-600 dark:text-orange-400` |
| Priority Medium/Low/None | `text-muted-foreground` |

- Status rendered as `Badge` variant `outline` with a colored dot (`size-1.5 rounded-full`), not filled colored badges. Exception — project status pill in the detail header uses a subtle tint: `border-violet-500/40 bg-violet-500/10 text-violet-700 dark:text-violet-300` (swap hue per the status table).
- Task priority in rows = leading dot only (`size-2 rounded-full`), no text label: Urgent `bg-red-500`, High `bg-orange-400`, Medium `bg-yellow-400`, Low `bg-sky-400`, None `bg-muted-foreground/40`.
- Money: `tabular-nums`; outstanding > 0 neutral, overdue/negative `text-red-600 dark:text-red-400`.

## Voice

- UI copy through `@repo/i18n` keys, never hardcoded strings.
- Short labels, sentence case ("Add task", not "Add New Task!"). Destructive confirms via `alert-dialog` stating the object name.
- Secrets render masked `••••••••` until explicit Reveal; auto-rehide after ~30s; never toast a secret value.
