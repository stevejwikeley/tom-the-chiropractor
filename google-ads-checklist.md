# Google Ads Optimization Checklist

Operational runbook for account 642-795-0400 (the account `js/tracking.js`
sends conversions to). These are console actions in ads.google.com — there's
no API write access configured for this project, so none of this can be
automated; work through it yourself in the Ads UI. The figures below come
from the 2026-09-08 dashboard snapshot and `ad-group-import.json`
(imported 2026-09-04) — pull fresh numbers before acting if it's been a
while since either was updated.

Do these roughly in order — #1 and #3 free up budget/eligibility that #2
and #6 then redirect, and #7 should land before you lean harder on
automated (Smart Bidding) budget allocation across any of this.

## 1. Pause "Active Campaign 27 Aug"

**Why:** £112.78 spent over 28 days, zero bookings — past the dashboard's
own kill threshold (£100+ with no path down).

**Steps:**
1. Log into ads.google.com for account 642-795-0400.
2. Campaigns tab → find **"Active Campaign 27 Aug"**.
3. Set the date range to "All time" and confirm the Conversions column
   really is 0 for its whole lifetime, not just the last 28 days.
4. If confirmed, click its status cell → **Pause**.
5. Check the Budgets page (Tools → Budgets) to see whether it shares a
   budget with "Loughborough | Search | Chiro (Rebuild)". If they're
   separate budgets, manually move the freed-up daily amount over to the
   Rebuild campaign so total spend stays flat rather than just dropping.
6. Note today's date somewhere so you can compare Rebuild's CAC before/after
   in ~2 weeks.

## 2. Find out why 4 of 7 ad groups have zero impressions

**Affected ad groups** (campaign "Loughborough | Search | Chiro (Rebuild)"):
`AG3 | Back Pain`, `AG4 | Neck & Headaches`, `AG5 | Sciatica (ASA)`,
`AG6 | Convenience`.

**Steps, per ad group:**
1. Ads UI → the campaign → **Ad groups** tab → click the ad group's status
   pill for the specific reason (e.g. "Eligible (limited)", "Low search
   volume", "Ad disapproved", "Under review").
2. Open the ad group → **Ads** tab → check each ad's status and its **Ad
   strength** score.
3. Open the **Keywords** tab → check per-keyword status. Use the "..."
   menu → **Keyword diagnosis** to see whether Google is citing a bid
   below the estimated top-of-page bid as the blocker.
4. If it's a bid problem: raise Max CPC to at least the estimated
   top-of-page bid Google shows for that keyword.
5. If it's an approval problem: read the disapproval reason on the ad,
   fix the copy, resubmit.
6. If Ad Strength is "Poor": add more headline/description variations
   (Responsive Search Ads want 10–15 headlines and 4 descriptions) that
   reference the specific condition.
7. Confirm each ad's **Final URL** actually points at the matching
   landing page you already have built, not the homepage:
   - `AG3 | Back Pain` → `https://www.tomthechiropractor.co.uk/conditions/back-pain.html`
   - `AG4 | Neck & Headaches` → `https://www.tomthechiropractor.co.uk/conditions/neck-pain.html` and/or `headaches.html` (split into two ad groups if you want separate message-match for each)
   - `AG5 | Sciatica (ASA)` → `https://www.tomthechiropractor.co.uk/conditions/sciatica.html`
   - `AG6 | Convenience` → decide which page best sells "convenient/easy parking/appointments until 7pm" — likely the homepage's `#pillars` or `#find` anchor

## 3. Fix or drop AG7 Competitor

**Why:** status shows "Not eligible" — it's serving nothing right now.

**Steps:**
1. Open `AG7 | Competitor` → check the exact ineligibility reason on its
   ads (commonly a trademark policy flag on competitor names appearing in
   ad headlines/descriptions — competitor names are usually fine as
   *keywords* but not in visible ad text in most regions).
2. If it's a trademark flag: either remove the competitor name from the
   ad copy (keep it only in the keyword list) and resubmit, or file a
   trademark complaint/authorization if you have grounds to use the name.
3. If you'd rather not run competitor-conquesting ads at all (reasonable
   call for a small local practice — legal/reputational risk for little
   volume): pause the ad group instead. Its budget share is currently
   zero anyway, so this is a zero-cost decision either way.

## 4. Point traffic at the new lean landing page

**Status:** the code side of this is done — see `book-online.html`,
already live. What's left is entirely in the Ads UI.

**Steps:**
1. Start with the two ad groups carrying the most volume today:
   `Ad group 1` and `AG2 | Near Me`.
2. Open each → **Ads** tab → edit the Final URL to
   `https://www.tomthechiropractor.co.uk/book-online.html`.
3. Leave sitelink assets pointing wherever they already point (e.g. the
   homepage's pricing/about sections) — only the main ad destination
   changes.
4. Watch bookings/CAC for these two ad groups for 1–2 weeks before
   repointing the condition-specific ad groups from #2, once those are
   actually serving.

## 5. Add ad assets

Free Ad Strength/CTR gains — these don't cost anything extra to add.

**Sitelinks** (Ads UI → Ads & assets → Assets → account or campaign level → Sitelinks → +):
- "Pricing" → `https://www.tomthechiropractor.co.uk/questions/chiropractor-cost-loughborough.html`
- "Conditions we treat" → `https://www.tomthechiropractor.co.uk/#treat`
- "About Tom" → `https://www.tomthechiropractor.co.uk/about.html`
- "Reviews" → `https://www.tomthechiropractor.co.uk/#reviews`

**Callouts:**
"5.0★ on Google (10 reviews)" · "GCC-registered chiropractor" ·
"Fully insured" · "Appointments until 7pm" · "Park 30 seconds away" ·
"LAST10: £25 off your first visit"

**Call extension:** `07871 283457`. While you're there, check whether
"Calls from ads" is set up as its own conversion action (Ads → Goals →
Conversions) — right now only the on-site `tel:` click is tracked
(`js/tracking.js`'s `phone_click`), so calls placed directly from the ad's
call button/extension aren't currently counted anywhere.

**Price extension or structured snippet:**
- Structured snippet, type "Services": Back pain, Neck pain, Headaches,
  Sciatica, Joint & muscle pain
- Or a price extension row: "Initial consultation — £45"

## 6. Tighten match types / negatives on `Ad group 1`

**Why:** it's absorbing most of the recent spend and sessions (per the
dashboard's `adGroups` data) with a middling CAC, and likely eating
queries that belong in the condition-specific ad groups instead.

**Steps:**
1. Open `Ad group 1` → **Keywords** tab, note each keyword's current
   match type (Broad/Phrase/Exact).
2. Insights & reports → **Search terms**, filter to this ad group, last
   30–90 days.
3. Add clearly irrelevant queries as negative keywords (account or
   campaign level) — things like "chiropractic course", "jobs",
   "physiotherapist" (if you don't want to compete for that intent), "NHS",
   "exercises", "diy".
4. For any search term that's actually condition-specific (e.g. "back
   pain chiropractor loughborough"), add it as a new keyword directly
   under the matching `AG3`/`AG4`/`AG5` ad group instead of leaving it to
   convert generically here — that's what routes it to the right landing
   page and message match.
5. Where the search-terms report shows broad match drifting into
   unrelated queries, tighten those keywords to phrase or exact match.

## 7. Fix attribution before leaning on automated bidding

**Why:** 12 of 14 "Booked" events in the last 28 days aren't attributed to
any campaign (per the dashboard's insights) — Smart Bidding has almost no
real signal to optimize against.

**Steps:**
1. Ads UI → Settings (wrench icon) → **Account settings** → **Auto-tagging**
   → confirm "Tag the URL that people click through from my ad" is ON.
   (If it was off, turning it on only fixes attribution for clicks *after*
   the change — it won't retroactively fix past data.)
2. Check that nothing on the site strips the `gclid` query parameter
   before GA4 can read it — in particular, the existing `/index.html` → `/`
   redirect (see the "Redirect /index.html to / so the homepage stops
   splitting in analytics" commit) should be checked to confirm it
   preserves query strings.
3. Ads UI → **Goals** → **Conversions** → open the "Book_appointment_1"
   action → check whether **Enhanced conversions** is enabled. If not,
   enable it — no extra site changes needed beyond what's already firing
   via `gtag`, since Google hashes existing user data automatically.
4. After a few days of clean data, re-check the dashboard's unattributed-
   booking rate (or GA4 Advertising → Attribution) to confirm it's dropped
   before trusting Smart Bidding's optimization more heavily.
