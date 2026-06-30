/* ============================================================
   Haaraya — App screens (Passport, Child Dash, Library, Reader, Parent Dash)
   ============================================================ */

const { useState: useStateScreens, useEffect: useEffectScreens, useRef: useRefScreens } = React;

/* ============================================================
   READING PASSPORT — clean, collectible redesign
   ============================================================ */

const PASSPORT_LEVELS = [
  { n: 1,  name: "Tashi",    band: "Pink",      color: "#E84B9C", meaning: "Rise — the first words",        total: 18 },
  { n: 2,  name: "Mataki",   band: "Red",       color: "#E53935", meaning: "First steps",                   total: 26 },
  { n: 3,  name: "Hanya",    band: "Yellow",    color: "#E0A400", meaning: "Finding the path",              total: 33 },
  { n: 4,  name: "Tafiya",   band: "Blue",      color: "#1E88E5", meaning: "The journey begins",            total: 28 },
  { n: 5,  name: "Kwararo",  band: "Green",     color: "#2E9D4F", meaning: "Reading starts to flow",        total: 30 },
  { n: 6,  name: "Gada",     band: "Orange",    color: "#FB8C00", meaning: "Crossing the bridge",           total: 40 },
  { n: 7,  name: "Kwari",    band: "Turquoise", color: "#16B5AF", meaning: "Through the valley",            total: 38 },
  { n: 8,  name: "Tudun",    band: "Purple",    color: "#8E24AA", meaning: "Climbing the hill",             total: 36 },
  { n: 9,  name: "Kololuwa", band: "Gold",      color: "#C9A227", meaning: "Nearing the summit",            total: 37 },
  { n: 10, name: "Fage",     band: "White",     color: "#AEB4AC", meaning: "Out in the open field",         total: 37 },
  { n: 11, name: "Sarari",   band: "Lime",      color: "#9CCC2E", meaning: "Under the open sky",            total: 37 },
  { n: 12, name: "Isa",      band: "Dark Red",  color: "#8E1616", meaning: "Arrival — a confident reader",  total: 37 },
];

const PASSPORT_BONUS = ["Find Ant", "Read Aloud", "Reread", "Word Hunter", "Favorite Book", "Story Talk", "Level Complete"];

/* Book-stamp status icons — the actual seal image files only (no circles):
   not started · reading (started) · complete */
const BOOK_IMG = {
  notstarted: "assets/book-notstarted.png",
  progress:   "assets/book-reading.png",
  complete:   "assets/book-complete.png",
};
function StampBook({ status }) {
  return <img className="pp-bookimg" src={BOOK_IMG[status]} alt="" draggable="false" />;
}

/* Bonus reward icon — a star rosette / medal */
function StampBonus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9.4 14.6l-1.5 5.7 4.1-2.3 4.1 2.3-1.5-5.7" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="12" cy="9.4" r="6.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M12 5.5l1.17 2.37 2.62.38-1.9 1.85.45 2.6L12 11.85l-2.34 1.23.45-2.6-1.9-1.85 2.62-.38z" fill="currentColor" />
    </svg>
  );
}

function PassportScreen({ onNavigate, gotoLevel, highlightBookId }) {
  const CHILD_ID = (window.HaarayaSession && HaarayaSession.childId()) || 1;
  // The passport always belongs to the child being viewed, not the viewer
  const ME = "Demo Child";
  const { data: summary } = useApi(() => HaarayaApi.getChildSummary(CHILD_ID), [CHILD_ID]);
  const { data: levelCounts } = useApi(() => TafiyaBooks.levelCounts(), []);
  const [readTick, setReadTick] = useStateScreens(0);
  useEffectScreens(() => {
    const on = () => setReadTick(t => t + 1);
    window.addEventListener("haaraya:reading", on);
    return () => window.removeEventListener("haaraya:reading", on);
  }, []);
  // Open directly on a specific level's stamp page when arriving from a book completion.
  const levelToIdx = (lvl) => {
    const li = PASSPORT_LEVELS.findIndex(l => l.n === Number(lvl));
    return li >= 0 ? li + 3 : 0;
  };
  const [idx, setIdx] = useStateScreens(() => (gotoLevel ? levelToIdx(gotoLevel) : 0));
  const [dir, setDir] = useStateScreens(1);
  const touchX = useRefScreens(null);
  const TOTAL = 15;

  const go = (n) => { if (n < 0 || n >= TOTAL) return; setDir(n > idx ? 1 : -1); setIdx(n); };

  // Page-flip interactions: keyboard arrows + touch swipe (click zones handled in JSX)
  useEffectScreens(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") go(idx + 1);
      else if (e.key === "ArrowLeft") go(idx - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [idx]);
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 40) return;
    go(dx < 0 ? idx + 1 : idx - 1);
  };

  if (!summary) return null;
  const child = summary.child;
  // Current level is derived from real reading progress (highest level with a
  // completed book), so it always matches the live Tafiya catalogue.
  const cur = (() => {
    const byLvl = window.TafiyaBooks ? TafiyaBooks.completedByLevel() : {};
    const lvls = Object.keys(byLvl).map(Number);
    return lvls.length ? Math.max(...lvls) : 1;
  })();
  const started = child.startedAt
    ? new Date(child.startedAt).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  const labelFor = (i) => {
    if (i === 0) return "Cover";
    if (i === 1) return "ID Page";
    if (i === 2) return "Journey Map";
    const lv = PASSPORT_LEVELS[i - 3];
    return "Level " + lv.n + " · " + lv.name;
  };

  // Progress summary figures — derived from real Tafiya reads, not mock data.
  const _ignore = readTick; // re-render when a book is completed
  const completedByLvl = (window.TafiyaBooks ? TafiyaBooks.completedByLevel() : {});
  const stampsEarned = window.TafiyaData ? window.TafiyaData.completedCodes().length : 0;
  const levelTotal   = (levelCounts && levelCounts[cur]) || 0;
  const levelDone    = completedByLvl[cur] || 0;
  const booksToNext  = Math.max(0, levelTotal - levelDone);
  const levelsComplete = Math.max(0, cur - 1);

  return (
    <main className="ppx">
      <header className="ppx-top wrap">
        <div className="ppx-header-main">
          <div className="ppx-top-title">
            <div className="ppx-kicker">Reading Passport</div>
            <p className="ppx-tagline">Every book earns a stamp. Every stamp marks the journey.</p>
          </div>
          <div className="ppx-header-right">
            <div className="ppx-actions">
              <button className="ppx-btn ppx-btn-ghost" onClick={() => onNavigate("child")}>&larr; Dashboard</button>
              <button className="ppx-btn ppx-btn-solid">Share passport</button>
            </div>
            <div className="ppx-progress-summary">
              <span className="ppx-prog-chip">Level {cur}</span>
              <span className="ppx-prog-item">{`${stampsEarned} ${stampsEarned === 1 ? "Stamp" : "Stamps"} Earned`}</span>
              <span className="ppx-prog-item">
                {booksToNext > 0
                  ? `${booksToNext} ${booksToNext === 1 ? "book" : "books"} to next badge`
                  : "Level badge earned"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="pbook-flip wrap">
        <div className="pbook-stage" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <button
            className="pbook-zone zone-prev"
            onClick={() => go(idx - 1)}
            disabled={idx === 0}
            aria-label="Previous page"
          ></button>
          <button
            className="pbook-zone zone-next"
            onClick={() => go(idx + 1)}
            disabled={idx === TOTAL - 1}
            aria-label="Next page"
          ></button>
          <div className={"pbook-spread dir-" + (dir > 0 ? "next" : "prev")} key={idx}>
            <PassportSpread idx={idx} child={child} name={ME} summary={summary} cur={cur} levelCounts={levelCounts} started={started} onNavigate={onNavigate} childId={CHILD_ID} highlightBookId={highlightBookId} />
          </div>
          {idx > 0 && <span className="pbook-curl curl-prev" aria-hidden="true"></span>}
          {idx > 0 && idx < TOTAL - 1 && <span className="pbook-curl curl-next" aria-hidden="true"></span>}
        </div>
      </div>

      <div className="pbook-meta wrap">
        <div className="pbook-pagelabel">{labelFor(idx)}</div>
        <div className="pbook-dots" role="tablist" aria-label="Passport pages">
          {Array.from({ length: TOTAL }, (_, i) => {
            let cls = "pbook-dot";
            if (i >= 3) {
              const n = i - 2;
              cls += n < cur ? " done" : n === cur ? " current" : " future";
            }
            if (i === idx) cls += " on";
            return (
              <button
                key={i}
                className={cls}
                onClick={() => go(i)}
                aria-label={labelFor(i)}
                aria-selected={i === idx}
              />
            );
          })}
        </div>
      </div>
    </main>
  );
}

/* ---- Journey map page (idx 2) — interactive level hotspots + drag calibration ----
   The journey art already has the L1–L12 badges painted in, so the interactive
   layer is a set of hotspots that sit ON each badge: clickable (open that level)
   and showing live progress (completed = green ring, current = gold pulse).
   Toggle Tweaks "Drag stamps on journey" to reposition them, then "Copy values". */
const PP_JOURNEY_NODES = [
  { lvl: 1,  x: 13.5,  y: 64.0 },  { lvl: 2,  x: 16.0,  y: 47.0 },  { lvl: 3,  x: 23.5,  y: 65.0 },
  { lvl: 4,  x: 36.0,  y: 53.0 },  { lvl: 5,  x: 47.0,  y: 43.0 },  { lvl: 6,  x: 49.66, y: 26.66 },
  { lvl: 7,  x: 60.68, y: 44.11 }, { lvl: 8,  x: 62.52, y: 56.0 },  { lvl: 9,  x: 71.39, y: 47.34 },
  { lvl: 10, x: 74.5,  y: 30.0 },  { lvl: 11, x: 76.0,  y: 18.0 },  { lvl: 12, x: 83.0,  y: 8.5 },
];
const PP_LEVEL_NAMES = ["Tashi","Mataki","Hanya","Tafiya","Kwararo","Gada","Kwari","Tudun","Kololuwa","Fage","Sarari","Isa"];

function JourneyPage({ cur, onNavigate }) {
  const [calibrating, setCalibrating] = useStateScreens(() =>
    typeof window !== "undefined" && (
      new URLSearchParams(window.location.search).has("cal") ||
      (typeof localStorage !== "undefined" && localStorage.getItem("haaraya:cal") === "1")
    )
  );
  useEffectScreens(() => {
    const sync = () => setCalibrating(localStorage.getItem("haaraya:cal") === "1");
    window.addEventListener("haaraya:cal", sync);
    return () => window.removeEventListener("haaraya:cal", sync);
  }, []);

  const wrapRef = useRefScreens(null);
  const [nodes, setNodes] = useStateScreens(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("haaraya:ppjourney:nodes") || "null");
      if (Array.isArray(saved) && saved.length === 12) return saved;
    } catch (e) { /* ignore */ }
    return PP_JOURNEY_NODES;
  });

  const startDrag = (lvl) => (e) => {
    if (!calibrating) return;
    e.preventDefault();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const move = (ev) => {
      const r = wrap.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * 100;
      const y = ((ev.clientY - r.top) / r.height) * 100;
      setNodes(prev => prev.map(nd => nd.lvl === lvl ? { ...nd, x: +x.toFixed(2), y: +y.toFixed(2) } : nd));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  useEffectScreens(() => {
    if (calibrating) localStorage.setItem("haaraya:ppjourney:nodes", JSON.stringify(nodes));
  }, [nodes, calibrating]);

  return (
    <div className="ppage ppage-full ppjourney">
      {calibrating && (
        <div className="ppjourney-calbar">
          <span><b>CALIBRATION</b> — drag each marker onto its badge on the map.</span>
          <div className="ppjourney-calbar-actions">
            <button onClick={() => setNodes(PP_JOURNEY_NODES)}>Reset</button>
            <button className="primary" onClick={() => {
              const out = JSON.stringify(nodes);
              if (navigator.clipboard) {
                navigator.clipboard.writeText(out).then(
                  () => alert("Copied! Paste these coordinates back into chat:\n\n" + out),
                  () => prompt("Copy these values:", out)
                );
              } else { prompt("Copy these values:", out); }
            }}>Copy values</button>
          </div>
        </div>
      )}
      <div className={"ppjourney-map" + (calibrating ? " is-cal" : "")} ref={wrapRef}>
        <img className="ppjourney-base" src="assets/journey-map-v2.png" alt="The Haaraya reading journey map" draggable="false" />
        {nodes.map(nd => {
          const state = nd.lvl < cur ? "complete" : nd.lvl === cur ? "in-progress" : "not-started";
          const nm = PP_LEVEL_NAMES[nd.lvl - 1] || "";
          const stateLabel = state === "complete" ? "completed" : state === "in-progress" ? "in progress" : "not started yet";
          return (
            <img
              key={nd.lvl}
              className={"ppjourney-stamp ppjourney-stamp-" + state + (nd.lvl === cur ? " ppjourney-stamp-current" : "") + (calibrating ? " is-cal" : "")}
              src={`assets/stamps2/${state}/stamp-l${nd.lvl}.png`}
              alt={`Level ${nd.lvl} — ${nm}: ${stateLabel}`}
              title={`L${nd.lvl} · ${nm} — ${stateLabel}`}
              draggable="false"
              style={{ left: nd.x + "%", top: nd.y + "%", cursor: calibrating ? "grab" : "pointer" }}
              onMouseDown={startDrag(nd.lvl)}
              onClick={() => { if (!calibrating && onNavigate) onNavigate("library", { levelId: nd.lvl }); }}
            />
          );
        })}
      </div>
    </div>
  );
}

function PassportSpread({ idx, child, name, summary, cur, levelCounts, started, onNavigate, childId, highlightBookId }) {
  const curName = (PASSPORT_LEVELS.find(l => l.n === cur) || {}).name || "";

  if (idx === 0) {
    return (
      <div className="ppage ppage-cover">
        <img className="pcover-img" src="assets/passport-cover-green.png" alt={child.displayName + " — Reading Passport"} />
      </div>
    );
  }

  if (idx === 1) {
    // ----- Derive holder details from real website data -----
    const nameParts = (child.displayName || "").trim().split(/\s+/);
    const surname   = (nameParts.length > 1 ? nameParts[nameParts.length - 1] : (nameParts[0] || "")).toUpperCase();
    const given     = (nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : "").toUpperCase();
    const readerNm  = (child.shortName || given.split(" ")[0] || "").toUpperCase();
    const homeBase  = ((child.city || "Lagos") + ", Haaraya").toUpperCase();
    const lvlName   = curName.toUpperCase();
    const serial    = String(72467 + child.id).padStart(8, "0");
    const issuedDate = child.startedAt ? new Date(child.startedAt) : new Date("2024-06-01");
    const fmtDate = (d) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
    const validDate = new Date(issuedDate); validDate.setFullYear(validDate.getFullYear() + 3);
    const issuedYr  = issuedDate.getFullYear();
    const readerId  = "HLR-" + issuedYr + "-" + serial;
    // Machine-readable zone
    const mrz1 = ("P<HAARAYA<READING<PASSPORT" + "<".repeat(20)).slice(0, 44);
    const mrzName = readerNm + "<<" + surname + "<" + given.replace(/\s+/g, "<");
    const mrzTail = "READ<GROW<THRIVE<<" + String(cur).padStart(2, "0");
    const mrzMid  = serial + "<" + mrzName;
    const mrz2 = mrzMid + "<".repeat(Math.max(2, 44 - mrzTail.length - mrzMid.length)) + mrzTail;

    const Field = ({ label, value, glyph }) => (
      <div className="ppid2-field">
        <dt>{label}</dt>
        <dd>{value}{glyph && <span className="ppid2-bookglyph" aria-hidden="true" />}</dd>
      </div>
    );

    return (
      <div className="ppage ppid2">
        <div className="ppid2-serial">
          <span className="ppid2-serial-num">HL{serial}</span>
          <span className="ppid2-flag" aria-hidden="true" />
        </div>

        {/* Left page — crest & dedication */}
        <div className="ppid2-left">
          <img className="ppid2-logo" src="assets/logo-haaraya-education.png" alt="Haaraya Education" />
          <p className="ppid2-dedication">
            This Reading Passport belongs to a curious reader<br />
            on a lifelong journey of learning, imagination, and discovery.<br />
            May every page you read open a new world,<br />
            every story you explore build a brighter future,<br />
            and every word you learn empower you<br />
            to make a positive difference.
          </p>
        </div>

        {/* Right page — reader data */}
        <div className="ppid2-right">
          <div className="ppid2-masthead">
            <div className="ppid2-title">HAARAYA</div>
            <div className="ppid2-subtitle">Reading Passport</div>
            <div className="ppid2-diamond" aria-hidden="true" />
          </div>

          <div className="ppid2-rihead"><span>Reader Information</span></div>

          <div className="ppid2-body">
            <div className="ppid2-photo" aria-label="Reader photo" />
            <div className="ppid2-info">
              <div className="ppid2-row3">
                <Field label="Passport Type" value="Reading Passport" />
                <Field label="Code" value="HLP" />
                <Field label="Country" value="Haaraya" />
              </div>
              <Field label="Surname" value={surname} />
              <Field label="Given Name" value={given} />
              <Field label="Reader Name" value={readerNm} />
              <Field label="Nationality" value="Haaraya Reader" />
            </div>
          </div>

          <div className="ppid2-row3 ppid2-undercard">
            <Field label="Date of Birth" value="12 MAY 2015" />
            <Field label="Sex" value="—" />
            <Field label="Home Base" value={homeBase} />
          </div>
          <div className="ppid2-row2">
            <Field label="Issued" value={fmtDate(issuedDate)} />
            <Field label="Valid Through" value={fmtDate(validDate)} />
          </div>
          <Field label="Level" value={lvlName + " (Level " + cur + ")"} glyph />
          <Field label="Reader ID" value={readerId} />
        </div>

        {/* Machine-readable zone, spanning the gutter */}
        <div className="ppid2-mrz">
          <div>{mrz1}</div>
          <div>{mrz2}</div>
        </div>
      </div>
    );
  }

  if (idx === 2) {
    return <JourneyPage cur={cur} onNavigate={onNavigate} />;
  }

  const lv = PASSPORT_LEVELS[idx - 3];
  return <LevelSpread level={lv} cur={cur} total={lv.total} completedThisLevel={summary.currentLevelCompleted} onNavigate={onNavigate} childId={childId} highlightBookId={highlightBookId} />;
}

function LevelSpread({ level, cur, completedThisLevel, onNavigate, childId, highlightBookId }) {
  const n = level.n;
  const serial = "HL" + String(72467 + (childId || 1)).padStart(8, "0"); // passport serial, shown top-left

  // Real Tafiya books at this level + earned stamps from the reading-progress store.
  const TD = window.TafiyaData;
  const { data: levelBooksRaw } = useApi(() => TafiyaBooks.getBooks({ levelId: n }), [n]);
  const statusOf = (b) => { const p = TD && TD.progressOf(b.code); return (p && p.completed) ? "complete" : (p && p.opened) ? "progress" : "notstarted"; };
  const rank = { complete: 0, progress: 1, notstarted: 2 };
  const books = (levelBooksRaw || []).slice().sort((a, b) => rank[statusOf(a)] - rank[statusOf(b)]);
  const N = books.length; // real number of books in this level
  const earnedByBook = {};
  books.forEach(b => { if (statusOf(b) === "complete") { const p = TD && TD.progressOf(b.code); earnedByBook[b.id] = (p && p.completedAt) ? new Date(p.completedAt).toISOString().slice(0, 10) : ""; } });

  // Briefly highlight a stamp the child just earned (set on arrival from a book completion).
  const [highlight, setHighlight] = useStateScreens(highlightBookId || null);
  useEffectScreens(() => {
    setHighlight(highlightBookId || null);
    if (highlightBookId) {
      const t = setTimeout(() => setHighlight(null), 3200);
      return () => clearTimeout(t);
    }
  }, [highlightBookId]);

  // Popover (mobile / no-hover): which stamp is open
  const [pop, setPop] = useStateScreens(null);
  const canHover = typeof window !== "undefined" && window.matchMedia
    ? window.matchMedia("(hover: hover)").matches : true;

  const completed = books.filter(b => statusOf(b) === "complete").length;
  const inProgress = books.filter(b => statusOf(b) === "progress").length;
  const state = N === 0 ? "locked" : (completed === N ? "complete" : "current");
  const bookStatus = (i) =>
    i < completed ? "complete" : i < completed + inProgress ? "progress" : "notstarted";
  const statusWord = (s) => s === "complete" ? "Complete" : s === "progress" ? "Reading" : "Not started";
  const strandNameOf = (b) => b ? ((STRANDS[b.strandUi] || {}).name || "") : "";
  const fmtDate = (d) => {
    if (!d) return "";
    const dt = new Date(d + "T00:00:00");
    return isNaN(dt) ? "" : dt.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  };

  const cols = 4;                                   // 4 columns per page
  const leftCount = Math.min(N, 24);                // LEFT page = a full 4×6 = 24 stamp slots
  const rightCount = Math.min(N - 24, 24);          // RIGHT page = the next 4×6 = up to 24 (48 books fills both pages)
  // NOTE: only real books are rendered — no empty/placeholder circles for books that don't exist.
  const earnedBonus = state === "complete" ? 4 : state === "current" ? 2 : 0;
  const statusLabel = state === "complete" ? "Complete" : state === "current" ? "In progress" : "Locked";
  const earned = state === "complete";

  const openBook = (book) => { if (book && onNavigate) onNavigate("reader", { bookId: book.id }); };

  const renderBook = (i) => {
    const s = bookStatus(i);
    const book = books[i] || null;
    const linkable = !!book && (s === "complete" || s === "progress");
    const tip = book
      ? book.title + "  ·  " + strandNameOf(book) + "  ·  L" + n
      : "Book " + (i + 1) + "  ·  " + statusWord(s);
    const onStampActivate = () => {
      if (!linkable) return;
      if (canHover) { openBook(book); return; }          // desktop: open the book directly
      setPop({ book, status: s, earnedAt: earnedByBook[book.id] }); // touch: show popover
    };
    const isNew = !!book && highlight != null && book.id === highlight;
    return (
      <span
        key={i}
        className={"ppspot bookstamp " + s + (linkable ? " is-link" : "") + (isNew ? " is-new" : "")}
        tabIndex={0}
        role={linkable ? "button" : undefined}
        data-tip={tip}
        onClick={onStampActivate}
        onKeyDown={(e) => { if (linkable && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); onStampActivate(); } }}
      >
        <StampBook status={s} />
      </span>
    );
  };

  return (
    <React.Fragment>
      {/* LEFT PAGE — level identity + book stamps (image files only, no circles) */}
      <div className="ppage ppage-left pplv-page pplv-left" style={{ "--lvl": level.color, "--cols": cols }}>
        <div className="pplv-serial">
          <span className="pplv-serial-num">{serial}</span>
          <span className="ppid2-flag" aria-hidden="true"></span>
        </div>
        <div className="pplv-head pplv-head-left">
          <div className="pplevel-headl">
            <span className="pplevel-band">{level.band} band</span>
            <span className="pplevel-title">Level {n}</span>
            <span className="pplevel-name">{level.name}</span>
            <span className="pplevel-meaning">{level.meaning}</span>
          </div>
          <div className="pplv-head-meta">
            <span className={"pplevel-status s-" + state}>{statusLabel}</span>
            <span className="pplv-count">{completed} of {N} books</span>
          </div>
        </div>
        <div className="pplv-books">
          {Array.from({ length: leftCount }, (_, i) => renderBook(i))}
        </div>
      </div>

      {/* RIGHT PAGE — overflow book stamps, with the Level stamp + bonus stamps fixed at the bottom */}
      <div className="ppage pplv-page pplv-right" style={{ "--lvl": level.color, "--cols": cols }}>
        <div className="pplv-books pplv-books-right">
          {Array.from({ length: rightCount }, (_, i) => renderBook(leftCount + i))}
        </div>
        <div className="pplv-rewards">
          <button
            type="button"
            className={"pplv-levelstamp is-link " + (earned ? "earned" : "locked")}
            data-tip={"Level " + n + " · " + level.name + " — see this level in the Library"}
            onClick={() => onNavigate && onNavigate("library", { levelId: n })}
            aria-label={"Level " + n + " progress"}
          >
            <img src={"assets/stamp-l" + n + ".png"} alt={"Level " + n + " stamp"} />
          </button>
          <div className="pplv-bonus-wrap">
            <div className="pplv-bonus-label">Bonus Rewards</div>
            <div className="pplv-bonus-row">
              {[1, 2, 3, 4].map((b) => {
                const got = b <= earnedBonus;
                return (
                  <span key={b} className={"ppspot bonus " + (got ? "earned" : "locked")} tabIndex={0} data-tip={"Bonus " + b + "  ·  " + (got ? "Earned" : "Not yet earned")}>
                    <StampBonus />
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Touch popover — compact book detail for a tapped stamp */}
      {pop && pop.book && (
        <div className="ppop-backdrop" onClick={() => setPop(null)}>
          <div className="ppop-card" onClick={(e) => e.stopPropagation()}>
            <button className="ppop-close" onClick={() => setPop(null)} aria-label="Close">&times;</button>
            <div className="ppop-meta">{strandNameOf(pop.book)} · Level {n}</div>
            <div className="ppop-title">{pop.book.title}</div>
            {pop.earnedAt && <div className="ppop-date">Earned {fmtDate(pop.earnedAt)}</div>}
            <button className="btn btn-forest ppop-open" onClick={() => { openBook(pop.book); setPop(null); }}>
              {pop.status === "complete" ? "Read Again" : "Open Book"}
            </button>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

/* ============================================================
   CHILD DASHBOARD (full screen)
   ============================================================ */

function ChildDashScreen({ onNavigate }) {
  // Child id comes from the signed-in session (parent viewing falls back to their child)
  const CHILD_ID = (window.HaarayaSession && HaarayaSession.childId()) || 1;
  // This dashboard belongs to the child being viewed, not the viewer
  const ME = "Demo Child";
  const { data: summary }         = useApi(() => HaarayaApi.getChildSummary(CHILD_ID), [CHILD_ID]);
  // Re-render whenever a book is read so passport figures stay in sync.
  const [readTick, setReadTick] = useStateScreens(0);
  useEffectScreens(() => {
    const on = () => setReadTick(t => t + 1);
    window.addEventListener("haaraya:reading", on);
    return () => window.removeEventListener("haaraya:reading", on);
  }, []);
  const { data: levelCounts }     = useApi(() => TafiyaBooks.levelCounts(), []);
  const { data: continueReading } = useApi(() => TafiyaBooks.getContinueReading(CHILD_ID, 4), [CHILD_ID, readTick]);
  const { data: readingPath }     = useApi(() => TafiyaBooks.getReadingPath(CHILD_ID, 4),     [CHILD_ID, readTick]);
  const { data: storyPractice }   = useApi(() => TafiyaBooks.getStoryPractice(CHILD_ID, 4),   [CHILD_ID]);
  const { data: exploreBooks }    = useApi(() => TafiyaBooks.getExploreLibrary(CHILD_ID, 4),  [CHILD_ID, readTick]);
  const { data: pathProgress }    = useApi(() => HaarayaApi.getReadingPathProgress(CHILD_ID),[CHILD_ID]);
  const { data: stamps }          = useApi(() => TafiyaBooks.getPassportStamps(CHILD_ID),     [CHILD_ID, readTick]);

  if (!summary) return null;

  const child           = summary.child;
  const continueBooks   = (continueReading || []).map(bookToCardProps);
  const pathBooks       = (readingPath     || []).map(bookToCardProps);
  const practiceBooks   = (storyPractice   || []).map(bookToCardProps);
  const exploreList     = (exploreBooks    || []).map(bookToCardProps);
  const recentStamps    = (stamps          || []).slice(-6).reverse();

  // Live passport figures — derived from real Tafiya reads (same source as the
  // Reading Passport screen), so they update the moment a book is finished.
  const _ignoreTick     = readTick;
  const completedByLvl  = window.TafiyaBooks ? TafiyaBooks.completedByLevel() : {};
  const stampsEarned    = window.TafiyaData ? TafiyaData.completedCodes().length : 0;
  const currentLevel    = (() => { const ls = Object.keys(completedByLvl).map(Number); return ls.length ? Math.max(...ls) : 1; })();
  const levelDone       = completedByLvl[currentLevel] || 0;
  const levelTotal      = (levelCounts && levelCounts[currentLevel]) || 0;
  const levelPct        = levelTotal ? Math.round((levelDone / levelTotal) * 100) : 0;
  const levelName       = (HaarayaSeed.levels.find(l => l.number === currentLevel) || {}).name || "";

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="wrap" style={{ padding: "40px 32px 80px", maxWidth: 1380 }}>
        <div className="dash" style={{ minHeight: 720 }}>
          <aside className="dash-sidebar">
            <div className="dash-brand">
              <img src="assets/logo-haaraya-literacy.png" alt="Haaraya Literacy" />
              
            </div>
            <nav className="dash-nav">
              <a className="active"><span className="nav-icon" /> Continue Reading</a>
              <a onClick={() => onNavigate("passport")}><span className="nav-icon" /> Reading Passport</a>
              <a><span className="nav-icon" /> My Reading Path</a>
              <a><span className="nav-icon" /> Story Practice</a>
              <a onClick={() => onNavigate("library")}><span className="nav-icon" /> Explore for Fun</a>
            </nav>
            <div style={{ marginTop: "auto", paddingTop: 24, borderTop: "1px solid rgba(255,255,255,.1)" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "rgba(255,255,255,.06)",
                padding: 10, borderRadius: 10,
              }}>
                <Avatar name={ME} color={child.avatarColor} size={36} border={false} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{ME}</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>Level {child.currentLevelId}</div>
                </div>
              </div>
            </div>
          </aside>
          <div className="dash-main">
            <div className="dash-child-hero">
              <Avatar name={ME} color={child.avatarColor} size={88} />
              <div className="greet">
                <h4>Hi there, <span style={{ fontFamily: '"Andika", system-ui, sans-serif' }}>{ME}</span>!</h4>
                <div className="level">Level {currentLevel} · {levelName}</div>
                <div className="sub" style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600, marginTop: 4 }}>
                  {levelDone} {levelDone === 1 ? "book" : "books"} completed
                </div>
              </div>
              <div className="stat">
                <div className="num">{stampsEarned}</div>
                <div className="lbl">Stamps earned</div>
              </div>
            </div>

            <SkillCheckPanel defaultChildId={CHILD_ID} />

            <div className="dash-twocol cols-2-1" style={{ gap: 20 }}>
              <div className="dash-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                  <h5>Continue Reading</h5>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Pick up where you left off
                  </span>
                </div>
                <div className="dash-mini-books cols-4">
                  {continueBooks.map(b => <Book key={b.id} book={b} onClick={() => onNavigate("reader", { bookCode: b.id })} />)}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 28, marginBottom: 14 }}>
                  <h5>My Reading Path</h5>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--hafwas)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {pathProgress ? `${pathProgress.completed} / ${pathProgress.total} this level · ${pathProgress.pct}%` : ""}
                  </span>
                </div>
                <div className="dash-mini-books cols-4">
                  {pathBooks.map(b => <Book key={b.id} book={b} onClick={() => onNavigate("reader", { bookCode: b.id })} />)}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 28, marginBottom: 14 }}>
                  <h5>Story Practice</h5>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--forest)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Tafiya at your level
                  </span>
                </div>
                <div className="dash-mini-books cols-4">
                  {practiceBooks.map(b => <Book key={b.id} book={b} onClick={() => onNavigate("reader", { bookCode: b.id })} />)}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 28, marginBottom: 14 }}>
                  <h5>Explore for Fun</h5>
                  <button className="btn btn-ghost-dark btn-sm" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => onNavigate("library")}>Open library</button>
                </div>
                <div className="dash-mini-books cols-4">
                  {exploreList.map(b => <Book key={b.id} book={b} onClick={() => onNavigate("reader", { bookCode: b.id })} />)}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="dash-card" style={{ background: "linear-gradient(135deg, var(--forest), var(--forest-dark))", color: "white", borderColor: "var(--forest)", cursor: "pointer" }}
                  onClick={() => onNavigate("passport")}>
                  <h5 style={{ color: "var(--yellow)" }}>Your passport</h5>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                    <img
                      src="assets/passport-cover-green.png"
                      alt="Your Reading Passport"
                      style={{
                        width: 76, height: "auto", flexShrink: 0,
                        borderRadius: "3px 7px 7px 3px",
                        boxShadow: "0 8px 20px rgba(0,0,0,.4), inset 5px 0 0 rgba(0,0,0,.18)",
                        transform: "rotate(-3deg)",
                        display: "block",
                      }}
                    />
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 32, lineHeight: 1, color: "white" }}>{stampsEarned}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>stamps</div>
                      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, marginTop: 8, color: "white" }}>L{currentLevel}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>current level</div>
                    </div>
                  </div>
                  <div style={{ height: 8, background: "rgba(255,255,255,.15)", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ width: `${levelPct}%`, height: "100%", background: "linear-gradient(90deg, var(--yellow), var(--green-mid))" }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, marginTop: 8, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Tap to open your passport →
                  </div>
                </div>

                <div className="dash-card">
                  <h5>Recent stamps</h5>
                  <div className="dash-passport-mini" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                    {recentStamps.map((st, i) => {
                      const uiKey = st.strandUi || "tafiya";
                      return <Stamp key={st.code || st.bookId || i} strand={uiKey} title={st.title} rotate={(i % 7) - 3} />;
                    })}
                    {recentStamps.length === 0 && <Stamp strand="locked" title="?" rotate={2} locked />}
                  </div>
                </div>

                <div className="dash-card">
                  <h5>Today's prompt</h5>
                  <div style={{
                    background: "var(--yellow)",
                    color: "var(--ink)",
                    padding: "14px 16px",
                    borderRadius: 12,
                    fontWeight: 800,
                  }}>
                    Your passport is waiting.
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4, opacity: 0.75 }}>
                      Read one book today. Earn a new stamp.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ============================================================
   LIBRARY
   ============================================================ */

/* ------------------------------------------------------------------
   The Library and Reader screens now live in tafiya-reader.jsx, which
   renders the real Tafiya catalogue + book reader (loaded after this
   file, so its LibraryScreen / ReaderScreen override the app globals).
   ------------------------------------------------------------------ */

/* ============================================================
   PARENT DASHBOARD (full screen)
   ============================================================ */

function ParentDashScreen({ onNavigate }) {
  const PARENT_ID = (window.HaarayaSession && HaarayaSession.userId()) || 1;
  const { data: parent }   = useApi(() => HaarayaApi.getCurrentParent(), [PARENT_ID]);
  const { data: children } = useApi(() => HaarayaApi.getChildrenForParent(PARENT_ID), [PARENT_ID]);
  const { data: sub }      = useApi(() => HaarayaApi.getSubscriptionForParent(PARENT_ID), [PARENT_ID]);
  const { data: summaries }= useApi(async () => {
    const kids = await HaarayaApi.getChildrenForParent(PARENT_ID);
    return Promise.all(kids.map(c => HaarayaApi.getChildSummary(c.id)));
  }, [PARENT_ID]);

  // The real (single-reader) Tafiya store belongs to the active demo reader.
  const READER_ID = (window.HaarayaSession && HaarayaSession.childId()) || 1;
  const [readTick, setReadTick] = useStateScreens(0);
  useEffectScreens(() => {
    const on = () => setReadTick(t => t + 1);
    window.addEventListener("haaraya:reading", on);
    return () => window.removeEventListener("haaraya:reading", on);
  }, []);
  const { data: levelCounts }  = useApi(() => TafiyaBooks.levelCounts(), []);
  const { data: readerStamps } = useApi(() => TafiyaBooks.getPassportStamps(READER_ID), [READER_ID, readTick]);

  if (!children || !summaries) return null;

  // Live family figures derived from real reads (no mock totals).
  const _ignoreTick    = readTick;
  const completedByLvl = window.TafiyaBooks ? TafiyaBooks.completedByLevel() : {};
  const realStamps     = window.TafiyaData ? TafiyaData.completedCodes().length : 0;
  const realLevel      = (() => { const ls = Object.keys(completedByLvl).map(Number); return ls.length ? Math.max(...ls) : 1; })();
  const realLevelName  = (HaarayaSeed.levels.find(l => l.number === realLevel) || {}).name || "";
  // Each child reflects real progress if they're the active reader, else a fresh start.
  const figuresFor = (id) => {
    if (id === READER_ID) {
      const done = completedByLvl[realLevel] || 0;
      const total = (levelCounts && levelCounts[realLevel]) || 0;
      return { level: realLevel, done, total, pct: total ? Math.round(done / total * 100) : 0, books: realStamps };
    }
    return { level: 1, done: 0, total: (levelCounts && levelCounts[1]) || 0, pct: 0, books: 0 };
  };
  const recentStamps = (readerStamps || []).slice(-6).reverse();
  const readerName   = (children.find(c => c.id === READER_ID) || {}).shortName || "Your reader";
  const totalBooks   = children.reduce((a, c) => a + figuresFor(c.id).books, 0);
  const totalStamps  = realStamps;

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="wrap" style={{ padding: "40px 32px 80px", maxWidth: 1380 }}>
        <div className="dash" style={{ minHeight: 720 }}>
          <aside className="dash-sidebar">
            <div className="dash-brand">
              <img src="assets/logo-haaraya-literacy.png" alt="Haaraya Literacy" />
              
            </div>
            <nav className="dash-nav">
              <a className="active"><span className="nav-icon" /> Children</a>
              <a><span className="nav-icon" /> Reading plan</a>
              <a><span className="nav-icon" /> Subscription</a>
              <a><span className="nav-icon" /> Reports</a>
              <a><span className="nav-icon" /> Settings</a>
            </nav>
          </aside>

          <div className="dash-main">
            <div className="dash-header">
              <div>
                <h3>Welcome back, <span style={{ fontFamily: '"Andika", system-ui, sans-serif' }}>{(window.HaarayaSession && HaarayaSession.get().displayName) || "Demo Parent"}</span>.</h3>
                <div className="sub">{children.length} children · {sub ? sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1) : "Family"} plan · Renews {sub ? new Date(sub.renewsOn).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</div>
              </div>
              <button className="btn btn-ghost-dark btn-sm">+ Add child</button>
            </div>

            <div className="kpis">
              <div className="kpi"><div className="lbl">Books read</div><div className="num">{totalBooks}</div><div className="delta">All-time across {children.length} {children.length === 1 ? "child" : "children"}</div></div>
              <div className="kpi"><div className="lbl">Stamps earned</div><div className="num">{totalStamps}</div><div className="delta">One stamp per book finished</div></div>
              <div className="kpi"><div className="lbl">Readers</div><div className="num">{children.length}</div><div className="delta">On your family plan</div></div>
              <div className="kpi"><div className="lbl">Furthest level</div><div className="num">L{realLevel}</div><div className="delta">{realLevelName || "—"}</div></div>
            </div>

            <h5 style={{ fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-soft)", margin: "8px 0 16px" }}>
              Your readers
            </h5>

            <div className="child-rows">
              {summaries.map(s => {
                const c = s.child;
                const f = figuresFor(c.id);
                return (
                  <div className="child-row" key={c.id} onClick={() => onNavigate("child")} style={{ cursor: "pointer" }}>
                    <Avatar name={c.shortName} color={c.avatarColor} size={48} />
                    <div>
                      <div className="name">{c.shortName}</div>
                      <div className="meta">{f.done} / {f.total} books · {c.readingMode === "automatic" ? "Auto reading plan" : "Manual: parent picks"}</div>
                    </div>
                    <div className="prog">
                      <div className="lbl">Level progress</div>
                      <div className="bar"><span style={{ width: `${f.pct}%` }} /></div>
                    </div>
                    <div className="lvl-pill">Level {f.level}</div>
                  </div>
                );
              })}
            </div>

            <div className="dash-twocol cols-1-1" style={{ marginTop: 28 }}>
              <div className="dash-card">
                <h5>Recent reading activity</h5>
                {recentStamps.length ? (
                  <div>
                    {recentStamps.map((st, i) => (
                      <div key={st.code || st.bookId || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < recentStamps.length - 1 ? "1px dashed var(--sand-dk)" : "none" }}>
                        <span style={{ width: 34, height: 34, borderRadius: 8, background: "var(--green-light)", color: "var(--forest)", display: "grid", placeItems: "center", fontFamily: "var(--font-display)", fontSize: 16, flexShrink: 0 }}>✓</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: 14, color: "var(--ink)" }}>{st.title}</div>
                          <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: 700 }}>
                            {readerName} · Level {st.levelId}{st.earnedAt ? " · " + new Date(st.earnedAt + "T00:00:00").toLocaleDateString(undefined, { day: "numeric", month: "short" }) : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600, padding: "20px 0" }}>
                    No reading activity yet — open a book together to get started.
                  </div>
                )}
              </div>
              <div className="dash-card">
                <h5>Recently earned</h5>
                <div className="dash-passport-mini" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {recentStamps.map((st, i) => (
                    <Stamp key={st.code || st.bookId || i} strand={st.strandUi || "tafiya"} title={st.title} rotate={(i % 7) - 3} />
                  ))}
                  {recentStamps.length === 0 && <Stamp strand="locked" title="?" rotate={2} locked />}
                </div>
                <div style={{ marginTop: 16, fontSize: 13, color: "var(--ink-mid)" }}>
                  {realStamps > 0
                    ? `${readerName} has earned ${realStamps} ${realStamps === 1 ? "stamp" : "stamps"} so far. Read together to add more.`
                    : "No stamps yet — finish a book together to earn the first one."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

Object.assign(window, {
  PassportScreen, ChildDashScreen, ParentDashScreen,
});
