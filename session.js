/* ============================================================
   Haaraya — Prototype session / role layer
   ------------------------------------------------------------
   NOTE: This is PROTOTYPE access only — it shapes what each
   role sees and can navigate to. It is NOT real security:
   all data still lives in the browser. Production would need
   real authentication + server-side permission checks.

   Each demo account maps onto existing seed records so data
   scoping (parent → own children, teacher → own classes,
   school admin → own school) uses the real relationships.
   ============================================================ */
(function () {
  const KEY = "haaraya:session";
  // Which child a REAL signed-in session is currently reading as. Demo
  // accounts carry their childId on the account itself; real accounts pick one
  // at runtime (a child reads under the parent session), stored here.
  const CHILD_KEY = "haaraya:activeChild";

  // Demo/base personas, keyed by role. These are NO LONGER sign-in identities:
  // every signed-in session is a real Supabase session (see signInReal). They
  // survive only as the styling/label base for each role, plus the visitor state.
  const ACCOUNTS = {
    visitor: {
      role: "visitor",
      displayName: "Demo Visitor",
      sub: "Public site · not signed in",
      userId: null, childId: null, schoolId: null,
      color: "#7A8576",
    },
    child: {
      role: "child",
      displayName: "Demo Child",
      sub: "Level 7 reader",
      userId: null, childId: 1, schoolId: null,
      color: "#E65100",
    },
    parent: {
      role: "parent",
      displayName: "Demo Parent",
      sub: "Family plan · 2 children",
      userId: 1, childId: 1, schoolId: null,
      color: "#1565C0",
    },
    teacher: {
      role: "teacher",
      displayName: "Demo Teacher",
      sub: "Lead teacher · 1 class",
      userId: 2, childId: null, schoolId: 1,
      color: "#8E24AA",
    },
    school_admin: {
      role: "school_admin",
      displayName: "Demo School Admin",
      sub: "School-wide reports",
      userId: 4, childId: null, schoolId: 1,
      color: "#00838F",
    },
    // NOTE: no demo Haaraya-admin persona. Admin access is real-only:
    // it comes exclusively from a Supabase sign-in via signInReal (below).
  };

  // Styling base for a REAL, signed-in Haaraya admin. Not a demo account —
  // never selectable, only used to colour/label a live admin session.
  const STAFF_BASE = {
    displayName: "Haaraya Admin",
    sub: "Owner back end",
    color: "#283593",
  };

  // Friendly labels for the sign-in panel / switcher.
  const ROLE_LABEL = {
    visitor: "Public visitor",
    child: "Child",
    parent: "Parent",
    teacher: "Teacher",
    school_admin: "School admin",
    admin: "Haaraya admin",
  };

  // Sessions are restored from SUPABASE on boot (app.jsx reads the auth session
  // and calls signInReal), so nothing is rehydrated from storage here: a stale
  // role key would otherwise resurrect a fake identity with no data behind it.
  // Every page load starts as a public visitor until Supabase says otherwise.
  function load() {
    return ACCOUNTS.visitor;
  }

  // Map a public.users.role to an app session role key.
  const PROFILE_ROLE_TO_APP = {
    parent: "parent", teacher: "teacher",
    school_admin: "school_admin", haaraya_admin: "admin", admin: "admin", staff: "admin",
  };

  let current = load();

  function save(role) {
    try { sessionStorage.setItem(KEY, role); } catch (e) { /* ignore */ }
  }

  // Wipe every prototype key (role, journey calibration, readiness checks, …)
  // from both storages — used by the "Reset demo" control.
  function wipeAll() {
    [localStorage, sessionStorage].forEach((store) => {
      try {
        const del = [];
        for (let i = 0; i < store.length; i++) {
          const k = store.key(i);
          if (k && k.indexOf("haaraya:") === 0) del.push(k);
        }
        del.forEach((k) => store.removeItem(k));
      } catch (e) { /* ignore */ }
    });
  }

  window.HaarayaSession = {
    accounts: ACCOUNTS,
    roleLabel: (r) => ROLE_LABEL[r] || r,
    get() { return current; },
    role() { return current.role; },
    userId() { return current.userId; },
    childId() { return current.childId; },
    schoolId() { return current.schoolId; },
    // Active reading child: for real sessions the runtime-selected uuid (or
    // null until one is chosen); for demo sessions the account's own childId.
    activeChildId() {
      if (current.real) {
        try { return sessionStorage.getItem(CHILD_KEY) || null; } catch (e) { return null; }
      }
      return current.childId;
    },
    setActiveChild(id) {
      try {
        if (id == null) sessionStorage.removeItem(CHILD_KEY);
        else sessionStorage.setItem(CHILD_KEY, String(id));
      } catch (e) { /* ignore */ }
      try { window.dispatchEvent(new CustomEvent("haaraya:activechild", { detail: id })); } catch (e) { /* ignore */ }
      return id;
    },
    isSignedIn() { return current.role !== "visitor"; },
    signInAs(role) {
      current = ACCOUNTS[role] || ACCOUNTS.visitor;
      save(current.role);
      window.dispatchEvent(new CustomEvent("haaraya:session", { detail: current }));
      return current;
    },
    // Real, Supabase-backed sign-in. Completely separate from the demo
    // ACCOUNTS above: it builds a live session from the user's public.users
    // profile row, flagged real:true so dashboards read HaarayaPlatformDB
    // (live) instead of HaarayaApi (mock). Demo accounts are untouched.
    signInReal(profileRow) {
      const p = profileRow || {};
      const roleKey = PROFILE_ROLE_TO_APP[p.role] || "parent";
      const base = ACCOUNTS[roleKey] || STAFF_BASE;
      current = {
        role: roleKey,
        real: true,
        profileId: p.id || null,
        authRole: p.role || null,
        displayName: (p.full_name && String(p.full_name).trim()) || base.displayName,
        sub: (p.email && String(p.email)) || base.sub,
        userId: null, childId: null, schoolId: null,
        color: base.color,
      };
      save(current.role);
      window.dispatchEvent(new CustomEvent("haaraya:session", { detail: current }));
      return current;
    },
    isReal() { return !!current.real; },
    signOut() { return this.signInAs("visitor"); },
    reset() { wipeAll(); return this.signInAs("visitor"); },
  };
})();
