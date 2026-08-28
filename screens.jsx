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
  // Single live path: the passport belongs to the signed-in parent's first child
  // (children have no separate login).
  const { data: kids } = useApi(() => HaarayaPlatformDB.getChildrenForParent(), []);
  const CHILD_ID = (kids && kids[0] && kids[0].id) || null;
  const ME = (kids && kids[0] && kids[0].shortName) || "Reader";
  const { data: summary } = useApi(
    () => CHILD_ID ? HaarayaPlatformDB.getChildSummary(CHILD_ID) : Promise.resolve(null),
    [CHILD_ID]
  );
  const { data: levelCounts } = useApi(() => TafiyaBooks.levelCounts(), []);
  const [readTick, setReadTick] = useStateScreens(0);
  const [shareMsg, setShareMsg] = useStateScreens("");
  // Share the passport: the native share sheet where there is one (phones),
  // otherwise copy the link. There is no public passport URL yet, so this
  // shares the passport screen itself — a parent opening it signs in first.
  const sharePassport = async () => {
    const url = window.location.href.split("#")[0] + "#passport";
    const title = ME === "Reader" ? "Haaraya Reading Passport" : `${ME}'s Haaraya Reading Passport`;
    try {
      if (navigator.share) {
        await navigator.share({ title: title, text: title, url: url });
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link copied");
        setTimeout(() => setShareMsg(""), 1800);
        return;
      }
      setShareMsg("Copy from the address bar");
      setTimeout(() => setShareMsg(""), 2400);
    } catch (e) {
      // A dismissed share sheet lands here too — say nothing.
    }
  };
  useEffectScreens(() => {
    const on = () => setReadTick(t => t + 1);
    window.addEventListener("haaraya:reading", on);
    return () => window.removeEventListener("haaraya:reading", on);
  }, []);
  // Earned stamps come live from Supabase.
  const { data: realStamps } = useApi(() => CHILD_ID ? HaarayaPlatformDB.getPassportStamps(CHILD_ID) : Promise.resolve(null), [CHILD_ID, readTick]);
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

  // Signed out (or no reader on the account yet) → invite instead of a blank page.
  if (!summary) return (
    <main className="nd-page" data-screen-label="Reading Passport">
      <div className="nd" style={{ display: "grid", placeItems: "center", minHeight: "60vh", textAlign: "center" }}>
        <div style={{ maxWidth: 460, display: "grid", gap: 14, justifyItems: "center" }}>
          <img src="assets/green-passport.png" alt="" style={{ width: 116, height: "auto", opacity: 0.95 }} />
          <h2 style={{ fontFamily: "var(--font-display)", margin: 0 }}>Your Reading Passport</h2>
          <p style={{ margin: 0, color: "var(--ink-soft, #5c6157)", lineHeight: 1.6 }}>
            Sign in to see your reader's stamps, levels and journey so far.
          </p>
          <button className="ppx-btn ppx-btn-solid" onClick={() => onNavigate("home")}>Back to home</button>
        </div>
      </div>
    </main>
  );
  const child = summary.child;
  // Completed-book codes + level from the child's live Supabase record.
  const completedSet = new Map((realStamps || []).filter(s => s.code).map(s => [s.code, s.earnedAt || ""]));
  const cur = (child && child.currentLevelId) || 1;
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
  const completedByLvl = (realStamps || []).reduce((m, s) => { if (s.levelId) m[s.levelId] = (m[s.levelId] || 0) + 1; return m; }, {});
  const stampsEarned = summary.stampsEarned || (realStamps || []).length;
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
              <button className="ppx-btn ppx-btn-solid" onClick={sharePassport}>{shareMsg || "Share passport"}</button>
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
            <PassportSpread idx={idx} child={child} name={ME} summary={summary} cur={cur} levelCounts={levelCounts} started={started} onNavigate={onNavigate} childId={CHILD_ID} highlightBookId={highlightBookId} completedSet={completedSet} />
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

function PassportSpread({ idx, child, name, summary, cur, levelCounts, started, onNavigate, childId, highlightBookId, completedSet }) {
  const curName = (PASSPORT_LEVELS.find(l => l.n === cur) || {}).name || "";

  if (idx === 0) {
    return (
      <div className="ppage ppage-cover">
        <PassportCover color={child.passportColor} name={child.displayName} />
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
  return <LevelSpread level={lv} cur={cur} total={lv.total} completedThisLevel={summary.currentLevelCompleted} onNavigate={onNavigate} childId={childId} highlightBookId={highlightBookId} completedSet={completedSet} />;
}

function LevelSpread({ level, cur, completedThisLevel, onNavigate, childId, highlightBookId, completedSet }) {
  const n = level.n;
  const serial = "HL" + String(72467 + (childId || 1)).padStart(8, "0"); // passport serial, shown top-left

  // Real Tafiya books at this level + earned stamps from the reading-progress store.
  const TD = window.TafiyaData;
  const { data: levelBooksRaw } = useApi(() => TafiyaBooks.getBooks({ levelId: n }), [n]);
  const statusOf = (b) => (completedSet && completedSet.has(b.code)) ? "complete" : "notstarted";
  const rank = { complete: 0, progress: 1, notstarted: 2 };
  const books = (levelBooksRaw || []).slice().sort((a, b) => rank[statusOf(a)] - rank[statusOf(b)]);
  const N = books.length; // real number of books in this level
  const earnedByBook = {};
  books.forEach(b => { if (statusOf(b) === "complete") { earnedByBook[b.id] = (completedSet && completedSet.get(b.code)) || ""; } });

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
  // Single live path: the reader is the signed-in parent's first child (children
  // have no separate login).
  const { data: kids } = useApi(() => HaarayaPlatformDB.getChildrenForParent(), []);
  const CHILD_ID = (kids && kids[0] && kids[0].id) || null;
  const ME = (kids && kids[0] && kids[0].shortName) || "Reader";
  const { data: summary }         = useApi(
    () => CHILD_ID ? HaarayaPlatformDB.getChildSummary(CHILD_ID) : Promise.resolve(null),
    [CHILD_ID]
  );
  // Re-render whenever a book is read so passport figures stay in sync.
  const [readTick, setReadTick] = useStateScreens(0);
  useEffectScreens(() => {
    const on = () => setReadTick(t => t + 1);
    window.addEventListener("haaraya:reading", on);
    return () => window.removeEventListener("haaraya:reading", on);
  }, []);
  const { data: levelCounts }     = useApi(() => TafiyaBooks.levelCounts(), []);
  const { data: continueReading } = useApi(() => CHILD_ID ? TafiyaBooks.getContinueReading(CHILD_ID, 4) : Promise.resolve([]), [CHILD_ID, readTick]);
  const { data: readingPath }     = useApi(() => CHILD_ID ? TafiyaBooks.getReadingPath(CHILD_ID, 4)     : Promise.resolve([]), [CHILD_ID, readTick]);
  const { data: storyPractice }   = useApi(() => CHILD_ID ? TafiyaBooks.getStoryPractice(CHILD_ID, 4)   : Promise.resolve([]), [CHILD_ID]);
  const { data: exploreBooks }    = useApi(() => CHILD_ID ? TafiyaBooks.getExploreLibrary(CHILD_ID, 4)  : Promise.resolve([]), [CHILD_ID, readTick]);
  const { data: pathProgress }    = useApi(
    () => CHILD_ID ? HaarayaPlatformDB.getReadingPathProgress(CHILD_ID) : Promise.resolve(null),
    [CHILD_ID]
  );
  const { data: stampsList }      = useApi(() => CHILD_ID ? HaarayaPlatformDB.getPassportStamps(CHILD_ID) : Promise.resolve(null), [CHILD_ID, readTick]);

  if (!summary) return null;

  const child           = summary.child;
  const continueBooks   = (continueReading || []).map(bookToCardProps);
  const pathBooks       = (readingPath     || []).map(bookToCardProps);
  const practiceBooks   = (storyPractice   || []).map(bookToCardProps);
  const exploreList     = (exploreBooks    || []).map(bookToCardProps);
  const recentStamps    = (stampsList || []).slice(-6).reverse();

  // Live passport figures, straight from the child's Supabase summary.
  const _ignoreTick     = readTick;
  const stampsEarned    = summary.stampsEarned || 0;
  const currentLevel    = child.currentLevelId || 1;
  const levelDone       = summary.currentLevelCompleted || 0;
  const levelTotal      = summary.currentLevelTotal || (levelCounts && levelCounts[currentLevel]) || 0;
  const levelPct        = levelTotal ? Math.round((levelDone / levelTotal) * 100) : 0;
  const levelName       = (HaarayaSeed.levels.find(l => l.number === currentLevel) || {}).name || "";

  const feat = continueBooks[0] || pathBooks[0] || null;
  const firstName = (ME || "").split(" ")[0] || ME;
  const pw = (levelPct || 0) + "%";
  const toGo = Math.max(0, (levelTotal || 0) - (levelDone || 0));

  return (
    <main className="nd-page" data-screen-label="Child Dashboard">
      <div className="nd">

        <div className="nd-top">
          <div className="nd-word"><img src="assets/odyssey-seal.png" alt="Haaraya" /> Haaraya</div>
          <nav className="nd-nav">
            <a onClick={() => onNavigate("home")}>Home</a>
            <a className="on">My Books</a>
            <a onClick={() => onNavigate("passport")}>Reading Passport</a>
            <a onClick={() => onNavigate("library")}>Library</a>
          </nav>
          <div className="nd-chip">
            <Avatar name={ME} color={child.avatarColor} size={40} />
            <div className="who">
              <div className="n">{firstName}</div>
              <div className="l">{"Level " + currentLevel + " \u00b7 " + levelName}</div>
            </div>
          </div>
        </div>

        <div className="nd-grid">
          <div className="nd-col">

            <div className="nd-welcome">
              <svg className="trail" viewBox="0 0 300 300" aria-hidden="true">
                <path d="M60 280 C120 220 40 180 120 130 C180 96 110 60 180 20" />
                <circle cx="180" cy="20" r="7" />
                <circle cx="60" cy="280" r="7" />
              </svg>
              <div className="eye">Good to see you</div>
              <h1>{"Ready to keep your journey going, " + firstName + "?"}</h1>
              <p>{"You've earned " + stampsEarned + " " + (stampsEarned === 1 ? "stamp" : "stamps") + " so far. Keep reading to reach the next stop on your trail."}</p>
            </div>

            {feat && (
              <div className="nd-continue">
                <div className={"cov" + (feat.thumb ? " cov--img" : "")}>
                  {feat.thumb && window.TafiyaData
                    ? <img src={window.TafiyaData.assetUrl(feat.thumb)} alt="" onError={(e) => { const p = e.currentTarget.closest(".cov"); if (p) { p.classList.remove("cov--img"); p.textContent = feat.title; } }} />
                    : feat.title}
                </div>
                <div className="body">
                  <div className="tag">Continue reading</div>
                  <h3>{feat.title}</h3>
                  <div className="meta">{"Level " + (feat.level || currentLevel) + " \u00b7 " + ((STRANDS[feat.strand] && STRANDS[feat.strand].name) || "Story")}</div>
                  <div className="pbar"><span style={{ width: pw }} /></div>
                  <div className="pct">{levelDone + " of " + levelTotal + " books this level \u00b7 " + levelPct + "%"}</div>
                </div>
                <button className="nd-btn" onClick={() => onNavigate("reader", { bookCode: feat.id })}>Keep reading →</button>
              </div>
            )}

            <div className="nd-panel">
              <div className="nd-phead"><h4>Keep reading</h4><span className="side" onClick={() => onNavigate("library")}>See all</span></div>
              <div className="nd-rail">
                {continueBooks.map(b => <Book key={b.id} book={b} onClick={() => onNavigate("reader", { bookCode: b.id })} />)}
              </div>
            </div>

            <div className="nd-panel">
              <div className="nd-phead"><h4>My reading path</h4><span className="side">{pathProgress ? (pathProgress.completed + " / " + pathProgress.total + " \u00b7 " + pathProgress.pct + "%") : ""}</span></div>
              <div className="nd-rail">
                {pathBooks.map(b => <Book key={b.id} book={b} onClick={() => onNavigate("reader", { bookCode: b.id })} />)}
              </div>
            </div>

            <div className="nd-panel">
              <div className="nd-phead"><h4>Story practice</h4><span className="side">Tafiya at your level</span></div>
              <div className="nd-rail">
                {practiceBooks.map(b => <Book key={b.id} book={b} onClick={() => onNavigate("reader", { bookCode: b.id })} />)}
              </div>
            </div>

            <div className="nd-panel">
              <div className="nd-phead"><h4>Explore for fun</h4><span className="side" onClick={() => onNavigate("library")}>Open library</span></div>
              <div className="nd-rail">
                {exploreList.map(b => <Book key={b.id} book={b} onClick={() => onNavigate("reader", { bookCode: b.id })} />)}
              </div>
            </div>

            <SkillCheckPanel defaultChildId={CHILD_ID} />

          </div>

          <div className="nd-col">
            <div className="nd-medal" onClick={() => onNavigate("passport")} style={{ cursor: "pointer" }}>
              <div className="nd-disc"><div className="in"><div className="n">{stampsEarned}</div><div className="u">Stamps</div></div></div>
              <div className="cap">{firstName + "'s collection"}</div>
              <div className="sub">{"Level " + currentLevel + " \u00b7 " + levelName + " Reader"}</div>
            </div>

            <div className="nd-panel nd-mile">
              <div className="lbl">Next milestone</div>
              <h4>{toGo > 0 ? ("Finish " + toGo + " more " + (toGo === 1 ? "book" : "books") + " to reach Level " + (currentLevel + 1)) : "You've finished this level \u2014 on to the next!"}</h4>
              <div className="pbar"><span style={{ width: pw }} /></div>
              <div className="row"><span>{levelDone + " of " + levelTotal + " books"}</span><span>{levelPct + "%"}</span></div>
            </div>

            <div className="nd-panel">
              <div className="nd-phead" style={{ marginBottom: 14 }}><h4>Recent stamps</h4></div>
              <div className="nd-stamps">
                {recentStamps.map((st, i) => {
                  const uiKey = st.strandUi || "tafiya";
                  return <Stamp key={st.code || st.bookId || i} strand={uiKey} title={st.title} rotate={(i % 7) - 3} />;
                })}
                {recentStamps.length === 0 && <Stamp strand="locked" title="?" rotate={2} locked />}
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

/* Add-a-child form. Writes through HaarayaEnrol.addChild (which checks the
   plan's child allowance), then calls onDone() to refetch the dashboard.
   Any DB error is shown verbatim — a silent failure here is how the signup
   children went missing in the first place. */
function AddChildModal({ onClose, onDone }) {
  const [first, setFirst]     = useStateScreens("");
  const [last, setLast]       = useStateScreens("");
  const [passport, setPass]   = useStateScreens("");
  const [year, setYear]       = useStateScreens("");
  const [level, setLevel]     = useStateScreens(1);
  const [mode, setMode]       = useStateScreens("automatic");
  const [busy, setBusy]       = useStateScreens(false);
  const [msg, setMsg]         = useStateScreens("");

  const levels = (window.HaarayaSeed && HaarayaSeed.levels) || [];
  const thisYear = new Date().getFullYear();

  const submit = async () => {
    if (!first.trim()) { setMsg("A first name is needed."); return; }
    if (!window.HaarayaEnrol || !window.HaarayaEnrol.addChild) {
      setMsg("Enrolment layer not loaded — check enrolment.js is on the page."); return;
    }
    setBusy(true); setMsg("");
    const res = await window.HaarayaEnrol.addChild({
      firstName: first, lastName: last, passportName: passport,
      year: year, currentLevelId: Number(level) || 1, readingMode: mode,
    });
    setBusy(false);
    if (res && res.ok) {
      onDone && onDone();
      onClose && onClose();
      return;
    }
    setMsg((res && (res.detail || res.reason)) || "Could not add this child.");
  };

  return (
    <div className="assign-ov" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
      <div className="assign-modal addkid-modal" role="dialog" aria-modal="true" aria-label="Add a child">
        <div className="assign-head">
          <div>
            <h4>Add a child</h4>
            <div className="sub">They'll get their own passport and reading level.</div>
          </div>
          <button className="assign-x" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <div className="assign-body addkid-body">
          <div className="addkid-row">
            <div className="assign-col">
              <div className="assign-lbl">First name</div>
              <input className="assign-search" value={first} onChange={(e) => setFirst(e.target.value)} placeholder="Amara" autoFocus />
            </div>
            <div className="assign-col">
              <div className="assign-lbl">Last name <span className="opt">optional</span></div>
              <input className="assign-search" value={last} onChange={(e) => setLast(e.target.value)} placeholder="Alerege" />
            </div>
          </div>
          <div className="addkid-row">
            <div className="assign-col">
              <div className="assign-lbl">Passport name <span className="opt">optional</span></div>
              <input className="assign-search" value={passport} onChange={(e) => setPass(e.target.value)} placeholder="What the passport should say" />
            </div>
            <div className="assign-col">
              <div className="assign-lbl">Year of birth <span className="opt">optional</span></div>
              <input className="assign-search" value={year} onChange={(e) => setYear(e.target.value)} placeholder={String(thisYear - 8)} inputMode="numeric" />
            </div>
          </div>
          <div className="addkid-row">
            <div className="assign-col">
              <div className="assign-lbl">Starting level</div>
              <select className="assign-search" value={level} onChange={(e) => setLevel(e.target.value)}>
                {(levels.length ? levels : [{ number: 1, name: "Level 1" }]).map(l => (
                  <option key={l.number} value={l.number}>L{l.number} &middot; {l.name}</option>
                ))}
              </select>
            </div>
            <div className="assign-col">
              <div className="assign-lbl">Book choice</div>
              <div className="assign-seg">
                <button className={mode === "automatic" ? "on" : ""} onClick={() => setMode("automatic")}>We choose</button>
                <button className={mode === "choose" ? "on" : ""} onClick={() => setMode("choose")}>They choose</button>
              </div>
            </div>
          </div>
        </div>
        <div className="assign-foot">
          <div className="assign-picked">{first.trim() ? <span>Adding <strong>{passport.trim() || first.trim()}</strong></span> : "Fill in a first name to continue."}</div>
          <button className="btn btn-ghost-dark btn-sm" onClick={onClose} disabled={busy}>Cancel</button>
          <button className="btn btn-forest btn-sm" onClick={submit} disabled={busy || !first.trim()}>{busy ? "Adding…" : "Add child"}</button>
          {msg && <div className="assign-msg">{msg}</div>}
        </div>
      </div>
    </div>
  );
}

function ParentDashScreen({ onNavigate }) {
  const Api = HaarayaPlatformDB;
  const [kidTick, setKidTick] = useStateScreens(0);
  const [addOpen, setAddOpen] = useStateScreens(false);
  const { data: parent }   = useApi(() => Api.getCurrentParent(), []);
  const { data: children } = useApi(() => Api.getChildrenForParent(), [kidTick]);
  const { data: sub }      = useApi(() => Api.getSubscriptionForParent(), [kidTick]);
  const { data: summaries }= useApi(async () => {
    const kids = await Api.getChildrenForParent();
    return Promise.all(kids.map(c => Api.getChildSummary(c.id)));
  }, [kidTick]);

  const [readTick, setReadTick] = useStateScreens(0);
  useEffectScreens(() => {
    const on = () => setReadTick(t => t + 1);
    window.addEventListener("haaraya:reading", on);
    return () => window.removeEventListener("haaraya:reading", on);
  }, []);
  const { data: levelCounts }  = useApi(() => TafiyaBooks.levelCounts(), []);
  // The “active reader” is the family's first child; stamps come live from Supabase.
  const readerId = (children && children[0] && children[0].id) || null;
  const { data: readerStamps } = useApi(
    () => readerId ? Api.getPassportStamps(readerId) : Promise.resolve([]),
    [readerId, readTick]
  );

  if (!children || !summaries) return null;

  // Live family figures, from the per-child Supabase summaries.
  const _ignoreTick    = readTick;
  const summaryById    = {};
  (summaries || []).forEach(s => { if (s && s.child) summaryById[s.child.id] = s; });
  const realStamps     = (summaries || []).reduce((a, s) => a + (s ? s.stampsEarned : 0), 0);
  const realLevel      = (children || []).reduce((m, c) => Math.max(m, c.currentLevelId || 1), 1);
  const realLevelName  = (HaarayaSeed.levels.find(l => l.number === realLevel) || {}).name || "";
  const figuresFor = (id) => {
    const s = summaryById[id];
    if (!s) return { level: 1, done: 0, total: (levelCounts && levelCounts[1]) || 0, pct: 0, books: 0 };
    return { level: s.child.currentLevelId, done: s.currentLevelCompleted, total: s.currentLevelTotal, pct: s.currentLevelPct, books: s.booksCompleted };
  };
  const recentStamps = (readerStamps || []).slice(-6).reverse();

  // Plan / trial wording. Every field can legitimately be missing (a trial has
  // no renewal date), so each label degrades on its own rather than printing
  // "Invalid Date".
  const fmtDay = (v) => {
    if (!v) return "";
    const d = new Date(v);
    return isNaN(d) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };
  const planRaw = (sub && sub.plan) || "family";
  const planLabel = planRaw.charAt(0).toUpperCase() + planRaw.slice(1) + " plan";
  const renewsDay = fmtDay(sub && sub.renewsOn);
  const renewsLabel = renewsDay ? " \u00b7 Renews " + renewsDay : "";
  const trialEndLabel = fmtDay(sub && sub.trialEndsAt);
  const trialLeft = (sub && sub.status === "trial" && sub.trialEndsAt)
    ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;
  const allowance = (sub && sub.maxChildren) || 0;
  const readerName   = (children.find(c => c.id === readerId) || children[0] || {}).shortName || "Your reader";
  const totalBooks   = (summaries || []).reduce((a, s) => a + (s ? s.booksCompleted : 0), 0);
  const totalStamps  = realStamps;

  return (
    <main className="nd-page role-adult" data-screen-label="Parent Dashboard">
      <div className="nd">
        <div className="nd-top">
          <div className="nd-word"><img src="assets/odyssey-seal.png" alt="Haaraya" /> Haaraya</div>
          <nav className="nd-nav">
            <a onClick={() => onNavigate("home")}>Home</a>
            <a className="on">Children</a>
            <a className="nd-soon" title="Not built yet">Reading plan</a>
            <a className="nd-soon" title="Not built yet">Subscription</a>
            <a className="nd-soon" title="Not built yet">Reports</a>
            <a onClick={() => onNavigate("library")}>Library</a>
          </nav>
          <div className="nd-chip">
            <Avatar name={(window.HaarayaSession && HaarayaSession.get().displayName) || "Demo Parent"} color={(window.HaarayaSession && HaarayaSession.get().color) || "#516155"} size={40} />
            <div className="who">
              <div className="n">{(window.HaarayaSession && HaarayaSession.get().displayName) || "Demo Parent"}</div>
              <div className="l">Parent account</div>
            </div>
          </div>
        </div>
        <div className="dash role-adult" style={{ display: "block", background: "transparent", border: "none", boxShadow: "none", padding: 0, minHeight: 0 }}>
          <div className="dash-main" style={{ padding: 0 }}>
            <div className="dash-header">
              <div>
                <h3>Welcome back, <span style={{ fontFamily: '"Andika", system-ui, sans-serif' }}>{(window.HaarayaSession && HaarayaSession.get().displayName) || "Demo Parent"}</span>.</h3>
                <div className="sub">{children.length} {children.length === 1 ? "child" : "children"} &middot; {planLabel}{renewsLabel}</div>
              </div>
              <button className="btn btn-ghost-dark btn-sm" onClick={() => setAddOpen(true)}>+ Add child</button>
            </div>

            {sub && sub.status === "trial" && (
              <div className={"plan-strip" + (trialLeft !== null && trialLeft <= 3 ? " urgent" : "")}>
                <div className="plan-strip-main">
                  <div className="plan-strip-t">
                    {trialLeft === null ? "You're on a free trial."
                      : trialLeft > 1 ? `${trialLeft} days left in your free trial.`
                      : trialLeft === 1 ? "Last day of your free trial."
                      : "Your free trial has ended."}
                  </div>
                  <div className="plan-strip-s">
                    {allowance
                      ? `${planLabel} · up to ${allowance} ${allowance === 1 ? "reader" : "readers"} · ${children.length} added`
                      : planLabel}
                    {trialEndLabel ? ` · ends ${trialEndLabel}` : ""}
                  </div>
                </div>
                <a className="btn btn-forest btn-sm" href="Haaraya Home.html#home" onClick={(e) => { e.preventDefault(); onNavigate("pricing"); }}>See plans</a>
              </div>
            )}

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
      {addOpen && (
        <AddChildModal
          onClose={() => setAddOpen(false)}
          onDone={() => setKidTick(t => t + 1)}
        />
      )}
    </main>
  );
}

Object.assign(window, {
  PassportScreen, ChildDashScreen, ParentDashScreen, AddChildModal,
});
