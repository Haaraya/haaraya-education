/* Gemmanti — app entry. Live by default; ?demo shows the invented demo. */
function HLApp() {
  const {
    state
  } = useHL();
  const r = state.role;
  if (state.live) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(LiveApp, null), /*#__PURE__*/React.createElement(Toast, null));
  return /*#__PURE__*/React.createElement(React.Fragment, null, r === "learner" && /*#__PURE__*/React.createElement(LearnerApp, {
    key: state.personaId
  }), r === "parent" && /*#__PURE__*/React.createElement(ParentApp, null), r === "teacher" && /*#__PURE__*/React.createElement(TeacherApp, null), r === "school" && /*#__PURE__*/React.createElement(SchoolApp, null), r === "admin" && /*#__PURE__*/React.createElement(AdminApp, null), /*#__PURE__*/React.createElement(Toast, null));
}
function LiveBoot() {
  const [res, setRes] = React.useState(null);
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    let off = false;
    HLLive.load().then(r => {
      if (!off) setRes(r);
    }).catch(e => {
      console.warn("Gemmanti load failed", e);
      if (!off) setRes({
        error: "load"
      });
    });
    return () => {
      off = true;
    };
  }, [n]);
  if (!res) return /*#__PURE__*/React.createElement(LiveGate, {
    busy: true
  });
  if (res.state) return /*#__PURE__*/React.createElement(HLProvider, {
    initial: res.state
  }, /*#__PURE__*/React.createElement(HLApp, null));
  return /*#__PURE__*/React.createElement(LiveGate, {
    res: res,
    retry: () => {
      setRes(null);
      setN(n + 1);
    }
  });
}
ReactDOM.createRoot(document.getElementById("root")).render(window.HL_LIVE_ON ? /*#__PURE__*/React.createElement(LiveBoot, null) : /*#__PURE__*/React.createElement(HLProvider, null, /*#__PURE__*/React.createElement(HLApp, null)));