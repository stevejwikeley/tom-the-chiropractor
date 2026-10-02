# Guide email distributor

Design document. Written 2026-09-20. Approved section by section before any code was written.

## Purpose

Tom recommends a patient guide during an appointment and wants to send it straight afterwards, from one interface, in a few seconds, without keeping the patient's details anywhere.

The clinical reason for the email, in his words: there is only so much he can get through in an appointment, and people forget most of what was said by the time they get home. The guide puts it in one place they can return to.

## What "not stored" means here

The requirement was that patient data is not stored. Taken literally that is not achievable, so this is the exact position, and the design commits to it.

Nothing is written by this site. No database, no file, no Resend Audience, no analytics event, no record of the name or address in the repo.

The details do exist in five places for a time:

1. The browser tab they were typed into, until the form clears or the tab closes.
2. The request body on the wire to Vercel.
3. The memory of one serverless function, for roughly a second.
4. Resend's send log, which retains recipient address and subject, visible and purgeable at resend.com.
5. Tom's own inbox, permanently, via the BCC he asked for, until he deletes it.

Points 4 and 5 are services already in use, and point 5 is a deliberate requirement rather than a side effect.

## Decisions taken

| Decision | Choice | Notes |
|---|---|---|
| Page access | Public, no authentication | Tom's explicit call after the open relay risk was explained |
| Guardrails | None | Tom's explicit call. No honeypot, no rate limit |
| Email contains | One guide, linked to the web page | Keeps traffic on the site, guides stay editable |
| Guide picker | Grouped by body area | Guides spanning two areas are listed in both |
| Build approach | Page plus endpoint, one shared data file | Chosen over duplicating the guide list in two places |
| Safety wording | Fixed line pointing at the guide's own section | No new medical text authored for this feature |

### Risk accepted by the client

The endpoint is unauthenticated and ungated. It will send a branded email from the clinic domain to any address submitted, at any volume, with a caller supplied first name rendered into the body. The realistic consequences are unsolicited mail sent in Tom's name, a flooded clinic inbox via the BCC, and damage to the sending domain's reputation, which would push genuine clinic mail into junk folders.

This was raised in detail and Tom chose to accept it in exchange for simplicity. If abuse appears, the mitigations held in reserve are strict name validation, a per visitor rate limit, and a honeypot field.

Three checks are kept regardless, because they are correctness rather than policy: HTML escaping of the name, a basic email format check, and validation of the guide slug against the real guide list. Without the last one the endpoint would place any URL inside a clinic branded email.

## Architecture

Four files. Three new, one changed.

### guides/guides.json (new)

Single source of truth. Two top level keys, so a guide listed under two body areas cannot end up with two different titles.

```json
{
  "guides": {
    "low-back-pain": { "title": "Low Back Pain in Your 30s, 40s and 50s" }
  },
  "groups": [
    { "heading": "Low back and leg", "slugs": ["low-back-pain"] }
  ]
}
```

21 guide definitions. Six groups holding 27 slug references between them. This is the only file edited to add, rename, regroup or retire a guide.

### send-guide.html (new, site root)

Fetches guides.json on load and renders the grouped lists. Carries `<meta name="robots" content="noindex,nofollow">`. Not linked from the nav, the footer or the sitemap. Reached by bookmarking the URL.

### api/send-guide.mjs (new)

Follows the shape of the two existing endpoints. GET returns a configuration health check reporting which environment variables are visible, by name only, and sends no email. POST validates, confirms the slug exists in guides.json, builds the email and makes one Resend call.

### vercel.json (changed)

One rewrite added so `/send-guide` resolves without the `.html` extension. Nothing else in the file moves.

### Data flow

Browser posts `{ slug, name, email }` to `/api/send-guide`. The slug is checked against guides.json. One Resend call is made with the patient in `to` and CLINIC_EMAIL in `bcc`. `{ ok: true }` returns to the browser and the form clears. Three fields in, one email out.

## Grouping

Six groups, 21 distinct guides, 27 listed entries. Guides spanning two areas appear in both.

**Low back and leg (10)**
Low Back Pain in Your 30s, 40s and 50s; Low Back Pain Over 60; Back Pain and Sciatica; Back Pain and Sciatica Over 60; Back Pain That Travels Down One Leg; Back and Leg Pain: When Fast Recovery Slows Down; Back Pain When You Work With Your Body; When Hip Arthritis Starts Costing You Your Back; Neck and Back Pain at the Same Time; Neck and Back Pain When You Have Diabetes.

**Neck (8)**
Neck Pain in Your 30s, 40s and 50s; Neck Pain Over 60; Neck Disc Pain and Arm Symptoms; Your Neck After a Disc Flare-Up Has Settled; Mechanical Neck and Upper Back Pain; Headaches That Come From the Neck; Neck and Back Pain at the Same Time; Neck and Back Pain When You Have Diabetes.

**Upper back (3)**
Upper Back Pain in Your 30s, 40s and 50s; Upper Back Pain Over 60; Mechanical Neck and Upper Back Pain.

**Shoulder and arm (4)**
Shoulder Pain in Your 30s, 40s and 50s; Shoulder Pain Over 60; Tennis Elbow; Neck Disc Pain and Arm Symptoms.

**Hip (1)**
When Hip Arthritis Starts Costing You Your Back.

**Headaches (1)**
Headaches That Come From the Neck.

Hip and Headaches remain groups of one deliberately. Each is a heading someone would scan to, and both guides also appear in their main area, so nothing is hidden behind a single item group.

"Back Pain When You Work With Your Body" was considered for Neck and for Shoulder and arm, and rejected on evidence: the file contains no mention of the neck and one of the shoulder, and its sections are all low back. Filing it elsewhere would mean sending a patient a guide that never addresses their complaint.

## Interface

Built with the site's existing tokens. Rubik, cream ground, ink text, teal action. Single column, designed for a phone first.

**Fields at the top.** First name and email. Side by side on desktop, stacked on a phone.

**Grouped list in the middle.** Six headings in the order above, guides as full width tappable rows. Selecting a row gives it a teal left rule and a tinted background and releases the previous selection. Where a guide appears twice, both copies show as selected, so two identical titles are never ambiguous.

**Sticky send bar at the bottom.** Appears once a guide is selected, showing the chosen title and a Send guide button. Without it, selecting something near the bottom of 27 rows would mean scrolling back up to send.

### States

- **Idle.** Send disabled until a name, a plausible email and a guide are all present.
- **Sending.** Button reads "Sending..." and locks, so a double tap cannot send twice.
- **Sent.** Confirmation naming person and guide, for example "Sent Low Back Pain Over 60 to Sarah." Form clears, selection releases, page returns to the top.
- **Failed.** The real reason shown in red. The form does not clear, so a wrong address is corrected in one field rather than retyped.

## The email

**Envelope.** From FROM_EMAIL. Reply-to hello@tomthechiropractor.co.uk so replies reach the real inbox rather than the sending subdomain. BCC CLINIC_EMAIL rather than a hardcoded address.

**Subject.** `Your guide: <title>`

**Formats.** HTML and plain text in the same send. The plain text part serves clients with images disabled and helps the message clear spam filtering.

**Construction.** Matches the two existing clinic emails: white card on cream, 560px, 12px corners, #E3E1DD border, Arial with Georgia for the heading, teal button.

### Copy

> Hi {name},
>
> Here's the guide I mentioned in clinic, *{title}*. It's worth a read.
>
> **[ Read the guide ]**
>
> https://tomthechiropractor.co.uk/guides/{slug}.html
>
> There's only so much I can get through in an appointment, and most people find that what we talked about has half faded by the time they get home. That's completely normal. It isn't you being forgetful. This puts it all in one place so you can go back over it whenever you want, at your own pace.
>
> If anything in it doesn't match what you're feeling, bring it to your next appointment and we'll go through it.
>
> Tom
> Tom the Chiropractor, Loughborough
>
> *(thin grey rule)*
>
> I'm sending this because we talked about it at your appointment. I haven't added you to a mailing list and you won't hear from me again unless you get in touch.
>
> This guide is general information, not a diagnosis. It has a section called "When to get urgent help". If you read only one part of it, read that one.

Only the name, the title and the URL vary. Everything else is identical on every send.

An earlier draft carried a fixed cauda equina warning. It was removed. That is a low back warning, and sending it alongside a tennis elbow guide is both wrong and misleading, because it implies a completeness it does not have. The guides already carry thorough area specific urgent help sections, split into Call 999 and contact your GP or NHS 111 today. The email points at those rather than competing with them.

No medical claim in this email is authored for this feature.

## Failure handling

Send failures are surfaced, never swallowed. A failed send returns a real error to the page and the form retains its contents. The three realistic cases carry distinct messages, because the fix differs in each: the address was rejected as undeliverable, the API key is missing or revoked, or Resend is unreachable.

Missing configuration is reported by variable name and never by value, matching the existing endpoints.

## Configuration

No new environment variables. Reuses RESEND_API_KEY, FROM_EMAIL and CLINIC_EMAIL, all already present in Vercel for the desk check feature.

**Outstanding action for Tom.** The Resend API key pasted into conversation earlier is compromised and was to be revoked and regenerated. This endpoint uses whatever key Vercel currently holds. Before going live, confirm at resend.com/api-keys that the key in Vercel was generated after that conversation.

## Testing

Verifiable without sending anything:

- guides.json parses, and all 21 slugs resolve to files that exist in guides/.
- Every slug referenced by a group exists in the guides object.
- The page renders and groups correctly at phone and desktop widths.
- The endpoint rejects an unknown slug.
- GET returns the configuration health check and sends no email.
- The rendered email HTML is correct for a sample guide.

**No live email will be sent on Tom's behalf.** The first real send is his own, to his own address. Checks on arrival: it is not in junk, the button works, reply goes to the real inbox, and the BCC copy lands.

## Out of scope

Sending several guides at once, a personal note field, PDF attachments, scheduling, any record of who was sent what, and any link from the site's navigation or footer to this page.
