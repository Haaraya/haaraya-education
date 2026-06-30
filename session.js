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

  // Demo accounts, keyed by role. Ids reference data/seed.js.
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
    admin: {
      role: "admin",
      displayName: "Demo Admin",
      sub: "Internal · full access",
      userId: 3, childId: null, schoolId: null,
      color: "#283593",
    },
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

  // Role is persisted in sessionStorage (session-only): it survives in-tab page
  // navigation (e.g. the registration → home handoff) but resets when the tab/
  // file is closed, so a freshly opened copy always starts as a public visitor.
  function load() {
    try {
      const r = sessionStorage.getItem(KEY);
      if (r && ACCOUNTS[r]) return ACCOUNTS[r];
    } catch (e) { /* ignore */ }
    return ACCOUNTS.visitor;
  }

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
    isSignedIn() { return current.role !== "visitor"; },
    signInAs(role) {
      current = ACCOUNTS[role] || ACCOUNTS.visitor;
      save(current.role);
      window.dispatchEvent(new CustomEvent("haaraya:session", { detail: current }));
      return current;
    },
    signOut() { return this.signInAs("visitor"); },
    reset() { wipeAll(); return this.signInAs("visitor"); },
  };
})();
