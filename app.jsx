/* ============================================================
   Haaraya — App shell + router + Tweaks
   ============================================================ */

const { useState: useStateApp, useEffect: useEffectApp, useRef: useRefApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "Storybook",
  "displayFont": "DM Serif Display",
  "colorIntensity": "Rich",
  "showFloatingStamps": true,
  "heroVariant": "Passport",
  "calibrateJourney": false,
  "headerLogo": "Literacy",
  "quizLayout": "Cards"
}/*EDITMODE-END*/;

function BootSplash() {
  // Full-viewport overlay so nothing partial (hero before its cards) ever paints
  // while the 469-book dataset loads. Covers the nav too.
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "var(--cream, #faf9f5)",
      display: "grid", placeItems: "center",
      animation: "bootfade .3s ease both",
    }}>
      <div style={{ textAlign: "center" }}>
        <img
          src="assets/logo-haaraya-literacy.png"
          alt="Haaraya Literacy"
          style={{ height: 52, width: "auto", marginBottom: 28, display: "inline-block", opacity: 0.9 }}
        />
        <div className="boot-spinner" style={{ margin: "0 auto" }} />
        <div style={{ marginTop: 18, fontSize: 13, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--ink-soft, #7a8576)", fontFamily: "var(--font-body)", fontWeight: 700 }}>
          Loading the library…
        </div>
      </div>
      <style>{`
        .boot-spinner{ width:32px; height:32px; border-radius:50%;
          border:3px solid color-mix(in srgb, var(--forest,#14532d) 20%, transparent);
          border-top-color: var(--forest,#14532d);
          animation: bootspin .8s linear infinite; }
        @keyframes bootspin{ to{ transform: rotate(360deg);} }
        @keyframes bootfade{ from{ opacity:0;} to{ opacity:1;} }
      `}</style>
    </div>
  );
}

function PublisherMark() {
  const [expanded, setExpanded] = useStateApp(false);
  return (
    <div
      className={`publisher-mark ${expanded ? "expanded" : ""}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onClick={() => setExpanded(e => !e)}
      role="button"
      aria-label="Published by Haaraya Education"
      tabIndex={0}
    >
      <div className="publisher-mark-seal">
        <img src="assets/logo-haaraya-education-white.png" alt="Haaraya Education" />
      </div>
      <div className="publisher-mark-caption">
        <span className="by">Published by</span>
        <span className="org">Haaraya Education</span>
        <span className="tag">Ignite minds. Illuminate futures.</span>
      </div>
    </div>
  );
}

/* ============================================================
   Prototype access control (NOT real security — see session.js)
   ============================================================ */

// Which screens each role may navigate to.
const ROLE_ACCESS = {
  visitor:      ["home", "faq", "library", "passport", "reader", "odyssey", "odyssey-library", "odyssey-reader", "odyssey-medals", "odyssey-log"],
  child:        ["home", "faq", "child", "passport", "library", "reader", "odyssey", "odyssey-library", "odyssey-reader", "odyssey-medals", "odyssey-log"],
  parent:       ["home", "faq", "parent", "child", "passport", "library", "reader", "odyssey", "odyssey-library", "odyssey-reader", "odyssey-medals", "odyssey-log"],
  teacher:      ["home", "faq", "teacher", "library", "reader", "passport", "odyssey", "odyssey-library", "odyssey-reader", "odyssey-medals", "odyssey-log"],
  school_admin: ["home", "faq", "school", "library", "reader", "passport", "odyssey", "odyssey-library", "odyssey-reader", "odyssey-medals", "odyssey-log"],
  admin:        ["home", "faq", "library", "passport", "child", "reader", "parent", "teacher", "school", "admin", "odyssey", "odyssey-library", "odyssey-reader", "odyssey-medals", "odyssey-log"],
};

// Which links appear in the nav for each role (a subset of access, in order).
const ROLE_NAV = {
  visitor:      ["home", "libraries", "passport", "pricing"],
  child:        ["home", "child", "passport", "libraries", "pricing"],
  parent:       ["home", "parent", "child", "passport", "libraries", "pricing"],
  teacher:      ["home", "teacher", "libraries", "pricing"],
  school_admin: ["home", "school", "libraries", "pricing"],
  admin:        ["home", "libraries", "passport", "child", "parent", "teacher", "school", "admin", "pricing"],
};

// The landing screen for each role (post sign-in + redirect target).
const ROLE_HOME = {
  visitor: "home", child: "child", parent: "parent",
  teacher: "teacher", school_admin: "school", admin: "admin",
};

const ROLE_ORDER = ["visitor", "child", "parent", "teacher", "school_admin", "admin"];

/* Demo accounts are REAL Supabase logins (seeded by
   supabase/demo_accounts_seed.sql), so a demo shows exactly what the live
   webapp shows. The child view has no account of its own — children read under
   the parent session, so it signs in the demo parent and opens the child screen. */
const DEMO_PASSWORD = "HaarayaDemo1!";
const DEMO_LOGINS = {
  child:        { email: "demo.parent@haaraya-demo.com",  dest: "child",   label: "Demo Reader",       sub: "Child view · reads under the family account" },
  parent:       { email: "demo.parent@haaraya-demo.com",  dest: "parent",  label: "Demo Parent",       sub: "Family plan · 2 children" },
  teacher:      { email: "demo.teacher@haaraya-demo.com", dest: "teacher", label: "Demo Teacher",      sub: "Primary 3 · 7 pupils" },
  school_admin: { email: "demo.school@haaraya-demo.com",  dest: "school",  label: "Demo School Admin", sub: "Haaraya Demo Primary" },
};
const DEMO_COLOR = { child: "#E65100", parent: "#1565C0", teacher: "#8E24AA", school_admin: "#00838F" };

function canAccess(role, screen) {
  return (ROLE_ACCESS[role] || ROLE_ACCESS.visitor).includes(screen);
}

// Last in-app navigation (screen + params), so a refresh can rebuild screens
// that need per-visit params — chiefly the book reader, whose book code isn't
// in the URL hash. Session-scoped: cleared when the tab closes.
function readLastNav() {
  try { return JSON.parse(sessionStorage.getItem("haaraya:last") || "null"); } catch (e) { return null; }
}
function writeLastNav(screen, params) {
  try { sessionStorage.setItem("haaraya:last", JSON.stringify({ screen: screen, params: params || {} })); } catch (e) { /* ignore */ }
}

/* ------------ Sign-in panel (prototype role chooser) ------------ */

// Infer which dashboard an email belongs to, used only as a FALLBACK when the
// profile row carries no role. Never returns "child": children have no logins
// (public.users.role is parent | teacher | school_admin | haaraya_admin), so a
// child-sounding email is a guardian who reads under a parent account.
function inferRoleFromEmail(em) {
  const e = (em || "").trim().toLowerCase();
  if (/(^|[._-])teacher|^mr|^mrs|^ms\b/.test(e)) return "teacher";
  if (/(^|[._-])(school|principal|head|coordinator)/.test(e)) return "school_admin";
  if (/(^|[._-])(admin|staff)/.test(e)) return "admin";
  return "parent";
}

function SignInPanel({ open, currentRole, onChoose, onClose }) {
  const [email, setEmail] = useStateApp("");
  const [password, setPassword] = useStateApp("");
  const [showPw, setShowPw] = useStateApp(false);
  const [showDemo, setShowDemo] = useStateApp(false);
  const [error, setError] = useStateApp("");
  const [busy, setBusy] = useStateApp(false);

  useEffectApp(() => {
    if (!open) return;
    setEmail(""); setPassword(""); setShowPw(false); setShowDemo(false); setError(""); setBusy(false);
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  const S = window.HaarayaSession;

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!/.+@.+\..+/.test(email.trim())) { setError("Please enter a valid email address."); return; }
    if (!password) { setError("Please enter your password."); return; }
    await doSignIn(email.trim(), password);
  };

  // One shared sign-in path for typed credentials AND the demo buttons: both are
  // real Supabase logins, so both land on live data.
  const doSignIn = async (mail, pw, destOverride) => {
    setError(""); setBusy(true);
    if (!window.HaarayaAuth) {
      setBusy(false);
      setError("Sign-in needs a connection — the account service didn't load.");
      return;
    }
    try {
      await window.HaarayaAuth.signIn({ email: mail, password: pw });
      // First sign-in after registering: the profile, children and plan are
      // created here, from the payload stashed in auth metadata at signup.
      // (No session exists at signup time, so nothing could be written then.)
      if (window.HaarayaEnrol && window.HaarayaEnrol.ensureProfile) {
        try { await window.HaarayaEnrol.ensureProfile(); } catch (e3) { /* fall through */ }
      }
      let profileRow = null;
      try { profileRow = await window.HaarayaAuth.getProfile(); } catch (e2) { profileRow = null; }
      if (!profileRow) {
        setBusy(false);
        setError("Signed in, but your profile couldn't load. Please try again.");
        return;
      }
      onChoose(profileRow.role, profileRow, destOverride);
    } catch (err) {
      setBusy(false);
      const raw = (err && err.message) ? err.message : "";
      const s = raw.toLowerCase();
      setError(
        s.indexOf("invalid login") !== -1 ? "That email or password doesn't match. Check both and try again."
        : s.indexOf("rate limit") !== -1 ? "Too many attempts right now. Please wait a minute and try again."
        : s.indexOf("not confirmed") !== -1 ? "Please confirm your email first — check your inbox."
        : raw || "Sign in failed. Check your email and password."
      );
    }
  };

  const demoSignIn = (role) => {
    const d = DEMO_LOGINS[role];
    if (!d || busy) return;
    doSignIn(d.email, DEMO_PASSWORD, d.dest);
  };

  return (
    <div className="signin-overlay" onClick={onClose}>
      <div className="signin-card" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Sign in">
        <button className="signin-close" onClick={onClose} aria-label="Close">×</button>
        <div className="signin-head">
          <div className="signin-kicker">Welcome back</div>
          <h3>Sign in to Haaraya</h3>
          <p>Pick up your reader's journey right where you left off.</p>
        </div>

        <form className="signin-form" onSubmit={submit} noValidate>
          <label className="signin-field">
            <span className="signin-flabel">Email</span>
            <input
              type="email" value={email} autoFocus autoComplete="email"
              onChange={e => { setEmail(e.target.value); if (error) setError(""); }}
              placeholder="you@email.com"
            />
          </label>
          <label className="signin-field">
            <span className="signin-flabel">
              Password
              <a className="signin-forgot" href="#" onClick={e => { e.preventDefault(); setError("Password reset isn't wired up in this prototype."); }}>Forgot?</a>
            </span>
            <span className="signin-pw">
              <input
                type={showPw ? "text" : "password"} value={password} autoComplete="current-password"
                onChange={e => { setPassword(e.target.value); if (error) setError(""); }}
                placeholder="Your password"
              />
              <button type="button" className="signin-pw-toggle" onClick={() => setShowPw(s => !s)}>
                {showPw ? "Hide" : "Show"}
              </button>
            </span>
          </label>
          {error && <div className="signin-error" role="alert">{error}</div>}
          <button type="submit" className={"signin-submit" + (busy ? " busy" : "")} disabled={busy}>
            {busy && <span className="signin-spinner" aria-hidden="true" />}
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          className="signin-demo-toggle"
          aria-expanded={showDemo}
          onClick={() => setShowDemo(s => !s)}
        >
          <span>Explore a demo account</span>
          <span className={"chev" + (showDemo ? " open" : "")} aria-hidden="true">⌄</span>
        </button>

        {showDemo && (
          <div className="signin-demo">
            <p className="signin-demo-note">
              Real accounts on live data — a demo shows exactly what the app shows.
            </p>
            <div className="signin-list">
              {["child", "parent", "teacher", "school_admin"].map(role => {
                const d = DEMO_LOGINS[role];
                if (!d) return null;
                const active = role === currentRole;
                return (
                  <button
                    key={role}
                    className={`signin-account ${active ? "active" : ""}`}
                    disabled={busy}
                    onClick={() => demoSignIn(role)}
                  >
                    <span className="signin-avatar" style={{ background: DEMO_COLOR[role] }}>
                      {d.label.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </span>
                    <span className="signin-meta">
                      <span className="signin-name">{d.label}</span>
                      <span className="signin-sub">{S.roleLabel(role)} · {d.sub}</span>
                    </span>
                    {active && <span className="signin-current">Current</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="signin-foot">
          New to Haaraya? <a href="Haaraya Registration.html">Create an account</a>
        </div>
      </div>
    </div>
  );
}

/* ------------ Access toast ------------ */

function AccessToast({ message, onDone }) {
  useEffectApp(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return (
    <div className="access-toast" role="status">
      <span className="access-toast-icon">🔒</span>
      <span>{message}</span>
    </div>
  );
}

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [booted, setBooted] = useStateApp(false);

  useEffectApp(() => {
    window.HaarayaApi.boot().then(() => setBooted(true));
  }, []);

  useEffectApp(() => {
    document.documentElement.dataset.direction = tweaks.direction.toLowerCase();
    document.documentElement.dataset.intensity = tweaks.colorIntensity.toLowerCase();
    document.documentElement.style.setProperty(
      "--font-display",
      tweaks.displayFont === "Lora"
        ? '"Lora", Georgia, serif'
        : `"${tweaks.displayFont}", Georgia, serif`
    );
  }, [tweaks.direction, tweaks.colorIntensity, tweaks.displayFont]);

  useEffectApp(() => {
    document.body.dataset.heroVariant = tweaks.heroVariant.toLowerCase();
    document.body.dataset.floatingStamps = String(tweaks.showFloatingStamps);
    document.body.dataset.headerLogo = tweaks.headerLogo.toLowerCase();
  }, [tweaks.heroVariant, tweaks.showFloatingStamps, tweaks.headerLogo]);

  // ---- Prototype session ----
  const [session, setSession] = useStateApp(() => (window.HaarayaSession ? window.HaarayaSession.get() : { role: "visitor" }));
  const role = session.role;
  const [signInOpen, setSignInOpen] = useStateApp(false);
  const [toast, setToast] = useStateApp("");

  // Keep React state in sync if the session changes anywhere (e.g. Tweaks switcher)
  useEffectApp(() => {
    const onSession = (e) => setSession(e.detail);
    window.addEventListener("haaraya:session", onSession);
    return () => window.removeEventListener("haaraya:session", onSession);
  }, []);

  // ---- Real Supabase session restore ----
  // On load, if the browser already holds a valid Supabase session, adopt the
  // role from that user's public.users profile so a refresh keeps them signed in.
  const bootDestRef = useRefApp(false);
  useEffectApp(() => {
    if (!window.HaarayaAuth || !window.HaarayaSession) return;
    let cancelled = false;
    (async () => {
      try {
        const sess = await window.HaarayaAuth.getSession();
        if (!sess || cancelled) return;
        const accounts = window.HaarayaSession.accounts || {};
        var roleKey = null;
        var profileRow = null;
        try {
          const p = await window.HaarayaAuth.getProfile();
          if (p && p.role) { profileRow = p; if (accounts[p.role]) roleKey = p.role; }
        } catch (e) { /* ignore */ }
        // A real Supabase user → live, DB-backed session (separate from demos).
        if (!cancelled && profileRow) window.HaarayaSession.signInReal(profileRow);
        else if (!cancelled && roleKey) window.HaarayaSession.signInAs(roleKey);
        // A restored session belongs on its dashboard, not the marketing home.
        // This covers the email-confirmation landing and any plain refresh.
        // Only when we're sitting on Home with no explicit screen in the URL,
        // and only once at boot, so it never fights a deliberate Home click.
        if (!cancelled && !bootDestRef.current) {
          bootDestRef.current = true;
          const hash = (window.location.hash || "").replace("#", "");
          const landed = window.HaarayaSession.role();
          const dest = ROLE_HOME[landed] || "home";
          if (dest !== "home" && (!hash || hash === "home")) {
            setScreen(dest);
            window.location.hash = dest;
          }
        }
      } catch (e) { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Hash-based router (access-gated)
  const validScreens = ["home","faq","passport","child","parent","library","reader","teacher","school","admin","odyssey","odyssey-library","odyssey-reader","odyssey-medals","odyssey-log"];
  const [screen, setScreen] = useStateApp(() => {
    // Default: always open on Home (accessible to every role) so a downloaded /
    // shared copy lands predictably regardless of the last session role.
    // Exception: a one-time "landing" target set by the registration handoff,
    // which we honour once and then clear.
    let dest = "home";
    const r = window.HaarayaSession ? window.HaarayaSession.role() : "visitor";
    try {
      const land = sessionStorage.getItem("haaraya:landing");
      if (land) {
        sessionStorage.removeItem("haaraya:landing");
        if (validScreens.includes(land) && canAccess(r, land)) dest = land;
      }
    } catch (e) { /* ignore */ }
    // On refresh, restore the screen from the URL hash (if it's valid and the
    // role may see it). The landing hint above still wins for the handoff case.
    // Screens that need per-visit params (a specific book) can't be rebuilt
    // from the hash alone, so those fall back to Home.
    // Session restore is async, so the role may still be "visitor" here. If the
    // hash target is accessible right now, use it; otherwise leave dest=home but
    // KEEP the hash so the post-boot effect below can restore it once the role
    // settles. Do not strip the hash here. Param-carrying screens (the reader)
    // are restorable only when we have the matching persisted nav.
    const hashScreen = (window.location.hash || "").replace("#", "");
    const needsParams = ["reader", "odyssey-reader"];
    const last = readLastNav();
    const canRestoreParams = !!(last && last.screen === hashScreen && last.params);
    if (dest === "home" && validScreens.includes(hashScreen) && canAccess(r, hashScreen) &&
        (!needsParams.includes(hashScreen) || canRestoreParams)) {
      dest = hashScreen;
    }
    return dest;
  });
  const [params, setParams] = useStateApp(() => {
    // One-time deep-link handoff: a standalone page (e.g. My Odyssey Medals)
    // can open a specific book by stashing its code alongside haaraya:landing.
    try {
      const bookCode = sessionStorage.getItem("haaraya:landing-book");
      if (bookCode) {
        sessionStorage.removeItem("haaraya:landing-book");
        return { bookCode: bookCode };
      }
    } catch (e) { /* ignore */ }
    // Refresh restore: reuse the persisted params if they belong to the screen
    // the URL hash points at.
    const h = (window.location.hash || "").replace("#", "");
    const last = readLastNav();
    if (last && last.screen === h && last.params) return last.params;
    return {};
  });

  useEffectApp(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (!validScreens.includes(h)) return;
      const r = window.HaarayaSession ? window.HaarayaSession.role() : "visitor";
      if (canAccess(r, h)) {
        setScreen(h);
        window.scrollTo({ top: 0, behavior: "instant" });
      } else {
        setToast("You don't have access to that area.");
        const dest = ROLE_HOME[r] || "home";
        setScreen(dest);
        window.location.hash = dest;
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Safety net: if the active screen ever becomes off-limits (e.g. after sign-out), bounce home.
  useEffectApp(() => {
    if (!canAccess(role, screen)) {
      const dest = ROLE_HOME[role] || "home";
      setScreen(dest);
      window.location.hash = dest;
    }
  }, [role]);

  // Post-boot refresh restore: session restore is async, so a role-gated screen
  // in the URL hash isn't accessible at first render. Once the role settles, if
  // we're still sitting on Home but the hash points to a now-accessible screen,
  // restore it. Runs at most once so it never fights manual Home navigation.
  const hashRestoredRef = useRefApp(false);
  useEffectApp(() => {
    if (hashRestoredRef.current) return;
    const h = (window.location.hash || "").replace("#", "");
    if (!h) { hashRestoredRef.current = true; return; }
    const needsParams = ["reader", "odyssey-reader"];
    const last = readLastNav();
    const canRestoreParams = !!(last && last.screen === h && last.params);
    if (screen === "home" && validScreens.includes(h) &&
        (!needsParams.includes(h) || canRestoreParams) && canAccess(role, h)) {
      hashRestoredRef.current = true;
      if (canRestoreParams) setParams(last.params);
      setScreen(h);
    } else if (canAccess(role, h) || !validScreens.includes(h)) {
      // Either restored elsewhere or the hash isn't a real screen — stop trying.
      hashRestoredRef.current = true;
    }
  }, [role, screen]);

  const navigate = (key, p = {}) => {
    // "pricing" is a section on the home page, not a screen — go home (if needed), then scroll to it.
    if (key === "pricing") {
      const doScroll = () => {
        let tries = 0;
        const tick = () => {
          const el = document.querySelector(".pricing");
          if (el) {
            const offset = (document.querySelector(".nav") || {}).offsetHeight || 72;
            const y = el.getBoundingClientRect().top + window.scrollY - offset - 12;
            window.scrollTo(0, y);
            if (document.scrollingElement) document.scrollingElement.scrollTop = y;
          } else if (tries++ < 40) {
            setTimeout(tick, 30);
          }
        };
        setTimeout(tick, 30);
      };
      if (screen !== "home") {
        setParams({});
        setScreen("home");
        writeLastNav("home", {});
        window.location.hash = "home";
      }
      doScroll();
      return;
    }
    if (!validScreens.includes(key)) return;
    if (!canAccess(role, key)) {
      setToast("You don't have access to that area.");
      const dest = ROLE_HOME[role] || "home";
      setParams({});
      setScreen(dest);
      window.location.hash = dest;
      window.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    setParams(p);
    setScreen(key);
    writeLastNav(key, p);
    window.location.hash = key;
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const applyRole = (r, profileRow, destOverride) => {
    // Every signed-in session is now a REAL Supabase session (profileRow). The
    // demo accounts are real logins too — see DEMO_LOGINS. signInAs stays only
    // for the visitor/sign-out case.
    const s = profileRow
      ? window.HaarayaSession.signInReal(profileRow)
      : window.HaarayaSession.signInAs(r);
    setSignInOpen(false);
    const dest = (destOverride && canAccess(s.role, destOverride))
      ? destOverride
      : (ROLE_HOME[s.role] || "home");
    setParams({});
    setScreen(dest);
    window.location.hash = dest;
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const signOut = () => {
    if (window.HaarayaAuth) { try { window.HaarayaAuth.signOut(); } catch (e) { /* ignore */ } }
    applyRole("visitor");
  };

  // Tweaks-panel account switcher: a real demo sign-in, same as the panel.
  const demoRoleSignIn = async (r) => {
    const d = DEMO_LOGINS[r];
    if (!d || !window.HaarayaAuth) return;
    try {
      await window.HaarayaAuth.signIn({ email: d.email, password: DEMO_PASSWORD });
      const profileRow = await window.HaarayaAuth.getProfile();
      if (profileRow) applyRole(profileRow.role, profileRow, d.dest);
    } catch (e) {
      setToast("Couldn't sign in to that demo account.");
    }
  };

  const screenLabel = ({
    home:     "01 Home",
    passport: "02 Reading Passport",
    child:    "03 Child Dashboard",
    library:  "04 Library",
    reader:   "05 Reader",
    parent:   "06 Parent Dashboard",
    teacher:  "07 Teacher Dashboard",
    school:   "08 School Admin Dashboard",
    admin:    "09 Haaraya Admin Dashboard",
    odyssey:  "10 Haaraya Odyssey",
    "odyssey-library": "11 Odyssey Library",
    "odyssey-reader":  "12 Odyssey Reader",
    "odyssey-medals":  "13 Odyssey Medal Case",
    "odyssey-log":     "14 My Captain's Log",
  })[screen];

  return (
    <div data-screen-label={screenLabel}>
      {!["reader", "child", "parent", "teacher", "school", "admin"].includes(screen) && (
        <Nav
          current={screen}
          onNavigate={navigate}
          session={session}
          navKeys={ROLE_NAV[role] || ROLE_NAV.visitor}
          homeScreen={ROLE_HOME[role] || "home"}
          onSignIn={() => setSignInOpen(true)}
          onSignOut={signOut}
          onWaitlist={() => { window.location.href = "Haaraya Registration.html"; }}
        />
      )}

      {!booted && <BootSplash />}
      {booted && screen === "home"     && <HomePage onNavigate={navigate} />}
      {booted && screen === "faq"      && <FaqScreen onNavigate={navigate} />}
      {booted && screen === "passport" && <PassportScreen onNavigate={navigate} gotoLevel={params.levelId} highlightBookId={params.highlightBookId} />}
      {booted && screen === "child"    && <ChildDashScreen onNavigate={navigate} />}
      {booted && screen === "library"  && <LibraryScreen onNavigate={navigate} initialLevel={params.levelId} />}
      {booted && screen === "reader"   && <ReaderScreen bookCode={params.bookCode || params.bookId} onNavigate={navigate} quizLayout={tweaks.quizLayout} />}
      {booted && screen === "parent"   && <ParentDashScreen onNavigate={navigate} />}
      {booted && screen === "teacher"  && <TeacherDashScreen onNavigate={navigate} />}
      {booted && screen === "school"   && <SchoolAdminDashScreen onNavigate={navigate} />}
      {booted && screen === "admin"    && <HaarayaAdminDashScreen onNavigate={navigate} />}
      {booted && screen === "odyssey"  && <OdysseyScreen onNavigate={navigate} />}
      {booted && screen === "odyssey-library" && <OdysseyLibraryScreen onNavigate={navigate} initialLevel={params.levelId} initialStream={params.stream} initialWorld={params.world} />}
      {booted && screen === "odyssey-reader"  && <OdysseyBookReader code={params.bookCode} onNavigate={navigate} />}
      {booted && screen === "odyssey-medals"  && <OdysseyMedals onNavigate={navigate} />}
      {booted && screen === "odyssey-log"     && <OdysseyCaptainsLog onNavigate={navigate} initialBook={params.bookCode ? { book_code: params.bookCode, book_title: params.bookTitle, book_number: params.bookNumber, level: params.level } : null} />}

      <PublisherMark />

      {booted && typeof FirstRunGuide !== "undefined" && (
        <FirstRunGuide role={role} screen={screen} session={session} onNavigate={navigate} />
      )}

      <SignInPanel
        open={signInOpen}
        currentRole={role}
        onChoose={applyRole}
        onClose={() => setSignInOpen(false)}
      />
      <AccessToast message={toast} onDone={() => setToast("")} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Design direction" />
        <TweakRadio
          label="Mode"
          value={tweaks.direction}
          options={["Storybook", "Classic"]}
          onChange={v => setTweak("direction", v)}
        />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", lineHeight: 1.5, padding: "0 14px 8px" }}>
          <strong style={{ color: "white" }}>Storybook</strong> — vivid, child-world feel.
          <strong style={{ color: "white" }}> Classic</strong> — calmer, parent-trust feel.
        </div>

        <TweakSection label="Typography" />
        <TweakSelect
          label="Display font"
          value={tweaks.displayFont}
          options={["Lilita One", "Fredoka", "Bagel Fat One", "Caprasimo", "DM Serif Display", "Lora"]}
          onChange={v => setTweak("displayFont", v)}
        />

        <TweakSection label="Color intensity" />
        <TweakRadio
          label="Saturation"
          value={tweaks.colorIntensity}
          options={["Calm", "Rich", "Vivid"]}
          onChange={v => setTweak("colorIntensity", v)}
        />

        <TweakSection label="Hero" />
        <TweakRadio
          label="Header logo"
          value={tweaks.headerLogo}
          options={["Literacy", "Education"]}
          onChange={v => setTweak("headerLogo", v)}
        />
        <TweakRadio
          label="Centerpiece"
          value={tweaks.heroVariant}
          options={["Passport", "Journey"]}
          onChange={v => setTweak("heroVariant", v)}
        />
        <TweakToggle
          label="Floating stamps"
          value={tweaks.showFloatingStamps}
          onChange={v => setTweak("showFloatingStamps", v)}
        />

        <TweakSection label="Journey calibration" />
        <TweakToggle
          label="Drag stamps on journey"
          value={tweaks.calibrateJourney}
          onChange={v => {
            setTweak("calibrateJourney", v);
            if (v) localStorage.setItem("haaraya:cal", "1");
            else   localStorage.removeItem("haaraya:cal");
            window.dispatchEvent(new Event("haaraya:cal"));
          }}
        />

        <TweakSection label="Reading check" />
        <TweakRadio
          label="Quiz layout"
          value={tweaks.quizLayout}
          options={["Cards", "Worksheet"]}
          onChange={v => setTweak("quizLayout", v)}
        />

        <TweakSection label="Switch account" />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", lineHeight: 1.5, padding: "0 14px 8px" }}>
          Signs in a real demo account (live data). Nav + routes re-gate instantly.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "0 14px 8px" }}>
          {["child", "parent", "teacher", "school_admin"].map(r => (
            <TweakButton
              key={r}
              label={window.HaarayaSession.roleLabel(r)}
              onClick={() => demoRoleSignIn(r)}
            />
          ))}
          <TweakButton label="Sign out" onClick={signOut} />
        </div>
        <div style={{ padding: "0 14px 12px" }}>
          <TweakButton
            label="↺ Reset demo"
            onClick={() => {
              window.HaarayaSession.reset();
              try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (e) { /* ignore */ }
              window.location.reload();
            }}
          />
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)", lineHeight: 1.5, paddingTop: 6 }}>
            Signs out and clears local progress (readiness checks, calibration).
          </div>
        </div>

        <TweakSection label="Jump to screen" />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", lineHeight: 1.5, padding: "0 14px 8px" }}>
          Respects access — blocked screens redirect you.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "0 14px 12px" }}>
          {[
            ["home", "Home"],
            ["passport", "Passport"],
            ["child", "Child Dash"],
            ["library", "Library"],
            ["reader", "Reader"],
            ["parent", "Parent Dash"],
            ["teacher", "Teacher Dash"],
            ["school", "School Admin"],
            ["admin", "Haaraya Admin"],
          ].map(([k, label]) => (
            <TweakButton key={k} label={label} onClick={() => navigate(k)} />
          ))}
        </div>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
