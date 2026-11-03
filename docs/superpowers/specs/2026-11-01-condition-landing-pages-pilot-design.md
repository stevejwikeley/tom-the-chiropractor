# Condition landing pages pilot (back and neck)

Design document. Written 2026-11-01. Approved section by section before anything was built.

## Purpose

Raise the share of paid clicks that turn into bookings. Today almost all paid traffic lands on the homepage, a general page that has to serve every condition and every visitor. A person searching "back pain chiropractor loughborough" should land on a page about back pain whose ad speaks to the same problem, with everything they need to book and nothing that leads them elsewhere.

This is a pilot. Two conditions, back pain and neck pain, are built first to prove the uplift before rolling the same pattern out to sciatica, headaches, shoulder and the rest.

## Decisions taken

| Decision | Choice | Notes |
|---|---|---|
| Where landing pages live | New paid-only pages under `/lp/`, `noindex` | Existing `conditions/*.html` pages stay as they are for SEO |
| Rollout | Pilot first | Back pain and neck pain only |
| Ads structure | One new Search campaign per condition | Separate budgets, so each is a clean test cell |
| Total spend | Unchanged | Shared between Rebuild and the two new campaigns |
| Budget split | Set at launch from Steve's Ads export | Starting proposal: 50% Rebuild, 25% Back, 25% Neck |
| Rebuild campaign | Trimmed to the ad groups that perform | Ad group 1 kept; AG2 Near Me pending the export |
| Headache keywords | Paused, not sent to the neck page | Headaches gets its own landing page if the pilot works |
| Build approach | Two hand-written static pages | Homepage components plus condition copy. No template or build step |

## Out of scope

- Landing pages for sciatica, headaches, shoulder, joint and muscle, and desk-related pain. These come after the pilot is read.
- Changes to `index.html`, `book-online.html` or `conditions/*.html`.
- Changing Ad group 1's final URL. It stays as the baseline.
- Any Ads API automation. The account has no write access, so everything on the Ads side is a console runbook.
- A/B testing within a campaign (Ads Experiments). Volume is too low for it at these budgets.

## 1. The pages

Two files: `lp/back-pain.html` and `lp/neck-pain.html`. Plain static HTML, in the same style as the rest of the site, using `css/tokens.css` and `css/styles.css` and loading `js/cookie-consent.js`, `js/tracking.js` and `js/script.js` exactly as the condition pages do. Any LP-only styling goes in one small block of new rules in `css/styles.css`, under an `lp-` class prefix.

### Section order (mobile first)

1. **Minimal header.** Brand mark and name, which is not a link, and one "Book" button pointing at `#book`. No nav links and no menu toggle.
2. **Condition hero.**
   - The H1 matches the search intent: "Back pain treatment in Loughborough" / "Neck pain treatment in Loughborough".
   - A one-line promise below it, plus the 5.0★ on Google, 18 reviews badge.
   - Primary button "Book your appointment" pointing at `#book`. Secondary options: call `07871 283457` and WhatsApp, using the same links as the homepage.
   - Tom's headshot (`images/headshots/1Z5A8513-yellow`, the same as the homepage hero), with the existing 480w/800w `srcset` and `fetchpriority="high"`. On phones it sits below the text so the H1 and Book button stay above the fold. (Changed 2026-11-03 from a condition photo: for a one-person practice the person is the product, and it keeps the hero identical to the homepage baseline.)
3. **"Does this sound like you?"** The symptom list, copied from the matching `conditions/*.html` page.
4. **Reviews.** Three or four Google reviews that mention that body area, using the existing `review-card` markup.
   - Back: Lewis Edwards, Carolyn Quinn, Pepe Lois, Gurpreet L.
   - Neck: Megan, Alisonlee520, Ramesh Mistry.
5. **What's going on and how I help.** At most two short paragraphs, condensed from the condition page's "What's usually going on" and "How I can help" sections. No new clinical claims. Followed by a "What treatment looks like" carousel with the same three photos as the matching condition page.
6. **How it works.** The homepage's three pillars, with the copy unchanged.
7. **Pricing.** Initial consultation £70 (60 minutes) and follow-up £45. The block of 5 (£200) appears as one line. No links off the page.
8. **Booking (`id="book"`).** The PracticeHub widget embed and the appointment times, copied from the homepage `book` section, plus the "Having trouble with the booking form?" fallback link.
9. **When I'm not the right person.** The condition page's red-flag callout, kept in full and only tightened in wording.
10. **Short FAQ.** Five questions copied from the homepage FAQ: first appointment, will it hurt, the clicking noise, how many appointments, and whether a GP referral is needed. Links in the answers that lead off the page are removed.
11. **Find me.** Address, parking line and map embed, copied from the homepage `find` section. The contact form is left out.
12. **Sticky mobile "Book" bar.** The existing `sticky-cta` component, pointing at `#book`.

Left out on purpose: the site nav, "What I treat", value framework, why, desk-check, who-for, guide links, cross-links to other conditions, and the contact form.

### Head and indexing

- `<meta name="robots" content="noindex,follow">`
- A canonical tag and `og:url` pointing at the page's own `/lp/...` URL.
- The title and meta description match the H1 and promise.
- No `MedicalWebPage`, `BreadcrumbList` or review schema. The page isn't indexed, so there's nothing to gain from it.
- Not added to `sitemap.xml` or `llms.txt`.
- The same cookie banner markup as the condition pages, in its current modal form.
- A header comment, like the one in `book-online.html`, saying what the page is for, that it is noindex on purpose, and that it should be kept in step with homepage pricing, hours and review count.

### Content rules

All copy is reused from existing pages: the homepage, `conditions/back-pain.html` and `conditions/neck-pain.html`. The only new wording is the hero promise line, a shortening of existing paragraphs, and the ad copy in section 3. Prices, hours, the review count and GCC details must match `index.html` on the day the pages ship.

## 2. Tracking and measurement

### On the page

- No new conversion code. A completed booking redirects to `/thank-you.html`, where GTM fires the Ads "Book completed" conversion as it does now. `tracking.js` covers phone, WhatsApp, email and booking-form interaction automatically.
- Every CTA gets a `data-cta` value with the prefix `lp-back_` or `lp-neck_`: `_header`, `_hero`, `_mid-page`, `_pricing` and `_sticky-mobile`.

### On the ads

- Final URLs: `https://www.tomthechiropractor.co.uk/lp/back-pain.html?utm_source=google&utm_medium=cpc&utm_campaign=lp-back`, and the same for neck with `lp-neck`. Auto-tagging stays on, and the UTMs are a fallback for attribution.

### Pre-launch attribution check

Load each LP with a test `?gclid=TEST123&utm_campaign=lp-back` query and confirm that:

- the query string is still on the URL after load (no redirect drops it);
- GA4 DebugView, or the network tab, shows the `page_view` carrying it.

If PracticeHub's redirect to `/thank-you.html` loses the session, write that down as a known limitation (a checklist #7 issue) rather than blocking the pilot.

### Dashboard (outside this repo, manual step on Steve's Mac)

Add a `pilot` block to `~/.tom-chiro-dashboard/daily_pull.py` that reports sessions, bookings, cost, clicks and cost per booking for each campaign: Rebuild, Back Pain LP and Neck Pain LP. Use `sessionCampaignName`, which the Ads cost import supports at campaign level. Update the page's `render()` to show it and republish the page following the steps in `CLAUDE.md`. This can't be done from a cloud session, so the plan writes it out as a task for Steve to run locally.

### Judging the pilot

Read the results after 4 weeks live, or after about 150 clicks per LP campaign, whichever comes later.

- **Primary measure:** bookings ÷ paid clicks for each LP campaign, compared with Rebuild's Ad group 1 → homepage over the same window.
- **Secondary measure:** cost per booking for each campaign.
- **Kill rule:** if an LP campaign reaches about £100 spend with zero bookings, pause it and review.
- **Roll-out rule:** if an LP's conversion rate is at least as good as the baseline and its cost per booking is no worse, build the next condition LPs (sciatica, headaches, shoulder) from the same pattern.

## 3. Google Ads build (console runbook)

Deliverable: `docs/google-ads-lp-pilot.md` (under `docs/`, which `.vercelignore` keeps off the live site; internal budgets and keyword strategy shouldn't be publicly served), in the style of `google-ads-checklist.md`, with numbered console steps for account 642-795-0400.

### New campaigns

"Loughborough | Search | Back Pain LP" and "Loughborough | Search | Neck Pain LP".

- **Networks:** Search only. Search Partners and Display both off.
- **Location:** a 10-mile radius around LE11 2FJ, using "Presence: people in or regularly in".
- **Bidding:** Maximise clicks with a max CPC cap. Switch to Maximise conversions once a campaign has about 15 recorded bookings.
- **Budget:** left blank in the runbook. Set at launch from Steve's export, with total account daily spend unchanged.
- **One ad group per campaign.** Phrase and exact match keywords only. Starter lists:
  - Back: "back pain chiropractor loughborough", "lower back pain treatment loughborough", "chiropractor for back pain", "back pain loughborough", "lower back pain chiropractor".
  - Neck: "neck pain chiropractor loughborough", "neck pain treatment loughborough", "stiff neck treatment", "chiropractor for neck pain", "neck pain loughborough".
  - Add to these from Rebuild's search-terms report once it's exported.
- **One responsive search ad per ad group,** with 15 headlines and 4 descriptions. The runbook contains the full copy, taken from the LP: the condition, Loughborough, 5.0★ from 18 Google reviews, a 60-minute first appointment, appointments until 8pm, parking 30 seconds away, seeing the same chiropractor every time, and GCC registration. Headline 1 is pinned to the condition and headline 2 to Loughborough. No claims of cure or specific outcomes, to stay within healthcare ad policy.
- **Assets:** callouts and the call asset from checklist #5, and a structured snippet for Services. No sitelinks on these two campaigns.

### Negatives

- A new shared negative keyword list, "Non-patient intent", applied to all three campaigns: jobs, job, course, training, degree, NHS, free, exercises, stretches, DIY, "what causes", "symptoms of", physiotherapist, osteopath.
- No cross-negatives between the two LP campaigns. Their keywords are already condition-specific, and negating "neck" on Back and "back" on Neck (with Rebuild negating both) would leave "neck and back pain" searches with no ad at all. (Changed after the final review.)
- Back and neck condition terms ("back pain", "lower back", "neck pain", "stiff neck") as phrase negatives on Rebuild, so those searches go to the LP campaigns.

### Tidying up Rebuild

- Pause AG3 Back Pain, AG4 Neck & Headaches, AG5 Sciatica (ASA), AG6 Convenience and AG7 Competitor.
- Pause "Active Campaign 27 Aug" (checklist #1) if it is still running.
- Keep Ad group 1 with its current final URL. Keep AG2 Near Me unless the export shows it isn't performing.

### Launch order

1. The LPs are merged, deployed and pass the checks in section 4.
2. Both LP campaigns are created **paused**, and their ads get approved.
3. On a single day: add the Rebuild negatives and pauses, set the budgets to the agreed split, and enable both LP campaigns. Write down the date as the pilot start.

## 4. Verification before launch

The site has no build step and no page test suite, so the checks are scripted and visual:

- **Head checks:** a small script asserts that each LP has `noindex,follow`, its own canonical, no `<nav class="nav__links">`, exactly one `id="book"`, and that every `data-cta` uses the page's prefix. It also asserts that neither LP appears in `sitemap.xml`.
- **Link check:** every `href` on each LP is one of `#book`, `tel:`, a WhatsApp link, the PracticeHub fallback, Google Maps directions, or the cookie and privacy policies. Anything else fails.
- **Facts check:** the prices (£70, £45, £200), hours and review count on each LP match `index.html`.
- **Visual check:** Playwright screenshots of each LP at 390px and 1280px widths. Confirm the hero, reviews, booking widget and sticky bar render, and that there is no horizontal scroll.
- **Booking widget:** the PracticeHub widget loads inside `#book` on the deployed preview URL.
- **Attribution check:** the gclid and UTM check from section 2, on the Vercel preview.

## Risks

- **Low volume.** With a split budget, each LP campaign may get too few clicks to read a result in 4 weeks. The read-out waits for about 150 clicks, and the kill rule limits the downside.
- **Ad review delay.** New ads go through Google's review, and healthcare terms can mean slower or limited approval. Creating the campaigns paused ahead of launch absorbs this.
- **Content drift.** Prices, hours or reviews may change on the homepage and not on the LPs. The header comment and the facts check cover this, and the same rule already applies to `book-online.html`.
- **Attribution gaps.** The existing unattributed-booking problem (checklist #7) affects all campaigns equally, so the comparison between them still holds even though the absolute numbers are understated.
