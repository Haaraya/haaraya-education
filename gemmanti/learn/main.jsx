/* Gemmanti — app entry. Live by default; ?demo shows the invented demo. */
function HLApp() {
  const { state } = useHL();
  const r = state.role;
  if (state.live) return <><LiveApp /><HLMark /><Toast /></>;
  return <>
    {r === "learner" && <LearnerApp key={state.personaId} />}
    {r === "parent" && <ParentApp />}
    {r === "teacher" && <TeacherApp />}
    {r === "school" && <SchoolApp />}
    {r === "admin" && <AdminApp />}
    <HLMark />
    <Toast />
  </>;
}

/* The floating Haaraya Education seal from the Haaraya site. Hidden while a
   pupil is working, so it never covers an answer. */
function PublisherMark() {
  const [open, setOpen] = React.useState(false);
  return <button type="button" className={"publisher-mark" + (open ? " expanded" : "")}
    onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onClick={() => setOpen(o => !o)}
    aria-label="Published by Haaraya Education">
    <span className="publisher-mark-seal"><img src="../assets/logo-haaraya-education-white.png" alt="" /></span>
    <span className="publisher-mark-caption"><span className="by">Published by</span><span className="org">Haaraya Education</span><span className="tag">Ignite minds. Illuminate futures.</span></span>
  </button>;
}
function HLMark() {
  const { state } = useHL();
  /* Only on a pupil's own pages, and never while they work. Staff and parent
     screens have buttons in that corner, so the seal stays off them. */
  const working = state.route && (state.route.view === "worksheet" || state.route.view === "lesson" || state.route.view === "reader" || state.route.read);
  return working || state.live || state.role !== "learner" ? null : <PublisherMark />;
}

function LiveBoot() {
  const [res, setRes] = React.useState(null);
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    let off = false;
    HLLive.load().then(r => { if (!off) setRes(r); }).catch(e => { console.warn("Gemmanti load failed", e); if (!off) setRes({ error: "load" }); });
    return () => { off = true; };
  }, [n]);
  if (!res) return <LiveGate busy />;
  if (res.state) return <HLProvider initial={res.state}><HLApp /></HLProvider>;
  return <><LiveGate res={res} retry={() => { setRes(null); setN(n + 1); }} /><PublisherMark /></>;
}

/* ?board=<book code> is the class screen opened by Teach > Show to class. */
const HL_BOARD = new URLSearchParams(location.search).get("board");
ReactDOM.createRoot(document.getElementById("root")).render(
  HL_BOARD ? <BoardApp code={HL_BOARD} /> : window.HL_LIVE_ON ? <LiveBoot /> : <HLProvider><HLApp /></HLProvider>
);
