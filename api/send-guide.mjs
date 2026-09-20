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
