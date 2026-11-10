/* Gemmanti — app entry: picks the screen set for the current role. */
function HLApp() {
  const {
    state
  } = useHL();
  const r = state.role;
  return /*#__PURE__*/React.createElement(React.Fragment, null, r === "learner" && /*#__PURE__*/React.createElement(LearnerApp, {
    key: state.personaId
  }), r === "parent" && /*#__PURE__*/React.createElement(ParentApp, null), r === "teacher" && /*#__PURE__*/React.createElement(TeacherApp, null), r === "school" && /*#__PURE__*/React.createElement(SchoolApp, null), r === "admin" && /*#__PURE__*/React.createElement(AdminApp, null), /*#__PURE__*/React.createElement(Toast, null));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(HLProvider, null, /*#__PURE__*/React.createElement(HLApp, null)));