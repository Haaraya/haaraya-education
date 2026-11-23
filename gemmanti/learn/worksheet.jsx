/* Gemmanti — interactive worksheet player (child) + shared item renderers (teacher review reuses them). */
const WSX = window.HLWS;
const wsCls = (...a) => a.filter(Boolean).join(" ");
function WsMark({ u }) {
  if (!u) return null;
  if (u.blank) return <span className="ws-mk blank" title="Not answered" aria-label="Not answered">–</span>;
  if (!u.ok && u.need > 1 && u.got > 0) { const t = `${u.got} of ${u.need} found`; return <span className="ws-mk part" title={t + (u.extra ? `, ${u.extra} extra` : "")} aria-label={t}>{u.got}/{u.need}</span>; }
  const t = u.ok === null ? "Teacher judgement" : u.ok ? "Right" : "Not yet";
  return <span className={"ws-mk " + (u.ok === null ? "open" : u.ok ? "ok" : "no")} title={t} aria-label={t}>{u.ok === null ? "?" : <Icon n={u.ok ? "check" : "x"} s={13} w={3} />}</span>;
}
/* Which worksheet is on screen, so a picture can find its drawing. */
const WsCodeCtx = React.createContext(null);
function wsPicId(code, label) { return code && window.HLWS_PICS && (window.HLWS_PICS[code] || {})[label] || null; }
function WsArt({ id, code }) {
  const [broken, setBroken] = React.useState(false);
  if (!id || broken) return <span className="ws-pic-art" aria-hidden="true"></span>;
  return <span className="ws-pic-art has-img" aria-hidden="true"><img src={WSX.picUrl(code, id)} alt="" loading="lazy" onError={() => setBroken(true)} /></span>;
}
function Pic({ label, on, good, bad, missed, onClick, ro, small }) {
  const code = React.useContext(WsCodeCtx);
  const tap = onClick && !ro;
  const El = tap ? "button" : "div";
  return <El className={wsCls("ws-pic", on && "on", good && "good", bad && "bad", missed && "missed", small && "sm")} onClick={tap ? onClick : undefined} aria-pressed={tap ? !!on : undefined}>
    <WsArt id={wsPicId(code, label)} code={code} /><span className="ws-pic-l">{label}</span></El>;
}
/* One drawing shown above a line, for questions where the child compares things in the same picture. */
function WsRef({ id }) {
  const code = React.useContext(WsCodeCtx);
  const [broken, setBroken] = React.useState(false);
  if (broken) return null;
  return <div className="ws-ref"><img src={WSX.picUrl(code, id)} alt="" loading="lazy" onError={() => setBroken(true)} /></div>;
}
/* A second touch on the same choice within half a second is ignored, so an accidental
   double tap on a tablet never unticks what the child chose. */
function useTapGuard() {
  const last = React.useRef({ k: null, t: 0 });
  return (k, fn) => { const now = Date.now(); if (last.current.k === k && now - last.current.t < 500) return; last.current = { k, t: now }; fn(); };
}
function WordChip({ label, on, good, bad, missed, onClick, ro }) {
  return <button className={wsCls("ws-word", on && "on", good && "good", bad && "bad", missed && "missed")} onClick={ro ? undefined : onClick} disabled={ro && !on && !good} aria-pressed={!!on}>{label}</button>;
}
const BookTag = ({ i }) => <span className={"ws-tag" + (i === 0 ? " frombook" : "")}>{i === 0 ? "From our book" : "New"}</span>;

function ItemPick({ it, v, set, ro, fb }) {
  const val = v || it.lines.map(() => []);
  const guard = useTapGuard();
  const tap = (li, oi) => guard(li + ":" + oi, () => { const n = it.lines.map((_, k) => (val[k] || []).slice()); const cur = n[li]; n[li] = it.single ? [oi] : cur.includes(oi) ? cur.filter(x => x !== oi) : [...cur, oi]; set(n); });
  const P = it.pic ? Pic : WordChip;
  return <div className="ws-lines">{it.lines.map((L, li) => <div className="ws-line" key={li}>
    <BookTag i={li} />
    <div className={L.ref ? "ws-refline" : undefined}>{L.ref && <WsRef id={L.ref} />}
    <div className={it.pic ? "ws-pics" : "ws-words"}>{L.o.map((o, oi) => { const on = (val[li] || []).includes(oi); const good = L.a.includes(oi);
      return <P key={oi} label={o} on={on} good={fb && good} bad={fb && on && !good} missed={fb && good && !on && (val[li] || []).length > 0} onClick={() => tap(li, oi)} ro={ro} />; })}</div></div>
    {fb && <WsMark u={fb.units[li]} />}
  </div>)}</div>;
}
function ItemMatch({ it, v, set, ro, fb }) {
  const val = v || [];
  const P = it.picR ? Pic : WordChip;
  return <div className="ws-lines">
    {it.lead && <p className="ws-lead">{it.lead}</p>}
    {it.left.map((l, i) => <div className="ws-line" key={i}>
      {(!it.book || it.book.length) && <BookTag i={i} />}
      <div className="ws-mrow">
        <div className="ws-mleft">{it.picL ? <Pic label={l} small /> : <b className="ws-read">{l}</b>}</div>
        <span className="ws-arrow" aria-hidden="true"><Icon n="next" s={20} w={3} /></span>
        <div className={it.picR ? "ws-pics" : "ws-words"}>{it.right.map((r, ri) => { const on = val[i] === ri;
          return <P key={ri} label={r} small on={on} good={fb && it.a[i] === ri} bad={fb && on && it.a[i] !== ri} ro={ro} onClick={() => { const n = val.slice(); n[i] = on ? null : ri; set(n); }} />; })}</div>
      </div>
      {fb && <WsMark u={fb.units[i]} />}
    </div>)}</div>;
}
function ItemFill({ it, v, set, ro, fb }) {
  const val = v || it.blanks.map(() => "");
  const [sel, setSel] = React.useState(null);
  const put = w => { const j = sel != null ? sel : it.blanks.findIndex((b, k) => !b.fixed && !val[k]); if (j < 0) return; const n = it.blanks.map((_, k) => val[k] || ""); n[j] = w; set(n); setSel(null); };
  const slotTap = i => { if (val[i]) { const n = it.blanks.map((_, k) => val[k] || ""); n[i] = ""; set(n); setSel(i); } else setSel(sel === i ? null : i); };
  let u = -1;
  return <div>
    {it.lead && <p className="ws-lead">{it.lead}</p>}
    {it.bank && !ro && <div className="ws-bank"><span>Word bank</span>{it.bank.map(w => <button key={w} className="ws-word" onClick={() => put(w)}>{w}</button>)}</div>}
    <div className={wsCls("ws-blanks", it.blanks.some(b => b.pic) && "pics", it.bubble && "bubbles")}>{it.blanks.map((b, i) => { if (!b.fixed) u++; const unit = fb && !b.fixed ? fb.units[u] : null;
      return <div className="ws-blank" key={i}>
        {b.pic && <Pic label={b.pic} small />}
        <div className="ws-sent">{b.pre && <span>{b.pre}</span>}
          {b.fixed ? <span className="ws-slot fixed">{b.fixed}</span>
            : it.bank ? <button className={wsCls("ws-slot", sel === i && "sel", !val[i] && "empty")} disabled={ro} onClick={() => slotTap(i)} aria-label={val[i] ? `Gap: ${val[i]}. Tap to clear` : "Empty gap"}>{val[i] || "\u00A0"}</button>
            : <input className="ws-in" value={val[i] || ""} readOnly={ro} onChange={e => { const n = it.blanks.map((_, k) => val[k] || ""); n[i] = e.target.value; set(n); }} aria-label={b.pre || b.pic || "Answer"} />}
          {b.post && <span>{b.post}</span>}
          {unit && <WsMark u={unit} />}</div>
      </div>; })}</div>
    {it.bank && !ro && <p className="ws-hint">Tap a word to put it in the next gap. Tap a gap to empty it.</p>}
  </div>;
}
function ItemSort({ it, v, set, ro, fb }) {
  const val = v || [];
  const has = (i, b) => it.multi ? (val[i] || []).includes(String(b)) : val[i] === String(b);
  const tog = (i, b) => { const n = it.words.map((_, k) => val[k] == null ? (it.multi ? [] : "") : val[k]); const s = String(b);
    if (it.multi) { const cur = Array.isArray(n[i]) ? n[i] : []; n[i] = (cur.includes(s) ? cur.filter(x => x !== s) : [...cur, s]).sort(); } else n[i] = n[i] === s ? "" : s; set(n); };
  return <div className="ws-sort" style={{ "--bins": it.bins.length }}>
    <div className="ws-sort-r h"><span></span>{it.bins.map(b => <b key={b}>{b}</b>)}<span></span></div>
    {it.words.map((w, i) => <div className="ws-sort-r" key={i}><span className="ws-read">{w}</span>
      {it.bins.map((b, bi) => <button key={bi} disabled={ro} className={wsCls("ws-binbtn", has(i, bi) && "on")} onClick={() => tog(i, bi)} aria-label={`${w}: ${b}`} aria-pressed={has(i, bi)}>{has(i, bi) && <Icon n="check" s={18} w={3} />}</button>)}
      <span>{fb && <WsMark u={fb.units[i]} />}</span></div>)}
  </div>;
}
function ItemOrder({ it, v, set, ro, fb }) {
  const val = v || [];
  const tap = i => set(val.includes(i) ? val.filter(x => x !== i) : [...val, i]);
  const P = it.pic ? Pic : WordChip;
  return <div>
    <p className="ws-hint">{it.from ? `Tap them in order: 1 is the ${it.from}, ${it.items.length} is the ${it.to}.` : "Tap them in order, starting with 1."}</p>
    <div className={it.pic ? "ws-pics" : "ws-words"}>{it.items.map((x, i) => { const n = val.indexOf(i);
      return <div className="ws-ord" key={i}><P label={x} on={n >= 0} onClick={() => tap(i)} ro={ro} />{n >= 0 && <span className="ws-num">{n + 1}</span>}</div>; })}</div>
    <div className="ws-row">{!ro && val.length > 0 && <button className="hl-btn quiet sm" onClick={() => set([])}>Start again</button>}{fb && <WsMark u={fb.units[0]} />}</div>
  </div>;
}
function ItemYesNo({ it, v, set, ro, fb }) {
  const val = v || [];
  return <div className="ws-lines">{it.lines.map((l, i) => <div className="ws-line" key={i}><BookTag i={i} />
    <div className="ws-yn"><span className="ws-read">{l}</span><div className="ws-yn-b">{[true, false].map(b => <button key={String(b)} disabled={ro} className={wsCls("ws-word", val[i] === b && "on", fb && val[i] === b && (it.a[i] === b ? "good" : "bad"))} onClick={() => { const n = it.lines.map((_, k) => val[k]); n[i] = val[i] === b ? null : b; set(n); }}>{b ? "Yes" : "No"}</button>)}</div></div>
    {fb && <WsMark u={fb.units[i]} />}</div>)}</div>;
}
function ItemChoose({ it, v, set, ro, fb }) {
  const P = it.pic ? Pic : WordChip; const guard = useTapGuard();
  return <div className="ws-row"><div className={it.pic ? "ws-pics" : "ws-words"}>{it.o.map((o, i) => <P key={i} label={o} on={v === i} good={fb && it.a === i} bad={fb && v === i && it.a !== i} ro={ro} onClick={() => guard(i, () => set(v === i ? null : i))} />)}</div>{fb && <WsMark u={fb.units[0]} />}</div>;
}
function ItemWrite({ it, v, set, ro, fb }) {
  return <div>{it.lead && <p className="ws-lead">{it.lead}</p>}
    <div className="ws-row top"><textarea className="ws-ta" rows={it.rows || 1} value={v || ""} readOnly={ro} onChange={e => set(e.target.value)} aria-label={it.q} placeholder={ro ? "" : "Write here"}></textarea>{fb && <WsMark u={fb.units[0]} />}</div></div>;
}
function ItemFields({ it, v, set, ro, fb }) {
  const val = v || [];
  const ch = (i, x) => { const n = it.fields.map((_, k) => val[k] || ""); n[i] = x; set(n); };
  return <div className={wsCls(it.postcard && "ws-postcard", it.label && "ws-label")}>
    {it.lead && <p className="ws-lead">{it.lead}</p>}
    <div className={wsCls("ws-fields", it.row && "row", it.flow && "flow")}>{it.fields.map((f, i) => <React.Fragment key={i}>
      {it.flow && i > 1 && <span className="ws-arrow" aria-hidden="true"><Icon n="next" s={20} w={3} /></span>}
      <label className={wsCls("ws-field", f.gap && "gap", it.flow && i === 0 && "full")}>{f.l && <span>{f.l}</span>}
        {f.rows ? <textarea className="ws-ta" rows={f.rows} value={val[i] || ""} readOnly={ro} onChange={e => ch(i, e.target.value)}></textarea>
          : <input className="ws-in" value={val[i] || ""} readOnly={ro} onChange={e => ch(i, e.target.value)} />}
        {fb && <WsMark u={fb.units[i]} />}</label></React.Fragment>)}</div>
    {it.tail && <p className="ws-lead" style={{ textAlign: "right" }}>{it.tail}</p>}
  </div>;
}
function ItemTable({ it, v, set, ro, fb }) {
  const val = v || [];
  let u = -1;
  return <div className="ws-tbl-wrap"><table className="ws-tbl"><thead><tr>{it.cols.map(c => <th key={c}>{c}</th>)}</tr></thead><tbody>
    {it.rows.map((row, ri) => <tr key={ri} className={ri === 0 ? "given" : ""}>{row.map((c, ci) => { if (typeof c === "string") return <td key={ci}>{c}</td>; u++; const unit = fb && fb.units[u];
      return <td key={ci}><div className="ws-row"><input className="ws-in" value={(val[ri] || [])[ci] || ""} readOnly={ro} aria-label={`${it.cols[ci]}, row ${ri + 1}`}
        onChange={e => { const n = it.rows.map((r, k) => (val[k] || []).slice()); n[ri][ci] = e.target.value; set(n); }} />{unit && <WsMark u={unit} />}</div></td>; })}</tr>)}
  </tbody></table></div>;
}
function DrawPad({ value, onChange, ro }) {
  const ref = React.useRef(); const on = React.useRef(false);
  React.useEffect(() => { if (ro) return; const c = ref.current, x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height);
    if (value) { const im = new Image(); im.onload = () => x.drawImage(im, 0, 0, c.width, c.height); im.src = value; } }, []);
  if (ro) return value ? <img className="ws-drawn" src={value} alt="Child's drawing" /> : <div className="ws-drawn empty">No drawing</div>;
  const pos = e => { const r = ref.current.getBoundingClientRect(); return [(e.clientX - r.left) * ref.current.width / r.width, (e.clientY - r.top) * ref.current.height / r.height]; };
  const ctx = () => { const x = ref.current.getContext("2d"); x.lineWidth = 6; x.lineCap = "round"; x.lineJoin = "round"; x.strokeStyle = "#1A2A1A"; return x; };
  const down = e => { on.current = true; ref.current.setPointerCapture(e.pointerId); const x = ctx(); const [a, b] = pos(e); x.beginPath(); x.moveTo(a, b); x.lineTo(a + .1, b + .1); x.stroke(); };
  const move = e => { if (!on.current) return; const x = ctx(); const [a, b] = pos(e); x.lineTo(a, b); x.stroke(); };
  const up = () => { if (!on.current) return; on.current = false; onChange(ref.current.toDataURL("image/jpeg", .6)); };
  const clear = () => { const c = ref.current, x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); onChange(null); };
  return <div className="ws-draw"><canvas ref={ref} width={600} height={340} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} aria-label="Drawing box: draw with your finger or mouse"></canvas>
    <button className="hl-btn quiet sm" onClick={clear}>Clear my drawing</button></div>;
}
function ItemDraw({ it, v, set, ro, fb }) {
  const val = v || {};
  return <div>{it.lead && <p className="ws-lead">{it.lead}</p>}
    <DrawPad value={val.img} ro={ro} onChange={img => set({ ...val, img })} />
    <label className="ws-field" style={{ marginTop: 10 }}><span>{it.labelPre || "Label"}</span><input className="ws-in" value={val.label || ""} readOnly={ro} onChange={e => set({ ...val, label: e.target.value })} />{fb && <WsMark u={fb.units[1] || fb.units[0]} />}</label></div>;
}
function ItemText({ it }) {
  return <div className="ws-rc"><div className="ws-h">Read and Compare</div><h4>{it.title}</h4>{it.paras.map((p, i) => <p key={i}>{p}</p>)}</div>;
}
const WS_RENDER = { pick: ItemPick, match: ItemMatch, fill: ItemFill, sort: ItemSort, order: ItemOrder, yesno: ItemYesNo, choose: ItemChoose, write: ItemWrite, fields: ItemFields, table: ItemTable, draw: ItemDraw, text: ItemText };

function WsKey({ it }) { return it.key ? <div className="ws-key"><b>Answer</b><span>{it.key}</span>{it.at && <em>{it.at}</em>}</div> : null; }
function WsItemArt({ it }) {
  const code = React.useContext(WsCodeCtx); const [bad, setBad] = React.useState(false);
  const id = code && window.HLWS_ART && (window.HLWS_ART[code] || {})[it.id];
  if (!id || bad) return null;
  return <img className="ws-item-art" src={WSX.picUrl(code, id)} alt="" loading="lazy" onError={() => setBad(true)} />;
}
function WsItem({ it, n, v, set, ro, fb, teacher, showKey, need }) {
  const R = WS_RENDER[it.t];
  const blank = fb && fb.units.length > 0 && fb.units.every(u => u.blank);
  return <div id={"ws-" + it.id} className={wsCls("ws-item", it.challenge && "ch", it.t === "text" && "txt", need && "need", blank && !need && "blank")}>
    {need && <div className="ws-need-tag">Not answered yet</div>}
    {blank && !need && <div className="ws-need-tag">Not answered</div>}
    {it.challenge && <div className="ws-ch-tag"><Icon n="star" s={16} />Challenge{teacher ? " · optional, the source of Beyond" : " · if you want to"}</div>}
    {it.h && it.t !== "text" && <div className="ws-h">{it.h}</div>}
    {it.t !== "text" && <p className="ws-q">{n != null && <span className="ws-qn">{n}</span>}<span>{it.q}</span></p>}
    <WsItemArt it={it} />
    <R it={it} v={v} set={set || (() => {})} ro={ro} fb={fb} />
    {it.say && <p className="ws-hint">Tell your teacher why.</p>}
    {showKey && <WsKey it={it} />}
  </div>;
}

/* Read It Again: passage, optional pause/stress marks (L11–12), recordings for the teacher. */
function RecBtn({ k, n, done, onDone, ro }) {
  const [st, setSt] = React.useState("idle"); const mr = React.useRef(null);
  const url = window.HL_AUDIO[k];
  const start = async () => {
    try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); const r = new MediaRecorder(s); const ch = [];
      r.ondataavailable = e => ch.push(e.data);
      r.onstop = () => { s.getTracks().forEach(t => t.stop()); window.HL_AUDIO[k] = URL.createObjectURL(new Blob(ch, { type: r.mimeType })); setSt("idle"); onDone(true); };
      r.start(); mr.current = r; setSt("rec");
    } catch (e) { setSt("nomic"); }
  };
  return <div className={wsCls("ws-rec", done && "done")}>
    <b>Read {n}</b>
    {done ? <span className="ws-rec-ok"><Icon n="check" s={16} w={3} />Done</span> : <span className="ws-rec-st">{st === "rec" ? "Recording…" : "Not yet"}</span>}
    {url && <audio controls src={url}></audio>}
    {!ro && <div className="ws-row">
      {st === "rec" ? <button className="hl-btn warn sm" onClick={() => mr.current && mr.current.stop()}><Icon n="stop" s={14} />Stop</button>
        : <button className="hl-btn sm" onClick={start}><Icon n="mic" s={16} />{url ? "Record again" : "Record my reading"}</button>}
      {!done && <button className="hl-btn quiet sm" onClick={() => onDone(true)}>I read it to my teacher</button>}
    </div>}
    {st === "nomic" && <p className="ws-hint">No microphone here. Read it to your teacher, then tap “I read it to my teacher”.</p>}
  </div>;
}
function ReadAgain({ w, L, rec, ro, setResp, onReads, teacher }) {
  const R = w.ra; const marks = R.marks; const m = (rec.resp && rec.resp.ra) || { s: [], p: [] };
  const [tool, setTool] = React.useState("s");
  const tapWord = key => { if (ro || !marks) return; const lst = m[tool].includes(key) ? m[tool].filter(x => x !== key) : [...m[tool], key]; setResp("ra", { ...m, [tool]: lst }); };
  const reads = rec.reads || [];
  return <div className="ws-item">
    <div className="ws-ra-h"><span className="ws-h">{R.page}</span><span>{R.reads === 2 ? "Read this twice to your teacher." : "Read this to your teacher."}</span></div>
    {marks && <div className="ws-marks">
      <p className="ws-q"><span>Before you read, mark {marks.pause === 2 ? "two places" : "one place"} where you will pause and one word you will stress.</span></p>
      {!ro && <div className="hl-seg-sm" role="group" aria-label="Marking tool">{[["s", "Stress a word"], ["p", "Pause after a word"]].map(([k, l]) => <button key={k} className={tool === k ? "on" : ""} onClick={() => setTool(k)}>{l}</button>)}</div>}
      <span className="ws-hint">Stress {m.s.length}/{marks.stress} · Pause {m.p.length}/{marks.pause}</span></div>}
    <div className="ws-passage">{R.lines.map((ln, li) => <p key={li}>{ln.split(" ").map((wd, wi) => { const key = li + ":" + wi; const s = m.s.includes(key), p = m.p.includes(key);
      return <React.Fragment key={wi}>{marks ? <button className={wsCls("ws-pw", s && "st")} onClick={() => tapWord(key)} disabled={ro}>{wd}</button> : <span>{wd}</span>}{p && <span className="ws-pause" aria-label="pause">|</span>}{" "}</React.Fragment>; })}</p>)}</div>
    <p className="ws-purpose">{R.purpose}</p>
    <div className="ws-recs">{Array.from({ length: R.reads }, (_, i) => <RecBtn key={i} k={`${L.id}|${w.code}|${i}`} n={i + 1} done={!!reads[i]} ro={ro} onDone={d => { const n = Array.from({ length: R.reads }, (_, k) => !!reads[k]); n[i] = d; onReads(n); }} />)}</div>
    {!teacher && <p className="ws-hint">Your teacher listens to you on your own. Recordings stay on this device.</p>}
  </div>;
}

function wsAnswered(w, k, rec) {
  if (k === "ra") return (rec.reads || []).some(Boolean);
  return WSX.secItems(w, k).filter(it => !it.challenge && it.t !== "text").some(it => WSX.check(it, rec.resp[it.id]).answered);
}
function WorksheetSection({ w, k, L, rec, ro, setResp, onReads, teacher, showFb, showKey, need }) {
  if (k === "ra") return <ReadAgain w={w} L={L} rec={rec} ro={ro} setResp={setResp} onReads={onReads} teacher={teacher} />;
  let qn = 0;
  return <WsCodeCtx.Provider value={w.code}>{WSX.secItems(w, k).map(it => { if (k === "ta" && it.t !== "text") qn++;
    return <WsItem key={it.id} it={it} n={k === "ta" && it.t !== "text" ? qn : null} v={rec.resp[it.id]} set={x => setResp(it.id, x)} ro={ro} teacher={teacher} showKey={showKey}
      need={!!need && need.includes(it.id) && !WSX.unanswered(w, k, rec.resp).every(x => x.id !== it.id)}
      fb={showFb && it.t !== "text" ? WSX.check(it, rec.resp[it.id]) : null} />; })}</WsCodeCtx.Provider>;
}

function WorksheetPlayer({ L, code }) {
  const { state, go, wsResp, wsReads, wsHandIn, wsSeen } = useHL();
  const w = WSX.get(code); const b = hlBook(code); const rec = hlWsRec(L, code);
  const [sec, setSec] = React.useState(0); const [review, setReview] = React.useState(false); const [ask, setAsk] = React.useState(null); const [need, setNeed] = React.useState([]);
  const done = rec.status === "handed_in" || rec.status === "reviewed";
  React.useEffect(() => { if (rec.status === "reviewed" && !rec.seen) wsSeen(L.id, code); }, []);
  React.useEffect(() => { window.scrollTo(0, 0); }, [sec]);
  if (!w) return null;
  const S = WSX.SECS[sec]; const ro = done;
  const teacherName = (state.teachers.find(t => (t.classes || []).includes(L.classId)) || { name: "your teacher" }).name;
  const withTeacher = k => w.twoPart && (k === "ra" || k === "ta");
  /* Questions left empty, so the child is asked to answer them before moving on. */
  const missIn = k => k === "ra" ? [] : WSX.unanswered(w, k, rec.resp);
  const qLabel = (k, it) => { const items = WSX.secItems(w, k).filter(x => x.t !== "text" && !x.challenge); return "Question " + (items.indexOf(it) + 1) + (it.h ? " · " + it.h : ""); };
  const showMissing = (k, list) => { setNeed(list.map(it => it.id)); setSec(WSX.SECS.findIndex(s => s.k === k));
    setTimeout(() => { const el = document.getElementById("ws-" + list[0].id); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }, 60); };
  const tryNext = () => { const m = ro || withTeacher(S.k) ? [] : missIn(S.k);
    if (m.length) setAsk({ kind: "next", groups: [{ k: S.k, n: S.n, list: m }] }); else { setNeed([]); setSec(sec + 1); } };
  const tryHandIn = () => { const groups = WSX.SECS.map(s => ({ k: s.k, n: s.n, list: missIn(s.k) })).filter(g => g.list.length);
    if (groups.length) setAsk({ kind: "hand", groups }); else wsHandIn(L.id, code); };
  const first = L.name.split(" ")[0];
  const head = <div className="ws-head">
    <button className="back" onClick={() => go("home")}><Icon n="back" />Home</button>
    <div className="ws-title">
      <div className="ws-cover"><Cover book={b} /></div>
      <div><div className="eyebrow">Level {w.level} · {w.strand} · {w.code}</div><h1>{w.title}</h1><p>{w.blurb}</p></div>
    </div>
  </div>;
  if (done && !review) return <div className="kid-wrap ws">{head}
    <div className="ws-done">
      <img src={`assets/stamp-l${Math.min(12, w.level)}.png`} alt="" />
      <div>
        <h2>{rec.status === "reviewed" ? `${teacherName} has looked at your worksheet` : `Well done, ${first}! Your worksheet is with ${teacherName}.`}</h2>
        {rec.status === "reviewed" && rec.note && !window.HL_LIVE_ON ? <div className="ws-note"><span className="eyebrow">From your teacher</span><p>{rec.note}</p></div>
          : <p>{rec.status === "reviewed" ? "Keep reading — your next book is waiting." : "Your teacher will listen to your reading and look at your answers."}</p>}
        <div className="ws-row"><button className="hl-btn" onClick={() => setReview(true)}>Look at my worksheet</button><button className="hl-btn ghost" onClick={() => go(state.live ? "worksheets" : "home")}>Back to the worksheets</button></div>
      </div>
    </div></div>;
  return <div className="kid-wrap ws">{head}
    {done && <div className="ws-banner"><Icon n="check" s={16} w={3} />Handed in. You can look, but not change it.<button className="hl-btn quiet sm" onClick={() => setReview(false)}>Close</button></div>}
    <nav className="ws-steps" aria-label="Worksheet parts">{WSX.SECS.map((s, i) => <button key={s.k} className={wsCls(i === sec && "on", wsAnswered(w, s.k, rec) && "done")} onClick={() => setSec(i)} aria-current={i === sec ? "step" : undefined}>
      <span className="n">{wsAnswered(w, s.k, rec) && i !== sec ? <Icon n="check" s={14} w={3} /> : s.i}</span><span className="l">{s.n}</span></button>)}</nav>
    <section className="ws-sec">
      <div className="ws-sec-h"><h2>{S.i}. {S.n}</h2>{withTeacher(S.k) && <span className="ws-with"><Icon n="users" s={16} />Do this with your teacher</span>}</div>
      {S.k === "wf" && <p className="ws-intro">The first line of each task comes from our book. The next lines are new. Can you still do them?</p>}
      <WorksheetSection w={w} k={S.k} L={L} rec={rec} ro={ro} need={need} setResp={(id, x) => wsResp(L.id, code, id, x)} onReads={r => wsReads(L.id, code, r)} />
    </section>
    <div className="ws-foot">
      <button className="hl-btn ghost big" disabled={sec === 0} onClick={() => setSec(sec - 1)}><Icon n="back" s={18} />Back</button>
      <span className="ws-saved">{ro ? "" : "Your answers save as you go"}</span>
      {sec < 3 ? <button className="hl-btn big" onClick={tryNext}>Next<Icon n="next" s={18} /></button>
        : !ro && <button className="hl-btn yellow big" onClick={tryHandIn}><Icon n="send" s={18} />Hand in to my teacher</button>}
    </div>
    {ask && <Modal title={ask.groups.length > 1 || ask.groups[0].list.length > 1 ? "Some questions are not answered yet" : "One question is not answered yet"} onClose={() => setAsk(null)}
      foot={<><button className="hl-btn ghost" onClick={() => { const g = ask; setAsk(null); setNeed([]); if (g.kind === "hand") wsHandIn(L.id, code); else setSec(sec + 1); }}>{ask.kind === "hand" ? "Hand in anyway" : "Go on anyway"}</button>
        <button className="hl-btn" onClick={() => { const g = ask.groups[0]; setAsk(null); showMissing(g.k, g.list); }}>Answer {ask.groups.length > 1 || ask.groups[0].list.length > 1 ? "them" : "it"} now</button></>}>
      <p style={{ fontWeight: 700 }}>Can you answer {ask.groups.length > 1 || ask.groups[0].list.length > 1 ? "these" : "this"} first?</p>
      <ul className="ws-miss">{ask.groups.map(g => g.list.map(it => <li key={it.id}>{ask.kind === "hand" ? g.n + ": " : ""}{qLabel(g.k, it)}</li>))}</ul>
      {ask.groups.some(g => withTeacher(g.k)) && <p className="note" style={{ marginTop: 10 }}>If your teacher said to leave a part, that is fine.</p>}</Modal>}
  </div>;
}
Object.assign(window, { WorksheetPlayer, WorksheetSection, WsItem, WsKey, WsMark, ReadAgain, wsAnswered, Pic });
