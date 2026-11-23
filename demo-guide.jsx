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
const DG_CARDS = {
  teacher: [
    { t: "Your demo class", d: "Primary 3 · Demo: seven pupils, the books they’ve read and their reading checks.", go: "teacher", cta: "Open the class" },
    { t: "Gemmanti for teachers", d: "Mark worksheets, see each pupil’s library reading and print pupil login cards.", href: DG_GEM, cta: "Open Gemmanti" },
    { t: "A class at every level", d: "Twelve pupils, Levels 1 to 12, each with a book, a worksheet and a lesson. Try marking Chidi’s and Fatima’s handed-in work.", href: DG_GEM + "?demo=teacher", cta: "See the 12-level class" },
    { t: "Teach a lesson", d: "Step-by-step lesson guides, with Show to class for a projector or TV.", href: DG_GEM + "?demo=teacher&view=teach", cta: "Open Teach" },
    { t: "Read a showcase book", d: "One book for each level opens in the demo. Look for the Showcase tag.", go: "library", cta: "Open the library" },
    { t: "Print a booklet", d: "Open a showcase book and press Print book. Every print carries your school’s code.", go: "library", cta: "Choose a book" },
  ],
  school_admin: [
    { t: "Your demo school", d: "Haaraya Demo Primary: classes, teachers and pupils at a glance.", go: "school", cta: "Open the school" },
    { t: "Gemmanti for schools", d: "Worksheets, reading records and printable pupil login cards for every class.", href: DG_GEM, cta: "Open Gemmanti" },
    { t: "A class at every level", d: "Twelve pupils, Levels 1 to 12, each with a book, a worksheet and a lesson.", href: DG_GEM + "?demo=teacher", cta: "See the 12-level class" },
    { t: "Read a showcase book", d: "One book for each level opens in the demo. Look for the Showcase tag.", go: "library", cta: "Open the library" },
    { t: "Print a booklet", d: "Open a showcase book and press Print book. Every print carries your school’s code.", go: "library", cta: "Choose a book" },
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
    { t: "Gemmanti for pupils", d: "Worksheets and lessons, the way a pupil sees them in class.", href: DG_GEM + "?demo=child", cta: "Try as a pupil" },
  ],
};
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
  const open = c => { if (c.href) window.location.href = c.href; else onNavigate(c.go); };
  if (dash && !slot) return null;

  const body = (
    <section className={"dg" + (full ? " dg--full" : "")} aria-label="Demo guide">
      <div className="dg-bar">
        <span className="dg-pill">Demo</span>
        <span className="dg-note">This is a demonstration. The school, pupils, classes and scores are invented. One book at each level opens here.</span>
        {!full && <button type="button" className="dg-link" onClick={() => { hide(false); onNavigate(screen === "home" ? "home" : (DG_HOME[role] || "home")); }}>Demo guide</button>}
        {full && <button type="button" className="dg-link" onClick={() => hide(true)}>Got it</button>}
      </div>
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
