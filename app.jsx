/* ============================================================
   Haaraya — App shell + router + Tweaks
   ============================================================ */

const { useState: useStateApp, useEffect: useEffectApp } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "Storybook",
  "displayFont": "DM Serif Display",
  "colorIntensity": "Rich",
  "showFloatingStamps": true,
  "heroVariant": "Passport",
  "calibrateJourney": false,
  "headerLogo": "Literacy"
}/*EDITMODE-END*/;

function BootSplash() {
  // Full-viewport overlay so nothing partial (hero before its cards) ever paints
  // while the 396-book dataset loads. Covers the nav too.
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
        <img src="assets/logo-haaraya-education.png" alt="Haaraya Education" />
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
  visitor:      ["home", "library", "passport", "reader"],
  child:        ["home", "child", "passport", "library", "reader"],
  parent:       ["home", "parent", "child", "passport", "library", "reader"],
  teacher:      ["home", "teacher", "library", "reader", "passport"],
  school_admin: ["home", "school", "library", "reader", "passport"],
  admin:        ["home", "library", "passport", "child", "reader", "parent", "teacher", "school", "admin"],
};

// Which links appear in the nav for each role (a subset of access, in order).
const ROLE_NAV = {
  visitor:      ["home", "library", "passport"],
  child:        ["home", "child", "passport", "library"],
  parent:       ["home", "parent", "child", "passport", "library"],
  teacher:      ["home", "teacher", "library"],
  school_admin: ["home", "school", "library"],
  admin:        ["home", "library", "passport", "child", "parent", "teacher", "school", "admin"],
};

// The landing screen for each role (post sign-in + redirect target).
const ROLE_HOME = {
  visitor: "home", child: "child", parent: "parent",
  teacher: "teacher", school_admin: "school", admin: "admin",
};

const ROLE_ORDER = ["visitor", "child", "parent", "teacher", "school_admin", "admin"];

function canAccess(role, screen) {
  return (ROLE_ACCESS[role] || ROLE_ACCESS.visitor).includes(screen);
}

/* ------------ Sign-in panel (prototype role chooser) ------------ */

// Infer which dashboard an email belongs to. Lets the "real" sign-in form route
// to the right role (teacher@…, school@…, admin@…, child@…) and default to parent.
function inferRoleFromEmail(em) {
  const e = (em || "").trim().toLowerCase();
  if (/(^|[._-])teacher|^mr|^mrs|^ms\b/.test(e)) return "teacher";
  if (/(^|[._-])(school|principal|head|coordinator)/.test(e)) return "school_admin";
  if (/(^|[._-])(admin|haaraya|staff)/.test(e)) return "admin";
  if (/(^|[._-])(child|kid|reader|pupil)/.test(e)) return "child";
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
  const accounts = S ? S.accounts : {};

  const submit = (e) => {
    e.preventDefault();
    if (busy) return;
    if (!/.+@.+\..+/.test(email.trim())) { setError("Please enter a valid email address."); return; }
    if (!password) { setError("Please enter your password."); return; }
    setError(""); setBusy(true);
    // Prototype: simulate an auth round-trip, then route to the matching dashboard.
    setTimeout(() => onChoose(inferRoleFromEmail(email)), 650);
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
            <p className="signin-demo-note">One-tap access for demos — no password needed.</p>
            <div className="signin-list">
              {ROLE_ORDER.filter(r => r !== "visitor").map(role => {
                const a = accounts[role];
                if (!a) return null;
                const active = role === currentRole;
                return (
                  <button
                    key={role}
                    className={`signin-account ${active ? "active" : ""}`}
                    onClick={() => onChoose(role)}
                  >
                    <span className="signin-avatar" style={{ background: a.color }}>
                      {role === "visitor" ? "?" : a.displayName.split(" ").map(w => w[0]).slice(0, 2).join("")}
                    </span>
                    <span className="signin-meta">
                      <span className="signin-name">{a.displayName}</span>
                      <span className="signin-sub">{S.roleLabel(role)} · {a.sub}</span>
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

  // Hash-based router (access-gated)
  const validScreens = ["home","passport","child","parent","library","reader","teacher","school","admin"];
  const [screen, setScreen] = useStateApp(() => {
    // Default: always open on Home (accessible to every role) so a downloaded /
    // shared copy lands predictably regardless of the last session role.
    // Exception: a one-time "landing" target set by the registration handoff,
    // which we honour once and then clear.
    let dest = "home";
    try {
      const land = sessionStorage.getItem("haaraya:landing");
      if (land) {
        sessionStorage.removeItem("haaraya:landing");
        const r = window.HaarayaSession ? window.HaarayaSession.role() : "visitor";
        if (validScreens.includes(land) && canAccess(r, land)) dest = land;
      }
    } catch (e) { /* ignore */ }
    if (window.location.hash) {
      try { history.replaceState(null, "", window.location.pathname + window.location.search); } catch (e) { /* ignore */ }
    }
    return dest;
  });
  const [params, setParams] = useStateApp({});

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

  const navigate = (key, p = {}) => {
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
    window.location.hash = key;
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const applyRole = (r) => {
    const s = window.HaarayaSession.signInAs(r);
    setSignInOpen(false);
    const dest = ROLE_HOME[s.role] || "home";
    setParams({});
    setScreen(dest);
    window.location.hash = dest;
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const signOut = () => applyRole("visitor");

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
  })[screen];

  return (
    <div data-screen-label={screenLabel}>
      {screen !== "reader" && (
        <Nav
          current={screen}
          onNavigate={navigate}
          session={session}
          navKeys={ROLE_NAV[role] || ROLE_NAV.visitor}
          homeScreen={ROLE_HOME[role] || "home"}
          onSignIn={() => setSignInOpen(true)}
          onSignOut={signOut}
          onWaitlist={() => navigate(ROLE_HOME[role] || "home")}
        />
      )}

      {!booted && <BootSplash />}
      {booted && screen === "home"     && <HomePage onNavigate={navigate} />}
      {booted && screen === "passport" && <PassportScreen onNavigate={navigate} gotoLevel={params.levelId} highlightBookId={params.highlightBookId} />}
      {booted && screen === "child"    && <ChildDashScreen onNavigate={navigate} />}
      {booted && screen === "library"  && <LibraryScreen onNavigate={navigate} initialLevel={params.levelId} />}
      {booted && screen === "reader"   && <ReaderScreen bookCode={params.bookCode || params.bookId} onNavigate={navigate} />}
      {booted && screen === "parent"   && <ParentDashScreen onNavigate={navigate} />}
      {booted && screen === "teacher"  && <TeacherDashScreen onNavigate={navigate} />}
      {booted && screen === "school"   && <SchoolAdminDashScreen onNavigate={navigate} />}
      {booted && screen === "admin"    && <HaarayaAdminDashScreen onNavigate={navigate} />}

      <PublisherMark />

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

        <TweakSection label="Prototype role" />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", lineHeight: 1.5, padding: "0 14px 8px" }}>
          Switch the signed-in demo account. Nav + routes re-gate instantly.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "0 14px 8px" }}>
          {ROLE_ORDER.map(r => (
            <TweakButton
              key={r}
              label={window.HaarayaSession.roleLabel(r)}
              onClick={() => applyRole(r)}
            />
          ))}
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
            Signs out and clears all demo progress (passport, readiness checks, calibration).
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
