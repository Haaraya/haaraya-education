const PD = window.HL_DATA;
const LS = PD.LESSON;
const VOCAB_KEY = {
  soil: "soil",
  seed: "seed",
  seeds: "seed",
  sunny: "sunny",
  shoot: "shoot"
};
function tokenize(p) {
  const raw = p.split(" ");
  const out = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] === "After" && raw[i + 1] && raw[i + 1].startsWith("that")) {
      out.push(raw[i] + " " + raw[i + 1]);
      i++;
    } else out.push(raw[i]);
  }
  return out;
}
const bare = t => t.replace(/[.,!?“”]/g, "");
function shuffled(a, seed) {
  const r = a.map((x, i) => [x, (i * 7919 + seed * 104729) % 97]);
  return r.sort((x, y) => x[1] - y[1]).map(x => x[0]);
}
function LessonPlayer({
  L,
  jump
}) {
  const {
    go,
    lessonSave,
    lessonAttempt
  } = useHL();
  const rec = hlLessonRec(L);
  const maxReached = rec.status === "complete" ? 5 : rec.step;
  const [sec, setSec] = React.useState(() => jump != null && jump <= Math.max(maxReached, 1) ? jump : rec.status === "complete" ? 5 : rec.step);
  const [gate, setGate] = React.useState({});
  const lp = React.useRef();
  const toSec = n => {
    setSec(n);
    if (n > rec.step && n < 5) lessonSave(L.id, LS.id, {
      step: n
    });
    if (lp.current) lp.current.scrollTop = 0;
  };
  const close = () => go("home");
  const ready = sec === 0 || sec === 1 || gate[sec];
  const lastAt = hlLastAttempt(rec);
  return /*#__PURE__*/React.createElement("div", {
    className: "lp",
    ref: lp,
    role: "dialog",
    "aria-label": LS.title
  }, /*#__PURE__*/React.createElement("div", {
    className: "lp-top"
  }, /*#__PURE__*/React.createElement("button", {
    className: "x-btn",
    onClick: close,
    "aria-label": "Save and close"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "x"
  })), /*#__PURE__*/React.createElement("div", {
    className: "t"
  }, LS.title, /*#__PURE__*/React.createElement("small", null, "Level ", LS.level, " \xB7 ", LS.strand, " \xB7 ", LS.unit)), /*#__PURE__*/React.createElement("div", {
    className: "lp-steps"
  }, PD.SECTIONS.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: s,
    className: i === sec ? "on" : i < Math.max(sec, maxReached) || i === 5 && rec.status === "complete" ? "done" : ""
  }, /*#__PURE__*/React.createElement("i", null, i < sec || i === 5 && rec.status === "complete" && sec !== 5 ? "✓" : i + 1), /*#__PURE__*/React.createElement("b", null, s)))), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--ink-soft)",
      fontWeight: 700
    }
  }, "Progress saves automatically")), /*#__PURE__*/React.createElement("div", {
    className: "lp-body"
  }, sec === 0 && /*#__PURE__*/React.createElement(Intro, null), sec === 1 && /*#__PURE__*/React.createElement(ReadSec, null), sec === 2 && /*#__PURE__*/React.createElement(Guided, {
    onDone: v => setGate(g => ({
      ...g,
      2: v
    }))
  }), sec === 3 && /*#__PURE__*/React.createElement(Practice, {
    onDone: v => setGate(g => ({
      ...g,
      3: v
    }))
  }), sec === 4 && /*#__PURE__*/React.createElement(Quiz, {
    onFinish: (score, ans) => {
      lessonAttempt(L.id, LS.id, score, LS.quiz.length, ans);
      setSec(5);
      if (lp.current) lp.current.scrollTop = 0;
    }
  }), sec === 5 && lastAt && /*#__PURE__*/React.createElement(Result, {
    rec: rec,
    L: L,
    onRetry: () => setSec(4),
    onHome: close,
    onJourney: () => go("journey")
  }), sec === 5 && !lastAt && /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "Finish the check to see your score.")), sec < 4 && /*#__PURE__*/React.createElement("div", {
    className: "lp-foot"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost big",
    disabled: sec === 0,
    onClick: () => toSec(sec - 1)
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "back"
  }), "Back"), /*#__PURE__*/React.createElement(FootHint, {
    sec: sec,
    ok: ready
  }), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn big",
    disabled: !ready,
    onClick: () => toSec(sec + 1)
  }, sec === 0 ? "Let's start" : sec === 3 ? "Go to the check" : "Next", /*#__PURE__*/React.createElement(Icon, {
    n: "next"
  }))));
}
function FootHint({
  sec,
  ok
}) {
  if (sec === 2) return /*#__PURE__*/React.createElement("span", {
    className: "fb " + (ok ? "ok" : "")
  }, ok ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    n: "check"
  }), "All order words found!") : "Find all 5 order words");
  if (sec === 3) return /*#__PURE__*/React.createElement("span", {
    className: "fb " + (ok ? "ok" : "")
  }, ok ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Icon, {
    n: "check"
  }), "Great practice!") : "Finish both activities");
  return /*#__PURE__*/React.createElement("span", null);
}
function Intro() {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "Today's lesson"), /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: 8
    }
  }, LS.title), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, LS.objective), /*#__PURE__*/React.createElement("ul", {
    className: "goals"
  }, LS.goals.map((g, i) => /*#__PURE__*/React.createElement("li", {
    key: g
  }, /*#__PURE__*/React.createElement("i", null, i + 1), g))), /*#__PURE__*/React.createElement("p", {
    style: {
      color: "var(--ink-soft)",
      fontWeight: 700
    }
  }, "About ", LS.mins, " minutes \xB7 6-question check at the end"));
}
function ReadSec() {
  const [w, setW] = React.useState(null);
  const v = w && LS.vocab.find(x => x.w === w);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "Read"), /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: 8
    }
  }, LS.passageTitle), /*#__PURE__*/React.createElement("p", {
    className: "lead",
    style: {
      fontSize: 17
    }
  }, "Tap a ", /*#__PURE__*/React.createElement("span", {
    style: {
      borderBottom: "2px dotted var(--forest)",
      fontWeight: 700
    }
  }, "dotted word"), " to see what it means."), /*#__PURE__*/React.createElement("div", {
    className: "illus",
    style: {
      height: 120
    }
  }, "illustration \xB7 maize seedling in soil"), /*#__PURE__*/React.createElement("div", {
    className: "passage"
  }, LS.passage.map((p, i) => /*#__PURE__*/React.createElement("p", {
    key: i
  }, tokenize(p).map((t, j) => {
    const key = VOCAB_KEY[bare(t).toLowerCase()];
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: j
    }, key ? /*#__PURE__*/React.createElement("button", {
      className: "tok",
      onClick: () => setW(key)
    }, t) : /*#__PURE__*/React.createElement("span", {
      className: "tok"
    }, t), " ");
  })))), v && /*#__PURE__*/React.createElement("div", {
    className: "vocab-pop",
    role: "status"
  }, /*#__PURE__*/React.createElement("b", null, v.w), " \u2014 ", v.m));
}
function Guided({
  onDone
}) {
  const [found, setFound] = React.useState([]);
  const [miss, setMiss] = React.useState(null);
  React.useEffect(() => {
    onDone(found.length === LS.orderWords.length);
  }, [found]);
  const tap = (t, id) => {
    const b = bare(t);
    if (LS.orderWords.includes(b)) {
      setFound(f => f.includes(b) ? f : [...f, b]);
    } else {
      setMiss(id);
      setTimeout(() => setMiss(m => m === id ? null : m), 700);
    }
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "Guided activity"), /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: 8
    }
  }, "Find the order words"), /*#__PURE__*/React.createElement("p", {
    className: "lead"
  }, "Order words tell us what to do ", /*#__PURE__*/React.createElement("b", null, "first"), " and what comes ", /*#__PURE__*/React.createElement("b", null, "next"), ". Tap every order word in the text."), /*#__PURE__*/React.createElement("div", {
    className: "chips",
    style: {
      marginTop: 18
    }
  }, LS.orderWords.map(w => /*#__PURE__*/React.createElement("span", {
    key: w,
    className: "chip" + (found.includes(w) ? " on" : ""),
    style: {
      cursor: "default",
      fontFamily: "var(--read)",
      fontSize: 16
    }
  }, found.includes(w) ? w : "?"))), /*#__PURE__*/React.createElement("div", {
    className: "passage pick"
  }, LS.passage.map((p, i) => /*#__PURE__*/React.createElement("p", {
    key: i
  }, tokenize(p).map((t, j) => {
    const id = i + "-" + j;
    const hit = found.includes(bare(t));
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: j
    }, /*#__PURE__*/React.createElement("button", {
      className: "tok" + (hit ? " hit" : miss === id ? " miss" : ""),
      onClick: () => tap(t, id)
    }, t), " ");
  })))));
}
function Practice({
  onDone
}) {
  const [matched, setMatched] = React.useState([]);
  const [selW, setSelW] = React.useState(null);
  const [wrong, setWrong] = React.useState(null);
  const meanings = React.useMemo(() => shuffled(LS.vocab, 3), []);
  const pool0 = React.useMemo(() => shuffled(LS.steps.map((s, i) => ({
    s,
    i
  })), 5), []);
  const [slots, setSlots] = React.useState([]);
  const [checked, setChecked] = React.useState(false);
  const orderOk = slots.length === LS.steps.length && slots.every((x, i) => x.i === i);
  const aDone = matched.length === LS.vocab.length;
  React.useEffect(() => {
    onDone(aDone && orderOk && checked);
  }, [matched, slots, checked]);
  const pickMeaning = m => {
    if (!selW) return;
    if (m.w === selW) {
      setMatched(x => x.includes(m.w) ? x : [...x, m.w]);
      setSelW(null);
    } else {
      setWrong(m.w);
      setTimeout(() => setWrong(null), 700);
    }
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "Practice"), /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: 8
    }
  }, "Words and steps"), /*#__PURE__*/React.createElement("div", {
    className: "task"
  }, /*#__PURE__*/React.createElement("h2", null, "1. Match each word to its meaning"), /*#__PURE__*/React.createElement("p", {
    className: "hint"
  }, "Tap a word, then tap what it means."), /*#__PURE__*/React.createElement("div", {
    className: "match"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, LS.vocab.map(v => /*#__PURE__*/React.createElement("button", {
    key: v.w,
    className: "opt" + (matched.includes(v.w) ? " ok" : selW === v.w ? " sel" : ""),
    disabled: matched.includes(v.w),
    onClick: () => setSelW(v.w)
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, matched.includes(v.w) ? "✓" : "•"), v.w))), /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, meanings.map(m => /*#__PURE__*/React.createElement("button", {
    key: m.w,
    className: "opt" + (matched.includes(m.w) ? " ok" : wrong === m.w ? " no" : "") + (!selW && !matched.includes(m.w) ? " dim" : ""),
    disabled: matched.includes(m.w),
    onClick: () => pickMeaning(m),
    style: {
      fontSize: 17
    }
  }, matched.includes(m.w) && /*#__PURE__*/React.createElement("span", {
    className: "k",
    style: {
      width: "auto",
      padding: "0 8px"
    }
  }, m.w), m.m)))), wrong && /*#__PURE__*/React.createElement("div", {
    className: "why no"
  }, "Not quite \u2014 try another meaning.")), /*#__PURE__*/React.createElement("div", {
    className: "task",
    style: {
      marginTop: 44,
      opacity: aDone ? 1 : .45,
      pointerEvents: aDone ? "auto" : "none"
    }
  }, /*#__PURE__*/React.createElement("h2", null, "2. Put the steps in order"), /*#__PURE__*/React.createElement("p", {
    className: "hint"
  }, "Tap the steps in the order they happen."), /*#__PURE__*/React.createElement("div", {
    className: "slots"
  }, LS.steps.map((_, i) => {
    const x = slots[i];
    const bad = checked && x && x.i !== i;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "slot" + (x ? " filled" : "") + (bad ? " no" : "")
    }, /*#__PURE__*/React.createElement("span", {
      className: "n"
    }, i + 1), x ? x.s : "", x && !(checked && orderOk) && /*#__PURE__*/React.createElement("button", {
      className: "x",
      onClick: () => {
        setSlots(slots.filter((_, k) => k !== i));
        setChecked(false);
      },
      "aria-label": "Remove"
    }, "\xD7"));
  })), /*#__PURE__*/React.createElement("div", {
    className: "pool"
  }, pool0.filter(p => !slots.includes(p)).map(p => /*#__PURE__*/React.createElement("button", {
    key: p.i,
    className: "opt",
    onClick: () => {
      setSlots(s => s.includes(p) ? s : [...s, p]);
      setChecked(false);
    }
  }, p.s))), slots.length === LS.steps.length && !checked && /*#__PURE__*/React.createElement("button", {
    className: "hl-btn big",
    style: {
      marginTop: 16
    },
    onClick: () => setChecked(true)
  }, "Check my order"), checked && /*#__PURE__*/React.createElement("div", {
    className: "why " + (orderOk ? "ok" : "no")
  }, orderOk ? "Yes! Those steps are in the right order." : "Some steps are in the wrong place. Remove the red ones and try again. Look for First, Next, Then…")));
}
function Quiz({
  onFinish
}) {
  const [i, setI] = React.useState(0);
  const [ans, setAns] = React.useState([]);
  const q = LS.quiz[i];
  const a = ans[i];
  const pick = k => {
    if (a != null) return;
    const n = ans.slice();
    n[i] = k;
    setAns(n);
  };
  const score = ans.filter((x, k) => x === LS.quiz[k].a).length;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow"
  }, "Check \xB7 ", LS.quiz.length, " questions \xB7 pass mark ", LS.passMark, " of ", LS.quiz.length), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 14
    }
  }, LS.quiz.map((_, k) => /*#__PURE__*/React.createElement("span", {
    key: k,
    style: {
      flex: 1,
      height: 8,
      borderRadius: 9,
      background: ans[k] == null ? k === i ? "var(--yellow)" : "var(--sand)" : ans[k] === LS.quiz[k].a ? "var(--forest)" : "var(--warn)"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "qcard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qn"
  }, "Question ", i + 1, " of ", LS.quiz.length), /*#__PURE__*/React.createElement("h2", null, q.q), /*#__PURE__*/React.createElement("div", {
    className: "opts"
  }, q.o.map((o, k) => {
    const st = a == null ? "" : k === q.a ? " ok" : k === a ? " no" : " dim";
    return /*#__PURE__*/React.createElement("button", {
      key: k,
      className: "opt" + st,
      disabled: a != null,
      onClick: () => pick(k)
    }, /*#__PURE__*/React.createElement("span", {
      className: "k"
    }, "ABCD"[k]), o);
  })), a != null && /*#__PURE__*/React.createElement("div", {
    className: "why " + (a === q.a ? "ok" : "no")
  }, /*#__PURE__*/React.createElement("b", null, a === q.a ? "Correct! " : "Not this time. "), q.why)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      marginTop: 24
    }
  }, a != null && (i < LS.quiz.length - 1 ? /*#__PURE__*/React.createElement("button", {
    className: "hl-btn big",
    onClick: () => setI(i + 1)
  }, "Next question", /*#__PURE__*/React.createElement(Icon, {
    n: "next"
  })) : /*#__PURE__*/React.createElement("button", {
    className: "hl-btn big yellow",
    onClick: () => onFinish(score, ans)
  }, "See my score", /*#__PURE__*/React.createElement(Icon, {
    n: "next"
  })))));
}
function Result({
  rec,
  L,
  onRetry,
  onHome,
  onJourney
}) {
  const a = hlLastAttempt(rec);
  const pass = a.pass;
  return /*#__PURE__*/React.createElement("div", {
    className: "result"
  }, /*#__PURE__*/React.createElement("img", {
    src: pass ? "assets/book-complete.png" : "assets/book-reading.png",
    alt: "",
    style: {
      width: 96,
      height: 96,
      objectFit: "contain"
    }
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      marginTop: 12
    }
  }, pass ? "You did it, " + L.name.split(" ")[0] + "!" : "Good try, " + L.name.split(" ")[0]), /*#__PURE__*/React.createElement("div", {
    className: "score"
  }, a.score, /*#__PURE__*/React.createElement("small", null, " / ", a.total)), /*#__PURE__*/React.createElement(Status, {
    s: pass ? "complete" : "fail",
    label: pass ? "Passed" : `Pass mark is ${LS.passMark}`
  }), a.answers && /*#__PURE__*/React.createElement("div", {
    className: "qreview"
  }, LS.quiz.map((q, k) => /*#__PURE__*/React.createElement("span", {
    key: k,
    className: a.answers[k] === q.a ? "ok" : "no"
  }, k + 1))), /*#__PURE__*/React.createElement("div", {
    className: "upd"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("i", null, "\u2713"), "Score saved to your reading record (try ", rec.attempts.length, ")"), pass ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("i", null, "\u2713"), "Unit 3 of your Level 4 journey is complete"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("i", null, "\u2713"), "Level 4 progress is now ", L.levelPct, "%"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("i", null, "\u2605"), "New achievement: Order Finder")) : /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("i", null, "\u21BA"), "Read the text again, then try the check one more time"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("i", null, "\u2713"), "Your teacher can see this result")), /*#__PURE__*/React.createElement("div", {
    className: "acts"
  }, !pass && /*#__PURE__*/React.createElement("button", {
    className: "hl-btn big yellow",
    onClick: onRetry
  }, "Try the check again"), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn big" + (pass ? "" : " ghost"),
    onClick: onHome
  }, "Back to home"), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn big ghost",
    onClick: onJourney
  }, "My journey")), /*#__PURE__*/React.createElement(DemoTeacherLink, null));
}
function DemoTeacherLink() {
  const {
    setRole
  } = useHL();
  return /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 28,
      fontSize: 13,
      color: "var(--ink-soft)",
      fontWeight: 700
    }
  }, "Demo \xB7 ", /*#__PURE__*/React.createElement("button", {
    className: "hl-btn quiet sm",
    onClick: () => setRole("teacher")
  }, "See this result as the teacher \u2192"));
}
Object.assign(window, {
  LessonPlayer
});