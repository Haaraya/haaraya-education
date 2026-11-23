/* Gemmanti — teacher worksheet records: class grid, per-child review, teacher guide. */
const WT = window.HLWS;
const RATE_ORDER = ["NY", "D", "S", "B"];
function RateChip({ r, sm }) {
  if (!r) return <span className="rate blank" title="Not yet recorded">&nbsp;</span>;
  return <span className={"rate r-" + (r === "-" ? "x" : r) + (sm ? " sm" : "")} title={WT.RATINGS[r]}>{r}</span>;
}
function HelpChip({ h }) { return h ? <span className="rate help" title={WT.HELP[h]}>{h}</span> : <span className="rate blank">&nbsp;</span>; }
const WS_STATUS = { not_started: ["not_started", "Not started"], in_progress: ["in_progress", "Working on it"], handed_in: ["handed", "Handed in"], reviewed: ["complete", "Recorded"] };
function WsStatus({ s }) { const [c, l] = WS_STATUS[s] || WS_STATUS.not_started; return <span className={"hl-status " + c}>{l}</span>; }

function TWorksheets({ cls, learners, openAssign, showScores }) {
  const { state } = useHL();
  const asg = state.assignments.filter(a => a.classId === cls.id && a.type === "worksheet");
  const toRecord = ref => learners.filter(l => hlWsRec(l, ref).status === "handed_in").length;
  const firstDue = asg.find(x => toRecord(x.ref) > 0);
  const [code, setCode] = React.useState(firstDue ? firstDue.ref : asg[0] ? asg[0].ref : WT.list()[0].code);
  const [open, setOpen] = React.useState(null); const [guide, setGuide] = React.useState(false); const [f, setF] = React.useState("all");
  const w = WT.get(code); const a = asg.find(x => x.ref === code);
  const tgt = learners.filter(l => !a || a.to === "all" || a.to.includes(l.id)).sort((x, y) => x.name.localeCompare(y.name));
  const recs = tgt.map(l => [l, hlWsRec(l, code)]);
  const cnt = s => recs.filter(([, r]) => r.status === s).length;
  const rows = recs.filter(([, r]) => f === "all" || r.status === f);
  const dist = k => RATE_ORDER.map(r => [r, recs.filter(([, x]) => x.ratings && x.ratings[k] === r).length]);
  return <>
    <div className="ph-h"><div><h1>Worksheets</h1><p>{cls.name} · ratings follow the Haaraya teacher guide</p></div>
      <div className="acts"><a className="hl-btn ghost" href={"../Haaraya%20Print.html?book=" + encodeURIComponent(code)} target="_blank" rel="noopener"><Icon n="dl" s={16} />Print book</a><button className="hl-btn ghost" onClick={() => setGuide(true)}><Icon n="book" s={16} />Teacher guide</button>{openAssign && <button className="hl-btn" onClick={() => openAssign({ type: "worksheet" })}><Icon n="plus" s={16} />Assign a worksheet</button>}</div></div>
    <div className="filters">
      <select className="hl-select" value={code} onChange={e => setCode(e.target.value)} aria-label="Worksheet">
        {asg.length > 0 && <optgroup label="Assigned to this class">{asg.map(x => <option key={x.id} value={x.ref}>L{WT.get(x.ref).level} · {WT.get(x.ref).title}{toRecord(x.ref) ? ` · ${toRecord(x.ref)} to record` : ""}</option>)}</optgroup>}
        <optgroup label="All worksheets">{WT.list().map(x => <option key={x.code} value={x.code}>L{x.level} · {x.title}</option>)}</optgroup></select>
      <div className="seg">{[["all", "All", tgt.length], ["handed_in", "To record", cnt("handed_in")], ["reviewed", "Recorded", cnt("reviewed")], ["in_progress", "Working", cnt("in_progress")], ["not_started", "Not started", tgt.length - cnt("handed_in") - cnt("reviewed") - cnt("in_progress")]].map(([k, l, n]) => <button key={k} className={f === k ? "on" : ""} onClick={() => setF(k)}>{l} · {n}</button>)}</div>
    </div>
    <div className="card ws-sum">
      <div className="ws-sum-b"><div className="th"><Cover book={hlBook(code)} /></div><div><div className="eyebrow">Level {w.level} · {w.strand} · {w.code}</div><h3>{w.title}</h3><p>{w.blurb}</p>{a ? <p className="meta">Due {new Date(a.due).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {a.to === "all" ? "whole class" : a.to.length === 1 && state.learners[a.to[0]] ? state.learners[a.to[0]].name : a.to.length + " learners"}</p> : !window.HL_LIVE_ON && <p className="meta">Not assigned to this class</p>}</div></div>
      <div className="ws-dist">{WT.SECS.map(s => <div key={s.k}><span>{s.n}</span><div className="ws-dist-r">{dist(s.k).map(([r, n]) => <span key={r} className={"ws-dist-c r-" + r} title={`${WT.RATINGS[r]}: ${n}`}><b>{r}</b>{n}</span>)}</div></div>)}</div>
    </div>
    <div className="card" style={{ padding: 0 }}><div className="tbl-wrap"><table className="tbl ws-grid"><thead><tr><th>Learner</th><th>Status</th>{WT.SECS.map(s => <th key={s.k} className="c" title={s.n}>{s.n.split(" ").map(x => x[0]).join("")}</th>)}<th className="c" title="Overall help">Help</th>{showScores && <th className="c">Score</th>}<th></th></tr></thead>
      <tbody>{rows.map(([l, r]) => <tr key={l.id} className={r.status === "handed_in" ? "live" : ""}>
        <td><button className="who linkish" onClick={() => setOpen(l.id)}><Avatar name={l.name} size="sm" />{l.name}</button></td>
        <td><WsStatus s={r.status} /></td>
        {WT.SECS.map(s => <td key={s.k} className="c"><RateChip r={r.ratings && r.ratings[s.k]} /></td>)}
        <td className="c"><HelpChip h={r.help} /></td>{showScores && <td className="c num">{hlScoreText(hlWsScore(r, code))}</td>}
        <td className="c"><button className={"hl-btn sm " + (r.status === "handed_in" ? "" : "ghost")} onClick={() => setOpen(l.id)}>{r.status === "handed_in" ? "Record" : r.status === "reviewed" ? "Open" : "Record"}</button></td></tr>)}
        {!rows.length && <tr><td colSpan={showScores ? 9 : 8}><div className="empty" style={{ border: 0 }}>No learners here.</div></td></tr>}</tbody></table></div>
      <p className="ws-legend">WF Word Focus · RIA Read It Again · TAI Think About It · SWYK Show What You Know · NY Not Yet · D Developing · S Secure · B Beyond · – not observed · A absent · blank not yet recorded · Help: M Modelled, P Prompted, I Independent</p></div>
    {open && <WsReview L={state.learners[open]} code={code} onClose={() => setOpen(null)} />}
    {guide && <WsGuide w={w} onClose={() => setGuide(false)} />}
  </>;
}

function RubricPick({ w, k, val, set, disabled, challenge }) {
  const desc = w.r[k];
  const opts = [["NY", desc[0]], ["D", desc[1]], ["S", desc[2]]];
  if (k === "sw") opts.push(["B", "Challenge: " + w.r.b]);
  return <div className={"rub" + (disabled ? " off" : "")}>
    <div className="rub-g" style={{ gridTemplateColumns: `repeat(${opts.length},minmax(0,1fr))` }}>{opts.map(([r, d]) => <button key={r} disabled={disabled} className={"rub-c r-" + r + (val === r ? " on" : "")} onClick={() => set(val === r ? null : r)} aria-pressed={val === r}>
      <span className="rub-t"><RateChip r={r} sm />{WT.RATINGS[r]}</span><span className="rub-d">{d}</span>{r === "B" && !challenge && <span className="rub-n">Challenge not attempted</span>}</button>)}</div>
    <div className="rub-x">{["-", "A"].map(r => <button key={r} disabled={disabled} className={"chip" + (val === r ? " on" : "")} onClick={() => set(val === r ? null : r)}>{r} {WT.RATINGS[r]}</button>)}{k !== "sw" && <span className="ws-hint">Beyond is not possible for this section.</span>}</div>
  </div>;
}
function WsReview({ L, code, onClose }) {
  const { wsReview } = useHL();
  const w = WT.get(code); const rec = hlWsRec(L, code);
  const [rt, setRt] = React.useState(Object.assign({}, rec.ratings || {}));
  const [help, setHelp] = React.useState(rec.help || null); const [note, setNote] = React.useState(rec.note || "");
  const [heard, setHeard] = React.useState(!!(rec.ratings && rec.ratings.ra && rec.ratings.ra !== "-"));
  const [keys, setKeys] = React.useState(true);
  const set = (k, v) => setRt(Object.assign({}, rt, { [k]: v }));
  const recorded = Object.keys(window.HL_AUDIO).some(k => k.startsWith(`${L.id}|${code}|`));
  const marks = rt.marks || {};
  const markCtx = { marks, edit: true, setMark: (key, v) => { const m = { ...marks }; if (v == null) delete m[key]; else m[key] = v; setRt(Object.assign({}, rt, { marks: m })); } };
  const sc = hlWsScore({ ...rec, ratings: rt, status: rec.status === "not_started" ? "in_progress" : rec.status }, code);
  return <Drawer onClose={onClose}><WsMarkCtx.Provider value={markCtx}><div className="ws-rev">
    <div className="ws-rev-h"><Avatar name={L.name} size="lg" /><div style={{ flex: 1 }}><h2>{L.name}</h2><p>{w.title} · L{w.level} · <WsStatus s={rec.status} />{rec.handedAt || rec.at ? ` · ${rec.status === "reviewed" ? "recorded " + (rec.reviewedAt || "") : "handed in " + (rec.handedAt || rec.at)}` : ""}</p></div><button className="x-btn" onClick={onClose} aria-label="Close"><Icon n="x" /></button></div>
    <div className="note">Record only what you observed. Rate from the sheet, except Read It Again, which you rate only after hearing this child read alone. An answer given together by a group is not evidence for any one child. Ticks and crosses are a first check of the closed items — your judgement decides.</div>
    <div className="ws-score-bar"><div><span className="eyebrow">Score</span><b>{sc && sc.max ? `${hlHalf(sc.pts)} / ${sc.max}` : "—"}</b>{sc && sc.max ? <em>{sc.pct}%</em> : null}</div>
      <p>{sc && sc.toMark ? `${sc.toMark} written ${sc.toMark === 1 ? "answer" : "answers"} still to mark. Use Right, Partly or Not yet beside each one.` : "Every answer is marked. Right counts 1, Partly ½, Not yet 0."}</p></div>
    <label className="ws-tog"><input type="checkbox" checked={keys} onChange={e => setKeys(e.target.checked)} />Show answers from the guide</label>
    {rec.status === "not_started" && <div className="empty">{L.name.split(" ")[0]} has not opened this worksheet. You can still record what you observed in a guided session.</div>}
    {WT.SECS.map(s => { const sg = WT.suggest(w, s.k, rec.resp || {}, marks);
      return <section className="ws-rev-s" key={s.k}>
        <div className="ws-rev-sh"><h3>{s.i}. {s.n}</h3><span className="ws-crit">Success criterion: {w.g.crit[s.k]}</span></div>
        <div className="ws-rev-work">
          {s.k === "ra" ? <>
            <ReadAgain w={w} L={L} rec={rec} ro teacher setResp={() => {}} onReads={() => {}} />
            <div className="ws-key"><b>Listen for</b><span>{w.g.listen}</span></div></>
            : <WorksheetSection w={w} k={s.k} L={L} rec={{ resp: rec.resp || {} }} ro teacher showFb showKey={keys} />}
        </div>
        <div className="ws-rate">
          {s.k === "ra" ? <label className="ws-tog strong"><input type="checkbox" checked={heard} onChange={e => setHeard(e.target.checked)} />I heard {L.name.split(" ")[0]} read this alone{recorded ? " (or listened to the recording)" : ""}</label>
            : sg.r ? <div className="ws-sugg"><span>Suggested from the marks: <RateChip r={sg.r} sm /> <b>{WT.RATINGS[sg.r]}</b> — {sg.note}</span>{rt[s.k] !== sg.r && <button className="hl-btn quiet sm" onClick={() => set(s.k, sg.r)}>Use</button>}</div>
            : <div className="ws-sugg"><span>{sg.note}</span></div>}
          <RubricPick w={w} k={s.k} val={rt[s.k]} set={v => set(s.k, v)} disabled={s.k === "ra" && !heard} challenge={!!sg.challenge} />
          {(rt[s.k] === "NY" || rt[s.k] === "D") && <div className="ws-next"><b>If a child struggles</b><span>{w.g.next[s.k]}</span></div>}
        </div>
      </section>; })}
    <section className="ws-rev-s">
      <div className="ws-rev-sh"><h3>Overall help</h3><span className="ws-crit">The most help you actually gave across the worksheet. Help is never an ability level.</span></div>
      <div className="seg">{Object.entries(WT.HELP).map(([k, l]) => <button key={k} className={help === k ? "on" : ""} onClick={() => setHelp(help === k ? null : k)}>{k} · {l}</button>)}</div>
      {w.level <= 2 && <p className="ws-hint" style={{ marginTop: 8 }}>At this level, Independent means you gave the spoken instruction and the child responded without further help.</p>}
    </section>
    <section className="ws-rev-s">
      {window.HL_LIVE_ON
        ? <div className="ws-rev-sh"><h3>Teacher’s note</h3><span className="ws-crit">Staff only. Describe the work, never the child.</span></div>
        : <div className="ws-rev-sh"><h3>A note for {L.name.split(" ")[0]}</h3><span className="ws-crit">Shown to the child and their family. Describe the work, never the child.</span></div>}
      <textarea className="hl-input" rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder={window.HL_LIVE_ON ? "e.g. Sorted every sun and rain word. Needed a prompt to let her voice drop when it goes dark." : "e.g. You sorted every sun and rain word. Next time, let your voice drop when it goes dark."}></textarea>
    </section>
    <div className="ws-rev-f"><button className="hl-btn ghost" onClick={onClose}>Cancel</button><button className="hl-btn" onClick={() => { const clean = {}; Object.keys(rt).forEach(k => { if (rt[k]) clean[k] = rt[k]; }); if (sc) clean.score = { got: sc.pts, total: sc.max, toMark: sc.toMark || 0 }; wsReview(L.id, code, { ratings: clean, help, note }); onClose(); }}><Icon n="check" s={16} />Save record</button></div>
  </div></WsMarkCtx.Provider></Drawer>;
}

function WsGuide({ w, onClose }) {
  const items = WT.SECS.filter(s => s.k !== "ra").flatMap(s => WT.secItems(w, s.k).filter(it => it.t !== "text").map((it, i) => [s, it]));
  return <Modal title={`Teacher guide · ${w.title}`} onClose={onClose} wide>
    <div className="guide">
      <p className="eyebrow">Level {w.level} · {w.tafiya} · {w.band} band · {w.strand} · {w.focus}</p>
      <div className="guide-g"><div><h4>Preparation</h4><p>{w.g.prep}</p></div><div><h4>Delivering the worksheet</h4><p>{w.g.deliv}</p></div><div><h4>Support</h4><p>{w.g.support}</p></div><div><h4>Read It Again: what to listen for</h4><p>{w.g.listen}</p></div></div>
      <h4>Answers</h4>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Item</th><th>Answer</th><th>Answer type</th></tr></thead><tbody>{items.map(([s, it]) => <tr key={it.id}><td><b>{it.challenge ? "Challenge" : s.n}</b><div className="ws-hint">{it.q}</div></td><td>{it.key}</td><td style={{ whiteSpace: "nowrap" }}>{it.at}</td></tr>)}</tbody></table></div>
      <h4>What each rating looks like</h4>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Section</th><th>Not Yet</th><th>Developing</th><th>Secure</th><th>Beyond</th></tr></thead><tbody>{WT.SECS.map(s => <tr key={s.k}><td><b>{s.n}</b></td>{w.r[s.k].map((d, i) => <td key={i}>{d}</td>)}<td>{s.k === "sw" ? "Through the Challenge: " + w.r.b : "Not possible"}</td></tr>)}</tbody></table></div>
      <h4>Linking to the lesson</h4>
      <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Section</th><th>Lesson success criterion</th><th>If a child struggles</th></tr></thead><tbody>{WT.SECS.map(s => <tr key={s.k}><td><b>{s.n}</b></td><td>{w.g.crit[s.k]}</td><td>{w.g.next[s.k]}</td></tr>)}</tbody></table></div>
      <div className="note" style={{ marginTop: 14 }}>Judge accuracy, fluency and help separately. Hesitation lowers only the Read It Again rating. Never tell a child a decodable word: What sounds do you see? Blend them.</div>
    </div>
  </Modal>;
}

/* Compact list of a learner's worksheet records (teacher drawer, parent view). */
function WsRecordList({ L, family }) {
  const codes = Object.keys(L.worksheets || {}).filter(c => WT.get(c));
  if (!codes.length) return <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>No worksheets yet.</p>;
  return <div className="ws-reclist">{codes.map(c => { const w = WT.get(c), r = L.worksheets[c];
    return <div key={c} className="ws-recrow">
      <div><b>{w.title}</b><span>L{w.level} · <WsStatus s={r.status} /></span></div>
      <div className="ws-recchips">{WT.SECS.map(s => <span key={s.k} title={s.n} className="ws-recchip">{family ? <><small>{s.n}</small><b>{r.ratings && r.ratings[s.k] ? WT.RATINGS[r.ratings[s.k]] : "—"}</b></> : <><small>{s.n.split(" ").map(x => x[0]).join("")}</small><RateChip r={r.ratings && r.ratings[s.k]} sm /></>}</span>)}</div>
      {family && r.note && !window.HL_LIVE_ON && <p className="ws-famnote">“{r.note}”</p>}
    </div>; })}</div>;
}
Object.assign(window, { TWorksheets, WsReview, WsGuide, RateChip, WsRecordList, WsStatus });
