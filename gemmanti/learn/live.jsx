/* Gemmanti — live screens: sign-in gate, staff, parent, pupil and Haaraya admin.
   They reuse the worksheet screens; anything without real data behind it yet
   (lessons, journeys, reports, requests) is left out. */
const LIVE_HOME = "../Haaraya%20Home.html";
const LIVE_LOGIN = "../Haaraya%20Login.html?next=" + encodeURIComponent("gemmanti/Gemmanti.html");
const LIVE_ROLE_NAME = { teacher: "Teacher", school: "School admin", parent: "Parent", admin: "Haaraya admin" };

/* ---------- before anything loads ---------- */
function LiveFrame({ children }) {
  return <>
    <header className="hl-top">
      <a className="hl-brand" href={LIVE_HOME}><img src="assets/haaraya-emblem.png" alt="" /><b>Gemmanti</b></a>
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
    body = "Use your Haaraya account. Teachers, school admins and parents can sign in here.";
    actions = <a className="hl-btn big" href={LIVE_LOGIN}>Sign in</a>;
  } else if (r.unsupported) {
    title = "Gemmanti is for schools and families";
    body = "This account can’t use Gemmanti. Sign in as a teacher, school admin or parent.";
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
  if (state.role === "parent") return <LiveParent openPupil={setPupil} />;
  return <LiveStaff openPupil={setPupil} />;
}

function LiveEmpty({ title, body }) {
  return <><TopNav items={null} /><main className="live-gate"><div className="live-card"><h1>{title}</h1><p>{body}</p><div className="live-acts"><a className="hl-btn" href={LIVE_HOME}>Back to Haaraya</a></div></div></main></>;
}

/* ---------- teacher and school admin ---------- */
function LiveStaff({ openPupil }) {
  const { state } = useHL();
  const [classId, setClassId] = React.useState(state.classes[0] && state.classes[0].id);
  const [drawer, setDrawer] = React.useState(null);
  if (!state.schools.some(s => s.gemmanti)) return <LiveEmpty title="Gemmanti isn’t part of your school’s plan yet" body="Ask your school to add Gemmanti, or contact Haaraya." />;
  if (!state.classes.length) return <LiveEmpty title="No classes yet" body={state.role === "teacher" ? "You’ll see your class here once your school puts you in charge of one." : "Create a class and add pupils on your Haaraya school page, then come back."} />;
  const cls = state.classes.find(c => c.id === classId) || state.classes[0];
  const learners = hlClassLearners(state, cls.id);
  const school = state.schools.find(s => s.id === cls.schoolId);
  const toRecord = learners.filter(l => Object.values(l.worksheets || {}).some(r => r.status === "handed_in")).length;
  const v = state.route.view;
  const nav = [["worksheets", "Worksheets", "sheet", toRecord], ["pupils", "Pupils", "users"]];
  const ctx = <><div><b>{state.me.name}</b><span>{school ? school.name : ""}</span></div>
    {state.classes.length > 1
      ? <select value={cls.id} onChange={e => setClassId(e.target.value)} aria-label="Class">{state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      : <div className="live-cls">{cls.name}</div>}</>;
  return <AdultShell nav={nav} ctx={ctx}>
    {v !== "pupils" && <TWorksheets key={cls.id} cls={cls} learners={learners} />}
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
      <thead><tr><th>Pupil</th><th className="c">Working</th><th className="c">To record</th><th className="c">Recorded</th><th></th></tr></thead>
      <tbody>{list.map(l => <tr key={l.id}>
        <td><button className="who linkish" onClick={() => openRecords(l.id)}><Avatar name={l.name} size="sm" />{l.name}</button></td>
        <td className="c">{count(l, "in_progress")}</td><td className="c">{count(l, "handed_in")}</td><td className="c">{count(l, "reviewed")}</td>
        <td className="c"><button className="hl-btn sm" onClick={() => openPupil(l.id)}>Open as pupil</button></td></tr>)}</tbody>
    </table></div></div>}
  </>;
}

/* ---------- parent ---------- */
function LiveParent({ openPupil }) {
  const { state } = useHL();
  const kids = Object.values(state.learners).sort((a, b) => a.name.localeCompare(b.name));
  const [cid, setCid] = React.useState(kids[0] && kids[0].id);
  if (!kids.length) return <LiveEmpty title="Gemmanti isn’t available for your children yet" body="Gemmanti comes through your child’s school. When their school adds it, you’ll see their worksheets here." />;
  const L = state.learners[cid] || kids[0];
  return <>
    <TopNav items={null} />
    <div style={{ background: "var(--cream)", minHeight: "calc(100vh - 64px)" }}><main className="main" style={{ margin: "0 auto" }}>
      <div className="ph-h"><div><h1>{state.me.name}</h1><p>Your children’s worksheets</p></div></div>
      {kids.length > 1 && <div className="child-pick" style={{ marginBottom: 18 }}>{kids.map(c => <button key={c.id} className={L.id === c.id ? "on" : ""} onClick={() => setCid(c.id)}><Avatar name={c.name} /><div><b>{c.name}</b></div></button>)}</div>}
      <div className="card">
        <div className="card-h"><div><h3>{L.name.split(" ")[0]}’s worksheets</h3><p>What the teacher saw, section by section. Haaraya does not turn these into scores.</p></div>
          <button className="hl-btn" onClick={() => openPupil(L.id)}><Icon n="sheet" s={16} />Do a worksheet</button></div>
        <WsRecordList L={L} family />
      </div>
    </main></div>
  </>;
}

/* ---------- pupil (on a parent's or teacher's device) ---------- */
function LivePupil({ L, onExit }) {
  const { state, go } = useHL();
  const v = state.route.view;
  return <>
    <header className="hl-top">
      <span className="hl-brand"><img src="assets/haaraya-emblem.png" alt="" /><b>Gemmanti</b></span>
      <div className="hl-spacer"></div>
      <button className="hl-btn ghost sm" onClick={() => { go(state.role === "parent" ? "home" : "worksheets"); onExit(); }}><Icon n="back" s={16} />Finish</button>
    </header>
    <main className="kid">
      {v === "worksheet" && state.route.code ? <WorksheetPlayer key={state.route.code} L={L} code={state.route.code} /> : <LiveShelf L={L} />}
    </main>
  </>;
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
    <div style={{ background: "var(--cream)", minHeight: "calc(100vh - 64px)" }}><main className="main" style={{ margin: "0 auto" }}>
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
