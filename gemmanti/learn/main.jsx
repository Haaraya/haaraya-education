/* Gemmanti — app entry: picks the screen set for the current role. */
function HLApp() {
  const { state } = useHL();
  const r = state.role;
  return <>
    {r === "learner" && <LearnerApp key={state.personaId} />}
    {r === "parent" && <ParentApp />}
    {r === "teacher" && <TeacherApp />}
    {r === "school" && <SchoolApp />}
    {r === "admin" && <AdminApp />}
    <Toast />
  </>;
}
ReactDOM.createRoot(document.getElementById("root")).render(<HLProvider><HLApp /></HLProvider>);
