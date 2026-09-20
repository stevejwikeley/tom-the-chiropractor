# Guide Email Distributor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a page and an endpoint that send one patient guide to one patient by email, BCC the clinic, and write nothing down.

**Architecture:** A static page at the site root reads a single guide data module, renders the guides grouped by body area, and posts a slug, a first name and an email address to a new Vercel serverless function. The function validates the slug against the same data module, builds a branded HTML and plain text email, and makes one Resend call. No storage of any kind.

**Tech Stack:** Static HTML, vanilla ES modules, no build step, no dependencies. Vercel serverless functions on the Node runtime using global `fetch`. Resend transactional email API.

**Spec:** `docs/superpowers/specs/2026-09-20-guide-email-distributor-design.md`

## Global Constraints

- **No dashes as punctuation anywhere.** No em dash, no en dash, no spaced hyphen standing in for one. This applies to code comments, commit messages, page copy and email copy. Hyphens inside compound words and in slugs are fine. This is a standing client preference, not a style opinion.
- **No dependencies and no `package.json`.** This repo has neither. Use built in `fetch` and Node built ins only.
- **No live email may be sent during implementation.** Not to the client, not to a test address, not to anyone. The first real send is the client's own, after this plan is complete.
- **Environment variables are fixed:** `RESEND_API_KEY`, `FROM_EMAIL`, `CLINIC_EMAIL`. No new ones. Never log or echo their values, only whether they are present.
- **Reply-to is `hello@tomthechiropractor.co.uk`.** BCC comes from `CLINIC_EMAIL`, never hardcoded.
- **Guide URLs are absolute:** `https://tomthechiropractor.co.uk/guides/<slug>.html`
- **Line endings:** `.gitattributes` normalises to CRLF on commit. "LF will be replaced by CRLF" warnings are expected and harmless.
- **Another session may push to this repo.** Run `git fetch -q origin && git rev-list --left-right --count origin/main...HEAD` before every commit. The LEFT number counts commits on origin/main that this branch does not have, and it must be 0. The right number counts this branch's own unmerged work and will grow as the plan proceeds, which is normal.
- **Work happens on the `send-guide-feature` branch,** never on main. Main is merged into at the end, once the whole feature has passed review.
- **Email palette, fixed:** ground `#EFEADF`, card `#FFFFFF`, border `#E3E1DD`, ink `#00262A`, teal `#007a7a`, body grey `#5F6470`, muted `#8A8F9A`. Arial for body, Georgia for the greeting. Card `max-width:560px`, `border-radius:12px`.

### Deviation from the spec

The spec specifies `guides/guides.json`. This plan uses **`guides/guides.mjs`** exporting the same object as an ES module default export. Reason: a Vercel serverless function cannot read a JSON file reliably without either JSON import assertions (Node version sensitive) or an `includeFiles` bundling directive. A `.mjs` module is imported normally by the function and dynamically by the page. The single source of truth property the spec asked for is unchanged. Nothing else in the spec changes.

### Testing approach, and why it looks unusual

This machine has **no Node, no npm, no npx, no jq and no Python**. There is no test runner and no way to install one. Tests therefore run in the browser pane's JavaScript engine against a self contained harness page built by a shell script, plus shell scripts for anything touching the filesystem.

Two constraints follow, and the code must respect them:

1. **The browser pane renders local files as `data:` URL snapshots**, so relative `<link>`, `<script src>` and `fetch()` never resolve. Every harness page must be fully self contained with all source inlined.
2. **`api/send-guide.mjs` must be laid out in a fixed order** so the harness can inline it: imports first, then all pure functions, then `export default async function handler` **last**. The harness strips the imports and everything from the handler line down. Do not put a pure function below the handler.

---

## File Structure

| File | Status | Responsibility |
|---|---|---|
| `.vercelignore` | Modify | Keep `docs` and `tests` off the public site |
| `guides/guides.mjs` | Create | The only list of guides. Titles and grouping |
| `api/send-guide.mjs` | Create | Validation, email construction, one Resend call |
| `send-guide.html` | Create | The interface Tom uses |
| `vercel.json` | Modify | One rewrite so `/send-guide` works without `.html` |
| `tests/check-slugs.sh` | Create | Every slug resolves to a real guide file |
| `tests/harness-tests.js` | Create | Assertions for the data module and the pure functions |
| `tests/build-harness.sh` | Create | Builds the self contained harness page |

---

### Task 1: Keep docs and tests off the public site

**Files:**
- Modify: `.vercelignore`

**Interfaces:**
- Consumes: nothing
- Produces: nothing consumed by later tasks. This is a standalone safety fix that must land first, because Task 2 onward add files that would otherwise be publicly served.

- [ ] **Step 1: Confirm the problem is real**

```bash
cd "C:/Users/wikel/OneDrive/Documents/GitHub/tom-the-chiropractor"
cat .vercelignore
```

Expected: a single line reading `design`. Nothing excludes `docs`, so the committed spec would be served at `https://tomthechiropractor.co.uk/docs/superpowers/specs/2026-09-20-guide-email-distributor-design.md` once pushed.

- [ ] **Step 2: Add the two exclusions**

```bash
printf 'docs\ntests\n' >> .vercelignore
cat .vercelignore
```

Expected output, three lines:

```
design
docs
tests
```

- [ ] **Step 3: Commit**

```bash
git fetch -q origin && git rev-list --left-right --count origin/main...HEAD
git add .vercelignore
git commit -m "Keep docs and tests off the deployed site

The spec committed in ae056a7 would otherwise be served as a public
URL. It records accepted risks and a note about a compromised API key,
neither of which belongs on the clinic website."
```

The left number from `git rev-list` must be 0 before you commit. If it is not, origin/main has moved: stop and resolve that before going further. The right number is this branch's own commits and is expected to be nonzero.

Confirm you are on the right branch first: `git rev-parse --abbrev-ref HEAD` must print `send-guide-feature`.

---

### Task 2: The guide data module

**Files:**
- Create: `guides/guides.mjs`
- Create: `tests/check-slugs.sh`

**Interfaces:**
- Consumes: nothing
- Produces: `guides/guides.mjs` default export, shape `{ guides: Record<slug, {title: string}>, groups: Array<{heading: string, slugs: string[]}> }`. Task 3 imports it as `guidesData`. Task 5 imports it dynamically in the browser.

- [ ] **Step 1: Write the failing test**

Create `tests/check-slugs.sh`:

```bash
#!/bin/sh
# Checks the guide data module against reality:
#   every slug it names has a real guide file
#   every slug a group references is defined
#   the totals are what the design says they are
# Run from the repo root: sh tests/check-slugs.sh

set -e
cd "$(dirname "$0")/.."
FAIL=0

if [ ! -f guides/guides.mjs ]; then
  echo "FAIL: guides/guides.mjs does not exist"
  exit 1
fi

# .gitattributes normalises this repo to CRLF, so carriage returns are
# stripped before matching. Without this the anchored patterns below match
# in the working copy but fail on a fresh clone, which is worse than
# failing outright.
SRC=$(tr -d '\r' < guides/guides.mjs)

# Slugs defined as keys of the guides object: lines like   "low-back-pain": {
DEFINED=$(echo "$SRC" | grep -oE '^    "[a-z0-9-]+":' | tr -d ' ":' | sort)
# Slugs referenced inside group slugs arrays: lines like       "low-back-pain",
REFERENCED=$(echo "$SRC" | grep -oE '^        "[a-z0-9-]+",?$' | tr -d ' ",' | sort)

DEFINED_COUNT=$(echo "$DEFINED" | grep -c .)
REFERENCED_COUNT=$(echo "$REFERENCED" | grep -c .)
GROUP_COUNT=$(echo "$SRC" | grep -c '"heading":')

echo "defined slugs:    $DEFINED_COUNT (expect 21)"
echo "slug references:  $REFERENCED_COUNT (expect 27)"
echo "groups:           $GROUP_COUNT (expect 6)"

[ "$DEFINED_COUNT" -eq 21 ] || { echo "FAIL: expected 21 defined guides"; FAIL=1; }
[ "$REFERENCED_COUNT" -eq 27 ] || { echo "FAIL: expected 27 slug references"; FAIL=1; }
[ "$GROUP_COUNT" -eq 6 ] || { echo "FAIL: expected 6 groups"; FAIL=1; }

for slug in $DEFINED; do
  if [ ! -f "guides/$slug.html" ]; then
    echo "FAIL: guides/$slug.html does not exist"
    FAIL=1
  fi
done

for slug in $(echo "$REFERENCED" | sort -u); do
  if ! echo "$DEFINED" | grep -qx "$slug"; then
    echo "FAIL: group references undefined slug: $slug"
    FAIL=1
  fi
done

for slug in $DEFINED; do
  if ! echo "$REFERENCED" | grep -qx "$slug"; then
    echo "FAIL: guide is defined but in no group: $slug"
    FAIL=1
  fi
done

if [ "$FAIL" -eq 0 ]; then
  echo "PASS: guide data is consistent"
else
  echo "FAILED"
  exit 1
fi
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
sh tests/check-slugs.sh
```

Expected: `FAIL: guides/guides.mjs does not exist`, exit code 1.

- [ ] **Step 3: Write the data module**

Create `guides/guides.mjs`. The indentation matters, because `tests/check-slugs.sh` matches on it: guide keys at four spaces, slug references at eight.

```javascript
// The only list of patient guides. Edited here and nowhere else.
//
// send-guide.html renders this, and api/send-guide.mjs checks submitted
// slugs against it, so the two can never disagree about what a guide is
// called or whether it exists.
//
// A guide that belongs to two body areas is defined once and listed in
// both groups. Six of them are, which is why there are 21 guides but 27
// entries in the lists.

export default {
  guides: {
    "low-back-pain": { "title": "Low Back Pain in Your 30s, 40s and 50s" },
    "low-back-pain-over-60": { "title": "Low Back Pain Over 60" },
    "back-pain-and-sciatica": { "title": "Back Pain and Sciatica" },
    "back-pain-and-sciatica-over-60": { "title": "Back Pain and Sciatica Over 60" },
    "back-and-leg-pain": { "title": "Back Pain That Travels Down One Leg" },
    "back-and-leg-pain-when-recovery-slows": { "title": "Back and Leg Pain: When Fast Recovery Slows Down" },
    "back-pain-manual-work": { "title": "Back Pain When You Work With Your Body" },
    "hip-arthritis-and-low-back-pain": { "title": "When Hip Arthritis Starts Costing You Your Back" },
    "neck-and-back-pain-together": { "title": "Neck and Back Pain at the Same Time" },
    "neck-and-back-pain-with-diabetes": { "title": "Neck and Back Pain When You Have Diabetes" },
    "neck-pain": { "title": "Neck Pain in Your 30s, 40s and 50s" },
    "neck-pain-over-60": { "title": "Neck Pain Over 60" },
    "neck-disc-pain-and-arm-symptoms": { "title": "Neck Disc Pain and Arm Symptoms" },
    "neck-pain-after-a-disc-settles": { "title": "Your Neck After a Disc Flare-Up Has Settled" },
    "neck-and-upper-back-pain": { "title": "Mechanical Neck and Upper Back Pain" },
    "headaches-from-the-neck": { "title": "Headaches That Come From the Neck" },
    "upper-back-pain": { "title": "Upper Back Pain in Your 30s, 40s and 50s" },
    "upper-back-pain-over-60": { "title": "Upper Back Pain Over 60" },
    "shoulder-pain": { "title": "Shoulder Pain in Your 30s, 40s and 50s" },
    "shoulder-pain-over-60": { "title": "Shoulder Pain Over 60" },
    "tennis-elbow": { "title": "Tennis Elbow" }
  },
  groups: [
    {
      "heading": "Low back and leg",
      "slugs": [
        "low-back-pain",
        "low-back-pain-over-60",
        "back-pain-and-sciatica",
        "back-pain-and-sciatica-over-60",
        "back-and-leg-pain",
        "back-and-leg-pain-when-recovery-slows",
        "back-pain-manual-work",
        "hip-arthritis-and-low-back-pain",
        "neck-and-back-pain-together",
        "neck-and-back-pain-with-diabetes"
      ]
    },
    {
      "heading": "Neck",
      "slugs": [
        "neck-pain",
        "neck-pain-over-60",
        "neck-disc-pain-and-arm-symptoms",
        "neck-pain-after-a-disc-settles",
        "neck-and-upper-back-pain",
        "headaches-from-the-neck",
        "neck-and-back-pain-together",
        "neck-and-back-pain-with-diabetes"
      ]
    },
    {
      "heading": "Upper back",
      "slugs": [
        "upper-back-pain",
        "upper-back-pain-over-60",
        "neck-and-upper-back-pain"
      ]
    },
    {
      "heading": "Shoulder and arm",
      "slugs": [
        "shoulder-pain",
        "shoulder-pain-over-60",
        "tennis-elbow",
        "neck-disc-pain-and-arm-symptoms"
      ]
    },
    {
      "heading": "Hip",
      "slugs": [
        "hip-arthritis-and-low-back-pain"
      ]
    },
    {
      "heading": "Headaches",
      "slugs": [
        "headaches-from-the-neck"
      ]
    }
  ]
};
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
sh tests/check-slugs.sh
```

Expected:

```
defined slugs:    21 (expect 21)
slug references:  27 (expect 27)
groups:           6 (expect 6)
PASS: guide data is consistent
```

If any `guides/<slug>.html does not exist` line appears, the slug is misspelled. Compare against `ls guides/*.html`.

- [ ] **Step 5: Commit**

```bash
git fetch -q origin && git rev-list --left-right --count origin/main...HEAD
git add guides/guides.mjs tests/check-slugs.sh
git commit -m "Add the guide data module and its integrity check

One list of guides, used by both the send page and the endpoint, so
they cannot disagree. Six guides sit in two body areas each, which is
why 21 guides produce 27 list entries."
```

---

### Task 3: Pure functions in the endpoint

**Files:**
- Create: `api/send-guide.mjs` (pure functions only in this task, no handler yet)
- Create: `tests/harness-tests.js`
- Create: `tests/build-harness.sh`

**Interfaces:**
- Consumes: `guides/guides.mjs` default export from Task 2.
- Produces, all exported from `api/send-guide.mjs`:
  - `escapeHtml(value: unknown) => string`
  - `guideUrl(slug: string) => string`
  - `validate(data: GuidesData, body: object) => {ok: true, safe: {name, email, slug, title}} | {ok: false, error: string}`
  - `buildSubject(title: string) => string`
  - `buildText(fields: {name, title, url}) => string`
  - `buildHtml(fields: {name, title, url}) => string`

  Task 4 calls all six from the handler. Task 4 must not rename any of them.

- [ ] **Step 1: Write the harness builder**

Create `tests/build-harness.sh`:

```bash
#!/bin/sh
# Builds a self contained test page and prints its path.
#
# The browser pane renders local files as data: URL snapshots, so nothing
# relative resolves. Everything therefore gets inlined into one file.
#
# From api/send-guide.mjs this takes the imports off the top and the
# handler off the bottom, leaving the pure functions, and strips the
# export keywords so the result runs as a plain script rather than a
# module. That is why the handler must be the last thing in that file.

set -e
cd "$(dirname "$0")/.."
OUT="${1:-harness.html}"

# A literal </script anywhere in the inlined source would close the page's
# script block early and leave the rest of it rendered as text. Escaping it
# changes nothing in JavaScript, where "<\/script>" and "</script>" are the
# same string, only where the browser thinks the block ends.
esc() { sed 's|</script|<\\/script|g'; }

DATA=$(sed 's/^export default /const GUIDES = /' guides/guides.mjs | esc)

if [ -f api/send-guide.mjs ]; then
  PURE=$(sed '/^export default async function handler/,$d' api/send-guide.mjs \
         | sed '/^import /d' \
         | sed 's/^export function /function /' \
         | esc)
else
  PURE="// api/send-guide.mjs does not exist yet"
fi

TESTS=$(esc < tests/harness-tests.js)

cat > "$OUT" <<HTMLEOF
<!doctype html>
<meta charset="utf-8">
<title>harness</title>
<pre id="out">running</pre>
<script>
$DATA
$PURE
$TESTS
</script>
HTMLEOF

echo "$OUT"
```

- [ ] **Step 2: Write the failing tests**

Create `tests/harness-tests.js`. It runs inside the harness page, where `GUIDES` and the pure functions are already defined above it.

```javascript
// Assertions for the guide data and the endpoint's pure functions.
// Runs inside the page built by tests/build-harness.sh. Results land in
// the #out element and in window.__results so they can be read back.

(function () {
  var pass = 0;
  var lines = [];

  function check(label, condition) {
    if (condition) {
      pass = pass + 1;
      lines.push("pass  " + label);
    } else {
      lines.push("FAIL  " + label);
    }
  }

  function runsWithoutThrowing(label, fn) {
    var threw = false;
    try { fn(); } catch (e) { threw = true; }
    check(label, threw === false);
  }

  // The data module
  check("21 guides defined", Object.keys(GUIDES.guides).length === 21);
  check("6 groups", GUIDES.groups.length === 6);
  check("27 slug references", GUIDES.groups.reduce(function (n, g) {
    return n + g.slugs.length;
  }, 0) === 27);
  check("first group is Low back and leg", GUIDES.groups[0].heading === "Low back and leg");
  check("hip guide is in two groups", GUIDES.groups.filter(function (g) {
    return g.slugs.indexOf("hip-arthritis-and-low-back-pain") !== -1;
  }).length === 2);

  // escapeHtml
  check("escapeHtml handles ampersand", escapeHtml("Bob & Sue") === "Bob &amp; Sue");
  check("escapeHtml handles angle brackets", escapeHtml("<b>") === "&lt;b&gt;");
  check("escapeHtml handles quotes", escapeHtml('a"b') === "a&quot;b");
  check("escapeHtml handles apostrophe", escapeHtml("O'Neill") === "O&#39;Neill");
  check("escapeHtml handles null", escapeHtml(null) === "");

  // guideUrl
  check("guideUrl builds an absolute url",
    guideUrl("low-back-pain") === "https://tomthechiropractor.co.uk/guides/low-back-pain.html");

  // validate
  var good = validate(GUIDES, { name: "Sarah", email: "sarah@example.com", slug: "low-back-pain" });
  check("valid submission passes", good.ok === true);
  check("valid submission returns the title", good.ok && good.safe.title === "Low Back Pain in Your 30s, 40s and 50s");
  check("valid submission trims the name",
    validate(GUIDES, { name: "  Sarah  ", email: "s@e.com", slug: "neck-pain" }).safe.name === "Sarah");

  check("missing name rejected", validate(GUIDES, { name: "", email: "s@e.com", slug: "neck-pain" }).ok === false);
  check("whitespace name rejected", validate(GUIDES, { name: "   ", email: "s@e.com", slug: "neck-pain" }).ok === false);
  check("overlong name rejected", validate(GUIDES, {
    name: new Array(100).join("a"), email: "s@e.com", slug: "neck-pain"
  }).ok === false);
  check("bad email rejected", validate(GUIDES, { name: "Sarah", email: "not-an-email", slug: "neck-pain" }).ok === false);
  check("empty email rejected", validate(GUIDES, { name: "Sarah", email: "", slug: "neck-pain" }).ok === false);
  check("unknown slug rejected", validate(GUIDES, { name: "Sarah", email: "s@e.com", slug: "made-up" }).ok === false);
  check("missing slug rejected", validate(GUIDES, { name: "Sarah", email: "s@e.com" }).ok === false);
  check("non string fields rejected", validate(GUIDES, { name: 42, email: {}, slug: [] }).ok === false);
  runsWithoutThrowing("validate survives an empty body", function () { validate(GUIDES, {}); });
  runsWithoutThrowing("validate survives no body at all", function () { validate(GUIDES, undefined); });

  // buildSubject
  check("subject names the guide", buildSubject("Neck Pain Over 60") === "Your guide: Neck Pain Over 60");

  // buildText
  var text = buildText({
    name: "Sarah",
    title: "Neck Pain Over 60",
    url: "https://tomthechiropractor.co.uk/guides/neck-pain-over-60.html"
  });
  check("plain text greets by name", text.indexOf("Hi Sarah,") === 0);
  check("plain text carries the url", text.indexOf("https://tomthechiropractor.co.uk/guides/neck-pain-over-60.html") !== -1);
  check("plain text carries the urgent help line", text.indexOf("When to get urgent help") !== -1);
  check("plain text says no mailing list", text.indexOf("mailing list") !== -1);
  check("plain text has no dashes", text.indexOf("\u2014") === -1 && text.indexOf("\u2013") === -1);

  // buildHtml
  var html = buildHtml({
    name: "Sarah",
    title: "Neck Pain Over 60",
    url: "https://tomthechiropractor.co.uk/guides/neck-pain-over-60.html"
  });
  check("html greets by name", html.indexOf("Hi Sarah,") !== -1);
  check("html has a button to the guide",
    html.indexOf('href="https://tomthechiropractor.co.uk/guides/neck-pain-over-60.html"') !== -1);
  check("html shows the bare url too", html.indexOf(">https://tomthechiropractor.co.uk/guides/neck-pain-over-60.html<") !== -1);
  check("html uses the teal button colour", html.indexOf("#007a7a") !== -1);
  check("html uses the cream ground", html.indexOf("#EFEADF") !== -1);
  check("html carries the urgent help line", html.indexOf("When to get urgent help") !== -1);
  check("html has no dashes", html.indexOf("\u2014") === -1 && html.indexOf("\u2013") === -1);

  var escaped = buildHtml({ name: "<script>x</script>", title: "T & U", url: "https://x/y.html" });
  check("name is escaped into the html", escaped.indexOf("<script>x</script>") === -1);
  check("title is escaped into the html", escaped.indexOf("T &amp; U") !== -1);

  var total = lines.length;
  var summary = (pass === total ? "PASS" : "FAIL") + "  " + pass + "/" + total;
  window.__results = summary + "\n" + lines.join("\n");
  document.getElementById("out").textContent = window.__results;
  document.title = summary;
})();
```

- [ ] **Step 3: Run the tests to verify they fail**

```bash
sh tests/build-harness.sh "$SCRATCH/harness.html"
```

where `$SCRATCH` is the session scratchpad directory. Open that file in the browser pane and read the result:

```
mcp__Claude_Browser__navigate  -> file:///<path to harness.html>
mcp__Claude_Browser__javascript_tool -> document.getElementById("out").textContent
```

Expected: the data assertions pass and every assertion touching `escapeHtml`, `guideUrl`, `validate`, `buildSubject`, `buildText` or `buildHtml` fails, because those functions do not exist yet. A thrown `ReferenceError` leaves `#out` reading `running`, which also counts as a failure at this step.

- [ ] **Step 4: Write the pure functions**

Create `api/send-guide.mjs`. Pure functions only. The handler is Task 4 and must go below these.

```javascript
// Sends one patient guide to one patient, and blind copies the clinic.
//
// Nothing is stored. No database, no file, no Resend Audience. The only
// lasting records are Resend's own send log and the blind copy that lands
// in the clinic inbox, both of which are covered in the design document
// at docs/superpowers/specs/2026-09-20-guide-email-distributor-design.md
//
// Uses the same three environment variables as the other two endpoints:
//   RESEND_API_KEY   the key from resend.com
//   FROM_EMAIL       e.g. Tom the Chiropractor <hello@send.tomthechiropractor.co.uk>
//   CLINIC_EMAIL     the blind copy address, e.g. hello@tomthechiropractor.co.uk
//
// Layout note: every pure function lives above the handler, and the
// handler is the last thing in the file. tests/build-harness.sh relies on
// that to inline the testable half into a browser harness.

import guidesData from "../guides/guides.mjs";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const SITE = "https://tomthechiropractor.co.uk";
const REPLY_TO = "hello@tomthechiropractor.co.uk";

export function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

export function guideUrl(slug) {
  return SITE + "/guides/" + slug + ".html";
}

// Returns either the cleaned up fields or the one thing that is wrong.
// The slug check is what stops this endpoint putting an arbitrary URL
// inside a clinic branded email.
export function validate(data, body) {
  const source = body && typeof body === "object" ? body : {};
  const name = typeof source.name === "string" ? source.name.trim() : "";
  const email = typeof source.email === "string" ? source.email.trim() : "";
  const slug = typeof source.slug === "string" ? source.slug.trim() : "";

  if (!name) return { ok: false, error: "Add a first name." };
  if (name.length > 80) return { ok: false, error: "That name is too long." };
  if (email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "That email address does not look right." };
  }

  const guide = data.guides[slug];
  if (!guide) return { ok: false, error: "Pick a guide." };

  return { ok: true, safe: { name, email, slug, title: guide.title } };
}

export function buildSubject(title) {
  return "Your guide: " + title;
}

export function buildText({ name, title, url }) {
  return [
    "Hi " + name + ",",
    "",
    "Here's the guide I mentioned in clinic, " + title + ". It's worth a read.",
    "",
    url,
    "",
    "There's only so much I can get through in an appointment, and most people find that what we talked about has half faded by the time they get home. That's completely normal. It isn't you being forgetful. This puts it all in one place so you can go back over it whenever you want, at your own pace.",
    "",
    "If anything in it doesn't match what you're feeling, bring it to your next appointment and we'll go through it.",
    "",
    "Tom",
    "Tom the Chiropractor, Loughborough",
    "",
    "",
    "I'm sending this because we talked about it at your appointment. I haven't added you to a mailing list and you won't hear from me again unless you get in touch.",
    "",
    "This guide is general information, not a diagnosis. It has a section called \"When to get urgent help\". If you read only one part of it, read that one."
  ].join("\n");
}

export function buildHtml({ name, title, url }) {
  const safeName = escapeHtml(name);
  const safeTitle = escapeHtml(title);
  const safeUrl = escapeHtml(url);
  const body = "font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#5F6470;";
  const small = "font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#8A8F9A;";

  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:24px 12px;background:#EFEADF;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#EFEADF;">
<tr><td align="center">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px;background:#FFFFFF;border:1px solid #E3E1DD;border-radius:12px;">
<tr><td style="padding:32px 32px 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;color:#00262A;">Hi ${safeName},</td></tr>
<tr><td style="padding:0 32px;${body}">
<p style="margin:16px 0 24px;">Here's the guide I mentioned in clinic, <strong style="color:#00262A;">${safeTitle}</strong>. It's worth a read.</p>
</td></tr>
<tr><td style="padding:0 32px;">
<a href="${safeUrl}" style="display:inline-block;background:#007a7a;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:8px;">Read the guide</a>
</td></tr>
<tr><td style="padding:14px 32px 0;${small}word-break:break-all;">${safeUrl}</td></tr>
<tr><td style="padding:0 32px;${body}">
<p style="margin:24px 0;">There's only so much I can get through in an appointment, and most people find that what we talked about has half faded by the time they get home. That's completely normal. It isn't you being forgetful. This puts it all in one place so you can go back over it whenever you want, at your own pace.</p>
<p style="margin:24px 0;">If anything in it doesn't match what you're feeling, bring it to your next appointment and we'll go through it.</p>
<p style="margin:24px 0 4px;color:#00262A;">Tom</p>
<p style="margin:0 0 28px;font-size:14px;color:#8A8F9A;">Tom the Chiropractor, Loughborough</p>
</td></tr>
<tr><td style="padding:0 32px;"><div style="height:1px;background:#E3E1DD;font-size:0;line-height:1px;">&nbsp;</div></td></tr>
<tr><td style="padding:20px 32px 32px;${small}">
<p style="margin:0 0 12px;">I'm sending this because we talked about it at your appointment. I haven't added you to a mailing list and you won't hear from me again unless you get in touch.</p>
<p style="margin:0;">This guide is general information, not a diagnosis. It has a section called &ldquo;When to get urgent help&rdquo;. If you read only one part of it, read that one.</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

```bash
sh tests/build-harness.sh "$SCRATCH/harness.html"
```

Reload the harness in the browser pane and read `#out` again.

Expected first line: `PASS` followed by two equal numbers, for example `PASS  38/38`. Every line below it begins `pass`. Do not treat a particular total as the target: the count is whatever the assertions above come to. If any line begins `FAIL`, fix the function rather than the assertion, unless the assertion is provably wrong.

- [ ] **Step 6: Commit**

```bash
git fetch -q origin && git rev-list --left-right --count origin/main...HEAD
git add api/send-guide.mjs tests/harness-tests.js tests/build-harness.sh
git commit -m "Add the guide email builders and their tests

Validation, subject, plain text and HTML, all pure and all tested. The
slug check is the piece that stops the endpoint putting an arbitrary URL
inside a clinic branded email.

Tests run in the browser pane against an inlined harness, because this
machine has no Node, no npm and no Python."
```

---

### Task 4: The request handler

**Files:**
- Modify: `api/send-guide.mjs` (append the handler below the pure functions)

**Interfaces:**
- Consumes: `escapeHtml`, `guideUrl`, `validate`, `buildSubject`, `buildText`, `buildHtml` from Task 3, and `guidesData` from Task 2.
- Produces: the HTTP contract the page in Task 5 depends on.
  - `GET /api/send-guide` responds `200` with `{configured: boolean, present: {RESEND_API_KEY, FROM_EMAIL, CLINIC_EMAIL}}`, all booleans, and sends no email.
  - `POST /api/send-guide` with `{slug, name, email}` responds `200 {ok: true}` on success, `400 {error}` on bad input, `500 {error, missing}` when configuration is absent, `502 {error}` when Resend fails, `405 {error}` on any other method.

- [ ] **Step 1: Write the failing test**

Append to `tests/harness-tests.js`, immediately before the closing `})();`:

```javascript
  // The handler is not inlined into this harness, so what is checked here
  // is the error mapping it depends on, as a pure function.
  check("401 maps to a key problem", resendErrorMessage(401) === "The Resend API key is missing or has been revoked.");
  check("403 maps to a key problem", resendErrorMessage(403) === "The Resend API key is missing or has been revoked.");
  check("422 maps to a bad address", resendErrorMessage(422) === "Resend would not accept that email address.");
  check("400 maps to a bad address", resendErrorMessage(400) === "Resend would not accept that email address.");
  check("500 maps to a Resend outage", resendErrorMessage(500) === "Resend could not be reached. Try again in a minute.");
  check("0 maps to a Resend outage", resendErrorMessage(0) === "Resend could not be reached. Try again in a minute.");
```

- [ ] **Step 2: Run it to verify it fails**

```bash
sh tests/build-harness.sh "$SCRATCH/harness.html"
```

Reload in the browser pane and read `#out`.

Expected: a `FAIL` summary with the six new lines failing, or `#out` still reading `running` if the `ReferenceError` stops the script before it writes. Either is the expected failure.

- [ ] **Step 3: Add the error mapper and the handler**

Add `resendErrorMessage` **above** the handler, with the other pure functions:

```javascript
// Resend's status code turned into something worth reading, because the
// fix differs: a bad address is retyped, a dead key is replaced in Vercel,
// an outage is waited out.
export function resendErrorMessage(status) {
  if (status === 401 || status === 403) {
    return "The Resend API key is missing or has been revoked.";
  }
  if (status === 400 || status === 422) {
    return "Resend would not accept that email address.";
  }
  return "Resend could not be reached. Try again in a minute.";
}
```

Then append the handler as the **last** thing in the file:

```javascript
export default async function handler(req, res) {
  // Setup check. Says which variables Vercel can see, by name only, never
  // by value, so the configuration can be confirmed without emailing a
  // real person to find out.
  if (req.method === "GET") {
    return res.status(200).json({
      configured: Boolean(process.env.RESEND_API_KEY && process.env.FROM_EMAIL && process.env.CLINIC_EMAIL),
      present: {
        RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
        FROM_EMAIL: Boolean(process.env.FROM_EMAIL),
        CLINIC_EMAIL: Boolean(process.env.CLINIC_EMAIL)
      }
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  } catch (err) {
    return res.status(400).json({ error: "That request did not make sense." });
  }

  const checked = validate(guidesData, body);
  if (!checked.ok) return res.status(400).json({ error: checked.error });

  const { name, email, slug, title } = checked.safe;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;
  const clinic = process.env.CLINIC_EMAIL;

  if (!apiKey || !from || !clinic) {
    const missing = [
      !apiKey && "RESEND_API_KEY",
      !from && "FROM_EMAIL",
      !clinic && "CLINIC_EMAIL"
    ].filter(Boolean);
    return res.status(500).json({ error: "Email is not switched on yet.", missing });
  }

  const url = guideUrl(slug);
  const fields = { name, title, url };

  let response;
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [email],
        bcc: [clinic],
        reply_to: REPLY_TO,
        subject: buildSubject(title),
        text: buildText(fields),
        html: buildHtml(fields)
      })
    });
  } catch (err) {
    // Unlike the desk check endpoint, nothing here is swallowed. If the
    // patient did not get their guide, whoever pressed send needs to know
    // straight away, because nothing else will tell them.
    console.error("send-guide: network failure", err);
    return res.status(502).json({ error: resendErrorMessage(0) });
  }

  if (!response.ok) {
    let detail = "";
    try { detail = await response.text(); } catch (err) { detail = "(no body)"; }
    console.error("send-guide: resend rejected the send", response.status, detail);
    return res.status(502).json({ error: resendErrorMessage(response.status) });
  }

  return res.status(200).json({ ok: true });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
sh tests/build-harness.sh "$SCRATCH/harness.html"
```

Expected first line: `PASS` followed by two equal numbers. The total is six higher than it was at the end of Task 3.

- [ ] **Step 5: Verify the file layout the harness depends on**

```bash
grep -n "^export default async function handler" api/send-guide.mjs
grep -c "^export function" api/send-guide.mjs
awk '/^export default async function handler/{found=NR} END{print "handler at line", found, "of", NR}' api/send-guide.mjs
```

Expected: exactly one handler line, seven exported pure functions, and the handler's line number close to the end of the file with only its own body below it. If any `export function` appears after the handler line, move it up or the harness will stop testing it silently.

- [ ] **Step 6: Commit**

```bash
git fetch -q origin && git rev-list --left-right --count origin/main...HEAD
git add api/send-guide.mjs tests/harness-tests.js
git commit -m "Add the send-guide request handler

GET reports which environment variables are present, by name only, and
sends nothing. POST validates, sends one Resend call with the patient in
to and the clinic in bcc, and returns a real error when it fails rather
than pretending it worked."
```

---

### Task 5: The send page

**Files:**
- Create: `send-guide.html`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: `guides/guides.mjs` from Task 2, and the HTTP contract from Task 4.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the page**

Create `send-guide.html` at the repo root:

```html
<!doctype html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Send a guide</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="css/tokens.css">
<style>
  *{box-sizing:border-box;}
  body{
    margin:0;
    padding:0 0 120px;
    background:var(--color-cream,#EFEADF);
    color:var(--color-ink,#00262A);
    font-family:var(--font-family,'Rubik',sans-serif);
    -webkit-text-size-adjust:100%;
  }
  .wrap{max-width:640px;margin:0 auto;padding:28px 20px 0;}
  h1{font-size:28px;line-height:1.2;margin:0 0 6px;}
  .sub{margin:0 0 24px;font-size:15px;line-height:1.5;color:var(--ink-b3,rgba(0,38,42,.7));}
  .fields{display:flex;gap:12px;flex-wrap:wrap;margin:0 0 28px;}
  .field{flex:1 1 220px;display:flex;flex-direction:column;gap:6px;}
  .field span{font-size:13px;font-weight:700;letter-spacing:.02em;}
  input{
    font:inherit;font-size:16px;padding:12px 14px;border-radius:8px;
    border:1px solid var(--color-tan,#e6dfd0);background:#fff;color:inherit;
  }
  input:focus-visible{outline:2px solid var(--color-teal,#00A6A6);outline-offset:1px;}
  h2{
    font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
    margin:26px 0 8px;color:var(--ink-b3,rgba(0,38,42,.7));
  }
  .guide{
    display:block;width:100%;text-align:left;font:inherit;font-size:16px;
    padding:13px 14px;margin:0 0 6px;cursor:pointer;
    background:#fff;color:inherit;border:1px solid var(--color-tan,#e6dfd0);
    border-left:4px solid transparent;border-radius:8px;
  }
  .guide:focus-visible{outline:2px solid var(--color-teal,#00A6A6);outline-offset:1px;}
  .guide[aria-checked="true"]{
    border-left-color:var(--color-teal,#00A6A6);
    background:var(--cream-cc,#f7f4ee);
    font-weight:700;
  }
  .bar{
    position:fixed;left:0;right:0;bottom:0;
    display:flex;gap:12px;align-items:center;
    padding:12px 20px calc(12px + env(safe-area-inset-bottom,0px));
    background:#fff;border-top:1px solid var(--color-tan,#e6dfd0);
  }
  .bar span{flex:1;font-size:14px;line-height:1.35;}
  button.send{
    font:inherit;font-weight:700;font-size:16px;padding:13px 22px;border:0;
    border-radius:8px;background:var(--color-teal,#00A6A6);color:#fff;cursor:pointer;
  }
  button.send:disabled{opacity:.5;cursor:default;}
  .msg{margin:20px 0 0;padding:13px 15px;border-radius:8px;font-size:15px;line-height:1.5;}
  .msg.ok{background:#e4f2ef;color:#00524f;}
  .msg.bad{background:#f8e4e0;color:var(--color-red,#C1432E);}
</style>
</head>
<body>
<main class="wrap">
  <h1>Send a guide</h1>
  <p class="sub">Pick a guide, add their first name and email, press send. Nothing is saved anywhere and a copy comes to the clinic inbox.</p>

  <div class="fields">
    <label class="field"><span>First name</span>
      <input id="name" type="text" maxlength="80" autocomplete="off" autocapitalize="words">
    </label>
    <label class="field"><span>Email</span>
      <input id="email" type="email" maxlength="200" autocomplete="off" autocapitalize="off" spellcheck="false">
    </label>
  </div>

  <div id="list" role="radiogroup" aria-label="Choose a guide">Loading guides...</div>
  <p id="msg" class="msg" hidden></p>
</main>

<div class="bar" id="bar" hidden>
  <span id="chosen"></span>
  <button class="send" id="send" type="button">Send guide</button>
</div>

<script type="module">
const data = (await import("./guides/guides.mjs")).default;

const list = document.getElementById("list");
const bar = document.getElementById("bar");
const chosen = document.getElementById("chosen");
const sendButton = document.getElementById("send");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const msg = document.getElementById("msg");

let selected = null;

// A guide in two body areas is rendered twice on purpose, so it is found
// wherever it is looked for. Selecting either copy marks both, so two
// identical titles are never ambiguous.
list.textContent = "";
for (const group of data.groups) {
  const heading = document.createElement("h2");
  heading.textContent = group.heading;
  list.append(heading);

  for (const slug of group.slugs) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "guide";
    button.dataset.slug = slug;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", "false");
    button.textContent = data.guides[slug].title;
    button.addEventListener("click", () => select(slug));
    list.append(button);
  }
}

function select(slug) {
  selected = slug;
  for (const button of list.querySelectorAll(".guide")) {
    button.setAttribute("aria-checked", String(button.dataset.slug === slug));
  }
  chosen.textContent = data.guides[slug].title;
  bar.hidden = false;
  refresh();
}

function refresh() {
  const ready = Boolean(selected)
    && nameInput.value.trim().length > 0
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
  sendButton.disabled = !ready;
}

function say(text, kind) {
  msg.textContent = text;
  msg.className = "msg " + kind;
  msg.hidden = false;
}

nameInput.addEventListener("input", refresh);
emailInput.addEventListener("input", refresh);

sendButton.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const title = data.guides[selected].title;

  sendButton.disabled = true;
  sendButton.textContent = "Sending...";
  msg.hidden = true;

  let payload;
  try {
    const response = await fetch("/api/send-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: selected, name, email: emailInput.value.trim() })
    });
    payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "That did not send.");
  } catch (error) {
    // Nothing is cleared on failure. A mistyped address is corrected in
    // one field rather than everything being typed again.
    sendButton.textContent = "Send guide";
    refresh();
    say(error.message, "bad");
    return;
  }

  nameInput.value = "";
  emailInput.value = "";
  selected = null;
  for (const button of list.querySelectorAll(".guide")) {
    button.setAttribute("aria-checked", "false");
  }
  bar.hidden = true;
  sendButton.textContent = "Send guide";
  refresh();
  say("Sent " + title + " to " + name + ".", "ok");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

refresh();
</script>
</body>
</html>
```

- [ ] **Step 2: Test the page renders and groups correctly**

Build a self contained copy, because the browser pane cannot resolve the relative import or the stylesheet:

Use awk, not sed. sed cannot take a whole file as replacement text: `css/tokens.css` contains forward slashes, which terminate the expression. awk reads the files instead of interpolating them, which is also how the other inlined previews in this repo are built.

```bash
cd "C:/Users/wikel/OneDrive/Documents/GitHub/tom-the-chiropractor"
awk '
  /<link rel="stylesheet" href="css\/tokens.css">/ {
    print "<style>";
    while ((getline line < "css/tokens.css") > 0) print line;
    close("css/tokens.css");
    print "</style>";
    next
  }
  /<script type="module">/ {
    print "<script>window.__GUIDES =";
    while ((getline line < "guides/guides.mjs") > 0) {
      sub(/^export default /, "", line);
      print line;
    }
    close("guides/guides.mjs");
    print "</script>";
    print "<script type=\"module\">";
    next
  }
  /const data = \(await import\("\.\/guides\/guides\.mjs"\)\)\.default;/ {
    print "const data = window.__GUIDES;";
    next
  }
  { print }
' send-guide.html > "$SCRATCH/page.html"
grep -c "__GUIDES" "$SCRATCH/page.html"
```

Expected: `2`, one assignment and one read. A `0` means neither pattern matched and the harness is just a copy of the page, so the checks below would be meaningless.

Open `$SCRATCH/page.html` in the browser pane and measure the DOM rather than relying on a screenshot, which has timed out on this machine before:

```javascript
JSON.stringify({
  groups: [...document.querySelectorAll("h2")].map(h => h.textContent),
  rows: document.querySelectorAll(".guide").length,
  distinct: new Set([...document.querySelectorAll(".guide")].map(b => b.dataset.slug)).size,
  firstRow: document.querySelector(".guide").textContent,
  sendDisabled: document.getElementById("send").disabled,
  barHidden: document.getElementById("bar").hidden
})
```

Expected:

```json
{"groups":["Low back and leg","Neck","Upper back","Shoulder and arm","Hip","Headaches"],
 "rows":27,"distinct":21,
 "firstRow":"Low Back Pain in Your 30s, 40s and 50s",
 "sendDisabled":true,"barHidden":true}
```

- [ ] **Step 3: Test that selecting a duplicated guide marks both copies**

In the browser pane:

```javascript
document.querySelector('[data-slug="hip-arthritis-and-low-back-pain"]').click();
JSON.stringify({
  checked: document.querySelectorAll('[aria-checked="true"]').length,
  chosen: document.getElementById("chosen").textContent,
  barHidden: document.getElementById("bar").hidden,
  stillDisabled: document.getElementById("send").disabled
})
```

Expected: `{"checked":2,"chosen":"When Hip Arthritis Starts Costing You Your Back","barHidden":false,"stillDisabled":true}`

Two copies checked, the bar visible, and send still disabled because no name or email has been typed.

- [ ] **Step 4: Test that send only enables with all three fields**

In the browser pane:

```javascript
const n = document.getElementById("name"), e = document.getElementById("email");
n.value = "Sarah"; n.dispatchEvent(new Event("input"));
const afterName = document.getElementById("send").disabled;
e.value = "not-an-email"; e.dispatchEvent(new Event("input"));
const afterBadEmail = document.getElementById("send").disabled;
e.value = "sarah@example.com"; e.dispatchEvent(new Event("input"));
const afterGoodEmail = document.getElementById("send").disabled;
JSON.stringify({ afterName, afterBadEmail, afterGoodEmail })
```

Expected: `{"afterName":true,"afterBadEmail":true,"afterGoodEmail":false}`

**Do not click the send button.** This harness page posts to a relative URL that will not resolve, but the rule stands regardless: no send is triggered during implementation.

- [ ] **Step 5: Check the page at phone width**

```
mcp__Claude_Browser__resize_window -> preset "mobile"
```

Then in the browser pane:

```javascript
JSON.stringify({
  docWidth: document.documentElement.scrollWidth,
  viewport: window.innerWidth,
  overflows: document.documentElement.scrollWidth > window.innerWidth,
  fieldsStacked: document.querySelectorAll(".field")[0].getBoundingClientRect().bottom
    <= document.querySelectorAll(".field")[1].getBoundingClientRect().top + 1,
  barCoversContent: document.getElementById("bar").getBoundingClientRect().height
})
```

Expected: `overflows` is `false`, and `fieldsStacked` is `true` at 375px wide. If `overflows` is `true`, something has a fixed width that needs to become a max width. Reset with `resize_window -> preset "desktop"` afterwards.

- [ ] **Step 6: Add the rewrite**

Replace `vercel.json` with:

```json
{
  "redirects": [
    { "source": "/index.html", "destination": "/", "permanent": true }
  ],
  "rewrites": [
    { "source": "/send-guide", "destination": "/send-guide.html" }
  ]
}
```

- [ ] **Step 7: Confirm nothing else in the repo links to the page**

```bash
grep -rn "send-guide" --include="*.html" --include="*.xml" . | grep -v "^./send-guide.html" | grep -v "^./docs/"
```

Expected: no output. The page must not appear in the nav, the footer or `sitemap.xml`.

- [ ] **Step 8: Commit**

```bash
git fetch -q origin && git rev-list --left-right --count origin/main...HEAD
git add send-guide.html vercel.json
git commit -m "Add the send-guide page

Guides grouped by body area, with the six that span two areas listed in
both. A sticky send bar so a guide chosen near the bottom of 27 rows
does not need a scroll back up to send it.

Not linked from the nav, the footer or the sitemap, and noindexed."
```

---

### Task 6: Deploy and verify without sending anything

**Files:** none changed. This task is verification only.

**Interfaces:**
- Consumes: everything from Tasks 1 to 5.
- Produces: a verified deployment and a short list of checks for the client to run on their own first send.

- [ ] **Step 1: Confirm the working tree is clean and in sync**

```bash
cd "C:/Users/wikel/OneDrive/Documents/GitHub/tom-the-chiropractor"
git status --porcelain
git fetch -q origin && git rev-list --left-right --count origin/main...HEAD
```

Expected: no output from the first, and `0	0` from the second.

- [ ] **Step 2: Ask before pushing**

Pushing deploys to the live site. Ask the client to confirm, then:

```bash
git push origin main
```

- [ ] **Step 3: Wait for the deploy, then check the page is live and noindexed**

```bash
sleep 45
curl -s -o /dev/null -w "page %{http_code}\n" https://tomthechiropractor.co.uk/send-guide.html
curl -s -o /dev/null -w "clean url %{http_code}\n" https://tomthechiropractor.co.uk/send-guide
curl -s https://tomthechiropractor.co.uk/send-guide.html | grep -o 'name="robots"[^>]*'
```

Expected: `page 200`, `clean url 200`, and `name="robots" content="noindex, nofollow"`.

- [ ] **Step 4: Check the data module is served as JavaScript**

```bash
curl -s -o /dev/null -w "guides.mjs %{http_code} %{content_type}\n" https://tomthechiropractor.co.uk/guides/guides.mjs
```

Expected: `200` with a content type containing `javascript`. If it comes back as `text/plain` or `application/octet-stream`, the browser will refuse the module import and the page will show "Loading guides..." forever. The fix is a `headers` entry in `vercel.json` setting `Content-Type: text/javascript` for `/guides/guides.mjs`.

- [ ] **Step 5: Check the docs and tests directories are not public**

```bash
curl -s -o /dev/null -w "spec %{http_code}\n" https://tomthechiropractor.co.uk/docs/superpowers/specs/2026-09-20-guide-email-distributor-design.md
curl -s -o /dev/null -w "tests %{http_code}\n" https://tomthechiropractor.co.uk/tests/harness-tests.js
```

Expected: `404` for both. A `200` on either means Task 1 did not take effect.

- [ ] **Step 6: Check the endpoint's configuration without sending**

```bash
curl -s https://tomthechiropractor.co.uk/api/send-guide
```

Expected: `{"configured":true,"present":{"RESEND_API_KEY":true,"FROM_EMAIL":true,"CLINIC_EMAIL":true}}`

Any `false` means that variable is missing in Vercel. This is a GET and sends no email.

- [ ] **Step 7: Check the endpoint rejects bad input, still without sending**

Each of these is rejected before any Resend call is made, so none of them sends an email.

```bash
curl -s -X POST https://tomthechiropractor.co.uk/api/send-guide \
  -H "Content-Type: application/json" \
  -d '{"slug":"not-a-real-guide","name":"Test","email":"nobody@example.com"}'

curl -s -X POST https://tomthechiropractor.co.uk/api/send-guide \
  -H "Content-Type: application/json" \
  -d '{"slug":"low-back-pain","name":"","email":"nobody@example.com"}'

curl -s -X POST https://tomthechiropractor.co.uk/api/send-guide \
  -H "Content-Type: application/json" \
  -d '{"slug":"low-back-pain","name":"Test","email":"nonsense"}'

curl -s -X PUT https://tomthechiropractor.co.uk/api/send-guide
```

Expected in order: `{"error":"Pick a guide."}`, `{"error":"Add a first name."}`, `{"error":"That email address does not look right."}`, `{"error":"Method not allowed"}`.

**Send no valid POST.** A valid POST emails a real person.

- [ ] **Step 8: Hand over to the client for the first real send**

Before they send, they must confirm at resend.com/api-keys that the key in Vercel was generated **after** the old one was pasted into conversation. The old key is compromised.

Then give them this list to check on the first send, which they make to their own address:

1. It arrives, and it is not in the junk folder.
2. The greeting uses the name they typed.
3. The **Read the guide** button opens the right guide.
4. The plain URL under the button matches the button.
5. Pressing reply addresses `hello@tomthechiropractor.co.uk`, not the `send.` subdomain.
6. A blind copy arrives in the clinic inbox.
7. On a phone, the card is not cut off at the right edge.

---

## Self Review

**Spec coverage.** Every section of the spec maps to a task. Purpose and the "not stored" position are realised by there being no storage code anywhere in Tasks 2 to 5. The decisions table is realised across Tasks 2, 4 and 5. The accepted risk is realised by the deliberate absence of a honeypot, a rate limit and name character validation. The three kept checks are in Task 3 (`escapeHtml`, the email format test, the slug lookup). Architecture, grouping, interface, email, failure handling, configuration and testing each have their own task. Out of scope items appear nowhere in the plan.

**Deviation recorded.** `guides.json` became `guides.mjs`, with the reason stated at the top of this plan. This is the only departure from the approved spec.

**Placeholder scan.** No TBD, no TODO, no "add appropriate error handling", no "similar to Task N". Every code step carries the actual code. Every test step carries the actual command and the actual expected output.

**Type consistency.** `escapeHtml`, `guideUrl`, `validate`, `buildSubject`, `buildText`, `buildHtml` and `resendErrorMessage` are named identically in Task 3, Task 4 and the harness. `validate` returns `{ok, safe}` or `{ok, error}` consistently. The page posts `{slug, name, email}`, which is exactly what `validate` destructures. The data shape `{guides, groups}` is identical in Task 2, the harness, the handler and the page.

**One risk carried forward.** Task 6 Step 4 exists because Vercel's content type for `.mjs` is assumed, not verified. If it serves as anything other than JavaScript, the fix is a `headers` rule and it is written into that step.
