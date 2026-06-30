/* ============================================================
   Haaraya — Auth wrapper (real Supabase authentication)
   ------------------------------------------------------------
   Requires supabase-client.js (window.HaarayaSupabase).
   Exposes window.HaarayaAuth with a small, app-friendly surface.

     await HaarayaAuth.signUp({ email, password, fullName, role })
     await HaarayaAuth.signIn({ email, password })
     await HaarayaAuth.signOut()
     await HaarayaAuth.getSession()   // null when logged out
     await HaarayaAuth.getUser()      // auth user (id, email) or null
     await HaarayaAuth.getProfile()   // public.users row for this user
     HaarayaAuth.onChange((event, session) => { ... })
   ============================================================ */
(function () {
  "use strict";

  var sb = window.HaarayaSupabase;
  if (!sb) {
    console.error("[Haaraya] HaarayaSupabase not ready — include supabase-client.js first");
    return;
  }

  var profileCache = null;

  async function signUp(opts) {
    var email = opts.email, password = opts.password;
    var fullName = opts.fullName || "", role = opts.role || "parent";
    var res = await sb.auth.signUp({
      email: email,
      password: password,
      options: { data: { full_name: fullName, role: role } },
    });
    if (res.error) throw res.error;
    profileCache = null;
    return res.data;
  }

  async function signIn(opts) {
    var res = await sb.auth.signInWithPassword({
      email: opts.email,
      password: opts.password,
    });
    if (res.error) throw res.error;
    profileCache = null;
    return res.data;
  }

  async function signOut() {
    await sb.auth.signOut();
    profileCache = null;
  }

  async function getSession() {
    var res = await sb.auth.getSession();
    return res.data ? res.data.session : null;
  }

  async function getUser() {
    var res = await sb.auth.getUser();
    return res.data ? res.data.user : null;
  }

  // The public.users profile row for the signed-in user (via RLS).
  async function getProfile() {
    if (profileCache) return profileCache;
    var user = await getUser();
    if (!user) return null;
    var res = await sb
      .from("users")
      .select("*")
      .eq("auth_uid", user.id)
      .maybeSingle();
    if (res.error) throw res.error;
    profileCache = res.data;
    return res.data;
  }

  function onChange(cb) {
    return sb.auth.onAuthStateChange(function (event, session) {
      profileCache = null;
      cb(event, session);
    });
  }

  window.HaarayaAuth = {
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    getSession: getSession,
    getUser: getUser,
    getProfile: getProfile,
    onChange: onChange,
  };
})();
