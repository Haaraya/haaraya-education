/* ============================================================
   Haaraya — Page Review (QA) data layer  ·  real-auth edition
   ------------------------------------------------------------
   Reads/writes the `page_reviews` table through the authenticated
   Supabase client (window.HaarayaSupabase), so every request
   carries the reviewer's JWT and RLS enforces reviewer-only access.

   Requires (loaded before this file):
     supabase-js UMD  →  supabase-client.js  →  auth.js

   window.HaarayaReview:
     currentReviewer()  → Promise<{id,email,name,role,isReviewer}|null>
     load(bookCode)     → Promise<map>  keyed by screen_key
     save(row)          → Promise<row>  upsert one screen
     signIn(email, pw)  → Promise
     signOut()          → Promise
     onAuthChange(cb)   → subscription ({ data:{ subscription } })
   ============================================================ */
(function () {
  "use strict";

  var TABLE = "page_reviews";
  var REVIEWER_ROLES = ["reviewer", "admin", "staff"];

  function sb() { return window.HaarayaSupabase || null; }

  async function currentReviewer() {
    try {
      if (!window.HaarayaAuth) return null;
      var user = await window.HaarayaAuth.getUser();
      if (!user) return null;
      var profile = null;
      try { profile = await window.HaarayaAuth.getProfile(); } catch (e) { /* ignore */ }
      var role = profile && profile.role;
      var name = (profile && profile.full_name) || user.email || "Reviewer";
      return {
        id: user.id,
        email: user.email,
        name: name,
        role: role || null,
        isReviewer: REVIEWER_ROLES.indexOf(role) >= 0,
      };
    } catch (e) {
      return null;
    }
  }

  // Fetch every stored review for a book → { screen_key: row }.
  async function load(bookCode) {
    var client = sb();
    if (!client || !bookCode) return {};
    var res = await client.from(TABLE).select("*").eq("book_code", bookCode);
    if (res.error) {
      // RLS will reject non-reviewers — treat as "no data", not a crash.
      console.warn("[Haaraya Review] load:", res.error.message || res.error);
      return {};
    }
    var map = {};
    (res.data || []).forEach(function (row) { map[row.screen_key] = row; });
    return map;
  }

  // Upsert one screen's verdict. Identity is stamped server-side.
  async function save(row) {
    var client = sb();
    if (!client) throw new Error("Supabase client not ready");
    if (!row || !row.book_code || !row.screen_key) throw new Error("missing book/screen key");
    var payload = {
      book_code: row.book_code,
      screen_key: row.screen_key,
      page_number: row.page_number == null ? null : row.page_number,
      text_ok: nb(row.text_ok),
      image_ok: nb(row.image_ok),
      page_order_ok: nb(row.page_order_ok),
      layout_ok: nb(row.layout_ok),
      issue_type: row.issue_type || null,
      review_status: row.review_status || "open",
      note: row.note || "",
      book_title: row.book_title || null,
      strand: row.strand || null,
      level: row.level == null ? null : row.level,
      reviewer: row.reviewer || null,
    };
    var res = await client
      .from(TABLE)
      .upsert(payload, { onConflict: "book_code,screen_key" })
      .select()
      .single();
    if (res.error) {
      console.error("[Haaraya Review] save:", res.error.message || res.error);
      throw res.error;
    }
    return res.data;
  }

  function nb(v) { return v == null ? null : v; }

  async function signIn(email, password) {
    if (!window.HaarayaAuth) throw new Error("Auth not available");
    return window.HaarayaAuth.signIn({ email: email, password: password });
  }
  async function signOut() {
    if (!window.HaarayaAuth) return;
    return window.HaarayaAuth.signOut();
  }
  function onAuthChange(cb) {
    if (window.HaarayaAuth && window.HaarayaAuth.onChange) return window.HaarayaAuth.onChange(cb);
    return { data: { subscription: { unsubscribe: function () {} } } };
  }

  window.HaarayaReview = {
    currentReviewer: currentReviewer,
    load: load,
    save: save,
    signIn: signIn,
    signOut: signOut,
    onAuthChange: onAuthChange,
    REVIEWER_ROLES: REVIEWER_ROLES,
  };
})();
