# Google Ads: landing page pilot (back and neck)

Console runbook for account 642-795-0400. It sets up two new Search
campaigns that send back pain and neck pain searches to their own landing
pages, and trims the old "Rebuild" campaign so total spend stays the same.

There's no API write access to this account, so every step here is done by
hand in ads.google.com (or by Claude in Chrome, from a Claude session running
on your own computer).

- Design and reasoning: `docs/superpowers/specs/2026-11-01-condition-landing-pages-pilot-design.md`
- The pages: `lp/back-pain.html`, `lp/neck-pain.html`
- Checks: `node tests/check-lp.mjs` (also validates every URL and ad text length in this file)

Work through the sections in order. Section 6 is the only one that changes
what's live, and it all happens on one day.

## 1. Before anything in Ads: check the pages are live

1. Merge the branch and wait for Vercel to deploy.
2. Open each URL on your phone, exactly as an ad click would arrive:
   - https://www.tomthechiropractor.co.uk/lp/back-pain.html?utm_source=google&utm_medium=cpc&utm_campaign=lp-back
   - https://www.tomthechiropractor.co.uk/lp/neck-pain.html?utm_source=google&utm_medium=cpc&utm_campaign=lp-neck
3. On each, confirm:
   - the address bar still shows the `?utm_...` part after the page loads (nothing redirected it away);
   - the PracticeHub booking form loads in the "Book your appointment" section;
   - the yellow Book bar at the bottom disappears when the booking form is on screen.
4. Attribution check (checklist #7): add `&gclid=TEST123` to one URL, open it,
   then in GA4 → Admin → DebugView (or Realtime) confirm the page view shows
   campaign `lp-back`. If it doesn't, note it; it doesn't block the pilot,
   because all three campaigns are affected equally.

## 2. Shared negative keyword list

Tools → Shared library → **Negative keyword lists** → **+**.

Name: **Non-patient intent**. Add these as phrase match (wrap each in quotes):

```
"jobs"
"job"
"course"
"training"
"degree"
"nhs"
"free"
"exercises"
"stretches"
"diy"
"what causes"
"symptoms of"
"physiotherapist"
"osteopath"
```

Save. It gets applied to campaigns in steps 3, 4 and 5.

## 3. New campaign: Loughborough | Search | Back Pain LP

Campaigns → **+ New campaign** → objective **Leads** (or "Create a campaign
without a goal's guidance") → **Search**.

**Settings**
1. Campaign name: `Loughborough | Search | Back Pain LP`
2. Conversion goals: use account default goals (the "Book completed" action
   must be included).
3. Networks: untick **Search Partners** and untick **Display Network**.
4. Locations: **Enter another location** → Advanced search → Radius →
   `LE11 2FJ`, **10 mi**. Under Location options choose **Presence: People
   in or regularly in your included locations**.
5. Languages: English.
6. Bidding: **Clicks** (Maximise clicks), tick **Set a maximum cost per click
   bid limit**. Use the same max CPC Ad group 1 currently runs at (check its
   average CPC over the last 30 days and set the cap about 20% above it).
   Switch to Maximise conversions only after this campaign has about 15
   recorded bookings.
7. Budget: **£____ /day**. Set from the export, so that Rebuild + Back +
   Neck adds up to today's total daily spend. Starting proposal: 25% of the
   total.
8. Ad schedule: all day, every day. Bookings can be made at any time.
9. **Leave the campaign paused** when you save it (step 6 turns it on).

**Ad group:** name `Back pain`.

**Keywords** (phrase and exact):

```
"back pain chiropractor loughborough"
[back pain chiropractor loughborough]
"lower back pain treatment loughborough"
[lower back pain treatment loughborough]
"chiropractor for back pain"
[chiropractor for back pain]
"back pain loughborough"
[back pain loughborough]
"lower back pain chiropractor"
[lower back pain chiropractor]
```

Once you have the Rebuild search-terms export, add any back-pain searches
from it that converted or got clicks here as well.

**Negatives on this campaign:** apply the **Non-patient intent** list
(Keywords → Negative keywords → + → Use negative keyword list). Also add
these campaign negatives so it doesn't compete with the neck campaign:
`"neck"`.

**Responsive search ad**

Final URL: https://www.tomthechiropractor.co.uk/lp/back-pain.html?utm_source=google&utm_medium=cpc&utm_campaign=lp-back

Display path: `back-pain` / `loughborough`

**Headlines**

1. Back Pain Treatment (pin position 1)
2. Chiropractor Loughborough (pin position 2)
3. Rated 5.0 on Google
4. 18 Five-Star Google Reviews
5. Book Online in Under a Minute
6. Appointments Until 8pm
7. Parking 30 Seconds Away
8. 60-Min First Appointment
9. Same Chiropractor Every Visit
10. GCC-Registered Chiropractor
11. Lower Back Pain Treatment
12. Chiropractor for Back Pain
13. No GP Referral Needed
14. Hands-On Treatment & Rehab
15. Clear Plan, No Pressure

**Descriptions**

1. Back pain? Get a proper assessment and hands-on treatment in central Loughborough.
2. 60-minute first appointment for £70. See the same chiropractor at every visit.
3. Rated 5.0 on Google from 18 reviews. Appointments until 8pm, parking 30 seconds away.
4. No GP referral needed. Book online in under a minute and choose a time that suits you.

To pin: click the pin icon next to a headline → choose position.

**Assets** (campaign level):
- Callouts: `5.0★ on Google (18 reviews)`, `GCC-registered chiropractor`,
  `Fully insured`, `Appointments until 8pm`, `Park 30 seconds away`.
  If the ★ is rejected, use `Rated 5.0 on Google`.
- Call asset: `07871 283457`.
- Structured snippet, header **Services**: Back pain, Neck pain, Headaches,
  Sciatica, Joint & muscle pain.
- **No sitelinks** on this campaign. They would lead to other pages and
  muddy the test. If account-level sitelinks exist, they'll show anyway;
  that's acceptable, but don't add campaign ones.

## 4. New campaign: Loughborough | Search | Neck Pain LP

Same settings as section 3 (networks, location, bidding, schedule, created
**paused**), with these differences.

- Campaign name: `Loughborough | Search | Neck Pain LP`
- Budget: **£____ /day** (starting proposal: 25% of the total).
- Ad group name: `Neck pain`.

**Keywords** (phrase and exact):

```
"neck pain chiropractor loughborough"
[neck pain chiropractor loughborough]
"neck pain treatment loughborough"
[neck pain treatment loughborough]
"stiff neck treatment"
[stiff neck treatment]
"chiropractor for neck pain"
[chiropractor for neck pain]
"neck pain loughborough"
[neck pain loughborough]
```

Headache keywords from the old AG4 are **not** added here. They wait for
their own landing page.

**Negatives on this campaign:** the **Non-patient intent** list, plus
`"back"` and `"lower back"`.

**Responsive search ad**

Final URL: https://www.tomthechiropractor.co.uk/lp/neck-pain.html?utm_source=google&utm_medium=cpc&utm_campaign=lp-neck

Display path: `neck-pain` / `loughborough`

**Headlines**

1. Neck Pain Treatment (pin position 1)
2. Chiropractor Loughborough (pin position 2)
3. Rated 5.0 on Google
4. 18 Five-Star Google Reviews
5. Book Online in Under a Minute
6. Appointments Until 8pm
7. Parking 30 Seconds Away
8. 60-Min First Appointment
9. Same Chiropractor Every Visit
10. GCC-Registered Chiropractor
11. Stiff Neck Treatment
12. Chiropractor for Neck Pain
13. No GP Referral Needed
14. Hands-On Treatment & Advice
15. Desk Job Neck Pain?

**Descriptions**

1. Stiff neck? Get a proper assessment and hands-on treatment in central Loughborough.
2. 60-minute first appointment for £70. See the same chiropractor at every visit.
3. Rated 5.0 on Google from 18 reviews. Appointments until 8pm, parking 30 seconds away.
4. No GP referral needed. Book online in under a minute and choose a time that suits you.

**Assets:** same callouts, call asset and structured snippet as section 3.
No sitelinks.

Submit both campaigns (still paused) and wait for the ads to show
**Eligible** / **Approved**. Health-related ads can take a day or two.

## 5. Prepare the Rebuild changes (don't save until launch day)

Campaign **Loughborough | Search | Chiro (Rebuild)**. Do these on launch
day, in section 6, but check now that you can find everything:

- Ad groups to **pause**: `AG3 | Back Pain`, `AG4 | Neck & Headaches`,
  `AG5 | Sciatica (ASA)`, `AG6 | Convenience`, `AG7 | Competitor`.
- Ad groups to **keep**: `Ad group 1`, with its final URL **unchanged**,
  because it's the baseline the pilot is measured against. Keep `AG2 | Near Me`
  too, unless the export shows it isn't converting.
- Campaign negatives to **add** (phrase match), so back and neck searches go
  to the new campaigns: `"back pain"`, `"lower back"`, `"neck pain"`,
  `"stiff neck"`.
- Apply the **Non-patient intent** list to Rebuild as well.
- Also pause **Active Campaign 27 Aug** if it's still running (checklist #1).

## 6. Launch day (all on the same day)

1. Rebuild: pause the five ad groups, add the four negatives, apply the
   shared list.
2. Pause "Active Campaign 27 Aug" if it's still on.
3. Set budgets so that total daily spend matches what it was before:
   Rebuild £____, Back Pain LP £____, Neck Pain LP £____.
   (Starting proposal 50 / 25 / 25.)
4. Enable both LP campaigns.
5. Write down today's date as the **pilot start date**: ________.
6. Next day: check both campaigns have impressions. If either shows
   "Eligible (limited)" or no impressions, open Keywords → status for the
   reason (usually bid below first-page estimate) and raise the max CPC cap.

## 7. Reading the pilot

Read it after **4 weeks**, or after **~150 clicks per LP campaign**,
whichever comes later. Compare over the same dates:

| | Rebuild Ad group 1 → homepage | Back Pain LP | Neck Pain LP |
|---|---|---|---|
| Clicks | | | |
| Bookings | | | |
| Booking rate (bookings ÷ clicks) | | | |
| Cost | | | |
| Cost per booking | | | |

- **Kill rule:** if an LP campaign reaches about **£100 spend with zero
  bookings**, pause it and look at its search terms and the page before
  carrying on.
- **Roll-out rule:** if an LP's booking rate is at least as good as Ad group
  1's and its cost per booking is no worse, build the next landing pages
  (sciatica, headaches, shoulder) the same way and repeat sections 3–6 for
  each.

## 8. Dashboard (on your Mac, not in this repo)

So the daily dashboard shows the pilot without manual sums:

1. In `~/.tom-chiro-dashboard/daily_pull.py`, add a `pilot` block. It's one GA4 query with
   dimension `sessionCampaignName`, filtered to the three campaign names
   above, and metrics sessions, bookings (the existing "Booked" event
   count), `advertiserAdCost` and `advertiserAdClicks`. Compute cost per
   booking for each campaign. Campaign-level cost is supported by the Ads
   import, so this works where the ad-group breakdown didn't.
2. Add a matching table to `render()` in
   `~/.tom-chiro-dashboard/dashboard-page.html`.
3. Regenerate the snapshot and republish the page as described in
   `CLAUDE.md` (republish with the existing artifact URL so it updates in place).
