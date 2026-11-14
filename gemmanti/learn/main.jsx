/* Gemmanti — app entry. Live by default; ?demo shows the invented demo. */
function HLApp() {
  const { state } = useHL();
  const r = state.role;
  if (state.live) return <><LiveApp /><Toast /></>;
  return <>
    {r === "learner" && <LearnerApp key={state.personaId} />}
    {r === "parent" && <ParentApp />}
    {r === "teacher" && <TeacherApp />}
    {r === "school" && <SchoolApp />}
    {r === "admin" && <AdminApp />}
    <Toast />
  </>;
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
  return <LiveGate res={res} retry={() => { setRes(null); setN(n + 1); }} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  window.HL_LIVE_ON ? <LiveBoot /> : <HLProvider><HLApp /></HLProvider>
);
