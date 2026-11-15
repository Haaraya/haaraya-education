const TD = window.HL_DATA;
function AdultShell({
  nav,
  ctx,
  children
}) {
  const {
    state,
    go
  } = useHL();
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TopNav, {
    items: null
  }), /*#__PURE__*/React.createElement("div", {
    className: "adult"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "side"
  }, ctx && /*#__PURE__*/React.createElement("div", {
    className: "ctx"
  }, ctx), /*#__PURE__*/React.createElement("nav", null, nav.map(([v, l, i, cnt]) => /*#__PURE__*/React.createElement("button", {
    key: v,
    className: state.route.view === v ? "on" : "",
    onClick: () => go(v)
  }, /*#__PURE__*/React.createElement(Icon, {
    n: i,
    s: 17
  }), l, cnt ? /*#__PURE__*/React.createElement("span", {
    className: "cnt"
  }, cnt) : null)))), /*#__PURE__*/React.createElement("main", {
    className: "main"
  }, children)));
}
const dayLabel = d => d === 0 ? "Today" : d === 1 ? "Yesterday" : d >= 99 ? "Never" : `${d} days ago`;
function lessonCell(L, cls) {
  if (cls.id !== "p3i" && !L.lessons[TD.LESSON_ID]) return {
    st: null
  };
  const r = hlLessonRec(L);
  const a = hlLastAttempt(r);
  return {
    st: a && !a.pass ? "fail" : r.status,
    a
  };
}
function TeacherApp() {
  const {
    state,
    go
  } = useHL();
  const me = state.teachers.find(t => t.id === "t1");
  const [classId, setClassId] = React.useState("p3i");
  const [drawer, setDrawer] = React.useState(null);
  const [assign, setAssign] = React.useState(null);
  const cls = state.classes.find(c => c.id === classId);
  const learners = hlClassLearners(state, classId);
  const attention = learners.filter(l => hlFlags(l, cls).length);
  const v = state.route.view;
  const ctx = /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, me.name), /*#__PURE__*/React.createElement("span", null, "Greenfield Primary School")), /*#__PURE__*/React.createElement("select", {
    value: classId,
    onChange: e => setClassId(e.target.value),
    "aria-label": "Class"
  }, me.classes.map(id => {
    const c = state.classes.find(c => c.id === id);
    return /*#__PURE__*/React.createElement("option", {
      key: id,
      value: id
    }, c.name);
  })));
  const nav = [["overview", "Class overview", "home"], ["roster", "Learners", "users", attention.length], ["assignments", "Assigned learning", "clip"], ["worksheets", "Worksheets", "sheet", learners.filter(l => Object.values(l.worksheets || {}).some(r => r.status === "handed_in")).length], ["reports", "Reports", "chart"], ["requests", "Content requests", "flag"]];
  const props = {
    cls,
    learners,
    attention,
    openL: setDrawer,
    openAssign: setAssign
  };
  return /*#__PURE__*/React.createElement(AdultShell, {
    nav: nav,
    ctx: ctx
  }, (v === "overview" || !nav.find(n => n[0] === v)) && /*#__PURE__*/React.createElement(TOverview, props), v === "roster" && /*#__PURE__*/React.createElement(TRoster, props), v === "assignments" && /*#__PURE__*/React.createElement(TAssignments, props), v === "worksheets" && /*#__PURE__*/React.createElement(TWorksheets, props), v === "reports" && /*#__PURE__*/React.createElement(TReports, props), v === "requests" && /*#__PURE__*/React.createElement(TRequests, {
    me: me
  }), drawer && /*#__PURE__*/React.createElement(LearnerDrawer, {
    L: state.learners[drawer],
    cls: cls,
    onClose: () => setDrawer(null),
    onAssign: id => {
      setDrawer(null);
      setAssign({
        to: [id]
      });
    }
  }), assign && /*#__PURE__*/React.createElement(AssignModal, {
    cls: cls,
    learners: learners,
    preset: assign,
    onClose: () => setAssign(null)
  }));
}
function assignCounts(state, learners, a) {
  const tgt = learners.filter(l => a.to === "all" || a.to.includes(l.id));
  const c = {
    complete: 0,
    in_progress: 0,
    not_started: 0,
    n: tgt.length
  };
  tgt.forEach(l => c[hlAssignStatus(l, a)]++);
  return c;
}
function StackBar({
  c
}) {
  const p = k => c.n ? c[k] / c.n * 100 : 0;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: 10,
      borderRadius: 99,
      overflow: "hidden",
      background: "var(--sand)",
      minWidth: 140
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: p("complete") + "%",
      background: "var(--forest)"
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      width: p("in_progress") + "%",
      background: "var(--yellow-dk)"
    }
  }));
}
function TOverview({
  cls,
  learners,
  attention,
  openL,
  openAssign
}) {
  const {
    state,
    go
  } = useHL();
  const asg = state.assignments.filter(a => a.classId === cls.id);
  const active = learners.filter(l => l.lastActive <= 7).length;
  const scores = learners.map(l => hlAvgScore(l)).filter(x => x != null);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const lessonA = asg.find(a => a.type === "lesson");
  const lc = lessonA && assignCounts(state, learners, lessonA);
  const dist = TD.LEVELS.slice(0, 12).map(lv => learners.filter(l => l.level === lv.n).length);
  const lo = Math.max(0, cls.expected - 3),
    hi = Math.min(12, cls.expected + 3);
  const events = state.events.filter(e => e.classId === cls.id).slice(0, 7);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, cls.name), /*#__PURE__*/React.createElement("p", null, learners.length, " learners \xB7 Expected level L", cls.expected, " \xB7 Term 1, week 10")), /*#__PURE__*/React.createElement("div", {
    className: "acts"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    onClick: () => openAssign({})
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "plus",
    s: 16
  }), "Assign content"))), /*#__PURE__*/React.createElement("div", {
    className: "kpis"
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Active this week",
    value: `${active}/${learners.length}`,
    note: `${Math.round(active / learners.length * 100)}% participation`
  }), lc && /*#__PURE__*/React.createElement(Kpi, {
    label: `${lessonA.title} complete`,
    value: `${lc.complete}/${lc.n}`,
    note: `${lc.in_progress} in progress`
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Avg. check score",
    value: avg != null ? avg + "%" : "—",
    note: `${scores.length} learners assessed`
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "At or above level",
    value: `${learners.filter(l => l.level >= cls.expected).length}`,
    note: `of ${learners.length} at L${cls.expected}+`
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Need attention",
    value: attention.length,
    note: "See list",
    dir: attention.length ? "dn" : ""
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Assigned learning"), /*#__PURE__*/React.createElement("p", null, "Completion across the class")), /*#__PURE__*/React.createElement("div", {
    className: "legend"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    style: {
      background: "var(--forest)"
    }
  }), "Complete"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    style: {
      background: "var(--yellow-dk)"
    }
  }), "In progress"))), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Assignment"), /*#__PURE__*/React.createElement("th", null, "Due"), /*#__PURE__*/React.createElement("th", {
    style: {
      width: "34%"
    }
  }, "Progress"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Done"))), /*#__PURE__*/React.createElement("tbody", null, asg.map(a => {
    const c = assignCounts(state, learners, a);
    return /*#__PURE__*/React.createElement("tr", {
      key: a.id,
      className: "click",
      onClick: () => go("assignments")
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, a.title), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--ink-soft)",
        fontWeight: 700,
        textTransform: "capitalize"
      }
    }, a.type, a.to !== "all" ? ` · ${a.to.length} learners` : "")), /*#__PURE__*/React.createElement("td", null, new Date(a.due).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short"
    }), hlIsOverdue(a.due, c.complete >= c.n) && /*#__PURE__*/React.createElement(React.Fragment, null, " ", /*#__PURE__*/React.createElement(Overdue, null))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(StackBar, {
      c: c
    })), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, /*#__PURE__*/React.createElement("b", null, c.complete), "/", c.n));
  }), !asg.length && /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "4",
    style: {
      color: "var(--ink-soft)"
    }
  }, "Nothing assigned yet.")))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Needs attention"), /*#__PURE__*/React.createElement("p", null, "Below pass mark, inactive, or behind level"))), /*#__PURE__*/React.createElement("div", {
    className: "attn"
  }, attention.slice(0, 7).map(l => /*#__PURE__*/React.createElement("button", {
    key: l.id,
    onClick: () => openL(l.id)
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: l.name,
    size: "sm"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, l.name), /*#__PURE__*/React.createElement("div", {
    className: "fl"
  }, hlFlags(l, cls).map(f => /*#__PURE__*/React.createElement("span", {
    key: f,
    className: "flag"
  }, f)))), /*#__PURE__*/React.createElement(LevelTag, {
    l: l.level
  }))), !attention.length && /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--ink-soft)",
      fontSize: 14
    }
  }, "No learners flagged."), attention.length > 7 && /*#__PURE__*/React.createElement("button", {
    onClick: () => go("roster"),
    style: {
      gridTemplateColumns: "1fr",
      color: "var(--forest-dk)",
      fontWeight: 800
    }
  }, "View all ", attention.length)))), /*#__PURE__*/React.createElement("div", {
    className: "grid2",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Recent activity"), /*#__PURE__*/React.createElement("p", null, "Updates as learners work"))), /*#__PURE__*/React.createElement("div", {
    className: "feed"
  }, events.map((e, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: e.live ? "live" : ""
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, e.who), " ", e.text), /*#__PURE__*/React.createElement("time", null, e.at))), !events.length && /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--ink-soft)",
      fontSize: 14
    }
  }, "No activity yet."))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Reading levels"), /*#__PURE__*/React.createElement("p", null, "Learners per level \xB7 expected L", cls.expected, " highlighted"))), /*#__PURE__*/React.createElement(Bars, {
    data: dist.slice(lo, hi),
    labels: TD.LEVELS.slice(lo, hi).map(l => "L" + l.n),
    highlight: i => lo + i + 1 === cls.expected
  }))));
}
function TRoster({
  cls,
  learners,
  openL,
  openAssign
}) {
  const [q, setQ] = React.useState("");
  const [lvl, setLvl] = React.useState("all");
  const [st, setSt] = React.useState("all");
  const [flagOnly, setFlagOnly] = React.useState(false);
  const [sort, setSort] = React.useState({
    k: "name",
    d: 1
  });
  const rows = learners.map(l => ({
    l,
    lc: lessonCell(l, cls),
    avg: hlAvgScore(l),
    flags: hlFlags(l, cls)
  })).filter(r => (!q || r.l.name.toLowerCase().includes(q.toLowerCase())) && (lvl === "all" || r.l.level === +lvl) && (st === "all" || r.lc.st === st) && (!flagOnly || r.flags.length));
  const key = {
    name: r => r.l.name,
    level: r => r.l.level + r.l.levelPct / 100,
    score: r => r.avg ?? -1,
    books: r => r.l.booksDone.length,
    active: r => r.l.lastActive,
    status: r => r.lc.st || ""
  };
  rows.sort((a, b) => {
    const x = key[sort.k](a),
      y = key[sort.k](b);
    return (x > y ? 1 : x < y ? -1 : 0) * sort.d;
  });
  const Th = ({
    k,
    children,
    num
  }) => /*#__PURE__*/React.createElement("th", {
    className: "sort" + (num ? " num" : ""),
    onClick: () => setSort({
      k,
      d: sort.k === k ? -sort.d : 1
    })
  }, children, sort.k === k ? sort.d > 0 ? " ↑" : " ↓" : "");
  const levels = [...new Set(learners.map(l => l.level))].sort((a, b) => a - b);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Learners"), /*#__PURE__*/React.createElement("p", null, cls.name, " \xB7 click a learner for their full record")), /*#__PURE__*/React.createElement("div", {
    className: "acts"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost",
    onClick: () => csvDownload(`${cls.name} roster.csv`, [["Learner", "Level", "Level %", "Steps in Order", "Last score", "Books finished", "Last active", "Flags"], ...rows.map(r => [r.l.name, "L" + r.l.level, r.l.levelPct, r.lc.st || "", r.lc.a ? `${r.lc.a.score}/6` : "", r.l.booksDone.length, dayLabel(r.l.lastActive), r.flags.join("; ")])])
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "dl",
    s: 16
  }), "Export CSV"))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "filters"
  }, /*#__PURE__*/React.createElement("input", {
    className: "hl-input s",
    placeholder: "Search learners",
    value: q,
    onChange: e => setQ(e.target.value)
  }), /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: lvl,
    onChange: e => setLvl(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All levels"), levels.map(l => /*#__PURE__*/React.createElement("option", {
    key: l,
    value: l
  }, "L", l))), cls.id === "p3i" && /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: st,
    onChange: e => setSt(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "Steps in Order: any"), /*#__PURE__*/React.createElement("option", {
    value: "complete"
  }, "Complete"), /*#__PURE__*/React.createElement("option", {
    value: "in_progress"
  }, "In progress"), /*#__PURE__*/React.createElement("option", {
    value: "not_started"
  }, "Not started"), /*#__PURE__*/React.createElement("option", {
    value: "fail"
  }, "Below pass")), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      gap: 6,
      alignItems: "center",
      fontSize: 14,
      fontWeight: 700
    }
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: flagOnly,
    onChange: e => setFlagOnly(e.target.checked)
  }), "Needs attention only"), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 13,
      color: "var(--ink-soft)",
      fontWeight: 700
    }
  }, rows.length, " of ", learners.length)), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement(Th, {
    k: "name"
  }, "Learner"), /*#__PURE__*/React.createElement(Th, {
    k: "level"
  }, "Level"), cls.id === "p3i" && /*#__PURE__*/React.createElement(Th, {
    k: "status"
  }, "Steps in Order"), /*#__PURE__*/React.createElement(Th, {
    k: "score",
    num: true
  }, "Last score"), /*#__PURE__*/React.createElement(Th, {
    k: "books",
    num: true
  }, "Books"), /*#__PURE__*/React.createElement(Th, {
    k: "active"
  }, "Last active"), /*#__PURE__*/React.createElement("th", null, "Flags"), /*#__PURE__*/React.createElement("th", null))), /*#__PURE__*/React.createElement("tbody", null, rows.map(({
    l,
    lc,
    flags
  }) => /*#__PURE__*/React.createElement("tr", {
    key: l.id,
    className: "click" + (l.lastActive === 0 && state_isLive(l) ? " live" : ""),
    onClick: () => openL(l.id)
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "who"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: l.name,
    size: "sm"
  }), l.name)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "mini-bar"
  }, /*#__PURE__*/React.createElement(LevelTag, {
    l: l.level
  }), /*#__PURE__*/React.createElement(Bar, {
    v: l.levelPct
  }), /*#__PURE__*/React.createElement("span", null, l.levelPct, "%"))), cls.id === "p3i" && /*#__PURE__*/React.createElement("td", null, lc.st ? /*#__PURE__*/React.createElement(Status, {
    s: lc.st
  }) : "—"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, lc.a ? /*#__PURE__*/React.createElement("b", null, lc.a.score, "/6") : "—"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, l.booksDone.length), /*#__PURE__*/React.createElement("td", {
    style: {
      whiteSpace: "nowrap"
    }
  }, dayLabel(l.lastActive)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      flexWrap: "wrap"
    }
  }, flags.map(f => /*#__PURE__*/React.createElement("span", {
    key: f,
    className: "flag"
  }, f)))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn quiet sm",
    onClick: e => {
      e.stopPropagation();
      openAssign({
        to: [l.id]
      });
    }
  }, "Assign"))))))), !rows.length && /*#__PURE__*/React.createElement("div", {
    className: "empty",
    style: {
      marginTop: 12
    }
  }, "No learners match these filters.")));
}
const state_isLive = l => Object.values(l.lessons).some(r => r.attempts.some(a => a.date === "2026-10-26"));
function LearnerDrawer({
  L,
  cls,
  onClose,
  onAssign
}) {
  const rec = hlLessonRec(L);
  const reading = Object.entries(L.reading).filter(([, r]) => !r.done);
  const SK = [["phonics", "Phonics"], ["sight", "Sight words"], ["vocab", "Vocabulary"], ["comp", "Comprehension"], ["seq", "Sequencing"]];
  return /*#__PURE__*/React.createElement(Drawer, {
    onClose: onClose
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      alignItems: "center",
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: L.name,
    size: "lg"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 22,
      fontWeight: 900
    }
  }, L.name), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--ink-soft)",
      fontWeight: 700,
      fontSize: 14
    }
  }, cls.name, " \xB7 last active ", dayLabel(L.lastActive).toLowerCase())), /*#__PURE__*/React.createElement("button", {
    className: "x-btn",
    onClick: onClose,
    "aria-label": "Close"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "x"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      flexWrap: "wrap",
      marginBottom: 16
    }
  }, hlFlags(L, cls).map(f => /*#__PURE__*/React.createElement("span", {
    key: f,
    className: "flag"
  }, f))), /*#__PURE__*/React.createElement("div", {
    className: "kpis",
    style: {
      gridTemplateColumns: "repeat(3,1fr)"
    }
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Level",
    value: "L" + L.level,
    note: `${L.levelPct}% through`
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Books",
    value: L.booksDone.length,
    note: "finished"
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Avg. score",
    value: hlAvgScore(L) != null ? hlAvgScore(L) + "%" : "—"
  })), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Skills")), /*#__PURE__*/React.createElement("div", {
    className: "skills"
  }, SK.map(([k, n]) => /*#__PURE__*/React.createElement("div", {
    className: "r",
    key: k
  }, /*#__PURE__*/React.createElement("span", null, n), /*#__PURE__*/React.createElement(Bar, {
    v: L.skills[k],
    cls: L.skills[k] < 60 ? "y" : ""
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "right"
    }
  }, L.skills[k]))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Worksheets"), /*#__PURE__*/React.createElement("p", null, "Ratings per section \xB7 NY D S B"))), /*#__PURE__*/React.createElement(WsRecordList, {
    L: L
  })), (cls.id === "p3i" || rec.attempts.length > 0) && /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Steps in Order \xB7 assessment attempts"), /*#__PURE__*/React.createElement("p", null, "Pass mark ", TD.LESSON.passMark, "/6 \xB7 current status ", /*#__PURE__*/React.createElement(Status, {
    s: rec.status
  })))), rec.attempts.length ? /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Attempt"), /*#__PURE__*/React.createElement("th", null, "Date"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Score"), /*#__PURE__*/React.createElement("th", null, "Result"))), /*#__PURE__*/React.createElement("tbody", null, rec.attempts.map((a, i) => /*#__PURE__*/React.createElement("tr", {
    key: i,
    className: a.date === "2026-10-26" ? "live" : ""
  }, /*#__PURE__*/React.createElement("td", null, "#", i + 1), /*#__PURE__*/React.createElement("td", null, a.date === "2026-10-26" ? "Today" : a.date), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, /*#__PURE__*/React.createElement("b", null, a.score, "/", a.total)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Status, {
    s: a.pass ? "complete" : "fail",
    label: a.pass ? "Pass" : "Fail"
  }))))))) : /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: "var(--ink-soft)"
    }
  }, rec.status === "in_progress" ? `In progress · reached section ${rec.step + 1} of 6` : "Not started")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Reading now")), reading.length ? reading.map(([id, r]) => {
    const b = hlBook(id);
    return /*#__PURE__*/React.createElement("div", {
      key: id,
      style: {
        display: "grid",
        gridTemplateColumns: "40px 1fr",
        gap: 12,
        alignItems: "center",
        marginBottom: 10
      }
    }, /*#__PURE__*/React.createElement(Cover, {
      book: b
    }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", {
      style: {
        fontSize: 14
      }
    }, b.t), /*#__PURE__*/React.createElement("div", {
      className: "mini-bar"
    }, /*#__PURE__*/React.createElement(Bar, {
      v: r.page / r.pages * 100,
      cls: "y"
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 60
      }
    }, "p.", r.page, "/", r.pages))));
  }) : /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14,
      color: "var(--ink-soft)"
    }
  }, "No books in progress.")), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Finished books"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "var(--ink-soft)"
    }
  }, L.booksDone.length)), /*#__PURE__*/React.createElement("div", {
    className: "cover-strip"
  }, L.booksDone.map(hlBook).filter(Boolean).slice(0, 18).map(b => /*#__PURE__*/React.createElement(Cover, {
    key: b.id,
    book: b
  })))), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    onClick: () => onAssign(L.id)
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "plus",
    s: 16
  }), "Assign to ", L.name.split(" ")[0])));
}
function AssignModal({
  cls,
  learners,
  preset,
  onClose
}) {
  const {
    addAssignment
  } = useHL();
  const [type, setType] = React.useState(preset.type || "book");
  const [q, setQ] = React.useState("");
  const [lvl, setLvl] = React.useState(String(cls.expected));
  const [strand, setStrand] = React.useState("All");
  const [sel, setSel] = React.useState(null);
  const [mode, setMode] = React.useState(preset.to ? "some" : "all");
  const [to, setTo] = React.useState(preset.to || []);
  const [due, setDue] = React.useState("2026-11-06");
  const items = type === "worksheet" ? HLWS.list().filter(w => (lvl === "all" || w.level === +lvl) && (strand === "All" || w.strand === strand) && (!q || w.title.toLowerCase().includes(q.toLowerCase()))).map(w => ({
    id: w.code,
    title: w.title + " · worksheet",
    l: w.level,
    s: w.strand,
    book: hlBook(w.code)
  })) : type === "book" ? TD.BOOKS.filter(b => (lvl === "all" || b.l === +lvl) && (strand === "All" || b.s === strand) && (!q || b.t.toLowerCase().includes(q.toLowerCase()))).map(b => ({
    id: b.id,
    title: b.t,
    l: b.l,
    s: b.s,
    book: b
  })) : type === "lesson" ? TD.LESSON_CATALOG.filter(x => (lvl === "all" || x.level === +lvl) && (strand === "All" || x.strand === strand) && (!q || x.title.toLowerCase().includes(q.toLowerCase()))).map(x => ({
    id: x.id,
    title: x.title,
    l: x.level,
    s: x.strand
  })) : TD.JOURNEYS.filter(j => (lvl === "all" || j.level === +lvl) && (!q || j.title.toLowerCase().includes(q.toLowerCase()))).map(j => ({
    id: j.id,
    title: j.title,
    l: j.level,
    s: j.strand
  }));
  const item = items.find(i => i.id === sel);
  const ok = item && (mode === "all" || to.length);
  const below = learners.filter(l => l.level < cls.expected).map(l => l.id);
  return /*#__PURE__*/React.createElement(Modal, {
    title: `Assign to ${cls.name}`,
    onClose: onClose,
    wide: true,
    foot: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "hl-btn ghost",
      onClick: onClose
    }, "Cancel"), /*#__PURE__*/React.createElement("button", {
      className: "hl-btn",
      disabled: !ok,
      onClick: () => {
        addAssignment({
          classId: cls.id,
          type,
          ref: item.id,
          title: item.title,
          due,
          to: mode === "all" ? "all" : to
        });
        onClose();
      }
    }, "Assign", ok ? ` to ${mode === "all" ? "whole class" : to.length + " learner" + (to.length > 1 ? "s" : "")}` : ""))
  }, /*#__PURE__*/React.createElement("p", {
    className: "note"
  }, "Choose from Haaraya's approved library. Content is created by the Haaraya team \u2014 use Content requests to report a gap."), /*#__PURE__*/React.createElement("div", {
    className: "filters",
    style: {
      margin: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "seg"
  }, [["book", "Books"], ["worksheet", "Worksheets"], ["lesson", "Lessons"], ["journey", "Journeys"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: type === k ? "on" : "",
    onClick: () => {
      setType(k);
      setSel(null);
    }
  }, l))), /*#__PURE__*/React.createElement("input", {
    className: "hl-input s",
    placeholder: "Search titles",
    value: q,
    onChange: e => setQ(e.target.value)
  }), /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: lvl,
    onChange: e => setLvl(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All levels"), TD.LEVELS.map(l => /*#__PURE__*/React.createElement("option", {
    key: l.n,
    value: l.n
  }, "L", l.n, l.odyssey ? " · Odyssey" : ""))), type !== "journey" && /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: strand,
    onChange: e => setStrand(e.target.value)
  }, /*#__PURE__*/React.createElement("option", null, "All"), TD.STRANDS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.id
  }, s.id)))), /*#__PURE__*/React.createElement("div", {
    className: "pick-list"
  }, items.map(i => /*#__PURE__*/React.createElement("button", {
    key: i.id,
    className: sel === i.id ? "on" : "",
    onClick: () => setSel(i.id)
  }, i.book ? /*#__PURE__*/React.createElement("div", {
    className: "th"
  }, /*#__PURE__*/React.createElement(Cover, {
    book: i.book
  })) : /*#__PURE__*/React.createElement("span", {
    className: "hl-av sm",
    style: {
      background: strandOf(i.s).color
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: type === "lesson" ? "star" : "path",
    s: 14
  })), /*#__PURE__*/React.createElement("span", null, i.title, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      marginTop: 3
    }
  }, /*#__PURE__*/React.createElement(LevelTag, {
    l: i.l
  }), i.s !== "All" && /*#__PURE__*/React.createElement(StrandTag, {
    s: i.s
  }))), sel === i.id ? /*#__PURE__*/React.createElement(Icon, {
    n: "check"
  }) : /*#__PURE__*/React.createElement("span", null))), !items.length && /*#__PURE__*/React.createElement("div", {
    className: "empty",
    style: {
      border: 0
    }
  }, "No approved ", type, "s match.")), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "Assign to"), /*#__PURE__*/React.createElement("div", {
    className: "filters",
    style: {
      margin: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "seg"
  }, /*#__PURE__*/React.createElement("button", {
    className: mode === "all" ? "on" : "",
    onClick: () => setMode("all")
  }, "Whole class (", learners.length, ")"), /*#__PURE__*/React.createElement("button", {
    className: mode === "some" ? "on" : "",
    onClick: () => setMode("some")
  }, "Selected learners")), mode === "some" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost sm",
    onClick: () => setTo(below)
  }, "Below L", cls.expected, " (", below.length, ")"), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn quiet sm",
    onClick: () => setTo([])
  }, "Clear"))), mode === "some" && /*#__PURE__*/React.createElement("div", {
    className: "checkgrid"
  }, learners.map(l => /*#__PURE__*/React.createElement("label", {
    key: l.id
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: to.includes(l.id),
    onChange: e => setTo(e.target.checked ? [...to, l.id] : to.filter(x => x !== l.id))
  }), l.name, " ", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ink-soft)"
    }
  }, "L", l.level))))), /*#__PURE__*/React.createElement("div", {
    className: "field",
    style: {
      maxWidth: 220
    }
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "due"
  }, "Due date"), /*#__PURE__*/React.createElement("input", {
    id: "due",
    className: "hl-input",
    type: "date",
    value: due,
    onChange: e => setDue(e.target.value)
  })));
}
function TAssignments({
  cls,
  learners,
  openAssign
}) {
  const {
    state,
    removeAssignment
  } = useHL();
  const asg = state.assignments.filter(a => a.classId === cls.id);
  const [open, setOpen] = React.useState(null);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Assigned learning"), /*#__PURE__*/React.createElement("p", null, cls.name, " \xB7 ", asg.length, " active assignments")), /*#__PURE__*/React.createElement("div", {
    className: "acts"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    onClick: () => openAssign({})
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "plus",
    s: 16
  }), "Assign content"))), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, asg.map(a => {
    const c = assignCounts(state, learners, a);
    const tgt = learners.filter(l => a.to === "all" || a.to.includes(l.id));
    return /*#__PURE__*/React.createElement("div", {
      className: "card",
      key: a.id
    }, /*#__PURE__*/React.createElement("div", {
      className: "card-h"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 12,
        alignItems: "center"
      }
    }, a.type === "book" || a.type === "worksheet" ? /*#__PURE__*/React.createElement("div", {
      style: {
        width: 40
      }
    }, /*#__PURE__*/React.createElement(Cover, {
      book: hlBook(a.ref)
    })) : /*#__PURE__*/React.createElement("span", {
      className: "hl-av",
      style: {
        background: "var(--forest-dk)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      n: a.type === "lesson" ? "star" : "path",
      s: 16
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, a.title), /*#__PURE__*/React.createElement("p", {
      style: {
        textTransform: "capitalize"
      }
    }, a.type, " \xB7 ", a.to === "all" ? "Whole class" : `${a.to.length} learners`, " \xB7 due ", new Date(a.due).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short"
    }), hlIsOverdue(a.due, c.complete >= c.n) && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 ", /*#__PURE__*/React.createElement(Overdue, null)), " \xB7 set ", a.created))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 14,
        alignItems: "center"
      }
    }, /*#__PURE__*/React.createElement(StackBar, {
      c: c
    }), /*#__PURE__*/React.createElement("b", {
      style: {
        fontSize: 14,
        whiteSpace: "nowrap"
      }
    }, c.complete, "/", c.n, " done"), /*#__PURE__*/React.createElement("button", {
      className: "hl-btn ghost sm",
      onClick: () => setOpen(open === a.id ? null : a.id)
    }, open === a.id ? "Hide" : "Details"), /*#__PURE__*/React.createElement("button", {
      className: "hl-btn quiet sm",
      onClick: () => removeAssignment(a.id)
    }, "Remove"))), open === a.id && /*#__PURE__*/React.createElement("div", {
      className: "tbl-wrap"
    }, /*#__PURE__*/React.createElement("table", {
      className: "tbl"
    }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Learner"), /*#__PURE__*/React.createElement("th", null, "Status"), a.type === "lesson" && /*#__PURE__*/React.createElement("th", {
      className: "num"
    }, "Score"), /*#__PURE__*/React.createElement("th", null, "Last active"))), /*#__PURE__*/React.createElement("tbody", null, tgt.map(l => {
      const s = hlAssignStatus(l, a);
      const at = a.type === "lesson" && hlLastAttempt(hlLessonRec(l, a.ref));
      return /*#__PURE__*/React.createElement("tr", {
        key: l.id
      }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
        className: "who"
      }, /*#__PURE__*/React.createElement(Avatar, {
        name: l.name,
        size: "sm"
      }), l.name)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Status, {
        s: at && !at.pass ? "fail" : s
      })), a.type === "lesson" && /*#__PURE__*/React.createElement("td", {
        className: "num"
      }, at ? `${at.score}/6` : "—"), /*#__PURE__*/React.createElement("td", null, dayLabel(l.lastActive)));
    })))));
  }), !asg.length && /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "Nothing assigned to this class yet.")));
}
function TReports({
  cls,
  learners,
  openL
}) {
  const [view, setView] = React.useState("levels");
  const dist = TD.LEVELS.slice(0, 12).map(lv => learners.filter(l => l.level === lv.n).length);
  const weekly = TD.TERM_WEEKS.map((_, w) => learners.reduce((s, l) => s + l.weekly[w], 0));
  const scoreDist = [0, 1, 2, 3, 4, 5, 6].map(s => learners.filter(l => {
    const a = hlLastAttempt(hlLessonRec(l));
    return a && a.score === s;
  }).length);
  const support = learners.map(l => ({
    l,
    f: hlFlags(l, cls)
  })).filter(x => x.f.length);
  const heat = v => v === 0 ? "#EEEAE2" : v < 3 ? "#CFE7CF" : v < 6 ? "#7FC17F" : "#1A6E1A";
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Reports"), /*#__PURE__*/React.createElement("p", null, cls.name, " \xB7 Term 1")), /*#__PURE__*/React.createElement("div", {
    className: "acts"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost",
    onClick: () => csvDownload(`${cls.name} report.csv`, [["Learner", "Level", ...TD.TERM_WEEKS.map(w => w + " activities"), "Last score", "Support flags"], ...learners.map(l => {
      const a = hlLastAttempt(hlLessonRec(l));
      return [l.name, "L" + l.level, ...l.weekly, a ? `${a.score}/6` : "", hlFlags(l, cls).join("; ")];
    })])
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "dl",
    s: 16
  }), "Download CSV"))), /*#__PURE__*/React.createElement("div", {
    className: "pill-tabs"
  }, [["levels", "Reading levels"], ["completion", "Completion over time"], ["assessment", "Assessment"], ["participation", "Participation"], ["support", `Support (${support.length})`]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: "chip" + (view === k ? " on" : ""),
    onClick: () => setView(k)
  }, l))), view === "levels" && /*#__PURE__*/React.createElement("div", {
    className: "grid2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Reading progress by level"), /*#__PURE__*/React.createElement("p", null, "Expected for ", cls.name, ": L", cls.expected))), /*#__PURE__*/React.createElement(Bars, {
    data: dist,
    labels: TD.LEVELS.slice(0, 12).map(l => "L" + l.n),
    highlight: i => i + 1 === cls.expected,
    h: 200
  })), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Against expectation")), /*#__PURE__*/React.createElement("div", {
    className: "hbars"
  }, [["Above", learners.filter(l => l.level > cls.expected).length, "var(--forest-dk)"], ["At level", learners.filter(l => l.level === cls.expected).length, "var(--forest)"], ["1 below", learners.filter(l => l.level === cls.expected - 1).length, "var(--yellow-dk)"], ["2+ below", learners.filter(l => l.level < cls.expected - 1).length, "var(--warn)"]].map(([n, v, c]) => /*#__PURE__*/React.createElement("div", {
    className: "r",
    key: n
  }, /*#__PURE__*/React.createElement("span", null, n), /*#__PURE__*/React.createElement("div", {
    className: "tr"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: v / learners.length * 100 + "%",
      background: c
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, v)))), /*#__PURE__*/React.createElement("p", {
    className: "note",
    style: {
      marginTop: 16
    }
  }, learners.filter(l => l.level < cls.expected - 1).length, " learners are two or more levels behind. Consider assigning Soundables decodables at their level."))), view === "completion" && /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Activities completed per week"), /*#__PURE__*/React.createElement("p", null, "Books, lessons and checks \xB7 all learners"))), /*#__PURE__*/React.createElement(LineChart, {
    labels: TD.TERM_WEEKS,
    series: [{
      name: "Class",
      color: "#1A6E1A",
      data: weekly
    }],
    h: 220
  })), view === "assessment" && /*#__PURE__*/React.createElement("div", {
    className: "grid2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Steps in Order \xB7 latest score"), /*#__PURE__*/React.createElement("p", null, "Pass mark 4/6 (highlighted below pass)"))), /*#__PURE__*/React.createElement(Bars, {
    data: scoreDist,
    labels: ["0", "1", "2", "3", "4", "5", "6"],
    highlight: i => i < 4,
    h: 200
  })), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Question-level difficulty")), /*#__PURE__*/React.createElement("div", {
    className: "hbars"
  }, TD.LESSON.quiz.map((q, i) => {
    const pct = [92, 81, 88, 63, 77, 70][i];
    return /*#__PURE__*/React.createElement("div", {
      className: "r",
      key: i,
      style: {
        gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr) 44px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600
      }
    }, "Q", i + 1, ". ", q.q), /*#__PURE__*/React.createElement("div", {
      className: "tr"
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        width: pct + "%",
        background: pct < 70 ? "var(--yellow-dk)" : "var(--forest)"
      }
    })), /*#__PURE__*/React.createElement("span", {
      className: "v"
    }, pct, "%"));
  })))), view === "participation" && /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Weekly participation"), /*#__PURE__*/React.createElement("p", null, "Activities per learner per week")), /*#__PURE__*/React.createElement("div", {
    className: "legend"
  }, [["None", 0], ["1–2", 1], ["3–5", 4], ["6+", 7]].map(([l, v]) => /*#__PURE__*/React.createElement("span", {
    key: l
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      background: heat(v)
    }
  }), l)))), /*#__PURE__*/React.createElement("div", {
    className: "heat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hr"
  }, /*#__PURE__*/React.createElement("span", null), TD.TERM_WEEKS.map(w => /*#__PURE__*/React.createElement("span", {
    key: w,
    style: {
      textAlign: "center",
      color: "var(--ink-soft)"
    }
  }, w))), learners.map(l => /*#__PURE__*/React.createElement("div", {
    className: "hr",
    key: l.id
  }, /*#__PURE__*/React.createElement("span", null, l.name), l.weekly.map((v, i) => /*#__PURE__*/React.createElement("i", {
    key: i,
    title: `${v} activities`,
    style: {
      background: heat(v)
    }
  })))))), view === "support" && /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Learners requiring support"), /*#__PURE__*/React.createElement("p", null, "With a suggested next step"))), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Learner"), /*#__PURE__*/React.createElement("th", null, "Level"), /*#__PURE__*/React.createElement("th", null, "Reasons"), /*#__PURE__*/React.createElement("th", null, "Suggested next step"))), /*#__PURE__*/React.createElement("tbody", null, support.map(({
    l,
    f
  }) => /*#__PURE__*/React.createElement("tr", {
    key: l.id,
    className: "click",
    onClick: () => openL(l.id)
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "who"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: l.name,
    size: "sm"
  }), l.name)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(LevelTag, {
    l: l.level
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      flexWrap: "wrap"
    }
  }, f.map(x => /*#__PURE__*/React.createElement("span", {
    key: x,
    className: "flag"
  }, x)))), /*#__PURE__*/React.createElement("td", {
    style: {
      fontSize: 13
    }
  }, f[0].startsWith("Below pass") ? "Re-read the text together, then retake the check" : f[0].startsWith("Inactive") ? "Check in with family; assign a short book" : f[0].startsWith("Below expected") ? `Assign L${l.level} Soundables decodables` : "Help them sign in"))))))));
}
function TRequests({
  me
}) {
  const {
    state,
    addRequest
  } = useHL();
  const [f, setF] = React.useState({
    kind: "New content",
    level: "4",
    strand: "Tafiya",
    text: ""
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Content requests"), /*#__PURE__*/React.createElement("p", null, "Ask for new material or report a gap. Haaraya's content team creates and publishes all content."))), /*#__PURE__*/React.createElement("div", {
    className: "grid2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "New request")), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("span", null, "Type"), /*#__PURE__*/React.createElement("div", {
    className: "seg"
  }, ["New content", "Gap in a level", "Error in content"].map(k => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: f.kind === k ? "on" : "",
    onClick: () => setF({
      ...f,
      kind: k
    })
  }, k)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Level"), /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: f.level,
    onChange: e => setF({
      ...f,
      level: e.target.value
    })
  }, TD.LEVELS.map(l => /*#__PURE__*/React.createElement("option", {
    key: l.n,
    value: l.n
  }, "L", l.n)))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Strand"), /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: f.strand,
    onChange: e => setF({
      ...f,
      strand: e.target.value
    })
  }, TD.STRANDS.map(s => /*#__PURE__*/React.createElement("option", {
    key: s.id
  }, s.id)), /*#__PURE__*/React.createElement("option", null, "Not sure")))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "rq"
  }, "What do your learners need?"), /*#__PURE__*/React.createElement("textarea", {
    id: "rq",
    className: "hl-input",
    value: f.text,
    onChange: e => setF({
      ...f,
      text: e.target.value
    }),
    placeholder: "e.g. More decodable texts with 'sh' and 'ch' at Level 3"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    disabled: !f.text.trim(),
    onClick: () => {
      addRequest({
        ...f,
        level: +f.level,
        by: me.name
      });
      setF({
        ...f,
        text: ""
      });
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "send",
    s: 16
  }), "Send to Haaraya")))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Your requests")), /*#__PURE__*/React.createElement("div", {
    className: "feed"
  }, state.requests.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.id
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, r.kind), " \xB7 L", r.level, " ", r.strand, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ink-mid)"
    }
  }, r.text)), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement(Status, {
    s: r.status === "Received" ? "not_started" : "in_progress",
    label: r.status
  }), /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("time", null, r.date))))))));
}
Object.assign(window, {
  TeacherApp,
  AdultShell,
  LearnerDrawer,
  StackBar,
  dayLabel
});