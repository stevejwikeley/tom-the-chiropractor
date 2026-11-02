// Screenshots the paid landing pages at phone and desktop widths and checks
// the things a paid visitor would hit first:
//   - an ad click's query string (gclid, utm) survives page load
//   - nothing overflows sideways
//   - the hero, its image and the booking section render
//   - on a phone, the sticky Book bar hides once the booking widget is on screen
//
// Run from the repo root: node tests/screenshot-lp.mjs [slug...]
// PNGs go to $SCREENSHOT_DIR (default ./.screenshots/). Exits 1 on failure.
// External embeds (PracticeHub, Google Maps) are blocked so the run is
// offline-safe; check those on the Vercel preview.

import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = process.env.SCREENSHOT_DIR || join(ROOT, ".screenshots");
const SLUGS = process.argv.slice(2).length ? process.argv.slice(2) : ["back-pain", "neck-pain"];
const CAMPAIGN = { "back-pain": "lp-back", "neck-pain": "lp-neck" };
const TYPES = {
  ".html": "text/html", ".css": "text/css", ".js": "text/javascript",
  ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".woff2": "font/woff2", ".ico": "image/x-icon",
};

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  try {
    const body = await readFile(join(ROOT, path));
    res.writeHead(200, { "content-type": TYPES[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404); res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
let failures = 0;
const check = (label, ok) => {
  console.log((ok ? "pass  " : "FAIL  ") + label);
  if (!ok) failures++;
};

for (const slug of SLUGS) {
  for (const [w, h] of [[390, 844], [1280, 800]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort());
    const qs = `?gclid=TEST123&utm_source=google&utm_medium=cpc&utm_campaign=${CAMPAIGN[slug]}`;
    await page.goto(`${base}/lp/${slug}.html${qs}`, { waitUntil: "load" });
    await page.evaluate(() => {
      // Hide the consent modal so it doesn't cover the screenshot.
      const b = document.getElementById("cookieBanner");
      if (b) b.hidden = true;
    });
    const tag = `${slug} @${w}`;

    check(`${tag}: query string kept`, page.url().includes("gclid=TEST123"));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`${tag}: no horizontal scroll (${overflow}px)`, overflow <= 0);
    check(`${tag}: h1 visible`, await page.locator("h1").isVisible());
    check(`${tag}: hero image loaded`, await page.locator(".hero__media img").evaluate((i) => i.complete && i.naturalWidth > 0));
    check(`${tag}: #book present`, (await page.locator("#book").count()) === 1);

    await page.screenshot({ path: join(OUT, `${slug}-${w}.png`), fullPage: true });

    if (w === 390) {
      await page.locator("#book").scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      const hidden = await page.locator(".sticky-cta").evaluate((el) => el.classList.contains("is-hidden"));
      check(`${tag}: sticky bar hides at booking`, hidden);
      await page.screenshot({ path: join(OUT, `${slug}-390-book.png`) });
    }
    await page.close();
  }
}

await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) failed` : `\nall checks passed; screenshots in ${OUT}`);
process.exit(failures ? 1 : 0);
