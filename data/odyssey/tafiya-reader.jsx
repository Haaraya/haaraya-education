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
// Resolve the strand wordmark shown on the cover / back cover. Keyed to the
// book's own strand (so a Hafwas book shows the Hafwas mark, not the generic
// Tafiya one). Falls back to the package's bundled tafiya logo if STRANDS is
// unavailable or the strand has no logo.
function tfrStrandLogo(book, logos) {
  const s = (window.STRANDS && window.STRANDS[tfrStrandUi(book)]) || null;
  if (s && s.logo) return { src: s.logo, alt: s.name || "" };
  return { src: (logos && logos.tafiya) || "", alt: "" };
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
  const strandLogo = tfrStrandLogo(b, logos);
  return (
    <div className="surface cover">
      <div className="cover-top">
        {strandLogo.src && <img className="logo-tafiya" src={tfrSrc(strandLogo.src, local)} alt={strandLogo.alt} />}
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
  const textRef = useRefTfr(null);
  const [single, setSingle] = useStateTfr(false);
  // Detect whether the text lands on a single visual line; if so we centre
  // it and size it up (helps the sparse lower-level pages read big & bold).
  useEffectTfr(() => {
    const measure = () => {
      const el = textRef.current;
      if (!el) return;
      const lh = parseFloat(getComputedStyle(el).lineHeight) || 0;
      setSingle(!!text && lh > 0 && el.scrollHeight <= lh * 1.6);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [text]);
  return (
    <div className="surface story">
      <TfrImage className="story-img" path={page.image_path} local={local} label={"illustration · page " + page.page_number} />
      <p ref={textRef} className={"story-text" + (text ? "" : " is-empty") + (single ? " is-single" : "") + (single && text.trim().split(/\s+/).length <= 2 ? " is-xl" : "")}>{text || "Story text will appear here"}</p>
    </div>
  );
}

/* Front-matter "About this book" screen. Content comes from HaarayaAboutDB
   (live from Supabase), keyed by book code. Shows the intro, the focus letter
   + example words (as silent visuals — no text-to-speech), and a
   read-to-find-out hook. */
function TfrAbout({ pkg, about }) {
  const b = pkg.book || {};
  const local = !!pkg._local;
  const logos = (pkg.assets && pkg.assets.logos) || {};
  const strandLogo = tfrStrandLogo(b, logos);
  const words = (about.soundbite || "").split(",").map(w => w.trim()).filter(Boolean);
  const hasSound = !!(about.focusVisible || words.length);
  return (
    <div className="surface about">
      <div className="about-head">
        {strandLogo.src && <img className="about-strandlogo" src={tfrSrc(strandLogo.src, local)} alt={strandLogo.alt} />}
        <span className="about-eyebrow">About this book</span>
      </div>
      <div className="about-body">
        <h1 className="about-title">{tfrText(b.title) || about.title || "Book title"}</h1>
        {about.about && <p className="about-lead">{about.about}</p>}

        {hasSound && (
          <div className="about-sound">
            {about.focusVisible && (
              <div className="about-focus">
                <span className="about-focus-letter">{about.focusVisible}</span>
                {about.soundCue && <span className="about-focus-cue">{"\u201c" + about.soundCue + "\u201d"}</span>}
              </div>
            )}
            {words.length > 0 && (
              <div className="about-words">
                <span className="about-words-label">Words to spot</span>
                <span className="about-words-list">{words.map((w, i) => <span key={i} className="about-word">{w}</span>)}</span>
              </div>
            )}
          </div>
        )}

        {about.read && (
          <div className="about-hook">
            <span className="about-hook-label">Read to find out</span>
            <p className="about-hook-text">{about.read}</p>
          </div>
        )}
      </div>
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
            {(() => { const sl = tfrStrandLogo(b, logos); return sl.src && <img className="logo-tafiya" src={tfrSrc(sl.src, local)} alt={sl.alt} />; })()}
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
/* Read text aloud with the device voice (no audio files yet). Phoneme
   notation like "/s/" is de-slashed so TTS doesn't say "slash". The word
   options carry the true pronunciation, which is what the child needs. */
/* ----------------------------------------------------------------
   Phonics speech layer.
   Browser text-to-speech mangles isolated letter-sounds (it reads the
   phoneme /i/ as the long letter-name “eye” instead of the short “ih”).
   Two fixes work together:
     1. A default respelling map so the common sounds speak correctly with
        no authoring.
     2. A hidden override the author can drop into any question / option:
        write  the /i/{{ih}} sound  — the {{ih}} is INVISIBLE on screen
        (white, clipped) but is what gets spoken, replacing the /i/ before
        it. Use {{...}} on its own anywhere to add speak-only text.
   The visible text is never changed by any of this. */
var TFR_PHONEME = {
  // short vowels — the classic long/short TTS failure
  "a": "aah", "e": "eh", "i": "ih", "o": "aw", "u": "uh",
  // hard single consonants read as a clean sound, not a letter-name
  "c": "kuh", "g": "guh", "h": "huh", "j": "juh", "q": "kwuh",
  "w": "wuh", "y": "yuh",
  // common digraphs
  "ch": "chuh", "sh": "shh", "th": "thuh", "ph": "fuh",
  "wh": "wuh", "ng": "ng", "qu": "kwuh", "ck": "kuh"
};
function tfrPhonemeSay(tok) {
  var key = String(tok || "").toLowerCase().trim();
  return Object.prototype.hasOwnProperty.call(TFR_PHONEME, key) ? TFR_PHONEME[key] : tok;
}
/* Turn display text into the string that should actually be spoken. */
/* Turn display text into the string that should actually be spoken.
   `cue` is the CURRENT BOOK's authored pronunciation (from About / sound_cue).
   Because a phonics book's quiz is about that book's one focus sound, any
   /x/ phoneme in the question is spoken with the book's own cue — authored,
   per-book, and correct (a global letter->sound map is ambiguous: "i" is
   "ih" in one book and "eye" in another). An inline {{...}} override still
   wins over everything. Falls back to the guessed map only when no cue. */
function tfrSpokenText(raw, cue) {
  var t = String(raw || "");
  // phoneme immediately followed by a hidden override: /x/{{ih}} -> "ih"
  t = t.replace(/\/[^/]*\/\s*\{\{\s*([^}]*?)\s*\}\}/g, " $1 ");
  // standalone hidden override: {{ih}} -> "ih"
  t = t.replace(/\{\{\s*([^}]*?)\s*\}\}/g, " $1 ");
  // remaining slash phonemes
  var authored = (cue != null && String(cue).trim() !== "") ? String(cue).trim() : null;
  t = t.replace(/\/([^/]+)\//g, function (_m, p1) { return " " + (authored || tfrPhonemeSay(p1)) + " "; });
  return t.replace(/\s+/g, " ").trim();
}
/* Render display text, hiding any {{...}} speak-only overrides off-screen
   (present in the DOM, invisible on screen) so layout is unaffected. */
function TfrRichText({ text }) {
  var s = String(text || "");
  if (s.indexOf("{{") < 0) return s;
  var nodes = []; var re = /\{\{\s*([^}]*?)\s*\}\}/g; var last = 0; var m; var k = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) nodes.push(s.slice(last, m.index));
    nodes.push(<span key={"sp" + (k++)} className="tfr-speak-only" aria-hidden="true">{m[1]}</span>);
    last = m.index + m[0].length;
  }
  if (last < s.length) nodes.push(s.slice(last));
  return <React.Fragment>{nodes}</React.Fragment>;
}
function tfrSpeakText(raw, cue) {
  try {
    if (!window.speechSynthesis) return;
    let t = tfrSpokenText(raw, cue);
    if (!t) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.rate = 0.82; u.pitch = 1.05; u.lang = "en-GB";
    window.speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}
/* Read-aloud preference — shared, persisted, OFF by default for everyone.
   Controls whether reading-check questions are spoken automatically. The
   tap-to-hear speaker buttons always work regardless of this setting. */
var TFR_RA_KEY = "haaraya.readAloud.v1";
var tfrRaSubs = [];
function tfrReadAloudGet() { try { return localStorage.getItem(TFR_RA_KEY) === "1"; } catch (e) { return false; } }
function tfrReadAloudSet(v) { try { localStorage.setItem(TFR_RA_KEY, v ? "1" : "0"); } catch (e) { /* ignore */ } tfrRaSubs.forEach(function (fn) { fn(v); }); }
function useTfrReadAloud() {
  const [v, setV] = useStateTfr(tfrReadAloudGet());
  useEffectTfr(() => {
    const fn = (nv) => setV(nv); tfrRaSubs.push(fn);
    return () => { const i = tfrRaSubs.indexOf(fn); if (i >= 0) tfrRaSubs.splice(i, 1); };
  }, []);
  return [v, tfrReadAloudSet];
}
function TfrReadAloudToggle() {
  const [on, setOn] = useTfrReadAloud();
  const toggle = (e) => {
    e.stopPropagation();
    const nv = !on; setOn(nv);
    if (nv) tfrSpeakText("Reading aloud is on.");
    else if (window.speechSynthesis) { try { window.speechSynthesis.cancel(); } catch (er) { /* ignore */ } }
  };
  return (
    <button type="button" role="switch" aria-checked={on} onClick={toggle} title="Read the questions aloud" className={"quiz-ra" + (on ? " is-on" : "")}>
      <svg className="quiz-ra-ico" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z" />{on ? <path d="M15.5 8.5a5 5 0 0 1 0 7" /> : null}</svg>
      <span className="quiz-ra-label">Read aloud</span>
      <span className="quiz-ra-state">{on ? "On" : "Off"}</span>
    </button>
  );
}
function TfrSpeaker({ text, label, size, cue }) {
  return (
    <span
      role="button"
      tabIndex={0}
      className={"quiz-speak" + (size === "sm" ? " sm" : "")}
      aria-label={label || ("Hear " + text)}
      onClick={(e) => { e.stopPropagation(); tfrSpeakText(text, cue); }}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); tfrSpeakText(text, cue); } }}
    >
      <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z"></path><path d="M15.5 8.5a5 5 0 0 1 0 7"></path><path d="M18.5 5.5a9 9 0 0 1 0 13"></path></svg>
    </span>
  );
}

// Resolve a book's reading check. Source of truth is Supabase
// (window.HaarayaQuizDB) — nothing is baked into the client. If the DB has no
// check (or the network is down), a generated sample is the last resort.
async function tfrResolveCheck(pkg, catalog) {
  const b = (pkg && pkg.book) || {};
  const code = tfrText(b.book_code) || tfrText(b.code);

  // 1. Supabase — the live, authored source.
  if (code && window.HaarayaQuizDB && window.HaarayaQuizDB.ready()) {
    try {
      const db = await window.HaarayaQuizDB.get(code);
      if (db && db.questions && db.questions.length) return db;
    } catch (e) {
      if (window.console) console.warn("[Quiz] Supabase fetch failed:", e && e.message);
    }
  }

  // 2. Generated sample — only when the DB has no authored check for this book.
  return { questions: tfrSampleQuestions(pkg, catalog), write: null, retryNote: "", source: "sample" };
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

function TfrQuizCards({ questions, write, retryNote, alreadyPassed, onPass, onContinue, cue }) {
  const n = questions.length;
  const [qi, setQi] = useStateTfr(0);  const [sel, setSel] = useStateTfr(-1);
  const [st, setSt] = useStateTfr("idle"); // idle | correct | wrong
  const [done, setDone] = useStateTfr(false);
  const [readAloud] = useTfrReadAloud();
  // Auto-read each question aloud when it appears — only when the child has
  // turned Read aloud on (off by default). Best-effort; browsers permit
  // speechSynthesis once the child has interacted with the page.
  useEffectTfr(() => { if (!done && readAloud && questions[qi]) tfrSpeakText(questions[qi].q, cue); }, [qi, done, readAloud]);
  if (done) return <TfrQuizDone total={n} write={write} onContinue={onContinue} />;
  const q = questions[qi];
  const pick = (oi) => { if (st === "correct") return; setSel(oi); setSt("idle"); };
  const check = () => { if (sel < 0) return; setSt(sel === q.answer ? "correct" : "wrong"); };
  const advance = () => { if (qi < n - 1) { setQi(qi + 1); setSel(-1); setSt("idle"); } else { setDone(true); onPass && onPass(); } };
  const stateOf = (oi) => { if (st === "correct") return oi === q.answer ? "correct" : "dim lock"; if (st === "wrong" && oi === sel) return "wrong"; if (oi === sel) return "sel"; return ""; };
  return (
    <div className="surface quiz quiz-cards">
      <div className="quiz-eyebrow-row"><span className="quiz-eyebrow">Reading check</span><TfrReadAloudToggle /></div>
      <div className="quiz-title">A few quick questions</div>
      <div className="quiz-pips">{questions.map((_, i) => <span key={i} className={"quiz-pip" + (i < qi ? " done" : i === qi ? " current" : "")} />)}</div>
      <div className="quiz-q"><span className="quiz-num">Question {qi + 1} of {n}</span><TfrRichText text={q.q} /><TfrSpeaker text={q.q} cue={cue} label="Hear the question" /></div>
      <div className="quiz-options">
        {q.options.map((o, oi) => { const cls = stateOf(oi); const tok = cls.split(" ")[0]; const mk = tok === "correct" ? "✓" : tok === "wrong" ? "✕" : ("ABC"[oi] || "•"); return <button key={oi} type="button" className={"quiz-opt " + cls} onClick={() => pick(oi)}><span className="mark">{mk}</span><span className="quiz-opt-text"><TfrRichText text={o} /></span><TfrSpeaker text={o} size="sm" label={"Hear " + o} /></button>; })}
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

function TfrQuizSheet({ questions, write, retryNote, alreadyPassed, onPass, onContinue, cue }) {
  const n = questions.length;
  const [ans, setAns] = useStateTfr(() => questions.map(() => -1));
  const [locked, setLocked] = useStateTfr(() => questions.map(() => false));
  const [checked, setChecked] = useStateTfr(false);
  const [done, setDone] = useStateTfr(false);
  const [readAloud] = useTfrReadAloud();
  // Read the questions aloud once on arrival, only when Read aloud is on.
  useEffectTfr(() => { if (readAloud) { const txt = questions.map((q, i) => "Question " + (i + 1) + ". " + q.q).join(" "); tfrSpeakText(txt, cue); } }, [readAloud]);
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
      <div className="quiz-eyebrow-row"><span className="quiz-eyebrow">Reading check</span><TfrReadAloudToggle /></div>
      <div className="quiz-title">Answer all the questions</div>
      <div className="quiz-blocks">
        {questions.map((q, qi) => (
          <div className="quiz-block" key={qi}>
            <div className="quiz-q"><span className="quiz-num">Question {qi + 1}</span><TfrRichText text={q.q} /><TfrSpeaker text={q.q} cue={cue} label="Hear the question" /></div>
            <div className="quiz-options">
              {q.options.map((o, oi) => { const cls = stateOf(qi, oi); const tok = cls.split(" ")[0]; const mk = tok === "correct" ? "✓" : tok === "wrong" ? "✕" : ("ABC"[oi] || "•"); return <button key={oi} type="button" className={"quiz-opt " + cls} onClick={() => pick(qi, oi)}><span className="mark">{mk}</span><span className="quiz-opt-text"><TfrRichText text={o} /></span><TfrSpeaker text={o} size="sm" label={"Hear " + o} /></button>; })}
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
  const [scribeOpen, setScribeOpen] = useStateTfr(false);
  const bookCodeForScribe = book.book_code || book.code;
  const isOdysseyBook = !!(window.HaarayaOdyssey && window.HaarayaOdyssey.has(bookCodeForScribe));
  // Captain's Log only appears for designated Odyssey books (see odyssey-books.js).
  const ScribeUI = isOdysseyBook ? window.ShipmateScribeUI : null;
  const scribeBook = {
    book_code: bookCodeForScribe,
    book_title: tfrText(book.title),
    book_number: (window.HaarayaOdyssey && window.HaarayaOdyssey.number(bookCodeForScribe)) || book.odyssey_number || book.book_number || null,
    level: book.level,
  };
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
            {ScribeUI ? <button className="nextup-scribe" type="button" onClick={() => setScribeOpen(true)}><span className="q" aria-hidden="true">&#x1F58B;</span> Write your Captain’s Log</button> : null}
            <button className="quiz-btn" type="button" onClick={onStartNext}>Start “{tfrText(nextBook.title) || nextCode}” →</button>
            <button className="quiz-btn ghost" type="button" onClick={onLibrary}>Back to library</button>
          </div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="nextup-meta" style={{ marginTop: "4cqh", fontSize: "3cqw" }}>You’ve reached the end of the journey for now. New books appear here as they’re published.</div>
          <div className="nextup-actions">
            {ScribeUI ? <button className="nextup-scribe" type="button" onClick={() => setScribeOpen(true)}><span className="q" aria-hidden="true">&#x1F58B;</span> Write your Captain’s Log</button> : null}
            <button className="quiz-btn" type="button" onClick={onLibrary}>Back to library</button>
          </div>
        </React.Fragment>
      )}
      {scribeOpen && ScribeUI ? <ScribeUI book={scribeBook} onClose={() => setScribeOpen(false)} /> : null}
    </div>
  );
}

/* ============================================================
   PAGE REVIEW (QA) PANEL  ·  real-auth, reviewer-only
   Sign-in gate → per-screen review form. Records Text / Image /
   Page-order / Layout verdicts, an issue type, a status and a
   note, all keyed to book_code + page_number in Supabase.
   ============================================================ */
const TFR_ISSUE_TYPES = [
  ["", "— Issue type —"],
  ["image_mismatch", "Image mismatch"],
  ["bad_cover", "Bad cover"],
  ["wrong_page_order", "Wrong page order"],
  ["broken_image", "Broken image"],
  ["text_issue", "Text issue"],
  ["layout_issue", "Layout issue"],
  ["transparency_checkerboard", "Transparency / checkerboard"],
  ["other", "Other"],
];
const TFR_STATUSES = [["open", "Open"], ["fixed", "Fixed"], ["ignored", "Ignored"]];

function tfrReviewDraft(review) {
  return {
    text_ok: review && review.text_ok != null ? review.text_ok : null,
    image_ok: review && review.image_ok != null ? review.image_ok : null,
    page_order_ok: review && review.page_order_ok != null ? review.page_order_ok : null,
    layout_ok: review && review.layout_ok != null ? review.layout_ok : null,
    issue_type: (review && review.issue_type) || "",
    review_status: (review && review.review_status) || "open",
    note: (review && review.note) || "",
  };
}

function TfrReviewSignIn({ onSignIn }) {
  const [email, setEmail] = useStateTfr("");
  const [pw, setPw] = useStateTfr("");
  const [busy, setBusy] = useStateTfr(false);
  const [err, setErr] = useStateTfr("");
  const submit = (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setErr("");
    Promise.resolve(onSignIn(email.trim(), pw))
      .catch(er => setErr((er && er.message) || "Sign in failed"))
      .finally(() => setBusy(false));
  };
  return (
    <form className="tfr-rv-signin" onSubmit={submit}>
      <p className="tfr-rv-signin-lede">Sign in to review this book.</p>
      <input type="email" className="tfr-rv-input" placeholder="Email" value={email}
        onChange={e => setEmail(e.target.value)} autoComplete="username" required />
      <input type="password" className="tfr-rv-input" placeholder="Password" value={pw}
        onChange={e => setPw(e.target.value)} autoComplete="current-password" required />
      {err && <div className="tfr-rv-error">{err}</div>}
      <button type="submit" className="tfr-rv-signin-btn" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
      <p className="tfr-rv-signin-hint">Register on the Haaraya sign-up page, then ask an admin for reviewer access.</p>
    </form>
  );
}

function TfrReviewForm({ bookCode, bookTitle, strandName, level, screenLabel, review, reviewerName, onSave, onSignOut }) {
  const [draft, setDraft] = useStateTfr(() => tfrReviewDraft(review));
  const [status, setStatus] = useStateTfr("idle"); // idle | saving | saved | error
  const noteTimer = useRefTfr(null);
  const pendingRef = useRefTfr(null);

  // Re-seed the form when a fresh server row arrives for this screen.
  useEffectTfr(() => { setDraft(tfrReviewDraft(review)); setStatus("idle"); }, [review && review.updated_at]);

  // Flush any pending (debounced) note before this screen's panel unmounts —
  // the panel is keyed per screen, so navigating away runs this cleanup.
  useEffectTfr(() => () => {
    if (noteTimer.current) clearTimeout(noteTimer.current);
    if (pendingRef.current) { const p = pendingRef.current; pendingRef.current = null; Promise.resolve(onSave(p)).catch(() => {}); }
  }, []);

  const commit = (next, debounce) => {
    setDraft(next);
    setStatus("saving");
    pendingRef.current = next;
    const run = () => Promise.resolve(onSave(next))
      .then(() => { if (pendingRef.current === next) { pendingRef.current = null; setStatus("saved"); } })
      .catch(() => setStatus("error"));
    if (debounce) { if (noteTimer.current) clearTimeout(noteTimer.current); noteTimer.current = setTimeout(run, 700); }
    else { if (noteTimer.current) { clearTimeout(noteTimer.current); noteTimer.current = null; } run(); }
  };
  const setTri = (field, val) => commit({ ...draft, [field]: draft[field] === val ? null : val }, false);
  const setVal = (field, val) => commit({ ...draft, [field]: val }, false);
  const onNote = (e) => commit({ ...draft, note: e.target.value }, true);

  const statusText = { idle: "", saving: "Saving…", saved: "Saved ✓", error: "Save failed" }[status];

  const Item = ({ label, field }) => {
    const value = draft[field];
    return (
      <div className={"tfr-rv-item" + (value === false ? " is-flagged" : "")}>
        <span className="tfr-rv-label">{label}</span>
        <div className="tfr-rv-seg" role="group" aria-label={label + " status"}>
          <button type="button" className={"tfr-rv-btn ok" + (value === true ? " on" : "")} onClick={() => setTri(field, true)}>OK</button>
          <button type="button" className={"tfr-rv-btn bad" + (value === false ? " on" : "")} onClick={() => setTri(field, false)}>Needs edit</button>
        </div>
      </div>
    );
  };

  return (
    <div className="tfr-rv-form">
      <div className={"tfr-rv-statusline is-" + status}>{statusText}</div>

      <div className="tfr-rv-context">
        <div className="tfr-rv-ctx-code">{bookCode}</div>
        {bookTitle && <div className="tfr-rv-ctx-title">{bookTitle}</div>}
        <div className="tfr-rv-ctx-meta">
          {strandName && <span>{strandName}</span>}
          {level != null && <span>Level {level}</span>}
          <span>{screenLabel}</span>
        </div>
      </div>

      <Item label="Text" field="text_ok" />
      <Item label="Image" field="image_ok" />
      <Item label="Page order" field="page_order_ok" />
      <Item label="Layout" field="layout_ok" />

      <label className="tfr-rv-field">
        <span className="tfr-rv-field-label">Issue type</span>
        <select className="tfr-rv-select" value={draft.issue_type} onChange={e => setVal("issue_type", e.target.value)}>
          {TFR_ISSUE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>

      <label className="tfr-rv-field">
        <span className="tfr-rv-field-label">Status</span>
        <select className="tfr-rv-select" value={draft.review_status} onChange={e => setVal("review_status", e.target.value)}>
          {TFR_STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>

      <label className="tfr-rv-note-label">
        Notes
        <textarea className="tfr-rv-note" value={draft.note} onChange={onNote}
          placeholder="Describe exactly what needs fixing on this page…" rows={5}></textarea>
      </label>

      <div className="tfr-rv-by">
        Reviewing as <strong>{reviewerName}</strong>
        <button type="button" className="tfr-rv-textbtn" onClick={onSignOut}>Sign out</button>
      </div>
    </div>
  );
}

function TfrReviewPanel(props) {
  const { reviewer, reviewerLoaded, review, onSignIn, onSignOut } = props;
  const flagged = review && (review.text_ok === false || review.image_ok === false
    || review.page_order_ok === false || review.layout_ok === false);

  let body;
  if (!reviewerLoaded) {
    body = <div className="tfr-rv-msg">Checking access…</div>;
  } else if (!reviewer) {
    body = <TfrReviewSignIn onSignIn={onSignIn} />;
  } else if (!reviewer.isReviewer) {
    body = (
      <div className="tfr-rv-msg">
        <p>Signed in as <strong>{reviewer.name}</strong>.</p>
        <p className="tfr-rv-msg-dim">This account doesn’t have reviewer access yet. Ask an admin to enable it.</p>
        <button type="button" className="tfr-rv-textbtn" onClick={onSignOut}>Sign out</button>
      </div>
    );
  } else {
    body = <TfrReviewForm key={props.screenKey} {...props} reviewerName={reviewer.name} />;
  }

  return (
    <aside className={"tfr-review" + (flagged ? " has-flag" : "")}>
      <div className="tfr-rv-head">
        <span className="tfr-rv-title">Page review</span>
      </div>
      {body}
    </aside>
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

  // ---- Page review (QA) mode ----
  const [reviewMode, setReviewMode] = useStateTfr(() => {
    try { return localStorage.getItem("tafiya-reader:reviewMode") === "1"; } catch (e) { return false; }
  });
  const [reviews, setReviews] = useStateTfr({});
  const [reviewer, setReviewer] = useStateTfr(null);
  const [reviewerLoaded, setReviewerLoaded] = useStateTfr(false);
  const isReviewer = !!(reviewer && reviewer.isReviewer);

  useEffectTfr(() => {
    try { localStorage.setItem("tafiya-reader:reviewMode", reviewMode ? "1" : "0"); } catch (e) { /* ignore */ }
  }, [reviewMode]);

  // Track the signed-in reviewer (real Supabase auth), refresh on auth change.
  useEffectTfr(() => {
    let alive = true;
    const refresh = () => {
      if (!window.HaarayaReview) { setReviewerLoaded(true); return; }
      window.HaarayaReview.currentReviewer().then(r => {
        if (alive) { setReviewer(r); setReviewerLoaded(true); }
      });
    };
    refresh();
    let sub = null;
    if (window.HaarayaReview && window.HaarayaReview.onAuthChange) {
      sub = window.HaarayaReview.onAuthChange(() => refresh());
    }
    return () => {
      alive = false;
      try { sub && sub.data && sub.data.subscription && sub.data.subscription.unsubscribe(); } catch (e) { /* ignore */ }
    };
  }, []);

  // Load saved reviews for this book — reviewers only (RLS blocks others).
  useEffectTfr(() => {
    if (!window.HaarayaReview || !isReviewer) { setReviews({}); return; }
    let alive = true;
    window.HaarayaReview.load(code).then(map => { if (alive) setReviews(map || {}); });
    return () => { alive = false; };
  }, [code, isReviewer]);

  const handleSignIn = (email, password) =>
    window.HaarayaReview ? window.HaarayaReview.signIn(email, password) : Promise.reject(new Error("unavailable"));
  const handleSignOut = () => {
    if (window.HaarayaReview) window.HaarayaReview.signOut();
  };

  const saveReview = (screenKey, pageNumber, vals) => {
    if (!window.HaarayaReview) return Promise.reject(new Error("review layer unavailable"));
    const bk = (pkg && pkg.book) || {};
    const lvlMatch = String(bk.level || "").match(/\d+/);
    const row = {
      book_code: code,
      screen_key: screenKey,
      page_number: pageNumber == null ? null : pageNumber,
      text_ok: vals.text_ok == null ? null : vals.text_ok,
      image_ok: vals.image_ok == null ? null : vals.image_ok,
      page_order_ok: vals.page_order_ok == null ? null : vals.page_order_ok,
      layout_ok: vals.layout_ok == null ? null : vals.layout_ok,
      issue_type: vals.issue_type || null,
      review_status: vals.review_status || "open",
      note: vals.note || "",
      book_title: tfrText(bk.title) || null,
      strand: tfrText(bk.strand) || null,
      level: lvlMatch ? Number(lvlMatch[0]) : null,
      reviewer: reviewer ? reviewer.name : null,
    };
    setReviews(r => ({ ...r, [screenKey]: { ...(r[screenKey] || {}), ...row } }));
    return window.HaarayaReview.save(row).then(saved => {
      if (saved) setReviews(r => ({ ...r, [screenKey]: saved }));
      return saved;
    });
  };

  // "About this book" front-matter — fetched live from Supabase (async).
  const [about, setAbout] = useStateTfr(null);
  useEffectTfr(() => {
    if (!pkg) { setAbout(null); return; }
    const c = tfrText((pkg.book || {}).book_code) || tfrText((pkg.book || {}).code);
    if (!(window.HaarayaAboutDB && c)) { setAbout(null); return; }
    let alive = true;
    window.HaarayaAboutDB.get(c).then(a => { if (alive) setAbout(a); });
    return () => { alive = false; };
  }, [pkg]);

  // Build the screen list once a package is loaded.
  const screens = React.useMemo(() => {
    if (!pkg) return [];
    const pages = (pkg.pages || []).slice().sort((a, b) => (a.page_number || 0) - (b.page_number || 0));
    const front = about ? [{ type: "about" }] : [];
    return [{ type: "cover" }, ...front, ...pages.map(p => ({ type: "page", page: p })), { type: "back" }, { type: "quiz" }, { type: "nextup" }];
  }, [pkg, about]);

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

  // Reading check for this book — fetched live from Supabase (async).
  const [check, setCheck] = useStateTfr({ questions: [], write: null, retryNote: "", source: "", loading: true });
  useEffectTfr(() => {
    if (!pkg) { setCheck({ questions: [], write: null, retryNote: "", source: "", loading: false }); return; }
    let alive = true;
    setCheck(c => ({ ...c, loading: true }));
    tfrResolveCheck(pkg, catalog).then(res => { if (alive) setCheck({ ...res, loading: false }); });
    return () => { alive = false; };
  }, [pkg, catalog]);
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
    window.TafiyaData.getPackage(code).then(async p => {
      if (!alive) return;
      const aboutCode = (p.book || {}).book_code || (p.book || {}).code;
      let hasAbout = false;
      if (window.HaarayaAboutDB && aboutCode) {
        try { hasAbout = !!(await window.HaarayaAboutDB.get(aboutCode)); } catch (e) { /* ignore */ }
      }
      if (!alive) return;
      setPkg(p);
      setStatus("ready");
      const totalScreens = 1 + (hasAbout ? 1 : 0) + (p.pages ? p.pages.length : 0) + 3;
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
  const nextScreen = screens[index + 1];
  const nextLeadsToCheck = !!(nextScreen && nextScreen.type === "quiz");
  const nextLabel = nextLeadsToCheck ? "Reading check" : "Next";

  let progressText = "";
  if (cur) {
    if (cur.type === "cover") progressText = "Front cover";
    else if (cur.type === "about") progressText = "About this book";
    else if (cur.type === "back") progressText = "Back cover";
    else if (cur.type === "quiz") progressText = "Reading check";
    else if (cur.type === "nextup") progressText = "Up next";
    else {
      const count = screens.filter(x => x.type === "page").length;
      progressText = "Page " + cur.page.page_number + " of " + count;
    }
  }

  // Which screen the review panel targets (cover, story page, back cover only).
  let reviewTarget = null;
  if (cur && cur.type === "cover") reviewTarget = { key: "cover", page: null, label: "Front cover" };
  else if (cur && cur.type === "back") reviewTarget = { key: "back", page: null, label: "Back cover" };
  else if (cur && cur.type === "page") reviewTarget = { key: "page-" + cur.page.page_number, page: cur.page.page_number, label: "Page " + cur.page.page_number };
  const reviewActive = reviewMode && reviewTarget && status === "ready";

  return (
    <div className="tfr">
      <div className={"reader" + (reviewActive ? " review-on" : "")}>
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-nav">
            <button className="btn btn-ghost" type="button" onClick={() => onNavigate("home")}>
              <span className="ico" aria-hidden="true">⌂</span><span>Home</span>
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => onNavigate("library")}>
              <span className="ico" aria-hidden="true">‹</span><span>Library</span>
            </button>
            <button
              className={"btn btn-ghost tfr-review-toggle" + (reviewMode ? " is-on" : "")}
              type="button"
              onClick={() => setReviewMode(v => !v)}
              title="Toggle page review mode"
              aria-pressed={reviewMode}
            >
              <span className="ico" aria-hidden="true">✓</span><span>{reviewMode ? "Reviewing" : "Review"}</span>
            </button>
          </div>
          <div className="running">
            <span className="running-title">{tfrText(b.title) || "\u00a0"}</span>
            <span className="running-level">{pkg ? tfrMeta(b) : ""}{pkg && (b.book_code || b.code) ? <span className="running-code">{b.book_code || b.code}</span> : null}</span>
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
            {status === "ready" && cur && cur.type === "about" && <TfrAbout pkg={pkg} about={about} />}
            {status === "ready" && cur && cur.type === "page" && <TfrPage page={cur.page} local={!!(pkg && pkg._local)} />}
            {status === "ready" && cur && cur.type === "back" && <TfrBack pkg={pkg} />}
            {status === "ready" && cur && cur.type === "quiz" && check.loading && (
              <div className="surface quiz">
                <div className="quiz-eyebrow-row"><span className="quiz-eyebrow">Reading check</span></div>
                <div className="quiz-title">Preparing your reading check…</div>
              </div>
            )}
            {status === "ready" && cur && cur.type === "quiz" && !check.loading && check.questions.length > 0 && (
              <TfrQuiz
                key={code}
                questions={check.questions}
                write={check.write}
                retryNote={check.retryNote}
                cue={about ? about.soundCue : ""}
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
          {reviewActive && (
            <TfrReviewPanel
              screenKey={reviewTarget.key}
              screenLabel={reviewTarget.label}
              bookCode={code}
              bookTitle={tfrText(b.title)}
              strandName={tfrText(b.strand)}
              level={(() => { const m = String(b.level || "").match(/\d+/); return m ? Number(m[0]) : null; })()}
              review={reviews[reviewTarget.key]}
              reviewer={reviewer}
              reviewerLoaded={reviewerLoaded}
              onSave={(vals) => saveReview(reviewTarget.key, reviewTarget.page, vals)}
              onSignIn={handleSignIn}
              onSignOut={handleSignOut}
            />
          )}
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
            <button className={"btn btn-nav btn-next next" + (nextLeadsToCheck ? " is-to-check" : "")} type="button" onClick={next} disabled={index === total - 1 || status !== "ready" || (cur && cur.type === "quiz" && !quizPassed)}>
              <span className="nav-label">{nextLabel}</span><span className="ico" aria-hidden="true">›</span>
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
  const [query, setQuery] = useStateTfr("");

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
  // Programme order = global v4_2 teaching sequence, joined per book by Book_Code
  // via window.HAARAYA_PROGRESSION. Falls back to code suffix when unmapped.
  const progNum = (b) => { const m = window.HAARAYA_PROGRESSION; const c = codeOf(b); return (m && m[c] != null) ? m[c] : null; };
  const seqNum = (b) => { const m = String(codeOf(b)).split("-").pop(); const n = parseInt(m, 10); return isNaN(n) ? 999999 : n; };
  const byProgramme = (a, b) => {
    const pa = progNum(a), pb = progNum(b);
    if (pa != null && pb != null) return pa - pb;
    if (pa != null) return -1;
    if (pb != null) return 1;
    return (levelNum(a) - levelNum(b)) || (seqNum(a) - seqNum(b)) || codeOf(a).localeCompare(codeOf(b), undefined, { numeric: true });
  };

  const q = query.trim().toLowerCase();
  const matchesQuery = (b) => {
    if (!q) return true;
    return tfrText(b.title).toLowerCase().includes(q) || String(codeOf(b)).toLowerCase().includes(q);
  };

  const filtered = catalog
    .filter(b => codeOf(b))
    .filter(matchesQuery)
    .filter(b => levelFilter === "all" || levelNum(b) === levelFilter)
    .filter(b => strandFilter === "all" || tfrStrandUi(b) === strandFilter)
    .sort(byProgramme);

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="wrap" style={{ padding: "64px 32px 80px" }}>
        <SectionHeader
          eyebrow="The library"
          title="Explore the Haaraya reading journey."
          lede="Tap any book to open it in the Tafiya reader — cover, story pages, and reading notes."
        />

        {/* Search by book name or code */}
        <div className="tfl-search">
          <span className="tfl-search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            className="tfl-search-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by book name or code…"
            aria-label="Search books by name or code"
          />
          {query && (
            <button className="tfl-search-clear" onClick={() => setQuery("")} aria-label="Clear search">×</button>
          )}
        </div>

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
                    {(b.thumbnail_image_path || b.cover_image_path)
                      ? <img src={tfrSrc(b.thumbnail_image_path || b.cover_image_path)} alt="" onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling && (e.currentTarget.nextSibling.style.display = ""); }} />
                      : null}
                    <span className="tfl-thumb-ph" style={(b.thumbnail_image_path || b.cover_image_path) ? { display: "none" } : undefined}>{code}</span>
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
