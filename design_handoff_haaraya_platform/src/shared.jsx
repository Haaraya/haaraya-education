/* ============================================================
   Haaraya — shared atoms
   Exported to window for cross-script usage
   ============================================================ */

/* ------------ Brand data ------------ */

const STRANDS = {
  hafwas: {
    key: "hafwas",
    name: "Hafwas",
    logo: "assets/logo-hafwas.png",
    card: "assets/card-hafwas.png",
    color: "#E65100", bg: "#FFF3E0", bd: "#FFA726",
    purpose: "High-frequency words. Rhythm and repetition that builds reading confidence early.",
    levels: "L1–L12",
    vibe: "Repeated",
  },
  soundables: {
    key: "soundables",
    name: "Soundables",
    logo: "assets/logo-soundables.png",
    card: "assets/card-soundables.png",
    color: "#1565C0", bg: "#E3F2FD", bd: "#42A5F5",
    purpose: "Decodable phonics readers. Friendly patterns, structured progress.",
    levels: "L1–L12",
    vibe: "Foundational",
  },
  "soundables-plus": {
    key: "soundables-plus",
    name: "Soundables+",
    logo: "assets/logo-soundables-plus.png",
    card: "assets/card-soundables-plus.png",
    color: "#0D47A1", bg: "#E1F0FB", bd: "#1976D2",
    purpose: "Prefixes, suffixes, roots. Unlocking the architecture of words.",
    levels: "L7–L12",
    vibe: "Advanced",
  },
  tafiya: {
    key: "tafiya",
    name: "Tafiya Fiction",
    logo: "assets/logo-tafiya-fiction.png",
    card: "assets/card-tafiya-fiction.png",
    color: "#228B22", bg: "#E8F5E9", bd: "#66BB6A",
    purpose: "The leveled story journey. Nigerian-rooted fiction at the heart of every level.",
    levels: "L1–L12",
    vibe: "Adventurous",
  },
  "tafiya-nonfiction": {
    key: "tafiya-nonfiction",
    name: "Tafiya Non-Fiction",
    logo: "assets/logo-tafiya-nonfiction.png",
    card: "assets/card-tafiya-nonfiction.png",
    color: "#1A6E1A", bg: "#E6F1E6", bd: "#4E944F",
    purpose: "Real-world Nigerian non-fiction. Markets, weather, work, animals — the world children live in.",
    levels: "L1–L12",
    vibe: "Grounded",
  },
  folktale: {
    key: "folktale",
    name: "Tafiya Folktale",
    logo: "assets/logo-folktales.png",
    card: "assets/card-folktale.png",
    color: "#5D4037", bg: "#EFEBE9", bd: "#A1887F",
    purpose: "Traditional Nigerian and West African folktales — the oral tradition, on the page.",
    levels: "L1–L12",
    vibe: "Timeless",
  },
  poetry: {
    key: "poetry",
    name: "Tafiya Poetry",
    logo: "assets/logo-poetry.png",
    card: "assets/card-poetry.png",
    color: "#8E24AA", bg: "#F3E5F5", bd: "#BA68C8",
    purpose: "Rhythm, rhyme, oral language. A love of how words sound.",
    levels: "L1–L12",
    vibe: "Rhythmic",
  },
  duniya: {
    key: "duniya",
    name: "Tafiya Duniya",
    logo: "assets/logo-tafiya-duniya.png",
    card: "assets/card-tafiya-duniya.png",
    color: "#00838F", bg: "#E0F7FA", bd: "#4DD0E1",
    purpose: "Folktales from the wider world — Haaraya looking outward.",
    levels: "L3–L12",
    vibe: "Global",
  },
  stamina: {
    key: "stamina",
    name: "Stamina Fiction",
    logo: "assets/logo-tafiya-stamina-fiction.png",
    card: "assets/card-stamina-fiction.png",
    color: "#283593", bg: "#E8EAF6", bd: "#5C6BC0",
    purpose: "Extended fiction readers. Deeper, longer, more demanding stories for confident readers.",
    levels: "L3–L12",
    vibe: "Immersive",
  },
  "stamina-nonfiction": {
    key: "stamina-nonfiction",
    name: "Stamina Non-Fiction",
    logo: "assets/logo-tafiya-stamina-nonfiction.png",
    card: "assets/card-stamina-nonfiction.png",
    color: "#1A237E", bg: "#E2E4F2", bd: "#3949AB",
    purpose: "Long-form non-fiction. Place, science, history — Nigerian and global, for fluent readers.",
    levels: "L7–L12",
    vibe: "Investigative",
  },
};

const CHILDREN_PROFILES = [
  { name: "Nasa",  initials: "NS", color: "#E65100", role: "Energetic adventurer" },
  { name: "Tima",  initials: "TM", color: "#8E24AA", role: "Chaos engine, funny" },
  { name: "Nana",  initials: "NN", color: "#1565C0", role: "Practical planner" },
  { name: "Nina",  initials: "NI", color: "#00838F", role: "Creative thinker" },
  { name: "Fara",  initials: "FA", color: "#228B22", role: "Warm and empathetic" },
  { name: "Nimi",  initials: "NM", color: "#F5C518", role: "Curious question-asker" },
];

const SAMPLE_BOOKS = [
  { id: "b1", title: "Mama's Market Morning",   author: "By Ada Onye",    strand: "tafiya",     level: 5, c: "#228B22", bg: "#E8F5E9", audio: true },
  { id: "b2", title: "The Big Big Bus",          author: "By Tunde Bello", strand: "hafwas",     level: 2, c: "#E65100", bg: "#FFF3E0", audio: true },
  { id: "b3", title: "Ade and the Lost Slipper", author: "By Iyabo K.",    strand: "soundables", level: 3, c: "#1565C0", bg: "#E3F2FD", audio: true },
  { id: "b4", title: "Anansi's Quiet Trick",     author: "Folktale",       strand: "tafiya",     level: 6, c: "#5D4037", bg: "#EFEBE9", audio: true },
  { id: "b5", title: "Rain on the Iroko",        author: "By Nkechi A.",   strand: "poetry",     level: 4, c: "#8E24AA", bg: "#F3E5F5", audio: true },
  { id: "b6", title: "How Yams Grow",            author: "Non-fiction",    strand: "tafiya",     level: 3, c: "#1A6E1A", bg: "#E8F5E8", audio: true },
  { id: "b7", title: "Run, Bisi, Run",           author: "By Chika M.",    strand: "soundables", level: 4, c: "#0D47A1", bg: "#E1F0FB", audio: true },
  { id: "b8", title: "Sky Drum Sky Song",        author: "By Ade Ola",     strand: "poetry",     level: 6, c: "#6A1B9A", bg: "#F3E5F5", audio: true },
  { id: "b9", title: "Twelve Friends",           author: "By Nimi O.",     strand: "hafwas",     level: 1, c: "#BF360C", bg: "#FFF3E0", audio: true },
  { id: "b10", title: "Lagos by Lamplight",      author: "By T. Adigun",   strand: "tafiya",     level: 8, c: "#145214", bg: "#E8F5E8", audio: true },
  { id: "b11", title: "The Shoemaker's Wish",    author: "Folktale",       strand: "tafiya",     level: 5, c: "#4E342E", bg: "#EFEBE9", audio: true },
  { id: "b12", title: "Stones that Sing",        author: "By Y. Amobi",    strand: "poetry",     level: 7, c: "#4A148C", bg: "#F3E5F5", audio: true },
];

const STAMP_DATA = [
  // page 1: tafiya stamps
  { strand: "tafiya",     ttl: "Mama's Market",   dt: "MAR 04",  r: -3 },
  { strand: "tafiya",     ttl: "Anansi's Trick",  dt: "MAR 11",  r:  4 },
  { strand: "tafiya",     ttl: "How Yams Grow",   dt: "MAR 18",  r: -5 },
  { strand: "tafiya",     ttl: "Lagos Lamp",      dt: "APR 02",  r:  3 },
  { strand: "tafiya",     ttl: "Iroko Tree",      dt: "APR 09",  r: -2 },
  { strand: "tafiya",     ttl: "Locked",          dt: "",       r:  2, locked: true },
];

const LEVEL_TIERS = [
  { range: "L1–L4",  family: "Greens",       meaning: "Foundation",       color: "#228B22" },
  { range: "L5–L6",  family: "Lime bridge",  meaning: "Transition",       color: "#7CB342" },
  { range: "L7–L12", family: "Purples",      meaning: "Advanced",         color: "#8E24AA" },
];

/* ------------ Avatar (initials in colored circle) ------------ */

function Avatar({ name, color = "#228B22", size = 48, initials, border = true }) {
  const ini = initials || (name ? name.split(" ").map(n => n[0]).slice(0, 2).join("") : "?");
  return (
    <div
      style={{
        width: size, height: size,
        borderRadius: "50%",
        background: `linear-gradient(135deg, ${color} 0%, ${shade(color, -20)} 100%)`,
        display: "grid", placeItems: "center",
        color: "white",
        fontFamily: "var(--font-display)",
        fontSize: size * 0.42,
        boxShadow: "inset 0 -2px 0 rgba(0,0,0,.12)",
        border: border ? `3px solid var(--cream)` : "none",
        flexShrink: 0,
        letterSpacing: "0.02em",
      }}
    >
      {ini.toUpperCase()}
    </div>
  );
}

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

/* ------------ StrandLogo (image or wordmark fallback) ------------ */

function StrandLogo({ strand, height = 64, dark = false }) {
  const s = STRANDS[strand];
  if (!s) return null;

  if (s.logo) {
    return (
      <img
        src={s.logo}
        alt={s.name}
        style={{
          height,
          width: "auto",
          maxWidth: "100%",
          objectFit: "contain",
          filter: dark ? "invert(1) brightness(2)" : "none",
        }}
      />
    );
  }
  // Wordmark fallback
  return (
    <div
      style={{
        fontFamily: "var(--font-display)",
        fontSize: height * 0.6,
        color: dark ? "white" : s.color,
        letterSpacing: "0.02em",
        lineHeight: 1,
      }}
    >
      {s.name}
    </div>
  );
}

/* ------------ StrandPill: reusable logo-on-tinted-bg chip ------------ */
/* Use anywhere a strand label was shown as text. */

function StrandPill({ strand, size = "sm", style = {}, dark = false }) {
  const s = STRANDS[strand];
  if (!s) return null;
  const dims = {
    xs: { h: 14, py: 3, px: 8 },
    sm: { h: 18, py: 4, px: 10 },
    md: { h: 26, py: 6, px: 14 },
    lg: { h: 36, py: 8, px: 16 },
  }[size] || { h: 18, py: 4, px: 10 };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: dark ? "rgba(255,255,255,.12)" : s.bg,
        padding: `${dims.py}px ${dims.px}px`,
        borderRadius: 999,
        lineHeight: 1,
        ...style,
      }}
      title={s.name}
    >
      <StrandLogo strand={strand} height={dims.h} dark={dark} />
    </span>
  );
}

Object.assign(window, { StrandPill });

/* ------------ Stamp ------------ */

function Stamp({ strand, title, sub, locked, rotate = -3, size }) {
  const cls = `stamp s-${strand} ${locked ? "s-locked" : ""}`;
  return (
    <div
      className={cls}
      style={{
        "--r": `${rotate}deg`,
        ...(size ? { width: size, height: size } : {}),
      }}
    >
      <div>
        <div className="title">{title}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
    </div>
  );
}

/* ------------ Book card ------------ */

function Book({ book, onClick, size = "md", locked = false }) {
  const s = STRANDS[book.strand];
  const thumb = book.thumb && window.TafiyaData ? window.TafiyaData.assetUrl(book.thumb) : book.thumb;
  if (thumb) {
    // Real cover-thumbnail variant (used by the library-backed dashboards).
    return (
      <div
        className={"book book--cover" + (locked ? " book--locked" : "")}
        onClick={onClick}
        role="button"
      >
        <img className="book-cover-img" src={thumb} alt="" onError={(e) => { e.currentTarget.parentNode.classList.add("book--nocover"); e.currentTarget.remove(); }} />
        {locked && (
          <div className="book-locktag" aria-label="Subscriber only">
            <span className="book-lockicon" aria-hidden="true">🔒</span>
            Subscriber only
          </div>
        )}
        <div className="book-cover-cap"><h4>{book.title}</h4></div>
        <div className="level-tag">L{book.level}</div>
      </div>
    );
  }
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

/* ------------ Section header ------------ */

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

/* ------------ Nav ------------ */

const NAV_LABELS = {
  home: "Home", library: "Library", passport: "Passport",
  child: "Child", parent: "Parent", teacher: "Teacher",
  school: "School", admin: "Admin",
};

function Nav({ current, onNavigate, session, navKeys, homeScreen, onSignIn, onSignOut, onWaitlist }) {
  const items = (navKeys || ["home", "library", "passport"]).map(key => ({ key, label: NAV_LABELS[key] || key }));
  const [menuOpen, setMenuOpen] = React.useState(false);
  const go = (key) => { setMenuOpen(false); onNavigate(key); };
  const signedIn = session && session.role !== "visitor";
  const roleLabel = window.HaarayaSession ? window.HaarayaSession.roleLabel(session && session.role) : "";

  // Lock body scroll while the mobile menu is open
  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleSignIn = (e) => { e.preventDefault(); setMenuOpen(false); onSignIn && onSignIn(); };
  const handleSignOut = (e) => { e.preventDefault(); setMenuOpen(false); onSignOut && onSignOut(); };
  const handleWaitlist = () => { setMenuOpen(false); onWaitlist ? onWaitlist() : go(homeScreen || "home"); };

  return (
    <nav className={`nav ${menuOpen ? "menu-open" : ""}`}>
      <div className="nav-inner">
        <button
          className="nav-brand"
          onClick={() => go(homeScreen || "home")}
          aria-label="Haaraya — home"
        >
          <img
            src="assets/logo-haaraya-literacy.png"
            alt="Haaraya Literacy"
            className="nav-logo-mark nav-logo-literacy"
          />
          <img
            src="assets/logo-haaraya-education.png"
            alt="Haaraya Education"
            className="nav-logo-mark nav-logo-education"
          />
        </button>
        <div className="nav-links">
          {items.map(it => (
            <a
              key={it.key}
              onClick={e => { e.preventDefault(); go(it.key); }}
              href={`#${it.key}`}
              style={{
                borderColor: current === it.key ? "var(--yellow)" : "transparent",
              }}
            >
              {it.label}
            </a>
          ))}
        </div>
        <div className="nav-spacer" />
        <div className="nav-actions">
          {signedIn ? (
            <React.Fragment>
              <button className="nav-identity" onClick={onSignIn} title="Switch demo role">
                <span className="nav-identity-dot" style={{ background: session.color }} />
                <span className="nav-identity-text">
                  <span className="nav-identity-name">{session.displayName}</span>
                  <span className="nav-identity-role">{roleLabel}</span>
                </span>
              </button>
              <a className="signin" href="#" onClick={handleSignOut}>Sign out</a>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <a className="signin" href="#" onClick={handleSignIn}>DEMO Sign-in</a>
              <button className="btn btn-primary btn-sm" onClick={handleWaitlist}>
                Join the waitlist
              </button>
            </React.Fragment>
          )}
        </div>
        <button
          className="nav-burger"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(o => !o)}
        >
          <span></span><span></span><span></span>
        </button>
      </div>

      <div className={`nav-mobile ${menuOpen ? "open" : ""}`}>
        {signedIn && (
          <div className="nav-mobile-identity">
            <span className="nav-identity-dot" style={{ background: session.color }} />
            <div>
              <div className="nav-identity-name">{session.displayName}</div>
              <div className="nav-identity-role">{roleLabel}</div>
            </div>
          </div>
        )}
        <div className="nav-mobile-links">
          {items.map(it => (
            <a
              key={it.key}
              className={current === it.key ? "active" : ""}
              onClick={e => { e.preventDefault(); go(it.key); }}
              href={`#${it.key}`}
            >
              {it.label}
              <span aria-hidden="true">→</span>
            </a>
          ))}
        </div>
        <div className="nav-mobile-actions">
          {signedIn ? (
            <React.Fragment>
              <a className="signin" href="#" onClick={handleSignIn}>Switch role</a>
              <button className="btn btn-primary" onClick={handleSignOut}>Sign out</button>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <a className="signin" href="#" onClick={handleSignIn}>DEMO Sign-in</a>
              <button className="btn btn-primary" onClick={handleWaitlist}>
                Join the waitlist
              </button>
            </React.Fragment>
          )}
        </div>
      </div>
    </nav>
  );
}

/* ------------ Expose to window ------------ */

/* ------------ Data hooks (wrap HaarayaApi for React) ------------ */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

function useApi(loader, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.resolve()
      .then(loader)
      .then(r => { if (alive) { setData(r); setLoading(false); } })
      .catch(e => { if (alive) { setError(e); setLoading(false); } });
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { data, loading, error, setData };
}

/* Convert a DB book row → the shape the existing <Book> component expects.
   Maps strand UI key → palette colors from the visual STRANDS config. */
function bookToCardProps(dbBook) {
  if (!dbBook) return null;
  const uiKey = dbBook.strandUi || "tafiya";
  const s = STRANDS[uiKey] || STRANDS.tafiya;
  return {
    id:     dbBook.id,
    title:  dbBook.title,
    author: dbBook.bookType || s.name,
    strand: uiKey,
    level:  dbBook.levelId,
    c:      s.color,
    bg:     s.bg,
    audio:  !!dbBook.audioUrl,
    thumb:  dbBook.thumbnail_image_path || "",
    _db:    dbBook,
  };
}

Object.assign(window, { useApi, bookToCardProps });

Object.assign(window, {
  STRANDS, CHILDREN_PROFILES, SAMPLE_BOOKS, STAMP_DATA, LEVEL_TIERS,
  Avatar, StrandLogo, Stamp, Book, SectionHeader, Nav,
  shade,
});
