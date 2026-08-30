# Design system

Source of truth for the site's look is [`styleguide.dc.html`](styleguide.dc.html) (see [`README.md`](README.md) for the full handoff notes). It's a design reference only — not meant to be served — so its colors, type scale and spacing are implemented as CSS custom properties in [`css/tokens.css`](../css/tokens.css), which [`css/styles.css`](../css/styles.css) builds on.

## Using the tokens

Reach for these instead of hardcoding a value, so new components stay visually consistent with the styleguide and a future palette/type change only happens in one place.

**Color** — `var(--color-ink)`, `--color-cream`, `--color-tan`, `--color-teal`, `--color-teal-hover`, `--color-yellow`
Muted/hairline variants: `--ink-14` / `--ink-1a` / `--ink-99` / `--ink-b3` (ink at opacity, for light backgrounds) and `--cream-33` / `--cream-4d` / `--cream-80` / `--cream-b3` / `--cream-cc` / `--cream-f2` (cream at opacity, for dark backgrounds).

**Type** — role-based shorthand tokens matching the styleguide's type scale: `--type-eyebrow`, `--type-h1`, `--type-h2`, `--type-h2-quote` (the 38px "quote-style" H2 used in the dark differentiation band), `--type-h3`, `--type-body-lg`, `--type-body`, `--type-body-loose`, `--type-body-sm`, `--type-nav`, `--type-button`. Use as `font:var(--type-h2);`. Letter-spacing for the two tracked roles: `--tracking-h1`, `--tracking-eyebrow`.

**Spacing** — `--space-section-x` / `--space-section-y` (the standard 32px/56px section padding), `--space-hero-y-top` / `--space-hero-y-bottom` (the hero's taller padding), `--space-gap-lg` / `--space-gap-md` / `--space-gap-sm` (grid gaps).

**Other rules from the styleguide** (not tokenized, just conventions to keep following): no border-radius anywhere — square corners throughout; no box-shadows on the site itself (the styleguide's soft shadows are for its own mockup contexts only, not the live page); card/section borders are `1px solid var(--ink-14)` or `var(--ink-1a)`.

## Photography

Source images live in `images/action/` and `images/headshots/`, resized to a 1600px long edge, JPEG only, quality 80. Adding a new photo:

1. Run `images/resize.sh action your-photo.jpg` (or `headshots` instead of `action`) from the project root. It resizes and compresses the photo the same way every time and saves it into the right folder — see `images/resize.sh` for exactly what it does, or the full write-up in `images/README.md`.
2. Reference it from a page as `images/action/your-photo.jpg` (or `../images/action/...` from a page inside `conditions/`).

Some older files in `images/` also have a matching `.webp` copy from an earlier pass — none of those are actually referenced by any page, so ignore them; only the `.jpg` matters. Reaching for a photo on a page:

- Pick a photo whose crop suits the component's `object-fit: cover` box — a portrait shot for a tall frame, a landscape one for a wide banner — rather than fighting a bad crop with `object-position`.
- Follow the "no border-radius, no box-shadow" rule for the photo itself and its frame. The two established exceptions are small circular controls (carousel dots, nav dots) and floating chrome that needs to lift off variable content underneath it (the carousel's prev/next buttons, matching the existing `.map-embed__directions` shadow) — never a shadow on a card or a photo purely for decoration.
- Never claim a photo shows a specific condition being treated (e.g. don't caption a generic adjustment photo "treating sciatica") — alt text should describe what's actually happening in the shot.

**Implemented components:**

- **Hero photo** (`.hero__grid` / `.hero__media`, used on `index.html`) — a two-column hero with a portrait photo on the right, offset by a solid teal block behind it. The block's offset is intentionally small (6px) so it reads as a frame, not a big drop-shadow effect. Stacks to a single column on mobile, with the photo shown above the text at a smaller width.
- **Condition carousel** (`.carousel`, `.condition-carousel__cta`, used on every page in `conditions/`) — a self-contained `condition-section` with a 1:1 photo carousel (3 photos, autoplay every 4.5s, pauses on hover/focus/off-screen, respects `prefers-reduced-motion`) plus a one-line caption and a "Book your appointment" button. The button links to `#book`, which is set on that page's own `.condition-cta` wrapper, not back to the homepage — the page already ends with the real booking widget, so the carousel's CTA just jumps to it. JS lives in `initCarousels()` in `js/script.js`, matching the pattern already established by `initReviews()`. To add this to a new condition page: copy the markup block from any existing page, swap in three photos (avoid using the exact same trio as a page linked right next to it in `.condition-related`), and write one caption line specific to that condition's treatment.
- **"What I treat" photo cards** (`.condition-card`, used in `index.html`'s `#treat` section) — the homepage's condition grid now carries a photo, a one-line description and the arrow, instead of just a name and an arrow.

**Explored but not yet built** (from the photo-treatments design review) — reach for these if a page needs a different feel than the above:

- **Polaroid** — a single pinned, slightly rotated photo dropped inline into body copy. Warmer than the carousel; use for a page that needs one photo, not a gallery. Note the reviewed version used a shadow and rotation for a deliberately informal, off-brand moment — treat that as a one-off exception, not a precedent for other components.
- **Full-width banner** — a photo banner with the same diagonal dark gradient as the full-bleed hero option, heading overlaid on the dark side. Good as a section break on a very long page.
- **Editorial float** — a photo floated inside a paragraph, magazine-style, with a thin hairline border and a caption underneath.
- **Callout avatar** — a small circular photo inside the existing `.condition-callout` pattern, for a tip that's clearly coming from Tom personally. Needs a photo cropped to face-and-shoulders specifically (see `images/headshots/1Z5A8572-avatar.jpg` for the one already cropped this way) — a circular crop of a full-body shot doesn't work.

## Keeping it in sync

If the styleguide changes, update `design/styleguide.dc.html` (and `design/README.md`'s Design Tokens section) first, then bring the matching value into `css/tokens.css`. `design/` is excluded from the Vercel deploy (`.vercelignore`) since it's reference material, not a page.
