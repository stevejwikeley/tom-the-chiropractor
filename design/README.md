# Handoff: Tom the Chiropractor — Brand + Landing Page

## Overview
Brand identity and a one-page marketing site for Tom the Chiropractor, a chiropractic clinic in Loughborough, UK targeting busy desk-workers. Positioning: hassle-free treatment that fits around a working day (evenings/Saturdays, one clinician, fast booking).

## About the Design Files
The files in this bundle are **design references built in HTML** — high-fidelity prototypes of look, content, and layout, not production code to copy directly. The task is to **recreate these designs in the target codebase's environment** (React, Vue, plain static site, etc.) using its existing conventions — or, if no environment exists yet, choose the simplest appropriate stack (a static site is sufficient; no framework is required for a single landing page) and implement there.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and copy are final as shown. Recreate pixel-for-close, adapting only for the target stack's component patterns.

## Screens / Views

### 1. Landing page (`Tom the Chiropractor Landing Page.dc.html`)
Single-page site, one scrolling column, max content width unconstrained (full-bleed sections, inner text blocks capped at 600–760px).

- **Nav** — sticky top bar, `1px solid #00262A14` bottom border, `#EFEADFf2` background with backdrop-blur. Left: 24px logo mark + "TOM THE CHIROPRACTOR" wordmark (700 weight, 14px, uppercase). Right: 4 text links (What we treat / How it works / Chiro vs physio / Find us) + solid yellow "Book online" CTA button (`#EFCA07` bg, `#00262A` text, 700 weight, uppercase, 11px/16px padding).
- **Hero** — eyebrow label (teal, uppercase, 13px, letter-spacing 0.14em) → H1 "Chiropractic that works around your working day" (300 weight, 68px/1.08, letter-spacing -0.015em) → body paragraph (19px/1.65, 70% opacity ink) → CTA row: dark solid button "Book your appointment" + text link "See how it works →". Footnote line below in 13px muted.
- **Who it's for** — eyebrow label + wrapped row of pill chips (white bg, 1px border, 12×20px padding).
- **Why/differentiation** — full-width dark (`#00262A`) band. Strikethrough generic line, then large quote-style H2 (400/38px), a wrapped row of outlined selling-point chips, then a bordered-top closing quote line.
- **Value framework** — 3-column grid (equal cols, 1px gap creating hairline dividers via background color), each column padded from its neighbor: "You need" / "We provide" (teal heading) / "Unlike others" — each a short list of one-line statements.
- **Three pillars ("How it works")** — light tan band (`#e6dfd0`). 3-column grid, each column: large numeral (34px, alternating teal/yellow) → bold uppercase title → bulleted list of points (em-dash prefixed).
- **What we treat** — eyebrow + H2, then 5-column grid of white cards (1px border, centered bold label: Neck pain, Back pain, Shoulder pain, Headaches, Sciatica). Disclaimer line below.
- **Chiro vs physio FAQ** — dark band, 3-column grid of Q&A blocks (bold question, muted answer).
- **Booking** — 2-column grid. Left: eyebrow, H2, address line, checklist (teal check + line), then CTA row (yellow "Book online now" + dark "WhatsApp us" with inline SVG icon, links to `https://wa.me/447597965111`). Right: map placeholder — diagonal-striped block, clickable, links to Google Maps search for the address, centered pin + address text + "Open in Google Maps →".
- **Footer** — thin top border, logo mark + "Tom the Chiropractor · Loughborough" left, "Brand guidelines →" link right (points to the brand board file).

### 2. Brand board (`styleguide.dc.html`)
A scrollable brand guideline document (cover, logo, color, type, photography direction, and applied mockups: business card, social posts, van livery, signage, flyer). Use as the single source of truth for: logo construction, color values, type scale, and voice. Not meant to ship as a page — reference only.

## Interactions & Behavior
- Nav links are in-page anchor scrolls (`#treat`, `#pillars`, `#faq`, `#find`).
- "Book online" / "Book your appointment" / "Book online now" buttons are CTAs with no wired destination in the prototype — link to the real booking system/URL in production.
- WhatsApp button opens `https://wa.me/447597965111` in a new tab.
- Map block opens a Google Maps search for "Southfield Rd, Loughborough LE11 2TY" in a new tab.
- No animations; nav bar has a subtle blur-on-scroll (backdrop-filter, always on — not scroll-triggered).
- Fully desktop-width prototype; no responsive/mobile breakpoints defined yet — target implementation should design its own mobile layout (stack all grids to 1 column, collapse nav to a menu) following the same visual language.

## State Management
Static content only — no client state, forms, or data fetching in the prototype. Production build will need a booking-system integration (external link or embedded widget) and a real contact-form/WhatsApp deep link (already correct).

## Design Tokens

**Colors**
- Ink / near-black-teal (primary text, dark sections): `#00262A`
- Cream (page background): `#EFEADF`
- Warm tan (section background alt): `#e6dfd0`
- Teal accent (eyebrows, links, accents): `#00A6A6` (hover state `#007a7a`)
- Yellow accent (primary CTA, highlight): `#EFCA07`
- Ink at various opacities for muted text: `#00262A99` (60%), `#00262Ab3` (70%), `#00262A80`/`14`/`1a` for hairlines
- Cream at opacity for muted text on dark: `#EFEADFb3`, `#EFEADF80`, `#EFEADF4d`, `#EFEADF33`

**Typography**
- Typeface: Rubik (Google Fonts), weights 300/400/500/600/700
- Eyebrow labels: 700 weight, 13px, uppercase, letter-spacing 0.1–0.14em, teal or yellow
- H1 (hero): 300 weight, 68px/1.08, letter-spacing -0.015em
- H2 (section heads): 400 weight, 34–38px/1.3
- H3 (card/column heads): 700 weight, 17–20px, often uppercase
- Body: 400 weight, 14–19px, line-height 1.5–1.65
- Nav/buttons: 500–700 weight, 12–14px, uppercase for buttons

**Spacing**
- Section padding: 56px vertical (hero 80px/72px), 32px horizontal
- Grid gaps: 40–48px between major columns, 12–20px between small items, 1px for hairline-divided grids

**Other**
- No border-radius anywhere — all corners are square (brand uses hard edges throughout, buttons and cards included)
- No box-shadows on the landing page (flat design); brand board mockups use soft shadows for photographic/device contexts only
- Borders are 1px solid ink at low opacity for card outlines

## Logo
Locked mark: **two vertebrae with the disc between them**, drawn inside a circular ring (id `mark-5d` in the brand board file, `lp-mark-5i` in the landing page — same visual construction, single-color outline, teal accent bar for the disc). Side-profile spine motif, always rendered as a single-color outline shape (ink, cream, or yellow depending on background). No other logo variants are current — any other marks referenced in earlier explorations are archived and inactive.

## Assets
No photographic assets are finalized — the landing page uses no images; the brand board's photography examples are placeholder color blocks representing where real patient/lifestyle photography will go (solid color crops, no stock imagery to carry forward). Patient testimonial names in early explorations were placeholders and were removed from the current landing page — no testimonials ship in this version.

## Known content notes (unresolved, flag to designer before shipping)
- In the "Value framework" section's "You need" column, the first list item is an empty string (rendering as a blank line) — needs real copy or removal.
- The third "pillar" is titled "Transistion" — likely a typo for "Transition".

## Files included in this bundle
- `Tom the Chiropractor Landing Page.dc.html` — the landing page design (primary reference)
- `styleguide.dc.html` — full brand guideline document (colors, type, logo, mockups)

Both are self-contained HTML files — open directly in a browser to view/interact with them.
