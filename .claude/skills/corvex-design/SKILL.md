---
name: corvex-design
description: Corvex design system — Linear-like density, shadcn/ui from @repo/ui, base-mira purple theme (shadcn preset b5x0FmNlI). Use when building or styling any UI in apps/platform or apps/admin — new pages, components, dialogs, tables, badges, status colors, spacing, dark mode.
---

# Corvex Design

Linear-inspired: dense, quiet, keyboard-fast. Neutral surfaces; purple only where attention belongs.

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
- Cards on detail pages: `gap-4` grid, one `Card` per domain section (customer, budget, milestones, …), `CardTitle` = `text-sm font-medium`.
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

- Status rendered as `Badge` variant `outline` with a colored dot (`size-1.5 rounded-full`), not filled colored badges.
- Money: `tabular-nums`; outstanding > 0 neutral, overdue/negative `text-red-600 dark:text-red-400`.

## Voice

- UI copy through `@repo/i18n` keys, never hardcoded strings.
- Short labels, sentence case ("Add task", not "Add New Task!"). Destructive confirms via `alert-dialog` stating the object name.
- Secrets render masked `••••••••` until explicit Reveal; auto-rehide after ~30s; never toast a secret value.
