// Receives a completed desk check from /desk-check.html and emails it out:
// one copy to the person who filled it in, one copy to the clinic.
//
// Needs three environment variables in Vercel:
//   RESEND_API_KEY   the key from resend.com
//   FROM_EMAIL       e.g. Tom the Chiropractor <hello@send.tomthechiropractor.co.uk>
//   CLINIC_EMAIL     where your copy goes, e.g. hello@tomthechiropractor.co.uk

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function bandColour(score) {
  if (score <= 3) return { bg: "#E4F1EA", fg: "#1E6B4F" };
  if (score <= 7) return { bg: "#FBF0DC", fg: "#8A5A08" };
  return { bg: "#FAE7E2", fg: "#A23F2C" };
}

function fixesHtml(fixes) {
  if (!Array.isArray(fixes) || fixes.length === 0) {
    return '<p style="margin:0;color:#5F6470">Nothing flagged. Your setup is already doing the right things.</p>';
  }
  return fixes.map((f, i) => `
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 14px">
      <tr>
        <td style="width:28px;vertical-align:top;padding-top:2px">
          <div style="width:24px;height:24px;border-radius:12px;background:#DDEFEF;color:#007a7a;
                      font:700 13px/24px Arial,sans-serif;text-align:center">${i + 1}</div>
        </td>
        <td style="vertical-align:top;padding-left:10px">
          <div style="font:600 15px/1.4 Arial,sans-serif;color:#00262A">${escapeHtml(f.title)}</div>
          <div style="font:400 14px/1.55 Arial,sans-serif;color:#5F6470;margin-top:2px">${escapeHtml(f.body)}</div>
        </td>
      </tr>
    </table>`).join("");
}

function patientEmail({ name, score, band, fixes }) {
  const c = bandColour(score);
  return `
  <div style="background:#EFEADF;padding:26px 14px;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;width:100%;
           background:#FFFFFF;border:1px solid #E3E1DD;border-radius:12px">
      <tr><td style="padding:26px 24px 20px;text-align:center;border-bottom:1px solid #E3E1DD">
        <div style="font:600 12px/1 Arial,sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:#8A8F9A">
          Your desk check
        </div>
        <div style="font:700 50px/1 Georgia,serif;color:#00262A;margin:14px 0 6px">${score}<span
          style="font:400 16px/1 Arial,sans-serif;color:#5F6470"> out of 10</span></div>
        <div style="font:600 13px/1.4 Arial,sans-serif;color:#8A8F9A;margin:0 0 12px">Lower is better. 1 means a desk that is set up well, 10 means one that is working against you.</div>
        <div style="display:inline-block;background:${c.bg};color:${c.fg};border-radius:99px;
                    padding:6px 14px;font:600 14px/1 Arial,sans-serif">${escapeHtml(band)}</div>
      </td></tr>
      <tr><td style="padding:22px 24px">
        <p style="font:400 15px/1.6 Arial,sans-serif;color:#00262A;margin:0 0 18px">
          Hi ${escapeHtml(name)}, here is what came out of your desk check. Work down this list from the top:
          the first one or two will make most of the difference.
        </p>
        ${fixesHtml(fixes)}
      </td></tr>
      <tr><td style="padding:0 24px 24px">
        <div style="background:#00262A;border-radius:10px;padding:20px;text-align:center">
          <div style="font:600 17px/1.3 Georgia,serif;color:#FFFFFF;margin-bottom:8px">Some of it is not the desk</div>
          <div style="font:400 14px/1.55 Arial,sans-serif;color:#C3C7CF;margin-bottom:16px">
            If it has been there for weeks, wakes you up, or travels down an arm or a leg,
            a better chair will not fix it on its own.
          </div>
          <a href="https://www.tomthechiropractor.co.uk/#book"
             style="display:inline-block;background:#FFFFFF;color:#00262A;text-decoration:none;
                    border-radius:8px;padding:11px 20px;font:600 14px/1 Arial,sans-serif">Book an appointment</a>
        </div>
      </td></tr>
      <tr><td style="padding:0 24px 24px">
        <p style="font:400 12.5px/1.6 Arial,sans-serif;color:#8A8F9A;margin:0">
          Based on the Rapid Office Strain Assessment (Sonne, Villalta and Andrews, 2012). This is a guide to how your
          desk is set up, not a diagnosis. Reply to this email if you want a hand with any of it.<br><br>
          Tom the Chiropractor, The Work Lounge, 1 Beehive Lane, Loughborough LE11 2FJ.
          You are getting this because you asked for your results on tomthechiropractor.co.uk.
          Reply with the word remove and your details will be deleted.
        </p>
      </td></tr>
    </table>
  </div>`;
}

function clinicEmail({ name, email, score, band, sections, fixes, symptoms, answers }) {
  const row = (k, v) => `
    <tr>
      <td style="padding:6px 10px;border-bottom:1px solid #E3E1DD;font:400 13px/1.5 Arial,sans-serif;color:#5F6470;vertical-align:top">${escapeHtml(k)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #E3E1DD;font:600 13px/1.5 Arial,sans-serif;color:#00262A;vertical-align:top">${escapeHtml(v)}</td>
    </tr>`;

  return `
  <div style="background:#EFEADF;padding:22px 14px;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;width:100%;
           background:#FFFFFF;border:1px solid #E3E1DD;border-radius:10px">
      <tr><td style="padding:20px 22px 14px;border-bottom:1px solid #E3E1DD">
        <div style="font:600 12px/1 Arial,sans-serif;letter-spacing:1.4px;text-transform:uppercase;color:#8A8F9A">New desk check</div>
        <div style="font:700 22px/1.2 Georgia,serif;color:#00262A;margin-top:6px">${escapeHtml(name)} scored ${score} out of 10</div>
        <div style="font:400 14px/1.5 Arial,sans-serif;color:#5F6470;margin-top:4px">
          <a href="mailto:${escapeHtml(email)}" style="color:#007a7a">${escapeHtml(email)}</a> &middot; ${escapeHtml(band)}
        </div>
      </td></tr>
      <tr><td style="padding:16px 22px 6px">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
          ${row("Chair", String(sections.chair))}
          ${row("Screen and phone", String(sections.screenAndPhone))}
          ${row("Keyboard and mouse", String(sections.keyboardAndMouse))}
          ${row("Reported symptoms", symptoms && symptoms.length ? symptoms.join(", ") : "none given")}
        </table>
      </td></tr>
      <tr><td style="padding:14px 22px 4px">
        <div style="font:600 12px/1 Arial,sans-serif;letter-spacing:1.2px;text-transform:uppercase;color:#8A8F9A;margin-bottom:10px">Their answers</div>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
          ${(answers || []).map((a) => row(a.question, a.answer)).join("")}
        </table>
      </td></tr>
      <tr><td style="padding:16px 22px 22px">
        <div style="font:600 12px/1 Arial,sans-serif;letter-spacing:1.2px;text-transform:uppercase;color:#8A8F9A;margin-bottom:10px">What they were told to change</div>
        ${fixesHtml(fixes)}
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
  // Setup check. Reports which of the three environment variables Vercel can
  // see -- names only, never values -- so the email config can be verified
  // without putting a real submission through and emailing someone.
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
  const { name, email, consent, website, score, band, sections, fixes, symptoms, answers } = body;

  // Honeypot: real people never fill this in.
  if (website) return res.status(200).json({ ok: true });

  if (!name || typeof name !== "string" || name.length > 80) {
    return res.status(400).json({ error: "Please add your first name." });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return res.status(400).json({ error: "That email address does not look right." });
  }
  if (consent !== true) {
    return res.status(400).json({ error: "We need your permission before emailing you." });
  }
  if (typeof score !== "number" || score < 1 || score > 10) {
    return res.status(400).json({ error: "Something went wrong with the score. Please try again." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.FROM_EMAIL;
  const clinic = process.env.CLINIC_EMAIL;

  if (!apiKey || !from || !clinic) {
    // Report which names are absent so misconfiguration can be diagnosed without
    // guesswork. Names only, never values, so nothing sensitive is exposed.
    const missing = [
      !apiKey && "RESEND_API_KEY",
      !from && "FROM_EMAIL",
      !clinic && "CLINIC_EMAIL"
    ].filter(Boolean);
    console.error("send-assessment: missing env vars:", missing.join(", "));
    return res.status(500).json({ error: "Email is not switched on yet.", missing });
  }

  const safe = {
    name: String(name).slice(0, 80),
    email: String(email).slice(0, 200),
    score,
    band: String(band || "").slice(0, 60),
    sections: {
      chair: Number(sections && sections.chair) || 0,
      screenAndPhone: Number(sections && sections.screenAndPhone) || 0,
      keyboardAndMouse: Number(sections && sections.keyboardAndMouse) || 0
    },
    fixes: Array.isArray(fixes) ? fixes.slice(0, 15) : [],
    symptoms: Array.isArray(symptoms) ? symptoms.slice(0, 10).map(String) : [],
    answers: Array.isArray(answers) ? answers.slice(0, 20) : []
  };

  try {
    await sendEmail(apiKey, {
      from,
      to: [safe.email],
      reply_to: clinic,
      subject: `Your desk check: ${safe.score} out of 10`,
      html: patientEmail(safe)
    });
  } catch (err) {
    console.error("send-assessment: patient email failed", err);
    return res.status(502).json({ error: "We could not send your email just now." });
  }

  try {
    await sendEmail(apiKey, {
      from,
      to: [clinic],
      reply_to: safe.email,
      subject: `Desk check: ${safe.name}, ${safe.score}/10`,
      html: clinicEmail(safe)
    });
  } catch (err) {
    // The person already has their copy, so this is not worth failing the request over.
    console.error("send-assessment: clinic copy failed", err);
  }

  return res.status(200).json({ ok: true });
}
