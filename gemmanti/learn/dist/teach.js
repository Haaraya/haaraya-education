/* Gemmanti — Teach: the lesson teacher guide, step by step, with the book page by page.
   "Show to class" opens a second window with just the book page for a projector;
   it follows the teacher's page turns (same computer, BroadcastChannel). */
const TG_LABEL = {
  learning_objective: "Learning objective",
  success_criteria: "Success criteria",
  key_idea: "Key idea",
  book_summary: "About the book",
  teaching_type: "Lesson type",
  teaching_focus: "Teaching focus",
  new_element: "New this lesson",
  review_elements: "Revisits",
  prior_learning: "Children already know",
  builds_on: "Builds on",
  develops: "Develops",
  prepares_for: "Prepares for",
  vocabulary: "Vocabulary",
  advance_preparation: "Prepare in advance",
  teacher_materials: "You need",
  child_materials: "Children need",
  differentiation_support: "Support",
  differentiation_extension: "Stretch",
  phonological_awareness_focus: "Listening focus",
  hear_the_sound_teacher_script: "Say",
  hear_the_sound_child_response: "Children say",
  articulation_cue: "How to make the sound",
  sound_discrimination_activity: "Hear the difference",
  teach_grapheme_teacher_script: "Show the letters",
  grapheme_formation_cue: "Writing the letters",
  blend_model: "Model blending",
  blend_guided_practice: "Blend together",
  segment_model: "Model segmenting",
  segment_guided_practice: "Segment together",
  decodable_word_list: "Words to read",
  review_word_list: "Review words",
  tricky_words: "Tricky words",
  target_hafwa: "The word",
  hafwa_pronunciation: "Say it",
  introduce_hafwa_teacher_script: "Introduce it",
  notice_the_word_cue: "Notice",
  hafwa_phrase_list: "Phrases",
  hafwa_sentence_list: "Sentences",
  recognition_practice: "Recognise it",
  automaticity_practice: "Read it fast",
  find_it_activity: "Find it",
  apply_the_hafwa_activity: "Use it",
  background_knowledge: "Background",
  vocabulary_preteaching: "Teach these words first",
  reading_strategy: "Reading strategy",
  text_structure: "How the text works",
  before_reading_activity_1: "Activity 1",
  before_reading_activity_2: "Activity 2",
  comprehension_skill: "Comprehension skill",
  comprehension_activity: "Comprehension activity",
  vocabulary_activity: "Vocabulary activity",
  response_activity: "Response activity",
  word_work: "Word work",
  grammar_and_mechanics: "Grammar and punctuation",
  phonological_awareness: "Listening skills",
  read_again_page_reference: "Pages",
  read_again_focus: "Listen for",
  read_again_teacher_prompt: "Say",
  dictation_words: "Words",
  dictation_sentence: "Sentence",
  assessment_evidence: "What to look for",
  plenary: "Plenary",
  extension_activity: "Extension",
  links_with_other_subjects: "Links with other subjects",
  home_link: "Home link"
};
const TG_STEPS = [{
  k: "plan",
  n: "Plan",
  f: ["learning_objective", "success_criteria", "key_idea", "book_summary", "teaching_focus", "new_element", "review_elements", "prior_learning", "builds_on", "develops", "prepares_for", "vocabulary", "advance_preparation", "teacher_materials", "child_materials", "differentiation_support", "differentiation_extension"]
}, {
  k: "sound",
  n: "Teach the sound",
  fam: "Soundables",
  f: ["phonological_awareness_focus", "hear_the_sound_teacher_script", "hear_the_sound_child_response", "articulation_cue", "sound_discrimination_activity", "teach_grapheme_teacher_script", "grapheme_formation_cue", "blend_model", "blend_guided_practice", "segment_model", "segment_guided_practice", "decodable_word_list", "review_word_list", "tricky_words"]
}, {
  k: "word",
  n: "Teach the word",
  fam: "Hafwas",
  f: ["target_hafwa", "hafwa_pronunciation", "introduce_hafwa_teacher_script", "notice_the_word_cue", "hafwa_phrase_list", "hafwa_sentence_list", "recognition_practice", "automaticity_practice", "find_it_activity", "apply_the_hafwa_activity"]
}, {
  k: "before",
  n: "Before reading",
  f: ["background_knowledge", "vocabulary_preteaching", "reading_strategy", "text_structure", "before_reading_activity_1", "before_reading_activity_2"]
}, {
  k: "read",
  n: "Read the book"
}, {
  k: "after",
  n: "After reading",
  f: ["comprehension_skill", "comprehension_activity", "vocabulary_activity", "response_activity", "word_work", "grammar_and_mechanics", "phonological_awareness"],
  qa: true
}, {
  k: "again",
  n: "Read It Again",
  f: ["read_again_page_reference", "read_again_focus", "read_again_teacher_prompt"]
}, {
  k: "dict",
  n: "Dictation",
  f: ["dictation_words", "dictation_sentence"]
}, {
  k: "finish",
  n: "Finish",
  f: ["assessment_evidence", "plenary", "extension_activity", "links_with_other_subjects", "home_link"],
  practice: true
}];
/* Page references look like "3", "2-3", "1 to 12". */
function tgRange(ref) {
  const n = String(ref || "").match(/\d+/g);
  if (!n) return null;
  return {
    from: +n[0],
    to: +(n[1] || n[0])
  };
}
function tgPrompts(g) {
  const out = [];
  for (let i = 1; i <= 20; i++) {
    const k = String(i).padStart(2, "0");
    const p = g[`during_reading_${k}_prompt`];
    if (!p) continue;
    out.push({
      ref: g[`during_reading_${k}_page_reference`] || "",
      r: tgRange(g[`during_reading_${k}_page_reference`]),
      text: p
    });
  }
  return out;
}
function tgSteps(g) {
  return TG_STEPS.filter(s => (!s.fam || s.fam === g._family) && (s.k === "read" || (s.f || []).some(f => g[f]) || s.qa && g.after_reading_question_1 || s.practice && g.optional_practice_1_title));
}
function TgField({
  g,
  f
}) {
  if (!g[f]) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "tg-f"
  }, /*#__PURE__*/React.createElement("h4", null, TG_LABEL[f] || f), /*#__PURE__*/React.createElement("p", null, g[f]));
}

/* Teach: "Teaching now" (books set for this class) first, then every lesson,
   searchable and filtered by level and strand, as a compact list. Built to
   hold the whole library (469 books, Levels 1 to 12), not just the showcase. */
function TTeach({
  cls
}) {
  const {
    state
  } = useHL();
  const [code, setCode] = React.useState(null);
  const [q, setQ] = React.useState("");
  const [lvl, setLvl] = React.useState(() => !cls.mixed && cls.expected ? String(cls.expected) : "all");
  const [strand, setStrand] = React.useState("all");
  const books = TD.BOOKS.filter(b => window.HLTG && window.HLTG[b.id]).sort((a, b) => a.l - b.l || a.t.localeCompare(b.t));
  if (code) return /*#__PURE__*/React.createElement(TeachLesson, {
    code: code,
    onBack: () => setCode(null)
  });
  const forClass = id => state.assignments.filter(a => a.classId === cls.id && a.ref === id && a.type !== "lesson");
  const who = id => {
    const a = forClass(id);
    if (a.some(x => x.to === "all")) return "Whole class";
    const names = [...new Set(a.flatMap(x => x.to.map(i => (state.learners[i] || {}).name).filter(Boolean)))];
    if (!names.length) return "";
    const first = names.map(n => n.split(" ")[0]);
    return first.length <= 3 ? first.join(", ") : `${first.slice(0, 2).join(", ")} and ${first.length - 2} others`;
  };
  const now = books.filter(b => forClass(b.id).length > 0);
  const levels = [...new Set(books.map(b => b.l))];
  const strands = [...new Set(books.map(b => b.s))].sort();
  const n = x => String(x || "").toLowerCase();
  const list = books.filter(b => (lvl === "all" || String(b.l) === lvl) && (strand === "all" || b.s === strand) && (!q.trim() || n(b.t).includes(n(q.trim())) || n(b.id).includes(n(q.trim())) || n(b.k).includes(n(q.trim()))));
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", null, "Teach"), /*#__PURE__*/React.createElement("p", null, "Each lesson follows the Haaraya teacher guide, step by step."))), now.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "tg-now"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "tg-h2"
  }, "Teaching now ", /*#__PURE__*/React.createElement("span", null, now.length, " book", now.length === 1 ? "" : "s", " set for ", cls.name)), /*#__PURE__*/React.createElement("div", {
    className: "tg-books"
  }, now.map(b => /*#__PURE__*/React.createElement("button", {
    key: b.id,
    className: "tg-book",
    onClick: () => setCode(b.id)
  }, /*#__PURE__*/React.createElement("div", {
    className: "tg-cover"
  }, /*#__PURE__*/React.createElement(Cover, {
    book: b
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(LevelTag, {
    l: b.l
  }), /*#__PURE__*/React.createElement("b", null, b.t), /*#__PURE__*/React.createElement("span", null, b.s), who(b.id) && /*#__PURE__*/React.createElement("em", null, "For ", who(b.id))))))), /*#__PURE__*/React.createElement("section", null, /*#__PURE__*/React.createElement("h2", {
    className: "tg-h2"
  }, "All lessons ", /*#__PURE__*/React.createElement("span", null, list.length, " of ", books.length)), /*#__PURE__*/React.createElement("div", {
    className: "filters"
  }, /*#__PURE__*/React.createElement("input", {
    className: "hl-input s",
    placeholder: "Search by title or book code",
    value: q,
    onChange: e => setQ(e.target.value),
    "aria-label": "Search lessons"
  }), /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: lvl,
    onChange: e => setLvl(e.target.value),
    "aria-label": "Level"
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All levels"), levels.map(l => /*#__PURE__*/React.createElement("option", {
    key: l,
    value: String(l)
  }, "Level ", l))), /*#__PURE__*/React.createElement("select", {
    className: "hl-select",
    value: strand,
    onChange: e => setStrand(e.target.value),
    "aria-label": "Strand"
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All strands"), strands.map(x => /*#__PURE__*/React.createElement("option", {
    key: x
  }, x))), (q || lvl !== "all" || strand !== "all") && /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost sm",
    onClick: () => {
      setQ("");
      setLvl("all");
      setStrand("all");
    }
  }, "Clear")), list.length ? /*#__PURE__*/React.createElement("div", {
    className: "card tg-list"
  }, list.map(b => /*#__PURE__*/React.createElement("button", {
    key: b.id,
    className: "tg-row",
    onClick: () => setCode(b.id)
  }, /*#__PURE__*/React.createElement("span", {
    className: "tg-row-c"
  }, /*#__PURE__*/React.createElement(Cover, {
    book: b
  })), /*#__PURE__*/React.createElement("span", {
    className: "tg-row-t"
  }, /*#__PURE__*/React.createElement("b", null, b.t), /*#__PURE__*/React.createElement("span", null, b.k)), /*#__PURE__*/React.createElement("span", {
    className: "tg-row-m"
  }, /*#__PURE__*/React.createElement(LevelTag, {
    l: b.l
  }), /*#__PURE__*/React.createElement("span", null, b.s), /*#__PURE__*/React.createElement("span", {
    className: "tg-code"
  }, b.id)), /*#__PURE__*/React.createElement("span", {
    className: "tg-row-w"
  }, who(b.id) ? "For " + who(b.id) : ""), /*#__PURE__*/React.createElement(Icon, {
    n: "next",
    s: 16
  })))) : /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, "No lessons match. Try another word, or clear the filters.")));
}
function TeachLesson({
  code,
  onBack
}) {
  const {
    go
  } = useHL();
  const g = window.HLTG[code];
  const b = hlBook(code);
  const steps = tgSteps(g);
  const [si, setSi] = React.useState(0);
  const S = steps[si];
  const [p, setP] = React.useState(0);
  const [pg, setPg] = React.useState(null);
  const [err, setErr] = React.useState(false);
  const chan = React.useRef(null);
  React.useEffect(() => {
    HLWS.pages(code).then(setPg).catch(() => setErr(true));
  }, [code]);
  React.useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const c = new BroadcastChannel("gemmanti-board");
    chan.current = c;
    c.onmessage = e => {
      if (e.data && e.data.type === "hello") c.postMessage({
        type: "page",
        code,
        p: pRef.current
      });
    };
    return () => c.close();
  }, [code]);
  const pRef = React.useRef(0);
  pRef.current = p;
  React.useEffect(() => {
    if (chan.current) chan.current.postMessage({
      type: "page",
      code,
      p
    });
  }, [p, code]);
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [si]);
  const last = b.pages;
  const prompts = tgPrompts(g);
  const here = prompts.filter(x => x.r && p >= x.r.from && p <= x.r.to);
  const cur = pg && p > 0 && pg[p - 1];
  const board = () => window.open("Gemmanti.html?board=" + encodeURIComponent(code), "gemmanti-board", "width=1200,height=850");
  React.useEffect(() => {
    if (!S || S.k !== "read") return;
    const k = e => {
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
      if (e.key === "ArrowRight") setP(x => Math.min(last, x + 1));
      if (e.key === "ArrowLeft") setP(x => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [S && S.k, last]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "ph-h"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("button", {
    className: "back",
    onClick: onBack
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "back"
  }), "All books"), /*#__PURE__*/React.createElement("h1", null, b.t), /*#__PURE__*/React.createElement("p", null, "Level ", b.l, " \xB7 ", b.s, " \xB7 ", g.teaching_focus || b.k)), /*#__PURE__*/React.createElement("div", {
    className: "acts"
  }, /*#__PURE__*/React.createElement("a", {
    className: "hl-btn ghost",
    href: "../Haaraya%20Print.html?book=" + encodeURIComponent(code),
    target: "_blank",
    rel: "noopener"
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "dl",
    s: 16
  }), "Print book"), /*#__PURE__*/React.createElement(MaterialDownload, {
    code: code,
    kind: "worksheet"
  }), /*#__PURE__*/React.createElement(MaterialDownload, {
    code: code,
    kind: "guide"
  }), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost",
    onClick: board
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "play",
    s: 16
  }), "Show to class"))), /*#__PURE__*/React.createElement("nav", {
    className: "tg-steps"
  }, steps.map((s, i) => /*#__PURE__*/React.createElement("button", {
    key: s.k,
    className: i === si ? "on" : i < si ? "done" : "",
    onClick: () => setSi(i)
  }, /*#__PURE__*/React.createElement("span", null, i + 1), s.n))), S.k !== "read" && /*#__PURE__*/React.createElement("div", {
    className: "card tg-card"
  }, /*#__PURE__*/React.createElement("h2", null, S.n), (S.f || []).map(f => /*#__PURE__*/React.createElement(TgField, {
    key: f,
    g: g,
    f: f
  })), S.qa && [1, 2, 3, 4].map(i => g[`after_reading_question_${i}`] && /*#__PURE__*/React.createElement("div", {
    className: "tg-qa",
    key: i
  }, /*#__PURE__*/React.createElement("b", null, i, ". ", g[`after_reading_question_${i}`]), g[`after_reading_answer_${i}`] && /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("span", null, "Answer"), g[`after_reading_answer_${i}`]))), S.practice && [1, 2].map(i => g[`optional_practice_${i}_title`] && /*#__PURE__*/React.createElement("div", {
    className: "tg-f",
    key: i
  }, /*#__PURE__*/React.createElement("h4", null, "Optional practice: ", g[`optional_practice_${i}_title`]), /*#__PURE__*/React.createElement("p", null, g[`optional_practice_${i}_instructions`]), g[`optional_practice_${i}_materials`] && /*#__PURE__*/React.createElement("p", {
    className: "tg-mat"
  }, "You need: ", g[`optional_practice_${i}_materials`]))), S.k === "finish" && /*#__PURE__*/React.createElement("div", {
    className: "tg-next"
  }, /*#__PURE__*/React.createElement("span", null, "The worksheet for this book is ready for the children."), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    onClick: () => go("worksheets")
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "sheet",
    s: 16
  }), "Go to worksheets"))), S.k === "read" && /*#__PURE__*/React.createElement("div", {
    className: "tg-read"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tg-page card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tg-page-v"
  }, p === 0 ? /*#__PURE__*/React.createElement(Cover, {
    book: b
  }) : cur ? /*#__PURE__*/React.createElement("div", {
    className: "rd-live"
  }, /*#__PURE__*/React.createElement("img", {
    src: cur.img,
    alt: `Page ${p}`
  }), /*#__PURE__*/React.createElement("p", null, cur.text)) : /*#__PURE__*/React.createElement("div", {
    className: "ph"
  }, /*#__PURE__*/React.createElement("b", null, "Page ", p), err ? "This page could not load. Check the connection." : "Loading page…")), /*#__PURE__*/React.createElement("div", {
    className: "tg-page-nav"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost",
    disabled: p === 0,
    onClick: () => setP(p - 1)
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "back",
    s: 16
  }), "Back"), /*#__PURE__*/React.createElement("span", null, p === 0 ? "Cover" : `Page ${p} of ${last}`), /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    disabled: p === last,
    onClick: () => setP(p + 1)
  }, "Next", /*#__PURE__*/React.createElement(Icon, {
    n: "next",
    s: 16
  })))), /*#__PURE__*/React.createElement("div", {
    className: "card tg-prompts"
  }, /*#__PURE__*/React.createElement("h2", null, p === 0 ? "Before you open the book" : `Page ${p}`), p === 0 && /*#__PURE__*/React.createElement("p", {
    className: "tg-dim"
  }, "Show the cover. Turn the page to see what to ask on each page."), p > 0 && !here.length && /*#__PURE__*/React.createElement("p", {
    className: "tg-dim"
  }, "No prompt for this page. Let the children read."), here.map((x, i) => /*#__PURE__*/React.createElement("div", {
    className: "tg-prompt",
    key: i
  }, /*#__PURE__*/React.createElement("span", {
    className: "tg-ref"
  }, x.r.from === x.r.to ? `p${x.r.from}` : `pp${x.r.from}–${x.r.to}`), /*#__PURE__*/React.createElement("p", null, x.text))), /*#__PURE__*/React.createElement("details", {
    className: "tg-all"
  }, /*#__PURE__*/React.createElement("summary", null, "All reading prompts (", prompts.length, ")"), prompts.map((x, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    onClick: () => x.r && setP(Math.min(last, x.r.from))
  }, /*#__PURE__*/React.createElement("span", {
    className: "tg-ref"
  }, x.ref), x.text))), /*#__PURE__*/React.createElement("p", {
    className: "tg-dim",
    style: {
      marginTop: 14
    }
  }, "Using a projector? Press Show to class and move the new window onto the board. It turns pages with you."))), /*#__PURE__*/React.createElement("div", {
    className: "tg-foot"
  }, /*#__PURE__*/React.createElement("button", {
    className: "hl-btn ghost",
    disabled: si === 0,
    onClick: () => setSi(si - 1)
  }, /*#__PURE__*/React.createElement(Icon, {
    n: "back",
    s: 16
  }), si > 0 ? steps[si - 1].n : "Back"), si < steps.length - 1 && /*#__PURE__*/React.createElement("button", {
    className: "hl-btn",
    onClick: () => setSi(si + 1)
  }, steps[si + 1].n, /*#__PURE__*/React.createElement(Icon, {
    n: "next",
    s: 16
  }))));
}

/* The class screen: just the page, as big as it will go. */
function BoardApp({
  code: first
}) {
  const [code, setCode] = React.useState(first);
  const [p, setP] = React.useState(0);
  const [pg, setPg] = React.useState(null);
  const b = hlBookBoard(code);
  React.useEffect(() => {
    setPg(null);
    HLWS.pages(code).then(setPg).catch(() => setPg([]));
  }, [code]);
  React.useEffect(() => {
    if (!("BroadcastChannel" in window)) return;
    const c = new BroadcastChannel("gemmanti-board");
    c.onmessage = e => {
      const d = e.data || {};
      if (d.type === "page") {
        if (d.code && d.code !== code) setCode(d.code);
        setP(d.p || 0);
      }
    };
    c.postMessage({
      type: "hello"
    });
    return () => c.close();
  }, [code]);
  React.useEffect(() => {
    if (b) document.title = b.t + " · Gemmanti";
  }, [b]);
  const cur = pg && p > 0 && pg[p - 1];
  return /*#__PURE__*/React.createElement("div", {
    className: "board"
  }, p === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "board-cover"
  }, b ? /*#__PURE__*/React.createElement(Cover, {
    book: b
  }) : null) : cur ? /*#__PURE__*/React.createElement("div", {
    className: "board-page"
  }, /*#__PURE__*/React.createElement("img", {
    src: cur.img,
    alt: `Page ${p}`
  }), /*#__PURE__*/React.createElement("p", null, cur.text)) : /*#__PURE__*/React.createElement("div", {
    className: "board-wait"
  }, pg ? "This page could not load." : "Loading…"), /*#__PURE__*/React.createElement("span", {
    className: "board-n"
  }, p === 0 ? "" : p));
}
function hlBookBoard(code) {
  return (window.HL_DATA.BOOKS || []).find(x => x.id === code) || null;
}
Object.assign(window, {
  TTeach,
  TeachLesson,
  BoardApp
});