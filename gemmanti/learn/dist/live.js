/* Gemmanti — live screens: sign-in gate, staff, parent, pupil and Haaraya admin.
   They reuse the worksheet screens; anything without real data behind it yet
   (lessons, journeys, reports, requests) is left out. */
const LIVE_HOME = "../Haaraya%20Home.html";
const LIVE_LOGIN = "../Haaraya%20Login.html?next=" + encodeURIComponent("gemmanti/Gemmanti.html");
const LIVE_ROLE_NAME = {
  teacher: "Teacher",
  school: "School admin",
  parent: "Parent",
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
    src: "assets/haaraya-emblem.png",
    alt: ""
  }), /*#__PURE__*/React.createElement("b", null, "Gemmanti")), /*#__PURE__*/React.createElement("div", {
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
    body = "Use your Haaraya account. Teachers, school admins and parents can sign in here.";
    actions = /*#__PURE__*/React.createElement("a", {
      className: "hl-btn big",
      href: LIVE_LOGIN
    }, "Sign in");
  } else if (r.unsupported) {
    title = "Gemmanti is for schools and families";
    body = "This account can’t use Gemmanti. Sign in as a teacher, school admin or parent.";
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
  if (state.role === "parent") return /*#__PURE__*/React.createElement(LiveParent, {
    openPupil: setPupil
  });
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
    state
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
  const nav = [["worksheets", "Worksheets", "sheet", toRecord], ["pupils", "Pupils", "users"]];
  const ctx = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, state.me.name), /*#__PURE__*/React.createElement("span", null, school ? school.name : "")), state.classes.length > 1 ? /*#__PURE__*/React.createElement("select", {
    value: cls.id,
    onChange: e => setClassId(e.target.value),
    "aria-label": "Class"
  }, state.classes.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.name))) : /*#__PURE__*/React.createElement("div", {
    className: "live-cls"
  }, cls.name));
  return /*#__PURE__*/React.createElement(AdultShell, {
    nav: nav,
    ctx: ctx
  }, v !== "pupils" && /*#__PURE__*/React.createElement(TWorksheets, {
    key: cls.id,
    cls: cls,
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
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", null, state.learners[drawer].name), /*#__PURE__*/React.createElement("p", null, cls.name))), /*#__PURE__*/React.createElement(WsRecordList, {
    L: state.learners[drawer]
  }))));
}
function LivePupils({
  cls,
  learners,
  openPupil,
  openRecords
}) {
  const list = learners.slice().sort((a, b) => a.name.localeCompare(b.name));
  const count = (l, s) => Object.values(l.worksheets || {}).filter(r => r.status === s).length;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Pupils"), /*#__PURE__*/React.createElement("p", null, cls.name, " \xB7 ", list.length, " pupil", list.length === 1 ? "" : "s"))), !list.length ? /*#__PURE__*/React.createElement("div", {
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
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Pupil"), /*#__PURE__*/React.createElement("th", {
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
  }), l.name)), /*#__PURE__*/React.createElement("td", {
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

/* ---------- parent ---------- */
function LiveParent({
  openPupil
}) {
  const {
    state
  } = useHL();
  const kids = Object.values(state.learners).sort((a, b) => a.name.localeCompare(b.name));
  const [cid, setCid] = React.useState(kids[0] && kids[0].id);
  if (!kids.length) return /*#__PURE__*/React.createElement(LiveEmpty, {
    title: "Gemmanti isn\u2019t available for your children yet",
    body: "Gemmanti comes through your child\u2019s school. When their school adds it, you\u2019ll see their worksheets here."
  });
  const L = state.learners[cid] || kids[0];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TopNav, {
    items: null
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--cream)",
      minHeight: "calc(100vh - 64px)"
    }
  }, /*#__PURE__*/React.createElement("main", {
    className: "main",
    style: {
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, state.me.name), /*#__PURE__*/React.createElement("p", null, "Your children\u2019s worksheets"))), kids.length > 1 && /*#__PURE__*/React.createElement("div", {
    className: "child-pick",
    style: {
      marginBottom: 18
    }
  }, kids.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.id,
    className: L.id === c.id ? "on" : "",
    onClick: () => setCid(c.id)
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: c.name
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, c.name))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, L.name.split(" ")[0], "\u2019s worksheets"), /*#__PURE__*/React.createElement("p", null, "What the teacher saw, section by section. Haaraya does not turn these into scores.")), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    onClick: () => openPupil(L.id)
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "sheet",
    s: 16
  }), "Do a worksheet")), /*#__PURE__*/React.createElement(WsRecordList, {
    L: L,
    family: true
  })))));
}

/* ---------- pupil (on a parent's or teacher's device) ---------- */
function LivePupil({
  L,
  onExit
}) {
  const {
    state,
    go
  } = useHL();
  const v = state.route.view;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("header", {
    className: "hl-top"
  }, /*#__PURE__*/React.createElement("span", {
    className: "hl-brand"
  }, /*#__PURE__*/React.createElement("img", {
    src: "assets/haaraya-emblem.png",
    alt: ""
  }), /*#__PURE__*/React.createElement("b", null, "Gemmanti")), /*#__PURE__*/React.createElement("div", {
    className: "hl-spacer"
  }), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost sm",
    onClick: () => {
      go(state.role === "parent" ? "home" : "worksheets");
      onExit();
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "back",
    s: 16
  }), "Finish")), /*#__PURE__*/React.createElement("main", {
    className: "kid"
  }, v === "worksheet" && state.route.code ? /*#__PURE__*/React.createElement(WorksheetPlayer, {
    key: state.route.code,
    L: L,
    code: state.route.code
  }) : /*#__PURE__*/React.createElement(LiveShelf, {
    L: L
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
      minHeight: "calc(100vh - 64px)"
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