// ============================================================
//  Haaraya — weekly-parent-email Edge Function
//
//  POST (from pg_cron, header x-cron-secret)  -> sends every digest
//  POST ?dry=you@x.org                        -> sends ONE sample, to that address
//  GET  ?unsubscribe=<token>                  -> turns the email off
//
//  Sends through the SAME SMTP account Supabase Auth uses
//  (Dashboard → Authentication → Emails → SMTP settings). Copy those values:
//    supabase secrets set SMTP_HOST=smtp.example.com SMTP_PORT=465 \
//      SMTP_USER=... SMTP_PASS=... SMTP_FROM="Haaraya <info@haarayaeducation.org>" \
//      CRON_SECRET=<long random string> SITE_URL=https://haaraya.github.io/haaraya-education
//    supabase functions deploy weekly-parent-email --no-verify-jwt
//  Port 465 only: Edge Functions block outbound 25 and 587.
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import nodemailer from "npm:nodemailer@6.9.15";

const env = (k: string) => Deno.env.get(k) ?? "";
const SITE = env("SITE_URL") || "https://haaraya.github.io/haaraya-education";
const FN_URL = `${env("SUPABASE_URL")}/functions/v1/weekly-parent-email`;
const db = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

type Kid = {
  name: string; books: string[]; quiz_taken: number; quiz_passed: number; quiz_pct: number | null;
  days: number; stamps: number; stamps_total: number; odyssey: number; next: { code: string; title: string } | null;
};
type Row = { email: string; full_name: string; email_token: string; children: Kid[] };

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

function kidBlock(k: Kid) {
  const quiet = !k.books.length && !k.quiz_taken && !k.days && !k.odyssey;
  const lines: string[] = [];
  if (quiet) {
    lines.push(`No reading this week — a short book together tonight is a great restart.`);
  } else {
    lines.push(`<strong>${plural(k.books.length, "book")} finished</strong>${k.books.length ? ": " + k.books.map(esc).join(", ") : ""}`);
    lines.push(`Read on <strong>${plural(k.days, "day")}</strong> this week`);
    if (k.quiz_taken) lines.push(`Reading checks: <strong>${k.quiz_passed} of ${k.quiz_taken} passed</strong>${k.quiz_pct != null ? ` · ${k.quiz_pct}% of answers right` : ""}`);
    lines.push(`Stamps: <strong>+${k.stamps}</strong> this week · ${k.stamps_total} in the passport`);
    if (k.odyssey) lines.push(`Odyssey: <strong>${plural(k.odyssey, "stamp")}</strong> earned`);
  }
  const next = k.next
    ? `<tr><td style="padding:12px 0 0"><a href="${SITE}/Haaraya%20Home.html#library" style="display:inline-block;background:#1f7a34;color:#fff;text-decoration:none;font-weight:800;padding:10px 16px;border-radius:10px">Next up: ${esc(k.next.title)}</a></td></tr>`
    : "";
  return `<table role="presentation" width="100%" style="border:1px solid #e2e0d6;border-radius:14px;margin:0 0 14px;background:#fff"><tr><td style="padding:16px 18px;font-family:Arial,sans-serif;color:#142a14">
    <div style="font-size:18px;font-weight:800;margin:0 0 8px">${esc(k.name)}</div>
    <table role="presentation" width="100%">${lines.map((l) => `<tr><td style="padding:3px 0;font-size:15px;line-height:1.5">${l}</td></tr>`).join("")}${next}</table>
  </td></tr></table>`;
}

function render(r: Row) {
  const first = (r.full_name || "").split(" ")[0] || "there";
  const unsub = `${FN_URL}?unsubscribe=${r.email_token}`;
  const html = `<!doctype html><html><body style="margin:0;background:#faf9f5"><table role="presentation" width="100%"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="100%" style="max-width:560px"><tr><td style="font-family:Arial,sans-serif;color:#142a14">
    <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#5d6b60;font-weight:700">Haaraya · this week</div>
    <h1 style="font-size:24px;margin:6px 0 16px">Hi ${esc(first)}, here's your reading week.</h1>
    ${r.children.map(kidBlock).join("")}
    <p style="font-size:14px;margin:18px 0"><a href="${SITE}/Haaraya%20Home.html" style="color:#1f7a34;font-weight:700">Open the Parent Dashboard</a></p>
    <p style="font-size:12px;color:#5d6b60;line-height:1.5">You get this because you have a Haaraya parent account. <a href="${unsub}" style="color:#5d6b60">Stop weekly emails</a> · <a href="${SITE}/Haaraya%20Privacy.html" style="color:#5d6b60">Privacy</a></p>
  </td></tr></table></td></tr></table></body></html>`;
  const text = `Hi ${first}, here's your Haaraya reading week.\n\n` + r.children.map((k) =>
    `${k.name}: ${k.books.length} books finished, read on ${k.days} days, ${k.stamps} new stamps` +
    (k.quiz_taken ? `, ${k.quiz_passed}/${k.quiz_taken} reading checks passed` : "") +
    (k.odyssey ? `, ${k.odyssey} Odyssey stamps` : "") + (k.next ? `. Next up: ${k.next.title}` : "")).join("\n") +
    `\n\nStop weekly emails: ${unsub}`;
  return { html, text, unsub };
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  const token = url.searchParams.get("unsubscribe");
  if (token) {
    await db.rpc("weekly_email_unsubscribe", { p_token: token });
    return new Response(`<!doctype html><meta name="viewport" content="width=device-width"><body style="font-family:Arial,sans-serif;padding:40px;color:#142a14"><h2>You're unsubscribed.</h2><p>You won't get weekly progress emails any more. Account emails (like password resets) still arrive.</p><p><a href="${SITE}/Haaraya%20Home.html" style="color:#1f7a34">Back to Haaraya</a></p></body>`,
      { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  if (req.method !== "POST" || req.headers.get("x-cron-secret") !== env("CRON_SECRET")) {
    return new Response("forbidden", { status: 403 });
  }

  const { data, error } = await db.rpc("weekly_parent_digest");
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const mail = nodemailer.createTransport({
    host: env("SMTP_HOST"), port: Number(env("SMTP_PORT") || 465), secure: true,
    auth: { user: env("SMTP_USER"), pass: env("SMTP_PASS") },
  });

  const dry = url.searchParams.get("dry");
  const rows = (data as Row[]).slice(0, dry ? 1 : undefined);
  let sent = 0; const failed: string[] = [];
  for (const r of rows) {
    const m = render(r);
    try {
      await mail.sendMail({
        from: env("SMTP_FROM"), to: dry || r.email,
        subject: "Your Haaraya reading week",
        html: m.html, text: m.text,
        headers: { "List-Unsubscribe": `<${m.unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      });
      sent++;
    } catch (e) { failed.push(`${r.email}: ${(e as Error).message}`); }
    await new Promise((res) => setTimeout(res, 250)); // stay under SMTP rate limits
  }
  return new Response(JSON.stringify({ parents: rows.length, sent, failed }), { headers: { "content-type": "application/json" } });
});
