const LD = window.HL_DATA;
const JOURNEY_STEPS = [
  { k: "Read", label: "Reading material", sec: 1 },
  { k: "Guided", label: "Guided activity", sec: 2 },
  { k: "Practice", label: "Practice", sec: 3 },
  { k: "Check", label: "Assessment", sec: 4 },
  { k: "Done", label: "Completion", sec: 5 }
];
const L2_UNITS = [{ id: "L2-U1", title: "Short Vowel Sounds", done: true }, { id: "L2-U2", title: "Blends: st, sp, sn", done: true }, { id: "L2-U3", title: "Sight Words in Sentences", cur: true }, { id: "L2-U4", title: "Reading Sound Stories" }, { id: "L2-U5", title: "Sounds Together Review" }, { id: "L2-U6", title: "Level 2 Check" }];
/* What a pupil may open. Work ahead off: only what the teacher assigned (and a book already being read).
   Work ahead on: also any book and worksheet at the pupil's own level or below, never above. */
function hlMayRead(state, L, b) {
  const asg = hlAssignedFor(state, L).some(a => a.ref === b.id && (a.type === "book" || a.type === "worksheet"));
  return asg || !!L.reading[b.id] || (!!L.workAhead && b.l <= L.level);
}
function hlMayWorksheet(state, L, code) {
  const b = hlBook(code); if (!b || !HLWS.get(code)) return false;
  return hlAssignedFor(state, L).some(a => a.type === "worksheet" && a.ref === code) || !!(L.worksheets || {})[code] || (!!L.workAhead && b.l <= L.level);
}
function hlHasJourney(state, L) { return hlAssignedFor(state, L).some(a => a.type === "lesson") || Object.keys(L.lessons || {}).length > 0; }
function journeyFor(L) {
  if (L.level === 4) return LD.JOURNEYS[0];
  return { id: "J-L2-S", title: "Level 2 · Sounds Together", level: 2, strand: "Soundables", units: L2_UNITS };
}
function journeyPos(rec) {
  if (rec.status === "complete") return 5;
  if (rec.status === "not_started") return 0;
  return rec.step <= 1 ? 0 : Math.min(3, rec.step - 1);
}
function greeting() { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; }

function LevelPath({ level }) {
  return <div className="levelpath" aria-label={`Level ${level} of 15`}>
    {LD.LEVELS.map((lv, i) => <React.Fragment key={lv.n}>
      {i > 0 && <span className={"ln" + (lv.n <= level ? " done" : "")}></span>}
      <span className={"lv" + (lv.n < level ? " done" : lv.n === level ? " cur" : "") + (lv.odyssey ? " ody" : "")} title={lv.odyssey ? "Odyssey level" : ""}>{lv.n}</span>
    </React.Fragment>)}
  </div>;
}
function BookCard({ book, L, onOpen }) {
  const r = L.reading[book.id]; const done = L.booksDone.includes(book.id);
  return <button className="bookcard" onClick={() => onOpen(book)}>
    <Cover book={book} progress={r ? r.page / r.pages : null} done={done} />
    <b>{book.t}</b>
    <div className="m"><LevelTag l={book.l} /><StrandTag s={book.s} /></div>
  </button>;
}

function LearnerHome({ L }) {
  const { state, go } = useHL();
  const rec = hlLessonRec(L);
  const assigned = hlAssignedFor(state, L);
  const reading = Object.entries(L.reading).filter(([, r]) => !r.done).sort((a, b) => b[1].at.localeCompare(a[1].at));
  const cont = reading[0] && { book: hlBook(reading[0][0]), r: reading[0][1] };
  const lessonAssigned = assigned.find(a => a.type === "lesson" && a.ref === LD.LESSON_ID);
  const wsA = assigned.find(a => a.type === "worksheet" && hlWsRec(L, a.ref).status !== "reviewed") || assigned.find(a => a.type === "worksheet");
  const wsR = wsA && hlWsRec(L, wsA.ref); const wsW = wsA && HLWS.get(wsA.ref);
  const J = journeyFor(L);
  const shelf = LD.BOOKS.filter(b => hlMayRead(state, L, b)).sort((a, b) => b.l - a.l).slice(0, 14);
  const hasJ = hlHasJourney(state, L);
  const jpos = journeyPos(rec);
  const first = L.name.split(" ")[0];
  return <div className="kid-wrap">
    <div className="kid-hello">
      <div><h1>{greeting()}, {first}</h1><p>{wsR && (wsR.status === "not_started" || wsR.status === "in_progress") ? "You have a worksheet waiting for you." : wsR && wsR.status === "reviewed" && !wsR.seen ? "Your teacher has looked at your worksheet." : lessonAssigned && rec.status !== "complete" ? "You have a lesson waiting for you." : cont ? "Pick up where you left off." : "Find a new book to read."}</p></div>
      <button className="kid-levelcard" style={{ background: "#fff", textAlign: "left" }} onClick={() => go("me")}>
        <img src={`assets/stamp-l${L.level}.png`} alt="" />
        <div style={{ flex: 1 }}><b>Level {L.level}</b><Bar v={L.levelPct} cls="thick y" /><div className="meta">{L.levelPct}% of Level {L.level} complete</div></div>
      </button>
    </div>
    <div className="kid-hero">
      {wsA && <button className="kid-cont" onClick={() => go("worksheet", { code: wsA.ref })}>
        <div style={{ width: "100%" }}><Cover book={hlBook(wsA.ref)} /></div>
        <div>
          <div className="eyebrow">{wsR.status === "reviewed" ? (wsR.seen ? "Worksheet recorded" : "Your teacher has looked at it") : wsR.status === "handed_in" ? "Worksheet handed in" : wsR.status === "in_progress" ? "Continue your worksheet" : "New worksheet from your teacher"}</div>
          <h3>{wsW.title}</h3>
          <div className="ws-mini">{HLWS.SECS.map(s => <span key={s.k} className={wsAnswered(wsW, s.k, wsR) ? "on" : ""} title={s.n}>{s.i}</span>)}</div>
          <div className="sub">{wsR.status === "handed_in" || wsR.status === "reviewed" ? "Handed in" : "Word Focus · Read It Again · Think About It · Show What You Know"}</div>
          <span className={"hl-btn go " + (wsR.status === "handed_in" || wsR.status === "reviewed" ? "ghost" : "yellow")}>{wsR.status === "not_started" ? "Start" : wsR.status === "in_progress" ? "Resume" : "Open"}<Icon n="next" s={16} /></span>
        </div>
      </button>}
      {lessonAssigned && <button className="kid-cont" onClick={() => go("lesson")}>
        <div className="lesson-tile"><small>{LD.LESSON.unit}</small><b>1 2 3</b><small>Level {LD.LESSON.level}</small></div>
        <div>
          <div className="eyebrow">{rec.status === "complete" ? "Lesson complete" : rec.status === "in_progress" ? "Continue your lesson" : "New lesson from your teacher"}</div>
          <h3>{LD.LESSON.title}</h3>
          <Bar v={rec.status === "complete" ? 100 : jpos / 5 * 100} />
          <div className="sub">{rec.status === "complete" ? `Score ${hlLastAttempt(rec).score} of 6 · Passed` : rec.status === "in_progress" ? `Step ${jpos + 1} of 5 · ${JOURNEY_STEPS[jpos].label}` : `About ${LD.LESSON.mins} minutes`}</div>
          <span className={"hl-btn go " + (rec.status === "complete" ? "ghost" : "yellow")}>{rec.status === "complete" ? "Review lesson" : rec.status === "in_progress" ? "Resume" : "Start"}<Icon n="next" s={16} /></span>
        </div>
      </button>}
      {cont && <button className="kid-cont" onClick={() => go("reader", { id: cont.book.id })}>
        <div style={{ width: "100%" }}><Cover book={cont.book} progress={cont.r.page / cont.r.pages} /></div>
        <div>
          <div className="eyebrow">Continue reading</div>
          <h3>{cont.book.t}</h3>
          <Bar v={cont.r.page / cont.r.pages * 100} cls="y" />
          <div className="sub">Page {cont.r.page} of {cont.r.pages}</div>
          <span className="hl-btn go">Keep reading<Icon n="next" s={16} /></span>
        </div>
      </button>}
    </div>

    {assigned.length > 0 && <section className="kid-sec">
      <div className="kid-sec-h"><h2>From my teacher</h2></div>
      <div className="assign-list">{assigned.map(a => {
        const st = hlAssignStatus(L, a); const b = a.type === "book" && hlBook(a.ref);
        const open = () => a.type === "worksheet" ? go("worksheet", { code: a.ref }) : a.type === "lesson" ? (a.ref === LD.LESSON_ID ? go("lesson") : go("lessoninfo", { id: a.ref })) : a.type === "book" ? go("book", { id: a.ref }) : go("journey");
        return <button className="assign-row" key={a.id} onClick={open}>
          {a.type === "worksheet" ? <div className="thumb"><Cover book={hlBook(a.ref)} /></div> : b ? <div className="thumb"><Cover book={b} /></div> : <div className="ic"><Icon n={a.type === "lesson" ? "star" : "path"} s={22} /></div>}
          <div><b>{a.title}</b><span className="d">{a.type === "lesson" ? "Lesson" : a.type === "book" ? "Book" : a.type === "worksheet" ? "Worksheet" : "Learning journey"} · Due {new Date(a.due).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}{hlIsOverdue(a.due, st === "complete") && <> · <Overdue /></>}</span></div>
          <Status s={st} label={st === "complete" ? "Done" : null} />
        </button>;
      })}</div>
    </section>}

    {hasJ && <section className="kid-sec">
      <div className="kid-sec-h"><h2>My learning journey</h2><button className="hl-btn quiet" onClick={() => go("journey")}>Open journey<Icon n="next" s={16} /></button></div>
      <div className="unit" style={{ padding: "16px 18px" }}>
        <div className="eyebrow">{J.title}</div>
        <div className="steps" style={{ gridTemplateColumns: `repeat(${J.units.length},minmax(0,1fr))` }}>
          {J.units.map((u, i) => { const st = u.done ? "done" : (u.live ? (rec.status === "complete" ? "done" : "cur") : u.cur ? "cur" : ""); return <div key={u.id} className={"stepc " + st}><span className="k">Unit {i + 1}</span>{u.title}<span className="ico">{st === "done" ? "Done" : st === "cur" ? "Now" : "Up next"}</span></div>; })}
        </div>
      </div>
    </section>}

    <section className="kid-sec">
      <div className="kid-sec-h"><h2>My library</h2><button className="hl-btn quiet" onClick={() => go("library")}>See all books<Icon n="next" s={16} /></button></div>
      <div className="shelf row">{shelf.map(b => <BookCard key={b.id} book={b} L={L} onOpen={b => go("book", { id: b.id })} />)}</div>
    </section>

    <section className="kid-sec kid-two">
      <div>
        <div className="kid-sec-h"><h2>Reading progress</h2></div>
        <div className="stat-row">
          <div className="stat"><b>{L.booksDone.length}</b><span>Books finished</span></div>
          <div className="stat"><b>{Object.values(L.reading).filter(r => !r.done).length}</b><span>Reading now</span></div>
          <div className="stat"><b>{Object.values(L.lessons).filter(r => r.status === "complete").length + (L.level === 4 ? 2 : 2)}</b><span>Lessons passed</span></div>
        </div>
        <div style={{ marginTop: 18 }}><LevelPath level={L.level} /></div>
      </div>
      <div>
        <div className="kid-sec-h"><h2>Recent achievements</h2><button className="hl-btn quiet" onClick={() => go("me")}>All</button></div>
        <div className="ach-row">{L.achievements.slice().reverse().slice(0, 4).map(id => <Achievement key={id} id={id} fresh={id === "order-finder"} />)}</div>
      </div>
    </section>
  </div>;
}
function Achievement({ id, fresh, locked }) {
  const a = LD.ACHIEVEMENTS[id];
  return <div className={"ach" + (fresh ? " new" : "")} style={locked ? { opacity: .4, filter: "grayscale(1)" } : null}>
    {a.stamp ? <img src={a.stamp} alt="" /> : <span className="medal">{a.glyph}</span>}
    <b>{a.label}</b>
  </div>;
}

function Library({ L }) {
  const { go } = useHL();
  const [q, setQ] = React.useState(""); const [strand, setStrand] = React.useState("All"); const [lvl, setLvl] = React.useState(0); const [st, setSt] = React.useState("All");
  const { state } = useHL();
  const list = LD.BOOKS.filter(b => hlMayRead(state, L, b)).filter(b => (!q || b.t.toLowerCase().includes(q.toLowerCase())) && (strand === "All" || b.s === strand) && (!lvl || b.l === lvl) &&
    (st === "All" || (st === "Finished" ? L.booksDone.includes(b.id) : st === "Reading" ? (L.reading[b.id] && !L.reading[b.id].done && !L.booksDone.includes(b.id)) : !L.reading[b.id] && !L.booksDone.includes(b.id))));
  return <div className="kid-wrap">
    <h1>Library</h1>
    <div className="lib-bar">
      <label className="search"><Icon n="search" s={20} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by title" aria-label="Search books" /></label>
      <div className="chips">{["All", ...LD.STRANDS.map(s => s.id)].map(s => <button key={s} className={"chip" + (strand === s ? " on" : "")} onClick={() => setStrand(s)}>{s !== "All" && <span className="dot" style={{ background: strandOf(s).color }}></span>}{s}</button>)}</div>
    </div>
    <div className="lvl-strip">
      <button className={"chip" + (!lvl ? " on" : "")} onClick={() => setLvl(0)}>All levels</button>
      {LD.LEVELS.map(l => <button key={l.n} className={"chip" + (lvl === l.n ? " on" : "")} onClick={() => setLvl(l.n)} style={l.odyssey && lvl !== l.n ? { borderStyle: "dashed" } : null}>L{l.n}</button>)}
    </div>
    <div className="chips" style={{ marginTop: 8 }}>{["All", "Reading", "Finished", "Not started"].map(s => <button key={s} className={"chip" + (st === s ? " on" : "")} onClick={() => setSt(s)}>{s}</button>)}</div>
    <div className="lib-count">{list.length} {list.length === 1 ? "book" : "books"}{lvl >= 13 ? " · Odyssey" : ""}</div>
    <p className="note" style={{ marginBottom: 14 }}>{L.workAhead ? `Your teacher lets you work ahead. You can choose any book up to Level ${L.level}.` : "Your teacher chooses your books. Ask your teacher if you want to read more."}</p>
    {list.length ? <div className="shelf">{list.map(b => <BookCard key={b.id} book={b} L={L} onOpen={b => go("book", { id: b.id })} />)}</div>
      : <div className="empty">No books match. Try another level or clear the search.</div>}
  </div>;
}

function BookDetail({ L, id }) {
  const { state, go } = useHL();
  const b = hlBook(id); if (!b) return null;
  const r = L.reading[b.id]; const done = L.booksDone.includes(b.id);
  const asg = hlAssignedFor(state, L).find(a => a.type === "book" && a.ref === b.id);
  const lv = LD.LEVELS[b.l - 1];
  return <div className="kid-wrap">
    <button className="back" onClick={() => go("library")}><Icon n="back" />Library</button>
    <div className="bk">
      <Cover book={b} progress={r ? r.page / r.pages : null} done={done} />
      <div>
        <div className="eyebrow">{lv.odyssey ? "Odyssey" : lv.band} · {b.k}</div>
        <h1>{b.t}</h1>
        <div className="facts"><LevelTag l={b.l} /><StrandTag s={b.s} /><span className="hl-tag" style={{ background: "var(--sand)" }}>{b.pages} pages</span>{asg && <span className="hl-tag" style={{ background: "var(--amber-bg)", color: "var(--amber)" }}>From my teacher</span>}</div>
        {done ? <Status s="complete" label="You finished this book" /> : r ? <div style={{ maxWidth: 360 }}><Bar v={r.page / r.pages * 100} cls="thick y" /><p style={{ fontWeight: 700, color: "var(--ink-mid)", marginTop: 8 }}>You are on page {r.page} of {r.pages}</p></div> : <Status s="not_started" label="Not started yet" />}
        <div className="actions">
          <button className="hl-btn big" onClick={() => go("reader", { id: b.id, restart: done })}><Icon n="play" s={18} />{done ? "Read again" : r ? `Resume from page ${r.page}` : "Start reading"}</button>
          {r && !done && <button className="hl-btn big ghost" onClick={() => go("reader", { id: b.id, restart: true })}>Start over</button>}
          {hlMayWorksheet(state, L, b.id) && <button className="hl-btn big yellow" onClick={() => go("worksheet", { code: b.id })}><Icon n="sheet" s={18} />{hlWsRec(L, b.id).status === "not_started" ? "Do the worksheet" : hlWsRec(L, b.id).status === "in_progress" ? "Continue the worksheet" : "My worksheet"}</button>}
        </div>
      </div>
    </div>
  </div>;
}

function Reader({ L, id, restart }) {
  const { go, readSave, readFinish } = useHL();
  const b = hlBook(id); const r = L.reading[b.id];
  const [p, setP] = React.useState(restart || !r ? 0 : r.page);
  const end = b.pages + 1;
  React.useEffect(() => { if (p > 0 && p <= b.pages) readSave(L.id, b.id, p, b.pages); }, [p]);
  React.useEffect(() => { const k = e => { if (e.key === "ArrowRight") setP(x => Math.min(end, x + 1)); if (e.key === "ArrowLeft") setP(x => Math.max(0, x - 1)); if (e.key === "Escape") go("book", { id: b.id }); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  const [pg, setPg] = React.useState(null); const [err, setErr] = React.useState(false);
  React.useEffect(() => { if (b.live) HLWS.pages(b.id).then(setPg).catch(() => setErr(true)); }, []);
  const cur = pg && pg[p - 1];
  const page = p === 0 ? <Cover book={b} />
    : p === end ? <div className="ph" style={{ background: "#fff", fontFamily: "var(--read)", fontSize: 22, color: "var(--ink)" }}><img src={`assets/stamp-l${Math.min(12, b.l)}.png`} alt="" style={{ width: 96, height: 96, objectFit: "contain" }} /><b style={{ fontSize: 30 }}>The End</b><span style={{ fontSize: 17, color: "var(--ink-mid)" }}>{b.t}</span><button className="hl-btn big" onClick={() => { readFinish(L.id, b); go("book", { id: b.id }); }}><Icon n="check" />I finished this book</button></div>
    : cur ? <div className="rd-live"><img src={cur.img} alt={`Page ${p}`} /><p>{cur.text}</p></div>
    : <div className="ph"><b>Page {p}</b>{err ? "This page could not load. Check the connection and try again." : "Loading page…"}</div>;
  return <div className="reader" role="dialog" aria-label={b.t}>
    <div className="reader-top"><button className="hl-btn ghost sm" onClick={() => go("book", { id: b.id })}><Icon n="x" s={16} />Close</button><b>{b.t}</b><span style={{ marginLeft: "auto", fontSize: 13, opacity: .75, fontWeight: 700 }}>Your place is saved</span></div>
    <div className="reader-stage">
      <button className="reader-nav p" disabled={p === 0} onClick={() => setP(p - 1)} aria-label="Previous page"><Icon n="back" s={26} /></button>
      <div className="reader-page">{page}</div>
      <button className="reader-nav n" disabled={p === end} onClick={() => setP(p + 1)} aria-label="Next page"><Icon n="next" s={26} /></button>
    </div>
    <div className="reader-foot"><span>{p === 0 ? "Cover" : p === end ? "End" : `Page ${p} of ${b.pages}`}</span><Bar v={p / end * 100} /></div>
  </div>;
}

function Journey({ L }) {
  const { go } = useHL();
  const rec = hlLessonRec(L); const J = journeyFor(L); const pos = journeyPos(rec);
  const doneUnits = J.units.filter(u => u.done || (u.live && rec.status === "complete")).length;
  return <div className="kid-wrap">
    <div className="eyebrow">{J.strand} · Level {J.level}</div>
    <h1 style={{ margin: "6px 0 24px" }}>{J.title.split(" · ")[1]}</h1>
    <div className="jr">
      <div className="jr-units">{J.units.map((u, i) => {
        const live = u.live; const cur = live ? rec.status !== "complete" : u.cur; const done = u.done || (live && rec.status === "complete");
        return <div key={u.id} className={"unit" + (done ? " done" : cur ? " cur" : " locked")}>
          <div className="unit-h"><span className="n">{done ? <Icon n="check" s={18} w={3} /> : i + 1}</span><div style={{ flex: 1 }}><div className="eyebrow">Unit {i + 1}</div><h3>{u.title}</h3></div>
            {live && <button className={"hl-btn " + (done ? "ghost" : "yellow")} onClick={() => go("lesson")}>{done ? "Review" : rec.status === "in_progress" ? "Resume" : "Start"}</button>}
            {!live && cur && <span className="hl-status in_progress">Now</span>}
          </div>
          {(cur || (live && done)) && <div className="steps">{JOURNEY_STEPS.map((s, k) => {
            const st = live ? (k < pos || (k === 4 && done) ? "done" : k === pos ? "cur" : "") : k < 2 ? "done" : k === 2 ? "cur" : "";
            return <button key={s.k} className={"stepc " + st} onClick={() => live && go("lesson", { jump: s.sec })} disabled={!live} style={{ cursor: live ? "pointer" : "default" }}>
              <span className="k">{k + 1} · {s.k}</span>{s.label}<span className="ico">{st === "done" ? "Done" : st === "cur" ? "Now" : "Up next"}</span></button>;
          })}</div>}
          {!live && cur && <p className="note" style={{ marginTop: 12 }}>Demo: the playable lesson is Amara's Level 4 “Steps in Order”.</p>}
        </div>;
      })}</div>
      <aside className="unit" style={{ position: "sticky", top: 84 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}><img src={`assets/stamp-l${J.level}.png`} alt="" style={{ width: 64, height: 64, objectFit: "contain" }} /><div><b style={{ fontSize: 18, fontFamily: "var(--read)" }}>Level {J.level}</b><div style={{ fontSize: 14, color: "var(--ink-soft)", fontWeight: 700 }}>{doneUnits} of {J.units.length} units done</div></div></div>
        <div style={{ margin: "14px 0 20px" }}><Bar v={doneUnits / J.units.length * 100} cls="thick" /></div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>All levels</div>
        <LevelPath level={L.level} />
        <p style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600, marginTop: 8 }}>Levels 13–15 are Odyssey levels.</p>
      </aside>
    </div>
  </div>;
}

function MyProgress({ L }) {
  const { go } = useHL();
  const rec = hlLessonRec(L);
  const allAch = Object.keys(LD.ACHIEVEMENTS);
  return <div className="kid-wrap">
    <h1>My reading</h1>
    <section className="kid-sec" style={{ marginTop: 24 }}>
      <div className="stat-row">
        <div className="stat"><b>L{L.level}</b><span>{L.levelPct}% of level done</span></div>
        <div className="stat"><b>{L.booksDone.length}</b><span>Books finished</span></div>
        <div className="stat"><b>{L.achievements.length}</b><span>Achievements</span></div>
      </div>
      <div style={{ marginTop: 18 }}><LevelPath level={L.level} /></div>
    </section>
    <section className="kid-sec"><div className="kid-sec-h"><h2>Achievements</h2></div>
      <div className="ach-row">{allAch.map(id => <Achievement key={id} id={id} locked={!L.achievements.includes(id)} />)}</div></section>
    {rec.attempts.length > 0 && <section className="kid-sec"><div className="kid-sec-h"><h2>My checks</h2></div>
      <div className="assign-list">{rec.attempts.map((a, i) => <div key={i} className="assign-row" style={{ cursor: "default" }}><div className="ic">{a.score}/6</div><div><b>{LD.LESSON.title} · try {i + 1}</b><span className="d">{a.date}</span></div><Status s={a.pass ? "complete" : "fail"} label={a.pass ? "Passed" : "Try again"} /></div>)}</div></section>}
    <section className="kid-sec"><div className="kid-sec-h"><h2>My worksheets</h2></div>
      <div className="assign-list">{Object.keys(L.worksheets || {}).filter(c => HLWS.get(c)).map(c => { const r = L.worksheets[c]; return <button key={c} className="assign-row" onClick={() => go("worksheet", { code: c })}><div className="thumb"><Cover book={hlBook(c)} /></div><div><b>{HLWS.get(c).title}</b><span className="d">{r.status === "reviewed" ? "Your teacher has looked at it" : r.status === "handed_in" ? "Handed in" : "Not finished yet"}</span></div><Status s={r.status === "reviewed" || r.status === "handed_in" ? "complete" : "in_progress"} label={r.status === "reviewed" ? "Looked at" : r.status === "handed_in" ? "Handed in" : null} /></button>; })}
        {!Object.keys(L.worksheets || {}).length && <div className="empty">Finish a book, then try its worksheet.</div>}</div></section>
    <section className="kid-sec"><div className="kid-sec-h"><h2>Books I finished</h2></div>
      <div className="shelf">{L.booksDone.map(hlBook).filter(Boolean).map(b => <BookCard key={b.id} book={b} L={L} onOpen={b => go("book", { id: b.id })} />)}</div></section>
  </div>;
}
function LessonInfo({ id }) {
  const { go } = useHL(); const l = LD.LESSON_CATALOG.find(x => x.id === id) || {};
  return <div className="kid-wrap"><button className="back" onClick={() => go("home")}><Icon n="back" />Home</button>
    <div className="eyebrow" style={{ marginTop: 12 }}>Level {l.level} · {l.strand}</div><h1 style={{ margin: "6px 0 16px" }}>{l.title}</h1>
    <p className="note" style={{ maxWidth: 520 }}>This prototype includes one playable lesson: “Steps in Order” (Level 4). Other lessons appear here once Haaraya Studio publishes them.</p></div>;
}

const KID_NAV_ALL = [["home", "Home", "home"], ["library", "Library", "book"], ["journey", "Journey", "path"], ["me", "My reading", "star"]];
/* Demo: choose which pupil of the Haaraya Demo Class to be. */
function PupilPicker() {
  const { state, setRole } = useHL();
  const pupils = Object.values(state.learners).filter(l => l.classId === "p3i").sort((a, b) => a.level - b.level);
  return <><TopNav items={null} />
    <main className="kid"><div className="kid-wrap">
      <h1>Choose a pupil</h1>
      <p className="note" style={{ margin: "6px 0 22px", maxWidth: 620 }}>Haaraya Demo Class has one pupil at each level, from Level 1 to Level 12. Pick a pupil to read their book and do their worksheet. You can switch pupil at any time from the top right.</p>
      <div className="pick-grid">{pupils.map(l => { const b = LD.BOOKS.find(x => x.l === l.level); return <button key={l.id} className="pick-card" onClick={() => setRole("learner", l.id)}>
        <div className="pick-cover"><Cover book={b} /></div>
        <div><LevelTag l={l.level} /><b>{l.name}</b><span>{b ? b.t : ""}</span></div></button>; })}</div>
    </div></main></>;
}
function LearnerApp() {
  const { state, go } = useHL();
  const L = state.learners[state.personaId]; const r = state.route;
  if (r.view === "pick" || !L) return <PupilPicker />;
  const KID_NAV = KID_NAV_ALL.filter(n => n[0] !== "journey" || hlHasJourney(state, L));
  const navOn = { book: "library", reader: "library", lessoninfo: "home", lesson: "journey", worksheet: "home" }[r.view] || r.view;
  return <>
    <TopNav items={KID_NAV} on={navOn} />
    <main className="kid">
      {r.view === "home" && <LearnerHome L={L} />}
      {r.view === "library" && <Library L={L} />}
      {(r.view === "book" || r.view === "reader") && <BookDetail L={L} id={r.id} />}
      {r.view === "journey" && <Journey L={L} />}
      {r.view === "me" && <MyProgress L={L} />}
      {r.view === "lessoninfo" && <LessonInfo id={r.id} />}
      {r.view === "worksheet" && <WorksheetPlayer key={r.code} L={L} code={r.code} />}
      {r.view === "lesson" && <><Journey L={L} /><LessonPlayer L={L} jump={r.jump} /></>}
    </main>
    {r.view === "reader" && <Reader L={L} id={r.id} restart={r.restart} />}
    <nav className="mobile-tabs">{KID_NAV.map(([v, l, i]) => <button key={v} className={navOn === v ? "on" : ""} onClick={() => go(v)}><Icon n={i} s={22} />{l}</button>)}</nav>
  </>;
}
/* Back to the main Haaraya Literacy site: its home page and its full library. */
function HaarayaLinks() {
  const base = "../Haaraya%20Home.html";
  return <div className="hl-outlinks" aria-label="Haaraya Literacy">
    <a className="hl-btn ghost sm" href={base + "#home"} title="Haaraya Literacy home"><Icon n="home" s={16} /><span>Home</span></a>
    <a className="hl-btn ghost sm" href={base + "#library"} title="Haaraya Literacy library"><Icon n="book" s={16} /><span>Library</span></a>
  </div>;
}
function TopNav({ items, on }) {
  const { go } = useHL();
  return <header className="hl-top">
    <button className="hl-brand" onClick={() => items && go(items[0][0])} aria-label="Gemmanti home"><img className="hl-logo" src="assets/logo-gemmanti.png" alt="Gemmanti" /></button>
    <nav className="hl-topnav">{items && items.map(([v, l, i]) => <button key={v} className={on === v ? "on" : ""} onClick={() => go(v)}><Icon n={i} />{l}</button>)}</nav>
    {!items && <div className="hl-spacer"></div>}
    <HaarayaLinks />
    <RoleSwitcher />
  </header>;
}
Object.assign(window, { HaarayaLinks, PupilPicker, hlMayRead, hlMayWorksheet, LearnerApp, TopNav, LevelPath, journeyPos, JOURNEY_STEPS });
