const AD = window.HL_DATA;
const SKILL_NAMES = { phonics: "Phonics", sight: "Sight words", vocab: "Vocabulary", comp: "Comprehension", seq: "Sequencing" };
const HOME_TIPS = {
  phonics: "Point to a word and sound it out together, slowly.",
  sight: "Spot common words like “the” and “said” on signs and packets.",
  vocab: "Pick one new word from today's book and use it at dinner.",
  comp: "After reading, ask: who was in the story, and what happened?",
  seq: "Ask them to tell you how to do a chore — first, next, then, finally."
};

/* ---------- Parent ---------- */
function ParentApp() {
  const { state } = useHL();
  const [cid, setCid] = React.useState("amara");
  const L = state.learners[cid]; const cls = state.classes.find(c => c.id === L.classId);
  const rec = hlLessonRec(L); const last = hlLastAttempt(rec);
  const sk = Object.entries(L.skills).sort((a, b) => b[1] - a[1]);
  const J = L.level === 4 ? AD.JOURNEYS[0].units : null;
  const reading = Object.entries(L.reading).filter(([, r]) => !r.done);
  return <>
    <TopNav items={null} />
    <div style={{ background: "var(--cream)", minHeight: "calc(100vh - 64px)" }}><main className="main" style={{ margin: "0 auto" }}>
      <div className="ph-h"><div><h1>{AD.PARENT.name}</h1><p>Your children's reading at a glance</p></div></div>
      <div className="child-pick" style={{ marginBottom: 18 }}>{AD.PARENT.children.map(id => { const c = state.learners[id]; return <button key={id} className={cid === id ? "on" : ""} onClick={() => setCid(id)}><Avatar name={c.name} /><div>{c.name}<span>Level {c.level} · {state.classes.find(x => x.id === c.classId).name}</span></div></button>; })}</div>
      <div className="kpis">
        <Kpi label="Reading level" value={"L" + L.level} note={`${L.levelPct}% through Level ${L.level}`} />
        <Kpi label="Books finished" value={L.booksDone.length} note="this term" />
        <Kpi label="Activities this week" value={L.weekly[9]} note={`${L.weekly[8]} last week`} dir={L.weekly[9] >= L.weekly[8] ? "up" : "dn"} />
        <Kpi label="Latest check" value={last ? `${last.score}/${last.total}` : "—"} note={last ? (last.pass ? "Passed · Steps in Order" : "Below pass mark") : "No checks yet"} dir={last ? (last.pass ? "up" : "dn") : ""} />
      </div>
      <div className="grid3">
        <div className="card"><div className="card-h"><div><h3>Reading activity</h3><p>Books, lessons and checks each week</p></div></div><Bars data={L.weekly} labels={AD.TERM_WEEKS} h={170} /></div>
        <div className="card"><div className="card-h"><h3>Reading now</h3></div>
          {reading.length ? reading.map(([id, r]) => { const b = hlBook(id); return <div key={id} style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 12, alignItems: "center", marginBottom: 12 }}><Cover book={b} /><div><b style={{ fontSize: 14 }}>{b.t}</b><div className="mini-bar"><Bar v={r.page / r.pages * 100} cls="y" /><span style={{ width: 60 }}>p.{r.page}/{r.pages}</span></div></div></div>; }) : <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>Nothing in progress.</p>}</div>
      </div>
      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="card"><div className="card-h"><div><h3>Strengths and practice</h3><p>From reading, lessons and checks</p></div></div>
          <div className="skills">{sk.map(([k, v]) => <div className="r" key={k}><span>{SKILL_NAMES[k]}</span><Bar v={v} cls={v < 65 ? "y" : ""} /><span style={{ textAlign: "right" }}>{v}</span></div>)}</div>
          <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Strongest: {SKILL_NAMES[sk[0][0]]}, {SKILL_NAMES[sk[1][0]]}</div>
            {sk.slice(-2).reverse().map(([k]) => <div key={k} className="note"><b>Practise {SKILL_NAMES[k].toLowerCase()} at home.</b> {HOME_TIPS[k]}</div>)}
          </div></div>
        <div className="card"><div className="card-h"><div><h3>Learning journey</h3><p>{L.level === 4 ? AD.JOURNEYS[0].title : "Level 2 · Sounds Together"}</p></div></div>
          {J ? <div className="feed">{J.map((u, i) => { const st = u.done || (u.live && rec.status === "complete") ? "complete" : u.live ? rec.status : "not_started"; const a = u.live && last;
            return <div key={u.id}><span><b>Unit {i + 1}</b> · {u.title}{a ? <span style={{ color: "var(--ink-soft)" }}> · score {a.score}/6</span> : null}</span><Status s={a && !a.pass ? "fail" : st} label={st === "not_started" ? "Upcoming" : null} /></div>; })}</div>
            : <div className="feed">{["Short Vowel Sounds", "Blends: st, sp, sn", "Sight Words in Sentences", "Reading Sound Stories", "Sounds Together Review", "Level 2 Check"].map((t, i) => <div key={t}><span><b>Unit {i + 1}</b> · {t}</span><Status s={i < 2 ? "complete" : i === 2 ? "in_progress" : "not_started"} label={i > 2 ? "Upcoming" : null} /></div>)}</div>}
        </div>
      </div>
      <div className="card" style={{ marginTop: 16 }}><div className="card-h"><div><h3>Worksheets</h3><p>What the teacher saw, section by section. Haaraya does not turn these into scores.</p></div></div><WsRecordList L={L} family /></div>
      <div className="card" style={{ marginTop: 16 }}><div className="card-h"><h3>Completed books</h3><span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>{L.booksDone.length} books</span></div><div className="cover-strip" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(88px,1fr))" }}>{L.booksDone.map(hlBook).filter(Boolean).map(b => <Cover key={b.id} book={b} />)}</div></div>
    </main></div>
  </>;
}

/* ---------- School administrator ---------- */
function classStats(state, c) {
  const ls = hlClassLearners(state, c.id); const n = ls.length || 1;
  const sc = ls.map(hlAvgScore).filter(x => x != null);
  return { c, n: ls.length, ls, teacher: state.teachers.find(t => t.id === c.teacherId), at: Math.round(ls.filter(l => l.level >= c.expected).length / n * 100),
    active: Math.round(ls.filter(l => l.lastActive <= 7).length / n * 100), score: sc.length ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length) : null,
    books: (ls.reduce((s, l) => s + l.booksDone.length, 0) / n).toFixed(1), below: ls.filter(l => l.level < c.expected).length, above: ls.filter(l => l.level > c.expected).length, atExact: ls.filter(l => l.level === c.expected).length };
}
function SchoolApp() {
  const { state } = useHL(); const v = state.route.view;
  const nav = [["overview", "School overview", "school"], ["classes", "Classes & teachers", "users"], ["learners", "Enrolment", "plus"], ["reports", "Reports", "dl"]];
  const ctx = <div><b>Greenfield Primary School</b><span>Mr Chinedu Okoye · Head</span></div>;
  return <AdultShell nav={nav} ctx={ctx}>
    {(v === "overview" || !nav.find(n => n[0] === v)) && <SOverview />}{v === "classes" && <SClasses />}{v === "learners" && <SLearners />}{v === "reports" && <SReports />}
  </AdultShell>;
}
function SOverview() {
  const { state } = useHL();
  const all = Object.values(state.learners).filter(l => l.schoolId === "gf");
  const stats = state.classes.map(c => classStats(state, c));
  const [sort, setSort] = React.useState({ k: "grade", d: 1 });
  const key = { grade: s => s.c.grade, n: s => s.n, at: s => s.at, active: s => s.active, score: s => s.score ?? -1, books: s => +s.books };
  const rows = stats.slice().sort((a, b) => (key[sort.k](a) - key[sort.k](b)) * sort.d);
  const Th = ({ k, children }) => <th className="sort num" onClick={() => setSort({ k, d: sort.k === k ? -sort.d : -1 })}>{children}{sort.k === k ? (sort.d > 0 ? " ↑" : " ↓") : ""}</th>;
  const dist = AD.LEVELS.slice(0, 12).map(lv => all.filter(l => l.level === lv.n).length);
  const act = AD.TERM_WEEKS.map((_, w) => +(all.reduce((s, l) => s + l.weekly[w], 0) / all.length).toFixed(1));
  const scoreTrend = [61, 63, 62, 66, 68, 67, 70, 71, 73, stats.find(s => s.c.id === "p3i").score || 72];
  const active = all.filter(l => l.lastActive <= 7).length;
  return <>
    <div className="ph-h"><div><h1>Greenfield Primary School</h1><p>Term 1 · week 10 · Lagos</p></div></div>
    <div className="kpis">
      <Kpi label="Enrolled learners" value={all.length} note={`${state.classes.length} classes`} />
      <Kpi label="Teachers" value={state.teachers.length} note={`${state.teachers.filter(t => !t.classes.length).length} without a class`} />
      <Kpi label="Active this week" value={Math.round(active / all.length * 100) + "%"} note={`${active} learners`} dir="up" />
      <Kpi label="At or above level" value={Math.round(stats.reduce((s, x) => s + x.at * x.n, 0) / all.length) + "%"} note="vs. expected for grade" />
      <Kpi label="Books per learner" value={(all.reduce((s, l) => s + l.booksDone.length, 0) / all.length).toFixed(1)} note="finished this term" />
    </div>
    <div className="grid2">
      <div className="card"><div className="card-h"><div><h3>Reading-level distribution</h3><p>All learners, L1–L12</p></div></div><Bars data={dist} labels={AD.LEVELS.slice(0, 12).map(l => "L" + l.n)} h={190} /></div>
      <div className="card"><div className="card-h"><div><h3>Level vs. expectation by class</h3></div><div className="legend"><span><i style={{ background: "var(--warn)" }}></i>Below</span><span><i style={{ background: "var(--forest)" }}></i>At</span><span><i style={{ background: "var(--forest-dk)", opacity: .55 }}></i>Above</span></div></div>
        <div className="hbars">{stats.map(s => <div className="r" key={s.c.id} style={{ gridTemplateColumns: "130px minmax(0,1fr) 44px" }}><span>{s.c.name.replace("Primary", "P")}</span><div className="tr"><i style={{ width: s.below / (s.n || 1) * 100 + "%", background: "var(--warn)" }}></i><i style={{ width: s.atExact / (s.n || 1) * 100 + "%", background: "var(--forest)" }}></i><i style={{ width: s.above / (s.n || 1) * 100 + "%", background: "var(--forest-dk)", opacity: .55 }}></i></div><span className="v">{s.below}</span></div>)}</div>
        <p style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700, marginTop: 8 }}>Number on the right = learners below expected level</p></div>
    </div>
    <div className="grid2" style={{ marginTop: 16 }}>
      <div className="card"><div className="card-h"><div><h3>Completion trend</h3><p>Average activities per learner per week</p></div></div><LineChart labels={AD.TERM_WEEKS} series={[{ name: "Activities", color: "#1A6E1A", data: act }]} h={190} /></div>
      <div className="card"><div className="card-h"><div><h3>Assessment trend</h3><p>Average check score, all classes</p></div></div><LineChart labels={AD.TERM_WEEKS} series={[{ name: "Score", color: "#C24400", data: scoreTrend }]} max={100} unit="%" h={190} /></div>
    </div>
    <div className="card" style={{ marginTop: 16 }}><div className="card-h"><div><h3>Class comparison</h3><p>Click a column to sort</p></div></div>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th className="sort" onClick={() => setSort({ k: "grade", d: sort.k === "grade" ? -sort.d : 1 })}>Class</th><th>Teacher</th><Th k="n">Learners</Th><Th k="at">At/above level</Th><Th k="active">Active</Th><Th k="score">Avg score</Th><Th k="books">Books/learner</Th></tr></thead>
        <tbody>{rows.map(s => <tr key={s.c.id}><td><b>{s.c.name}</b><div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700 }}>Expected L{s.c.expected}</div></td><td>{s.teacher ? s.teacher.name : <span className="flag">Unassigned</span>}</td><td className="num">{s.n}</td><td className="num"><b style={{ color: s.at < 60 ? "var(--warn)" : "inherit" }}>{s.at}%</b></td><td className="num">{s.active}%</td><td className="num">{s.score != null ? s.score + "%" : "—"}</td><td className="num">{s.books}</td></tr>)}</tbody></table></div></div>
  </>;
}
function SClasses() {
  const { state, assignTeacher, addTeacher, addClass } = useHL();
  const [m, setM] = React.useState(null); const [f, setF] = React.useState({});
  return <>
    <div className="ph-h"><div><h1>Classes & teachers</h1><p>{state.classes.length} classes · {state.teachers.length} teachers</p></div>
      <div className="acts"><button className="hl-btn ghost" onClick={() => { setF({ name: "", email: "" }); setM("t"); }}><Icon n="plus" s={16} />Invite teacher</button><button className="hl-btn" onClick={() => { setF({ name: "", grade: 1 }); setM("c"); }}><Icon n="plus" s={16} />New class</button></div></div>
    <div className="stack">
      <div className="card"><div className="card-h"><h3>Classes</h3></div><div className="tbl-wrap"><table className="tbl"><thead><tr><th>Class</th><th>Expected level</th><th className="num">Learners</th><th>Teacher</th></tr></thead>
        <tbody>{state.classes.map(c => <tr key={c.id}><td><b>{c.name}</b></td><td><LevelTag l={c.expected} /></td><td className="num">{hlClassLearners(state, c.id).length}</td><td><select className="hl-select" value={c.teacherId || ""} onChange={e => assignTeacher(c.id, e.target.value)} aria-label={`Teacher for ${c.name}`}><option value="">Unassigned</option>{state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></td></tr>)}</tbody></table></div></div>
      <div className="card"><div className="card-h"><h3>Teachers</h3></div><div className="tbl-wrap"><table className="tbl"><thead><tr><th>Teacher</th><th>Email</th><th>Classes</th><th>Status</th></tr></thead>
        <tbody>{state.teachers.map(t => <tr key={t.id}><td><span className="who"><Avatar name={t.name} size="sm" />{t.name}</span></td><td>{t.email}</td><td>{t.classes.map(id => state.classes.find(c => c.id === id)?.name).filter(Boolean).join(", ") || "—"}</td><td><Status s={t.invited ? "in_progress" : "complete"} label={t.invited ? "Invite sent" : "Active"} /></td></tr>)}</tbody></table></div></div>
    </div>
    {m === "t" && <Modal title="Invite a teacher" onClose={() => setM(null)} foot={<><button className="hl-btn ghost" onClick={() => setM(null)}>Cancel</button><button className="hl-btn" disabled={!f.name || !f.email} onClick={() => { addTeacher({ name: f.name, email: f.email, invited: true }); setM(null); }}>Send invite</button></>}>
      <div className="field"><label>Full name</label><input className="hl-input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Mrs Funke Ade" /></div>
      <div className="field"><label>School email</label><input className="hl-input" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="name@greenfield.example" /></div>
      <p className="note">Prototype: no email is sent.</p></Modal>}
    {m === "c" && <Modal title="New class" onClose={() => setM(null)} foot={<><button className="hl-btn ghost" onClick={() => setM(null)}>Cancel</button><button className="hl-btn" disabled={!f.name} onClick={() => { addClass({ name: f.name, grade: +f.grade, expected: Math.min(12, +f.grade + 1), teacherId: f.teacherId || null }); setM(null); }}>Create class</button></>}>
      <div className="field"><label>Class name</label><input className="hl-input" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Primary 2 Ruby" /></div>
      <div style={{ display: "flex", gap: 12 }}><div className="field"><label>Grade</label><select className="hl-select" value={f.grade} onChange={e => setF({ ...f, grade: e.target.value })}>{[1, 2, 3, 4, 5, 6].map(g => <option key={g} value={g}>Primary {g}</option>)}</select></div>
        <div className="field"><label>Teacher</label><select className="hl-select" value={f.teacherId || ""} onChange={e => setF({ ...f, teacherId: e.target.value })}><option value="">Assign later</option>{state.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div></div>
      <p className="note">Expected reading level is set from the grade (Primary {f.grade} → L{Math.min(12, +f.grade + 1)}).</p></Modal>}
  </>;
}
function SLearners() {
  const { state, enroll } = useHL();
  const [name, setName] = React.useState(""); const [cid, setCid] = React.useState(state.classes[0].id); const [q, setQ] = React.useState(""); const [fc, setFc] = React.useState("all");
  const ls = Object.values(state.learners).filter(l => l.schoolId === "gf" && (fc === "all" || l.classId === fc) && (!q || l.name.toLowerCase().includes(q.toLowerCase())));
  ls.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || a.name.localeCompare(b.name));
  return <>
    <div className="ph-h"><div><h1>Enrolment</h1><p>{Object.values(state.learners).filter(l => l.schoolId === "gf").length} learners enrolled</p></div></div>
    <div className="card" style={{ marginBottom: 16 }}><div className="card-h"><h3>Enrol a learner</h3></div>
      <div className="filters" style={{ margin: 0 }}><input className="hl-input" style={{ minWidth: 240 }} placeholder="Learner's full name" value={name} onChange={e => setName(e.target.value)} />
        <select className="hl-select" value={cid} onChange={e => setCid(e.target.value)}>{state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <button className="hl-btn" disabled={!name.trim()} onClick={() => { enroll(name.trim(), cid); setName(""); }}>Enrol</button>
        <span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>Starts at the class's expected level until a placement check is taken.</span></div></div>
    <div className="card"><div className="filters"><input className="hl-input s" placeholder="Search learners" value={q} onChange={e => setQ(e.target.value)} /><select className="hl-select" value={fc} onChange={e => setFc(e.target.value)}><option value="all">All classes</option>{state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "var(--ink-soft)" }}>{ls.length} shown</span></div>
      <div className="tbl-wrap" style={{ maxHeight: 520, overflowY: "auto" }}><table className="tbl"><thead><tr><th>Learner</th><th>Class</th><th>Level</th><th className="num">Books</th><th>Last active</th></tr></thead>
        <tbody>{ls.map(l => <tr key={l.id} className={l.isNew ? "live" : ""}><td><span className="who"><Avatar name={l.name} size="sm" />{l.name}{l.isNew && <Status s="in_progress" label="New" />}</span></td><td>{state.classes.find(c => c.id === l.classId)?.name}</td><td><LevelTag l={l.level} /></td><td className="num">{l.booksDone.length}</td><td>{dayLabel(l.lastActive)}</td></tr>)}</tbody></table></div></div>
  </>;
}
function SReports() {
  const { state } = useHL();
  const [type, setType] = React.useState("summary"); const [cid, setCid] = React.useState("all");
  const classes = state.classes.filter(c => cid === "all" || c.id === cid);
  let head, body;
  if (type === "summary") { head = ["Class", "Teacher", "Learners", "At/above level %", "Active %", "Avg score %", "Books/learner"]; body = classes.map(c => { const s = classStats(state, c); return [c.name, s.teacher?.name || "Unassigned", s.n, s.at, s.active, s.score ?? "", s.books]; }); }
  else { const ls = classes.flatMap(c => hlClassLearners(state, c.id).map(l => [l, c]));
    if (type === "learners") { head = ["Learner", "Class", "Level", "Level %", "Books finished", "Last active", "Flags"]; body = ls.map(([l, c]) => [l.name, c.name, "L" + l.level, l.levelPct, l.booksDone.length, dayLabel(l.lastActive), hlFlags(l, c).join("; ")]); }
    else if (type === "levels") { head = ["Class", ...AD.LEVELS.slice(0, 12).map(l => "L" + l.n)]; body = classes.map(c => [c.name, ...AD.LEVELS.slice(0, 12).map(lv => hlClassLearners(state, c.id).filter(l => l.level === lv.n).length)]); }
    else { head = ["Learner", "Class", "Lesson", "Attempts", "Latest score", "Result"]; body = ls.filter(([l]) => l.lessons[AD.LESSON_ID] && l.lessons[AD.LESSON_ID].attempts.length).map(([l, c]) => { const r = l.lessons[AD.LESSON_ID]; const a = hlLastAttempt(r); return [l.name, c.name, AD.LESSON.title, r.attempts.length, `${a.score}/${a.total}`, a.pass ? "Pass" : "Fail"]; }); }
  }
  const names = { summary: "Class summary", learners: "Learner progress", levels: "Reading levels", assessment: "Assessment results" };
  return <>
    <div className="ph-h"><div><h1>Reports</h1><p>Preview, then download as CSV for spreadsheets or governors' reports</p></div></div>
    <div className="card"><div className="filters">
      <div className="seg">{Object.entries(names).map(([k, l]) => <button key={k} className={type === k ? "on" : ""} onClick={() => setType(k)}>{l}</button>)}</div>
      <select className="hl-select" value={cid} onChange={e => setCid(e.target.value)}><option value="all">All classes</option>{state.classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <span style={{ marginLeft: "auto" }}></span>
      <button className="hl-btn" onClick={() => csvDownload(`Greenfield ${names[type]}.csv`, [head, ...body])}><Icon n="dl" s={16} />Download CSV ({body.length} rows)</button></div>
      <div className="tbl-wrap" style={{ maxHeight: 520, overflowY: "auto" }}><table className="tbl"><thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{body.slice(0, 200).map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody></table></div>
      {!body.length && <div className="empty">No rows for this selection.</div>}</div>
  </>;
}

/* ---------- Haaraya administrator ---------- */
function AdminApp() {
  const { state } = useHL(); const v = state.route.view;
  const nav = [["overview", "Platform overview", "chart"], ["orgs", "Organisations", "school"], ["content", "Content access", "layers"], ["users", "Users & access", "key"], ["interop", "Interoperability", "plug"]];
  const ctx = <div><b>Haaraya Education</b><span>Platform administration</span></div>;
  return <AdultShell nav={nav} ctx={ctx}>
    {(v === "overview" || !nav.find(n => n[0] === v)) && <AOverview />}{v === "orgs" && <AOrgs />}{v === "content" && <AContent />}{v === "users" && <AUsers />}{v === "interop" && <AInterop />}
  </AdultShell>;
}
function AOverview() {
  const tot = k => Object.values(AD.ORG_STATS).reduce((s, o) => s + o[k], 0);
  const live = AD.SCHOOLS.filter(s => AD.ORG_STATS[s.id].active > 0);
  return <>
    <div className="ph-h"><div><h1>Platform overview</h1><p>All organisations · Term 1</p></div></div>
    <div className="kpis">
      <Kpi label="Organisations" value={AD.SCHOOLS.length} note={`${live.length} live · ${AD.SCHOOLS.length - live.length} onboarding`} />
      <Kpi label="Learners" value={tot("learners").toLocaleString()} note="enrolled" />
      <Kpi label="Teachers" value={tot("teachers")} />
      <Kpi label="Weekly active" value={AD.PLATFORM_WEEKLY[9]} note="+5% vs last week" dir="up" />
      <Kpi label="Books opened" value={AD.PLATFORM_BOOKS[9].toLocaleString()} note="this week" />
    </div>
    <div className="grid2">
      <div className="card"><div className="card-h"><div><h3>Weekly active learners</h3></div></div><LineChart labels={AD.TERM_WEEKS} series={[{ name: "Active", color: "#1A6E1A", data: AD.PLATFORM_WEEKLY }]} h={190} /></div>
      <div className="card"><div className="card-h"><div><h3>Books opened per week</h3></div></div><LineChart labels={AD.TERM_WEEKS} series={[{ name: "Books", color: "#1565C0", data: AD.PLATFORM_BOOKS }]} h={190} /></div>
    </div>
    <div className="grid2" style={{ marginTop: 16 }}>
      <div className="card"><div className="card-h"><div><h3>Outcomes: average level gain this term</h3><p>Levels gained per learner</p></div></div>
        <div className="hbars">{live.map(s => { const g = AD.ORG_STATS[s.id].avgGain; return <div className="r" key={s.id} style={{ gridTemplateColumns: "170px minmax(0,1fr) 44px" }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span><div className="tr"><i style={{ width: g / 1.5 * 100 + "%", background: "var(--forest)" }}></i></div><span className="v">+{g}</span></div>; })}</div></div>
      <div className="card"><div className="card-h"><div><h3>Active rate by organisation</h3><p>Learners active in the last 7 days</p></div></div>
        <div className="hbars">{live.map(s => { const a = AD.ORG_STATS[s.id].active; return <div className="r" key={s.id} style={{ gridTemplateColumns: "170px minmax(0,1fr) 44px" }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span><div className="tr"><i style={{ width: a + "%", background: a < 70 ? "var(--yellow-dk)" : "var(--forest)" }}></i></div><span className="v">{a}%</span></div>; })}</div></div>
    </div>
  </>;
}
function AOrgs() {
  const { state } = useHL();
  const [q, setQ] = React.useState(""); const [t, setT] = React.useState("all"); const [open, setOpen] = React.useState(null);
  const rows = AD.SCHOOLS.filter(s => (t === "all" || s.status === t) && (!q || (s.name + s.city).toLowerCase().includes(q.toLowerCase())));
  const o = open && AD.SCHOOLS.find(s => s.id === open); const os = o && AD.ORG_STATS[o.id];
  return <>
    <div className="ph-h"><div><h1>Organisations</h1><p>Schools, libraries, community groups and government cohorts</p></div></div>
    <div className="card"><div className="filters"><input className="hl-input s" placeholder="Search name or city" value={q} onChange={e => setQ(e.target.value)} /><div className="seg">{["all", "Active", "Pilot", "Onboarding"].map(k => <button key={k} className={t === k ? "on" : ""} onClick={() => setT(k)}>{k === "all" ? "All" : k}</button>)}</div></div>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Organisation</th><th>Type</th><th>Location</th><th className="num">Learners</th><th className="num">Teachers</th><th className="num">Active</th><th className="num">Collections</th><th>Status</th></tr></thead>
        <tbody>{rows.map(s => { const st = AD.ORG_STATS[s.id]; return <tr key={s.id} className="click" onClick={() => setOpen(s.id)}><td><b>{s.name}</b><div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700 }}>Since {s.since}</div></td><td>{s.type}</td><td>{s.city}</td><td className="num">{st.learners.toLocaleString()}</td><td className="num">{st.teachers}</td><td className="num">{st.active ? st.active + "%" : "—"}</td><td className="num">{state.orgCollections[s.id].length}</td><td><Status s={s.status === "Active" ? "complete" : s.status === "Pilot" ? "in_progress" : "not_started"} label={s.status} /></td></tr>; })}</tbody></table></div></div>
    {o && <Drawer onClose={() => setOpen(null)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 16 }}><div><h2 style={{ fontSize: 22, fontWeight: 900 }}>{o.name}</h2><p style={{ color: "var(--ink-soft)", fontWeight: 700, fontSize: 14 }}>{o.type} · {o.city} · since {o.since}</p></div><button className="x-btn" onClick={() => setOpen(null)}><Icon n="x" /></button></div>
      <div className="kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}><Kpi label="Learners" value={os.learners.toLocaleString()} /><Kpi label="Classes" value={os.classes} /><Kpi label="Active" value={os.active ? os.active + "%" : "—"} /></div>
      <div className="card"><div className="card-h"><h3>Assigned collections</h3></div>{state.orgCollections[o.id].length ? <div className="feed">{state.orgCollections[o.id].map(id => { const c = AD.COLLECTIONS.find(c => c.id === id); return <div key={id}><span><b>{c.name}</b> · {c.levels}</span><span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 700 }}>{c.titles} items</span></div>; })}</div> : <p className="note">No content assigned yet. Use Content access to grant collections.</p>}</div>
    </Drawer>}
  </>;
}
function AContent() {
  const { state, toggleCollection } = useHL();
  return <>
    <div className="ph-h"><div><h1>Content access</h1><p>Grant approved collections to each organisation. Authoring and publishing happen in Haaraya Studio.</p></div></div>
    <div className="card"><div className="tbl-wrap"><table className="tbl"><thead><tr><th>Organisation</th>{AD.COLLECTIONS.map(c => <th key={c.id} style={{ textAlign: "center", whiteSpace: "normal", minWidth: 96 }}>{c.name}<div style={{ fontWeight: 700, textTransform: "none", letterSpacing: 0 }}>{c.levels} · {c.titles}</div></th>)}</tr></thead>
      <tbody>{AD.SCHOOLS.map(s => <tr key={s.id}><td><b>{s.name}</b></td>{AD.COLLECTIONS.map(c => { const on = state.orgCollections[s.id].includes(c.id); return <td key={c.id} style={{ textAlign: "center" }}><button className={"toggle" + (on ? " on" : "")} onClick={() => toggleCollection(s.id, c.id)} aria-pressed={on} aria-label={`${c.name} for ${s.name}`}></button></td>; })}</tr>)}</tbody></table></div></div>
  </>;
}
function AUsers() {
  const { state, toggleUser, setUserRole } = useHL();
  const [q, setQ] = React.useState(""); const [r, setR] = React.useState("all");
  const rows = state.adminUsers.filter(u => (r === "all" || u.role === r) && (!q || (u.name + u.email + u.org).toLowerCase().includes(q.toLowerCase())));
  return <>
    <div className="ph-h"><div><h1>Users & access</h1><p>Roles control what each person can see. Learner accounts are managed by their school.</p></div></div>
    <div className="card"><div className="filters"><input className="hl-input s" placeholder="Search people or organisations" value={q} onChange={e => setQ(e.target.value)} /><select className="hl-select" value={r} onChange={e => setR(e.target.value)}><option value="all">All roles</option>{["Teacher", "School admin", "Parent", "Haaraya admin"].map(x => <option key={x}>{x}</option>)}</select></div>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Person</th><th>Organisation</th><th>Role</th><th>Access</th></tr></thead>
        <tbody>{rows.map(u => <tr key={u.id} style={u.active ? null : { opacity: .6 }}><td><span className="who"><Avatar name={u.name} size="sm" /><span>{u.name}<div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 600 }}>{u.email}</div></span></span></td><td>{u.org}</td>
          <td><select className="hl-select" value={u.role} onChange={e => setUserRole(u.id, e.target.value)}>{["Teacher", "School admin", "Parent", "Haaraya admin"].map(x => <option key={x}>{x}</option>)}</select></td>
          <td><div style={{ display: "flex", gap: 10, alignItems: "center" }}><button className={"toggle" + (u.active ? " on" : "")} onClick={() => toggleUser(u.id)} aria-pressed={u.active} aria-label="Access"></button><span style={{ fontSize: 13, fontWeight: 700 }}>{u.active ? "Enabled" : "Suspended"}</span></div></td></tr>)}</tbody></table></div>
      <div style={{ marginTop: 16 }}><div className="eyebrow" style={{ marginBottom: 8 }}>Role permissions</div>
        <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Permission</th><th>Learner</th><th>Parent</th><th>Teacher</th><th>School admin</th><th>Haaraya admin</th></tr></thead><tbody>
          {[["Read books & complete lessons", 1, 0, 0, 0, 0], ["View own children's progress", 0, 1, 0, 0, 0], ["Assign approved content to classes", 0, 0, 1, 1, 1], ["View class reports", 0, 0, 1, 1, 1], ["Manage teachers, classes, enrolment", 0, 0, 0, 1, 1], ["Grant collections to organisations", 0, 0, 0, 0, 1], ["Create, edit or publish content", 0, 0, 0, 0, 0]].map(([p, ...v]) => <tr key={p}><td>{p}</td>{v.map((x, i) => <td key={i}>{x ? <Icon n="check" s={16} w={3} /> : <span style={{ color: "var(--ink-soft)" }}>—</span>}</td>)}</tr>)}
        </tbody></table></div>
        <p style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700, marginTop: 8 }}>Content creation is limited to Haaraya Studio's internal authors.</p></div>
    </div>
  </>;
}
function AInterop() {
  const box = (t, s, on) => <div style={{ border: "1px solid " + (on ? "var(--forest)" : "var(--line-2)"), borderStyle: on ? "solid" : "dashed", background: on ? "var(--g-lt)" : "#fff", borderRadius: 10, padding: "12px 14px", minWidth: 0 }}><b style={{ fontSize: 14 }}>{t}</b><div style={{ fontSize: 12, color: "var(--ink-mid)", fontWeight: 600, marginTop: 2 }}>{s}</div></div>;
  const arrow = <span style={{ alignSelf: "center", color: "var(--ink-soft)", fontWeight: 900 }}>→</span>;
  const items = [
    ["Native Haaraya learning record", "Books, reading positions, lessons, attempts, scores and journeys. The primary source of truth.", "Active", true],
    ["SCORM 1.2 / SCORM 2004 export", "Package lessons from Haaraya Studio so a school LMS can launch them and receive completion and score.", "Planned · not built"],
    ["Launch compatible packages", "Open approved external packages inside Gemmanti and record completion.", "Planned · not built"],
    ["xAPI statements", "Send learning events to a learning record store, if a partner requires it.", "Under evaluation"],
    ["LTI 1.3 launch", "Let government or school LMS platforms launch Haaraya with single sign-on.", "Under evaluation"]
  ];
  return <>
    <div className="ph-h"><div><h1>Interoperability</h1><p>Concept only — Haaraya stays an independent platform; standards are optional bridges.</p></div></div>
    <div className="card" style={{ marginBottom: 16 }}><div className="card-h"><h3>How records flow</h3></div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1.2fr) auto minmax(0,1fr)", gap: 10 }}>
        {box("Haaraya Studio", "Internal authoring and publishing")}{arrow}{box("Gemmanti", "Native reading & learning record", true)}{arrow}{box("School / government LMS", "Optional SCORM, xAPI or LTI bridge")}
      </div></div>
    <div className="card"><div className="card-h"><h3>Standards</h3><span className="hl-status not_started">Not implemented in this prototype</span></div>
      {items.map(([t, d, s, on]) => <div className="int-row" key={t}><div><b>{t}</b><p>{d}</p></div><div style={{ display: "flex", gap: 12, alignItems: "center" }}><Status s={on ? "complete" : s.startsWith("Planned") ? "in_progress" : "not_started"} label={s} /><button className={"toggle" + (on ? " on" : "")} disabled aria-label={t}></button></div></div>)}
    </div>
  </>;
}
Object.assign(window, { ParentApp, SchoolApp, AdminApp });
