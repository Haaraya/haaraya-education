const UD = window.HL_DATA;
const ICONS = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  book: "M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7",
  path: "M5 19c0-4 4-4 7-7s7-3 7-7M5 19h0M19 5h0M5 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM19 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4z",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4",
  back: "M15 18l-6-6 6-6",
  next: "M9 6l6 6-6 6",
  x: "M6 6l12 12M18 6L6 18",
  check: "M5 12l5 5 9-10",
  play: "M8 5v14l11-7z",
  users: "M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM22 19v-1a4 4 0 0 0-3-3.9M16 4.1a3 3 0 0 1 0 5.8",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  clip: "M9 4h6v3H9zM7 5H5v16h14V5h-2M8 12h8M8 16h5",
  flag: "M5 21V4h11l-2 4 2 4H5",
  send: "M4 12l16-8-6 16-3-7z",
  school: "M3 9l9-5 9 5-9 5zM7 11v5c0 1 2 3 5 3s5-2 5-3v-5",
  globe: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18",
  key: "M15 7a4 4 0 1 1-3.9 5H3v3h3v3h3v-3h2.1A4 4 0 0 1 15 7z",
  plug: "M9 3v5M15 3v5M6 8h12v4a6 6 0 0 1-12 0zM12 18v3",
  dl: "M12 4v11M7 10l5 5 5-5M4 20h16",
  plus: "M12 5v14M5 12h14",
  layers: "M12 3l9 5-9 5-9-5zM3 13l9 5 9-5",
  lock: "M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3",
  sheet: "M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5",
  mic: "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
  stop: "M7 7h10v10H7z",
  heart: "M12 20s-8-5-8-11a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 6-8 11-8 11z"
};
function Icon({ n, s = 18, w = 2 }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={ICONS[n]} /></svg>;
}
const strandOf = id => UD.STRANDS.find(s => s.id === id) || { color: "#3D5C3D", bg: "#F3F1EC" };
function Cover({ book, progress, done }) {
  if (!book) return null;
  const st = strandOf(book.s);
  const inner = book.img
    ? <img src={book.img} alt={book.t} loading="lazy" />
    : null;
  return (
    <div className={"hl-cover" + (book.img ? "" : " type")} style={book.img ? null : { background: book.l >= 13 ? "#3F2E05" : st.color }}>
      {inner || <><small>{book.l >= 13 ? "Odyssey" : book.s} · L{book.l}</small><b>{book.t}</b></>}
      {progress != null && !done && progress > 0 && <div className="prog"><i style={{ width: Math.round(progress * 100) + "%" }}></i></div>}
      {done && <span className="done"><Icon n="check" s={14} w={3} /></span>}
    </div>
  );
}
function LevelTag({ l }) { return <span className={"hl-tag hl-lvl" + (l >= 13 ? " ody" : "")}>L{l}</span>; }
function StrandTag({ s }) { const st = strandOf(s); return <span className="hl-tag" style={{ background: st.bg, color: st.color }}>{s}</span>; }
const STATUS_LABEL = { complete: "Complete", in_progress: "In progress", not_started: "Not started", fail: "Below pass" };
function Status({ s, label }) { return <span className={"hl-status " + s}>{label || STATUS_LABEL[s]}</span>; }
/* Overdue: past the due date (end of that day, local time) and not finished. */
function hlIsOverdue(due, done) { if (done || !due) return false; const d = new Date(due); if (isNaN(d)) return false; d.setHours(23, 59, 59, 999); return d < new Date(); }
function Overdue() { return <span className="hl-overdue">Overdue</span>; }
function Bar({ v, cls = "" }) { return <div className={"hl-bar " + cls}><i style={{ width: Math.max(0, Math.min(100, v)) + "%" }}></i></div>; }
const AV_COLORS = ["#1A6E1A", "#1565C0", "#C24400", "#6A3FA0", "#00737D", "#8A5A00", "#3D5C3D"];
function Avatar({ name, size = "" }) {
  const ini = name.replace(/^(Mrs?|Ms|Dr)\.\s*/, "").split(" ").map(p => p[0]).slice(0, 2).join("");
  const c = AV_COLORS[[...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % AV_COLORS.length];
  return <span className={"hl-av " + size} style={{ background: c }}>{ini}</span>;
}
function Modal({ title, onClose, children, foot, wide }) {
  React.useEffect(() => { const k = e => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  return <div className="scrim center" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="modal" style={wide ? { width: "min(900px,100%)" } : null} role="dialog" aria-label={title}>
      <div className="modal-h"><h3>{title}</h3><button className="x-btn" onClick={onClose} aria-label="Close"><Icon n="x" /></button></div>
      <div className="modal-b">{children}</div>
      {foot && <div className="modal-f">{foot}</div>}
    </div></div>;
}
function Drawer({ onClose, children }) {
  React.useEffect(() => { const k = e => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  return <div className="scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="drawer">{children}</div></div>;
}
function Kpi({ label, value, note, dir }) { return <div className="kpi"><span>{label}</span><b>{value}</b>{note && <em className={dir || ""}>{note}</em>}</div>; }

/* Line chart: series = [{name,color,data:[]}] */
function LineChart({ series, labels, h = 180, max, unit = "" }) {
  const W = 600, P = { l: 34, r: 10, t: 10, b: 24 };
  const all = series.flatMap(s => s.data); const top = max || Math.ceil(Math.max(...all) * 1.1 / 10) * 10 || 10;
  const x = i => P.l + i * (W - P.l - P.r) / (labels.length - 1);
  const y = v => P.t + (h - P.t - P.b) * (1 - v / top);
  const ticks = [0, top / 2, top];
  return <svg className="chart" viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none" style={{ height: h }}>
    {ticks.map(t => <g key={t}><line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="#E4E0D6" /><text x={P.l - 6} y={y(t) + 4} textAnchor="end">{Math.round(t)}{unit}</text></g>)}
    {labels.map((l, i) => <text key={l} x={x(i)} y={h - 6} textAnchor="middle">{l}</text>)}
    {series.map(s => <g key={s.name}>
      <polyline fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(" ")} vectorEffect="non-scaling-stroke" />
      {s.data.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#fff" stroke={s.color} strokeWidth="2" vectorEffect="non-scaling-stroke" />)}
    </g>)}
  </svg>;
}
/* Vertical bars */
function Bars({ data, labels, h = 160, color = "#228B22", highlight }) {
  const top = Math.max(1, ...data);
  return <div className="dist" style={{ height: h }}>
    {data.map((v, i) => <div className="c" key={i}><b>{v}</b><i className={highlight && highlight(i) ? "exp" : ""} style={{ height: (v / top * (h - 44)) + "px", background: highlight && highlight(i) ? undefined : color }}></i><span>{labels[i]}</span></div>)}
  </div>;
}
function csvDownload(name, rows) {
  const csv = rows.map(r => r.map(c => { const s = String(c == null ? "" : c); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }).join(",")).join("\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
}

const PERSONAS = [
  ...window.HL_DATA.LEARNERS.filter(l => l.classId === "p3i").sort((a, b) => a.level - b.level)
    .map(l => ({ role: "learner", id: l.id, label: l.name, sub: `Pupil · Level ${l.level} · Haaraya Demo Class`, group: "Pupils (Haaraya Demo Class)" })),
  { role: "parent", label: "Mrs Ngozi Obi", sub: "Parent of Amara and Emeka", group: "Parent / Guardian" },
  { role: "teacher", label: "Mrs Adaeze Adekunle", sub: "Teacher · Haaraya Demo Class, Levels 1–12", group: "Teacher" },
  { role: "school", label: "Mr Chinedu Okoye", sub: "Head · Greenfield Primary School", group: "School administrator" },
  { role: "admin", label: "Haaraya Admin", sub: "Platform administration", group: "Haaraya administrator" }
];
function RoleSwitcher() {
  const { state } = useHL();
  if (state.live) return <LiveAccount />;
  return <DemoRoleSwitcher />;
}
function DemoRoleSwitcher() {
  const { state, setRole, reset } = useHL();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();
  React.useEffect(() => { const c = e => ref.current && !ref.current.contains(e.target) && setOpen(false); document.addEventListener("mousedown", c); return () => document.removeEventListener("mousedown", c); }, []);
  const cur = PERSONAS.find(p => p.role === state.role && (p.role !== "learner" || p.id === state.personaId));
  let lastG = null;
  return <div className="hl-role" ref={ref}>
    <button onClick={() => setOpen(!open)} aria-expanded={open}><Avatar name={cur.label} size="sm" /><span className="nm" style={{ textAlign: "left" }}><small>Viewing as</small>{cur.label}</span></button>
    {open && <div className="hl-role-menu">
      {PERSONAS.map(p => { const g = p.group !== lastG; lastG = p.group; return <React.Fragment key={p.label}>
        {g && <h6>{p.group}</h6>}
        <button className={"item" + (p === cur ? " on" : "")} onClick={() => { setRole(p.role, p.id); setOpen(false); }}><Avatar name={p.label} size="sm" /><div>{p.label}<span>{p.sub}</span></div></button>
      </React.Fragment>; })}
      <div className="foot"><span>Demo data · saved in this browser</span><button className="hl-btn quiet sm" onClick={() => { if (confirm("Reset all demo progress?")) { reset(); setOpen(false); } }}>Reset demo</button></div>
    </div>}
  </div>;
}
function Toast() { const { state } = useHL(); return state.toast ? <div className="toast" key={state.toast.id}>{state.toast.msg}</div> : null; }

Object.assign(window, { Icon, Cover, LevelTag, StrandTag, Status, Bar, Avatar, Modal, Drawer, Kpi, LineChart, Bars, csvDownload, RoleSwitcher, Toast, strandOf, PERSONAS });
