const AD = window.HL_DATA;
const SKILL_NAMES = {
  phonics: "Phonics",
  sight: "Sight words",
  vocab: "Vocabulary",
  comp: "Comprehension",
  seq: "Sequencing"
};
const HOME_TIPS = {
  phonics: "Point to a word and sound it out together, slowly.",
  sight: "Spot common words like “the” and “said” on signs and packets.",
  vocab: "Pick one new word from today's book and use it at dinner.",
  comp: "After reading, ask: who was in the story, and what happened?",
  seq: "Ask them to tell you how to do a chore — first, next, then, finally."
};

/* ---------- Parent ---------- */
function ParentApp() {
  const {
    state
  } = useHL();
  const [cid, setCid] = React.useState("amara");
  const L = state.learners[cid];
  const cls = state.classes.find(c => c.id === L.classId);
  const rec = hlLessonRec(L);
  const last = hlLastAttempt(rec);
  const sk = Object.entries(L.skills).sort((a, b) => b[1] - a[1]);
  const J = L.level === 4 ? AD.JOURNEYS[0].units : null;
  const reading = Object.entries(L.reading).filter(([, r]) => !r.done);
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
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, AD.PARENT.name), /*#__PURE__*/React.createElement("p", null, "Your children's reading at a glance"))), /*#__PURE__*/React.createElement("div", {
    className: "child-pick",
    style: {
      marginBottom: 18
    }
  }, AD.PARENT.children.map(id => {
    const c = state.learners[id];
    return /*#__PURE__*/React.createElement("button", {
      key: id,
      className: cid === id ? "on" : "",
      onClick: () => setCid(id)
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: c.name
    }), /*#__PURE__*/React.createElement("div", null, c.name, /*#__PURE__*/React.createElement("span", null, "Level ", c.level, " \xB7 ", state.classes.find(x => x.id === c.classId).name)));
  })), /*#__PURE__*/React.createElement("div", {
    className: "kpis"
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Reading level",
    value: "L" + L.level,
    note: `${L.levelPct}% through Level ${L.level}`
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Books finished",
    value: L.booksDone.length,
    note: "this term"
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Activities this week",
    value: L.weekly[9],
    note: `${L.weekly[8]} last week`,
    dir: L.weekly[9] >= L.weekly[8] ? "up" : "dn"
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Latest check",
    value: last ? `${last.score}/${last.total}` : "—",
    note: last ? last.pass ? "Passed · Steps in Order" : "Below pass mark" : "No checks yet",
    dir: last ? last.pass ? "up" : "dn" : ""
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Reading activity"), /*#__PURE__*/React.createElement("p", null, "Books, lessons and checks each week"))), /*#__PURE__*/React.createElement(Bars, {
    data: L.weekly,
    labels: AD.TERM_WEEKS,
    h: 170
  })), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Reading now")), reading.length ? reading.map(([id, r]) => {
    const b = hlBook(id);
    return /*#__PURE__*/React.createElement("div", {
      key: id,
      style: {
        display: "grid",
        gridTemplateColumns: "48px 1fr",
        gap: 12,
        alignItems: "center",
        marginBottom: 12
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
  }, "Nothing in progress."))), /*#__PURE__*/React.createElement("div", {
    className: "grid2",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Strengths and practice"), /*#__PURE__*/React.createElement("p", null, "From reading, lessons and checks"))), /*#__PURE__*/React.createElement("div", {
    className: "skills"
  }, sk.map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    className: "r",
    key: k
  }, /*#__PURE__*/React.createElement("span", null, SKILL_NAMES[k]), /*#__PURE__*/React.createElement(Bar, {
    v: v,
    cls: v < 65 ? "y" : ""
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "right"
    }
  }, v)))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16,
      display: "grid",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      fontWeight: 800
    }
  }, "Strongest: ", SKILL_NAMES[sk[0][0]], ", ", SKILL_NAMES[sk[1][0]]), sk.slice(-2).reverse().map(([k]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    className: "note"
  }, /*#__PURE__*/React.createElement("b", null, "Practise ", SKILL_NAMES[k].toLowerCase(), " at home."), " ", HOME_TIPS[k])))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Learning journey"), /*#__PURE__*/React.createElement("p", null, L.level === 4 ? AD.JOURNEYS[0].title : "Level 2 · Sounds Together"))), J ? /*#__PURE__*/React.createElement("div", {
    className: "feed"
  }, J.map((u, i) => {
    const st = u.done || u.live && rec.status === "complete" ? "complete" : u.live ? rec.status : "not_started";
    const a = u.live && last;
    return /*#__PURE__*/React.createElement("div", {
      key: u.id
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, "Unit ", i + 1), " \xB7 ", u.title, a ? /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--ink-soft)"
      }
    }, " \xB7 score ", a.score, "/6") : null), /*#__PURE__*/React.createElement(Status, {
      s: a && !a.pass ? "fail" : st,
      label: st === "not_started" ? "Upcoming" : null
    }));
  })) : /*#__PURE__*/React.createElement("div", {
    className: "feed"
  }, ["Short Vowel Sounds", "Blends: st, sp, sn", "Sight Words in Sentences", "Reading Sound Stories", "Sounds Together Review", "Level 2 Check"].map((t, i) => /*#__PURE__*/React.createElement("div", {
    key: t
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, "Unit ", i + 1), " \xB7 ", t), /*#__PURE__*/React.createElement(Status, {
    s: i < 2 ? "complete" : i === 2 ? "in_progress" : "not_started",
    label: i > 2 ? "Upcoming" : null
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Worksheets"), /*#__PURE__*/React.createElement("p", null, "What the teacher saw, section by section. Haaraya does not turn these into scores."))), /*#__PURE__*/React.createElement(WsRecordList, {
    L: L,
    family: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Completed books"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700,
      color: "var(--ink-soft)"
    }
  }, L.booksDone.length, " books")), /*#__PURE__*/React.createElement("div", {
    className: "cover-strip",
    style: {
      gridTemplateColumns: "repeat(auto-fill,minmax(88px,1fr))"
    }
  }, L.booksDone.map(hlBook).filter(Boolean).map(b => /*#__PURE__*/React.createElement(Cover, {
    key: b.id,
    book: b
  })))))));
}

/* ---------- School administrator ---------- */
function classStats(state, c) {
  const ls = hlClassLearners(state, c.id);
  const n = ls.length || 1;
  const sc = ls.map(hlAvgScore).filter(x => x != null);
  return {
    c,
    n: ls.length,
    ls,
    teacher: state.teachers.find(t => t.id === c.teacherId),
    at: Math.round(ls.filter(l => l.level >= c.expected).length / n * 100),
    active: Math.round(ls.filter(l => l.lastActive <= 7).length / n * 100),
    score: sc.length ? Math.round(sc.reduce((a, b) => a + b, 0) / sc.length) : null,
    books: (ls.reduce((s, l) => s + l.booksDone.length, 0) / n).toFixed(1),
    below: ls.filter(l => l.level < c.expected).length,
    above: ls.filter(l => l.level > c.expected).length,
    atExact: ls.filter(l => l.level === c.expected).length
  };
}
function SchoolApp() {
  const {
    state
  } = useHL();
  const v = state.route.view;
  const nav = [["overview", "School overview", "school"], ["classes", "Classes & teachers", "users"], ["learners", "Enrolment", "plus"], ["reports", "Reports", "dl"]];
  const ctx = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Greenfield Primary School"), /*#__PURE__*/React.createElement("span", null, "Mr Chinedu Okoye \xB7 Head"));
  return /*#__PURE__*/React.createElement(AdultShell, {
    nav: nav,
    ctx: ctx
  }, (v === "overview" || !nav.find(n => n[0] === v)) && /*#__PURE__*/React.createElement(SOverview, null), v === "classes" && /*#__PURE__*/React.createElement(SClasses, null), v === "learners" && /*#__PURE__*/React.createElement(SLearners, null), v === "reports" && /*#__PURE__*/React.createElement(SReports, null));
}
function SOverview() {
  const {
    state
  } = useHL();
  const all = Object.values(state.learners).filter(l => l.schoolId === "gf");
  const stats = state.classes.map(c => classStats(state, c));
  const [sort, setSort] = React.useState({
    k: "grade",
    d: 1
  });
  const key = {
    grade: s => s.c.grade,
    n: s => s.n,
    at: s => s.at,
    active: s => s.active,
    score: s => s.score ?? -1,
    books: s => +s.books
  };
  const rows = stats.slice().sort((a, b) => (key[sort.k](a) - key[sort.k](b)) * sort.d);
  const Th = ({
    k,
    children
  }) => /*#__PURE__*/React.createElement("th", {
    className: "sort num",
    onClick: () => setSort({
      k,
      d: sort.k === k ? -sort.d : -1
    })
  }, children, sort.k === k ? sort.d > 0 ? " ↑" : " ↓" : "");
  const dist = AD.LEVELS.slice(0, 12).map(lv => all.filter(l => l.level === lv.n).length);
  const act = AD.TERM_WEEKS.map((_, w) => +(all.reduce((s, l) => s + l.weekly[w], 0) / all.length).toFixed(1));
  const scoreTrend = [61, 63, 62, 66, 68, 67, 70, 71, 73, stats.find(s => s.c.id === "p3i").score || 72];
  const active = all.filter(l => l.lastActive <= 7).length;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Greenfield Primary School"), /*#__PURE__*/React.createElement("p", null, "Term 1 \xB7 week 10 \xB7 Lagos"))), /*#__PURE__*/React.createElement("div", {
    className: "kpis"
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Enrolled learners",
    value: all.length,
    note: `${state.classes.length} classes`
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Teachers",
    value: state.teachers.length,
    note: `${state.teachers.filter(t => !t.classes.length).length} without a class`
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Active this week",
    value: Math.round(active / all.length * 100) + "%",
    note: `${active} learners`,
    dir: "up"
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "At or above level",
    value: Math.round(stats.reduce((s, x) => s + x.at * x.n, 0) / all.length) + "%",
    note: "vs. expected for grade"
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Books per learner",
    value: (all.reduce((s, l) => s + l.booksDone.length, 0) / all.length).toFixed(1),
    note: "finished this term"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Reading-level distribution"), /*#__PURE__*/React.createElement("p", null, "All learners, L1\u2013L12"))), /*#__PURE__*/React.createElement(Bars, {
    data: dist,
    labels: AD.LEVELS.slice(0, 12).map(l => "L" + l.n),
    h: 190
  })), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Level vs. expectation by class")), /*#__PURE__*/React.createElement("div", {
    className: "legend"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    style: {
      background: "var(--warn)"
    }
  }), "Below"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    style: {
      background: "var(--forest)"
    }
  }), "At"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("i", {
    style: {
      background: "var(--forest-dk)",
      opacity: .55
    }
  }), "Above"))), /*#__PURE__*/React.createElement("div", {
    className: "hbars"
  }, stats.map(s => /*#__PURE__*/React.createElement("div", {
    className: "r",
    key: s.c.id,
    style: {
      gridTemplateColumns: "130px minmax(0,1fr) 44px"
    }
  }, /*#__PURE__*/React.createElement("span", null, s.c.name.replace("Primary", "P")), /*#__PURE__*/React.createElement("div", {
    className: "tr"
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      width: s.below / (s.n || 1) * 100 + "%",
      background: "var(--warn)"
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      width: s.atExact / (s.n || 1) * 100 + "%",
      background: "var(--forest)"
    }
  }), /*#__PURE__*/React.createElement("i", {
    style: {
      width: s.above / (s.n || 1) * 100 + "%",
      background: "var(--forest-dk)",
      opacity: .55
    }
  })), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, s.below)))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "var(--ink-soft)",
      fontWeight: 700,
      marginTop: 8
    }
  }, "Number on the right = learners below expected level"))), /*#__PURE__*/React.createElement("div", {
    className: "grid2",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Completion trend"), /*#__PURE__*/React.createElement("p", null, "Average activities per learner per week"))), /*#__PURE__*/React.createElement(LineChart, {
    labels: AD.TERM_WEEKS,
    series: [{
      name: "Activities",
      color: "#1A6E1A",
      data: act
    }],
    h: 190
  })), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Assessment trend"), /*#__PURE__*/React.createElement("p", null, "Average check score, all classes"))), /*#__PURE__*/React.createElement(LineChart, {
    labels: AD.TERM_WEEKS,
    series: [{
      name: "Score",
      color: "#C24400",
      data: scoreTrend
    }],
    max: 100,
    unit: "%",
    h: 190
  }))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Class comparison"), /*#__PURE__*/React.createElement("p", null, "Click a column to sort"))), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "sort",
    onClick: () => setSort({
      k: "grade",
      d: sort.k === "grade" ? -sort.d : 1
    })
  }, "Class"), /*#__PURE__*/React.createElement("th", null, "Teacher"), /*#__PURE__*/React.createElement(Th, {
    k: "n"
  }, "Learners"), /*#__PURE__*/React.createElement(Th, {
    k: "at"
  }, "At/above level"), /*#__PURE__*/React.createElement(Th, {
    k: "active"
  }, "Active"), /*#__PURE__*/React.createElement(Th, {
    k: "score"
  }, "Avg score"), /*#__PURE__*/React.createElement(Th, {
    k: "books"
  }, "Books/learner"))), /*#__PURE__*/React.createElement("tbody", null, rows.map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.c.id
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, s.c.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--ink-soft)",
      fontWeight: 700
    }
  }, "Expected L", s.c.expected)), /*#__PURE__*/React.createElement("td", null, s.teacher ? s.teacher.name : /*#__PURE__*/React.createElement("span", {
    className: "flag"
  }, "Unassigned")), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, s.n), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: s.at < 60 ? "var(--warn)" : "inherit"
    }
  }, s.at, "%")), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, s.active, "%"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, s.score != null ? s.score + "%" : "—"), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, s.books))))))));
}
function SClasses() {
  const {
    state,
    assignTeacher,
    addTeacher,
    addClass
  } = useHL();
  const [m, setM] = React.useState(null);
  const [f, setF] = React.useState({});
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Classes & teachers"), /*#__PURE__*/React.createElement("p", null, state.classes.length, " classes \xB7 ", state.teachers.length, " teachers")), /*#__PURE__*/React.createElement("div", {
    className: "acts"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost",
    onClick: () => {
      setF({
        name: "",
        email: ""
      });
      setM("t");
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "plus",
    s: 16
  }), "Invite teacher"), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    onClick: () => {
      setF({
        name: "",
        grade: 1
      });
      setM("c");
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "plus",
    s: 16
  }), "New class"))), /*#__PURE__*/React.createElement("div", {
    className: "stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Classes")), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Class"), /*#__PURE__*/React.createElement("th", null, "Expected level"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Learners"), /*#__PURE__*/React.createElement("th", null, "Teacher"))), /*#__PURE__*/React.createElement("tbody", null, state.classes.map(c => /*#__PURE__*/React.createElement("tr", {
    key: c.id
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, c.name)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(LevelTag, {
    l: c.expected
  })), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, hlClassLearners(state, c.id).length), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: c.teacherId || "",
    onChange: e => assignTeacher(c.id, e.target.value),
    "aria-label": `Teacher for ${c.name}`
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Unassigned"), state.teachers.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.name)))))))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Teachers")), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Teacher"), /*#__PURE__*/React.createElement("th", null, "Email"), /*#__PURE__*/React.createElement("th", null, "Classes"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, state.teachers.map(t => /*#__PURE__*/React.createElement("tr", {
    key: t.id
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "who"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: t.name,
    size: "sm"
  }), t.name)), /*#__PURE__*/React.createElement("td", null, t.email), /*#__PURE__*/React.createElement("td", null, t.classes.map(id => state.classes.find(c => c.id === id)?.name).filter(Boolean).join(", ") || "—"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Status, {
    s: t.invited ? "in_progress" : "complete",
    label: t.invited ? "Invite sent" : "Active"
  }))))))))), m === "t" && /*#__PURE__*/React.createElement(Modal, {
    title: "Invite a teacher",
    onClose: () => setM(null),
    foot: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "hl-btn ghost",
      onClick: () => setM(null)
    }, "Cancel"), /*#__PURE__*/React.createElement("button", {
      className: "hl-btn",
      disabled: !f.name || !f.email,
      onClick: () => {
        addTeacher({
          name: f.name,
          email: f.email,
          invited: true
        });
        setM(null);
      }
    }, "Send invite"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Full name"), /*#__PURE__*/React.createElement("input", {
    className: "hl-input",
    value: f.name,
    onChange: e => setF({
      ...f,
      name: e.target.value
    }),
    placeholder: "Mrs Funke Ade"
  })), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "School email"), /*#__PURE__*/React.createElement("input", {
    className: "hl-input",
    value: f.email,
    onChange: e => setF({
      ...f,
      email: e.target.value
    }),
    placeholder: "name@greenfield.example"
  })), /*#__PURE__*/React.createElement("p", {
    className: "note"
  }, "Prototype: no email is sent.")), m === "c" && /*#__PURE__*/React.createElement(Modal, {
    title: "New class",
    onClose: () => setM(null),
    foot: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("button", {
      className: "hl-btn ghost",
      onClick: () => setM(null)
    }, "Cancel"), /*#__PURE__*/React.createElement("button", {
      className: "hl-btn",
      disabled: !f.name,
      onClick: () => {
        addClass({
          name: f.name,
          grade: +f.grade,
          expected: Math.min(12, +f.grade + 1),
          teacherId: f.teacherId || null
        });
        setM(null);
      }
    }, "Create class"))
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Class name"), /*#__PURE__*/React.createElement("input", {
    className: "hl-input",
    value: f.name,
    onChange: e => setF({
      ...f,
      name: e.target.value
    }),
    placeholder: "Primary 2 Ruby"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Grade"), /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: f.grade,
    onChange: e => setF({
      ...f,
      grade: e.target.value
    })
  }, [1, 2, 3, 4, 5, 6].map(g => /*#__PURE__*/React.createElement("option", {
    key: g,
    value: g
  }, "Primary ", g)))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Teacher"), /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: f.teacherId || "",
    onChange: e => setF({
      ...f,
      teacherId: e.target.value
    })
  }, /*#__PURE__*/React.createElement("option", {
    value: ""
  }, "Assign later"), state.teachers.map(t => /*#__PURE__*/React.createElement("option", {
    key: t.id,
    value: t.id
  }, t.name))))), /*#__PURE__*/React.createElement("p", {
    className: "note"
  }, "Expected reading level is set from the grade (Primary ", f.grade, " \u2192 L", Math.min(12, +f.grade + 1), ").")));
}
function SLearners() {
  const {
    state,
    enroll
  } = useHL();
  const [name, setName] = React.useState("");
  const [cid, setCid] = React.useState(state.classes[0].id);
  const [q, setQ] = React.useState("");
  const [fc, setFc] = React.useState("all");
  const ls = Object.values(state.learners).filter(l => l.schoolId === "gf" && (fc === "all" || l.classId === fc) && (!q || l.name.toLowerCase().includes(q.toLowerCase())));
  ls.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0) || a.name.localeCompare(b.name));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Enrolment"), /*#__PURE__*/React.createElement("p", null, Object.values(state.learners).filter(l => l.schoolId === "gf").length, " learners enrolled"))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Enrol a learner")), /*#__PURE__*/React.createElement("div", {
    className: "filters",
    style: {
      margin: 0
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "hl-input",
    style: {
      minWidth: 240
    },
    placeholder: "Learner's full name",
    value: name,
    onChange: e => setName(e.target.value)
  }), /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: cid,
    onChange: e => setCid(e.target.value)
  }, state.classes.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.name))), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    disabled: !name.trim(),
    onClick: () => {
      enroll(name.trim(), cid);
      setName("");
    }
  }, "Enrol"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--ink-soft)",
      fontWeight: 600
    }
  }, "Starts at the class's expected level until a placement check is taken."))), /*#__PURE__*/React.createElement("div", {
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
    value: fc,
    onChange: e => setFc(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All classes"), state.classes.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.name))), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 13,
      fontWeight: 700,
      color: "var(--ink-soft)"
    }
  }, ls.length, " shown")), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap",
    style: {
      maxHeight: 520,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Learner"), /*#__PURE__*/React.createElement("th", null, "Class"), /*#__PURE__*/React.createElement("th", null, "Level"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Books"), /*#__PURE__*/React.createElement("th", null, "Last active"))), /*#__PURE__*/React.createElement("tbody", null, ls.map(l => /*#__PURE__*/React.createElement("tr", {
    key: l.id,
    className: l.isNew ? "live" : ""
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "who"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: l.name,
    size: "sm"
  }), l.name, l.isNew && /*#__PURE__*/React.createElement(Status, {
    s: "in_progress",
    label: "New"
  }))), /*#__PURE__*/React.createElement("td", null, state.classes.find(c => c.id === l.classId)?.name), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(LevelTag, {
    l: l.level
  })), /*#__PURE__*/React.createElement("td", {
    className: "num"
  }, l.booksDone.length), /*#__PURE__*/React.createElement("td", null, dayLabel(l.lastActive)))))))));
}
function SReports() {
  const {
    state
  } = useHL();
  const [type, setType] = React.useState("summary");
  const [cid, setCid] = React.useState("all");
  const classes = state.classes.filter(c => cid === "all" || c.id === cid);
  let head, body;
  if (type === "summary") {
    head = ["Class", "Teacher", "Learners", "At/above level %", "Active %", "Avg score %", "Books/learner"];
    body = classes.map(c => {
      const s = classStats(state, c);
      return [c.name, s.teacher?.name || "Unassigned", s.n, s.at, s.active, s.score ?? "", s.books];
    });
  } else {
    const ls = classes.flatMap(c => hlClassLearners(state, c.id).map(l => [l, c]));
    if (type === "learners") {
      head = ["Learner", "Class", "Level", "Level %", "Books finished", "Last active", "Flags"];
      body = ls.map(([l, c]) => [l.name, c.name, "L" + l.level, l.levelPct, l.booksDone.length, dayLabel(l.lastActive), hlFlags(l, c).join("; ")]);
    } else if (type === "levels") {
      head = ["Class", ...AD.LEVELS.slice(0, 12).map(l => "L" + l.n)];
      body = classes.map(c => [c.name, ...AD.LEVELS.slice(0, 12).map(lv => hlClassLearners(state, c.id).filter(l => l.level === lv.n).length)]);
    } else {
      head = ["Learner", "Class", "Lesson", "Attempts", "Latest score", "Result"];
      body = ls.filter(([l]) => l.lessons[AD.LESSON_ID] && l.lessons[AD.LESSON_ID].attempts.length).map(([l, c]) => {
        const r = l.lessons[AD.LESSON_ID];
        const a = hlLastAttempt(r);
        return [l.name, c.name, AD.LESSON.title, r.attempts.length, `${a.score}/${a.total}`, a.pass ? "Pass" : "Fail"];
      });
    }
  }
  const names = {
    summary: "Class summary",
    learners: "Learner progress",
    levels: "Reading levels",
    assessment: "Assessment results"
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Reports"), /*#__PURE__*/React.createElement("p", null, "Preview, then download as CSV for spreadsheets or governors' reports"))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "filters"
  }, /*#__PURE__*/React.createElement("div", {
    className: "seg"
  }, Object.entries(names).map(([k, l]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: type === k ? "on" : "",
    onClick: () => setType(k)
  }, l))), /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: cid,
    onChange: e => setCid(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All classes"), state.classes.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.name))), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    onClick: () => csvDownload(`Greenfield ${names[type]}.csv`, [head, ...body])
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "dl",
    s: 16
  }), "Download CSV (", body.length, " rows)")), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap",
    style: {
      maxHeight: 520,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, head.map(h => /*#__PURE__*/React.createElement("th", {
    key: h
  }, h)))), /*#__PURE__*/React.createElement("tbody", null, body.slice(0, 200).map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: i
  }, r.map((c, j) => /*#__PURE__*/React.createElement("td", {
    key: j
  }, c))))))), !body.length && /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "No rows for this selection.")));
}

/* ---------- Haaraya administrator ---------- */
function AdminApp() {
  const {
    state
  } = useHL();
  const v = state.route.view;
  const nav = [["overview", "Platform overview", "chart"], ["orgs", "Organisations", "school"], ["content", "Content access", "layers"], ["users", "Users & access", "key"], ["interop", "Interoperability", "plug"]];
  const ctx = /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, "Haaraya Education"), /*#__PURE__*/React.createElement("span", null, "Platform administration"));
  return /*#__PURE__*/React.createElement(AdultShell, {
    nav: nav,
    ctx: ctx
  }, (v === "overview" || !nav.find(n => n[0] === v)) && /*#__PURE__*/React.createElement(AOverview, null), v === "orgs" && /*#__PURE__*/React.createElement(AOrgs, null), v === "content" && /*#__PURE__*/React.createElement(AContent, null), v === "users" && /*#__PURE__*/React.createElement(AUsers, null), v === "interop" && /*#__PURE__*/React.createElement(AInterop, null));
}
function AOverview() {
  const tot = k => Object.values(AD.ORG_STATS).reduce((s, o) => s + o[k], 0);
  const live = AD.SCHOOLS.filter(s => AD.ORG_STATS[s.id].active > 0);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Platform overview"), /*#__PURE__*/React.createElement("p", null, "All organisations \xB7 Term 1"))), /*#__PURE__*/React.createElement("div", {
    className: "kpis"
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Organisations",
    value: AD.SCHOOLS.length,
    note: `${live.length} live · ${AD.SCHOOLS.length - live.length} onboarding`
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Learners",
    value: tot("learners").toLocaleString(),
    note: "enrolled"
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Teachers",
    value: tot("teachers")
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Weekly active",
    value: AD.PLATFORM_WEEKLY[9],
    note: "+5% vs last week",
    dir: "up"
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Books opened",
    value: AD.PLATFORM_BOOKS[9].toLocaleString(),
    note: "this week"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Weekly active learners"))), /*#__PURE__*/React.createElement(LineChart, {
    labels: AD.TERM_WEEKS,
    series: [{
      name: "Active",
      color: "#1A6E1A",
      data: AD.PLATFORM_WEEKLY
    }],
    h: 190
  })), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Books opened per week"))), /*#__PURE__*/React.createElement(LineChart, {
    labels: AD.TERM_WEEKS,
    series: [{
      name: "Books",
      color: "#1565C0",
      data: AD.PLATFORM_BOOKS
    }],
    h: 190
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid2",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Outcomes: average level gain this term"), /*#__PURE__*/React.createElement("p", null, "Levels gained per learner"))), /*#__PURE__*/React.createElement("div", {
    className: "hbars"
  }, live.map(s => {
    const g = AD.ORG_STATS[s.id].avgGain;
    return /*#__PURE__*/React.createElement("div", {
      className: "r",
      key: s.id,
      style: {
        gridTemplateColumns: "170px minmax(0,1fr) 44px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, s.name), /*#__PURE__*/React.createElement("div", {
      className: "tr"
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        width: g / 1.5 * 100 + "%",
        background: "var(--forest)"
      }
    })), /*#__PURE__*/React.createElement("span", {
      className: "v"
    }, "+", g));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", null, "Active rate by organisation"), /*#__PURE__*/React.createElement("p", null, "Learners active in the last 7 days"))), /*#__PURE__*/React.createElement("div", {
    className: "hbars"
  }, live.map(s => {
    const a = AD.ORG_STATS[s.id].active;
    return /*#__PURE__*/React.createElement("div", {
      className: "r",
      key: s.id,
      style: {
        gridTemplateColumns: "170px minmax(0,1fr) 44px"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, s.name), /*#__PURE__*/React.createElement("div", {
      className: "tr"
    }, /*#__PURE__*/React.createElement("i", {
      style: {
        width: a + "%",
        background: a < 70 ? "var(--yellow-dk)" : "var(--forest)"
      }
    })), /*#__PURE__*/React.createElement("span", {
      className: "v"
    }, a, "%"));
  })))));
}
function AOrgs() {
  const {
    state
  } = useHL();
  const [q, setQ] = React.useState("");
  const [t, setT] = React.useState("all");
  const [open, setOpen] = React.useState(null);
  const rows = AD.SCHOOLS.filter(s => (t === "all" || s.status === t) && (!q || (s.name + s.city).toLowerCase().includes(q.toLowerCase())));
  const o = open && AD.SCHOOLS.find(s => s.id === open);
  const os = o && AD.ORG_STATS[o.id];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Organisations"), /*#__PURE__*/React.createElement("p", null, "Schools, libraries, community groups and government cohorts"))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "filters"
  }, /*#__PURE__*/React.createElement("input", {
    className: "hl-input s",
    placeholder: "Search name or city",
    value: q,
    onChange: e => setQ(e.target.value)
  }), /*#__PURE__*/React.createElement("div", {
    className: "seg"
  }, ["all", "Active", "Pilot", "Onboarding"].map(k => /*#__PURE__*/React.createElement("button", {
    key: k,
    className: t === k ? "on" : "",
    onClick: () => setT(k)
  }, k === "all" ? "All" : k)))), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Organisation"), /*#__PURE__*/React.createElement("th", null, "Type"), /*#__PURE__*/React.createElement("th", null, "Location"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Learners"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Teachers"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Active"), /*#__PURE__*/React.createElement("th", {
    className: "num"
  }, "Collections"), /*#__PURE__*/React.createElement("th", null, "Status"))), /*#__PURE__*/React.createElement("tbody", null, rows.map(s => {
    const st = AD.ORG_STATS[s.id];
    return /*#__PURE__*/React.createElement("tr", {
      key: s.id,
      className: "click",
      onClick: () => setOpen(s.id)
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, s.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--ink-soft)",
        fontWeight: 700
      }
    }, "Since ", s.since)), /*#__PURE__*/React.createElement("td", null, s.type), /*#__PURE__*/React.createElement("td", null, s.city), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, st.learners.toLocaleString()), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, st.teachers), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, st.active ? st.active + "%" : "—"), /*#__PURE__*/React.createElement("td", {
      className: "num"
    }, state.orgCollections[s.id].length), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Status, {
      s: s.status === "Active" ? "complete" : s.status === "Pilot" ? "in_progress" : "not_started",
      label: s.status
    })));
  }))))), o && /*#__PURE__*/React.createElement(Drawer, {
    onClose: () => setOpen(null)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "start",
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontSize: 22,
      fontWeight: 900
    }
  }, o.name), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--ink-soft)",
      fontWeight: 700,
      fontSize: 14
    }
  }, o.type, " \xB7 ", o.city, " \xB7 since ", o.since)), /*#__PURE__*/React.createElement("button", {
    className: "x-btn",
    onClick: () => setOpen(null)
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "x"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "kpis",
    style: {
      gridTemplateColumns: "repeat(3,1fr)"
    }
  }, /*#__PURE__*/React.createElement(Kpi, {
    label: "Learners",
    value: os.learners.toLocaleString()
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Classes",
    value: os.classes
  }), /*#__PURE__*/React.createElement(Kpi, {
    label: "Active",
    value: os.active ? os.active + "%" : "—"
  })), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Assigned collections")), state.orgCollections[o.id].length ? /*#__PURE__*/React.createElement("div", {
    className: "feed"
  }, state.orgCollections[o.id].map(id => {
    const c = AD.COLLECTIONS.find(c => c.id === id);
    return /*#__PURE__*/React.createElement("div", {
      key: id
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, c.name), " \xB7 ", c.levels), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: "var(--ink-soft)",
        fontWeight: 700
      }
    }, c.titles, " items"));
  })) : /*#__PURE__*/React.createElement("p", {
    className: "note"
  }, "No content assigned yet. Use Content access to grant collections."))));
}
function AContent() {
  const {
    state,
    toggleCollection
  } = useHL();
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Content access"), /*#__PURE__*/React.createElement("p", null, "Grant approved collections to each organisation. Authoring and publishing happen in Haaraya Studio."))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Organisation"), AD.COLLECTIONS.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.id,
    style: {
      textAlign: "center",
      whiteSpace: "normal",
      minWidth: 96
    }
  }, c.name, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 700,
      textTransform: "none",
      letterSpacing: 0
    }
  }, c.levels, " \xB7 ", c.titles))))), /*#__PURE__*/React.createElement("tbody", null, AD.SCHOOLS.map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.id
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("b", null, s.name)), AD.COLLECTIONS.map(c => {
    const on = state.orgCollections[s.id].includes(c.id);
    return /*#__PURE__*/React.createElement("td", {
      key: c.id,
      style: {
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "toggle" + (on ? " on" : ""),
      onClick: () => toggleCollection(s.id, c.id),
      "aria-pressed": on,
      "aria-label": `${c.name} for ${s.name}`
    }));
  }))))))));
}
function AUsers() {
  const {
    state,
    toggleUser,
    setUserRole
  } = useHL();
  const [q, setQ] = React.useState("");
  const [r, setR] = React.useState("all");
  const rows = state.adminUsers.filter(u => (r === "all" || u.role === r) && (!q || (u.name + u.email + u.org).toLowerCase().includes(q.toLowerCase())));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Users & access"), /*#__PURE__*/React.createElement("p", null, "Roles control what each person can see. Learner accounts are managed by their school."))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "filters"
  }, /*#__PURE__*/React.createElement("input", {
    className: "hl-input s",
    placeholder: "Search people or organisations",
    value: q,
    onChange: e => setQ(e.target.value)
  }), /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: r,
    onChange: e => setR(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All roles"), ["Teacher", "School admin", "Parent", "Haaraya admin"].map(x => /*#__PURE__*/React.createElement("option", {
    key: x
  }, x)))), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Person"), /*#__PURE__*/React.createElement("th", null, "Organisation"), /*#__PURE__*/React.createElement("th", null, "Role"), /*#__PURE__*/React.createElement("th", null, "Access"))), /*#__PURE__*/React.createElement("tbody", null, rows.map(u => /*#__PURE__*/React.createElement("tr", {
    key: u.id,
    style: u.active ? null : {
      opacity: .6
    }
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "who"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: u.name,
    size: "sm"
  }), /*#__PURE__*/React.createElement("span", null, u.name, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--ink-soft)",
      fontWeight: 600
    }
  }, u.email)))), /*#__PURE__*/React.createElement("td", null, u.org), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: u.role,
    onChange: e => setUserRole(u.id, e.target.value)
  }, ["Teacher", "School admin", "Parent", "Haaraya admin"].map(x => /*#__PURE__*/React.createElement("option", {
    key: x
  }, x)))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "toggle" + (u.active ? " on" : ""),
    onClick: () => toggleUser(u.id),
    "aria-pressed": u.active,
    "aria-label": "Access"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      fontWeight: 700
    }
  }, u.active ? "Enabled" : "Suspended")))))))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      marginBottom: 8
    }
  }, "Role permissions"), /*#__PURE__*/React.createElement("div", {
    className: "tbl-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Permission"), /*#__PURE__*/React.createElement("th", null, "Learner"), /*#__PURE__*/React.createElement("th", null, "Parent"), /*#__PURE__*/React.createElement("th", null, "Teacher"), /*#__PURE__*/React.createElement("th", null, "School admin"), /*#__PURE__*/React.createElement("th", null, "Haaraya admin"))), /*#__PURE__*/React.createElement("tbody", null, [["Read books & complete lessons", 1, 0, 0, 0, 0], ["View own children's progress", 0, 1, 0, 0, 0], ["Assign approved content to classes", 0, 0, 1, 1, 1], ["View class reports", 0, 0, 1, 1, 1], ["Manage teachers, classes, enrolment", 0, 0, 0, 1, 1], ["Grant collections to organisations", 0, 0, 0, 0, 1], ["Create, edit or publish content", 0, 0, 0, 0, 0]].map(([p, ...v]) => /*#__PURE__*/React.createElement("tr", {
    key: p
  }, /*#__PURE__*/React.createElement("td", null, p), v.map((x, i) => /*#__PURE__*/React.createElement("td", {
    key: i
  }, x ? /*#__PURE__*/React.createElement(Icon, {
    n: "check",
    s: 16,
    w: 3
  }) : /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ink-soft)"
    }
  }, "\u2014")))))))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 12,
      color: "var(--ink-soft)",
      fontWeight: 700,
      marginTop: 8
    }
  }, "Content creation is limited to Haaraya Studio's internal authors."))));
}
function AInterop() {
  const box = (t, s, on) => /*#__PURE__*/React.createElement("div", {
    style: {
      border: "1px solid " + (on ? "var(--forest)" : "var(--line-2)"),
      borderStyle: on ? "solid" : "dashed",
      background: on ? "var(--g-lt)" : "#fff",
      borderRadius: 10,
      padding: "12px 14px",
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: 14
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      color: "var(--ink-mid)",
      fontWeight: 600,
      marginTop: 2
    }
  }, s));
  const arrow = /*#__PURE__*/React.createElement("span", {
    style: {
      alignSelf: "center",
      color: "var(--ink-soft)",
      fontWeight: 900
    }
  }, "\u2192");
  const items = [["Native Haaraya learning record", "Books, reading positions, lessons, attempts, scores and journeys. The primary source of truth.", "Active", true], ["SCORM 1.2 / SCORM 2004 export", "Package lessons from Haaraya Studio so a school LMS can launch them and receive completion and score.", "Planned · not built"], ["Launch compatible packages", "Open approved external packages inside Gemmanti and record completion.", "Planned · not built"], ["xAPI statements", "Send learning events to a learning record store, if a partner requires it.", "Under evaluation"], ["LTI 1.3 launch", "Let government or school LMS platforms launch Haaraya with single sign-on.", "Under evaluation"]];
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Interoperability"), /*#__PURE__*/React.createElement("p", null, "Concept only \u2014 Haaraya stays an independent platform; standards are optional bridges."))), /*#__PURE__*/React.createElement("div", {
    className: "card",
    style: {
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "How records flow")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1.2fr) auto minmax(0,1fr)",
      gap: 10
    }
  }, box("Haaraya Studio", "Internal authoring and publishing"), arrow, box("Gemmanti", "Native reading & learning record", true), arrow, box("School / government LMS", "Optional SCORM, xAPI or LTI bridge"))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-h"
  }, /*#__PURE__*/React.createElement("h3", null, "Standards"), /*#__PURE__*/React.createElement("span", {
    className: "hl-status not_started"
  }, "Not implemented in this prototype")), items.map(([t, d, s, on]) => /*#__PURE__*/React.createElement("div", {
    className: "int-row",
    key: t
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, t), /*#__PURE__*/React.createElement("p", null, d)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Status, {
    s: on ? "complete" : s.startsWith("Planned") ? "in_progress" : "not_started",
    label: s
  }), /*#__PURE__*/React.createElement("button", {
    className: "toggle" + (on ? " on" : ""),
    disabled: true,
    "aria-label": t
  }))))));
}
Object.assign(window, {
  ParentApp,
  SchoolApp,
  AdminApp
});