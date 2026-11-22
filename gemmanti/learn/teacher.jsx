const TD = window.HL_DATA;
function AdultShell({ nav, ctx, children }) {
  const { state, go } = useHL();
  return <>
    <TopNav items={null} />
    <div className="adult">
      <aside className="side">
        {ctx && <div className="ctx">{ctx}</div>}
        <nav>{nav.map(([v, l, i, cnt]) => <button key={v} className={state.route.view === v ? "on" : ""} onClick={() => go(v)}><Icon n={i} s={17} />{l}{cnt ? <span className="cnt">{cnt}</span> : null}</button>)}</nav>
      </aside>
      <main className="main">{children}</main>
    </div>
  </>;
}
const dayLabel = d => d === 0 ? "Today" : d === 1 ? "Yesterday" : d >= 99 ? "Never" : `${d} days ago`;
function lessonCell(L, cls) {
  if (!L.lessons[TD.LESSON_ID]) return { st: null };
  const r = hlLessonRec(L); const a = hlLastAttempt(r);
  return { st: a && !a.pass ? "fail" : r.status, a };
}

function TeacherApp() {
  const { state, go } = useHL();
  const me = state.teachers.find(t => t.id === "t1");
  const [classId, setClassId] = React.useState("p3i");
  const [drawer, setDrawer] = React.useState(null);
  const [assign, setAssign] = React.useState(null);
  const cls = state.classes.find(c => c.id === classId);
  const learners = hlClassLearners(state, classId);
  const attention = learners.filter(l => hlFlags(l, cls).length);
  const v = state.route.view;
  const ctx = <><div><b>{me.name}</b><span>Greenfield Primary School</span></div>
    <select value={classId} onChange={e => setClassId(e.target.value)} aria-label="Class">{me.classes.map(id => { const c = state.classes.find(c => c.id === id); return <option key={id} value={id}>{c.name}</option>; })}</select></>;
  const nav = [["overview", "Class overview", "home"], ["roster", "Learners", "users", attention.length], ["assignments", "Assigned learning", "clip"], ["worksheets", "Worksheets", "sheet", learners.filter(l => Object.values(l.worksheets || {}).some(r => r.status === "handed_in")).length], ["reports", "Reports", "chart"], ["requests", "Content requests", "flag"]];
  const props = { cls, learners, attention, openL: setDrawer, openAssign: setAssign };
  return <AdultShell nav={nav} ctx={ctx}>
    {(v === "overview" || !nav.find(n => n[0] === v)) && <TOverview {...props} />}
    {v === "roster" && <TRoster {...props} />}
    {v === "assignments" && <TAssignments {...props} />}
    {v === "worksheets" && <TWorksheets {...props} />}
    {v === "reports" && <TReports {...props} />}
    {v === "requests" && <TRequests me={me} />}
    {drawer && <LearnerDrawer L={state.learners[drawer]} cls={cls} onClose={() => setDrawer(null)} onAssign={id => { setDrawer(null); setAssign({ to: [id] }); }} />}
    {assign && <AssignModal cls={cls} learners={learners} preset={assign} onClose={() => setAssign(null)} />}
  </AdultShell>;
}

function assignCounts(state, learners, a) {
  const tgt = learners.filter(l => a.to === "all" || a.to.includes(l.id));
  const c = { complete: 0, in_progress: 0, not_started: 0, n: tgt.length };
  tgt.forEach(l => c[hlAssignStatus(l, a)]++); return c;
}
function StackBar({ c }) {
  const p = k => c.n ? c[k] / c.n * 100 : 0;
  return <div style={{ display: "flex", height: 10, borderRadius: 99, overflow: "hidden", background: "var(--sand)", minWidth: 140 }}>
    <i style={{ width: p("complete") + "%", background: "var(--forest)" }}></i><i style={{ width: p("in_progress") + "%", background: "var(--yellow-dk)" }}></i></div>;
}

function TOverview({ cls, learners, attention, openL, openAssign }) {
  const { state, go } = useHL();
  /* Mixed demo class: the overview lists lessons and worksheets; every book is on Assigned learning. */
  const asg = state.assignments.filter(a => a.classId === cls.id && !(cls.mixed && a.type === "book"));
  const active = learners.filter(l => l.lastActive <= 7).length;
  const scores = learners.map(l => hlAvgScore(l)).filter(x => x != null);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const lessonA = asg.find(a => a.type === "lesson");
  const lc = lessonA && assignCounts(state, learners, lessonA);
  const dist = TD.LEVELS.slice(0, 12).map(lv => learners.filter(l => l.level === lv.n).length);
  const lo = cls.mixed ? 0 : Math.max(0, cls.expected - 3), hi = cls.mixed ? 12 : Math.min(12, cls.expected + 3);
  const events = state.events.filter(e => e.classId === cls.id).slice(0, 7);
  return <>
    <div className="ph-h"><div><h1>{cls.name}</h1><p>{learners.length} learners · {cls.mixed ? "one pupil at each level, L1 to L12" : `Expected level L${cls.expected}`} · Term 1, week 10</p></div>
      <div className="acts"><button className="hl-btn" onClick={() => openAssign({})}><Icon n="plus" s={16} />Assign content</button></div></div>
    <div className="kpis">
      <Kpi label="Active this week" value={`${active}/${learners.length}`} note={`${Math.round(active / learners.length * 100)}% participation`} />
      {lc && <Kpi label={`${lessonA.title} complete`} value={`${lc.complete}/${lc.n}`} note={`${lc.in_progress} in progress`} />}
      {scores.length > 0 && <Kpi label="Avg. check score" value={avg != null ? avg + "%" : "—"} note={`${scores.length} learners assessed`} />}
      {cls.mixed ? <Kpi label="Worksheets to review" value={learners.filter(l => Object.values(l.worksheets || {}).some(r => r.status === "handed_in")).length} note="handed in, waiting for you" />
        : <Kpi label="At or above level" value={`${learners.filter(l => l.level >= cls.expected).length}`} note={`of ${learners.length} at L${cls.expected}+`} />}
      <Kpi label="Need attention" value={attention.length} note="See list" dir={attention.length ? "dn" : ""} />
    </div>
    <div className="grid3">
      <div className="card"><div className="card-h"><div><h3>Assigned learning</h3><p>Completion across the class</p></div><div className="legend"><span><i style={{ background: "var(--forest)" }}></i>Complete</span><span><i style={{ background: "var(--yellow-dk)" }}></i>In progress</span></div></div>
        <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Assignment</th><th>Due</th><th style={{ width: "34%" }}>Progress</th><th className="num">Done</th></tr></thead>
          <tbody>{asg.map(a => { const c = assignCounts(state, learners, a); return <tr key={a.id} className="click" onClick={() => go("assignments")}><td><b>{a.title}</b><div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700, textTransform: "capitalize" }}>{a.type}{a.to !== "all" ? ` · ${a.to.length} ${a.to.length === 1 ? "learner" : "learners"}` : ""}</div></td><td>{new Date(a.due).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{hlIsOverdue(a.due, c.complete >= c.n) && <> <Overdue /></>}</td><td><StackBar c={c} /></td><td className="num"><b>{c.complete}</b>/{c.n}</td></tr>; })}
            {!asg.length && <tr><td colSpan="4" style={{ color: "var(--ink-soft)" }}>Nothing assigned yet.</td></tr>}</tbody></table></div>
      </div>
      <div className="card"><div className="card-h"><div><h3>Needs attention</h3><p>Below pass mark, inactive, or behind level</p></div></div>
        <div className="attn">{attention.slice(0, 7).map(l => <button key={l.id} onClick={() => openL(l.id)}><Avatar name={l.name} size="sm" /><div><b>{l.name}</b><div className="fl">{hlFlags(l, cls).map(f => <span key={f} className="flag">{f}</span>)}</div></div><LevelTag l={l.level} /></button>)}
          {!attention.length && <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>No learners flagged.</p>}
          {attention.length > 7 && <button onClick={() => go("roster")} style={{ gridTemplateColumns: "1fr", color: "var(--forest-dk)", fontWeight: 800 }}>View all {attention.length}</button>}</div>
      </div>
    </div>
    <div className="grid2" style={{ marginTop: 16 }}>
      <div className="card"><div className="card-h"><div><h3>Recent activity</h3><p>Updates as learners work</p></div></div>
        <div className="feed">{events.map((e, i) => <div key={i} className={e.live ? "live" : ""}><span><b>{e.who}</b> {e.text}</span><time>{e.at}</time></div>)}{!events.length && <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>No activity yet.</p>}</div>
      </div>
      <div className="card"><div className="card-h"><div><h3>Reading levels</h3><p>{cls.mixed ? "Learners per level" : `Learners per level · expected L${cls.expected} highlighted`}</p></div></div>
        <Bars data={dist.slice(lo, hi)} labels={TD.LEVELS.slice(lo, hi).map(l => "L" + l.n)} highlight={i => !cls.mixed && lo + i + 1 === cls.expected} />
      </div>
    </div>
  </>;
}

function TRoster({ cls, learners, openL, openAssign }) {
  const [q, setQ] = React.useState(""); const [lvl, setLvl] = React.useState("all"); const [st, setSt] = React.useState("all"); const [flagOnly, setFlagOnly] = React.useState(false);
  const [sort, setSort] = React.useState({ k: cls.mixed ? "level" : "name", d: 1 });
  const rows = learners.map(l => ({ l, lc: lessonCell(l, cls), avg: hlAvgScore(l), flags: hlFlags(l, cls) }))
    .filter(r => (!q || r.l.name.toLowerCase().includes(q.toLowerCase())) && (lvl === "all" || r.l.level === +lvl) && (st === "all" || r.lc.st === st) && (!flagOnly || r.flags.length));
  const key = { name: r => r.l.name, level: r => r.l.level + r.l.levelPct / 100, score: r => r.avg ?? -1, books: r => r.l.booksDone.length, active: r => r.l.lastActive, status: r => r.lc.st || "" };
  rows.sort((a, b) => { const x = key[sort.k](a), y = key[sort.k](b); return (x > y ? 1 : x < y ? -1 : 0) * sort.d; });
  const Th = ({ k, children, num }) => <th className={"sort" + (num ? " num" : "")} onClick={() => setSort({ k, d: sort.k === k ? -sort.d : 1 })}>{children}{sort.k === k ? (sort.d > 0 ? " ↑" : " ↓") : ""}</th>;
  const levels = [...new Set(learners.map(l => l.level))].sort((a, b) => a - b);
  const hasLesson = learners.some(l => l.lessons[TD.LESSON_ID]);
  return <>
    <div className="ph-h"><div><h1>Learners</h1><p>{cls.name} · click a learner for their full record</p></div>
      <div className="acts"><button className="hl-btn ghost" onClick={() => csvDownload(`${cls.name} roster.csv`, [["Learner", "Level", "Level %", "Steps in Order", "Last score", "Books finished", "Last active", "Flags"], ...rows.map(r => [r.l.name, "L" + r.l.level, r.l.levelPct, r.lc.st || "", r.lc.a ? `${r.lc.a.score}/6` : "", r.l.booksDone.length, dayLabel(r.l.lastActive), r.flags.join("; ")])])}><Icon n="dl" s={16} />Export CSV</button></div></div>
    <div className="card">
      <div className="filters">
        <input className="hl-input s" placeholder="Search learners" value={q} onChange={e => setQ(e.target.value)} />
        <select className="hl-select" value={lvl} onChange={e => setLvl(e.target.value)}><option value="all">All levels</option>{levels.map(l => <option key={l} value={l}>L{l}</option>)}</select>
        {hasLesson && <select className="hl-select" value={st} onChange={e => setSt(e.target.value)}><option value="all">Steps in Order: any</option><option value="complete">Complete</option><option value="in_progress">In progress</option><option value="not_started">Not started</option><option value="fail">Below pass</option></select>}
        <label style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 14, fontWeight: 700 }}><input type="checkbox" checked={flagOnly} onChange={e => setFlagOnly(e.target.checked)} />Needs attention only</label>
        <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--ink-soft)", fontWeight: 700 }}>{rows.length} of {learners.length}</span>
      </div>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><Th k="name">Learner</Th><Th k="level">Level</Th>{hasLesson && <Th k="status">Steps in Order</Th>}<Th k="score" num>Last score</Th><Th k="books" num>Books</Th><Th k="active">Last active</Th><th>Flags</th><th title="Lets this pupil choose books and worksheets at their own level and below">Work ahead</th><th></th></tr></thead>
        <tbody>{rows.map(({ l, lc, flags }) => <tr key={l.id} className={"click" + (l.lastActive === 0 && state_isLive(l) ? " live" : "")} onClick={() => openL(l.id)}>
          <td><span className="who"><Avatar name={l.name} size="sm" />{l.name}</span></td>
          <td><div className="mini-bar"><LevelTag l={l.level} /><Bar v={l.levelPct} /><span>{l.levelPct}%</span></div></td>
          {hasLesson && <td>{lc.st ? <Status s={lc.st} /> : "—"}</td>}
          <td className="num">{lc.a ? <b>{lc.a.score}/6</b> : "—"}</td>
          <td className="num">{l.booksDone.length}</td>
          <td style={{ whiteSpace: "nowrap" }}>{dayLabel(l.lastActive)}</td>
          <td><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{flags.map(f => <span key={f} className="flag">{f}</span>)}</div></td>
          <td onClick={e => e.stopPropagation()}><WorkAheadSwitch L={l} /></td>
          <td><button className="hl-btn quiet sm" onClick={e => { e.stopPropagation(); openAssign({ to: [l.id] }); }}>Assign</button></td>
        </tr>)}</tbody></table></div>
      {!rows.length && <div className="empty" style={{ marginTop: 12 }}>No learners match these filters.</div>}
    </div>
  </>;
}
/* Per pupil: off = only what the teacher assigns; on = also books and worksheets at the pupil's level and below. */
function WorkAheadSwitch({ L }) {
  const { setWorkAhead } = useHL();
  const on = !!L.workAhead;
  return <button className={"live-switch" + (on ? " on" : "")} role="switch" aria-checked={on} aria-label={`Work ahead for ${L.name}`} title={on ? "On: can choose books up to their level" : "Off: only what you assign"} onClick={() => setWorkAhead(L.id, !on)}><i></i></button>;
}
const state_isLive = l => Object.values(l.lessons).some(r => r.attempts.some(a => a.date === "2026-10-26"));

function LearnerDrawer({ L, cls, onClose, onAssign }) {
  const rec = hlLessonRec(L); const reading = Object.entries(L.reading).filter(([, r]) => !r.done);
  const SK = [["phonics", "Phonics"], ["sight", "Sight words"], ["vocab", "Vocabulary"], ["comp", "Comprehension"], ["seq", "Sequencing"]];
  return <Drawer onClose={onClose}>
    <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}><Avatar name={L.name} size="lg" /><div style={{ flex: 1 }}><h2 style={{ fontSize: 22, fontWeight: 900 }}>{L.name}</h2><p style={{ color: "var(--ink-soft)", fontWeight: 700, fontSize: 14 }}>{cls.name} · last active {dayLabel(L.lastActive).toLowerCase()}</p></div><button className="x-btn" onClick={onClose} aria-label="Close"><Icon n="x" /></button></div>
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>{hlFlags(L, cls).map(f => <span key={f} className="flag">{f}</span>)}</div>
    <div className="kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}><Kpi label="Level" value={"L" + L.level} note={`${L.levelPct}% through`} /><Kpi label="Books" value={L.booksDone.length} note="finished" /><Kpi label="Avg. score" value={hlAvgScore(L) != null ? hlAvgScore(L) + "%" : "—"} /></div>
    <div className="stack">
      <div className="card"><div className="card-h"><div><h3>Work ahead</h3><p>{L.workAhead ? `On: ${L.name.split(" ")[0]} can also choose books and worksheets up to Level ${L.level}.` : `Off: ${L.name.split(" ")[0]} only sees what you assign.`}</p></div><WorkAheadSwitch L={L} /></div></div>
      <div className="card"><div className="card-h"><h3>Skills</h3></div><div className="skills">{SK.map(([k, n]) => <div className="r" key={k}><span>{n}</span><Bar v={L.skills[k]} cls={L.skills[k] < 60 ? "y" : ""} /><span style={{ textAlign: "right" }}>{L.skills[k]}</span></div>)}</div></div>
      <div className="card"><div className="card-h"><div><h3>Worksheets</h3><p>Ratings per section · NY D S B</p></div></div><WsRecordList L={L} /></div>
      {(L.lessons[TD.LESSON_ID] || rec.attempts.length > 0) && <div className="card"><div className="card-h"><div><h3>Steps in Order · assessment attempts</h3><p>Pass mark {TD.LESSON.passMark}/6 · current status <Status s={rec.status} /></p></div></div>
        {rec.attempts.length ? <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Attempt</th><th>Date</th><th className="num">Score</th><th>Result</th></tr></thead><tbody>{rec.attempts.map((a, i) => <tr key={i} className={a.date === "2026-10-26" ? "live" : ""}><td>#{i + 1}</td><td>{a.date === "2026-10-26" ? "Today" : a.date}</td><td className="num"><b>{a.score}/{a.total}</b></td><td><Status s={a.pass ? "complete" : "fail"} label={a.pass ? "Pass" : "Fail"} /></td></tr>)}</tbody></table></div>
          : <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>{rec.status === "in_progress" ? `In progress · reached section ${rec.step + 1} of 6` : "Not started"}</p>}</div>}
      <div className="card"><div className="card-h"><h3>Reading now</h3></div>
        {reading.length ? reading.map(([id, r]) => { const b = hlBook(id); return <div key={id} style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: 12, alignItems: "center", marginBottom: 10 }}><Cover book={b} /><div><b style={{ fontSize: 14 }}>{b.t}</b><div className="mini-bar"><Bar v={r.page / r.pages * 100} cls="y" /><span style={{ width: 60 }}>p.{r.page}/{r.pages}</span></div></div></div>; }) : <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>No books in progress.</p>}</div>
      <div className="card"><div className="card-h"><h3>Finished books</h3><span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>{L.booksDone.length}</span></div><div className="cover-strip">{L.booksDone.map(hlBook).filter(Boolean).slice(0, 18).map(b => <Cover key={b.id} book={b} />)}</div></div>
      <button className="hl-btn" onClick={() => onAssign(L.id)}><Icon n="plus" s={16} />Assign to {L.name.split(" ")[0]}</button>
    </div>
  </Drawer>;
}

function AssignModal({ cls, learners, preset, onClose }) {
  const { addAssignment } = useHL();
  const [type, setType] = React.useState(preset.type || "book"); const [q, setQ] = React.useState(""); const [lvl, setLvl] = React.useState(String(cls.expected)); const [strand, setStrand] = React.useState("All");
  const [sel, setSel] = React.useState(null); const [mode, setMode] = React.useState(preset.to ? "some" : "all"); const [to, setTo] = React.useState(preset.to || []);
  const [due, setDue] = React.useState("2026-11-06");
  const items = type === "worksheet" ? HLWS.list().filter(w => (lvl === "all" || w.level === +lvl) && (strand === "All" || w.strand === strand) && (!q || w.title.toLowerCase().includes(q.toLowerCase()))).map(w => ({ id: w.code, title: w.title + " · worksheet", l: w.level, s: w.strand, book: hlBook(w.code) }))
    : type === "book" ? TD.BOOKS.filter(b => (lvl === "all" || b.l === +lvl) && (strand === "All" || b.s === strand) && (!q || b.t.toLowerCase().includes(q.toLowerCase()))).map(b => ({ id: b.id, title: b.t, l: b.l, s: b.s, book: b }))
    : type === "lesson" ? TD.LESSON_CATALOG.filter(x => (lvl === "all" || x.level === +lvl) && (strand === "All" || x.strand === strand) && (!q || x.title.toLowerCase().includes(q.toLowerCase()))).map(x => ({ id: x.id, title: x.title, l: x.level, s: x.strand }))
    : TD.JOURNEYS.filter(j => (lvl === "all" || j.level === +lvl) && (!q || j.title.toLowerCase().includes(q.toLowerCase()))).map(j => ({ id: j.id, title: j.title, l: j.level, s: j.strand }));
  const item = items.find(i => i.id === sel);
  const ok = item && (mode === "all" || to.length);
  const below = learners.filter(l => l.level < cls.expected).map(l => l.id);
  return <Modal title={`Assign to ${cls.name}`} onClose={onClose} wide foot={<><button className="hl-btn ghost" onClick={onClose}>Cancel</button><button className="hl-btn" disabled={!ok} onClick={() => { addAssignment({ classId: cls.id, type, ref: item.id, title: item.title, due, to: mode === "all" ? "all" : to }); onClose(); }}>Assign{ok ? ` to ${mode === "all" ? "whole class" : to.length + " learner" + (to.length > 1 ? "s" : "")}` : ""}</button></>}>
    <p className="note">Choose from Haaraya's approved library. Content is created by the Haaraya team — use Content requests to report a gap.</p>
    <div className="filters" style={{ margin: 0 }}>
      <div className="seg">{[["book", "Books"], ["worksheet", "Worksheets"], ["lesson", "Lessons"], ["journey", "Journeys"]].map(([k, l]) => <button key={k} className={type === k ? "on" : ""} onClick={() => { setType(k); setSel(null); }}>{l}</button>)}</div>
      <input className="hl-input s" placeholder="Search titles" value={q} onChange={e => setQ(e.target.value)} />
      <select className="hl-select" value={lvl} onChange={e => setLvl(e.target.value)}><option value="all">All levels</option>{TD.LEVELS.map(l => <option key={l.n} value={l.n}>L{l.n}{l.odyssey ? " · Odyssey" : ""}</option>)}</select>
      {type !== "journey" && <select className="hl-select" value={strand} onChange={e => setStrand(e.target.value)}><option>All</option>{TD.STRANDS.map(s => <option key={s.id}>{s.id}</option>)}</select>}
    </div>
    <div className="pick-list">{items.map(i => <button key={i.id} className={sel === i.id ? "on" : ""} onClick={() => setSel(i.id)}>
      {i.book ? <div className="th"><Cover book={i.book} /></div> : <span className="hl-av sm" style={{ background: strandOf(i.s).color }}><Icon n={type === "lesson" ? "star" : "path"} s={14} /></span>}
      <span>{i.title}<div style={{ display: "flex", gap: 4, marginTop: 3 }}><LevelTag l={i.l} />{i.s !== "All" && <StrandTag s={i.s} />}</div></span>
      {sel === i.id ? <Icon n="check" /> : <span></span>}</button>)}
      {!items.length && <div className="empty" style={{ border: 0 }}>No approved {type}s match.</div>}</div>
    <div className="field"><span>Assign to</span>
      <div className="filters" style={{ margin: 0 }}><div className="seg"><button className={mode === "all" ? "on" : ""} onClick={() => setMode("all")}>Whole class ({learners.length})</button><button className={mode === "some" ? "on" : ""} onClick={() => setMode("some")}>Selected learners</button></div>
        {mode === "some" && <><button className="hl-btn ghost sm" onClick={() => setTo(below)}>Below L{cls.expected} ({below.length})</button><button className="hl-btn quiet sm" onClick={() => setTo([])}>Clear</button></>}</div>
      {mode === "some" && <div className="checkgrid">{learners.map(l => <label key={l.id}><input type="checkbox" checked={to.includes(l.id)} onChange={e => setTo(e.target.checked ? [...to, l.id] : to.filter(x => x !== l.id))} />{l.name} <span style={{ color: "var(--ink-soft)" }}>L{l.level}</span></label>)}</div>}
    </div>
    <div className="field" style={{ maxWidth: 220 }}><label htmlFor="due">Due date</label><input id="due" className="hl-input" type="date" value={due} onChange={e => setDue(e.target.value)} /></div>
  </Modal>;
}

function TAssignments({ cls, learners, openAssign }) {
  const { state, removeAssignment } = useHL();
  const asg = state.assignments.filter(a => a.classId === cls.id);
  const [open, setOpen] = React.useState(null);
  return <>
    <div className="ph-h"><div><h1>Assigned learning</h1><p>{cls.name} · {asg.length} active assignments</p></div><div className="acts"><button className="hl-btn" onClick={() => openAssign({})}><Icon n="plus" s={16} />Assign content</button></div></div>
    <div className="stack">{asg.map(a => { const c = assignCounts(state, learners, a); const tgt = learners.filter(l => a.to === "all" || a.to.includes(l.id));
      return <div className="card" key={a.id}>
        <div className="card-h"><div style={{ display: "flex", gap: 12, alignItems: "center" }}>{a.type === "book" || a.type === "worksheet" ? <div style={{ width: 40 }}><Cover book={hlBook(a.ref)} /></div> : <span className="hl-av" style={{ background: "var(--forest-dk)" }}><Icon n={a.type === "lesson" ? "star" : "path"} s={16} /></span>}
          <div><h3>{a.title}</h3><p style={{ textTransform: "capitalize" }}>{a.type} · <span style={{ textTransform: "none" }}>{a.to === "all" ? "Whole class" : a.to.length === 1 && state.learners[a.to[0]] ? state.learners[a.to[0]].name : `${a.to.length} learners`}</span> · due {new Date(a.due).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{hlIsOverdue(a.due, c.complete >= c.n) && <> · <Overdue /></>} · set {a.created}</p></div></div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}><StackBar c={c} /><b style={{ fontSize: 14, whiteSpace: "nowrap" }}>{c.complete}/{c.n} done</b><button className="hl-btn ghost sm" onClick={() => setOpen(open === a.id ? null : a.id)}>{open === a.id ? "Hide" : "Details"}</button><button className="hl-btn quiet sm" onClick={() => removeAssignment(a.id)}>Remove</button></div></div>
        {open === a.id && <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Learner</th><th>Status</th>{a.type === "lesson" && <th className="num">Score</th>}<th>Last active</th></tr></thead><tbody>{tgt.map(l => { const s = hlAssignStatus(l, a); const at = a.type === "lesson" && hlLastAttempt(hlLessonRec(l, a.ref));
          return <tr key={l.id}><td><span className="who"><Avatar name={l.name} size="sm" />{l.name}</span></td><td><Status s={at && !at.pass ? "fail" : s} /></td>{a.type === "lesson" && <td className="num">{at ? `${at.score}/6` : "—"}</td>}<td>{dayLabel(l.lastActive)}</td></tr>; })}</tbody></table></div>}
      </div>; })}
      {!asg.length && <div className="empty">Nothing assigned to this class yet.</div>}</div>
  </>;
}

function TReports({ cls, learners, openL }) {
  const [view, setView] = React.useState("levels");
  const dist = TD.LEVELS.slice(0, 12).map(lv => learners.filter(l => l.level === lv.n).length);
  const weekly = TD.TERM_WEEKS.map((_, w) => learners.reduce((s, l) => s + l.weekly[w], 0));
  const scoreDist = [0, 1, 2, 3, 4, 5, 6].map(s => learners.filter(l => { const a = hlLastAttempt(hlLessonRec(l)); return a && a.score === s; }).length);
  const support = learners.map(l => ({ l, f: hlFlags(l, cls) })).filter(x => x.f.length);
  const heat = v => v === 0 ? "#EEEAE2" : v < 3 ? "#CFE7CF" : v < 6 ? "#7FC17F" : "#1A6E1A";
  return <>
    <div className="ph-h"><div><h1>Reports</h1><p>{cls.name} · Term 1</p></div>
      <div className="acts"><button className="hl-btn ghost" onClick={() => csvDownload(`${cls.name} report.csv`, [["Learner", "Level", ...TD.TERM_WEEKS.map(w => w + " activities"), "Last score", "Support flags"], ...learners.map(l => { const a = hlLastAttempt(hlLessonRec(l)); return [l.name, "L" + l.level, ...l.weekly, a ? `${a.score}/6` : "", hlFlags(l, cls).join("; ")]; })])}><Icon n="dl" s={16} />Download CSV</button></div></div>
    <div className="pill-tabs">{[["levels", "Reading levels"], ["completion", "Completion over time"], ["assessment", "Assessment"], ["participation", "Participation"], ["support", `Support (${support.length})`]].map(([k, l]) => <button key={k} className={"chip" + (view === k ? " on" : "")} onClick={() => setView(k)}>{l}</button>)}</div>
    {view === "levels" && cls.mixed && <div className="card"><div className="card-h"><div><h3>Reading progress by level</h3><p>{cls.name}: one pupil at each level</p></div></div><Bars data={dist} labels={TD.LEVELS.slice(0, 12).map(l => "L" + l.n)} highlight={() => false} h={200} /></div>}
    {view === "levels" && !cls.mixed && <div className="grid2"><div className="card"><div className="card-h"><div><h3>Reading progress by level</h3><p>Expected for {cls.name}: L{cls.expected}</p></div></div><Bars data={dist} labels={TD.LEVELS.slice(0, 12).map(l => "L" + l.n)} highlight={i => i + 1 === cls.expected} h={200} /></div>
      <div className="card"><div className="card-h"><h3>Against expectation</h3></div><div className="hbars">{[["Above", learners.filter(l => l.level > cls.expected).length, "var(--forest-dk)"], ["At level", learners.filter(l => l.level === cls.expected).length, "var(--forest)"], ["1 below", learners.filter(l => l.level === cls.expected - 1).length, "var(--yellow-dk)"], ["2+ below", learners.filter(l => l.level < cls.expected - 1).length, "var(--warn)"]].map(([n, v, c]) => <div className="r" key={n}><span>{n}</span><div className="tr"><i style={{ width: v / learners.length * 100 + "%", background: c }}></i></div><span className="v">{v}</span></div>)}</div>
        <p className="note" style={{ marginTop: 16 }}>{learners.filter(l => l.level < cls.expected - 1).length} learners are two or more levels behind. Consider assigning Soundables decodables at their level.</p></div></div>}
    {view === "completion" && <div className="card"><div className="card-h"><div><h3>Activities completed per week</h3><p>Books, lessons and checks · all learners</p></div></div><LineChart labels={TD.TERM_WEEKS} series={[{ name: "Class", color: "#1A6E1A", data: weekly }]} h={220} /></div>}
    {view === "assessment" && <div className="grid2"><div className="card"><div className="card-h"><div><h3>Steps in Order · latest score</h3><p>Pass mark 4/6 (highlighted below pass)</p></div></div><Bars data={scoreDist} labels={["0", "1", "2", "3", "4", "5", "6"]} highlight={i => i < 4} h={200} /></div>
      <div className="card"><div className="card-h"><h3>Question-level difficulty</h3></div><div className="hbars">{TD.LESSON.quiz.map((q, i) => { const pct = [92, 81, 88, 63, 77, 70][i]; return <div className="r" key={i} style={{ gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr) 44px" }}><span style={{ fontWeight: 600 }}>Q{i + 1}. {q.q}</span><div className="tr"><i style={{ width: pct + "%", background: pct < 70 ? "var(--yellow-dk)" : "var(--forest)" }}></i></div><span className="v">{pct}%</span></div>; })}</div></div></div>}
    {view === "participation" && <div className="card"><div className="card-h"><div><h3>Weekly participation</h3><p>Activities per learner per week</p></div><div className="legend">{[["None", 0], ["1–2", 1], ["3–5", 4], ["6+", 7]].map(([l, v]) => <span key={l}><i style={{ background: heat(v) }}></i>{l}</span>)}</div></div>
      <div className="heat"><div className="hr"><span></span>{TD.TERM_WEEKS.map(w => <span key={w} style={{ textAlign: "center", color: "var(--ink-soft)" }}>{w}</span>)}</div>
        {learners.map(l => <div className="hr" key={l.id}><span>{l.name}</span>{l.weekly.map((v, i) => <i key={i} title={`${v} activities`} style={{ background: heat(v) }}></i>)}</div>)}</div></div>}
    {view === "support" && <div className="card"><div className="card-h"><div><h3>Learners requiring support</h3><p>With a suggested next step</p></div></div><div className="tbl-wrap"><table className="tbl"><thead><tr><th>Learner</th><th>Level</th><th>Reasons</th><th>Suggested next step</th></tr></thead><tbody>{support.map(({ l, f }) => <tr key={l.id} className="click" onClick={() => openL(l.id)}><td><span className="who"><Avatar name={l.name} size="sm" />{l.name}</span></td><td><LevelTag l={l.level} /></td><td><div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>{f.map(x => <span key={x} className="flag">{x}</span>)}</div></td><td style={{ fontSize: 13 }}>{f[0].startsWith("Below pass") ? "Re-read the text together, then retake the check" : f[0].startsWith("Inactive") ? "Check in with family; assign a short book" : f[0].startsWith("Below expected") ? `Assign L${l.level} Soundables decodables` : "Help them sign in"}</td></tr>)}</tbody></table></div></div>}
  </>;
}

function TRequests({ me }) {
  const { state, addRequest } = useHL();
  const [f, setF] = React.useState({ kind: "New content", level: "4", strand: "Tafiya", text: "" });
  return <>
    <div className="ph-h"><div><h1>Content requests</h1><p>Ask for new material or report a gap. Haaraya's content team creates and publishes all content.</p></div></div>
    <div className="grid2">
      <div className="card"><div className="card-h"><h3>New request</h3></div>
        <div className="stack">
          <div className="field"><span>Type</span><div className="seg">{["New content", "Gap in a level", "Error in content"].map(k => <button key={k} className={f.kind === k ? "on" : ""} onClick={() => setF({ ...f, kind: k })}>{k}</button>)}</div></div>
          <div style={{ display: "flex", gap: 12 }}><div className="field"><label>Level</label><select className="hl-select" value={f.level} onChange={e => setF({ ...f, level: e.target.value })}>{TD.LEVELS.map(l => <option key={l.n} value={l.n}>L{l.n}</option>)}</select></div>
            <div className="field"><label>Strand</label><select className="hl-select" value={f.strand} onChange={e => setF({ ...f, strand: e.target.value })}>{TD.STRANDS.map(s => <option key={s.id}>{s.id}</option>)}<option>Not sure</option></select></div></div>
          <div className="field"><label htmlFor="rq">What do your learners need?</label><textarea id="rq" className="hl-input" value={f.text} onChange={e => setF({ ...f, text: e.target.value })} placeholder="e.g. More decodable texts with 'sh' and 'ch' at Level 3"></textarea></div>
          <div><button className="hl-btn" disabled={!f.text.trim()} onClick={() => { addRequest({ ...f, level: +f.level, by: me.name }); setF({ ...f, text: "" }); }}><Icon n="send" s={16} />Send to Haaraya</button></div>
        </div></div>
      <div className="card"><div className="card-h"><h3>Your requests</h3></div>
        <div className="feed">{state.requests.map(r => <div key={r.id}><span><b>{r.kind}</b> · L{r.level} {r.strand}<br /><span style={{ color: "var(--ink-mid)" }}>{r.text}</span></span><span style={{ textAlign: "right" }}><Status s={r.status === "Received" ? "not_started" : "in_progress"} label={r.status} /><br /><time>{r.date}</time></span></div>)}</div></div>
    </div>
  </>;
}
Object.assign(window, { WorkAheadSwitch, TeacherApp, AdultShell, LearnerDrawer, StackBar, dayLabel });
