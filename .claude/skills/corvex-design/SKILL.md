---
name: corvex-design
description: Corvex design system — black-and-white editorial interface with Linear-like density, readable Space Grotesk typography, selective hard black shadows, and a saturated blue-purple accent. Use when building or styling any UI in apps/platform — new pages, components, dialogs, tables, badges, status colors, spacing.
---

# Corvex Design

Black-and-white editorial skin on a Linear-dense skeleton: pure white canvas, near-black ink, soft gray structure, selective hard black shadows, one saturated blue-purple accent, and Space Grotesk everywhere. Layout stays dense, readable, and keyboard-fast. When accent appears, it is confident and high-contrast rather than a faint tint.

Style history: "Variant A — Linear Dense" (dark, violet) was locked 2026-07-05; superseded 2026-07-20 by a cream neo-brutalist pass, then refined from user references into the current direction. Layout and typography improvements survive, the canvas is mandatory white, and black outlines/hard shadows are allowed only on focal surfaces. Decorative stickers and ornamental excess do not survive.

## Theme

Tokens live in `packages/ui/src/styles.css` (`:root` + `.dark` + `@theme inline`). Canonical values are in [THEME.md](THEME.md) — apply/verify against that file, never invent color values. Key facts:

- Platform forces `forcedTheme="light"`; the application background is always pure white, while the app shell sidebar is ink black.
- Base: white `oklch(1 0 0)`; neutral ink foreground `oklch(0.18 0 0)`. Primary = ink. Highlight = saturated blue-purple `oklch(0.55 0.26 277)`.
- `--border` and `--input` are soft gray. Default surfaces use one-pixel borders.
- Shadows are hard black offsets with no blur. They are reserved for focal surfaces: selected navigation, the unlock card, primary data frames, black summary panels, and overlays. Routine cards, task groups, note cards, and form fields stay flat.
- `--radius: 0.625rem` — cards `rounded-xl`, controls `rounded-md/lg`.
- Font: `Space Grotesk Variable` (self-hosted via `@fontsource-variable/space-grotesk`, imported in styles.css). Headings bold + tracking-tight via base layer.
- Focus ring and text selection = blue-purple (`--ring` / `--highlight`).

## Component rules

- Routine surfaces (Card, Select, inputs, tabs list, checkbox, switch) use `border border-border`. Avoid stacking bordered cards inside bordered cards.
- Buttons: default = ink fill with a small hard shadow; secondary = blue-purple fill with white text and a small hard shadow; outline = flat white; ghost/link stay flat. No sticker-like press translations.
- Badges may use blue-purple where state needs attention; neutral metadata stays outline.
- Checked/selected states (checkbox, switch, active sidebar item, active tab) = blue-purple fill with an ink border.
- Focal frames may use `border-foreground shadow-sm/md`; ordinary content must not. Do not add gradients, glassmorphism, decorative rotated shapes, or ornamental borders. Use whitespace and typography first.
- Never stack consecutive divider lines. A page header, tab band, and content region should not each draw their own border; use spacing and a muted fill to group them, then keep the ink border/shadow on the selected control.

## Components

- Import ONLY from `@repo/ui/components/*` (57 components exist — check before building anything custom). Never import Radix directly, never add another component library.
- Icons: `lucide-react` only, default `size-4` (`size-3.5` inside badges/table rows).
- Toasts: `sonner`. Empty states: `empty.tsx`. Loading: `skeleton.tsx`/`spinner.tsx`.
- `cn()` from `@repo/ui/lib/utils` for conditional classes.

## Density & layout

- Primary app content uses `text-base`; secondary metadata uses `text-sm text-muted-foreground`. Page titles are `text-3xl font-bold tracking-tight`. Type must stay comfortably readable even in data-heavy views.
- Pages: existing sidebar shell (`modules/app-shell`). Page = header row (title left, actions right, `min-h-20 border-b bg-card px-6 py-4`) + content `px-6 py-6`. Full-width; no centered max-width containers for list/detail views.
- Sidebar navigation uses an ink-black surface and always pairs white labels with `lucide-react` icons. Navigation rows are at least `h-11 text-[15px]`; the active item is blue-purple with white text and a subtle white border. It stays flat because a black hard shadow disappears against the sidebar.
- Tables/lists: place primary data tables in a `border-foreground bg-card shadow-md` frame, use a black header band with white text, `text-base` data, and rows around `py-3.5`. Hover with `hover:bg-accent`; keep the whole row clickable for navigation.
- Project detail is a single full-width workspace with top-level tabs: Overview, Tasks, Payments, Milestones, Secrets, and MCP Tokens. Overview contains Customer, Budget, and Notes. Every operational collection gets its own focused tab; do not rebuild a stacked properties rail.
- Detail header = breadcrumb row (`min-h-20 bg-card px-6 py-4`): parent crumb muted / name / status pill, due date pushed right. The tab band below it is also borderless; the selected tab supplies the visual anchor.
- Section headers (task groups, rail sections): `text-xs font-black uppercase tracking-[0.12em]` + a bordered count.
- Task lists: grouped by status (In Progress → Todo → Done) in `border bg-card` frames. Rows use `min-h-11`, `text-base`, priority marker left, title with optional two-line description, and due date right `text-sm text-muted-foreground`. Done titles use `text-muted-foreground line-through`. New Tasks are created through a `Dialog` with Title and Description; do not restore the inline add field.
- Cards elsewhere (dashboard, settings): `gap-4` grid, one `Card` per domain section, `CardTitle` = `text-base font-bold`.
- Create = `Dialog` with short form; edit = inline where cheap (status `Select`, checkbox toggles), dialog otherwise. Forms: `field.tsx` + zod, labels above inputs, one column.

## Color discipline

- Surfaces stay white, gray, or black. Blue-purple (`highlight`) is the only brand color and appears decisively on selected navigation, active tabs, secondary actions, focus rings, and InProgress/Active state. Red remains reserved for destructive/error feedback.
- Semantic status colors:

| Meaning | Classes |
|---|---|
| Project Lead / Task Todo | `text-muted-foreground` (neutral) |
| Active / InProgress | `bg-highlight` dot, solid `bg-highlight` pill |
| OnHold | ink / mid-gray marker |
| Completed / Done | ink marker |
| Cancelled | `text-muted-foreground line-through` |
| Priority Urgent | `bg-primary` dot |
| Priority High | `bg-highlight` dot |
| Priority Medium/Low/None | progressively lighter neutral dots |

- Status rendered as `Badge` variant `outline` with a bordered marker (`size-2 rounded-sm`), not a rainbow set of filled badges. Exception — the Active project status pill uses solid blue-purple with white text.
- Money: `tabular-nums`; outstanding > 0 neutral, overdue/negative `text-red-600`.

## Voice

- UI copy through `@repo/i18n` keys, never hardcoded strings.
- Short labels, sentence case ("Add task", not "Add New Task!"). Destructive confirms via `alert-dialog` stating the object name.
- Secrets render masked `••••••••` until explicit Reveal; auto-rehide after ~30s; never toast a secret value.
