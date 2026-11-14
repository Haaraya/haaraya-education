/* Gemmanti — live screens: sign-in gate, teacher and school admin, reports, pupil and Haaraya admin.
   They reuse the worksheet screens; anything without real data behind it yet
   (lessons, journeys, reports, requests) is left out. */
const LIVE_HOME = "../Haaraya%20Home.html";
const LIVE_LOGIN = "../Haaraya%20Login.html?next=" + encodeURIComponent("gemmanti/Gemmanti.html");
const LIVE_ROLE_NAME = { teacher: "Teacher", school: "School admin", admin: "Haaraya admin" };

/* ---------- before anything loads ---------- */
function LiveFrame({ children }) {
  return <>
    <header className="hl-top">
      <a className="hl-brand" href={LIVE_HOME}><img className="hl-logo" src="assets/logo-gemmanti.png" alt="Gemmanti" /></a>
      <div className="hl-spacer"></div>
    </header>
    <main className="live-gate">{children}</main>
  </>;
}
function LiveGate({ busy, res, retry }) {
  if (busy) return <LiveFrame><p className="live-wait">Loading…</p></LiveFrame>;
  const r = res || {};
  let title, body, actions;
  if (r.signedOut || r.noProfile) {
    title = "Sign in to Gemmanti";
    body = "Use your Haaraya school account. Teachers and school admins can sign in here.";
    actions = <a className="hl-btn big" href={LIVE_LOGIN}>Sign in</a>;
  } else if (r.unsupported && r.parentAccount) {
    title = "Gemmanti is for schools";
    body = "Your family’s reading and progress are on your Haaraya dashboard.";
    actions = <><a className="hl-btn" href={LIVE_HOME}>Go to Haaraya</a><button className="hl-btn ghost" onClick={async () => { await HLLive.signOut(); location.reload(); }}>Sign out</button></>;
  } else if (r.unsupported) {
    title = "Gemmanti is for schools";
    body = "This account can’t use Gemmanti. Sign in with a teacher or school admin account.";
    actions = <><a className="hl-btn" href={LIVE_HOME}>Back to Haaraya</a><button className="hl-btn ghost" onClick={async () => { await HLLive.signOut(); location.reload(); }}>Sign out</button></>;
  } else {
    title = "Gemmanti couldn’t load";
    body = "Check your internet connection and try again.";
    actions = <button className="hl-btn" onClick={retry}>Try again</button>;
  }
  return <LiveFrame><div className="live-card"><h1>{title}</h1><p>{body}</p><div className="live-acts">{actions}</div></div></LiveFrame>;
}

/* ---------- account menu (replaces the demo's role switcher) ---------- */
function LiveAccount() {
  const { state } = useHL();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();
  React.useEffect(() => { const c = e => ref.current && !ref.current.contains(e.target) && setOpen(false); document.addEventListener("mousedown", c); return () => document.removeEventListener("mousedown", c); }, []);
  return <div className="hl-role" ref={ref}>
    <button onClick={() => setOpen(!open)} aria-expanded={open}><Avatar name={state.me.name} size="sm" /><span className="nm" style={{ textAlign: "left" }}><small>{LIVE_ROLE_NAME[state.role]}</small>{state.me.name}</span></button>
    {open && <div className="hl-role-menu">
      <a className="item" href={LIVE_HOME}><Icon n="home" s={17} /><div>Haaraya home</div></a>
      <button className="item" onClick={async () => { await HLLive.signOut(); location.reload(); }}><Icon n="back" s={17} /><div>Sign out</div></button>
    </div>}
  </div>;
}

/* ---------- which app ---------- */
function LiveApp() {
  const { state } = useHL();
  const [pupil, setPupil] = React.useState(null);
  if (pupil && state.learners[pupil]) return <LivePupil L={state.learners[pupil]} onExit={() => setPupil(null)} />;
  if (state.role === "admin") return <LiveAdmin />;
  return <LiveStaff openPupil={setPupil} />;
}

function LiveEmpty({ title, body }) {
  return <><TopNav items={null} /><main className="live-gate"><div className="live-card"><h1>{title}</h1><p>{body}</p><div className="live-acts"><a className="hl-btn" href={LIVE_HOME}>Back to Haaraya</a></div></div></main></>;
}

/* ---------- teacher and school admin ---------- */
function LiveStaff({ openPupil }) {
  const { state, setClassScores, setClassLibrary } = useHL();
  const [classId, setClassId] = React.useState(state.classes[0] && state.classes[0].id);
  const [drawer, setDrawer] = React.useState(null);
  if (!state.schools.some(s => s.gemmanti)) return <LiveEmpty title="Gemmanti isn’t part of your school’s plan yet" body="Ask your school to add Gemmanti, or contact Haaraya." />;
  if (!state.classes.length) return <LiveEmpty title="No classes yet" body={state.role === "teacher" ? "You’ll see your class here once your school puts you in charge of one." : "Create a class and add pupils on your Haaraya school page, then come back."} />;
  const cls = state.classes.find(c => c.id === classId) || state.classes[0];
  const learners = hlClassLearners(state, cls.id);
  const school = state.schools.find(s => s.id === cls.schoolId);
  const toRecord = learners.filter(l => Object.values(l.worksheets || {}).some(r => r.status === "handed_in")).length;
  const v = state.route.view;
  const nav = [["worksheets", "Worksheets", "sheet", toRecord], ["pupils", "Pupils", "users"], ["reports", "Reports", "dl"]];
  const ctx = <><div><b>{state.me.name}</b><span>{school ? school.name : ""}</span></div>
    {state.classes.length > 1
      ? <select value={cls.id} onChange={e => setClassId(e.target.value)} aria-label="Class">{state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      : <div className="live-cls">{cls.name}</div>}
    {state.role === "teacher" && cls.teacherId === state.me.id && <label className="live-scores">
      <button className={"live-switch" + (cls.showScores ? " on" : "")} role="switch" aria-checked={cls.showScores} onClick={() => setClassScores(cls.id, !cls.showScores)}><i></i></button>
      <span>Show scores</span></label>}
    {state.role === "teacher" && cls.teacherId === state.me.id && <label className="live-scores">
      <button className={"live-switch" + (cls.showLibrary ? " on" : "")} role="switch" aria-checked={!!cls.showLibrary} onClick={() => setClassLibrary(cls.id, !cls.showLibrary)}><i></i></button>
      <span>Library for pupils</span></label>}</>;
  return <AdultShell nav={nav} ctx={ctx}>
    {v !== "pupils" && v !== "reports" && <TWorksheets key={cls.id} cls={cls} learners={learners} showScores={cls.showScores} />}
    {v === "reports" && <LiveReports key={cls.id} cls={cls} school={school} learners={learners} />}
    {v === "pupils" && <LivePupils cls={cls} learners={learners} openPupil={openPupil} openRecords={setDrawer} />}
    {drawer && state.learners[drawer] && <Drawer onClose={() => setDrawer(null)}><div className="live-drawer">
      <div className="ws-rev-h"><Avatar name={state.learners[drawer].name} size="lg" /><div><h2>{state.learners[drawer].name}</h2><p>{cls.name}</p></div></div>
      <WsRecordList L={state.learners[drawer]} />
    </div></Drawer>}
  </AdultShell>;
}

function LivePupils({ cls, learners, openPupil, openRecords }) {
  const list = learners.slice().sort((a, b) => a.name.localeCompare(b.name));
  const count = (l, s) => Object.values(l.worksheets || {}).filter(r => r.status === s).length;
  return <>
    <div className="ph-h"><div><h1>Pupils</h1><p>{cls.name} · {list.length} pupil{list.length === 1 ? "" : "s"}</p></div></div>
    {!list.length ? <div className="empty">No pupils in this class yet. Add them on your Haaraya school page.</div> :
    <div className="card" style={{ padding: 0 }}><div className="tbl-wrap"><table className="tbl">
      <thead><tr><th>Pupil</th><th>Family email</th><th className="c">Working</th><th className="c">To record</th><th className="c">Recorded</th><th></th></tr></thead>
      <tbody>{list.map(l => <tr key={l.id}>
        <td><button className="who linkish" onClick={() => openRecords(l.id)}><Avatar name={l.name} size="sm" />{l.name}</button></td>
        <td><FamilyEmail L={l} /></td>
        <td className="c">{count(l, "in_progress")}</td><td className="c">{count(l, "handed_in")}</td><td className="c">{count(l, "reviewed")}</td>
        <td className="c"><button className="hl-btn sm" onClick={() => openPupil(l.id)}>Open as pupil</button></td></tr>)}</tbody>
    </table></div></div>}
  </>;
}

/* One family email per school pupil, used to send reports. */
function FamilyEmail({ L }) {
  const { setFamilyEmail, toast } = useHL();
  const [edit, setEdit] = React.useState(false);
  const [v, setV] = React.useState(L.familyEmail || "");
  const [busy, setBusy] = React.useState(false);
  const save = async () => {
    const t = v.trim();
    if (t && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)) { toast("That email address doesn’t look right."); return; }
    setBusy(true);
    try { await setFamilyEmail(L.id, t); setEdit(false); toast(t ? "Family email saved" : "Family email removed"); }
    catch (e) { console.warn(e); toast("Couldn’t save. Try again."); }
    setBusy(false);
  };
  if (!edit) return <button className="fam-email linkish" onClick={() => { setV(L.familyEmail || ""); setEdit(true); }}>
    {L.familyEmail ? L.familyEmail : <span className="ws-hint">Add email</span>}</button>;
  return <form className="fam-edit" onSubmit={e => { e.preventDefault(); save(); }}>
    <input className="hl-input" type="email" value={v} onChange={e => setV(e.target.value)} placeholder="family@example.com" aria-label={`Family email for ${L.name}`} autoFocus disabled={busy} />
    <button className="hl-btn sm" type="submit" disabled={busy}>Save</button>
    <button className="hl-btn ghost sm" type="button" onClick={() => setEdit(false)} disabled={busy}>Cancel</button>
  </form>;
}

/* ---------- reports for families: print, save as PDF, or email ---------- */
const REP_SECS = [["wf", "Word Focus"], ["ra", "Read It Again"], ["ta", "Think About It"], ["sw", "Show What You Know"]];
function LiveReports({ cls, school, learners }) {
  const list = learners.slice().sort((a, b) => a.name.localeCompare(b.name));
  const [who, setWho] = React.useState("all");
  const shown = who === "all" ? list : list.filter(l => l.id === who);
  const [mail, setMail] = React.useState(null); // null | "confirm" | "sending" | {result}
  const recorded = l => Object.values(l.worksheets || {}).some(r => r.status === "reviewed");
  const ready = shown.filter(recorded);
  const withEmail = ready.filter(l => l.familyEmail), without = ready.filter(l => !l.familyEmail);
  const nothing = shown.filter(l => !recorded(l));
  const first = n => n.split(" ")[0];
  const send = async () => {
    setMail("sending");
    try { setMail({ result: await HLLive.emailReports(cls.id, withEmail.map(l => l.id)) }); }
    catch (e) { console.warn("Email reports failed", e); setMail({ error: true }); }
  };
  return <>
    <div className="ph-h no-print"><div><h1>Reports</h1><p>{cls.name}</p></div>
      <div className="acts">
        <button className="hl-btn ghost" onClick={() => setMail("confirm")} disabled={!shown.length}><Icon n="send" s={16} />Email to {shown.length === 1 ? "family" : "families"}</button>
        <button className="hl-btn" onClick={() => window.print()}><Icon n="dl" s={16} />Print or save as PDF</button></div></div>
    {mail && <div className="card mail-panel no-print">
      {mail === "confirm" && <>
        {withEmail.length
          ? <p><b>Send {withEmail.length === 1 ? `${first(withEmail[0].name)}’s report to their family` : `${withEmail.length} reports, one to each family`}?</b>{cls.showScores ? " Scores are included." : " Scores are not included."}</p>
          : <p><b>{ready.length ? "No family emails for these pupils yet." : "No worksheets recorded yet."}</b>{ready.length ? " Add them on the Pupils page." : " Reports go out once a worksheet has been recorded."}</p>}
        {without.length > 0 && withEmail.length > 0 && <p className="ws-hint">No family email for {without.map(l => first(l.name)).join(", ")}. Add it on the Pupils page.</p>}
        {nothing.length > 0 && ready.length > 0 && <p className="ws-hint">Nothing recorded yet for {nothing.map(l => first(l.name)).join(", ")}, so no report for them.</p>}
        <div className="live-acts">{withEmail.length > 0 && <button className="hl-btn" onClick={send}>Send</button>}<button className="hl-btn ghost" onClick={() => setMail(null)}>{withEmail.length ? "Cancel" : "Close"}</button></div>
      </>}
      {mail === "sending" && <p>Sending…</p>}
      {mail && mail.result && <>
        <p><b>{mail.result.sent ? `Sent to ${mail.result.sent} ${mail.result.sent === 1 ? "family" : "families"}.` : "Nothing was sent."}</b></p>
        {mail.result.failed && mail.result.failed.length > 0 && <p className="ws-hint">Couldn’t send for {mail.result.failed.map(first).join(", ")}. Check the address and try again.</p>}
        <div className="live-acts"><button className="hl-btn ghost" onClick={() => setMail(null)}>Done</button></div>
      </>}
      {mail && mail.error && <>
        <p><b>Couldn’t send the reports.</b> Check your connection and try again.</p>
        <div className="live-acts"><button className="hl-btn ghost" onClick={() => setMail(null)}>Close</button></div>
      </>}
    </div>}
    <div className="filters no-print">
      <select className="hl-select" value={who} onChange={e => setWho(e.target.value)} aria-label="Report for">
        <option value="all">Whole class ({list.length})</option>
        {list.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
    </div>
    {!list.length && <div className="empty">No pupils in this class yet.</div>}
    <div className="rep-stack">{shown.map(l => <LiveReport key={l.id} L={l} cls={cls} school={school} />)}</div>
  </>;
}
function LiveReport({ L, cls, school }) {
  const recs = Object.entries(L.worksheets || {}).filter(([c, r]) => HLWS.get(c) && r.status === "reviewed")
    .sort(([a], [b]) => HLWS.get(a).level - HLWS.get(b).level || a.localeCompare(b));
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  return <article className="rep-page">
    <header className="rep-h">
      <div><div className="rep-eyebrow">Haaraya Literacy · Worksheet report</div><h2>{L.name}</h2>
        <p>{[cls.name, school && school.name].filter(Boolean).join(" · ")}</p></div>
      <div className="rep-date">{today}</div>
    </header>
    {recs.length ? <table className="rep-tbl">
      <thead><tr><th>Worksheet</th>{REP_SECS.map(([k, n]) => <th key={k}>{n}</th>)}<th>Help</th>{cls.showScores && <th>Score</th>}</tr></thead>
      <tbody>{recs.map(([c, r]) => { const w = HLWS.get(c); return <tr key={c}>
        <td><b>{w.title}</b><span>Level {w.level} · {w.strand}</span></td>
        {REP_SECS.map(([k]) => <td key={k}>{r.ratings && r.ratings[k] ? HLWS.RATINGS[r.ratings[k]] : "—"}</td>)}
        <td>{r.help ? HLWS.HELP[r.help] : "—"}</td>
        {cls.showScores && <td className="num">{hlScoreText(hlWsScore(r))}</td>}
      </tr>; })}</tbody>
    </table> : <p className="rep-none">No worksheets recorded yet.</p>}
    <footer className="rep-f">
      <p><b>What the words mean.</b> Not Yet: cannot do it yet. Developing: partly right, or not yet reliable. Secure: does it accurately. Beyond: uses it in something new. Not observed: the teacher did not see enough of this part to judge.</p>
      <p><b>Help</b> shows the most help your child needed: Modelled (the teacher showed how), Prompted (a hint), or Independent (no help).{cls.showScores ? " The score counts Not Yet as 0, Developing as 1, and Secure or Beyond as 2 for each part rated. ★ marks work beyond the book." : ""}</p>
    </footer>
  </article>;
}

/* ---------- pupil (on a teacher's device) ---------- */
function LivePupil({ L, onExit }) {
  const { state, go } = useHL();
  const r = state.route; const v = r.view;
  const cls = state.classes.find(c => c.id === L.classId);
  const lib = !!(cls && cls.showLibrary);
  const inWs = v === "worksheet" && r.code;
  return <>
    <header className="hl-top">
      <span className="hl-brand"><img className="hl-logo" src="assets/logo-gemmanti.png" alt="Gemmanti" /></span>
      <div className="hl-spacer"></div>
      {lib && v !== "library" && <button className="hl-btn ghost sm live-libbtn" onClick={() => go("library", { from: inWs ? r.code : null })}><Icon n="book" s={16} />Library</button>}
      <button className="hl-btn ghost sm" onClick={() => { go("worksheets"); onExit(); }}><Icon n="back" s={16} />Finish</button>
    </header>
    <main className="kid">
      {inWs ? <WorksheetPlayer key={r.code} L={L} code={r.code} />
        : v === "library" && lib ? <LiveLibrary L={L} from={r.from} />
        : <LiveShelf L={L} />}
    </main>
    {v === "library" && lib && r.read && <LiveReader code={r.read} title={r.title} close={() => go("library", { from: r.from })}
      toWorksheet={HLWS.get(r.from || r.read) ? () => go("worksheet", { code: r.from || r.read }) : null} back={!!r.from} />}
  </>;
}

/* The Haaraya library, opened from a worksheet when the teacher allows it. */
function LiveLibrary({ L, from }) {
  const { go } = useHL();
  const [list, setList] = React.useState(null);
  const [err, setErr] = React.useState(false);
  const [lvl, setLvl] = React.useState(() => { const w = from && HLWS.get(from); return (w && w.level) || L.level || 0; });
  const [q, setQ] = React.useState("");
  React.useEffect(() => { HLLive.books().then(setList).catch(() => setErr(true)); }, []);
  const levels = list ? Array.from(new Set(list.map(b => b.l).filter(Boolean))).sort((a, b) => a - b) : [];
  const shown = (list || []).filter(b => (!lvl || b.l === lvl) && (!q || b.t.toLowerCase().includes(q.toLowerCase())));
  const back = from && HLWS.get(from);
  return <div className="kid-wrap">
    {back && <button className="back" onClick={() => go("worksheet", { code: from })}><Icon n="back" />Back to my worksheet</button>}
    <h1>Library</h1>
    {err ? <div className="empty">The library couldn’t load. Check the connection and try again.</div>
      : !list ? <div className="empty">Loading books…</div>
      : <>
        <div className="lib-bar">
          <label className="search"><Icon n="search" s={20} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by title" aria-label="Search books" /></label>
        </div>
        <div className="lvl-strip">
          <button className={"chip" + (!lvl ? " on" : "")} onClick={() => setLvl(0)}>All levels</button>
          {levels.map(n => <button key={n} className={"chip" + (lvl === n ? " on" : "")} onClick={() => setLvl(n)}>Level {n}</button>)}
        </div>
        {shown.length ? <div className="live-shelf">{shown.map(b =>
          <button key={b.id} className="live-book" onClick={() => go("library", { from, read: b.id, title: b.t })}>
            <Cover book={b} /><b>{b.t}</b><span>Level {b.l}{HLWS.get(b.id) ? " · Worksheet" : ""}</span>
          </button>)}</div>
          : <div className="empty">No books match. Try another level or clear the search.</div>}
      </>}
  </div>;
}

function LiveReader({ code, title, close, toWorksheet, back }) {
  const [pg, setPg] = React.useState(null); const [err, setErr] = React.useState(false);
  const [p, setP] = React.useState(0);
  React.useEffect(() => { HLWS.pages(code).then(setPg).catch(() => setErr(true)); }, [code]);
  const n = pg ? pg.length : 0;
  React.useEffect(() => {
    const k = e => { if (e.key === "ArrowRight") setP(x => Math.min(n - 1, x + 1)); if (e.key === "ArrowLeft") setP(x => Math.max(0, x - 1)); if (e.key === "Escape") close(); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [n]);
  const cur = pg && pg[p];
  return <div className="reader" role="dialog" aria-label={title}>
    <div className="reader-top"><button className="hl-btn ghost sm" onClick={close}><Icon n="x" s={16} />Close</button><b>{title}</b>{toWorksheet && <button className="hl-btn sm" style={{ marginLeft: "auto" }} onClick={toWorksheet}><Icon n="sheet" s={16} />{back ? "Back to my worksheet" : "Do the worksheet"}</button>}</div>
    <div className="reader-stage">
      <button className="reader-nav p" disabled={p === 0} onClick={() => setP(p - 1)} aria-label="Previous page"><Icon n="back" s={26} /></button>
      <div className="reader-page">{cur ? <div className="rd-live"><img src={cur.img} alt={`Page ${p + 1}`} /><p>{cur.text}</p></div>
        : <div className="ph">{err || (pg && !n) ? "This book couldn’t open. Try another book." : "Loading…"}</div>}</div>
      <button className="reader-nav n" disabled={!n || p >= n - 1} onClick={() => setP(p + 1)} aria-label="Next page"><Icon n="next" s={26} /></button>
    </div>
    <div className="reader-foot"><span>{n ? `Page ${p + 1} of ${n}` : ""}</span><Bar v={n ? (p + 1) / n * 100 : 0} /></div>
  </div>;
}
function LiveShelf({ L }) {
  const { go } = useHL();
  const label = { not_started: "", in_progress: "Not finished yet", handed_in: "Handed in", reviewed: "Your teacher has looked at it" };
  return <>
    <div className="kid-h"><h1>Hello, {L.name.split(" ")[0]}!</h1><p>Pick a worksheet.</p></div>
    <div className="live-shelf">{HLWS.list().map(w => { const r = hlWsRec(L, w.code);
      return <button key={w.code} className="live-book" onClick={() => go("worksheet", { code: w.code })}>
        <Cover book={hlBook(w.code)} done={r.status === "reviewed" || r.status === "handed_in"} />
        <b>{w.title}</b><span>Level {w.level}{label[r.status] ? " · " + label[r.status] : ""}</span>
      </button>; })}</div>
  </>;
}

/* ---------- Haaraya admin: who has Gemmanti ---------- */
function LiveAdmin() {
  const { state, toast } = useHL();
  const [schools, setSchools] = React.useState(state.schools);
  const [busy, setBusy] = React.useState(null);
  const [q, setQ] = React.useState("");
  const flip = async s => {
    setBusy(s.id);
    try {
      const addons = await HLLive.setGemmanti(s.sub, !s.gemmanti);
      setSchools(list => list.map(x => x.id === s.id ? { ...x, gemmanti: addons.includes("gemmanti"), sub: { ...x.sub, addons } } : x));
      toast(!s.gemmanti ? `Gemmanti is on for ${s.name}` : `Gemmanti is off for ${s.name}`);
    } catch (e) { console.warn(e); toast("Couldn’t change it. Try again."); }
    setBusy(null);
  };
  const shown = schools.filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()));
  const on = schools.filter(s => s.gemmanti).length;
  return <>
    <TopNav items={null} />
    <div style={{ background: "var(--cream)", minHeight: "calc(100vh - var(--top-h))" }}><main className="main" style={{ margin: "0 auto" }}>
      <div className="ph-h"><div><h1>Schools</h1><p>{on} of {schools.length} have Gemmanti</p></div></div>
      <div className="filters"><input className="hl-input" value={q} onChange={e => setQ(e.target.value)} placeholder="Search schools" aria-label="Search schools" /></div>
      <div className="card" style={{ padding: 0 }}><div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>School</th><th>Type</th><th>Place</th><th>Plan</th><th className="c">Gemmanti</th></tr></thead>
        <tbody>{shown.map(s => <tr key={s.id}>
          <td><b>{s.name}</b></td><td style={{ textTransform: "capitalize" }}>{(s.type || "").replace(/_/g, " ")}</td>
          <td>{[s.city, s.country].filter(Boolean).join(", ")}</td>
          <td>{s.sub ? s.sub.status : "No plan"}</td>
          <td className="c">{s.sub
            ? <button className={"live-switch" + (s.gemmanti ? " on" : "")} role="switch" aria-checked={s.gemmanti} aria-label={`Gemmanti for ${s.name}`} disabled={busy === s.id} onClick={() => flip(s)}><i></i></button>
            : <span className="ws-hint">Needs a plan</span>}</td>
        </tr>)}
        {!shown.length && <tr><td colSpan={5}><div className="empty" style={{ border: 0 }}>No schools found.</div></td></tr>}</tbody>
      </table></div></div>
    </main></div>
  </>;
}

Object.assign(window, { LiveGate, LiveApp, LiveAccount });
