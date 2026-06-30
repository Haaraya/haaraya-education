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
   READER SCREEN
   ============================================================ */
function ReaderScreen({ bookCode, onNavigate }) {
  const code = bookCode || "T4-NF-01";
  const [pkg, setPkg] = useStateTfr(null);
  const [status, setStatus] = useStateTfr("loading"); // loading | ready | error
  const [errMsg, setErrMsg] = useStateTfr("");
  const [index, setIndex] = useStateTfr(0);
  const bookRef = useRefTfr(null);

  // Build the screen list once a package is loaded.
  const screens = React.useMemo(() => {
    if (!pkg) return [];
    const pages = (pkg.pages || []).slice().sort((a, b) => (a.page_number || 0) - (b.page_number || 0));
    return [{ type: "cover" }, ...pages.map(p => ({ type: "page", page: p })), { type: "back" }];
  }, [pkg]);

  const progressKey = "tafiya-reader:" + code + ":screen";

  // Load the book package (bundled sample first, else live Supabase).
  useEffectTfr(() => {
    let alive = true;
    setStatus("loading"); setPkg(null); setErrMsg("");
    window.TafiyaData.getPackage(code).then(p => {
      if (!alive) return;
      setPkg(p);
      setStatus("ready");
      const totalScreens = 1 + (p.pages ? p.pages.length : 0) + 1;
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
    const cur = screens[index];
    if (window.TafiyaData) {
      window.TafiyaData.recordProgress(code, index, screens.length);
      // Reaching the back cover counts as finishing the book.
      if (cur && cur.type === "back") window.TafiyaData.recordComplete(code);
    }
  }, [index, status]);

  const total = screens.length;
  const go = (i) => setIndex(Math.max(0, Math.min(total - 1, i)));
  const next = () => go(index + 1);
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
  }, [index, total]);

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
  }, [index, total, status]);

  const b = (pkg && pkg.book) || {};
  const logos = (pkg && pkg.assets && pkg.assets.logos) || {};
  const cur = screens[index];

  let progressText = "";
  if (cur) {
    if (cur.type === "cover") progressText = "Front cover";
    else if (cur.type === "back") progressText = "Back cover";
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
            {logos.haaraya_literacy
              ? <img src={tfrSrc(logos.haaraya_literacy, !!(pkg && pkg._local))} alt="" />
              : <span className="strand">{tfrText(b.strand)}</span>}
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
          </article>
        </main>

        {/* Bottom nav */}
        <footer className="navbar">
          <button className="btn btn-nav prev" type="button" onClick={prev} disabled={index === 0 || status !== "ready"}>
            <span className="ico" aria-hidden="true">‹</span><span className="nav-label">Back</span>
          </button>
          <div className="progress">
            <span className="progress-text">{progressText}</span>
            {total > 0 && total <= 16 && (
              <div className="dots" aria-hidden="true">
                {screens.map((sc, i) => (
                  <button key={i} type="button" className={"dot" + (i === index ? " active" : "")} onClick={() => go(i)} />
                ))}
              </div>
            )}
          </div>
          <button className="btn btn-nav btn-next next" type="button" onClick={next} disabled={index === total - 1 || status !== "ready"}>
            <span className="nav-label">Next</span><span className="ico" aria-hidden="true">›</span>
          </button>
        </footer>
      </div>
    </div>
  );
}

/* ============================================================
   LIBRARY SCREEN — real Tafiya catalogue with cover thumbnails
   ============================================================ */

/* The original app's strand chips, in their two rows. Only some are covered by
   the current Tafiya catalogue; the rest render greyed-out (see availability). */
const TAFIYA_STRAND_ROWS = [
  ["hafwas", "soundables", "soundables-plus", "tafiya", "tafiya-nonfiction"],
  ["folktale", "poetry", "duniya", "stamina", "stamina-nonfiction"],
];
const tflCodeOf = (b) => tfrText((b && (b.book_code || b.code)) || "");
const tflNormType = (b) => tfrText(tfrTypeLabel(b && b.book_type)).toLowerCase();
const tflNormStrand = (b) => tfrText(b && b.strand).toLowerCase();

/* Which catalogue book_types each strand chip stands for. Chips with no entry
   here (or no matching books) are shown disabled. */
const TAFIYA_STRAND_MATCH = {
  hafwas: (b) => tflCodeOf(b).startsWith("H-") || tflNormStrand(b).includes("hafwas") || tflNormType(b).includes("hafwas"),
  soundables: (b) => tflCodeOf(b).startsWith("S-") || tflNormStrand(b).includes("soundables") && !tflNormStrand(b).includes("plus"),
  "soundables-plus": (b) => tflCodeOf(b).startsWith("SP-") || tflNormStrand(b).includes("soundables+") || tflNormStrand(b).includes("soundables plus") || tflNormType(b).includes("soundables+"),
  tafiya: (b) => tflCodeOf(b).startsWith("TF-") || tflNormType(b) === "fiction" || tflNormType(b) === "concept" || tflNormStrand(b).includes("tafiya fiction"),
  "tafiya-nonfiction": (b) => tflCodeOf(b).startsWith("TN-") || tflNormType(b).includes("non-fiction") || tflNormType(b).includes("nonfiction") || tflNormStrand(b).includes("non-fiction"),
  folktale: (b) => tflCodeOf(b).startsWith("TFT-") || tflNormType(b).includes("folktale") || tflNormStrand(b).includes("folktale"),
  poetry: (b) => tflCodeOf(b).startsWith("TP-") || tflNormType(b).includes("poetry") || tflNormStrand(b).includes("poetry"),
  duniya: (b) => tflCodeOf(b).startsWith("TD-") || tflNormType(b).includes("duniya") || tflNormStrand(b).includes("duniya"),
  stamina: (b) => tflCodeOf(b).startsWith("SF-") || tflNormType(b).includes("stamina fiction") || tflNormStrand(b).includes("stamina fiction"),
  "stamina-nonfiction": (b) => tflCodeOf(b).startsWith("SN-") || tflNormType(b).includes("stamina non-fiction") || tflNormType(b).includes("stamina nonfiction") || tflNormStrand(b).includes("stamina non-fiction"),
};

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

  const codeOf = (b) => b.book_code || b.code || "";
  const levelNum = (b) => { const m = tfrText(b.level).match(/\d+/); return m ? Number(m[0]) : (typeof b.level === "number" ? b.level : 999); };
  const typeOf = (b) => tfrTypeLabel(b.book_type);

  // Availability — drives which chips are live vs greyed.
  const strandAvailable = (k) => { const m = TAFIYA_STRAND_MATCH[k]; return !!m && catalog.some(b => m(b)); };
  const levelsPresent = React.useMemo(() => new Set(catalog.map(levelNum)), [catalog]);

  const sequenceNum = (b) => { const m = codeOf(b).match(/-(\d+)$/); return m ? Number(m[1]) : 999999; };

  const filtered = catalog
    .filter(b => codeOf(b))
    .filter(b => levelFilter === "all" || levelNum(b) === levelFilter)
    .filter(b => { if (strandFilter === "all") return true; const m = TAFIYA_STRAND_MATCH[strandFilter]; return m ? m(b) : false; })
    .sort((a, b) => (levelNum(a) - levelNum(b)) || (sequenceNum(a) - sequenceNum(b)) || codeOf(a).localeCompare(codeOf(b)));

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
