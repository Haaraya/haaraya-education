/* ============================================================
   Haaraya — trial guard
   ------------------------------------------------------------
   Makes recycling a fresh email every fortnight not worth the
   effort. It cannot be made impossible — email is free and
   infinite — so this aims at the lazy majority without
   punishing honest parents:

     1. Disposable / throwaway email domains are refused.
     2. Gmail dot-and-plus tricks are normalised, so
        o.luchi+3@gmail.com === oluchi@gmail.com. The normalised
        form is what we store and compare.
     3. The trial is tied to the CHILD, not the account. A
        child's name + birth year fingerprint means the same
        family cannot re-trial repeatedly, and it is a fair
        signal because the product is priced per child.

   Exposes window.HaarayaTrialGuard:
     normaliseEmail(email)      -> canonical form for storage
     isDisposable(email)        -> boolean
     checkEmail(email)          -> { ok, reason }
     childFingerprint(child)    -> stable hash string
     await checkTrial({ email, children }) -> { ok, reason, code }
   ============================================================ */
(function () {
  "use strict";

  // Throwaway providers. Deliberately short — the long lists go stale and
  // start catching real people. Add to it from observed abuse, not guesswork.
  var DISPOSABLE = [
    "mailinator.com", "guerrillamail.com", "guerrillamail.net", "10minutemail.com",
    "tempmail.com", "temp-mail.org", "throwawaymail.com", "yopmail.com",
    "sharklasers.com", "trashmail.com", "getnada.com", "dispostable.com",
    "maildrop.cc", "fakeinbox.com", "mintemail.com", "mohmal.com",
    "emailondeck.com", "burnermail.io", "tempr.email", "spam4.me",
    "grr.la", "inboxbear.com", "mailnesia.com", "moakt.com", "tmpmail.org",
  ];

  // Providers where a dot in the local part is not significant.
  var DOT_BLIND = ["gmail.com", "googlemail.com"];

  function parts(email) {
    var e = String(email || "").trim().toLowerCase();
    var at = e.lastIndexOf("@");
    if (at < 1) return null;
    return { local: e.slice(0, at), domain: e.slice(at + 1) };
  }

  /* Canonical form: strip the +tag everywhere, and dots too on Gmail. Store
     THIS alongside the address the parent typed, and compare on it. */
  function normaliseEmail(email) {
    var p = parts(email);
    if (!p) return String(email || "").trim().toLowerCase();
    var local = p.local.split("+")[0];
    if (DOT_BLIND.indexOf(p.domain) >= 0) local = local.replace(/\./g, "");
    var domain = p.domain === "googlemail.com" ? "gmail.com" : p.domain;
    return local + "@" + domain;
  }

  function isDisposable(email) {
    var p = parts(email);
    if (!p) return false;
    for (var i = 0; i < DISPOSABLE.length; i++) {
      var d = DISPOSABLE[i];
      if (p.domain === d || p.domain.endsWith("." + d)) return true;
    }
    return false;
  }

  function checkEmail(email) {
    var p = parts(email);
    if (!p) return { ok: false, reason: "That doesn't look like an email address.", code: "malformed" };
    if (isDisposable(email)) {
      return {
        ok: false,
        code: "disposable",
        reason: "Please use a permanent email address \u2014 a reader's passport, stamps and Odyssey progress live with the account, and a temporary inbox loses them.",
      };
    }
    return { ok: true };
  }

  /* A child fingerprint that survives small typos in presentation but not a
     genuinely different child: first name (letters only) + birth year. */
  function childFingerprint(child) {
    child = child || {};
    var name = String(child.first_name || child.firstName || child.name || "")
      .toLowerCase().replace(/[^a-z]/g, "");
    var year = String(child.birth_year || child.birthYear || child.year || "").replace(/[^0-9]/g, "").slice(0, 4);
    if (!name || !year) return "";
    var s = name + "|" + year;
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return "c" + (h >>> 0).toString(36);
  }

  function sb() { return window.HaarayaSupabase || null; }

  /* Has this email (normalised) or any of these children already had a trial?
     Reads the trial_claims table (see supabase/trial_guard.sql). Fails OPEN:
     if the check itself errors we allow the signup — never block a real
     parent because of an outage. */
  async function checkTrial(opts) {
    opts = opts || {};
    var emailCheck = checkEmail(opts.email);
    if (!emailCheck.ok) return emailCheck;

    var client = sb();
    if (!client) return { ok: true };

    var norm = normaliseEmail(opts.email);
    var prints = (opts.children || []).map(childFingerprint).filter(Boolean);

    try {
      var res = await client.rpc("claim_trial_check", {
        p_email_norm: norm,
        p_child_prints: prints,
      });
      if (res.error) return { ok: true };          // fail open
      var d = res.data || {};
      if (d.email_seen) {
        return {
          ok: false,
          code: "email_seen",
          reason: "This email has already used a free trial. Sign in to your existing account, or choose a plan to carry on reading.",
        };
      }
      if (d.child_seen) {
        return {
          ok: false,
          code: "child_seen",
          reason: "This reader has already had a free trial. Sign in to the account that holds their passport, or choose a plan \u2014 their stamps and Odyssey progress are still there.",
        };
      }
      return { ok: true };
    } catch (e) {
      return { ok: true };                          // fail open
    }
  }

  /* Record the trial once the account exists. Safe to call more than once. */
  async function recordTrial(opts) {
    opts = opts || {};
    var client = sb();
    if (!client) return false;
    try {
      var res = await client.rpc("claim_trial_record", {
        p_email_norm: normaliseEmail(opts.email),
        p_child_prints: (opts.children || []).map(childFingerprint).filter(Boolean),
      });
      return !res.error;
    } catch (e) { return false; }
  }

  window.HaarayaTrialGuard = {
    normaliseEmail: normaliseEmail,
    isDisposable: isDisposable,
    checkEmail: checkEmail,
    childFingerprint: childFingerprint,
    checkTrial: checkTrial,
    recordTrial: recordTrial,
    DISPOSABLE: DISPOSABLE,
  };
})();
