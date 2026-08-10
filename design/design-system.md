# Design system

Source of truth for the site's look is [`styleguide.dc.html`](styleguide.dc.html) (see [`README.md`](README.md) for the full handoff notes). It's a design reference only — not meant to be served — so its colors, type scale and spacing are implemented as CSS custom properties in [`css/tokens.css`](../css/tokens.css), which [`css/styles.css`](../css/styles.css) builds on.

## Using the tokens

Reach for these instead of hardcoding a value, so new components stay visually consistent with the styleguide and a future palette/type change only happens in one place.

**Color** — `var(--color-ink)`, `--color-cream`, `--color-tan`, `--color-teal`, `--color-teal-hover`, `--color-yellow`
Muted/hairline variants: `--ink-14` / `--ink-1a` / `--ink-99` / `--ink-b3` (ink at opacity, for light backgrounds) and `--cream-33` / `--cream-4d` / `--cream-80` / `--cream-b3` / `--cream-cc` / `--cream-f2` (cream at opacity, for dark backgrounds).

**Type** — role-based shorthand tokens matching the styleguide's type scale: `--type-eyebrow`, `--type-h1`, `--type-h2`, `--type-h2-quote` (the 38px "quote-style" H2 used in the dark differentiation band), `--type-h3`, `--type-body-lg`, `--type-body`, `--type-body-loose`, `--type-body-sm`, `--type-nav`, `--type-button`. Use as `font:var(--type-h2);`. Letter-spacing for the two tracked roles: `--tracking-h1`, `--tracking-eyebrow`.

**Spacing** — `--space-section-x` / `--space-section-y` (the standard 32px/56px section padding), `--space-hero-y-top` / `--space-hero-y-bottom` (the hero's taller padding), `--space-gap-lg` / `--space-gap-md` / `--space-gap-sm` (grid gaps).

**Other rules from the styleguide** (not tokenized, just conventions to keep following): no border-radius anywhere — square corners throughout; no box-shadows on the site itself (the styleguide's soft shadows are for its own mockup contexts only, not the live page); card/section borders are `1px solid var(--ink-14)` or `var(--ink-1a)`.

## Keeping it in sync

If the styleguide changes, update `design/styleguide.dc.html` (and `design/README.md`'s Design Tokens section) first, then bring the matching value into `css/tokens.css`. `design/` is excluded from the Vercel deploy (`.vercelignore`) since it's reference material, not a page.
