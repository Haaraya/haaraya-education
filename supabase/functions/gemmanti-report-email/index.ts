// ============================================================
// Haaraya - gemmanti-report-email Edge Function
//
// POST, called from Gemmanti by a signed-in teacher or school admin:
//   { class_id: uuid, child_ids: uuid[], catalogue: { [book_code]: { title, level, strand } } }
//
// For each pupil the caller is allowed to see (class teacher or school
// admin, school has the Gemmanti add-on, pupil is in that class), emails
// the family their child's worksheet report. Ratings are read from the
// database, never taken from the request. Teacher notes are never sent.
// The score column is included only when the class's score switch is on.
//
// Uses the same SMTP account as weekly-parent-email (SMTP_HOST, SMTP_PORT,
// SMTP_USER, SMTP_PASS, SMTP_FROM). Port 465.
// ============================================================

import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import nodemailer from "npm:nodemailer@6.9.15";

const env = (k: string) => Deno.env.get(k) ?? "";
const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });

const ALLOWED_ORIGINS = [
  "https://haaraya.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];
function cors(req: Request) {
  const o = req.headers.get("origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
const json = (req: Request, body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });

const SECTIONS: [string, string][] = [["wf", "Word Focus"], ["ra", "Read It Again"], ["ta", "Think About It"], ["sw", "Show What You Know"]];
const RATING: Record<string, string> = { NY: "Not Yet", D: "Developing", S: "Secure", B: "Beyond", "-": "Not observed", "–": "Not observed", A: "Absent" };
const HELP: Record<string, string> = { modelled: "Modelled", prompted: "Prompted", independent: "Independent" };
const POINTS: Record<string, number> = { NY: 0, D: 1, S: 2, B: 2 };

function score(r: Record<string, string>) {
  let pts = 0, max = 0, star = false;
  for (const v of Object.values(r || {})) if (v in POINTS) { pts += POINTS[v]; max += 2; if (v === "B") star = true; }
  return max ? `${pts}/${max} · ${Math.round((pts / max) * 100)}%${star ? " ★" : ""}` : "—";
}
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
const childName = (c: any) => c.display_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || "Your child";

type Cat = Record<string, { title?: string; level?: number; strand?: string }>;

function render(child: any, cls: any, school: any, reviews: any[], cat: Cat, withScores: boolean) {
  const name = childName(child);
  const first = name.split(" ")[0];
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const rows = reviews
    .map((r) => ({ r, w: cat[r.book_code] || {} }))
    .sort((a, b) => (a.w.level ?? 99) - (b.w.level ?? 99) || a.r.book_code.localeCompare(b.r.book_code));
  const th = "text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#666;border-bottom:1px solid #ddd;padding:6px 8px";
  const td = "border-bottom:1px solid #eee;padding:8px;vertical-align:top;font-size:14px";
  const table = rows.length
    ? `<table style="border-collapse:collapse;width:100%"><thead><tr><th style="${th}">Worksheet</th>${SECTIONS.map(([, n]) => `<th style="${th}">${n}</th>`).join("")}<th style="${th}">Help</th>${withScores ? `<th style="${th}">Score</th>` : ""}</tr></thead><tbody>${
        rows.map(({ r, w }) => `<tr><td style="${td}"><b>${esc(w.title || r.book_code)}</b>${w.level ? `<br><span style="font-size:12px;color:#777">Level ${esc(w.level)}${w.strand ? " · " + esc(w.strand) : ""}</span>` : ""}</td>${
          SECTIONS.map(([k]) => `<td style="${td}">${esc(RATING[(r.ratings || {})[k]] || "—")}</td>`).join("")
        }<td style="${td}">${esc(HELP[r.help_level] || "—")}</td>${withScores ? `<td style="${td};white-space:nowrap">${esc(score(r.ratings))}</td>` : ""}</tr>`).join("")
      }</tbody></table>`
    : `<p style="color:#666">No worksheets recorded yet.</p>`;
  const key = `<p style="font-size:12px;color:#555;line-height:1.5"><b>What the words mean.</b> Not Yet: cannot do it yet. Developing: partly right, or not yet reliable. Secure: does it accurately. Beyond: uses it in something new. Not observed: the teacher did not see enough of this part to judge.</p>
<p style="font-size:12px;color:#555;line-height:1.5"><b>Help</b> shows the most help ${esc(first)} needed: Modelled (the teacher showed how), Prompted (a hint), or Independent (no help).${withScores ? " The score counts Not Yet as 0, Developing as 1, and Secure or Beyond as 2 for each part rated. ★ marks work beyond the book." : ""}</p>`;
  const html = `<!doctype html><html><body style="margin:0;background:#f6f4ee;font-family:Arial,Helvetica,sans-serif;color:#1d2a22">
<div style="max-width:720px;margin:0 auto;padding:24px 16px"><div style="background:#fff;border-radius:10px;padding:24px">
<div style="font-size:11px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;color:#0f5a3c">Haaraya Literacy · Worksheet report</div>
<h1 style="font-size:22px;margin:6px 0 2px">${esc(name)}</h1>
<p style="margin:0 0 4px;color:#555;font-size:14px">${esc([cls.name, school?.name].filter(Boolean).join(" · "))}</p>
<p style="margin:0 0 16px;color:#777;font-size:13px">${esc(today)}</p>
${table}
<div style="margin-top:16px">${key}</div>
</div><p style="font-size:12px;color:#888;text-align:center;margin-top:12px">Sent by ${esc(school?.name || "your child's school")} through Haaraya.</p></div></body></html>`;
  const lines = rows.map(({ r, w }) =>
    `${w.title || r.book_code}: ${SECTIONS.map(([k, n]) => `${n} ${RATING[(r.ratings || {})[k]] || "-"}`).join(", ")}; Help ${HELP[r.help_level] || "-"}${withScores ? `; Score ${score(r.ratings)}` : ""}`);
  const text = `Worksheet report for ${name}\n${[cls.name, school?.name].filter(Boolean).join(" · ")}\n${today}\n\n${lines.length ? lines.join("\n") : "No worksheets recorded yet."}\n`;
  return { subject: `${first}'s worksheet report · ${school?.name || cls.name}`, html, text };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "method" }, 405);

  // Who is calling: their own token, so their own access rules apply.
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json(req, { error: "signed-out" }, 401);
  const asUser = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: auth } }, auth: { persistSession: false },
  });
  const { data: u } = await asUser.auth.getUser();
  if (!u?.user) return json(req, { error: "signed-out" }, 401);
  const { data: me } = await admin.from("users").select("id").eq("auth_uid", u.user.id).maybeSingle();

  let body: any;
  try { body = await req.json(); } catch { return json(req, { error: "bad-request" }, 400); }
  const classId = String(body?.class_id || "");
  const ids: string[] = Array.isArray(body?.child_ids) ? body.child_ids.map(String).slice(0, 80) : [];
  const cat: Cat = body?.catalogue && typeof body.catalogue === "object" ? body.catalogue : {};
  if (!classId || !ids.length) return json(req, { error: "bad-request" }, 400);

  const { data: cls } = await admin.from("classrooms").select("id,name,school_id,show_scores").eq("id", classId).maybeSingle();
  if (!cls) return json(req, { error: "no-class" }, 404);
  const { data: school } = await admin.from("schools").select("id,name").eq("id", cls.school_id).maybeSingle();
  const { data: seats } = await admin.from("classroom_children").select("child_id").eq("classroom_id", classId).in("child_id", ids);
  const inClass = new Set((seats || []).map((s: any) => s.child_id));

  // Keep only pupils this person may see, in a Gemmanti school, in this class.
  const allowed: string[] = [];
  for (const id of ids) {
    if (!inClass.has(id)) continue;
    const [a, b] = await Promise.all([
      asUser.rpc("gemmanti_is_staff_for", { p_child: id }),
      asUser.rpc("gemmanti_child_enabled", { p_child: id }),
    ]);
    if (a.data === true && b.data === true) allowed.push(id);
  }
  if (!allowed.length) return json(req, { error: "not-allowed" }, 403);

  const [kids, contacts, reviews] = await Promise.all([
    admin.from("children").select("id,first_name,last_name,display_name").in("id", allowed),
    admin.from("school_pupil_contacts").select("child_id,family_email").in("child_id", allowed),
    admin.from("worksheet_reviews").select("child_id,book_code,ratings,help_level").in("child_id", allowed),
  ]);
  const emailOf = new Map((contacts.data || []).map((c: any) => [c.child_id, c.family_email]));
  const withScores = cls.show_scores !== false;

  const mail = nodemailer.createTransport({
    host: env("SMTP_HOST"), port: Number(env("SMTP_PORT") || 465), secure: true,
    auth: { user: env("SMTP_USER"), pass: env("SMTP_PASS") },
  });

  let sent = 0;
  const noEmail: string[] = [], noRecords: string[] = [], failed: string[] = [];
  for (const c of kids.data || []) {
    const to = emailOf.get(c.id);
    if (!to) { noEmail.push(childName(c)); continue; }
    const mine = (reviews.data || []).filter((r: any) => r.child_id === c.id);
    if (!mine.length) { noRecords.push(childName(c)); continue; }
    const m = render(c, cls, school, mine, cat, withScores);
    try {
      await mail.sendMail({ from: env("SMTP_FROM"), to, subject: m.subject, html: m.html, text: m.text });
      sent++;
      await admin.from("report_email_log").insert({
        child_id: c.id, sent_to: to, book_codes: mine.map((r: any) => r.book_code), with_scores: withScores, sent_by: me?.id ?? null,
      });
    } catch (e) {
      console.error("send failed", c.id, String(e));
      failed.push(childName(c));
    }
  }
  return json(req, { sent, no_email: noEmail, no_records: noRecords, failed });
});
