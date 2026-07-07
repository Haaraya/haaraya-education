/* ============================================================
   Haaraya — Supabase client (singleton)
   ------------------------------------------------------------
   Requires @supabase/supabase-js to be loaded first (UMD global
   `supabase`). Exposes window.HaarayaSupabase — the configured
   client used for auth + database access across the app.
   ============================================================ */
(function () {
  "use strict";

  var SUPABASE_URL = "https://laihhrkxnxzohaiiisou.supabase.co";
  // Publishable (client-visible) key — safe to ship. Real protection
  // comes from Row-Level Security policies in the database.
  var SUPABASE_KEY = "sb_publishable_qW4msFbGQ9QuqIZ6-G8QfA_JY_pvcsY";

  if (!window.supabase || !window.supabase.createClient) {
    console.error("[Haaraya] supabase-js not loaded — include the CDN <script> before supabase-client.js");
    return;
  }

  window.HaarayaSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,      // keep the user logged in across visits
      autoRefreshToken: true,
      detectSessionInUrl: true,  // needed for email-confirmation links
      storageKey: "haaraya:auth",
    },
  });
})();
