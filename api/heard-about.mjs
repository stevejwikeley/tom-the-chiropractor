// Receives the "How did you find me?" answer from /thank-you.html and emails
// it to the clinic. Nothing is stored anywhere — the email in the inbox is
// the record, timestamped so it can be lined up against the booking that
// came through moments earlier.
//
// Deliberately anonymous: the thank-you page has no name or email on it (the
// booking widget keeps those), so this only ever sends the chosen source and,
// for "Other", whatever they typed. Nothing here is personal data unless they
// type something personal into that box.
//
// Reuses the same three environment variables as send-assessment.mjs:
//   RESEND_API_KEY   the key from resend.com
//   FROM_EMAIL       e.g. Tom the Chiropractor <hello@send.tomthechiropractor.co.uk>
//   CLINIC_EMAIL     where the answer goes, e.g. hello@tomthechiropractor.co.uk

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// The only sources the endpoint will accept. Keys must stay in step with the
// data-source values on the buttons in thank-you.html.
const SOURCES = {
  google_search: "Searched on Google",
  chatgpt: "ChatGPT",
  google_ai: "Google AI search",
  google_business: "Google Business listing",
  social: "Facebook or Instagram",
  friend: "From a friend",
  flyer: "Saw a flyer",
  other: "Other"
};

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function londonTimestamp() {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit"
  }).format(new Date());
}

function clinicEmail({ label, detail, when }) {
  return `
  <div style="background:#EFEADF;padding:22px 14px;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;width:100%;
           background:#FFFFFF;border:1px solid #E3E1DD;border-radius:10px">
      <tr><td style="padding:20px 22px 16px;border-bottom:1px solid #E3E1DD">
        <div style="font:600 12px/1 Arial,sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:#8A8F9A">How they found you</div>
        <div style="font:700 22px/1.3 Georgia,serif;color:#00262A;margin-top:8px">${escapeHtml(label)}</div>
        ${detail ? `<div style="font:400 15px/1.55 Arial,sans-serif;color:#00262A;background:#F5F3EE;
                     border-radius:8px;padding:12px 14px;margin-top:12px">${escapeHtml(detail)}</div>` : ""}
      </td></tr>
      <tr><td style="padding:14px 22px 20px">
        <div style="font:400 13px/1.6 Arial,sans-serif;color:#5F6470">
          Answered on the thank-you page at <strong style="color:#00262A">${escapeHtml(when)}</strong>,
          just after a booking went through. It is anonymous, so match it up by time against the booking itself.
        </div>
      </td></tr>
    </table>
  </div>`;
}

async function sendEmail(apiKey, payload) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend responded ${res.status}: ${detail.slice(0, 300)}`);
  }
  return res.json();
}

export default async function handler(req, res) {
  // Setup check, mirroring send-assessment.mjs: reports which of the three
  // environment variables Vercel can see -- names only, never values.
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

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const { source, detail, website } = body;

  // Honeypot: real people never fill this in.
  if (website) return res.status(200).json({ ok: true });

  const label = SOURCES[source];
  if (!label) return res.status(400).json({ error: "Please pick one of the options." });

  // Collapse every run of whitespace, newlines included, before this goes
  // anywhere near the subject line -- a raw newline in a mail header is the
  // classic header-injection opening, and it costs nothing to close it.
  const text = source === "other"
    ? String(detail == null ? "" : detail).replace(/\s+/g, " ").trim().slice(0, 300)
    : "";
  if (source === "other" && !text) {
    return res.status(400).json({ error: "Please tell me how you found me." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;
  const clinic = process.env.CLINIC_EMAIL;

  if (!apiKey || !from || !clinic) {
    const missing = [
      !apiKey && "RESEND_API_KEY",
      !from && "FROM_EMAIL",
      !clinic && "CLINIC_EMAIL"
    ].filter(Boolean);
    console.error("heard-about: missing env vars:", missing.join(", "));
    return res.status(500).json({ error: "Email is not switched on yet.", missing });
  }

  const when = londonTimestamp();

  try {
    await sendEmail(apiKey, {
      from,
      to: [clinic],
      subject: `How they found you: ${text ? `${label} — ${text.slice(0, 60)}` : label}`,
      html: clinicEmail({ label, detail: text, when })
    });
  } catch (err) {
    console.error("heard-about: clinic email failed", err);
    return res.status(502).json({ error: "Could not send that just now." });
  }

  return res.status(200).json({ ok: true });
}
