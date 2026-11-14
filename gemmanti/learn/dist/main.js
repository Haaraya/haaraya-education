/* Gemmanti — app entry. Live by default; ?demo shows the invented demo. */
function HLApp() {
  const {
    state
  } = useHL();
  const r = state.role;
  if (state.live) return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(LiveApp, null), /*#__PURE__*/React.createElement(HLMark, null), /*#__PURE__*/React.createElement(Toast, null));
  return /*#__PURE__*/React.createElement(React.Fragment, null, r === "learner" && /*#__PURE__*/React.createElement(LearnerApp, {
    key: state.personaId
  }), r === "parent" && /*#__PURE__*/React.createElement(ParentApp, null), r === "teacher" && /*#__PURE__*/React.createElement(TeacherApp, null), r === "school" && /*#__PURE__*/React.createElement(SchoolApp, null), r === "admin" && /*#__PURE__*/React.createElement(AdminApp, null), /*#__PURE__*/React.createElement(HLMark, null), /*#__PURE__*/React.createElement(Toast, null));
}

/* The floating Haaraya Education seal from the Haaraya site. Hidden while a
   pupil is working, so it never covers an answer. */
function PublisherMark() {
  const [open, setOpen] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "publisher-mark" + (open ? " expanded" : ""),
    onMouseEnter: () => setOpen(true),
    onMouseLeave: () => setOpen(false),
    onClick: () => setOpen(o => !o),
    "aria-label": "Published by Haaraya Education"
  }, /*#__PURE__*/React.createElement("span", {
    className: "publisher-mark-seal"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../assets/logo-haaraya-education-white.png",
    alt: ""
  })), /*#__PURE__*/React.createElement("span", {
    className: "publisher-mark-caption"
  }, /*#__PURE__*/React.createElement("span", {
    className: "by"
  }, "Published by"), /*#__PURE__*/React.createElement("span", {
    className: "org"
  }, "Haaraya Education"), /*#__PURE__*/React.createElement("span", {
    className: "tag"
  }, "Ignite minds. Illuminate futures.")));
}
function HLMark() {
  const {
    state
  } = useHL();
  const working = state.route && (state.route.view === "worksheet" || state.route.view === "lesson" || state.route.view === "reader" || state.route.read);
  return working ? null : /*#__PURE__*/React.createElement(PublisherMark, null);
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
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(LiveGate, {
    res: res,
    retry: () => {
      setRes(null);
      setN(n + 1);
    }
  }), /*#__PURE__*/React.createElement(PublisherMark, null));
}
ReactDOM.createRoot(document.getElementById("root")).render(window.HL_LIVE_ON ? /*#__PURE__*/React.createElement(LiveBoot, null) : /*#__PURE__*/React.createElement(HLProvider, null, /*#__PURE__*/React.createElement(HLApp, null)));