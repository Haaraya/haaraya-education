const LD = window.HL_DATA;
const JOURNEY_STEPS = [{
  k: "Read",
  label: "Reading material",
  sec: 1
}, {
  k: "Guided",
  label: "Guided activity",
  sec: 2
}, {
  k: "Practice",
  label: "Practice",
  sec: 3
}, {
  k: "Check",
  label: "Assessment",
  sec: 4
}, {
  k: "Done",
  label: "Completion",
  sec: 5
}];
const L2_UNITS = [{
  id: "L2-U1",
  title: "Short Vowel Sounds",
  done: true
}, {
  id: "L2-U2",
  title: "Blends: st, sp, sn",
  done: true
}, {
  id: "L2-U3",
  title: "Sight Words in Sentences",
  cur: true
}, {
  id: "L2-U4",
  title: "Reading Sound Stories"
}, {
  id: "L2-U5",
  title: "Sounds Together Review"
}, {
  id: "L2-U6",
  title: "Level 2 Check"
}];
function journeyFor(L) {
  if (L.level === 4) return LD.JOURNEYS[0];
  return {
    id: "J-L2-S",
    title: "Level 2 · Sounds Together",
    level: 2,
    strand: "Soundables",
    units: L2_UNITS
  };
}
function journeyPos(rec) {
  if (rec.status === "complete") return 5;
  if (rec.status === "not_started") return 0;
  return rec.step <= 1 ? 0 : Math.min(3, rec.step - 1);
}
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
function LevelPath({
  level
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "levelpath",
    "aria-label": `Level ${level} of 15`
  }, LD.LEVELS.map((lv, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: lv.n
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    className: "ln" + (lv.n <= level ? " done" : "")
  }), /*#__PURE__*/React.createElement("span", {
    className: "lv" + (lv.n < level ? " done" : lv.n === level ? " cur" : "") + (lv.odyssey ? " ody" : ""),
    title: lv.odyssey ? "Odyssey level" : ""
  }, lv.n))));
}
function BookCard({
  book,
  L,
  onOpen
}) {
  const r = L.reading[book.id];
  const done = L.booksDone.includes(book.id);
  return /*#__PURE__*/React.createElement("button", {
    className: "bookcard",
    onClick: () => onOpen(book)
  }, /*#__PURE__*/React.createElement(Cover, {
    book: book,
    progress: r ? r.page / r.pages : null,
    done: done
  }), /*#__PURE__*/React.createElement("b", null, book.t), /*#__PURE__*/React.createElement("div", {
    className: "m"
  }, /*#__PURE__*/React.createElement(LevelTag, {
    l: book.l
  }), /*#__PURE__*/React.createElement(StrandTag, {
    s: book.s
  })));
}
function LearnerHome({
  L
}) {
  const {
    state,
    go
  } = useHL();
  const rec = hlLessonRec(L);
  const assigned = hlAssignedFor(state, L);
  const reading = Object.entries(L.reading).filter(([, r]) => !r.done).sort((a, b) => b[1].at.localeCompare(a[1].at));
  const cont = reading[0] && {
    book: hlBook(reading[0][0]),
    r: reading[0][1]
  };
  const lessonAssigned = assigned.find(a => a.type === "lesson" && a.ref === LD.LESSON_ID);
  const wsA = assigned.find(a => a.type === "worksheet" && hlWsRec(L, a.ref).status !== "reviewed") || assigned.find(a => a.type === "worksheet");
  const wsR = wsA && hlWsRec(L, wsA.ref);
  const wsW = wsA && HLWS.get(wsA.ref);
  const J = journeyFor(L);
  const shelf = LD.BOOKS.filter(b => b.l === L.level || b.l === L.level - 1).slice(0, 14);
  const jpos = journeyPos(rec);
  const first = L.name.split(" ")[0];
  return /*#__PURE__*/React.createElement("div", {
    className: "kid-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kid-hello"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, greeting(), ", ", first), /*#__PURE__*/React.createElement("p", null, wsR && (wsR.status === "not_started" || wsR.status === "in_progress") ? "You have a worksheet waiting for you." : wsR && wsR.status === "reviewed" && !wsR.seen ? "Your teacher has looked at your worksheet." : lessonAssigned && rec.status !== "complete" ? "You have a lesson waiting for you." : cont ? "Pick up where you left off." : "Find a new book to read.")), /*#__PURE__*/React.createElement("button", {
    className: "kid-levelcard",
    style: {
      background: "#fff",
      textAlign: "left"
    },
    onClick: () => go("me")
  }, /*#__PURE__*/React.createElement("img", {
    src: `assets/stamp-l${L.level}.png`,
    alt: ""
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("b", null, "Level ", L.level), /*#__PURE__*/React.createElement(Bar, {
    v: L.levelPct,
    cls: "thick y"
  }), /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, L.levelPct, "% of Level ", L.level, " complete")))), /*#__PURE__*/React.createElement("div", {
    className: "kid-hero"
  }, wsA && /*#__PURE__*/React.createElement("button", {
    className: "kid-cont",
    onClick: () => go("worksheet", {
      code: wsA.ref
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement(Cover, {
    book: hlBook(wsA.ref)
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, wsR.status === "reviewed" ? wsR.seen ? "Worksheet recorded" : "Your teacher has looked at it" : wsR.status === "handed_in" ? "Worksheet handed in" : wsR.status === "in_progress" ? "Continue your worksheet" : "New worksheet from your teacher"), /*#__PURE__*/React.createElement("h3", null, wsW.title), /*#__PURE__*/React.createElement("div", {
    className: "ws-mini"
  }, HLWS.SECS.map(s => /*#__PURE__*/React.createElement("span", {
    key: s.k,
    className: wsAnswered(wsW, s.k, wsR) ? "on" : "",
    title: s.n
  }, s.i))), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, wsR.status === "handed_in" || wsR.status === "reviewed" ? "Handed in" : "Word Focus · Read It Again · Think About It · Show What You Know"), /*#__PURE__*/React.createElement("span", {
    className: "hl-btn go " + (wsR.status === "handed_in" || wsR.status === "reviewed" ? "ghost" : "yellow")
  }, wsR.status === "not_started" ? "Start" : wsR.status === "in_progress" ? "Resume" : "Open", /*#__PURE__*/React.createElement(Icon, {
    n: "next",
    s: 16
  })))), lessonAssigned && /*#__PURE__*/React.createElement("button", {
    className: "kid-cont",
    onClick: () => go("lesson")
  }, /*#__PURE__*/React.createElement("div", {
    className: "lesson-tile"
  }, /*#__PURE__*/React.createElement("small", null, LD.LESSON.unit), /*#__PURE__*/React.createElement("b", null, "1 2 3"), /*#__PURE__*/React.createElement("small", null, "Level ", LD.LESSON.level)), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, rec.status === "complete" ? "Lesson complete" : rec.status === "in_progress" ? "Continue your lesson" : "New lesson from your teacher"), /*#__PURE__*/React.createElement("h3", null, LD.LESSON.title), /*#__PURE__*/React.createElement(Bar, {
    v: rec.status === "complete" ? 100 : jpos / 5 * 100
  }), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, rec.status === "complete" ? `Score ${hlLastAttempt(rec).score} of 6 · Passed` : rec.status === "in_progress" ? `Step ${jpos + 1} of 5 · ${JOURNEY_STEPS[jpos].label}` : `About ${LD.LESSON.mins} minutes`), /*#__PURE__*/React.createElement("span", {
    className: "hl-btn go " + (rec.status === "complete" ? "ghost" : "yellow")
  }, rec.status === "complete" ? "Review lesson" : rec.status === "in_progress" ? "Resume" : "Start", /*#__PURE__*/React.createElement(Icon, {
    n: "next",
    s: 16
  })))), cont && /*#__PURE__*/React.createElement("button", {
    className: "kid-cont",
    onClick: () => go("reader", {
      id: cont.book.id
    })
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%"
    }
  }, /*#__PURE__*/React.createElement(Cover, {
    book: cont.book,
    progress: cont.r.page / cont.r.pages
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "Continue reading"), /*#__PURE__*/React.createElement("h3", null, cont.book.t), /*#__PURE__*/React.createElement(Bar, {
    v: cont.r.page / cont.r.pages * 100,
    cls: "y"
  }), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Page ", cont.r.page, " of ", cont.r.pages), /*#__PURE__*/React.createElement("span", {
    className: "hl-btn go"
  }, "Keep reading", /*#__PURE__*/React.createElement(Icon, {
    n: "next",
    s: 16
  }))))), assigned.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "kid-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kid-sec-h"
  }, /*#__PURE__*/React.createElement("h2", null, "From my teacher")), /*#__PURE__*/React.createElement("div", {
    className: "assign-list"
  }, assigned.map(a => {
    const st = hlAssignStatus(L, a);
    const b = a.type === "book" && hlBook(a.ref);
    const open = () => a.type === "worksheet" ? go("worksheet", {
      code: a.ref
    }) : a.type === "lesson" ? a.ref === LD.LESSON_ID ? go("lesson") : go("lessoninfo", {
      id: a.ref
    }) : a.type === "book" ? go("book", {
      id: a.ref
    }) : go("journey");
    return /*#__PURE__*/React.createElement("button", {
      className: "assign-row",
      key: a.id,
      onClick: open
    }, a.type === "worksheet" ? /*#__PURE__*/React.createElement("div", {
      className: "thumb"
    }, /*#__PURE__*/React.createElement(Cover, {
      book: hlBook(a.ref)
    })) : b ? /*#__PURE__*/React.createElement("div", {
      className: "thumb"
    }, /*#__PURE__*/React.createElement(Cover, {
      book: b
    })) : /*#__PURE__*/React.createElement("div", {
      className: "ic"
    }, /*#__PURE__*/React.createElement(Icon, {
      n: a.type === "lesson" ? "star" : "path",
      s: 22
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, a.title), /*#__PURE__*/React.createElement("span", {
      className: "d"
    }, a.type === "lesson" ? "Lesson" : a.type === "book" ? "Book" : a.type === "worksheet" ? "Worksheet" : "Learning journey", " \xB7 Due ", new Date(a.due).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short"
    }), hlIsOverdue(a.due, st === "complete") && /*#__PURE__*/React.createElement(React.Fragment, null, " \xB7 ", /*#__PURE__*/React.createElement(Overdue, null)))), /*#__PURE__*/React.createElement(Status, {
      s: st,
      label: st === "complete" ? "Done" : null
    }));
  }))), /*#__PURE__*/React.createElement("section", {
    className: "kid-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kid-sec-h"
  }, /*#__PURE__*/React.createElement("h2", null, "My learning journey"), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn quiet",
    onClick: () => go("journey")
  }, "Open journey", /*#__PURE__*/React.createElement(Icon, {
    n: "next",
    s: 16
  }))), /*#__PURE__*/React.createElement("div", {
    className: "unit",
    style: {
      padding: "16px 18px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, J.title), /*#__PURE__*/React.createElement("div", {
    className: "steps",
    style: {
      gridTemplateColumns: `repeat(${J.units.length},minmax(0,1fr))`
    }
  }, J.units.map((u, i) => {
    const st = u.done ? "done" : u.live ? rec.status === "complete" ? "done" : "cur" : u.cur ? "cur" : "";
    return /*#__PURE__*/React.createElement("div", {
      key: u.id,
      className: "stepc " + st
    }, /*#__PURE__*/React.createElement("span", {
      className: "k"
    }, "Unit ", i + 1), u.title, /*#__PURE__*/React.createElement("span", {
      className: "ico"
    }, st === "done" ? "Done" : st === "cur" ? "Now" : "Up next"));
  })))), /*#__PURE__*/React.createElement("section", {
    className: "kid-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kid-sec-h"
  }, /*#__PURE__*/React.createElement("h2", null, "My library"), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn quiet",
    onClick: () => go("library")
  }, "See all books", /*#__PURE__*/React.createElement(Icon, {
    n: "next",
    s: 16
  }))), /*#__PURE__*/React.createElement("div", {
    className: "shelf row"
  }, shelf.map(b => /*#__PURE__*/React.createElement(BookCard, {
    key: b.id,
    book: b,
    L: L,
    onOpen: b => go("book", {
      id: b.id
    })
  })))), /*#__PURE__*/React.createElement("section", {
    className: "kid-sec kid-two"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "kid-sec-h"
  }, /*#__PURE__*/React.createElement("h2", null, "Reading progress")), /*#__PURE__*/React.createElement("div", {
    className: "stat-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("b", null, L.booksDone.length), /*#__PURE__*/React.createElement("span", null, "Books finished")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("b", null, Object.values(L.reading).filter(r => !r.done).length), /*#__PURE__*/React.createElement("span", null, "Reading now")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("b", null, Object.values(L.lessons).filter(r => r.status === "complete").length + (L.level === 4 ? 2 : 2)), /*#__PURE__*/React.createElement("span", null, "Lessons passed"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(LevelPath, {
    level: L.level
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "kid-sec-h"
  }, /*#__PURE__*/React.createElement("h2", null, "Recent achievements"), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn quiet",
    onClick: () => go("me")
  }, "All")), /*#__PURE__*/React.createElement("div", {
    className: "ach-row"
  }, L.achievements.slice().reverse().slice(0, 4).map(id => /*#__PURE__*/React.createElement(Achievement, {
    key: id,
    id: id,
    fresh: id === "order-finder"
  }))))));
}
function Achievement({
  id,
  fresh,
  locked
}) {
  const a = LD.ACHIEVEMENTS[id];
  return /*#__PURE__*/React.createElement("div", {
    className: "ach" + (fresh ? " new" : ""),
    style: locked ? {
      opacity: .4,
      filter: "grayscale(1)"
    } : null
  }, a.stamp ? /*#__PURE__*/React.createElement("img", {
    src: a.stamp,
    alt: ""
  }) : /*#__PURE__*/React.createElement("span", {
    className: "medal"
  }, a.glyph), /*#__PURE__*/React.createElement("b", null, a.label));
}
function Library({
  L
}) {
  const {
    go
  } = useHL();
  const [q, setQ] = React.useState("");
  const [strand, setStrand] = React.useState("All");
  const [lvl, setLvl] = React.useState(0);
  const [st, setSt] = React.useState("All");
  const list = LD.BOOKS.filter(b => (!q || b.t.toLowerCase().includes(q.toLowerCase())) && (strand === "All" || b.s === strand) && (!lvl || b.l === lvl) && (st === "All" || (st === "Finished" ? L.booksDone.includes(b.id) : st === "Reading" ? L.reading[b.id] && !L.reading[b.id].done && !L.booksDone.includes(b.id) : !L.reading[b.id] && !L.booksDone.includes(b.id))));
  return /*#__PURE__*/React.createElement("div", {
    className: "kid-wrap"
  }, /*#__PURE__*/React.createElement("h1", null, "Library"), /*#__PURE__*/React.createElement("div", {
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
  })), /*#__PURE__*/React.createElement("div", {
    className: "chips"
  }, ["All", ...LD.STRANDS.map(s => s.id)].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    className: "chip" + (strand === s ? " on" : ""),
    onClick: () => setStrand(s)
  }, s !== "All" && /*#__PURE__*/React.createElement("span", {
    className: "dot",
    style: {
      background: strandOf(s).color
    }
  }), s)))), /*#__PURE__*/React.createElement("div", {
    className: "lvl-strip"
  }, /*#__PURE__*/React.createElement("button", {
    className: "chip" + (!lvl ? " on" : ""),
    onClick: () => setLvl(0)
  }, "All levels"), LD.LEVELS.map(l => /*#__PURE__*/React.createElement("button", {
    key: l.n,
    className: "chip" + (lvl === l.n ? " on" : ""),
    onClick: () => setLvl(l.n),
    style: l.odyssey && lvl !== l.n ? {
      borderStyle: "dashed"
    } : null
  }, "L", l.n))), /*#__PURE__*/React.createElement("div", {
    className: "chips",
    style: {
      marginTop: 8
    }
  }, ["All", "Reading", "Finished", "Not started"].map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    className: "chip" + (st === s ? " on" : ""),
    onClick: () => setSt(s)
  }, s))), /*#__PURE__*/React.createElement("div", {
    className: "lib-count"
  }, list.length, " ", list.length === 1 ? "book" : "books", lvl >= 13 ? " · Odyssey" : ""), list.length ? /*#__PURE__*/React.createElement("div", {
    className: "shelf"
  }, list.map(b => /*#__PURE__*/React.createElement(BookCard, {
    key: b.id,
    book: b,
    L: L,
    onOpen: b => go("book", {
      id: b.id
    })
  }))) : /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "No books match. Try another level or clear the search."));
}
function BookDetail({
  L,
  id
}) {
  const {
    state,
    go
  } = useHL();
  const b = hlBook(id);
  if (!b) return null;
  const r = L.reading[b.id];
  const done = L.booksDone.includes(b.id);
  const asg = hlAssignedFor(state, L).find(a => a.type === "book" && a.ref === b.id);
  const lv = LD.LEVELS[b.l - 1];
  return /*#__PURE__*/React.createElement("div", {
    className: "kid-wrap"
  }, /*#__PURE__*/React.createElement("button", {
    className: "back",
    onClick: () => go("library")
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "back"
  }), "Library"), /*#__PURE__*/React.createElement("div", {
    className: "bk"
  }, /*#__PURE__*/React.createElement(Cover, {
    book: b,
    progress: r ? r.page / r.pages : null,
    done: done
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, lv.odyssey ? "Odyssey" : lv.band, " \xB7 ", b.k), /*#__PURE__*/React.createElement("h1", null, b.t), /*#__PURE__*/React.createElement("div", {
    className: "facts"
  }, /*#__PURE__*/React.createElement(LevelTag, {
    l: b.l
  }), /*#__PURE__*/React.createElement(StrandTag, {
    s: b.s
  }), /*#__PURE__*/React.createElement("span", {
    className: "hl-tag",
    style: {
      background: "var(--sand)"
    }
  }, b.pages, " pages"), asg && /*#__PURE__*/React.createElement("span", {
    className: "hl-tag",
    style: {
      background: "var(--amber-bg)",
      color: "var(--amber)"
    }
  }, "From my teacher")), done ? /*#__PURE__*/React.createElement(Status, {
    s: "complete",
    label: "You finished this book"
  }) : r ? /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 360
    }
  }, /*#__PURE__*/React.createElement(Bar, {
    v: r.page / r.pages * 100,
    cls: "thick y"
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontWeight: 700,
      color: "var(--ink-mid)",
      marginTop: 8
    }
  }, "You are on page ", r.page, " of ", r.pages)) : /*#__PURE__*/React.createElement(Status, {
    s: "not_started",
    label: "Not started yet"
  }), /*#__PURE__*/React.createElement("div", {
    className: "actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn big",
    onClick: () => go("reader", {
      id: b.id,
      restart: done
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "play",
    s: 18
  }), done ? "Read again" : r ? `Resume from page ${r.page}` : "Start reading"), r && !done && /*#__PURE__*/React.createElement("button", {
    className: "hl-btn big ghost",
    onClick: () => go("reader", {
      id: b.id,
      restart: true
    })
  }, "Start over"), HLWS.get(b.id) && /*#__PURE__*/React.createElement("button", {
    className: "hl-btn big yellow",
    onClick: () => go("worksheet", {
      code: b.id
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "sheet",
    s: 18
  }), hlWsRec(L, b.id).status === "not_started" ? "Do the worksheet" : hlWsRec(L, b.id).status === "in_progress" ? "Continue the worksheet" : "My worksheet")))));
}
function Reader({
  L,
  id,
  restart
}) {
  const {
    go,
    readSave,
    readFinish
  } = useHL();
  const b = hlBook(id);
  const r = L.reading[b.id];
  const [p, setP] = React.useState(restart || !r ? 0 : r.page);
  const end = b.pages + 1;
  React.useEffect(() => {
    if (p > 0 && p <= b.pages) readSave(L.id, b.id, p, b.pages);
  }, [p]);
  React.useEffect(() => {
    const k = e => {
      if (e.key === "ArrowRight") setP(x => Math.min(end, x + 1));
      if (e.key === "ArrowLeft") setP(x => Math.max(0, x - 1));
      if (e.key === "Escape") go("book", {
        id: b.id
      });
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  const [pg, setPg] = React.useState(null);
  const [err, setErr] = React.useState(false);
  React.useEffect(() => {
    if (b.live) HLWS.pages(b.id).then(setPg).catch(() => setErr(true));
  }, []);
  const cur = pg && pg[p - 1];
  const page = p === 0 ? /*#__PURE__*/React.createElement(Cover, {
    book: b
  }) : p === end ? /*#__PURE__*/React.createElement("div", {
    className: "ph",
    style: {
      background: "#fff",
      fontFamily: "var(--read)",
      fontSize: 22,
      color: "var(--ink)"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: `assets/stamp-l${Math.min(12, b.l)}.png`,
    alt: "",
    style: {
      width: 96,
      height: 96,
      objectFit: "contain"
    }
  }), /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: 30
    }
  }, "The End"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 17,
      color: "var(--ink-mid)"
    }
  }, b.t), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn big",
    onClick: () => {
      readFinish(L.id, b);
      go("book", {
        id: b.id
      });
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "check"
  }), "I finished this book")) : cur ? /*#__PURE__*/React.createElement("div", {
    className: "rd-live"
  }, /*#__PURE__*/React.createElement("img", {
    src: cur.img,
    alt: `Page ${p}`
  }), /*#__PURE__*/React.createElement("p", null, cur.text)) : /*#__PURE__*/React.createElement("div", {
    className: "ph"
  }, /*#__PURE__*/React.createElement("b", null, "Page ", p), err ? "This page could not load. Check the connection and try again." : "Loading page…");
  return /*#__PURE__*/React.createElement("div", {
    className: "reader",
    role: "dialog",
    "aria-label": b.t
  }, /*#__PURE__*/React.createElement("div", {
    className: "reader-top"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost sm",
    onClick: () => go("book", {
      id: b.id
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "x",
    s: 16
  }), "Close"), /*#__PURE__*/React.createElement("b", null, b.t), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontSize: 13,
      opacity: .75,
      fontWeight: 700
    }
  }, "Your place is saved")), /*#__PURE__*/React.createElement("div", {
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
  }, page), /*#__PURE__*/React.createElement("button", {
    className: "reader-nav n",
    disabled: p === end,
    onClick: () => setP(p + 1),
    "aria-label": "Next page"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "next",
    s: 26
  }))), /*#__PURE__*/React.createElement("div", {
    className: "reader-foot"
  }, /*#__PURE__*/React.createElement("span", null, p === 0 ? "Cover" : p === end ? "End" : `Page ${p} of ${b.pages}`), /*#__PURE__*/React.createElement(Bar, {
    v: p / end * 100
  })));
}
function Journey({
  L
}) {
  const {
    go
  } = useHL();
  const rec = hlLessonRec(L);
  const J = journeyFor(L);
  const pos = journeyPos(rec);
  const doneUnits = J.units.filter(u => u.done || u.live && rec.status === "complete").length;
  return /*#__PURE__*/React.createElement("div", {
    className: "kid-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, J.strand, " \xB7 Level ", J.level), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "6px 0 24px"
    }
  }, J.title.split(" · ")[1]), /*#__PURE__*/React.createElement("div", {
    className: "jr"
  }, /*#__PURE__*/React.createElement("div", {
    className: "jr-units"
  }, J.units.map((u, i) => {
    const live = u.live;
    const cur = live ? rec.status !== "complete" : u.cur;
    const done = u.done || live && rec.status === "complete";
    return /*#__PURE__*/React.createElement("div", {
      key: u.id,
      className: "unit" + (done ? " done" : cur ? " cur" : " locked")
    }, /*#__PURE__*/React.createElement("div", {
      className: "unit-h"
    }, /*#__PURE__*/React.createElement("span", {
      className: "n"
    }, done ? /*#__PURE__*/React.createElement(Icon, {
      n: "check",
      s: 18,
      w: 3
    }) : i + 1), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "eyebrow"
    }, "Unit ", i + 1), /*#__PURE__*/React.createElement("h3", null, u.title)), live && /*#__PURE__*/React.createElement("button", {
      className: "hl-btn " + (done ? "ghost" : "yellow"),
      onClick: () => go("lesson")
    }, done ? "Review" : rec.status === "in_progress" ? "Resume" : "Start"), !live && cur && /*#__PURE__*/React.createElement("span", {
      className: "hl-status in_progress"
    }, "Now")), (cur || live && done) && /*#__PURE__*/React.createElement("div", {
      className: "steps"
    }, JOURNEY_STEPS.map((s, k) => {
      const st = live ? k < pos || k === 4 && done ? "done" : k === pos ? "cur" : "" : k < 2 ? "done" : k === 2 ? "cur" : "";
      return /*#__PURE__*/React.createElement("button", {
        key: s.k,
        className: "stepc " + st,
        onClick: () => live && go("lesson", {
          jump: s.sec
        }),
        disabled: !live,
        style: {
          cursor: live ? "pointer" : "default"
        }
      }, /*#__PURE__*/React.createElement("span", {
        className: "k"
      }, k + 1, " \xB7 ", s.k), s.label, /*#__PURE__*/React.createElement("span", {
        className: "ico"
      }, st === "done" ? "Done" : st === "cur" ? "Now" : "Up next"));
    })), !live && cur && /*#__PURE__*/React.createElement("p", {
      className: "note",
      style: {
        marginTop: 12
      }
    }, "Demo: the playable lesson is Amara's Level 4 \u201CSteps in Order\u201D."));
  })), /*#__PURE__*/React.createElement("aside", {
    className: "unit",
    style: {
      position: "sticky",
      top: 84
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: `assets/stamp-l${J.level}.png`,
    alt: "",
    style: {
      width: 64,
      height: 64,
      objectFit: "contain"
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", {
    style: {
      fontSize: 18,
      fontFamily: "var(--read)"
    }
  }, "Level ", J.level), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      color: "var(--ink-soft)",
      fontWeight: 700
    }
  }, doneUnits, " of ", J.units.length, " units done"))), /*#__PURE__*/React.createElement("div", {
    style: {
      margin: "14px 0 20px"
    }
  }, /*#__PURE__*/React.createElement(Bar, {
    v: doneUnits / J.units.length * 100,
    cls: "thick"
  })), /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      marginBottom: 8
    }
  }, "All levels"), /*#__PURE__*/React.createElement(LevelPath, {
    level: L.level
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      color: "var(--ink-soft)",
      fontWeight: 600,
      marginTop: 8
    }
  }, "Levels 13\u201315 are Odyssey levels."))));
}
function MyProgress({
  L
}) {
  const {
    go
  } = useHL();
  const rec = hlLessonRec(L);
  const allAch = Object.keys(LD.ACHIEVEMENTS);
  return /*#__PURE__*/React.createElement("div", {
    className: "kid-wrap"
  }, /*#__PURE__*/React.createElement("h1", null, "My reading"), /*#__PURE__*/React.createElement("section", {
    className: "kid-sec",
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("b", null, "L", L.level), /*#__PURE__*/React.createElement("span", null, L.levelPct, "% of level done")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("b", null, L.booksDone.length), /*#__PURE__*/React.createElement("span", null, "Books finished")), /*#__PURE__*/React.createElement("div", {
    className: "stat"
  }, /*#__PURE__*/React.createElement("b", null, L.achievements.length), /*#__PURE__*/React.createElement("span", null, "Achievements"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(LevelPath, {
    level: L.level
  }))), /*#__PURE__*/React.createElement("section", {
    className: "kid-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kid-sec-h"
  }, /*#__PURE__*/React.createElement("h2", null, "Achievements")), /*#__PURE__*/React.createElement("div", {
    className: "ach-row"
  }, allAch.map(id => /*#__PURE__*/React.createElement(Achievement, {
    key: id,
    id: id,
    locked: !L.achievements.includes(id)
  })))), rec.attempts.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "kid-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kid-sec-h"
  }, /*#__PURE__*/React.createElement("h2", null, "My checks")), /*#__PURE__*/React.createElement("div", {
    className: "assign-list"
  }, rec.attempts.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "assign-row",
    style: {
      cursor: "default"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "ic"
  }, a.score, "/6"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, LD.LESSON.title, " \xB7 try ", i + 1), /*#__PURE__*/React.createElement("span", {
    className: "d"
  }, a.date)), /*#__PURE__*/React.createElement(Status, {
    s: a.pass ? "complete" : "fail",
    label: a.pass ? "Passed" : "Try again"
  }))))), /*#__PURE__*/React.createElement("section", {
    className: "kid-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kid-sec-h"
  }, /*#__PURE__*/React.createElement("h2", null, "My worksheets")), /*#__PURE__*/React.createElement("div", {
    className: "assign-list"
  }, Object.keys(L.worksheets || {}).filter(c => HLWS.get(c)).map(c => {
    const r = L.worksheets[c];
    return /*#__PURE__*/React.createElement("button", {
      key: c,
      className: "assign-row",
      onClick: () => go("worksheet", {
        code: c
      })
    }, /*#__PURE__*/React.createElement("div", {
      className: "thumb"
    }, /*#__PURE__*/React.createElement(Cover, {
      book: hlBook(c)
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("b", null, HLWS.get(c).title), /*#__PURE__*/React.createElement("span", {
      className: "d"
    }, r.status === "reviewed" ? "Your teacher has looked at it" : r.status === "handed_in" ? "Handed in" : "Not finished yet")), /*#__PURE__*/React.createElement(Status, {
      s: r.status === "reviewed" || r.status === "handed_in" ? "complete" : "in_progress",
      label: r.status === "reviewed" ? "Looked at" : r.status === "handed_in" ? "Handed in" : null
    }));
  }), !Object.keys(L.worksheets || {}).length && /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "Finish a book, then try its worksheet."))), /*#__PURE__*/React.createElement("section", {
    className: "kid-sec"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kid-sec-h"
  }, /*#__PURE__*/React.createElement("h2", null, "Books I finished")), /*#__PURE__*/React.createElement("div", {
    className: "shelf"
  }, L.booksDone.map(hlBook).filter(Boolean).map(b => /*#__PURE__*/React.createElement(BookCard, {
    key: b.id,
    book: b,
    L: L,
    onOpen: b => go("book", {
      id: b.id
    })
  })))));
}
function LessonInfo({
  id
}) {
  const {
    go
  } = useHL();
  const l = LD.LESSON_CATALOG.find(x => x.id === id) || {};
  return /*#__PURE__*/React.createElement("div", {
    className: "kid-wrap"
  }, /*#__PURE__*/React.createElement("button", {
    className: "back",
    onClick: () => go("home")
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "back"
  }), "Home"), /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      marginTop: 12
    }
  }, "Level ", l.level, " \xB7 ", l.strand), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "6px 0 16px"
    }
  }, l.title), /*#__PURE__*/React.createElement("p", {
    className: "note",
    style: {
      maxWidth: 520
    }
  }, "This prototype includes one playable lesson: \u201CSteps in Order\u201D (Level 4). Other lessons appear here once Haaraya Studio publishes them."));
}
const KID_NAV = [["home", "Home", "home"], ["library", "Library", "book"], ["journey", "Journey", "path"], ["me", "My reading", "star"]];
function LearnerApp() {
  const {
    state,
    go
  } = useHL();
  const L = state.learners[state.personaId];
  const r = state.route;
  const navOn = {
    book: "library",
    reader: "library",
    lessoninfo: "home",
    lesson: "journey",
    worksheet: "home"
  }[r.view] || r.view;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(TopNav, {
    items: KID_NAV,
    on: navOn
  }), /*#__PURE__*/React.createElement("main", {
    className: "kid"
  }, r.view === "home" && /*#__PURE__*/React.createElement(LearnerHome, {
    L: L
  }), r.view === "library" && /*#__PURE__*/React.createElement(Library, {
    L: L
  }), (r.view === "book" || r.view === "reader") && /*#__PURE__*/React.createElement(BookDetail, {
    L: L,
    id: r.id
  }), r.view === "journey" && /*#__PURE__*/React.createElement(Journey, {
    L: L
  }), r.view === "me" && /*#__PURE__*/React.createElement(MyProgress, {
    L: L
  }), r.view === "lessoninfo" && /*#__PURE__*/React.createElement(LessonInfo, {
    id: r.id
  }), r.view === "worksheet" && /*#__PURE__*/React.createElement(WorksheetPlayer, {
    key: r.code,
    L: L,
    code: r.code
  }), r.view === "lesson" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Journey, {
    L: L
  }), /*#__PURE__*/React.createElement(LessonPlayer, {
    L: L,
    jump: r.jump
  }))), r.view === "reader" && /*#__PURE__*/React.createElement(Reader, {
    L: L,
    id: r.id,
    restart: r.restart
  }), /*#__PURE__*/React.createElement("nav", {
    className: "mobile-tabs"
  }, KID_NAV.map(([v, l, i]) => /*#__PURE__*/React.createElement("button", {
    key: v,
    className: navOn === v ? "on" : "",
    onClick: () => go(v)
  }, /*#__PURE__*/React.createElement(Icon, {
    n: i,
    s: 22
  }), l))));
}
function TopNav({
  items,
  on
}) {
  const {
    go
  } = useHL();
  return /*#__PURE__*/React.createElement("header", {
    className: "hl-top"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-brand",
    onClick: () => items && go(items[0][0]),
    "aria-label": "Gemmanti home"
  }, /*#__PURE__*/React.createElement("img", {
    className: "hl-logo",
    src: "assets/logo-gemmanti.png",
    alt: "Gemmanti"
  })), /*#__PURE__*/React.createElement("nav", {
    className: "hl-topnav"
  }, items && items.map(([v, l, i]) => /*#__PURE__*/React.createElement("button", {
    key: v,
    className: on === v ? "on" : "",
    onClick: () => go(v)
  }, /*#__PURE__*/React.createElement(Icon, {
    n: i
  }), l))), !items && /*#__PURE__*/React.createElement("div", {
    className: "hl-spacer"
  }), /*#__PURE__*/React.createElement(RoleSwitcher, null));
}
Object.assign(window, {
  LearnerApp,
  TopNav,
  LevelPath,
  journeyPos,
  JOURNEY_STEPS
});