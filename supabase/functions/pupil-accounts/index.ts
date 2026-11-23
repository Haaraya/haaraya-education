// ============================================================
// Haaraya - pupil-accounts Edge Function (staff only)
//
// POST, called by a signed-in teacher, school admin or Haaraya admin:
//   { action: "ensure", child_ids: uuid[] }  -> creates any missing pupil logins
//   { action: "reset",  child_id: uuid }     -> gives the pupil a new PIN, unlocks
// Returns { logins: [{ child_id, username, pin }] } for the pupils the caller
// may manage (class teacher, school admin, or Haaraya admin).
//
// Each pupil gets a hidden Haaraya login (pupil-<child id>@pupils.haarayaeducation.org,
// never shown, no email ever sent) whose password is derived on the server, so
// the 4-digit PIN is only ever checked by pupil-signin.
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const env = (k: string) => Deno.env.get(k) ?? "";
const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
const ALLOWED = ["https://haaraya.github.io", "http://localhost:8000", "http://127.0.0.1:8000", "http://localhost:8765"];
const cors = (req: Request) => {
  const o = req.headers.get("origin") ?? "";
  return { "Access-Control-Allow-Origin": ALLOWED.includes(o) ? o : ALLOWED[0], "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" };
};
const json = (req: Request, body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors(req), "Content-Type": "application/json" } });

const pupilEmail = (childId: string) => `pupil-${childId}@pupils.haarayaeducation.org`;
async function pupilPassword(email: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("haaraya-pupil:" + env("SUPABASE_SERVICE_ROLE_KEY")), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(email)));
  return "Hp!" + Array.from(sig).map(b => b.toString(16).padStart(2, "0")).join("");
}
const newPin = () => { let p = ""; do { p = String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(4, "0"); } while (/^(\d)\1{3}$/.test(p) || ["1234", "4321", "0123", "9876"].includes(p)); return p; };
const slug = (s: string) => (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

async function callerProfile(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  // Same check as gemmanti-report-email: ask Auth who this token belongs to.
  const asUser = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY") || "sb_publishable_qW4msFbGQ9QuqIZ6-G8QfA_JY_pvcsY", {
    auth: { persistSession: false }, global: { headers: { Authorization: "Bearer " + token } },
  });
  const { data, error } = await asUser.auth.getUser(token);
  if (!data || !data.user) { console.warn("pupil-accounts: token not accepted", error?.message); return null; }
  const { data: u, error: ue } = await admin.from("users").select("id, role").eq("auth_uid", data.user.id).maybeSingle();
  if (ue) console.warn("pupil-accounts: profile lookup failed", ue.message);
  return u;
}
/* Pupils the caller may manage. */
async function manageable(me: { id: string; role: string }, ids: string[]) {
  const { data: kids } = await admin.from("children").select("id, first_name, last_name, display_name, school_id, pupil_user_id").in("id", ids);
  if (!kids) return [];
  if (me.role === "haaraya_admin") return kids;
  const { data: schools } = await admin.from("schools").select("id").eq("admin_user_id", me.id);
  const adminOf = new Set((schools || []).map(s => s.id));
  const { data: cls } = await admin.from("classrooms").select("id").eq("teacher_user_id", me.id);
  const clsIds = (cls || []).map(c => c.id);
  let taught = new Set<string>();
  if (clsIds.length) {
    const { data: cc } = await admin.from("classroom_children").select("child_id").in("classroom_id", clsIds).in("child_id", ids);
    taught = new Set((cc || []).map(r => r.child_id));
  }
  return kids.filter(k => k.school_id && (adminOf.has(k.school_id) || taught.has(k.id)));
}

async function uniqueUsername(first: string, last: string) {
  const base = ((slug(first) || "pupil") + (slug(last) ? "." + slug(last) : "")).slice(0, 30);
  for (let n = 0; n < 50; n++) {
    const u = n === 0 ? base : base + (n + 1);
    const { data } = await admin.from("pupil_logins").select("child_id").eq("username", u).maybeSingle();
    if (!data) return u;
  }
  return base + Date.now().toString(36).slice(-4);
}

async function ensure(kid: any) {
  const { data: have } = await admin.from("pupil_logins").select("child_id, username, pin, auth_uid").eq("child_id", kid.id).maybeSingle();
  if (have && have.auth_uid && kid.pupil_user_id) return have;
  const email = pupilEmail(kid.id);
  const password = await pupilPassword(email);
  const name = (kid.display_name || [kid.first_name, kid.last_name].filter(Boolean).join(" ") || "Pupil").trim();
  // Create the hidden login, or find it if a previous attempt got part-way.
  let authId: string | null = have?.auth_uid ?? null;
  if (!authId) {
    const cr = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name, role: "parent" } });
    if (cr.error) {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const found = list?.users?.find(u => u.email === email);
      if (!found) throw new Error(cr.error.message);
      authId = found.id;
      await admin.auth.admin.updateUserById(authId, { password });
    } else authId = cr.data.user.id;
  }
  // The profile row is made by the sign-up trigger; make it a pupil.
  let { data: prof } = await admin.from("users").select("id").eq("auth_uid", authId).maybeSingle();
  if (!prof) {
    const ins = await admin.from("users").insert({ auth_uid: authId, email, full_name: name, role: "pupil" }).select("id").single();
    if (ins.error) throw new Error(ins.error.message);
    prof = ins.data;
  } else {
    await admin.from("users").update({ role: "pupil", full_name: name }).eq("id", prof.id);
  }
  await admin.from("children").update({ pupil_user_id: prof.id }).eq("id", kid.id);
  const username = have?.username ?? await uniqueUsername(kid.first_name || name, kid.last_name || "");
  const pin = have?.pin ?? newPin();
  const up = await admin.from("pupil_logins").upsert({ child_id: kid.id, username, pin, auth_uid: authId, updated_at: new Date().toISOString() }, { onConflict: "child_id" });
  if (up.error) throw new Error(up.error.message);
  return { child_id: kid.id, username, pin };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "POST only" }, 405);
  try {
    const me = await callerProfile(req);
    if (!me || !["teacher", "school_admin", "haaraya_admin"].includes(me.role)) return json(req, { error: "Only teachers and school admins can manage pupil logins." }, 403);
    const body = await req.json().catch(() => ({}));
    if (body.action === "reset") {
      const [kid] = await manageable(me, [String(body.child_id || "")]);
      if (!kid) return json(req, { error: "You can't manage this pupil." }, 403);
      const l = await ensure(kid);
      const pin = newPin();
      await admin.from("pupil_logins").update({ pin, failed: 0, locked_until: null, updated_at: new Date().toISOString() }).eq("child_id", kid.id);
      return json(req, { logins: [{ child_id: kid.id, username: l.username, pin }] });
    }
    const ids: string[] = Array.isArray(body.child_ids) ? body.child_ids.map(String).slice(0, 200) : [];
    if (!ids.length) return json(req, { logins: [] });
    const kids = await manageable(me, ids);
    const logins = [];
    for (const k of kids) {
      try { logins.push(await ensure(k)); } catch (e) { logins.push({ child_id: k.id, error: String((e as Error).message || e) }); }
    }
    return json(req, { logins });
  } catch (e) {
    return json(req, { error: String((e as Error).message || e) }, 500);
  }
});
