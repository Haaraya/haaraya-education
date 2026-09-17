/* ============================================================
   Haaraya — access / entitlement layer
   ------------------------------------------------------------
   Answers one question: may THIS session read the paid library?

   Until now the only gate was "are you signed in?", so an
   account whose 14-day trial had elapsed kept full access —
   status/trial_ends_at were written at signup and never read.

   Rules (see supabase/enrolment_migration.sql,
   public.subscription_is_active):
     visitor                  → free samples only
     teacher/school_admin/admin → full (institutional / staff)
     subscription 'active'    → full
     subscription 'trial'     → full while trial_ends_at is in the future
     expired/cancelled/none   → free samples only

   NOTE: this is the CLIENT gate — it shapes the UI. The DB is
   the real boundary; RLS on book_pages must enforce the same
   rule or a crafted request still reads a book.

   window.HaarayaAccess
     ready()      → Promise resolving to the state
     refresh()    → re-read from the DB (call after checkout)
     state()      → { known, full, status, reason, trialEndsAt, daysLeft }
     full()       → sync boolean (false until known)
     known()      → has the first read settled? Gate UI on
                    `known() && !full()` so nothing flashes locked
                    while the subscription is still loading.
     reason()     → 'visitor' | 'trial_expired' | 'lapsed' | 'none' | …
   Fires a `haaraya:access` window event on every change.
   ============================================================ */
(function () {
  "use strict";

  var STAFF = ["teacher", "school_admin", "admin"];
  var LAPSED = ["expired", "cancelled", "canceled", "past_due", "unpaid"];

  var state = { known: false, full: false, status: null, reason: "loading", trialEndsAt: null, daysLeft: null };
  var inflight = null;

  function role() { return window.HaarayaSession ? window.HaarayaSession.role() : "visitor"; }

  function set(next) {
    state = Object.assign({}, state, next, { known: true });
    try { window.dispatchEvent(new CustomEvent("haaraya:access", { detail: state })); } catch (e) { /* ignore */ }
    return state;
  }

  function daysFrom(iso) {
    if (!iso) return null;
    var ms = new Date(iso).getTime() - Date.now();
    if (isNaN(ms)) return null;
    return Math.ceil(ms / 86400000);
  }

  async function read() {
    var r = role();
    if (r === "visitor") return set({ full: false, status: null, reason: "visitor", trialEndsAt: null, daysLeft: null });
    if (STAFF.indexOf(r) >= 0) return set({ full: true, status: "staff", reason: "staff", trialEndsAt: null, daysLeft: null });

    var DB = window.HaarayaPlatformDB;
    if (!DB || !DB.getSubscriptionForParent) {
      // No data layer on this page — fail OPEN rather than locking a paying
      // family out because a script didn't load.
      return set({ full: true, status: null, reason: "no-db", trialEndsAt: null, daysLeft: null });
    }

    var sub = null;
    try { sub = await DB.getSubscriptionForParent(); } catch (e) { sub = null; }

    if (!sub) return set({ full: false, status: null, reason: "none", trialEndsAt: null, daysLeft: null });

    var status = (sub.status || "").toLowerCase();
    var ends = sub.trialEndsAt || null;
    var left = daysFrom(ends);

    if (status === "active") return set({ full: true, status: status, reason: "active", trialEndsAt: ends, daysLeft: left });
    if (status === "trial") {
      var live = !!ends && new Date(ends).getTime() > Date.now();
      return set({ full: live, status: status, reason: live ? "trial" : "trial_expired", trialEndsAt: ends, daysLeft: left });
    }
    if (LAPSED.indexOf(status) >= 0) return set({ full: false, status: status, reason: "lapsed", trialEndsAt: ends, daysLeft: left });
    // Unknown status: treat as unpaid, but keep the raw value for the banner.
    return set({ full: false, status: status || null, reason: "unknown_status", trialEndsAt: ends, daysLeft: left });
  }

  function refresh() {
    inflight = read();
    return inflight;
  }

  function ready() { return inflight || refresh(); }

  // Re-read whenever the identity changes (sign in, sign out, role switch).
  window.addEventListener("haaraya:session", function () {
    state = { known: false, full: false, status: null, reason: "loading", trialEndsAt: null, daysLeft: null };
    refresh();
  });

  window.HaarayaAccess = {
    ready: ready,
    refresh: refresh,
    state: function () { return state; },
    full: function () { return !!state.full; },
    known: function () { return !!state.known; },
    reason: function () { return state.reason; },
    daysLeft: function () { return state.daysLeft; },
    // Copy for the lock screens / banners, keyed by reason.
    message: function () {
      switch (state.reason) {
        case "visitor": return "Sign in or start a free trial to read the whole library.";
        case "trial_expired": return "Your free trial has ended. Choose a plan to carry on reading — every stamp and Odyssey entry is still here.";
        case "lapsed": return "Your subscription has lapsed. Renew to open the full library again.";
        case "none": return "There’s no active plan on this account yet. Choose a plan to open the full library.";
        default: return "Choose a plan to open the full library.";
      }
    },
  };

  refresh();
})();
