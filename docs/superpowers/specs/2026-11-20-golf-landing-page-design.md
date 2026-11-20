# Golf landing page for the Rothley Park advert

**Date:** 2026-11-20
**Size:** small change (one new page, one redirect, two config fields in an existing test)

## Intent

Tom is advertising at Rothley Park Golf Club. The advert carries a QR code.
A golfer who scans it should land on a page that is recognisably his site
but speaks to golfers, and the scan should be countable.

The number that matters is not the scan on its own. It is how many of
those scans turn into bookings, because that is what says whether the
advert paid for itself.

## Goals

- A page at a short, printable URL that a QR code can point at.
- Golf framing in the hero and the opening section, written golfer to
  golfer, since Tom plays.
- Everything else matching the homepage: reviews, pricing, booking,
  the safety callout, how to find the clinic.
- Scans countable in GA4 as page views on a URL nothing else uses, and
  bookings from those scans countable separately from the rest of the site.

## Non-goals

- Ranking in Google. This page exists for QR traffic only.
- Being linked from anywhere in the site's navigation.
- Any offer, discount or member rate. Standard pricing, unchanged.

## Anti-goals

Things that would make this a failure even if the page works:

- **Claiming golf specialism Tom cannot evidence.** No performance
  claims, no added yards, no golf injury expertise. The ASA and the GCC
  both take an interest in that kind of wording, and it is not true of him
  anyway. The angle is "I play, here is what I see", not "I am a golf
  chiropractor".
- **Competing with the real homepage in search.** A second copy of the
  homepage indexed by Google would split his own rankings for
  "chiropractor in Loughborough". The page is noindex for that reason.
- **Drifting out of date.** Prices, hours and the review count have to
  stay in step with the homepage, or a golfer books expecting one price
  and is quoted another.

## Constraints

- No package.json in this repo and none may be added.
- `tests/check-lp.mjs` cannot be run on this machine: node is not
  installed. The page will be written to satisfy it by inspection, and
  Tom or CI runs it to confirm.
- The site has no build step. Plain HTML, existing CSS, no new stylesheet.

## Approaches considered

1. **A golfer version of the homepage, built on the existing lp/ pattern.**
   Chosen. The two pages already in `lp/` are roughly 80% of the homepage
   with the navigation removed and their own click tracking added, which
   is almost exactly what is wanted here. Nothing new to maintain and the
   existing test suite already guards it.
2. **A literal copy of index.html at a new URL.** Rejected. 1106 lines
   duplicated, of which the test guards seven facts. It drifts within
   months, and every future homepage change has to be made twice.
3. **No new page, just a tracked link to the homepage.** Rejected. Perfect
   tracking, zero maintenance, but the golfer sees the same page as
   everyone else, so the advert stops being aimed at golfers.

## What gets built

### `lp/golf.html`

Structure copied from `lp/neck-pain.html`: hero, "does this sound like
you", reviews, the explanatory block, pillars, pricing, booking, safety
callout, FAQ, where to find me. No site navigation. One booking section.

Golf specific parts:

- **Hero.** Leads on Tom playing. Headline along the lines of a
  chiropractor in Loughborough who plays off the same tees you do.
- **"Does this sound like you".** The complaints golfers actually bring
  in: a back that tightens over the back nine, a hip that will not turn
  on the follow through, a shoulder that aches the morning after, a grip
  that has lost its strength. Described as symptoms, not as a diagnosis
  of what golf does.
- Everything else is the homepage's own content, unchanged.

Fixed rules inherited from the lp/ pattern:

- `<meta name="robots" content="noindex,follow">`, canonical and og:url
  on `https://www.tomthechiropractor.co.uk/lp/golf.html`.
- No JSON-LD, no site nav, exactly one `id="book"`.
- Every `data-cta` prefixed `lp-golf_`, including `lp-golf_hero` and
  `lp-golf_sticky-mobile`.
- Outbound links limited to the page itself, the booking system, the
  phone number, WhatsApp, Google Maps and the three policy pages.
- Prices, hours, review count and phone number identical to index.html.
- Review cards: Megan, Mark Tebbatt and Mel, with their text copied
  verbatim from index.html. Chosen because Megan's mentions sport,
  Mark's is about getting a back sorted before an event, and Mel's is
  hip and leg pain, which are the three things a golfer recognises.
- Treatment photo carousel: the three slides from
  `conditions/back-pain.html`.
- Hero image: Tom's headshot, same as the other two.

### `vercel.json`

A redirect from `/golf` to
`/lp/golf.html?utm_source=rothley-park&utm_medium=qr&utm_campaign=golf`,
matching the convention the other clean URLs already use. The printed URL
under the QR code reads `tomthechiropractor.co.uk/golf`, which someone can
also type.

Two decisions made during the build, both changes from the first draft of
this document:

- **The campaign tags live on the redirect, not in the QR code.** GA4 sees
  the same tags either way, and moving them out of the encoded string drops
  the code from 37 modules a side to 33, which scans more easily off print.
- **`"permanent": false`, not true.** Every other entry in the file is a 308,
  which is right for a URL that moved once. This one is printed on an advert
  in the world: a 308 cached on a golfer's phone would outlive any change we
  later make to where `/golf` points. A 307 costs nothing here.

### `tests/check-lp.mjs`

Two fields added to the `PAGES` config, because this is the first landing
page that is neither a Google Ads page nor paired with a condition page:

- `source`: the page review text and carousel slides are checked against.
  Defaults to `conditions/<slug>.html` so the existing two entries are
  unchanged. Golf sets it to `conditions/back-pain.html`.
- `paid`: false for golf, which skips the Google Ads runbook check. The
  runbook check still runs in full for the two paid pages.

### Not changed

`sitemap.xml` and `llms.txt` stay as they are. The test asserts no `/lp/`
URL appears in either.

## The QR code and its URL

The code encodes exactly this, and nothing else:

```
https://www.tomthechiropractor.co.uk/golf
```

The campaign tags are attached by the redirect instead (see above). The
tags still matter: `/golf` on its own counts everybody, the tagged version
separates the Rothley Park advert from any future club, or from someone
typing the URL off the page.

The image is built and committed at `images/qr/golf-qr.svg`, with a
`README.md` beside it covering print sizing and why it must not be
recoloured without a test scan. It was generated here from the ISO 18004
specification rather than sent to a third-party QR site, so the URL was
never handed to anyone else. Version 4, error correction level Q, 33
modules a side plus the required 4 module light margin.

It was verified three ways, none of which is a scan: all Reed-Solomon
syndromes come out zero across both blocks, an independently written
decoder read the finished matrix back to the exact 41 byte URL, and the
SVG's path data was parsed back and compared module by module against
that matrix. The one check that cannot be done here is a real phone
reading it off paper, so Tom scans it before it goes to print.

## What is left to the builder

- Exact hero wording, within the golfer to golfer angle and the
  anti-goals above.
- Which FAQ entries carry over from `lp/neck-pain.html`.
- The order of the golf complaints in the opening section.
