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

  // Cache the profile AGAINST the auth user it belongs to. An unkeyed cache
  // could hand back the previous account's row after a switch, which then got
  // written into children.parent_user_id and refused by RLS.
  var profileCache = null, profileCacheUid = null;

  async function signUp(opts) {
    var email = opts.email, password = opts.password;
    var firstName = opts.firstName || "", lastName = opts.lastName || "";
    var fullName = opts.fullName || [firstName, lastName].filter(Boolean).join(" ").trim();
    var role = opts.role || "parent";
    var res = await sb.auth.signUp({
      email: email,
      password: password,
      options: { data: { full_name: fullName, first_name: firstName, last_name: lastName, role: role } },
    });
    if (res.error) throw res.error;
    clearProfile();
    return res.data;
  }

  async function signIn(opts) {
    var res = await sb.auth.signInWithPassword({
      email: opts.email,
      password: opts.password,
    });
    if (res.error) throw res.error;
    clearProfile();
    return res.data;
  }

  async function signOut() {
    await sb.auth.signOut();
    clearProfile();
  }

  function clearProfile() { profileCache = null; profileCacheUid = null; }

  async function getSession() {
    var res = await sb.auth.getSession();
    return res.data ? res.data.session : null;
  }

  async function getUser() {
    var res = await sb.auth.getUser();
    return res.data ? res.data.user : null;
  }

  // The public.users profile row for the signed-in user (via RLS).
  //  `force` skips the cache — use it before a write that depends on the id.
  async function getProfile(force) {
    var user = await getUser();
    if (!user) { clearProfile(); return null; }
    // Serve the cache only when it belongs to THIS auth user.
    if (!force && profileCache && profileCacheUid === user.id) return profileCache;

    var res = await sb
      .from("users")
      .select("*")
      .eq("auth_uid", user.id)
      .maybeSingle();
    if (res.error) throw res.error;

    // Never cache a miss: a null here is usually a profile that has not been
    // written yet (deferred email confirmation), and the caller may create it.
    if (res.data) { profileCache = res.data; profileCacheUid = user.id; }
    else clearProfile();
    return res.data;
  }

  function onChange(cb) {
    return sb.auth.onAuthStateChange(function (event, session) {
      clearProfile();
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
    refreshProfile: function () { return getProfile(true); },
    clearProfileCache: clearProfile,
    onChange: onChange,
  };
})();
