# Condition Landing Pages Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship two paid-only landing pages (`lp/back-pain.html`, `lp/neck-pain.html`) and the Google Ads console runbook that points two new campaigns at them.

**Architecture:** Hand-written static HTML pages in the site's existing style, assembled from components already in `index.html` and copy already in `conditions/back-pain.html` / `conditions/neck-pain.html`, plus a small `lp-` CSS block. A Node check script enforces the spec's structural, link and facts rules; a Playwright script screenshots both pages. The Ads side is a markdown runbook under `docs/` (not deployed).

**Tech Stack:** Static HTML/CSS, existing `js/*.js`, Node 22 (no dependencies) for checks, preinstalled Playwright for screenshots, Vercel static hosting.

**Spec:** `docs/superpowers/specs/2026-11-01-condition-landing-pages-pilot-design.md`

## Global Constraints

- Pages: `noindex,follow`; canonical and `og:url` = own `https://www.tomthechiropractor.co.uk/lp/<slug>.html`; not in `sitemap.xml` or `llms.txt`; no schema.org JSON-LD.
- No `nav__links` nav, no menu toggle. Header brand is not a link.
- `data-cta` prefixes: `lp-back_` / `lp-neck_`, suffixes from `_header`, `_hero`, `_mid-page`, `_pricing`, `_sticky-mobile`.
- Allowed `href`s only: `#book` (and other in-page `#` anchors), `tel:+447871283457`, `https://wa.me/447871283457`, `https://tomthechiro.neptune.practicehub.io`, Google Maps directions, `../cookie-policy.html`, `../privacy-policy.html`, and `/favicon*`/`/apple-touch-icon.png`/CSS hrefs in `<head>`.
- Facts must match `index.html` on the day: £70 (60 minutes), £45, £200 block of 5; Monday and Thursday 9am to 8pm, Saturday 9am to 3pm; 5.0 on Google from 18 reviews; 07871 283457.
- No new clinical claims; copy is reused or shortened from existing pages. Only new wording: hero promise line and ad copy.
- Back reviews: Lewis Edwards, Carolyn Quinn, Pepe Lois, Gurpreet L. Neck reviews: Megan, Alisonlee520, Ramesh Mistry.
- Hero images: back `images/action/back/lower-back-adjustment`, neck `images/action/neck/neck-treatment-lying-down` (480w/800w srcset, `fetchpriority="high"`).
- Repo is CRLF-normalised (`.gitattributes`): any script reading files strips `\r` first.
- Runbook lives at `docs/google-ads-lp-pilot.md`; final URLs end in `.html` (no `cleanUrls` in `vercel.json`, so `/lp/back-pain` would 404).

## Review Focus

1. **Phone width, scrolled to booking:** the sticky Book bar must not cover the PracticeHub widget's submit area — it hides when `#book` is in view (existing `is-hidden` behaviour in `js/script.js`); verified by the 390px screenshot of `#book` in Task 4.
2. **Ad click with query string:** `/lp/back-pain.html?gclid=X&utm_campaign=lp-back` must load with no redirect stripping the query — Task 4 asserts the final URL keeps the query.
3. **Widget fails to load (blocked script, cookie decline):** the "Open online booking →" fallback link must be present inside the booking section — Task 1 check `fallback booking link`.
4. **Red-flag safety section dropped during condensing:** each page must still contain "When I'm not the right person" and the condition's GP/A&E list — Task 1 check `safety callout`.
5. **Runbook URL typo (`/lp/back-pain` without `.html`, wrong utm):** Task 5 adds a runbook check that every final URL listed matches the exact spec URLs.

---

### Task 1: Landing page check script

**Files:**
- Create: `tests/check-lp.mjs`

**Interfaces:**
- Produces: `node tests/check-lp.mjs [slug...]` — defaults to `back-pain neck-pain`; prints `pass  <label>` / `FAIL  <label>` lines; exits 1 on any failure. Later tasks run it with one slug (`node tests/check-lp.mjs back-pain`).

- [ ] **Step 1: Write the script** with these checks per slug (`lp/<slug>.html`, prefix `lp-back_` for back-pain, `lp-neck_` for neck-pain), reading files with `\r` stripped:
  - `file exists`
  - `noindex` — contains `<meta name="robots" content="noindex,follow">`
  - `canonical` — `<link rel="canonical" href="https://www.tomthechiropractor.co.uk/lp/<slug>.html">` and matching `og:url`
  - `no site nav` — no `nav__links`, no `navToggle`
  - `no schema` — no `application/ld+json`
  - `one #book` — exactly one `id="book"`
  - `cta prefix` — every `data-cta="..."` starts with the prefix; at least `_hero`, `_sticky-mobile` present
  - `links allowed` — every `href` in `<body>` matches the Global Constraints allow-list
  - `facts` — contains `£70`, `£45`, `£200`, `60 minutes` (or `60-minute`), `9am to 8pm`, `9am to 3pm`, `18 reviews`, `07871 283457`; and `index.html` still contains `18 reviews` and `£70` (so drift fails loudly)
  - `reviews` — contains each reviewer name for that slug
  - `safety callout` — contains `When I'm not the right person` (accept `I&#39;m`/`I’m`) and `A&amp;E`
  - `fallback booking link` — `https://tomthechiro.neptune.practicehub.io` appears after `id="book"`
  - `scripts` — loads `../js/cookie-consent.js`, `../js/tracking.js`, `../js/script.js`
  - Global: `not in sitemap` — `sitemap.xml` and `llms.txt` do not contain `/lp/`

- [ ] **Step 2: Run it, expect failure**

Run: `node tests/check-lp.mjs`
Expected: `FAIL  back-pain: file exists`, `FAIL  neck-pain: file exists`, exit 1.

- [ ] **Step 3: Commit**

```bash
git add tests/check-lp.mjs
git commit -m "Add structural checks for the condition landing pages"
```

### Task 2: LP styles and the back pain landing page

**Files:**
- Modify: `css/styles.css` (append an `/* Landing pages (lp/) */` block)
- Create: `lp/back-pain.html`

**Interfaces:**
- Consumes: `tests/check-lp.mjs` (Task 1).
- Produces: CSS classes `lp-header`, `lp-header__brand`, `lp-hero`, `lp-hero__rating`, `lp-hero__contact`, `lp-reviews` used unchanged by Task 3. Every other component reuses existing classes (`review-card`, `pillars`, `pricing`, `book__widget`, `condition-list`, `condition-callout`, `faq`, `find`/map embed, `sticky-cta`, `cookie-banner`).

- [ ] **Step 1: Confirm the check fails for back-pain**

Run: `node tests/check-lp.mjs back-pain` → Expected: `FAIL  back-pain: file exists`.

- [ ] **Step 2: Build `lp/back-pain.html`** in the spec's 12-section order. Head modelled on `conditions/back-pain.html` (paths `../`), plus noindex, own canonical/og:url, title `Back Pain Treatment in Loughborough | Tom the Chiropractor`, a header comment in the style of `book-online.html` (purpose, noindex on purpose, keep prices/hours/review count in step with `index.html`). H1 `Back pain treatment in Loughborough`. Hero promise line: `Hands-on treatment and a clear plan from a GCC-registered chiropractor in central Loughborough, with appointments until 8pm.` Pillars, pricing, booking widget + times, FAQ (first appointment, will it hurt, clicking noise, how many appointments, GP referral — reword the last from the "What should I know before booking?" line "No GP referral needed") and find-me (address, parking, map, directions; no contact form) copied from `index.html` with off-page links removed. Symptom list, condensed explanation and safety callout from `conditions/back-pain.html`. Cookie banner markup copied from `conditions/back-pain.html` with policy link `../cookie-policy.html`. Sticky bar `<div class="sticky-cta"><a href="#book" class="btn btn--yellow sticky-cta__btn" data-cta="lp-back_sticky-mobile">Book</a></div>`.

- [ ] **Step 3: Add the `lp-` CSS block** — minimal header (brand + Book button, no toggle), hero with image beside text ≥700px and stacked below, rating line, contact row; use only `css/tokens.css` variables.

- [ ] **Step 4: Run checks**

Run: `node tests/check-lp.mjs back-pain` → Expected: all `pass`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add css/styles.css lp/back-pain.html
git commit -m "Add the back pain paid landing page"
```

### Task 3: Neck pain landing page

**Files:**
- Create: `lp/neck-pain.html`

**Interfaces:**
- Consumes: `lp/back-pain.html` as the structural template; Task 2's `lp-` classes; `tests/check-lp.mjs`.

- [ ] **Step 1: Confirm failure** — `node tests/check-lp.mjs neck-pain` → `FAIL  neck-pain: file exists`.

- [ ] **Step 2: Build `lp/neck-pain.html`** by copying the back page structure and swapping: title/H1 `Neck pain treatment in Loughborough`, prefix `lp-neck_`, neck hero image, neck reviews (Megan, Alisonlee520 from `conditions/neck-pain.html`, Ramesh Mistry), symptom list, condensed explanation and safety callout from `conditions/neck-pain.html`. Same promise line.

- [ ] **Step 3: Run checks** — `node tests/check-lp.mjs` → all `pass` for both slugs, exit 0.

- [ ] **Step 4: Commit**

```bash
git add lp/neck-pain.html
git commit -m "Add the neck pain paid landing page"
```

### Task 4: Visual and query-string check

**Files:**
- Create: `tests/screenshot-lp.mjs`

**Interfaces:**
- Produces: `node tests/screenshot-lp.mjs` — serves the repo root on a local port (Node `http`, static), loads each LP at 390×844 and 1280×800 with `?gclid=TEST123&utm_campaign=lp-<back|neck>`, writes PNGs to `$SCREENSHOT_DIR` (default `./.screenshots/`, gitignored) as `<slug>-<width>.png` (full page) and `<slug>-390-book.png` (viewport scrolled to `#book`).

- [ ] **Step 1: Write the script** with assertions, failing with exit 1 on any:
  - `page.url()` still contains `gclid=TEST123`
  - `document.documentElement.scrollWidth <= window.innerWidth` at both widths (no horizontal scroll)
  - `h1`, `#book`, `.lp-hero img` visible
  - at 390px after `#book` scrolled into view and 500ms wait, `.sticky-cta` has class `is-hidden` or is not intersecting `#book`'s bottom 200px
- [ ] **Step 2: Add `.screenshots/` to `.gitignore`.**
- [ ] **Step 3: Run** — `SCREENSHOT_DIR=<scratchpad> node tests/screenshot-lp.mjs` → Expected: 6 PNGs, exit 0. Open each PNG and check hero, reviews, pricing, booking and find-me render with no broken images. (The PracticeHub widget is an external embed; if it doesn't render locally, that's checked on the Vercel preview in the runbook.)
- [ ] **Step 4: Commit**

```bash
git add tests/screenshot-lp.mjs .gitignore
git commit -m "Add screenshot and query-string checks for landing pages"
```

### Task 5: Google Ads pilot runbook

**Files:**
- Create: `docs/google-ads-lp-pilot.md`
- Modify: `tests/check-lp.mjs` (add runbook checks)

**Interfaces:**
- Consumes: final page copy from Tasks 2–3 (headlines must agree with it).

- [ ] **Step 1: Add failing runbook checks** to `tests/check-lp.mjs`: `runbook exists`; `runbook URLs` — every `https://www.tomthechiropractor.co.uk/lp/` URL in it is exactly one of the two spec final URLs (`.../lp/back-pain.html?utm_source=google&utm_medium=cpc&utm_campaign=lp-back`, same for neck with `lp-neck`); `headline lengths` — every line under a `Headlines` list is ≤30 chars, every `Descriptions` line ≤90 chars. Run `node tests/check-lp.mjs` → FAIL `runbook exists`.
- [ ] **Step 2: Write the runbook**, in `google-ads-checklist.md` style, numbered console steps for account 642-795-0400, sections in spec order:
  1. Pre-launch: deploy, run `node tests/check-lp.mjs`, check widget loads and gclid/UTM survive on the Vercel preview; note result.
  2. Shared negative list "Non-patient intent" (spec terms verbatim).
  3. Campaign "Loughborough | Search | Back Pain LP": settings from spec, budget `£____ /day (set from export)`, keyword list (spec starters, phrase + exact), RSA with 15 headlines (≤30 chars) and 4 descriptions (≤90 chars), H1 pinned to condition, H2 pinned to Loughborough, cross-negatives, assets (callouts + call asset from checklist #5, structured snippet Services), no sitelinks, created paused.
  4. Same for "Loughborough | Search | Neck Pain LP".
  5. Rebuild tidy-up: pauses, phrase negatives, keep Ad group 1 (+ AG2 pending export).
  6. Launch day: single-day switch-over, record start date.
  7. Read-out: 4 weeks / ~150 clicks, primary/secondary metrics, £100 kill rule, roll-out rule.
  8. Dashboard (manual, on Steve's Mac): add `pilot` block to `~/.tom-chiro-dashboard/daily_pull.py` (per-campaign sessions, bookings, cost, clicks, cost per booking via `sessionCampaignName`), update `render()` in `dashboard-page.html`, republish per `CLAUDE.md`.
- [ ] **Step 3: Run** — `node tests/check-lp.mjs` → all pass.
- [ ] **Step 4: Commit**

```bash
git add docs/google-ads-lp-pilot.md tests/check-lp.mjs
git commit -m "Add the Google Ads runbook for the landing page pilot"
```

### Task 6: Push

- [ ] **Step 1:** `node tests/check-lp.mjs && node tests/screenshot-lp.mjs` → exit 0.
- [ ] **Step 2:** `git push -u origin ccr-f7529d17-dhtgoc`.
