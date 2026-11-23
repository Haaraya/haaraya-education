/* ============================================================
   Haaraya — demo guide
   ------------------------------------------------------------
   Shown only to demo accounts (HaarayaAccess.demo()): the public
   Demo Reader / Parent / Teacher / School Admin logins and the
   pupils of the demo school.

   - Home and the role's dashboard: a banner saying the demo is
     invented, plus "Try this" cards for that role.
   - Other screens: a slim banner with a link back to the guide.
   "Got it" folds the cards away; "Demo guide" brings them back.
   ============================================================ */
const { useState: useStateDG, useEffect: useEffectDG } = React;

const DG_GEM = "gemmanti/Gemmanti.html";
const DG_PRINT_NOTE = " Printing books is a paid add-on for schools; it is switched on in this demo.";
const DG_CARDS = {
  teacher: [
    { t: "Your class’s reading", d: "Books finished, stamps and reading checks, pupil by pupil.", go: "teacher", anchor: "td-progress", cta: "See pupil progress" },
    { t: "Set a book", d: "Set a book for the whole class or chosen pupils, with a due date.", go: "teacher", anchor: "td-assignments", cta: "Go to assignments" },
    { t: "Who needs support", d: "Pupils who haven’t started yet, or are stuck at a level.", go: "teacher", anchor: "td-support", cta: "See who needs support" },
    { t: "Pupil logins", d: "Each pupil’s username and PIN, with login cards to print.", go: "teacher", anchor: "td-logins", cta: "See pupil logins" },
    { t: "Read a showcase book", d: "One book for each level opens in the demo. Look for the Showcase tag.", go: "library", cta: "Open the library" },
    { t: "Print a booklet", d: "Open a showcase book and press Print book. Every print carries your school’s code." + DG_PRINT_NOTE, go: "library", cta: "Choose a book" },
  ],
  school_admin: [
    { t: "Your school", d: "Classes, teachers and pupils at a glance.", go: "school", anchor: "sd-school", cta: "Open the school" },
    { t: "Add a class or a pupil", d: "Use + New class and + Add pupil at the top of your school page.", go: "school", anchor: "sd-school", cta: "Go to your school" },
    { t: "Pupil logins", d: "Usernames and PINs for the whole school, with login cards to print.", go: "school", anchor: "sd-logins", cta: "See pupil logins" },
    { t: "Read a showcase book", d: "One book for each level opens in the demo. Look for the Showcase tag.", go: "library", cta: "Open the library" },
    { t: "Print a booklet", d: "Open a showcase book and press Print book. Every print carries your school’s code." + DG_PRINT_NOTE, go: "library", cta: "Choose a book" },
  ],
  parent: [
    { t: "Your children", d: "Amara and Emeka: what they’ve read, their reading checks and their stamps.", go: "parent", cta: "Open the family page" },
    { t: "Read together", d: "One book for each level opens in the demo. Look for the Showcase tag.", go: "library", cta: "Open the library" },
    { t: "A child’s view", d: "See the reading journey the way your child sees it.", go: "child", cta: "Open the child view" },
  ],
  child: [
    { t: "Read a book", d: "Pick a book with the Showcase tag. Read it, then answer the reading check.", go: "library", cta: "Open the library" },
    { t: "Your passport", d: "Every book you finish earns a stamp in your reading passport.", go: "passport", cta: "Open my passport" },
    { t: "Your reading journey", d: "See the books you’ve read and the next ones waiting for you.", go: "child", cta: "Open my journey" },
  ],
};
/* Gemmanti, shown to the demo teacher and demo school admin. */
const DG_GEM_ROLES = ["teacher", "school_admin"];
const DG_GEM_POINTS = ["Lesson guides and Show to class", "Worksheets on tablet or paper", "Every child’s progress", "Reports to download", "Pupil logins and cards"];
function DemoGemmanti() {
  return (
    <div className="dgg">
      <div className="dgg-copy">
        <div className="dgg-top">
          <img className="dgg-logo" src="gemmanti/assets/logo-gemmanti.png" alt="Gemmanti" />
          <h2>Everything a Haaraya teacher needs, in one place</h2>
        </div>
        <p className="dgg-lede">Gemmanti turns every Haaraya book into a lesson, a worksheet and a record of each child’s progress.</p>
        <ul>{DG_GEM_POINTS.map(t => <li key={t}>{t}</li>)}</ul>
        <div className="dgg-acts">
          <a className="dgg-btn" href={DG_GEM}>Open Gemmanti →</a>
          <a className="dgg-btn ghost" href={DG_GEM + "?demo=teacher"}>See a class at every level</a>
        </div>
      </div>
      <a className="dgg-shot" href={DG_GEM + "?demo=teacher"} aria-label="See a class at every level in Gemmanti">
        <img src="assets/gemmanti-overview.webp" alt="Gemmanti class overview" loading="lazy" />
      </a>
    </div>
  );
}

const DG_DASH = ["teacher", "school", "parent", "child", "admin"];
const DG_HOME = { teacher: "teacher", school_admin: "school", parent: "parent", child: "child" };

function dgKey(role) { return "haaraya:demo-guide:" + role; }

function DemoGuide({ role, screen, onNavigate }) {
  const [demo, setDemo] = useStateDG(() => !!(window.HaarayaAccess && window.HaarayaAccess.demo()));
  const [hidden, setHidden] = useStateDG(() => { try { return localStorage.getItem(dgKey(role)) === "1"; } catch (e) { return false; } });
  useEffectDG(() => {
    if (!window.HaarayaAccess) return;
    const on = () => setDemo(!!window.HaarayaAccess.demo());
    window.addEventListener("haaraya:access", on);
    window.HaarayaAccess.ready().then(on);
    return () => window.removeEventListener("haaraya:access", on);
  }, []);
  useEffectDG(() => { try { setHidden(localStorage.getItem(dgKey(role)) === "1"); } catch (e) { /* ignore */ } }, [role]);

  // Dashboards draw their own header (.nd-top) inside the screen: put the
  // guide just under it, not above it. Elsewhere it sits under the site nav.
  const dash = DG_DASH.includes(screen);
  const [slot, setSlot] = useStateDG(null);
  useEffectDG(() => {
    setSlot(null);
    if (!dash) return;
    let stop = false, tries = 0;
    const find = () => {
      if (stop) return;
      const top = document.querySelector(".nd-top");
      if (!top) { if (++tries > 20) setSlot("inline"); else setTimeout(find, 150); return; }
      let el = top.nextElementSibling;
      if (!el || !el.classList.contains("dg-slot")) { el = document.createElement("div"); el.className = "dg-slot"; top.after(el); }
      setSlot(el);
    };
    find();
    return () => { stop = true; };
  }, [screen, dash]);

  const cards = DG_CARDS[role];
  if (!demo || !cards || screen === "reader" || screen === "odyssey-reader") return null;
  const hide = v => { setHidden(v); try { localStorage.setItem(dgKey(role), v ? "1" : "0"); } catch (e) { /* ignore */ } };
  const full = !hidden && (screen === "home" || screen === DG_HOME[role]);
  // Go to the screen, then scroll to the card's part of it once it has loaded.
  const open = c => {
    if (c.href) { window.location.href = c.href; return; }
    if (c.go !== screen) onNavigate(c.go);
    if (!c.anchor) return;
    let tries = 0;
    const find = () => {
      const el = document.getElementById(c.anchor);
      // Scroll, then once more after the page settles (lists above may still be loading).
      if (el) { el.scrollIntoView({ block: "start" }); setTimeout(() => el.scrollIntoView({ block: "start" }), 700); }
      else if (++tries < 40) setTimeout(find, 250);
    };
    setTimeout(find, 100);
  };
  if (dash && !slot) return null;

  const body = (
    <section className={"dg" + (full ? " dg--full" : "")} aria-label="Demo guide">
      <div className="dg-bar">
        <span className="dg-pill">Demo</span>
        <span className="dg-note"><b>Demo school.</b> The pupils, teachers and results are examples, so try anything. One book at each level opens in the demo.</span>
        {!full && <button type="button" className="dg-link" onClick={() => { hide(false); onNavigate(screen === "home" ? "home" : (DG_HOME[role] || "home")); }}>Demo guide</button>}
        {full && <button type="button" className="dg-link" onClick={() => hide(true)}>Got it</button>}
      </div>
      {full && DG_GEM_ROLES.includes(role) && <div className="dg-cards"><DemoGemmanti /></div>}
      {full && (
        <div className="dg-cards">
          <h2 className="dg-title">Try these</h2>
          <div className="dg-grid">
            {cards.map((c, i) => (
              <button key={c.t} type="button" className="dg-card" onClick={() => open(c)}>
                <span className="dg-num">{i + 1}</span>
                <b>{c.t}</b>
                <span className="dg-d">{c.d}</span>
                <span className="dg-cta">{c.cta} →</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
  return dash && slot !== "inline" ? ReactDOM.createPortal(body, slot) : body;
}

window.DemoGuide = DemoGuide;
