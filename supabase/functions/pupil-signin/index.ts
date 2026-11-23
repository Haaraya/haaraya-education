// ============================================================
// Haaraya - pupil-signin Edge Function (public)
//
// POST { username, pin } -> { access_token, refresh_token } for the pupil's own
// hidden Haaraya login. After 5 wrong PINs the login locks for 15 minutes.
// The website then calls supabase.auth.setSession() with the tokens.
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
const WRONG = "That username and PIN don't match. Check your login card and try again.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, { error: "POST only" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || "").trim().toLowerCase();
    const pin = String(body.pin || "").trim();
    if (!/^[a-z0-9.]{3,40}$/.test(username) || !/^[0-9]{4}$/.test(pin)) return json(req, { error: WRONG }, 401);
    const { data: row } = await admin.from("pupil_logins").select("child_id, pin, auth_uid, failed, locked_until").eq("username", username).maybeSingle();
    if (!row || !row.auth_uid) return json(req, { error: WRONG }, 401);
    if (row.locked_until && new Date(row.locked_until) > new Date()) return json(req, { error: "Too many tries. Please wait 15 minutes, or ask your teacher to reset your PIN." }, 429);
    if (row.pin !== pin) {
      const failed = (row.failed || 0) + 1;
      await admin.from("pupil_logins").update({ failed, locked_until: failed >= 5 ? new Date(Date.now() + 15 * 60000).toISOString() : null }).eq("child_id", row.child_id);
      return json(req, { error: failed >= 5 ? "Too many tries. Please wait 15 minutes, or ask your teacher to reset your PIN." : WRONG }, 401);
    }
    await admin.from("pupil_logins").update({ failed: 0, locked_until: null }).eq("child_id", row.child_id);
    const email = pupilEmail(row.child_id);
    const password = await pupilPassword(email);
    const anon = createClient(env("SUPABASE_URL"), env("SUPABASE_ANON_KEY") || "sb_publishable_qW4msFbGQ9QuqIZ6-G8QfA_JY_pvcsY", { auth: { persistSession: false } });
    let r = await anon.auth.signInWithPassword({ email, password });
    if (r.error) {
      // The server key may have changed since the login was made: set the password again and retry.
      await admin.auth.admin.updateUserById(row.auth_uid, { password });
      r = await anon.auth.signInWithPassword({ email, password });
    }
    if (r.error || !r.data.session) return json(req, { error: "Couldn't sign in just now. Please try again." }, 500);
    return json(req, { access_token: r.data.session.access_token, refresh_token: r.data.session.refresh_token });
  } catch (e) {
    return json(req, { error: "Couldn't sign in just now. Please try again." }, 500);
  }
});
