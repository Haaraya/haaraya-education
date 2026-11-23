/* Gemmanti — live screens: sign-in gate, teacher and school admin, reports, pupil and Haaraya admin.
   They reuse the worksheet screens; anything without real data behind it yet
   (lessons, journeys, reports, requests) is left out. */
const LIVE_HOME = "../Haaraya%20Home.html";
const LIVE_LOGIN = "../Haaraya%20Login.html?next=" + encodeURIComponent("gemmanti/Gemmanti.html");
const LIVE_ROLE_NAME = {
  teacher: "Teacher",
  school: "School admin",
  admin: "Haaraya admin"
};

/* ---------- before anything loads ---------- */
function LiveFrame({
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("header", {
    className: "hl-top"
  }, /*#__PURE__*/React.createElement("a", {
    className: "hl-brand",
    href: LIVE_HOME
  }, /*#__PURE__*/React.createElement("img", {
    className: "hl-logo",
    src: "assets/logo-gemmanti.png",
    alt: "Gemmanti"
  })), /*#__PURE__*/React.createElement("div", {
    className: "hl-spacer"
  })), /*#__PURE__*/React.createElement("main", {
    className: "live-gate"
  }, children));
}
function LiveGate({
  busy,
  res,
  retry
}) {
  if (busy) return /*#__PURE__*/React.createElement(LiveFrame, null, /*#__PURE__*/React.createElement("p", {
    className: "live-wait"
  }, "Loading\u2026"));
  const r = res || {};
  let title, body, actions;
  if (r.signedOut || r.noProfile) {
    title = "Sign in to Gemmanti";
    body = "Use your Haaraya school account. Teachers and school admins can sign in here.";
    actions = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("a", {
      className: "hl-btn big",
      href: LIVE_LOGIN
    }, "Sign in"), /*#__PURE__*/React.createElement("a", {
      className: "hl-btn ghost big",
      href: "Gemmanti.html?demo=child"
    }, "Try it as a pupil"));
  } else if (r.unsupported && r.parentAccount) {
    title = "Gemmanti is for schools";
    body = "Your family’s reading and progress are on your Haaraya dashboard.";
    actions = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("a", {
      className: "hl-btn",
      href: LIVE_HOME
    }, "Go to Haaraya"), /*#__PURE__*/React.createElement("button", {
      className: "hl-btn ghost",
      onClick: async () => {
        await HLLive.signOut();
        location.reload();
      }
    }, "Sign out"));
  } else if (r.unsupported) {
    title = "Gemmanti is for schools";
    body = "This account can’t use Gemmanti. Sign in with a teacher or school admin account.";
    actions = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("a", {
      className: "hl-btn",
      href: LIVE_HOME
    }, "Back to Haaraya"), /*#__PURE__*/React.createElement("button", {
      className: "hl-btn ghost",
      onClick: async () => {
        await HLLive.signOut();
        location.reload();
      }
    }, "Sign out"));
  } else {
    title = "Gemmanti couldn’t load";
    body = "Check your internet connection and try again.";
    actions = /*#__PURE__*/React.createElement("button", {
      className: "hl-btn",
      onClick: retry
    }, "Try again");
  }
  return /*#__PURE__*/React.createElement(LiveFrame, null, /*#__PURE__*/React.createElement("div", {
    className: "live-card"
  }, /*#__PURE__*/React.createElement("h1", null, title), /*#__PURE__*/React.createElement("p", null, body), /*#__PURE__*/React.createElement("div", {
    className: "live-acts"
  }, actions)));
}

/* ---------- account menu (replaces the demo's role switcher) ---------- */
function LiveAccount() {
  const {
    state
  } = useHL();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();
  React.useEffect(() => {
    const c = e => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", c);
    return () => document.removeEventListener("mousedown", c);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    className: "hl-role",
    ref: ref
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setOpen(!open),
    "aria-expanded": open
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: state.me.name,
    size: "sm"
  }), /*#__PURE__*/React.createElement("span", {
    className: "nm",
    style: {
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("small", null, LIVE_ROLE_NAME[state.role]), state.me.name)), open && /*#__PURE__*/React.createElement("div", {
    className: "hl-role-menu"
  }, /*#__PURE__*/React.createElement("a", {
    className: "item",
    href: LIVE_HOME
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "home",
    s: 17
  }), /*#__PURE__*/React.createElement("div", null, "Haaraya home")), /*#__PURE__*/React.createElement("button", {
    className: "item",
    onClick: async () => {
      await HLLive.signOut();
      location.reload();
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "back",
    s: 17
  }), /*#__PURE__*/React.createElement("div", null, "Sign out"))));
}

/* ---------- which app ---------- */
function LiveApp() {
  const {
    state
  } = useHL();
  const [pupil, setPupil] = React.useState(null);
  if (pupil && state.learners[pupil]) return /*#__PURE__*/React.createElement(LivePupil, {
    L: state.learners[pupil],
    onExit: () => setPupil(null)
  });
  if (state.role === "admin") return /*#__PURE__*/React.createElement(LiveAdmin, null);
  return /*#__PURE__*/React.createElement(LiveStaff, {
    openPupil: setPupil
  });
}
function LiveEmpty({
  title,
  body
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TopNav, {
    items: null
  }), /*#__PURE__*/React.createElement("main", {
    className: "live-gate"
  }, /*#__PURE__*/React.createElement("div", {
    className: "live-card"
  }, /*#__PURE__*/React.createElement("h1", null, title), /*#__PURE__*/React.createElement("p", null, body), /*#__PURE__*/React.createElement("div", {
    className: "live-acts"
  }, /*#__PURE__*/React.createElement("a", {
    className: "hl-btn",
    href: LIVE_HOME
  }, "Back to Haaraya")))));
}

/* ---------- teacher and school admin ---------- */
function LiveStaff({
  openPupil
}) {
  const {
    state,
    setClassScores,
    setClassLibrary
  } = useHL();
  const [classId, setClassId] = React.useState(state.classes[0] && state.classes[0].id);
  const [drawer, setDrawer] = React.useState(null);
  if (!state.schools.some(s => s.gemmanti)) return /*#__PURE__*/React.createElement(LiveEmpty, {
    title: "Gemmanti isn\u2019t part of your school\u2019s plan yet",
    body: "Ask your school to add Gemmanti, or contact Haaraya."
  });
  if (!state.classes.length) return /*#__PURE__*/React.createElement(LiveEmpty, {
    title: "No classes yet",
    body: state.role === "teacher" ? "You’ll see your class here once your school puts you in charge of one." : "Create a class and add pupils on your Haaraya school page, then come back."
  });
  const cls = state.classes.find(c => c.id === classId) || state.classes[0];
  const learners = hlClassLearners(state, cls.id);
  const school = state.schools.find(s => s.id === cls.schoolId);
  const toRecord = learners.filter(l => Object.values(l.worksheets || {}).some(r => r.status === "handed_in")).length;
  const v = state.route.view;
  const nav = [["teach", "Teach", "book"], ["worksheets", "Worksheets", "sheet", toRecord], ["pupils", "Pupils", "users"], ["reports", "Reports", "dl"]];
  const ctx = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, state.me.name), /*#__PURE__*/React.createElement("span", null, school ? school.name : "")), state.classes.length > 1 ? /*#__PURE__*/React.createElement("select", {
    value: cls.id,
    onChange: e => setClassId(e.target.value),
    "aria-label": "Class"
  }, state.classes.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.name))) : /*#__PURE__*/React.createElement("div", {
    className: "live-cls"
  }, cls.name), state.role === "teacher" && cls.teacherId === state.me.id && /*#__PURE__*/React.createElement("label", {
    className: "live-scores"
  }, /*#__PURE__*/React.createElement("button", {
    className: "live-switch" + (cls.showScores ? " on" : ""),
    role: "switch",
    "aria-checked": cls.showScores,
    onClick: () => setClassScores(cls.id, !cls.showScores)
  }, /*#__PURE__*/React.createElement("i", null)), /*#__PURE__*/React.createElement("span", null, "Show scores")), state.role === "teacher" && cls.teacherId === state.me.id && /*#__PURE__*/React.createElement("label", {
    className: "live-scores"
  }, /*#__PURE__*/React.createElement("button", {
    className: "live-switch" + (cls.showLibrary ? " on" : ""),
    role: "switch",
    "aria-checked": !!cls.showLibrary,
    onClick: () => setClassLibrary(cls.id, !cls.showLibrary)
  }, /*#__PURE__*/React.createElement("i", null)), /*#__PURE__*/React.createElement("span", null, "Library for pupils")));
  return /*#__PURE__*/React.createElement(AdultShell, {
    nav: nav,
    ctx: ctx
  }, v === "teach" && /*#__PURE__*/React.createElement(TTeach, {
    cls: cls
  }), v !== "pupils" && v !== "reports" && v !== "teach" && /*#__PURE__*/React.createElement(TWorksheets, {
    key: cls.id,
    cls: cls,
    learners: learners,
    showScores: cls.showScores
  }), v === "reports" && /*#__PURE__*/React.createElement(LiveReports, {
    key: cls.id,
    cls: cls,
    school: school,
    learners: learners
  }), v === "pupils" && /*#__PURE__*/React.createElement(LivePupils, {
    cls: cls,
    learners: learners,
    openPupil: openPupil,
    openRecords: setDrawer
  }), drawer && state.learners[drawer] && /*#__PURE__*/React.createElement(Drawer, {
    onClose: () => setDrawer(null)
  }, /*#__PURE__*/React.createElement("div", {
    className: "live-drawer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ws-rev-h"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: state.learners[drawer].name,
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, state.learners[drawer].name), /*#__PURE__*/React.createElement("p", null, cls.name))), /*#__PURE__*/React.createElement(LibReading, {
    L: state.learners[drawer]
  }), /*#__PURE__*/React.createElement(PupilLogin, {
    L: state.learners[drawer]
  }), /*#__PURE__*/React.createElement(WsRecordList, {
    L: state.learners[drawer]
  }))));
}
function LivePupils({
  cls,
  learners,
  openPupil,
  openRecords
}) {
  const [cards, setCards] = React.useState(false);
  const list = learners.slice().sort((a, b) => a.name.localeCompare(b.name));
  const count = (l, s) => Object.values(l.worksheets || {}).filter(r => r.status === s).length;
  if (cards) return /*#__PURE__*/React.createElement(LoginCards, {
    cls: cls,
    list: list,
    back: () => setCards(false)
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Pupils"), /*#__PURE__*/React.createElement("p", null, cls.name, " \xB7 ", list.length, " pupil", list.length === 1 ? "" : "s")), list.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "acts"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    onClick: () => setCards(true)
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "key",
    s: 16
  }), "Login cards"))), !list.length ? /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "No pupils in this class yet. Add them on your Haaraya school page.") : /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Pupil"), /*#__PURE__*/React.createElement("th", null, "Library reading"), /*#__PURE__*/React.createElement("th", null, "Family email"), /*#__PURE__*/React.createElement("th", {
    className: "c"
  }, "Working"), /*#__PURE__*/React.createElement("th", {
    className: "c"
  }, "To record"), /*#__PURE__*/React.createElement("th", {
    className: "c"
  }, "Recorded"), /*#__PURE__*/React.createElement("th", null))), /*#__PURE__*/React.createElement("tbody", null, list.map(l => /*#__PURE__*/React.createElement("tr", {
    key: l.id
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    className: "who linkish",
    onClick: () => openRecords(l.id)
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: l.name,
    size: "sm"
  }), l.name)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(LibLine, {
    L: l
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(FamilyEmail, {
    L: l
  })), /*#__PURE__*/React.createElement("td", {
    className: "c"
  }, count(l, "in_progress")), /*#__PURE__*/React.createElement("td", {
    className: "c"
  }, count(l, "handed_in")), /*#__PURE__*/React.createElement("td", {
    className: "c"
  }, count(l, "reviewed")), /*#__PURE__*/React.createElement("td", {
    className: "c"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn sm",
    onClick: () => openPupil(l.id)
  }, "Open as pupil")))))))));
}

/* One line of main-library reading for the pupils table. */
function LibLine({
  L
}) {
  const b = L.lib || {
    done: [],
    now: null
  };
  if (!b.done.length && !b.now) return /*#__PURE__*/React.createElement("span", {
    className: "lib-none"
  }, "Not started");
  return /*#__PURE__*/React.createElement("span", {
    className: "lib-line"
  }, /*#__PURE__*/React.createElement("b", null, b.done.length, " finished"), b.now && /*#__PURE__*/React.createElement("span", null, "Reading ", /*#__PURE__*/React.createElement("i", null, b.now.title), b.now.page ? `, page ${b.now.page}` : ""));
}

/* Reading in the main Haaraya library, for the pupil's record drawer. */
function LibReading({
  L
}) {
  const b = L.lib || {
    done: [],
    now: null,
    checks: {}
  };
  const check = code => {
    const c = b.checks[code];
    return c && c.total ? `${c.score}/${c.total}` : "—";
  };
  const date = t => t ? new Date(t).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short"
  }) : "";
  return /*#__PURE__*/React.createElement("section", {
    className: "lib-rec"
  }, /*#__PURE__*/React.createElement("h3", null, "Library reading"), !b.done.length && !b.now && /*#__PURE__*/React.createElement("p", {
    className: "ws-hint"
  }, "No books read in the Haaraya library yet. Reading shows here once ", L.name.split(" ")[0], " signs in with their own login."), b.now && /*#__PURE__*/React.createElement("p", {
    className: "lib-now"
  }, "Reading now: ", /*#__PURE__*/React.createElement("b", null, b.now.title), " \xB7 Level ", b.now.level, b.now.page ? ` · page ${b.now.page}` : ""), b.done.length > 0 && /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Finished"), /*#__PURE__*/React.createElement("th", {
    className: "c"
  }, "Level"), /*#__PURE__*/React.createElement("th", {
    className: "c"
  }, "Reading check"), /*#__PURE__*/React.createElement("th", {
    className: "c"
  }, "Date"))), /*#__PURE__*/React.createElement("tbody", null, b.done.map(x => /*#__PURE__*/React.createElement("tr", {
    key: x.code
  }, /*#__PURE__*/React.createElement("td", null, x.title), /*#__PURE__*/React.createElement("td", {
    className: "c"
  }, x.level || "—"), /*#__PURE__*/React.createElement("td", {
    className: "c"
  }, check(x.code)), /*#__PURE__*/React.createElement("td", {
    className: "c"
  }, date(x.when)))))));
}

/* The pupil's own login, with Reset PIN. */
function PupilLogin({
  L
}) {
  const {
    ensureLogins,
    resetPin,
    toast
  } = useHL();
  const [busy, setBusy] = React.useState(false);
  const run = async fn => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      console.warn(e);
      toast(e.message || "Couldn’t do that. Try again.");
    }
    setBusy(false);
  };
  const lg = L.login;
  return /*#__PURE__*/React.createElement("section", {
    className: "lib-rec"
  }, /*#__PURE__*/React.createElement("h3", null, "Pupil login"), lg ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "login-line"
  }, "Username ", /*#__PURE__*/React.createElement("b", null, lg.username), " \xB7 PIN ", /*#__PURE__*/React.createElement("b", null, lg.pin), lg.locked && /*#__PURE__*/React.createElement("span", {
    className: "login-locked"
  }, " \xB7 locked after too many tries")), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost sm",
    disabled: busy,
    onClick: () => run(async () => {
      await resetPin(L.id);
      toast("New PIN made. Give " + L.name.split(" ")[0] + " a new login card.");
    })
  }, busy ? "Working…" : "Reset PIN")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "ws-hint"
  }, "No login yet."), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn sm",
    disabled: busy,
    onClick: () => run(async () => {
      await ensureLogins([L.id]);
      toast("Login made");
    })
  }, busy ? "Working…" : "Make login")));
}

/* Printable login cards: 8 per A4 sheet. The QR code opens the pupil sign-in
   with the username filled in; the pupil (or a grown-up) types the PIN. */
function LoginCards({
  cls,
  list,
  back
}) {
  const {
    ensureLogins,
    toast
  } = useHL();
  const [busy, setBusy] = React.useState(false);
  const missing = list.filter(l => !l.login);
  const make = async () => {
    setBusy(true);
    try {
      const res = await ensureLogins(missing.map(l => l.id));
      const bad = res.filter(r => r.error).length;
      toast(bad ? `Made ${res.length - bad} logins. ${bad} couldn’t be made.` : `Made ${res.length} login${res.length === 1 ? "" : "s"}`);
    } catch (e) {
      console.warn(e);
      toast(e.message || "Couldn’t make logins. Try again.");
    }
    setBusy(false);
  };
  const ready = list.filter(l => l.login);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h no-print"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Login cards"), /*#__PURE__*/React.createElement("p", null, cls.name, " \xB7 cut out one card for each pupil")), /*#__PURE__*/React.createElement("div", {
    className: "acts"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost",
    onClick: back
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "back",
    s: 16
  }), "Pupils"), ready.length > 0 && /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    onClick: () => window.print()
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "dl",
    s: 16
  }), "Print cards"))), missing.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "card mail-panel no-print"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, missing.length === list.length ? "No pupil in this class has a login yet." : `${missing.map(l => l.name.split(" ")[0]).join(", ")} ${missing.length === 1 ? "has" : "have"} no login yet.`), " Each pupil gets a username and a 4-number PIN."), /*#__PURE__*/React.createElement("div", {
    className: "live-acts"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    disabled: busy,
    onClick: make
  }, busy ? "Making logins…" : `Make ${missing.length} login${missing.length === 1 ? "" : "s"}`))), /*#__PURE__*/React.createElement("p", {
    className: "ws-hint no-print"
  }, "Keep the cards safe: anyone with a card can read as that pupil. If a card is lost, open the pupil and choose Reset PIN."), /*#__PURE__*/React.createElement("div", {
    className: "lc-grid"
  }, ready.map(l => /*#__PURE__*/React.createElement(LoginCard, {
    key: l.id,
    L: l,
    cls: cls
  }))));
}
function lcLink(username) {
  try {
    return new URL("../Haaraya%20Home.html?pupil=" + encodeURIComponent(username), location.href).href;
  } catch (e) {
    return "";
  }
}
function LoginCard({
  L,
  cls
}) {
  const qr = React.useMemo(() => {
    try {
      const q = qrcode(0, "M");
      q.addData(lcLink(L.login.username));
      q.make();
      return q.createSvgTag({
        cellSize: 3,
        margin: 0,
        scalable: true
      });
    } catch (e) {
      return "";
    }
  }, [L.login.username]);
  return /*#__PURE__*/React.createElement("div", {
    className: "lc-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lc-top"
  }, /*#__PURE__*/React.createElement("img", {
    src: "../assets/logo-haaraya-literacy.png",
    alt: "Haaraya Literacy"
  }), /*#__PURE__*/React.createElement("span", null, "Pupil login")), /*#__PURE__*/React.createElement("div", {
    className: "lc-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lc-who"
  }, /*#__PURE__*/React.createElement("b", null, L.name), /*#__PURE__*/React.createElement("span", null, cls.name), /*#__PURE__*/React.createElement("dl", null, /*#__PURE__*/React.createElement("dt", null, "Username"), /*#__PURE__*/React.createElement("dd", null, L.login.username), /*#__PURE__*/React.createElement("dt", null, "PIN"), /*#__PURE__*/React.createElement("dd", {
    className: "lc-pin"
  }, L.login.pin))), qr && /*#__PURE__*/React.createElement("div", {
    className: "lc-qr",
    dangerouslySetInnerHTML: {
      __html: qr
    }
  })), /*#__PURE__*/React.createElement("p", {
    className: "lc-how"
  }, "Scan the code, or go to Haaraya and tap ", /*#__PURE__*/React.createElement("b", null, "Sign in"), ", then ", /*#__PURE__*/React.createElement("b", null, "I\u2019m a pupil"), ". Type your username and PIN."));
}

/* One family email per school pupil, used to send reports. */
function FamilyEmail({
  L
}) {
  const {
    setFamilyEmail,
    toast
  } = useHL();
  const [edit, setEdit] = React.useState(false);
  const [v, setV] = React.useState(L.familyEmail || "");
  const [busy, setBusy] = React.useState(false);
  const save = async () => {
    const t = v.trim();
    if (t && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)) {
      toast("That email address doesn’t look right.");
      return;
    }
    setBusy(true);
    try {
      await setFamilyEmail(L.id, t);
      setEdit(false);
      toast(t ? "Family email saved" : "Family email removed");
    } catch (e) {
      console.warn(e);
      toast("Couldn’t save. Try again.");
    }
    setBusy(false);
  };
  if (!edit) return /*#__PURE__*/React.createElement("button", {
    className: "fam-email linkish",
    onClick: () => {
      setV(L.familyEmail || "");
      setEdit(true);
    }
  }, L.familyEmail ? L.familyEmail : /*#__PURE__*/React.createElement("span", {
    className: "ws-hint"
  }, "Add email"));
  return /*#__PURE__*/React.createElement("form", {
    className: "fam-edit",
    onSubmit: e => {
      e.preventDefault();
      save();
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "hl-input",
    type: "email",
    value: v,
    onChange: e => setV(e.target.value),
    placeholder: "family@example.com",
    "aria-label": `Family email for ${L.name}`,
    autoFocus: true,
    disabled: busy
  }), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn sm",
    type: "submit",
    disabled: busy
  }, "Save"), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost sm",
    type: "button",
    onClick: () => setEdit(false),
    disabled: busy
  }, "Cancel"));
}

/* ---------- reports for families: print, save as PDF, or email ---------- */
const REP_SECS = [["wf", "Word Focus"], ["ra", "Read It Again"], ["ta", "Think About It"], ["sw", "Show What You Know"]];
function LiveReports({
  cls,
  school,
  learners
}) {
  const list = learners.slice().sort((a, b) => a.name.localeCompare(b.name));
  const [who, setWho] = React.useState("all");
  const shown = who === "all" ? list : list.filter(l => l.id === who);
  const [mail, setMail] = React.useState(null); // null | "confirm" | "sending" | {result}
  const recorded = l => Object.values(l.worksheets || {}).some(r => r.status === "reviewed");
  const ready = shown.filter(recorded);
  const withEmail = ready.filter(l => l.familyEmail),
    without = ready.filter(l => !l.familyEmail);
  const nothing = shown.filter(l => !recorded(l));
  const first = n => n.split(" ")[0];
  const send = async () => {
    setMail("sending");
    try {
      setMail({
        result: await HLLive.emailReports(cls.id, withEmail.map(l => l.id))
      });
    } catch (e) {
      console.warn("Email reports failed", e);
      setMail({
        error: true
      });
    }
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h no-print"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Reports"), /*#__PURE__*/React.createElement("p", null, cls.name)), /*#__PURE__*/React.createElement("div", {
    className: "acts"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost",
    onClick: () => setMail("confirm"),
    disabled: !shown.length
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "send",
    s: 16
  }), "Email to ", shown.length === 1 ? "family" : "families"), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    onClick: () => window.print()
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "dl",
    s: 16
  }), "Print or save as PDF"))), mail && /*#__PURE__*/React.createElement("div", {
    className: "card mail-panel no-print"
  }, mail === "confirm" && /*#__PURE__*/React.createElement(React.Fragment, null, withEmail.length ? /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "Send ", withEmail.length === 1 ? `${first(withEmail[0].name)}’s report to their family` : `${withEmail.length} reports, one to each family`, "?"), cls.showScores ? " Scores are included." : " Scores are not included.") : /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, ready.length ? "No family emails for these pupils yet." : "No worksheets recorded yet."), ready.length ? " Add them on the Pupils page." : " Reports go out once a worksheet has been recorded."), without.length > 0 && withEmail.length > 0 && /*#__PURE__*/React.createElement("p", {
    className: "ws-hint"
  }, "No family email for ", without.map(l => first(l.name)).join(", "), ". Add it on the Pupils page."), nothing.length > 0 && ready.length > 0 && /*#__PURE__*/React.createElement("p", {
    className: "ws-hint"
  }, "Nothing recorded yet for ", nothing.map(l => first(l.name)).join(", "), ", so no report for them."), /*#__PURE__*/React.createElement("div", {
    className: "live-acts"
  }, withEmail.length > 0 && /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    onClick: send
  }, "Send"), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost",
    onClick: () => setMail(null)
  }, withEmail.length ? "Cancel" : "Close"))), mail === "sending" && /*#__PURE__*/React.createElement("p", null, "Sending\u2026"), mail && mail.result && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, mail.result.sent ? `Sent to ${mail.result.sent} ${mail.result.sent === 1 ? "family" : "families"}.` : "Nothing was sent.")), mail.result.failed && mail.result.failed.length > 0 && /*#__PURE__*/React.createElement("p", {
    className: "ws-hint"
  }, "Couldn\u2019t send for ", mail.result.failed.map(first).join(", "), ". Check the address and try again."), /*#__PURE__*/React.createElement("div", {
    className: "live-acts"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost",
    onClick: () => setMail(null)
  }, "Done"))), mail && mail.error && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "Couldn\u2019t send the reports."), " Check your connection and try again."), /*#__PURE__*/React.createElement("div", {
    className: "live-acts"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost",
    onClick: () => setMail(null)
  }, "Close")))), /*#__PURE__*/React.createElement("div", {
    className: "filters no-print"
  }, /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: who,
    onChange: e => setWho(e.target.value),
    "aria-label": "Report for"
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "Whole class (", list.length, ")"), list.map(l => /*#__PURE__*/React.createElement("option", {
    key: l.id,
    value: l.id
  }, l.name)))), !list.length && /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "No pupils in this class yet."), /*#__PURE__*/React.createElement("div", {
    className: "rep-stack"
  }, shown.map(l => /*#__PURE__*/React.createElement(LiveReport, {
    key: l.id,
    L: l,
    cls: cls,
    school: school
  }))));
}
function LiveReport({
  L,
  cls,
  school
}) {
  const recs = Object.entries(L.worksheets || {}).filter(([c, r]) => HLWS.get(c) && r.status === "reviewed").sort(([a], [b]) => HLWS.get(a).level - HLWS.get(b).level || a.localeCompare(b));
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  return /*#__PURE__*/React.createElement("article", {
    className: "rep-page"
  }, /*#__PURE__*/React.createElement("header", {
    className: "rep-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "rep-eyebrow"
  }, "Haaraya Literacy \xB7 Worksheet report"), /*#__PURE__*/React.createElement("h2", null, L.name), /*#__PURE__*/React.createElement("p", null, [cls.name, school && school.name].filter(Boolean).join(" · "))), /*#__PURE__*/React.createElement("div", {
    className: "rep-date"
  }, today)), recs.length ? /*#__PURE__*/React.createElement("table", {
    className: "rep-tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Worksheet"), REP_SECS.map(([k, n]) => /*#__PURE__*/React.createElement("th", {
    key: k
  }, n)), /*#__PURE__*/React.createElement("th", null, "Help"), cls.showScores && /*#__PURE__*/React.createElement("th", null, "Score"))), /*#__PURE__*/React.createElement("tbody", null, recs.map(([c, r]) => {
    const w = HLWS.get(c);
    return /*#__PURE__*/React.createElement("tr", {
      key: c
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, w.title), /*#__PURE__*/React.createElement("span", null, "Level ", w.level, " \xB7 ", w.strand)), REP_SECS.map(([k]) => /*#__PURE__*/React.createElement("td", {
      key: k
    }, r.ratings && r.ratings[k] ? HLWS.RATINGS[r.ratings[k]] : "—")), /*#__PURE__*/React.createElement("td", null, r.help ? HLWS.HELP[r.help] : "—"), cls.showScores && /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, hlScoreText(hlWsScore(r, c))));
  }))) : /*#__PURE__*/React.createElement("p", {
    className: "rep-none"
  }, "No worksheets recorded yet."), /*#__PURE__*/React.createElement("footer", {
    className: "rep-f"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "What the words mean."), " Not Yet: cannot do it yet. Developing: partly right, or not yet reliable. Secure: does it accurately. Beyond: uses it in something new. Not observed: the teacher did not see enough of this part to judge."), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("b", null, "Help"), " shows the most help your child needed: Modelled (the teacher showed how), Prompted (a hint), or Independent (no help).", cls.showScores ? " The score counts every answer: right 1, partly right ½, not yet 0. ★ marks work beyond the book." : "")));
}

/* ---------- pupil (on a teacher's device) ---------- */
function LivePupil({
  L,
  onExit
}) {
  const {
    state,
    go
  } = useHL();
  const r = state.route;
  const v = r.view;
  const cls = state.classes.find(c => c.id === L.classId);
  const lib = !!(cls && cls.showLibrary);
  const inWs = v === "worksheet" && r.code;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("header", {
    className: "hl-top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hl-brand"
  }, /*#__PURE__*/React.createElement("img", {
    className: "hl-logo",
    src: "assets/logo-gemmanti.png",
    alt: "Gemmanti"
  })), /*#__PURE__*/React.createElement("div", {
    className: "hl-spacer"
  }), lib && v !== "library" && /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost sm live-libbtn",
    onClick: () => go("library", {
      from: inWs ? r.code : null
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "book",
    s: 16
  }), "Library"), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost sm",
    onClick: () => {
      go("worksheets");
      onExit();
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "back",
    s: 16
  }), "Finish")), /*#__PURE__*/React.createElement("main", {
    className: "kid"
  }, inWs ? /*#__PURE__*/React.createElement(WorksheetPlayer, {
    key: r.code,
    L: L,
    code: r.code
  }) : v === "library" && lib ? /*#__PURE__*/React.createElement(LiveLibrary, {
    L: L,
    from: r.from
  }) : /*#__PURE__*/React.createElement(LiveShelf, {
    L: L
  })), v === "library" && lib && r.read && /*#__PURE__*/React.createElement(LiveReader, {
    code: r.read,
    title: r.title,
    close: () => go("library", {
      from: r.from
    }),
    toWorksheet: HLWS.get(r.from || r.read) ? () => go("worksheet", {
      code: r.from || r.read
    }) : null,
    back: !!r.from
  }));
}

/* The Haaraya library, opened from a worksheet when the teacher allows it. */
function LiveLibrary({
  L,
  from
}) {
  const {
    go
  } = useHL();
  const [list, setList] = React.useState(null);
  const [err, setErr] = React.useState(false);
  const [lvl, setLvl] = React.useState(() => {
    const w = from && HLWS.get(from);
    return w && w.level || L.level || 0;
  });
  const [q, setQ] = React.useState("");
  React.useEffect(() => {
    HLLive.books().then(setList).catch(() => setErr(true));
  }, []);
  const levels = list ? Array.from(new Set(list.map(b => b.l).filter(Boolean))).sort((a, b) => a - b) : [];
  const shown = (list || []).filter(b => (!lvl || b.l === lvl) && (!q || b.t.toLowerCase().includes(q.toLowerCase())));
  const back = from && HLWS.get(from);
  return /*#__PURE__*/React.createElement("div", {
    className: "kid-wrap"
  }, back && /*#__PURE__*/React.createElement("button", {
    className: "back",
    onClick: () => go("worksheet", {
      code: from
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "back"
  }), "Back to my worksheet"), /*#__PURE__*/React.createElement("h1", null, "Library"), err ? /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "The library couldn\u2019t load. Check the connection and try again.") : !list ? /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "Loading books\u2026") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "lib-bar"
  }, /*#__PURE__*/React.createElement("label", {
    className: "search"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "search",
    s: 20
  }), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Search by title",
    "aria-label": "Search books"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "lvl-strip"
  }, /*#__PURE__*/React.createElement("button", {
    className: "chip" + (!lvl ? " on" : ""),
    onClick: () => setLvl(0)
  }, "All levels"), levels.map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    className: "chip" + (lvl === n ? " on" : ""),
    onClick: () => setLvl(n)
  }, "Level ", n))), shown.length ? /*#__PURE__*/React.createElement("div", {
    className: "live-shelf"
  }, shown.map(b => /*#__PURE__*/React.createElement("button", {
    key: b.id,
    className: "live-book",
    onClick: () => go("library", {
      from,
      read: b.id,
      title: b.t
    })
  }, /*#__PURE__*/React.createElement(Cover, {
    book: b
  }), /*#__PURE__*/React.createElement("b", null, b.t), /*#__PURE__*/React.createElement("span", null, "Level ", b.l, HLWS.get(b.id) ? " · Worksheet" : "")))) : /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "No books match. Try another level or clear the search.")));
}
function LiveReader({
  code,
  title,
  close,
  toWorksheet,
  back
}) {
  const [pg, setPg] = React.useState(null);
  const [err, setErr] = React.useState(false);
  const [p, setP] = React.useState(0);
  React.useEffect(() => {
    HLWS.pages(code).then(setPg).catch(() => setErr(true));
  }, [code]);
  const n = pg ? pg.length : 0;
  React.useEffect(() => {
    const k = e => {
      if (e.key === "ArrowRight") setP(x => Math.min(n - 1, x + 1));
      if (e.key === "ArrowLeft") setP(x => Math.max(0, x - 1));
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [n]);
  const cur = pg && pg[p];
  return /*#__PURE__*/React.createElement("div", {
    className: "reader",
    role: "dialog",
    "aria-label": title
  }, /*#__PURE__*/React.createElement("div", {
    className: "reader-top"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost sm",
    onClick: close
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "x",
    s: 16
  }), "Close"), /*#__PURE__*/React.createElement("b", null, title), toWorksheet && /*#__PURE__*/React.createElement("button", {
    className: "hl-btn sm",
    style: {
      marginLeft: "auto"
    },
    onClick: toWorksheet
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "sheet",
    s: 16
  }), back ? "Back to my worksheet" : "Do the worksheet")), /*#__PURE__*/React.createElement("div", {
    className: "reader-stage"
  }, /*#__PURE__*/React.createElement("button", {
    className: "reader-nav p",
    disabled: p === 0,
    onClick: () => setP(p - 1),
    "aria-label": "Previous page"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "back",
    s: 26
  })), /*#__PURE__*/React.createElement("div", {
    className: "reader-page"
  }, cur ? /*#__PURE__*/React.createElement("div", {
    className: "rd-live"
  }, /*#__PURE__*/React.createElement("img", {
    src: cur.img,
    alt: `Page ${p + 1}`
  }), /*#__PURE__*/React.createElement("p", null, cur.text)) : /*#__PURE__*/React.createElement("div", {
    className: "ph"
  }, err || pg && !n ? "This book couldn’t open. Try another book." : "Loading…")), /*#__PURE__*/React.createElement("button", {
    className: "reader-nav n",
    disabled: !n || p >= n - 1,
    onClick: () => setP(p + 1),
    "aria-label": "Next page"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "next",
    s: 26
  }))), /*#__PURE__*/React.createElement("div", {
    className: "reader-foot"
  }, /*#__PURE__*/React.createElement("span", null, n ? `Page ${p + 1} of ${n}` : ""), /*#__PURE__*/React.createElement(Bar, {
    v: n ? (p + 1) / n * 100 : 0
  })));
}
function LiveShelf({
  L
}) {
  const {
    go
  } = useHL();
  const label = {
    not_started: "",
    in_progress: "Not finished yet",
    handed_in: "Handed in",
    reviewed: "Your teacher has looked at it"
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "kid-h"
  }, /*#__PURE__*/React.createElement("h1", null, "Hello, ", L.name.split(" ")[0], "!"), /*#__PURE__*/React.createElement("p", null, "Pick a worksheet.")), /*#__PURE__*/React.createElement("div", {
    className: "live-shelf"
  }, HLWS.list().map(w => {
    const r = hlWsRec(L, w.code);
    return /*#__PURE__*/React.createElement("button", {
      key: w.code,
      className: "live-book",
      onClick: () => go("worksheet", {
        code: w.code
      })
    }, /*#__PURE__*/React.createElement(Cover, {
      book: hlBook(w.code),
      done: r.status === "reviewed" || r.status === "handed_in"
    }), /*#__PURE__*/React.createElement("b", null, w.title), /*#__PURE__*/React.createElement("span", null, "Level ", w.level, label[r.status] ? " · " + label[r.status] : ""));
  })));
}

/* ---------- Haaraya admin: who has Gemmanti ---------- */
function LiveAdmin() {
  const {
    state,
    toast
  } = useHL();
  const [schools, setSchools] = React.useState(state.schools);
  const [busy, setBusy] = React.useState(null);
  const [q, setQ] = React.useState("");
  const flip = async s => {
    setBusy(s.id);
    try {
      const addons = await HLLive.setGemmanti(s.sub, !s.gemmanti);
      setSchools(list => list.map(x => x.id === s.id ? {
        ...x,
        gemmanti: addons.includes("gemmanti"),
        sub: {
          ...x.sub,
          addons
        }
      } : x));
      toast(!s.gemmanti ? `Gemmanti is on for ${s.name}` : `Gemmanti is off for ${s.name}`);
    } catch (e) {
      console.warn(e);
      toast("Couldn’t change it. Try again.");
    }
    setBusy(null);
  };
  const shown = schools.filter(s => !q || s.name.toLowerCase().includes(q.toLowerCase()));
  const on = schools.filter(s => s.gemmanti).length;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TopNav, {
    items: null
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--cream)",
      minHeight: "calc(100vh - var(--top-h))"
    }
  }, /*#__PURE__*/React.createElement("main", {
    className: "main",
    style: {
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Schools"), /*#__PURE__*/React.createElement("p", null, on, " of ", schools.length, " have Gemmanti"))), /*#__PURE__*/React.createElement("div", {
    className: "filters"
  }, /*#__PURE__*/React.createElement("input", {
    className: "hl-input",
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Search schools",
    "aria-label": "Search schools"
  })), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "School"), /*#__PURE__*/React.createElement("th", null, "Type"), /*#__PURE__*/React.createElement("th", null, "Place"), /*#__PURE__*/React.createElement("th", null, "Plan"), /*#__PURE__*/React.createElement("th", {
    className: "c"
  }, "Gemmanti"))), /*#__PURE__*/React.createElement("tbody", null, shown.map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.id
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, s.name)), /*#__PURE__*/React.createElement("td", {
    style: {
      textTransform: "capitalize"
    }
  }, (s.type || "").replace(/_/g, " ")), /*#__PURE__*/React.createElement("td", null, [s.city, s.country].filter(Boolean).join(", ")), /*#__PURE__*/React.createElement("td", null, s.sub ? s.sub.status : "No plan"), /*#__PURE__*/React.createElement("td", {
    className: "c"
  }, s.sub ? /*#__PURE__*/React.createElement("button", {
    className: "live-switch" + (s.gemmanti ? " on" : ""),
    role: "switch",
    "aria-checked": s.gemmanti,
    "aria-label": `Gemmanti for ${s.name}`,
    disabled: busy === s.id,
    onClick: () => flip(s)
  }, /*#__PURE__*/React.createElement("i", null)) : /*#__PURE__*/React.createElement("span", {
    className: "ws-hint"
  }, "Needs a plan")))), !shown.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: 5
  }, /*#__PURE__*/React.createElement("div", {
    className: "empty",
    style: {
      border: 0
    }
  }, "No schools found."))))))))));
}
Object.assign(window, {
  LiveGate,
  LiveApp,
  LiveAccount
});