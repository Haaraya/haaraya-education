/* ============================================================================
   Haaraya — LIBRARY TAB (self-contained extract)
   ----------------------------------------------------------------------------
   This is the full "Library" screen exactly as it runs in the Haaraya app
   (the page you reach via "View the Library →"), packaged with every helper
   it depends on so you can read, reuse, or hand it off in one file.

   WHAT'S INSIDE (top → bottom):
     1. STRANDS              — brand data for the 10 reading strands
     2. shade()              — color helper used by StrandLogo/Book
     3. StrandLogo           — renders a strand wordmark/logo image
     4. Book                 — a single book card on the shelf
     5. SectionHeader        — the eyebrow + title + lede header block
     6. useApi               — tiny async-data hook (loads books)
     7. bookToCardProps      — maps a DB book row → <Book> props
     8. LIB_STRANDS_ROW1/2,
        LIB_STRAND_UI        — the strand filter rows + key remapping
     9. LibraryScreen        — THE LIBRARY TAB itself

   EXTERNAL RUNTIME IT EXPECTS (provided by the host app, not bundled here):
     • React 18 (useState/useEffect/useRef/useMemo/useCallback)
     • window.HaarayaApi.getBooks(filter)  → Promise<book[]>
     • window.HaarayaSession.role()        → "visitor" | "parent" | …
     • A "haaraya:session" window event when the demo role changes
     • CSS classes: .wrap .section-header .library-filters .filter-chip
       .library-shelf .book .lib-empty .lib-subscribe-note .btn (styles.css)
     • Strand logo PNGs under assets/  (referenced by STRANDS[*].logo)
     • CSS vars: --cream --sand --ink-mid --font-display etc.

   To render standalone: mount <LibraryScreen onNavigate={fn} /> into a React
   root, and stub HaarayaApi.getBooks / HaarayaSession.role if you don't have
   the full data layer.
   ============================================================================ */

const { useState: useStateLib, useEffect: useEffectLib } = React;

/* ---------- 1. Brand data: the 10 reading strands ---------- */
const STRANDS = {
  hafwas: {
    key: "hafwas", name: "Hafwas",
    logo: "assets/logo-hafwas.png", card: "assets/card-hafwas.png",
    color: "#E65100", bg: "#FFF3E0", bd: "#FFA726",
    purpose: "High-frequency words. Rhythm and repetition that builds reading confidence early.",
    levels: "L1–L12", vibe: "Repeated",
  },
  soundables: {
    key: "soundables", name: "Soundables",
    logo: "assets/logo-soundables.png", card: "assets/card-soundables.png",
    color: "#1565C0", bg: "#E3F2FD", bd: "#42A5F5",
    purpose: "Decodable phonics readers. Friendly patterns, structured progress.",
    levels: "L1–L12", vibe: "Foundational",
  },
  "soundables-plus": {
    key: "soundables-plus", name: "Soundables+",
    logo: "assets/logo-soundables-plus.png", card: "assets/card-soundables-plus.png",
    color: "#0D47A1", bg: "#E1F0FB", bd: "#1976D2",
    purpose: "Prefixes, suffixes, roots. Unlocking the architecture of words.",
    levels: "L7–L12", vibe: "Advanced",
  },
  tafiya: {
    key: "tafiya", name: "Tafiya Fiction",
    logo: "assets/logo-tafiya-fiction.png", card: "assets/card-tafiya-fiction.png",
    color: "#228B22", bg: "#E8F5E9", bd: "#66BB6A",
    purpose: "The leveled story journey. Nigerian-rooted fiction at the heart of every level.",
    levels: "L1–L12", vibe: "Adventurous",
  },
  "tafiya-nonfiction": {
    key: "tafiya-nonfiction", name: "Tafiya Non-Fiction",
    logo: "assets/logo-tafiya-nonfiction.png", card: "assets/card-tafiya-nonfiction.png",
    color: "#1A6E1A", bg: "#E6F1E6", bd: "#4E944F",
    purpose: "Real-world Nigerian non-fiction. Markets, weather, work, animals — the world children live in.",
    levels: "L1–L12", vibe: "Grounded",
  },
  folktale: {
    key: "folktale", name: "Tafiya Folktale",
    logo: "assets/logo-folktales.png", card: "assets/card-folktale.png",
    color: "#5D4037", bg: "#EFEBE9", bd: "#A1887F",
    purpose: "Traditional Nigerian and West African folktales — the oral tradition, on the page.",
    levels: "L1–L12", vibe: "Timeless",
  },
  poetry: {
    key: "poetry", name: "Tafiya Poetry",
    logo: "assets/logo-poetry.png", card: "assets/card-poetry.png",
    color: "#8E24AA", bg: "#F3E5F5", bd: "#BA68C8",
    purpose: "Rhythm, rhyme, oral language. A love of how words sound.",
    levels: "L1–L12", vibe: "Rhythmic",
  },
  duniya: {
    key: "duniya", name: "Tafiya Duniya",
    logo: "assets/logo-tafiya-duniya.png", card: "assets/card-tafiya-duniya.png",
    color: "#00838F", bg: "#E0F7FA", bd: "#4DD0E1",
    purpose: "Folktales from the wider world — Haaraya looking outward.",
    levels: "L3–L12", vibe: "Global",
  },
  stamina: {
    key: "stamina", name: "Stamina Fiction",
    logo: "assets/logo-tafiya-stamina-fiction.png", card: "assets/card-stamina-fiction.png",
    color: "#283593", bg: "#E8EAF6", bd: "#5C6BC0",
    purpose: "Extended fiction readers. Deeper, longer, more demanding stories for confident readers.",
    levels: "L3–L12", vibe: "Immersive",
  },
  "stamina-nonfiction": {
    key: "stamina-nonfiction", name: "Stamina Non-Fiction",
    logo: "assets/logo-tafiya-stamina-nonfiction.png", card: "assets/card-stamina-nonfiction.png",
    color: "#1A237E", bg: "#E2E4F2", bd: "#3949AB",
    purpose: "Long-form non-fiction. Place, science, history — Nigerian and global, for fluent readers.",
    levels: "L7–L12", vibe: "Investigative",
  },
};

/* ---------- 2. Color helper ---------- */
function shade(hex, percent) {
  const n = parseInt(hex.replace("#", ""), 16);
  let r = (n >> 16) + percent;
  let g = ((n >> 8) & 0x00FF) + percent;
  let b = (n & 0x0000FF) + percent;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

/* ---------- 3. StrandLogo (image, with wordmark fallback) ---------- */
function StrandLogo({ strand, height = 64, dark = false }) {
  const s = STRANDS[strand];
  if (!s) return null;
  if (s.logo) {
    return (
      <img
        src={s.logo}
        alt={s.name}
        style={{
          height, width: "auto", maxWidth: "100%", objectFit: "contain",
          filter: dark ? "invert(1) brightness(2)" : "none",
        }}
      />
    );
  }
  return (
    <div style={{
      fontFamily: "var(--font-display)", fontSize: height * 0.6,
      color: dark ? "white" : s.color, letterSpacing: "0.02em", lineHeight: 1,
    }}>
      {s.name}
    </div>
  );
}

/* ---------- 4. Book card ---------- */
function Book({ book, onClick, size = "md", locked = false }) {
  return (
    <div
      className={"book" + (locked ? " book--locked" : "")}
      style={{ "--bg": book.bg, "--c": book.c }}
      onClick={onClick}
      role="button"
    >
      {locked && (
        <div className="book-locktag" aria-label="Subscriber only">
          <span className="book-lockicon" aria-hidden="true">🔒</span>
          Subscriber only
        </div>
      )}
      {book.audio && <div className="audio-icon" aria-label="Audio">🔊</div>}
      <div className="strand-badge">
        <StrandLogo strand={book.strand} height={14} dark />
      </div>
      <div>
        <h4>{book.title}</h4>
        <div className="by">{book.author}</div>
      </div>
      <div className="level-tag">L{book.level}</div>
    </div>
  );
}

/* ---------- 5. Section header ---------- */
function SectionHeader({ eyebrow, title, lede, center, children }) {
  return (
    <div className={`section-header ${center ? "center" : ""}`}>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      {title && <h2>{title}</h2>}
      {lede && <p className="lede" style={{ marginTop: 18 }}>{lede}</p>}
      {children}
    </div>
  );
}

/* ---------- 6. useApi: tiny async-data hook ---------- */
function useApi(loader, deps = []) {
  const [data, setData] = useStateLib(null);
  const [loading, setLoading] = useStateLib(true);
  useEffectLib(() => {
    let alive = true;
    setLoading(true);
    Promise.resolve(loader()).then(d => { if (alive) { setData(d); setLoading(false); } });
    return () => { alive = false; };
  }, deps);
  return { data, loading };
}

/* ---------- 7. DB book row → <Book> props ---------- */
function bookToCardProps(dbBook) {
  if (!dbBook) return null;
  const uiKey = dbBook.strandUi || "tafiya";
  const s = STRANDS[uiKey] || STRANDS.tafiya;
  return {
    id: dbBook.id,
    title: dbBook.title,
    author: dbBook.bookType || s.name,
    strand: uiKey,
    level: dbBook.levelId,
    c: s.color,
    bg: s.bg,
    audio: !!dbBook.audioUrl,
    _db: dbBook,
  };
}

/* ---------- 8. Filter rows + display-key → data-key remap ----------
   The book data rolls the two "Non-Fiction" identities into their parent
   strand, so LIB_STRAND_UI maps each display key to a real book strandUi. */
const LIB_STRANDS_ROW1 = ["hafwas", "soundables", "soundables-plus", "tafiya", "tafiya-nonfiction"];
const LIB_STRANDS_ROW2 = ["folktale", "poetry", "duniya", "stamina", "stamina-nonfiction"];
const LIB_STRAND_UI = {
  "tafiya-nonfiction": "tafiya",
  "stamina-nonfiction": "stamina",
};

/* ============================================================================
   9. THE LIBRARY TAB
   ============================================================================ */
function LibraryScreen({ onNavigate, initialLevel, initialStrand }) {
  const [strandFilter, setStrandFilter] = useStateLib(initialStrand || "all");
  const [levelFilter, setLevelFilter] = useStateLib(initialLevel || "all");
  const [audioOnly, setAudioOnly] = useStateLib(false);

  // Current role — re-read when the demo session changes so locking re-gates live.
  const [role, setRole] = useStateLib(() => (window.HaarayaSession ? HaarayaSession.role() : "visitor"));
  useEffectLib(() => {
    const onSession = () => setRole(window.HaarayaSession ? HaarayaSession.role() : "visitor");
    window.addEventListener("haaraya:session", onSession);
    return () => window.removeEventListener("haaraya:session", onSession);
  }, []);
  const isVisitor = role === "visitor";
  const SAMPLE_LIMIT = 6; // non-members may open this many sample books; the rest are subscriber-only

  // If a level was passed in (e.g. from the home journey hotspots), respect it on mount.
  useEffectLib(() => {
    if (initialLevel)  setLevelFilter(Number(initialLevel));
    if (initialStrand) setStrandFilter(initialStrand);
  }, [initialLevel, initialStrand]);

  const { data: books } = useApi(async () => {
    const filter = {};
    if (strandFilter !== "all") filter.strandUi = LIB_STRAND_UI[strandFilter] || strandFilter;
    if (levelFilter !== "all")  filter.levelId  = Number(levelFilter);
    if (audioOnly)              filter.audioOnly = true;
    return await HaarayaApi.getBooks(filter);
  }, [strandFilter, levelFilter, audioOnly]);

  const filtered = (books || []).map(bookToCardProps);

  return (
    <main style={{ background: "var(--cream)", minHeight: "100vh" }}>
      <div className="wrap" style={{ padding: "64px 32px 80px" }}>
        <SectionHeader
          eyebrow="The library"
          title="Explore the Haaraya reading journey."
          lede="Filter by strand, level, or audio. Tap any book to start reading or listening."
        />

        {/* Strand filter — row 1 */}
        <div className="library-filters">
          <span className={`filter-chip ${strandFilter === "all" ? "active" : ""}`} onClick={() => setStrandFilter("all")}>All strands</span>
          {LIB_STRANDS_ROW1.map(k => {
            const s = STRANDS[k];
            return (
              <span
                key={k}
                className={`filter-chip filter-chip-logo ${strandFilter === k ? "active" : ""}`}
                onClick={() => setStrandFilter(k)}
                title={s.name}
                style={{ "--c": s.color, "--bg": s.bg }}
              >
                <StrandLogo strand={k} height={36} />
              </span>
            );
          })}
        </div>

        {/* Strand filter — row 2 */}
        <div className="library-filters" style={{ marginTop: 12 }}>
          {LIB_STRANDS_ROW2.map(k => {
            const s = STRANDS[k];
            return (
              <span
                key={k}
                className={`filter-chip filter-chip-logo ${strandFilter === k ? "active" : ""}`}
                onClick={() => setStrandFilter(k)}
                title={s.name}
                style={{ "--c": s.color, "--bg": s.bg }}
              >
                <StrandLogo strand={k} height={36} />
              </span>
            );
          })}
        </div>

        {/* Audio toggle */}
        <div className="library-filters" style={{ marginTop: 12 }}>
          <span
            className={`filter-chip ${audioOnly ? "active" : ""}`}
            onClick={() => setAudioOnly(!audioOnly)}
          >🔊 Audio</span>
        </div>

        {/* Level filter */}
        <div className="library-filters" style={{ marginTop: 12 }}>
          <span
            className={`filter-chip ${levelFilter === "all" ? "active" : ""}`}
            onClick={() => setLevelFilter("all")}
          >All levels</span>
          {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
            <span
              key={n}
              className={`filter-chip filter-chip-level ${levelFilter === n ? "active" : ""}`}
              onClick={() => setLevelFilter(n)}
            >Level {n}</span>
          ))}
        </div>

        {/* Shelf */}
        {filtered.length === 0 ? (
          <div className="lib-empty">
            <span className="lib-empty-seal" aria-hidden="true">✦</span>
            <p className="lib-empty-title">More books on the way.</p>
            <p className="lib-empty-sub">This strand is still being added to the Haaraya library. Try another strand or level.</p>
          </div>
        ) : (
          <div className="library-shelf" style={{ gridTemplateColumns: "repeat(6, 1fr)", marginTop: 32 }}>
            {filtered.slice(0, 36).map((b, i) => {
              const locked = isVisitor && i >= SAMPLE_LIMIT;
              return (
                <Book
                  key={b.id}
                  book={b}
                  locked={locked}
                  onClick={() => locked ? onNavigate("home") : onNavigate("reader", { bookId: b.id })}
                />
              );
            })}
          </div>
        )}

        {/* Footer note: subscribe prompt for visitors, count for members */}
        {filtered.length > 0 && (isVisitor ? (
          <div className="lib-subscribe-note">
            <div>
              <strong>You&rsquo;re previewing the library.</strong>
              <span> Subscribe to unlock the full Haaraya reading journey — {filtered.length} books across every strand and level.</span>
            </div>
            <button className="btn btn-forest" onClick={() => onNavigate("home")}>Join the waitlist &rarr;</button>
          </div>
        ) : (
          <div style={{ marginTop: 48, padding: 24, background: "var(--sand)", borderRadius: 16, fontSize: 14, color: "var(--ink-mid)" }}>
            Showing {Math.min(36, filtered.length)} of {filtered.length} matching books.
          </div>
        ))}
      </div>
    </main>
  );
}

/* Expose for the host app (matches how the live app wires it up). */
Object.assign(window, {
  STRANDS, shade, StrandLogo, Book, SectionHeader, useApi, bookToCardProps,
  LIB_STRANDS_ROW1, LIB_STRANDS_ROW2, LIB_STRAND_UI, LibraryScreen,
});
