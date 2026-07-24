# Corvex Theme Tokens — Black, White & Blue-Purple (2026-07-20)

Source of truth for `packages/ui/src/styles.css`. Keep these values aligned with the `:root`, `.dark`, and `@theme inline` blocks. The platform currently forces light mode because the product canvas is intentionally pure white.

The shared `Sidebar` component keeps the package-level light tokens below. Corvex's `PlatformAppShell` intentionally overrides its sidebar surface to `--primary` and its foreground to `--primary-foreground`, producing an ink-black navigation column beside the white canvas.

## `:root` (active platform theme)

```css
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.18 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.18 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0 0);
  --primary: oklch(0.18 0 0);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.55 0.26 277);
  --secondary-foreground: oklch(1 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.48 0 0);
  --accent: oklch(0.96 0 0);
  --accent-foreground: oklch(0.18 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.84 0 0);
  --input: oklch(0.76 0 0);
  --ring: oklch(0.55 0.26 277);
  --highlight: oklch(0.55 0.26 277);
  --highlight-foreground: oklch(1 0 0);
  --chart-1: oklch(0.55 0.26 277);
  --chart-2: oklch(0.18 0 0);
  --chart-3: oklch(0.48 0 0);
  --chart-4: oklch(0.68 0 0);
  --chart-5: oklch(0.86 0 0);
  --sidebar: oklch(1 0 0);
  --sidebar-foreground: oklch(0.18 0 0);
  --sidebar-primary: oklch(0.18 0 0);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.96 0 0);
  --sidebar-accent-foreground: oklch(0.18 0 0);
  --sidebar-border: oklch(0.84 0 0);
  --sidebar-ring: oklch(0.55 0.26 277);
}
```

## `.dark` (legacy fallback; platform forces light)

Keep the dark token block in `styles.css` as a shared-package fallback. Its ring, highlight, and chart accent use the same blue-purple family. Do not enable it in Corvex without a new explicit design decision: Corvex’s current background is mandatory white.

## `@theme inline` additions

```css
--font-sans: "Space Grotesk Variable", ui-sans-serif, system-ui, sans-serif;
--shadow-2xs: 1px 1px 0 0 var(--foreground);
--shadow-xs: 2px 2px 0 0 var(--foreground);
--shadow-sm: 3px 3px 0 0 var(--foreground);
--shadow-md: 4px 4px 0 0 var(--foreground);
--shadow-lg: 5px 5px 0 0 var(--foreground);
--shadow-xl: 6px 6px 0 0 var(--foreground);
--shadow-2xl: 8px 8px 0 0 var(--foreground);
--color-highlight: var(--highlight);
--color-highlight-foreground: var(--highlight-foreground);
```

## Usage rules

- Font ships through `@fontsource-variable/space-grotesk`; never add a Google Fonts link.
- Hard shadows are an emphasis tool, not default elevation. Use them on the unlock card, active navigation/tabs, primary data frames, black summary panels, and overlays. Ordinary cards, task groups, note cards, inputs, and selects stay flat.
- Normal structure uses one-pixel soft-gray borders. Pair a hard shadow with an ink `border-foreground` so its silhouette is deliberate.
- Brand accent is `highlight`/`secondary`: vivid blue-purple with white foreground. Do not introduce orange, green, or other decorative hues. Red is reserved for destructive/error states.
- Base layer sets bold tight headings, blue-purple text selection, and an antialiased body.
- Chart palette is blue-purple, ink, and a neutral grayscale ramp.
- Superseded: the original dark base-mira theme, cream neo-brutalist pass, and restrained-white/orange pass.
