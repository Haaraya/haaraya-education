/* ============================================================
   Haaraya Registration — app shell, landing, tweaks
   ============================================================ */
const { useState: useStateApp, useEffect: useEffectApp } = React;

/* Plain-language messages for the write failures enrolment.js can return. */
const REG_ERRORS = {
  "email-taken": "That email already has a Haaraya account. Try signing in instead.",
  "missing-credentials": "Please enter an email address and a password.",
  "signup-failed": "We could not create your account. Please check the email and password and try again.",
  "signup-threw": "We could not reach Haaraya just now. Please check your connection and try again.",
  "profile-failed": "Your login was created but your profile could not be saved. Please try again.",
  "school-failed": "Your account was created but the school record could not be saved. Please try again.",
  "child-failed": "We could not save your reader's profile. Please try again.",
  "bad-code": "That access code is not valid, or it has already been used.",
  "code-check-unavailable": "We could not check your access code just now. Please try again shortly.",
  "weak-password": "Please choose a password of at least 8 characters.",
  "no-client": "Sign-up is unavailable right now. Please try again shortly.",
};

const REG_TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "Storybook",
  "displayFont": "DM Serif Display",
  "colorIntensity": "Rich",
  "showPassport": true
}/*EDITMODE-END*/;

/* ---------- Top bar ---------- */
function RegTop({ onHome }) {
  return (
    <header className="reg-top">
      <div className="reg-top-inner">
        <a className="reg-top-brand" href="Haaraya Home.html" aria-label="Haaraya — home">
          <img src="assets/logo-haaraya-literacy.png" alt="Haaraya Literacy" />
        </a>
        <span className="reg-top-tag">A Nigerian reading journey</span>
        <div className="reg-top-spacer" />
        <a className="reg-top-signin" href="Haaraya Home.html">
          <span className="lbl-long">Already enrolled?&nbsp;</span>Sign in
        </a>
      </div>
    </header>
  );
}

/* ---------- Landing ---------- */
const PATHS = [
  {
    key: "parent", title: "Parent / Family",
    desc: "For parents signing up one child or several — siblings read side by side on one account.",
    icon: ICONS.family, c: "#1A6E1A", bg: "#E8F5E9",
  },
  {
    key: "school", title: "School / Teacher",
    desc: "For schools, teachers, classrooms and school-managed reading across year groups.",
    icon: ICONS.school, c: "#1565C0", bg: "#E3F2FD",
  },
  {
    key: "sponsored", title: "Sponsored / Access Code",
    desc: "For children joining through a school, sponsor, community programme or invitation code.",
    icon: ICONS.ticket, c: "#E65100", bg: "#FFF3E0",
  },
];

function Landing({ onChoose }) {
  return (
    <div className="reg-landing">
      <div className="reg-opener">
        <div className="reg-opener-text">
          <div className="reg-eyebrow"><span className="flag">🇳🇬</span><span className="bar" /> Start here</div>
          <h1>Start your <span className="gold">Haaraya Reading Journey.</span></h1>
          <p className="lede">Create an account for your child, family, or school — and begin with the right reading path.</p>
          <div className="reg-opener-foot">
            <span className="meta"><span className="tick">✓</span> Built around the Reading Passport</span>
            <span className="meta"><span className="tick">✓</span> No payment to begin</span>
          </div>
        </div>
        <div className="reg-opener-visual">
          <img className="reg-passport-illu" src="assets/green-passport.png" alt="Haaraya Reading Passport" />
          <img className="reg-opener-stamp" src="assets/stamp-l1.png" alt="Level 1 stamp" />
        </div>
      </div>

      <div className="reg-paths-head">
        <h2 className="q">Who are you signing up for?</h2>
        <p className="sub">Choose a path to begin — you can always change later.</p>
        <div className="reg-paths-rule"><span className="line" /><span className="dot" /><span className="line" /></div>
      </div>

      <div className="reg-paths">
        {PATHS.map(p => (
          <button key={p.key} className="reg-path" onClick={() => onChoose(p.key)}>
            <span className="corner tl" /><span className="corner br" />
            <span className="reg-path-seal" style={{ "--c": p.c, "--bg": p.bg, color: p.c }}>
              <Ic d={p.icon} size={28} sw={1.9} />
            </span>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
            <span className="go" style={{ color: p.c }}>
              Begin <span className="arr"><Ic d={ICONS.arrowR} size={17} sw={2.4} /></span>
            </span>
          </button>
        ))}
      </div>

      <p className="reg-landing-note">
        Already have a Haaraya account? <a href="Haaraya Home.html">Sign in instead</a>.
      </p>
    </div>
  );
}

/* ---------- App ---------- */
function RegApp() {
  const [tweaks, setTweak] = useTweaks(REG_TWEAK_DEFAULTS);
  const [view, setView] = useStateApp("landing");   // landing | parent | school | sponsored | success
  const [payload, setPayload] = useStateApp(null);
  const [submitting, setSubmitting] = useStateApp(false);
  const [submitError, setSubmitError] = useStateApp("");
  const [result, setResult] = useStateApp(null);     // what the DB actually created

  useEffectApp(() => {
    document.documentElement.dataset.direction = tweaks.direction.toLowerCase();
    document.documentElement.dataset.intensity = tweaks.colorIntensity.toLowerCase();
    document.documentElement.style.setProperty(
      "--font-display",
      tweaks.displayFont === "Lora" ? '"Lora", Georgia, serif' : `"${tweaks.displayFont}", Georgia, serif`
    );
  }, [tweaks.direction, tweaks.colorIntensity, tweaks.displayFont]);

  useEffectApp(() => {
    document.body.dataset.regPreview = String(tweaks.showPassport);
  }, [tweaks.showPassport]);

  const goHome = () => { setView("landing"); setPayload(null); setResult(null); setSubmitError(""); window.scrollTo({ top: 0, behavior: "smooth" }); };

  // Registration now WRITES: create the auth user, profile, children and
  // subscription before showing the success screen. If the write fails the
  // user stays on the flow with a message rather than seeing a false success.
  const complete = async (p) => {
    setSubmitError("");
    const E = window.HaarayaEnrol;
    if (!E) { setSubmitError("Sign-up is unavailable right now. Please try again shortly."); return; }

    setSubmitting(true);
    let res;
    try {
      if (p.role === "school") res = await E.registerSchool(p);
      else if (p.role === "sponsored") res = await E.registerSponsored(p);
      else res = await E.registerParent(p);
    } catch (err) {
      res = { ok: false, reason: "threw", detail: String(err) };
    }
    setSubmitting(false);

    if (!res || !res.ok) {
      setSubmitError(REG_ERRORS[res && res.reason] || "We could not create your account. Please try again.");
      return;
    }
    setPayload(p);
    setResult(res);
    setView("success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const enterDashboard = () => {
    if (!payload) return goHome();
    // The real profile role decides the dashboard, not the flow's guess.
    const dbRole = (result && result.profile && result.profile.role) || "parent";
    let role = dbRole === "school_admin" ? "school_admin" : dbRole === "teacher" ? "teacher" : "parent";
    let screen = role === "school_admin" ? "school" : role === "teacher" ? "teacher" : "parent";
    // A sponsored guardian has one child and no plan to manage: the child view
    // is the useful first screen.
    if (payload.role === "sponsored") screen = "child";
    try {
      sessionStorage.setItem("haaraya:session", role);
      sessionStorage.setItem("haaraya:landing", screen);
    } catch (e) { /* ignore */ }
    window.location.href = "Haaraya Home.html";
  };

  return (
    <React.Fragment>
      <RegTop onHome={goHome} />

      {view === "landing" && <Landing onChoose={setView} />}
      {view === "parent" && <ParentFlow onBack={goHome} onComplete={complete} submitting={submitting} submitError={submitError} />}
      {view === "school" && <SchoolFlow onBack={goHome} onComplete={complete} submitting={submitting} submitError={submitError} />}
      {view === "sponsored" && <SponsoredFlow onBack={goHome} onComplete={complete} submitting={submitting} submitError={submitError} />}
      {view === "success" && payload && <SuccessScreen payload={payload} result={result} onDashboard={enterDashboard} onRestart={goHome} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Design direction" />
        <TweakRadio label="Mode" value={tweaks.direction} options={["Storybook", "Classic"]}
          onChange={v => setTweak("direction", v)} />
        <div style={{ fontSize: 11, color: "rgba(255,255,255,.55)", lineHeight: 1.5, padding: "0 14px 8px" }}>
          <strong style={{ color: "white" }}>Storybook</strong> — vivid, warm, child-world.
          <strong style={{ color: "white" }}> Classic</strong> — calmer, parent-trust.
        </div>

        <TweakSection label="Typography" />
        <TweakSelect label="Display font" value={tweaks.displayFont}
          options={["DM Serif Display", "Lora", "Fredoka", "Lilita One", "Caprasimo", "Bagel Fat One"]}
          onChange={v => setTweak("displayFont", v)} />

        <TweakSection label="Color intensity" />
        <TweakRadio label="Saturation" value={tweaks.colorIntensity} options={["Calm", "Rich", "Vivid"]}
          onChange={v => setTweak("colorIntensity", v)} />

        <TweakSection label="Passport preview" />
        <TweakToggle label="Show live passport" value={tweaks.showPassport}
          onChange={v => setTweak("showPassport", v)} />

        <TweakSection label="Jump to flow" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, padding: "0 14px 12px" }}>
          {[["landing", "Account paths"], ["parent", "Parent flow"], ["school", "School flow"], ["sponsored", "Access code"]].map(([k, l]) => (
            <TweakButton key={k} label={l} onClick={() => { setView(k); window.scrollTo({ top: 0 }); }} />
          ))}
        </div>
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<RegApp />);
