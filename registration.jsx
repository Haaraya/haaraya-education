/* ============================================================
   Haaraya Registration — app shell, landing, tweaks
   ============================================================ */
const { useState: useStateApp, useEffect: useEffectApp } = React;

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
        <button className="reg-top-brand" onClick={onHome} aria-label="Haaraya — start over">
          <img src="assets/logo-haaraya-literacy.png" alt="Haaraya Literacy" />
        </button>
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

  const goHome = () => { setView("landing"); setPayload(null); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const complete = (p) => { setPayload(p); setView("success"); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const enterDashboard = () => {
    if (!payload) return goHome();
    let role = "parent", screen = "parent";
    if (payload.role === "school") {
      role = payload.school.role === "teacher" ? "teacher" : payload.school.role === "coordinator" ? "teacher" : "school_admin";
      screen = role === "teacher" ? "teacher" : "school";
    } else if (payload.role === "sponsored") { role = "child"; screen = "child"; }
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
      {view === "parent" && <ParentFlow onBack={goHome} onComplete={complete} />}
      {view === "school" && <SchoolFlow onBack={goHome} onComplete={complete} />}
      {view === "sponsored" && <SponsoredFlow onBack={goHome} onComplete={complete} />}
      {view === "success" && payload && <SuccessScreen payload={payload} onDashboard={enterDashboard} onRestart={goHome} />}

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
