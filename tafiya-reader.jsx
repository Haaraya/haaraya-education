/* ============================================================================
   Tafiya Reader + Library — native React port for the Haaraya app.
   Renders cover → image-first pages → back cover inside a fixed portrait book
   frame, with prev/next + dots + keyboard + swipe nav and per-book progress.
   Data comes from window.TafiyaData (bundled sample first, else live Supabase).
   All reader markup lives under a single <div class="tfr"> so the scoped
   reader CSS never collides with the app's own .book / .btn styles.
   ============================================================================ */

const { useState: useStateTfr, useEffect: useEffectTfr, useRef: useRefTfr } = React;

/* ---------------- small helpers ---------------- */
function tfrText(v) {
  if (v == null) return "";
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (typeof v === "object") return "";
  return String(v).trim();
}
function tfrSrc(path, local) {
  return window.TafiyaData ? window.TafiyaData.assetUrl(path, !!local) : (path || "");
}
function tfrLevelLabel(lvl) {
  const s = tfrText(lvl);
  if (!s) return "";
  return /^level\b/i.test(s) ? s.replace(/\s+/g, " ") : "Level " + s;
}
function tfrTypeLabel(v) {
  const s = tfrText(v);
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/\s+/g, " ")
    .replace(/\bnon[\s-]?fiction\b/i, "Non-Fiction").trim();
}
function tfrMeta(book) {
  const parts = [];
  const lvl = tfrLevelLabel(book.level);
  const type = tfrTypeLabel(book.book_type);
  if (lvl) parts.push(lvl);
  if (type) parts.push(type);
  return parts.join("  ·  ");
}

/* ---------------- image with graceful placeholder ---------------- */
function TfrImage({ path, alt, label, className, local }) {
  const [failed, setFailed] = useStateTfr(false);
  const src = tfrSrc(path, local);
  if (!src || failed) {
    return (
      <div className={(className ? className + " " : "") + "ph"}>
        <div className="ph-note">{label || "image"}</div>
      </div>
    );
  }
  return (
    <div className={className}>
      <img src={src} alt={alt || ""} onError={() => setFailed(true)} />
    </div>
  );
}

/* ---------------- the three screen renderers ---------------- */
function TfrCover({ pkg }) {
  const b = pkg.book || {};
  const local = !!pkg._local;
  const logos = (pkg.assets && pkg.assets.logos) || {};
  return (
    <div className="surface cover">
      <div className="cover-top">
        {logos.tafiya && <img className="logo-tafiya" src={tfrSrc(logos.tafiya, local)} alt="" />}
        {logos.haaraya_literacy && <img className="logo-literacy" src={tfrSrc(logos.haaraya_literacy, local)} alt="" />}
      </div>
      <TfrImage className="cover-hero" path={b.cover_image_path} local={local} label="cover image" />
      <div className="cover-titles">
        <h1 className={"cover-title" + (tfrText(b.title) ? "" : " is-empty")}>{tfrText(b.title) || "Book title"}</h1>
        <div className="cover-sub">{(tfrText(b.tafiya_name) || "Tafiya") + "  •  " + (tfrLevelLabel(b.level) || "—")}</div>
      </div>
      <div className="cover-bottom">
        {logos.haaraya_education && <img className="logo-haaraya" src={tfrSrc(logos.haaraya_education, local)} alt="" />}
      </div>
    </div>
  );
}

function TfrPage({ page, local }) {
  const text = tfrText(page.page_text);
  return (
    <div className="surface story">
      <TfrImage className="story-img" path={page.image_path} local={local} label={"illustration · page " + page.page_number} />
      <p className={"story-text" + (text ? "" : " is-empty")}>{text || "Story text will appear here"}</p>
    </div>
  );
}

function TfrBack({ pkg }) {
  const b = pkg.book || {};
  const s = pkg.skills || {};
  const local = !!pkg._local;
  const logos = (pkg.assets && pkg.assets.logos) || {};
  const type = tfrTypeLabel(b.book_type);
  const header = (tfrText(b.book_code) ? tfrText(b.book_code) + " · " : "") +
    "ELEMENTS USED IN THIS BOOK" + (type ? " — " + type.toUpperCase() : "");

  const skillRows = [
    ["Reading Strategy", s.reading_strategy],
    ["Comprehension Skill", s.comprehension_skill],
    ["Phonological Awareness", s.phonological_awareness],
    ["Grammar and Mechanics", s.grammar_mechanics],
    ["Word Work", s.word_work],
    ["Text Structure", s.text_structure],
  ];
  const levelRows = [
    ["Haaraya Level", tfrLevelLabel(b.level)],
    ["Fountas & Pinnell", s.fp_level],
    ["UK Book Band", s.uk_book_band],
  ];

  return (
    <div className="surface back">
      <div className="skills-block">
        <div className="skills-header">{header}</div>
        <div className="skills-table">
          {skillRows.map(([k, v]) => (
            <div className="skills-row" key={k}>
              <span className="skills-key">{k}</span>
              <span className="skills-val">{tfrText(v) || "—"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="back-section-title">About this book</div>
      <div className="back-booktitle">{tfrText(b.title) || "—"}</div>
      <p className={"back-about" + (tfrText(s.about_text) ? "" : " is-empty")}>
        {tfrText(s.about_text) || "About this book…"}
      </p>

      <div className="back-divider" />

      <div className="back-section-title">Reading level</div>
      <div className="level-block">
        {levelRows.map(([k, v]) => (
          <div className="level-row" key={k}>
            <span className="level-key">{k}</span>
            <span className="level-val">{tfrText(v) || "—"}</span>
          </div>
        ))}
      </div>

      <div className="back-bottom">
        <div className="back-website">{tfrText(s.website) || "haarayaeducation.org"}</div>
        <p className="back-series">
          The Haaraya Reading Series provides every Nigerian child with books that look like their
          world, sound like their language, and build the foundation to read for life.
        </p>
        <div className="back-footer">
          <div className="col-left">
            {logos.haaraya_education && <img className="logo-haaraya" src={tfrSrc(logos.haaraya_education, local)} alt="" />}
          </div>
          <div className="col-center">
            <div className="back-imprint">© Author Finisher Nigeria Ltd</div>
            <div className="back-imprint">All rights reserved.</div>
            <div className="back-imprint">RC: [Your Number]</div>
            <div className="back-imprint">ISBN: [National Library No]</div>
          </div>
          <div className="col-right">
            {logos.tafiya && <img className="logo-tafiya" src={tfrSrc(logos.tafiya, local)} alt="" />}
            {logos.haaraya_literacy && <img className="logo-literacy" src={tfrSrc(logos.haaraya_literacy, local)} alt="" />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   READING CHECK (comprehension / phonics) + UP-NEXT
   ------------------------------------------------------------
   Questions come from the authored bank (window.HaarayaQuiz, built
   from the APP_QUIZ CSVs, keyed by book code). Shape per book:
     { questions:[{q,options[],answer}], write:{prompt,answer}|null, retryNote }
   A deterministic sample set is used only if a book has no authored
   quiz. Gate: the child must get every question right (retries
   allowed) to earn the stamp and unlock the next book.
   ============================================================ */
function tfrSeed(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return function () { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }
function tfrShuffle(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function tfrFriendlyType(t) { t = (t || "").toLowerCase(); if (t.indexOf("folktale") >= 0) return "A folktale"; if (t.indexOf("poet") >= 0) return "A poem"; if (t.indexOf("non") >= 0) return "A non-fiction book"; if (t.indexOf("concept") >= 0) return "A concept book"; if (t.indexOf("fiction") >= 0) return "A story"; return "A story"; }

function tfrSampleQuestions(pkg, catalog) {
  const b = (pkg && pkg.book) || {};
  const title = tfrText(b.title) || "this book";
  const code = tfrText(b.book_code) || tfrText(b.code) || title;
  const rnd = tfrSeed(code);
  const others = (catalog || []).map(x => tfrText(x.title)).filter(t => t && t !== title);
  const td = tfrShuffle(others, rnd).slice(0, 2);
  while (td.length < 2) td.push(["Market Day", "A Song for Rain"][td.length]);
  const q1 = tfrShuffle([title, ...td], rnd);
  const ct = tfrFriendlyType(b.book_type);
  const tp = ["A story", "A folktale", "A poem", "A non-fiction book"].filter(t => t !== ct);
  const q2 = tfrShuffle([ct, ...tfrShuffle(tp, rnd).slice(0, 2)], rnd);
  const hc = "Think about what happened in the story.";
  const q3 = tfrShuffle([hc, "Forget the story straight away.", "Skip every page next time."], rnd);
  return [
    { q: "Which book did you just finish reading?", options: q1, answer: q1.indexOf(title) },
    { q: "What kind of book is this?", options: q2, answer: q2.indexOf(ct) },
    { q: "What is a good thing to do when you finish a book?", options: q3, answer: q3.indexOf(hc) },
  ];
}
function tfrGetCheck(pkg, catalog) {
  const b = (pkg && pkg.book) || {};
  const code = tfrText(b.book_code) || tfrText(b.code);
  const bank = (window.HaarayaQuiz && code) ? window.HaarayaQuiz.get(code) : null;
  if (bank && bank.questions && bank.questions.length) {
    return { questions: bank.questions, write: bank.write || null, retryNote: bank.retryNote || "" };
  }
  return { questions: tfrSampleQuestions(pkg, catalog), write: null, retryNote: "" };
}

function TfrQuizDone({ total, write, onContinue }) {
  const [typed, setTyped] = useStateTfr("");
  return (
    <div className="surface quiz">
      <div className="quiz-done">
        <div className="quiz-done-seal">✓</div>
        <h3>Great reading!</h3>
        <div className="score">All {total} correct — you earned your stamp.</div>
        {write && (
          <div className="quiz-write">
            <label className="quiz-write-label">{write.prompt} <span className="quiz-write-opt">· optional</span></label>
            <input className="quiz-write-input" type="text" value={typed} onChange={e => setTyped(e.target.value)} placeholder="Try writing it…" autoComplete="off" spellCheck="false" />
          </div>
        )}
        <div className="quiz-actions" style={{ marginTop: "3.6cqh" }}>
          <button className="quiz-btn" type="button" onClick={onContinue}>See what&rsquo;s next →</button>
        </div>
      </div>
    </div>
  );
}

function TfrQuizCards({ questions, write, retryNote, alreadyPassed, onPass, onContinue }) {
  const n = questions.length;
  const [qi, setQi] = useStateTfr(0);
  const [sel, setSel] = useStateTfr(-1);
  const [st, setSt] = useStateTfr("idle"); // idle | correct | wrong
  const [done, setDone] = useStateTfr(false);
  if (done) return <TfrQuizDone total={n} write={write} onContinue={onContinue} />;
  const q = questions[qi];
  const pick = (oi) => { if (st === "correct") return; setSel(oi); setSt("idle"); };
  const check = () => { if (sel < 0) return; setSt(sel === q.answer ? "correct" : "wrong"); };
  const advance = () => { if (qi < n - 1) { setQi(qi + 1); setSel(-1); setSt("idle"); } else { setDone(true); onPass && onPass(); } };
  const stateOf = (oi) => { if (st === "correct") return oi === q.answer ? "correct" : "dim lock"; if (st === "wrong" && oi === sel) return "wrong"; if (oi === sel) return "sel"; return ""; };
  return (
    <div className="surface quiz quiz-cards">
      <div className="quiz-eyebrow">Reading check</div>
      <div className="quiz-title">A few quick questions</div>
      <div className="quiz-pips">{questions.map((_, i) => <span key={i} className={"quiz-pip" + (i < qi ? " done" : i === qi ? " current" : "")} />)}</div>
      <div className="quiz-q"><span className="quiz-num">Question {qi + 1} of {n}</span>{q.q}</div>
      <div className="quiz-options">
        {q.options.map((o, oi) => { const cls = stateOf(oi); const tok = cls.split(" ")[0]; const mk = tok === "correct" ? "✓" : tok === "wrong" ? "✕" : ("ABC"[oi] || "•"); return <button key={oi} type="button" className={"quiz-opt " + cls} onClick={() => pick(oi)}><span className="mark">{mk}</span><span className="quiz-opt-text">{o}</span></button>; })}
      </div>
      <div className={"quiz-feedback " + (st === "correct" ? "ok" : st === "wrong" ? "no" : "")}>
        {st === "correct" ? "That’s right!" : st === "wrong" ? (retryNote || "Not quite — try again.") : "\u00a0"}
      </div>
      <div className="quiz-actions">
        {st === "correct"
          ? <button className="quiz-btn" type="button" onClick={advance}>{qi < n - 1 ? "Next question →" : "Finish →"}</button>
          : <button className="quiz-btn" type="button" onClick={check} disabled={sel < 0}>Check answer</button>}
      </div>
    </div>
  );
}

function TfrQuizSheet({ questions, write, retryNote, alreadyPassed, onPass, onContinue }) {
  const n = questions.length;
  const [ans, setAns] = useStateTfr(() => questions.map(() => -1));
  const [locked, setLocked] = useStateTfr(() => questions.map(() => false));
  const [checked, setChecked] = useStateTfr(false);
  const [done, setDone] = useStateTfr(false);
  if (done) return <TfrQuizDone total={n} write={write} onContinue={onContinue} />;
  const pick = (qi, oi) => { if (locked[qi]) return; setAns(a => { const c = a.slice(); c[qi] = oi; return c; }); };
  const allAnswered = ans.every(a => a >= 0);
  const check = () => {
    const nl = questions.map((q, i) => locked[i] || ans[i] === q.answer);
    setLocked(nl); setChecked(true);
    if (nl.every(Boolean)) { setDone(true); onPass && onPass(); }
  };
  const stateOf = (qi, oi) => { if (locked[qi]) return oi === questions[qi].answer ? "correct lock" : "dim lock"; if (checked && ans[qi] === oi && oi !== questions[qi].answer) return "wrong"; if (ans[qi] === oi) return "sel"; return ""; };
  const anyWrong = checked && !locked.every(Boolean);
  return (
    <div className="surface quiz quiz-sheet">
      <div className="quiz-eyebrow">Reading check</div>
      <div className="quiz-title">Answer all the questions</div>
      <div className="quiz-blocks">
        {questions.map((q, qi) => (
          <div className="quiz-block" key={qi}>
            <div className="quiz-q"><span className="quiz-num">Question {qi + 1}</span>{q.q}</div>
            <div className="quiz-options">
              {q.options.map((o, oi) => { const cls = stateOf(qi, oi); const tok = cls.split(" ")[0]; const mk = tok === "correct" ? "✓" : tok === "wrong" ? "✕" : ("ABC"[oi] || "•"); return <button key={oi} type="button" className={"quiz-opt " + cls} onClick={() => pick(qi, oi)}><span className="mark">{mk}</span><span className="quiz-opt-text">{o}</span></button>; })}
            </div>
          </div>
        ))}
      </div>
      <div className={"quiz-feedback " + (anyWrong ? "no" : "")}>{anyWrong ? (retryNote || "Some answers need another look — fix the red ones.") : "\u00a0"}</div>
      <div className="quiz-actions">
        <button className="quiz-btn" type="button" onClick={check} disabled={!allAnswered}>{checked ? "Check again" : "Check answers"}</button>
      </div>
    </div>
  );
}
function TfrQuiz(props) { return props.layout === "sheet" ? <TfrQuizSheet {...props} /> : <TfrQuizCards {...props} />; }

function TfrNextUp({ book, nextBook, onStartNext, onLibrary }) {
  const m = tfrText(book.level).match(/\d+/);
  const lvl = m ? m[0] : null;
  const stampSrc = lvl ? tfrSrc("assets/stamp-l" + lvl + ".png") : "";
  const [stampFail, setStampFail] = useStateTfr(false);
  const confetti = React.useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    left: (i * 6.1 + 3) % 100, delay: (i % 5) * 0.12, color: ["#2f9e6e", "#f5c518", "#2a6fdb", "#e0653f", "#8a5fc0"][i % 5],
  })), []);
  const nextCode = nextBook ? (nextBook.book_code || nextBook.code) : null;
  return (
    <div className="surface nextup">
      <div className="confetti" aria-hidden="true">
        {confetti.map((c, i) => <i key={i} style={{ left: c.left + "%", animationDelay: c.delay + "s", background: c.color }} />)}
      </div>
      {stampSrc && !stampFail
        ? <img className="nextup-stamp" src={stampSrc} alt="" onError={() => setStampFail(true)} />
        : <div className="nextup-stamp-ph">★</div>}
      <div className="nextup-earned">{lvl ? "Level " + lvl + " stamp earned" : "Stamp earned"}</div>
      <div className="nextup-title">You finished “{tfrText(book.title) || "this book"}”!</div>
      {nextBook ? (
        <React.Fragment>
          <div className="nextup-card">
            <div className="nextup-mini">
              {nextBook.thumbnail_image_path
                ? <img src={tfrSrc(nextBook.thumbnail_image_path)} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                : <span className="ph">{nextCode}</span>}
            </div>
            <div className="nextup-info">
              <div className="label">Up next</div>
              <div className="nextup-next-title">{tfrText(nextBook.title) || nextCode}</div>
              <div className="nextup-meta">{tfrMeta({ level: nextBook.level, book_type: nextBook.book_type })}</div>
            </div>
          </div>
          <div className="nextup-actions">
            <button className="quiz-btn" type="button" onClick={onStartNext}>Start “{tfrText(nextBook.title) || nextCode}” →</button>
            <button className="quiz-btn ghost" type="button" onClick={onLibrary}>Back to library</button>
          </div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="nextup-meta" style={{ marginTop: "4cqh", fontSize: "3cqw" }}>You’ve reached the end of the journey for now. New books appear here as they’re published.</div>
          <div className="nextup-actions">
            <button className="quiz-btn" type="button" onClick={onLibrary}>Back to library</button>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

/* ============================================================
   READER SCREEN
   ============================================================ */
function ReaderScreen({ bookCode, onNavigate, quizLayout }) {
  const code = bookCode || "T4-NF-01";
  const [pkg, setPkg] = useStateTfr(null);
  const [status, setStatus] = useStateTfr("loading"); // loading | ready | error
  const [errMsg, setErrMsg] = useStateTfr("");
  const [index, setIndex] = useStateTfr(0);
  const [catalog, setCatalog] = useStateTfr(() => (window.TafiyaData ? window.TafiyaData.getCatalog() : []));
  const [quizPassed, setQuizPassed] = useStateTfr(false);
  const bookRef = useRefTfr(null);

  // Build the screen list once a package is loaded.
  const screens = React.useMemo(() => {
    if (!pkg) return [];
    const pages = (pkg.pages || []).slice().sort((a, b) => (a.page_number || 0) - (b.page_number || 0));
    return [{ type: "cover" }, ...pages.map(p => ({ type: "page", page: p })), { type: "back" }, { type: "quiz" }, { type: "nextup" }];
  }, [pkg]);

  // Catalogue (for "next book"). The reading check is always presented fresh
  // when the child reaches it — a previously-completed book still shows its
  // questions and must be passed again to advance past the check.
  useEffectTfr(() => {
    setQuizPassed(false);
    if (window.TafiyaData && window.TafiyaData.loadCatalog) {
      let alive = true;
      window.TafiyaData.loadCatalog().then(list => { if (alive && list && list.length) setCatalog(list); });
      return () => { alive = false; };
    }
  }, [code]);

  const check = React.useMemo(
    () => pkg ? tfrGetCheck(pkg, catalog) : { questions: [], write: null, retryNote: "" },
    [pkg, catalog]
  );
  const nextBook = React.useMemo(() => {
    if (!catalog.length || !window.TafiyaData) return null;
    const sorted = window.TafiyaData.sortedCatalog(catalog);
    const i = sorted.findIndex(x => (x.book_code || x.code) === code);
    return (i >= 0 && i < sorted.length - 1) ? sorted[i + 1] : null;
  }, [catalog, code]);

  const handlePass = () => {
    if (window.TafiyaData) window.TafiyaData.recordComplete(code);
    setQuizPassed(true);
  };

  const progressKey = "tafiya-reader:" + code + ":screen";

  // Load the book package (bundled sample first, else live Supabase).
  useEffectTfr(() => {
    let alive = true;
    setStatus("loading"); setPkg(null); setErrMsg("");
    window.TafiyaData.getPackage(code).then(p => {
      if (!alive) return;
      setPkg(p);
      setStatus("ready");
      const totalScreens = 1 + (p.pages ? p.pages.length : 0) + 3;
      if (window.TafiyaData) window.TafiyaData.recordOpen(code, totalScreens);
      // Restore saved screen for this book.
      let start = 0;
      try {
        const v = parseInt(localStorage.getItem(progressKey), 10);
        const total = totalScreens;
        if (!isNaN(v) && v >= 0 && v < total) start = v;
      } catch (e) { /* ignore */ }
      setIndex(start);
    }).catch(err => {
      if (!alive) return;
      console.error("[Tafiya Reader]", err);
      setStatus("error");
      setErrMsg(err && err.message ? err.message : "Could not load this book.");
    });
    return () => { alive = false; };
  }, [code]);

  // Persist progress (local resume position + Tafiya reading record).
  useEffectTfr(() => {
    if (status !== "ready") return;
    try { localStorage.setItem(progressKey, String(index)); } catch (e) { /* ignore */ }
    if (window.TafiyaData) {
      window.TafiyaData.recordProgress(code, index, screens.length);
    }
  }, [index, status]);

  const total = screens.length;
  const go = (i) => setIndex(Math.max(0, Math.min(total - 1, i)));
  const next = () => {
    const c = screens[index];
    if (c && c.type === "quiz" && !quizPassed) return; // gate: pass the check first
    go(index + 1);
  };
  const prev = () => go(index - 1);

  // Keyboard nav.
  useEffectTfr(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === "Escape") { onNavigate("library"); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, total, quizPassed]);

  // Swipe nav.
  useEffectTfr(() => {
    const node = bookRef.current;
    if (!node) return;
    let sx = 0, sy = 0, tracking = false;
    const start = (e) => { const t = e.changedTouches[0]; sx = t.clientX; sy = t.clientY; tracking = true; };
    const end = (e) => {
      if (!tracking) return; tracking = false;
      const t = e.changedTouches[0]; const dx = t.clientX - sx; const dy = t.clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) { dx < 0 ? next() : prev(); }
    };
    node.addEventListener("touchstart", start, { passive: true });
    node.addEventListener("touchend", end, { passive: true });
    return () => { node.removeEventListener("touchstart", start); node.removeEventListener("touchend", end); };
  }, [index, total, status, quizPassed]);

  const b = (pkg && pkg.book) || {};
  const logos = (pkg && pkg.assets && pkg.assets.logos) || {};
  const cur = screens[index];

  let progressText = "";
  if (cur) {
    if (cur.type === "cover") progressText = "Front cover";
    else if (cur.type === "back") progressText = "Back cover";
    else if (cur.type === "quiz") progressText = "Reading check";
    else if (cur.type === "nextup") progressText = "Up next";
    else {
      const count = screens.filter(x => x.type === "page").length;
      progressText = "Page " + cur.page.page_number + " of " + count;
    }
  }

  return (
    <div className="tfr">
      <div className="reader">
        {/* Top bar */}
        <header className="topbar">
          <button className="btn btn-ghost" type="button" onClick={() => onNavigate("library")}>
            <span className="ico" aria-hidden="true">‹</span><span>Library</span>
          </button>
          <div className="running">
            <span className="running-title">{tfrText(b.title) || "\u00a0"}</span>
            <span className="running-level">{pkg ? tfrMeta(b) : ""}</span>
          </div>
          <div className="brand" aria-hidden="true">
            {logos.haaraya_literacy && <img src={tfrSrc(logos.haaraya_literacy, !!(pkg && pkg._local))} alt="" />}
            {window.StrandLogo && pkg && (
              <span className="brand-strand-logo">
                <window.StrandLogo strand={tfrStrandUi(b)} height={26} />
              </span>
            )}
          </div>
        </header>

        {/* Stage */}
        <main className="stage">
          <article className="book" id="book" ref={bookRef}>
            {status === "loading" && (
              <div className="surface story">
                <div className="tfr-status">
                  <div className="tfr-spinner" />
                  <div className="t">Loading book…</div>
                  <div className="d">{code}</div>
                </div>
              </div>
            )}
            {status === "error" && (
              <div className="surface story">
                <div className="tfr-status">
                  <div className="t">Could not load this book</div>
                  <div className="d">{errMsg}</div>
                  <button className="btn btn-nav" type="button" style={{ marginTop: 14 }} onClick={() => onNavigate("library")}>
                    Back to library
                  </button>
                </div>
              </div>
            )}
            {status === "ready" && cur && cur.type === "cover" && <TfrCover pkg={pkg} />}
            {status === "ready" && cur && cur.type === "page" && <TfrPage page={cur.page} local={!!(pkg && pkg._local)} />}
            {status === "ready" && cur && cur.type === "back" && <TfrBack pkg={pkg} />}
            {status === "ready" && cur && cur.type === "quiz" && (
              <TfrQuiz
                key={code}
                questions={check.questions}
                write={check.write}
                retryNote={check.retryNote}
                layout={quizLayout === "Worksheet" ? "sheet" : "cards"}
                alreadyPassed={quizPassed}
                onPass={handlePass}
                onContinue={() => go(index + 1)}
              />
            )}
            {status === "ready" && cur && cur.type === "nextup" && (
              <TfrNextUp
                book={b}
                nextBook={nextBook}
                onStartNext={() => nextBook && onNavigate("reader", { bookCode: nextBook.book_code || nextBook.code })}
                onLibrary={() => onNavigate("library")}
              />
            )}
          </article>
        </main>

        {/* Bottom nav — hidden on the celebratory "up next" page */}
        {(!cur || cur.type !== "nextup") && (
          <footer className="navbar">
            <button className="btn btn-nav prev" type="button" onClick={prev} disabled={index === 0 || status !== "ready"}>
              <span className="ico" aria-hidden="true">‹</span><span className="nav-label">Back</span>
            </button>
            <div className="progress">
              <span className="progress-text">{progressText}</span>
              {/* Page-picker dots on every book. Quiz + up-next screens are
                  excluded; many-page books wrap to a second row. */}
              {total > 0 && (
                <div className={"dots" + (total > 18 ? " dots-dense" : "")} aria-hidden="true">
                  {screens.map((sc, i) => (
                    (sc.type === "quiz" || sc.type === "nextup") ? null :
                    <button key={i} type="button" className={"dot" + (i === index ? " active" : "")} onClick={() => go(i)} />
                  ))}
                </div>
              )}
            </div>
            <button className="btn btn-nav btn-next next" type="button" onClick={next} disabled={index === total - 1 || status !== "ready" || (cur && cur.type === "quiz" && !quizPassed)}>
              <span className="nav-label">Next</span><span className="ico" aria-hidden="true">›</span>
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   LIBRARY SCREEN — real Tafiya catalogue with cover thumbnails
   ============================================================ */

/* The original app's strand chips, in their two rows. The live catalogue now
   carries all ten strands, so every chip is real. */
const TAFIYA_STRAND_ROWS = [
  ["hafwas", "soundables", "soundables-plus", "tafiya", "tafiya-nonfiction"],
  ["folktale", "poetry", "duniya", "stamina", "stamina-nonfiction"],
];
const TAFIYA_STRAND_ORDER = TAFIYA_STRAND_ROWS.flat();
/* Supabase `strand` value → UI strand key (matches STRANDS in shared.jsx). */
const TAFIYA_STRAND_BY_NAME = {
  "Hafwas": "hafwas",
  "Soundables": "soundables",
  "Soundables+": "soundables-plus",
  "Tafiya Fiction": "tafiya",
  "Tafiya Non-Fiction": "tafiya-nonfiction",
  "Tafiya Folktale": "folktale",
  "Tafiya Poetry": "poetry",
  "Tafiya Duniya": "duniya",
  "Stamina Fiction": "stamina",
  "Stamina Non-Fiction": "stamina-nonfiction",
};
/* Resolve a book to its UI strand key. Prefer the clean `strand` field; fall
   back to inferring from book_type so nothing ever drops out of the grid. */
function tfrStrandUi(b) {
  if (window.TafiyaData && window.TafiyaData.strandKeyOf) return window.TafiyaData.strandKeyOf(b);
  const name = tfrText(b.strand);
  if (TAFIYA_STRAND_BY_NAME[name]) return TAFIYA_STRAND_BY_NAME[name];
  const t = tfrText(b.book_type).toLowerCase();
  if (t.indexOf("hafwas") >= 0) return "hafwas";
  if (t.indexOf("soundables+") >= 0 || t.indexOf("soundables plus") >= 0) return "soundables-plus";
  if (t.indexOf("soundable") >= 0) return "soundables";
  if (t.indexOf("stamina") >= 0) return t.indexOf("non") >= 0 ? "stamina-nonfiction" : "stamina";
  if (t.indexOf("duniya") >= 0) return "duniya";
  if (t.indexOf("poet") >= 0) return "poetry";
  if (t.indexOf("folktale") >= 0) return "folktale";
  if (t.indexOf("non") >= 0) return "tafiya-nonfiction";
  return "tafiya";
}

function LibraryScreen({ onNavigate, initialLevel }) {
  const [catalog, setCatalog] = useStateTfr(() => (window.TafiyaData ? window.TafiyaData.getCatalog() : []));
  const [strandFilter, setStrandFilter] = useStateTfr("all");
  const [levelFilter, setLevelFilter] = useStateTfr(initialLevel ? Number(initialLevel) : "all");

  // Role gates which books open; visitors get the free samples only.
  const [role, setRole] = useStateTfr(() => (window.HaarayaSession ? HaarayaSession.role() : "visitor"));
  const [readTick, setReadTick] = useStateTfr(0);
  const isVisitor = role === "visitor";

  // Load the catalogue live (auto-grows when the backend exposes more books).
  useEffectTfr(() => {
    let alive = true;
    if (window.TafiyaData && window.TafiyaData.loadCatalog) {
      window.TafiyaData.loadCatalog().then(list => { if (alive && list && list.length) setCatalog(list); });
    }
    const onSession = () => setRole(window.HaarayaSession ? HaarayaSession.role() : "visitor");
    const onReading = () => setReadTick(t => t + 1);
    window.addEventListener("haaraya:session", onSession);
    window.addEventListener("haaraya:reading", onReading);
    return () => { alive = false; window.removeEventListener("haaraya:session", onSession); window.removeEventListener("haaraya:reading", onReading); };
  }, []);

  const STRANDS = window.STRANDS || {};
  const StrandLogo = window.StrandLogo;

  const freeSet = React.useMemo(
    () => new Set(window.TafiyaData ? window.TafiyaData.freeCodes(catalog) : []),
    [catalog]
  );

  const codeOf = (b) => b.book_code || b.code;
  const levelNum = (b) => { const m = tfrText(b.level).match(/\d+/); return m ? Number(m[0]) : (typeof b.level === "number" ? b.level : 999); };
  const strandUi = (b) => tfrStrandUi(b);

  // Availability — a chip is live if the catalogue has any book in that strand.
  const availableStrands = React.useMemo(() => new Set(catalog.map(tfrStrandUi)), [catalog]);
  const strandAvailable = (k) => availableStrands.has(k);
  const levelsPresent = React.useMemo(() => new Set(catalog.map(levelNum)), [catalog]);

  const strandRank = (b) => { const i = TAFIYA_STRAND_ORDER.indexOf(tfrStrandUi(b)); return i < 0 ? 99 : i; };
  // Programme order within a level = the code's numeric suffix (interleaves strands
  // in the intended teaching sequence, e.g. S-01-010, H-01-040, TF-01-080, …).
  const seqNum = (b) => { const m = String(codeOf(b)).split("-").pop(); const n = parseInt(m, 10); return isNaN(n) ? 999999 : n; };

  const filtered = catalog
    .filter(b => codeOf(b))
    .filter(b => levelFilter === "all" || levelNum(b) === levelFilter)
    .filter(b => strandFilter === "all" || tfrStrandUi(b) === strandFilter)
    .sort((a, b) => (levelNum(a) - levelNum(b)) || (seqNum(a) - seqNum(b)) || codeOf(a).localeCompare(codeOf(b)));

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="wrap" style={{ padding: "64px 32px 80px" }}>
        <SectionHeader
          eyebrow="The library"
          title="Explore the Haaraya reading journey."
          lede="Tap any book to open it in the Tafiya reader — cover, story pages, and reading notes."
        />

        {/* Strand filter — one shared 6-col grid so both rows align on the right.
           Row 1: All strands + 5 logos. Row 2: 5 logos offset one column. */}
        <div className="tfl-filter-grid tfl-strand-grid">
          <span className={`filter-chip ${strandFilter === "all" ? "active" : ""}`} onClick={() => setStrandFilter("all")}>All strands</span>
          {TAFIYA_STRAND_ROWS.flat().map((k, i) => {
            const s = STRANDS[k] || {};
            const avail = strandAvailable(k);
            // First chip of row 2 jumps to column 2, leaving column 1 empty (indent).
            const startsRow2 = i === TAFIYA_STRAND_ROWS[0].length;
            return (
              <span
                key={k}
                className={`filter-chip filter-chip-logo ${strandFilter === k ? "active" : ""} ${avail ? "" : "is-unavailable"}`}
                onClick={avail ? () => setStrandFilter(k) : undefined}
                title={avail ? s.name : (s.name || k) + " — no books yet"}
                aria-disabled={!avail}
                style={{ "--c": s.color, "--bg": s.bg, ...(startsRow2 ? { gridColumnStart: 2 } : null) }}
              >
                {StrandLogo ? <StrandLogo strand={k} height={36} /> : (s.name || k)}
              </span>
            );
          })}
        </div>

        {/* Audio — no audio in this catalogue yet */}
        <div className="library-filters" style={{ marginTop: 12 }}>
          <span className="filter-chip is-unavailable" aria-disabled="true" title="Audio — not available yet">🔊 Audio</span>
        </div>

        {/* Level filter — shared 7-col grid. Row 1: All levels + L1–6.
           Row 2: L7–12 offset one column, so right edges align. */}
        <div className="tfl-filter-grid tfl-level-grid" style={{ marginTop: 12 }}>
          <span className={`filter-chip ${levelFilter === "all" ? "active" : ""}`} onClick={() => setLevelFilter("all")}>All levels</span>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => {
            const avail = levelsPresent.has(n);
            return (
              <span
                key={n}
                className={`filter-chip filter-chip-level ${levelFilter === n ? "active" : ""} ${avail ? "" : "is-unavailable"}`}
                onClick={avail ? () => setLevelFilter(n) : undefined}
                aria-disabled={!avail}
                style={n === 7 ? { gridColumnStart: 2 } : undefined}
              >Level {n}</span>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="lib-empty">
            <span className="lib-empty-seal" aria-hidden="true">✦</span>
            <p className="lib-empty-title">No books here yet.</p>
            <p className="lib-empty-sub">Try another level or book type.</p>
          </div>
        ) : (
          <div className="tfl-grid">
            {filtered.map(b => {
              const code = codeOf(b);
              const free = freeSet.has(code);
              const locked = isVisitor && !free;
              const done = window.TafiyaData && window.TafiyaData.isCompleted(code);
              return (
                <button
                  key={code}
                  className={"tfl-card" + (locked ? " tfl-card--locked" : "")}
                  onClick={() => locked ? onNavigate("home") : onNavigate("reader", { bookCode: code })}
                >
                  <div className="tfl-thumb">
                    {b.thumbnail_image_path
                      ? <img src={tfrSrc(b.thumbnail_image_path)} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                      : <span className="tfl-thumb-ph">{code}</span>}
                    {done && <span className="tfl-tag tfl-tag--done" title="You finished this book">✓ Read</span>}
                    {!done && free && <span className="tfl-tag tfl-tag--free">Free</span>}
                    {locked && <span className="tfl-lock" aria-label="Subscriber only">🔒</span>}
                  </div>
                  <div className="tfl-code">{code}</div>
                  <div className="tfl-title">{tfrText(b.title) || code}</div>
                  <div className="tfl-meta">{tfrMeta({ level: b.level, book_type: b.book_type })}</div>
                </button>
              );
            })}
          </div>
        )}

        {isVisitor ? (
          <div className="tfl-note">
            <strong>You’re previewing the library.</strong> The first {freeSet.size} books are free to read —
            subscribe to unlock all {catalog.length} Tafiya books across every level.
          </div>
        ) : (
          <div className="tfl-note">
            Showing {filtered.length} of {catalog.length} Tafiya book{catalog.length === 1 ? "" : "s"}. New titles appear here automatically as they’re published.
          </div>
        )}
      </div>
    </main>
  );
}

Object.assign(window, { ReaderScreen, LibraryScreen });
