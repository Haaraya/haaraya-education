const PD = window.HL_DATA;
const LS = PD.LESSON;
const VOCAB_KEY = { soil: "soil", seed: "seed", seeds: "seed", sunny: "sunny", shoot: "shoot" };
function tokenize(p) {
  const raw = p.split(" "); const out = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "After" && raw[i + 1] && raw[i + 1].startsWith("that")) { out.push(raw[i] + " " + raw[i + 1]); i++; } else out.push(raw[i]);
  }
  return out;
}
const bare = t => t.replace(/[.,!?“”]/g, "");
function shuffled(a, seed) { const r = a.map((x, i) => [x, (i * 7919 + seed * 104729) % 97]); return r.sort((x, y) => x[1] - y[1]).map(x => x[0]); }

function LessonPlayer({ L, jump }) {
  const { go, lessonSave, lessonAttempt } = useHL();
  const rec = hlLessonRec(L);
  const maxReached = rec.status === "complete" ? 5 : rec.step;
  const [sec, setSec] = React.useState(() => jump != null && jump <= Math.max(maxReached, 1) ? jump : (rec.status === "complete" ? 5 : rec.step));
  const [gate, setGate] = React.useState({});
  const lp = React.useRef();
  const toSec = n => { setSec(n); if (n > rec.step && n < 5) lessonSave(L.id, LS.id, { step: n }); if (lp.current) lp.current.scrollTop = 0; };
  const close = () => go("home");
  const ready = sec === 0 || sec === 1 || gate[sec];
  const lastAt = hlLastAttempt(rec);
  return <div className="lp" ref={lp} role="dialog" aria-label={LS.title}>
    <div className="lp-top">
      <button className="x-btn" onClick={close} aria-label="Save and close"><Icon n="x" /></button>
      <div className="t">{LS.title}<small>Level {LS.level} · {LS.strand} · {LS.unit}</small></div>
      <div className="lp-steps">{PD.SECTIONS.map((s, i) => <span key={s} className={i === sec ? "on" : i < Math.max(sec, maxReached) || (i === 5 && rec.status === "complete") ? "done" : ""}><i>{i < sec || (i === 5 && rec.status === "complete" && sec !== 5) ? "✓" : i + 1}</i><b>{s}</b></span>)}</div>
      <span style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700 }}>Progress saves automatically</span>
    </div>
    <div className="lp-body">
      {sec === 0 && <Intro />}
      {sec === 1 && <ReadSec />}
      {sec === 2 && <Guided onDone={v => setGate(g => ({ ...g, 2: v }))} />}
      {sec === 3 && <Practice onDone={v => setGate(g => ({ ...g, 3: v }))} />}
      {sec === 4 && <Quiz onFinish={(score, ans) => { lessonAttempt(L.id, LS.id, score, LS.quiz.length, ans); setSec(5); if (lp.current) lp.current.scrollTop = 0; }} />}
      {sec === 5 && lastAt && <Result rec={rec} L={L} onRetry={() => setSec(4)} onHome={close} onJourney={() => go("journey")} />}
      {sec === 5 && !lastAt && <div className="empty">Finish the check to see your score.</div>}
    </div>
    {sec < 4 && <div className="lp-foot">
      <button className="hl-btn ghost big" disabled={sec === 0} onClick={() => toSec(sec - 1)}><Icon n="back" />Back</button>
      <FootHint sec={sec} ok={ready} />
      <button className="hl-btn big" disabled={!ready} onClick={() => toSec(sec + 1)}>{sec === 0 ? "Let's start" : sec === 3 ? "Go to the check" : "Next"}<Icon n="next" /></button>
    </div>}
  </div>;
}
function FootHint({ sec, ok }) {
  if (sec === 2) return <span className={"fb " + (ok ? "ok" : "")}>{ok ? <><Icon n="check" />All order words found!</> : "Find all 5 order words"}</span>;
  if (sec === 3) return <span className={"fb " + (ok ? "ok" : "")}>{ok ? <><Icon n="check" />Great practice!</> : "Finish both activities"}</span>;
  return <span></span>;
}
function Intro() {
  return <>
    <div className="eyebrow">Today's lesson</div>
    <h1 style={{ marginTop: 8 }}>{LS.title}</h1>
    <p className="lead">{LS.objective}</p>
    <ul className="goals">{LS.goals.map((g, i) => <li key={g}><i>{i + 1}</i>{g}</li>)}</ul>
    <p style={{ color: "var(--ink-soft)", fontWeight: 700 }}>About {LS.mins} minutes · 6-question check at the end</p>
  </>;
}
function ReadSec() {
  const [w, setW] = React.useState(null);
  const v = w && LS.vocab.find(x => x.w === w);
  return <>
    <div className="eyebrow">Read</div>
    <h1 style={{ marginTop: 8 }}>{LS.passageTitle}</h1>
    <p className="lead" style={{ fontSize: 17 }}>Tap a <span style={{ borderBottom: "2px dotted var(--forest)", fontWeight: 700 }}>dotted word</span> to see what it means.</p>
    <div className="illus" style={{ height: 120 }}>illustration · maize seedling in soil</div>
    <div className="passage">{LS.passage.map((p, i) => <p key={i}>{tokenize(p).map((t, j) => {
      const key = VOCAB_KEY[bare(t).toLowerCase()];
      return <React.Fragment key={j}>{key ? <button className="tok" onClick={() => setW(key)}>{t}</button> : <span className="tok">{t}</span>} </React.Fragment>;
    })}</p>)}</div>
    {v && <div className="vocab-pop" role="status"><b>{v.w}</b> — {v.m}</div>}
  </>;
}
function Guided({ onDone }) {
  const [found, setFound] = React.useState([]); const [miss, setMiss] = React.useState(null);
  React.useEffect(() => { onDone(found.length === LS.orderWords.length); }, [found]);
  const tap = (t, id) => { const b = bare(t); if (LS.orderWords.includes(b)) { setFound(f => f.includes(b) ? f : [...f, b]); } else { setMiss(id); setTimeout(() => setMiss(m => m === id ? null : m), 700); } };
  return <>
    <div className="eyebrow">Guided activity</div>
    <h1 style={{ marginTop: 8 }}>Find the order words</h1>
    <p className="lead">Order words tell us what to do <b>first</b> and what comes <b>next</b>. Tap every order word in the text.</p>
    <div className="chips" style={{ marginTop: 18 }}>{LS.orderWords.map(w => <span key={w} className={"chip" + (found.includes(w) ? " on" : "")} style={{ cursor: "default", fontFamily: "var(--read)", fontSize: 16 }}>{found.includes(w) ? w : "?"}</span>)}</div>
    <div className="passage pick">{LS.passage.map((p, i) => <p key={i}>{tokenize(p).map((t, j) => { const id = i + "-" + j; const hit = found.includes(bare(t));
      return <React.Fragment key={j}><button className={"tok" + (hit ? " hit" : miss === id ? " miss" : "")} onClick={() => tap(t, id)}>{t}</button> </React.Fragment>; })}</p>)}</div>
  </>;
}
function Practice({ onDone }) {
  const [matched, setMatched] = React.useState([]); const [selW, setSelW] = React.useState(null); const [wrong, setWrong] = React.useState(null);
  const meanings = React.useMemo(() => shuffled(LS.vocab, 3), []);
  const pool0 = React.useMemo(() => shuffled(LS.steps.map((s, i) => ({ s, i })), 5), []);
  const [slots, setSlots] = React.useState([]); const [checked, setChecked] = React.useState(false);
  const orderOk = slots.length === LS.steps.length && slots.every((x, i) => x.i === i);
  const aDone = matched.length === LS.vocab.length;
  React.useEffect(() => { onDone(aDone && orderOk && checked); }, [matched, slots, checked]);
  const pickMeaning = m => { if (!selW) return; if (m.w === selW) { setMatched(x => x.includes(m.w) ? x : [...x, m.w]); setSelW(null); } else { setWrong(m.w); setTimeout(() => setWrong(null), 700); } };
  return <>
    <div className="eyebrow">Practice</div>
    <h1 style={{ marginTop: 8 }}>Words and steps</h1>
    <div className="task">
      <h2>1. Match each word to its meaning</h2>
      <p className="hint">Tap a word, then tap what it means.</p>
      <div className="match">
        <div className="col">{LS.vocab.map(v => <button key={v.w} className={"opt" + (matched.includes(v.w) ? " ok" : selW === v.w ? " sel" : "")} disabled={matched.includes(v.w)} onClick={() => setSelW(v.w)}><span className="k">{matched.includes(v.w) ? "✓" : "•"}</span>{v.w}</button>)}</div>
        <div className="col">{meanings.map(m => <button key={m.w} className={"opt" + (matched.includes(m.w) ? " ok" : wrong === m.w ? " no" : "") + (!selW && !matched.includes(m.w) ? " dim" : "")} disabled={matched.includes(m.w)} onClick={() => pickMeaning(m)} style={{ fontSize: 17 }}>{matched.includes(m.w) && <span className="k" style={{ width: "auto", padding: "0 8px" }}>{m.w}</span>}{m.m}</button>)}</div>
      </div>
      {wrong && <div className="why no">Not quite — try another meaning.</div>}
    </div>
    <div className="task" style={{ marginTop: 44, opacity: aDone ? 1 : .45, pointerEvents: aDone ? "auto" : "none" }}>
      <h2>2. Put the steps in order</h2>
      <p className="hint">Tap the steps in the order they happen.</p>
      <div className="slots">{LS.steps.map((_, i) => { const x = slots[i]; const bad = checked && x && x.i !== i;
        return <div key={i} className={"slot" + (x ? " filled" : "") + (bad ? " no" : "")}><span className="n">{i + 1}</span>{x ? x.s : ""}{x && !(checked && orderOk) && <button className="x" onClick={() => { setSlots(slots.filter((_, k) => k !== i)); setChecked(false); }} aria-label="Remove">×</button>}</div>; })}</div>
      <div className="pool">{pool0.filter(p => !slots.includes(p)).map(p => <button key={p.i} className="opt" onClick={() => { setSlots(s => s.includes(p) ? s : [...s, p]); setChecked(false); }}>{p.s}</button>)}</div>
      {slots.length === LS.steps.length && !checked && <button className="hl-btn big" style={{ marginTop: 16 }} onClick={() => setChecked(true)}>Check my order</button>}
      {checked && <div className={"why " + (orderOk ? "ok" : "no")}>{orderOk ? "Yes! Those steps are in the right order." : "Some steps are in the wrong place. Remove the red ones and try again. Look for First, Next, Then…"}</div>}
    </div>
  </>;
}
function Quiz({ onFinish }) {
  const [i, setI] = React.useState(0); const [ans, setAns] = React.useState([]);
  const q = LS.quiz[i]; const a = ans[i];
  const pick = k => { if (a != null) return; const n = ans.slice(); n[i] = k; setAns(n); };
  const score = ans.filter((x, k) => x === LS.quiz[k].a).length;
  return <>
    <div className="eyebrow">Check · {LS.quiz.length} questions · pass mark {LS.passMark} of {LS.quiz.length}</div>
    <div style={{ display: "flex", gap: 6, marginTop: 14 }}>{LS.quiz.map((_, k) => <span key={k} style={{ flex: 1, height: 8, borderRadius: 9, background: ans[k] == null ? (k === i ? "var(--yellow)" : "var(--sand)") : ans[k] === LS.quiz[k].a ? "var(--forest)" : "var(--warn)" }}></span>)}</div>
    <div className="qcard">
      <div className="qn">Question {i + 1} of {LS.quiz.length}</div>
      <h2>{q.q}</h2>
      <div className="opts">{q.o.map((o, k) => { const st = a == null ? "" : k === q.a ? " ok" : k === a ? " no" : " dim";
        return <button key={k} className={"opt" + st} disabled={a != null} onClick={() => pick(k)}><span className="k">{"ABCD"[k]}</span>{o}</button>; })}</div>
      {a != null && <div className={"why " + (a === q.a ? "ok" : "no")}><b>{a === q.a ? "Correct! " : "Not this time. "}</b>{q.why}</div>}
    </div>
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
      {a != null && (i < LS.quiz.length - 1 ? <button className="hl-btn big" onClick={() => setI(i + 1)}>Next question<Icon n="next" /></button>
        : <button className="hl-btn big yellow" onClick={() => onFinish(score, ans)}>See my score<Icon n="next" /></button>)}
    </div>
  </>;
}
function Result({ rec, L, onRetry, onHome, onJourney }) {
  const a = hlLastAttempt(rec); const pass = a.pass;
  return <div className="result">
    <img src={pass ? "assets/book-complete.png" : "assets/book-reading.png"} alt="" style={{ width: 96, height: 96, objectFit: "contain" }} />
    <h1 style={{ marginTop: 12 }}>{pass ? "You did it, " + L.name.split(" ")[0] + "!" : "Good try, " + L.name.split(" ")[0]}</h1>
    <div className="score">{a.score}<small> / {a.total}</small></div>
    <Status s={pass ? "complete" : "fail"} label={pass ? "Passed" : `Pass mark is ${LS.passMark}`} />
    {a.answers && <div className="qreview">{LS.quiz.map((q, k) => <span key={k} className={a.answers[k] === q.a ? "ok" : "no"}>{k + 1}</span>)}</div>}
    <div className="upd">
      <div><i>✓</i>Score saved to your reading record (try {rec.attempts.length})</div>
      {pass ? <><div><i>✓</i>Unit 3 of your Level 4 journey is complete</div><div><i>✓</i>Level 4 progress is now {L.levelPct}%</div><div><i>★</i>New achievement: Order Finder</div></>
        : <div><i>↺</i>Read the text again, then try the check one more time</div>}
      <div><i>✓</i>Your teacher can see this result</div>
    </div>
    <div className="acts">
      {!pass && <button className="hl-btn big yellow" onClick={onRetry}>Try the check again</button>}
      <button className={"hl-btn big" + (pass ? "" : " ghost")} onClick={onHome}>Back to home</button>
      <button className="hl-btn big ghost" onClick={onJourney}>My journey</button>
    </div>
    <DemoTeacherLink />
  </div>;
}
function DemoTeacherLink() {
  const { setRole } = useHL();
  return <p style={{ marginTop: 28, fontSize: 13, color: "var(--ink-soft)", fontWeight: 700 }}>Demo · <button className="hl-btn quiet sm" onClick={() => setRole("teacher")}>See this result as the teacher →</button></p>;
}
Object.assign(window, { LessonPlayer });
