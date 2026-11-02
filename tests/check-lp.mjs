// Checks the paid landing pages under lp/ against the rules in
// docs/superpowers/specs/2026-11-01-condition-landing-pages-pilot-design.md:
//   hidden from search, no site nav, one booking section, CTA prefixes,
//   links that only keep the visitor on the page (or book/call/message),
//   prices/hours/review count matching index.html, safety section present,
//   and the Google Ads runbook's final URLs and ad text lengths.
//
// Run from anywhere: node tests/check-lp.mjs [slug...]
// Exits 1 on any failure.

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://www.tomthechiropractor.co.uk";

// .gitattributes normalises the repo to CRLF; strip \r so patterns match
// the same on a fresh clone as in a working copy.
const read = (p) => readFileSync(join(ROOT, p), "utf8").replace(/\r/g, "");

const PAGES = {
  "back-pain": {
    prefix: "lp-back_",
    campaign: "lp-back",
    reviewers: ["Lewis Edwards", "Carolyn Quinn", "Pepe Lois", "Gurpreet L"],
  },
  "neck-pain": {
    prefix: "lp-neck_",
    campaign: "lp-neck",
    reviewers: ["Megan", "Alisonlee520", "Ramesh Mistry"],
  },
};

const FACTS = ["£70", "£45", "£200", "9am – 8pm", "9am – 3pm", "18 reviews", "07871 283457"];

const ALLOWED_HREF = [
  /^#/,
  /^tel:\+447871283457$/,
  /^https:\/\/wa\.me\/447871283457$/,
  /^https:\/\/tomthechiro\.neptune\.practicehub\.io\/?$/,
  /^https:\/\/www\.google\.com\/maps[/?]/,
  /^\.\.\/(cookie-policy|privacy-policy|cancellation-policy)\.html$/,
];

let failures = 0;
function check(label, ok) {
  console.log((ok ? "pass  " : "FAIL  ") + label);
  if (!ok) failures++;
}

function checkPage(slug) {
  const cfg = PAGES[slug];
  if (!cfg) { check(`${slug}: known slug`, false); return; }
  const path = `lp/${slug}.html`;
  const exists = existsSync(join(ROOT, path));
  check(`${slug}: file exists`, exists);
  if (!exists) return;

  const html = read(path);
  const body = html.slice(html.indexOf("<body"));
  const url = `${SITE}/lp/${slug}.html`;

  check(`${slug}: noindex`, html.includes('<meta name="robots" content="noindex,follow">'));
  check(`${slug}: canonical`,
    html.includes(`<link rel="canonical" href="${url}">`) &&
    html.includes(`<meta property="og:url" content="${url}">`));
  check(`${slug}: no site nav`, !html.includes("nav__links") && !html.includes("navToggle"));
  check(`${slug}: no schema`, !html.includes("application/ld+json"));
  check(`${slug}: one #book`, (html.match(/id="book"/g) || []).length === 1);

  const ctas = [...html.matchAll(/data-cta="([^"]*)"/g)].map((m) => m[1]);
  const badCtas = ctas.filter((c) => !c.startsWith(cfg.prefix));
  check(`${slug}: cta prefix${badCtas.length ? " (bad: " + badCtas.join(", ") + ")" : ""}`,
    badCtas.length === 0 &&
    ctas.includes(cfg.prefix + "hero") &&
    ctas.includes(cfg.prefix + "sticky-mobile"));

  const hrefs = [...body.matchAll(/href="([^"]*)"/g)].map((m) => m[1].replace(/&amp;/g, "&"));
  const badHrefs = hrefs.filter((h) => !ALLOWED_HREF.some((re) => re.test(h)));
  check(`${slug}: links allowed${badHrefs.length ? " (bad: " + badHrefs.join(", ") + ")" : ""}`,
    badHrefs.length === 0);

  const missingFacts = FACTS.filter((f) => !html.includes(f));
  const has60 = html.includes("60 minutes") || html.includes("60-minute");
  check(`${slug}: facts${missingFacts.length ? " (missing: " + missingFacts.join(", ") + ")" : ""}`,
    missingFacts.length === 0 && has60);

  const missingReviews = cfg.reviewers.filter((r) => !html.includes(r));
  check(`${slug}: reviews${missingReviews.length ? " (missing: " + missingReviews.join(", ") + ")" : ""}`,
    missingReviews.length === 0);

  check(`${slug}: safety callout`,
    /When I(?:'|&#39;|’)m not the right person/.test(html) && html.includes("A&amp;E"));

  const bookAt = html.indexOf('id="book"');
  check(`${slug}: fallback booking link`,
    bookAt !== -1 && html.indexOf("https://tomthechiro.neptune.practicehub.io", bookAt) !== -1);

  check(`${slug}: scripts`,
    ["../js/cookie-consent.js", "../js/tracking.js", "../js/script.js"]
      .every((s) => html.includes(`<script src="${s}"></script>`)));
}

function checkGlobal() {
  check("not in sitemap", !read("sitemap.xml").includes("/lp/") && !read("llms.txt").includes("/lp/"));
  check("index.html facts unchanged",
    ["£70", "£45", "£200", "18 reviews"].every((f) => read("index.html").includes(f)));
}

function checkRunbook() {
  const path = "docs/google-ads-lp-pilot.md";
  const exists = existsSync(join(ROOT, path));
  check("runbook exists", exists);
  if (!exists) return;
  const md = read(path);

  const expected = Object.entries(PAGES).map(([slug, c]) =>
    `${SITE}/lp/${slug}.html?utm_source=google&utm_medium=cpc&utm_campaign=${c.campaign}`);
  const found = md.match(/https:\/\/www\.tomthechiropractor\.co\.uk\/lp\/[^\s`)>]*/g) || [];
  const bad = found.filter((u) => !expected.includes(u));
  check(`runbook URLs${bad.length ? " (bad: " + bad.join(", ") + ")" : ""}`,
    bad.length === 0 && expected.every((u) => found.includes(u)));

  // Ad text lists: a "Headlines" or "Descriptions" heading/label line,
  // followed by numbered lines "1. text" until a blank line.
  const tooLong = [];
  let mode = null, count = { h: 0, d: 0 };
  for (const line of md.split("\n")) {
    if (/^\**(#+\s*)?.*Headlines\b/i.test(line)) { mode = "h"; continue; }
    if (/^\**(#+\s*)?.*Descriptions\b/i.test(line)) { mode = "d"; continue; }
    const item = line.match(/^\s*\d+\.\s+(.*?)\s*(?:\(pin[^)]*\))?\s*$/);
    if (mode && item) {
      const text = item[1].replace(/`/g, "");
      count[mode]++;
      if (text.length > (mode === "h" ? 30 : 90)) tooLong.push(`${text} (${text.length})`);
    } else if (mode && line.trim() === "") {
      // blank line between heading and list is fine; a blank after items ends it
      if (count[mode] > 0) mode = null;
    }
  }
  check(`ad text lengths${tooLong.length ? " (too long: " + tooLong.join("; ") + ")" : ""}`,
    tooLong.length === 0 && count.h === 30 && count.d === 8);
}

const slugs = process.argv.slice(2);
const all = slugs.length === 0;
(all ? Object.keys(PAGES) : slugs).forEach(checkPage);
checkGlobal();
if (all) checkRunbook();

console.log(failures ? `\n${failures} check(s) failed` : "\nall checks passed");
process.exit(failures ? 1 : 0);
