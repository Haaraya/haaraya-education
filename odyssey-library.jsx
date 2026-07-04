/* ============================================================
   Haaraya — Odyssey Library
   The 100 Book Odyssey: long-form chapter books across three
   streams (Knowledge, Classics, Estate Fiction) and three
   levels (13–15). A filterable catalogue of typographic covers
   plus a calm chapter reader.

   Data:
     data/odyssey-catalog.json        — 99 book summaries
     data/odyssey/<CODE>.json         — chapters + pages per book
   ============================================================ */
const { useState: useStateOL, useEffect: useEffectOL, useMemo: useMemoOL, useRef: useRefOL } = React;

/* ---- stream identity ---- */
const OL_STREAMS = {
  "Knowledge":      { key: "kn", label: "Knowledge",  ink: "#0f3a3a", accent: "#0d7d6f", soft: "#e5f1ee", tag: "Non-fiction" },
  "Classics":       { key: "cl", label: "Classics",   ink: "#3a1420", accent: "#9c2b45", soft: "#f6e6ea", tag: "Retold tales" },
  // "Estate Fiction" is the internal/catalogue label; the public name is "Tafiya Tales".
  "Estate Fiction": { key: "st", label: "Tafiya Tales", ink: "#3a2708", accent: "#c17d1a", soft: "#f8ecd7", tag: "Estate stories" },
};
function olStream(name) { return OL_STREAMS[name] || OL_STREAMS["Knowledge"]; }

/* ---- tiny data layer (cached) ---- */
const OL_cache = { catalog: null, books: {} };
async function olLoadCatalog() {
  if (OL_cache.catalog) return OL_cache.catalog;
  const res = await fetch("data/odyssey-catalog.json");
  OL_cache.catalog = await res.json();
  return OL_cache.catalog;
}
async function olLoadBook(code) {
  if (OL_cache.books[code]) return OL_cache.books[code];
  const res = await fetch("data/odyssey/" + code + ".json");
  const data = await res.json();
  OL_cache.books[code] = data;
  return data;
}

/* ============================================================
   BOOK COVER — typographic, per-stream
   ============================================================ */
function OdysseyCover({ book, onOpen }) {
  const s = olStream(book.stream);
  const soon = book.status === "coming_soon";
  return (
    <button className={"olc olc--" + s.key + (book.capstone ? " olc--capstone" : "")} type="button" onClick={() => onOpen(book.code)}
      style={{ "--ol-ink": s.ink, "--ol-accent": s.accent }}>
      <span className="olc-spine" aria-hidden="true"></span>
      <span className="olc-top">
        <span className="olc-stream">{book.capstone ? "The Final Book" : s.label}</span>
        <span className="olc-num">{String(book.n).padStart(2, "0")}</span>
      </span>
      <span className="olc-title">{book.title}</span>
      <span className="olc-foot">
        {soon ? (
          <span className="olc-soon">Coming soon</span>
        ) : (
          <React.Fragment>
            <span className="olc-lvl">Level {book.level}</span>
            <span className="olc-dot" aria-hidden="true">•</span>
            <span className="olc-ch">{book.chapterCount} chapters</span>
          </React.Fragment>
        )}
      </span>
      <span className="olc-emblem" aria-hidden="true">✦</span>
    </button>
  );
}

/* ============================================================
   LIBRARY SCREEN
   ============================================================ */
function OdysseyLibraryScreen({ onNavigate, initialLevel, initialStream }) {
  const [catalog, setCatalog] = useStateOL(null);
  const [q, setQ] = useStateOL("");
  const [level, setLevel] = useStateOL(initialLevel ? String(initialLevel) : "all");
  const [stream, setStream] = useStateOL(initialStream || "all");

  useEffectOL(() => { olLoadCatalog().then(setCatalog); }, []);

  const filtered = useMemoOL(() => {
    if (!catalog) return [];
    const needle = q.trim().toLowerCase();
    return catalog.filter(b => {
      if (level !== "all" && String(b.level) !== level) return false;
      if (stream !== "all" && b.stream !== stream) return false;
      if (needle && !(b.title.toLowerCase().includes(needle) || b.code.toLowerCase().includes(needle))) return false;
      return true;
    });
  }, [catalog, q, level, stream]);

  const openBook = (code) => onNavigate("odyssey-reader", { bookCode: code });

  const levels = ["13", "14", "15"];
  const streams = Object.keys(OL_STREAMS);

  return (
    <div className="ol-screen">
      <header className="ol-head">
        <div className="ol-head-wrap">
          <button className="ol-back" type="button" onClick={() => onNavigate("odyssey")}>← The Odyssey</button>
          <div className="ol-head-titles">
            <span className="ol-eyebrow">The 100 Book Odyssey</span>
            <h1 className="ol-h1">The Odyssey Library</h1>
            <p className="ol-sub">Ninety-nine great books to carry you from Level 13 to the top of the climb — knowledge, classics, and stories from the estate.</p>
          </div>
        </div>
      </header>

      <div className="ol-controls">
        <div className="ol-search">
          <span className="ol-search-ic" aria-hidden="true">⌕</span>
          <input type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search by title or code…" />
        </div>
        <div className="ol-filters">
          <div className="ol-seg" role="group" aria-label="Level">
            <button className={level === "all" ? "on" : ""} onClick={() => setLevel("all")}>All levels</button>
            {levels.map(l => <button key={l} className={level === l ? "on" : ""} onClick={() => setLevel(l)}>L{l}</button>)}
          </div>
          <div className="ol-seg" role="group" aria-label="Stream">
            <button className={stream === "all" ? "on" : ""} onClick={() => setStream("all")}>All streams</button>
            {streams.map(s => (
              <button key={s} className={stream === s ? "on" : ""} onClick={() => setStream(s)}
                style={stream === s ? { background: olStream(s).accent, borderColor: olStream(s).accent } : {}}>
                {olStream(s).label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!catalog ? (
        <div className="ol-loading">Opening the library…</div>
      ) : (
        <React.Fragment>
          <div className="ol-count">{filtered.length} {filtered.length === 1 ? "book" : "books"}</div>
          <div className="ol-grid">
            {filtered.map(b => <OdysseyCover key={b.code} book={b} onOpen={openBook} />)}
          </div>
          {filtered.length === 0 && <div className="ol-empty">No books match that search yet.</div>}
        </React.Fragment>
      )}
    </div>
  );
}

/* ============================================================
   CHAPTER READER
   ============================================================ */
function OdysseyBookReader({ code, onNavigate }) {
  const [book, setBook] = useStateOL(null);
  const [chIdx, setChIdx] = useStateOL(0);
  const [menuOpen, setMenuOpen] = useStateOL(false);
  const scrollRef = useRefOL(null);

  useEffectOL(() => {
    let alive = true;
    setBook(null);
    olLoadBook(code).then(b => {
      if (!alive) return;
      setBook(b);
      // resume last chapter
      try {
        const saved = localStorage.getItem("haaraya:ody:pos:" + code);
        if (saved != null) setChIdx(Math.min(Number(saved) || 0, b.chapters.length - 1));
      } catch (e) { /* ignore */ }
    });
    return () => { alive = false; };
  }, [code]);

  useEffectOL(() => {
    try { if (book) localStorage.setItem("haaraya:ody:pos:" + code, String(chIdx)); } catch (e) { /* ignore */ }
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "instant" });
  }, [chIdx, book, code]);

  if (!book) return <div className="olr-loading">Opening the book…</div>;

  const s = olStream(book.stream);

  // Capstone / not-yet-written books show a graceful placeholder.
  if (!book.chapters || book.chapters.length === 0) {
    return (
      <div className={"olr olr--" + s.key} style={{ "--ol-ink": s.ink, "--ol-accent": s.accent, "--ol-soft": s.soft }}>
        <header className="olr-top">
          <button className="olr-topbtn" type="button" onClick={() => onNavigate("odyssey-library")}>← Library</button>
          <div className="olr-top-mid">
            <span className="olr-top-stream">{s.label}{book.capstone ? " · Book 100" : ""}</span>
            <span className="olr-top-title">{book.title}</span>
          </div>
          <span style={{ width: 70 }}></span>
        </header>
        <div className="olr-soon">
          <div className="olr-soon-emblem" aria-hidden="true">✦</div>
          {book.capstone && <div className="olr-soon-kicker">The final book of the Odyssey</div>}
          <h2 className="olr-soon-title">{book.title}</h2>
          <p className="olr-soon-text">The last voyage is being written. When it lands, it will be the hundredth book — the one every Captain sails toward.</p>
          <button className="olr-navbtn primary" type="button" onClick={() => onNavigate("odyssey-library")}>Back to the Library</button>
        </div>
      </div>
    );
  }

  const ch = book.chapters[chIdx];
  const isFirst = chIdx === 0, isLast = chIdx === book.chapters.length - 1;
  const n = window.HaarayaOdyssey ? window.HaarayaOdyssey.number(book.code) : null;

  const goChapter = (i) => { setChIdx(i); setMenuOpen(false); };

  return (
    <div className={"olr olr--" + s.key} style={{ "--ol-ink": s.ink, "--ol-accent": s.accent, "--ol-soft": s.soft }}>
      <header className="olr-top">
        <button className="olr-topbtn" type="button" onClick={() => onNavigate("odyssey-library")}>← Library</button>
        <div className="olr-top-mid">
          <span className="olr-top-stream">{s.label}{n ? " · Book " + n : ""}</span>
          <span className="olr-top-title">{book.title}</span>
        </div>
        <button className="olr-topbtn" type="button" onClick={() => setMenuOpen(o => !o)} aria-expanded={menuOpen}>
          Chapters ▾
        </button>
      </header>

      {menuOpen && (
        <div className="olr-menu" onClick={e => { if (e.target === e.currentTarget) setMenuOpen(false); }}>
          <div className="olr-menu-card">
            <div className="olr-menu-head">
              <span>{book.title}</span>
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close">×</button>
            </div>
            <ol className="olr-menu-list">
              {book.chapters.map((c, i) => (
                <li key={i}>
                  <button type="button" className={i === chIdx ? "on" : ""} onClick={() => goChapter(i)}>
                    <span className="olr-menu-num">{c.num}</span>
                    <span className="olr-menu-t">{c.title}</span>
                    <span className="olr-menu-pp">{c.pages.length} pp</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      <div className="olr-scroll" ref={scrollRef}>
        <article className="olr-page">
          <div className="olr-ch-head">
            <span className="olr-ch-kicker">Chapter {ch.num} of {book.chapters.length}</span>
            <h2 className="olr-ch-title">{ch.title}</h2>
          </div>

          {ch.pages.map((p, i) => (
            <React.Fragment key={i}>
              {p.image && (
                <figure className="olr-fig">
                  <div className="olr-fig-ph">
                    <span className="olr-fig-ic" aria-hidden="true">▧</span>
                    <span className="olr-fig-label">Illustration</span>
                  </div>
                  {p.image.note && <figcaption className="olr-fig-note">{p.image.note}</figcaption>}
                </figure>
              )}
              {p.text && <p className="olr-para">{p.text}</p>}
            </React.Fragment>
          ))}
        </article>

        <nav className="olr-foot">
          <button className="olr-navbtn" type="button" disabled={isFirst} onClick={() => setChIdx(i => Math.max(0, i - 1))}>← Previous</button>
          <span className="olr-foot-pos">Chapter {ch.num} / {book.chapters.length}</span>
          {isLast ? (
            <button className="olr-navbtn primary" type="button" onClick={() => onNavigate("odyssey-library")}>Finish ✦</button>
          ) : (
            <button className="olr-navbtn primary" type="button" onClick={() => setChIdx(i => Math.min(book.chapters.length - 1, i + 1))}>Next →</button>
          )}
        </nav>
      </div>
    </div>
  );
}

window.OdysseyLibraryScreen = OdysseyLibraryScreen;
window.OdysseyBookReader = OdysseyBookReader;
