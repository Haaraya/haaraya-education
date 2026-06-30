/* ============================================================
   Haaraya — Home page sections
   ============================================================ */

const { useState: useStateHome } = React;

function Hero({ onNavigate }) {
  return (
    <React.Fragment>
    <section className="hero">
      <div className="hero-frame">
        <span className="hero-bracket tl"></span>
        <span className="hero-bracket tr"></span>
        <span className="hero-bracket bl"></span>
        <span className="hero-bracket br"></span>
        <div className="hero-ticks">
          <span></span><span></span><span></span>
        </div>

        <div className="hero-frame-top">
          <div className="left">
            <span className="pulse"></span>
            <span>Pre-launch · Waitlist open</span>
          </div>
          <div className="right">
            <span>Haaraya Literacy · A Nigerian Reading Journey</span>
          </div>
        </div>

        <div className="hero-body">
          <div className="hero-headline">
            <div className="eyebrow-card">
              <span className="flag" aria-hidden="true">🇳🇬</span>
              <span>Made for Nigerian children</span>
            </div>
            <h1 className="hero-h1">
              <span className="line">Every app gives</span>
              <span className="line">them books.</span>
              <span className="line">We give them a</span>
              <span className="accent">journey.</span>
            </h1>
            <p className="hero-sub-headline">
              Books that look like <em>their world.</em>
            </p>
          </div>

          <div className="hero-subject">
            <HeroPassportPreview />
          </div>

          <div className="hero-aside">
            <p>
              A structured literacy reading series purpose-built for Nigerian
              primary schools — every story rooted in Nigerian life,
              every page engineered to build a reader.
            </p>
            <div className="actions">
              <button className="btn btn-primary" onClick={() => onNavigate("passport")}>
                Open a Reading Passport
                <span aria-hidden="true">→</span>
              </button>
              <button className="btn btn-ghost-light" onClick={() => onNavigate("library")}>
                Explore the library
              </button>
            </div>
          </div>
        </div>
      <div className="hero-frame-bottom-fade" aria-hidden="true"></div>
      </div>

      </section>

      <section className="stats-section">
        <div className="wrap">
          <div className="stats-ledger-band" aria-hidden="true">
            <span className="stats-ledger-line"></span>
            <span className="stats-ledger-label">Passport Record · Summary</span>
            <span className="stats-ledger-line"></span>
          </div>

          <div className="hero-trust-strip">
            {[
              { num: "396",  lbl: "Books planned across the journey" },
              { num: "12",   lbl: "Levels, first words to fluent" },
              { num: "10",   lbl: "Reading strands, interleaved" },
              { num: "100%", lbl: "Audio narration on every book" },
            ].map((t, i) => (
              <div className="hero-trust-item" key={i}>
                <span className="entry">Entry · {String(i + 1).padStart(2, "0")} / 04</span>
                <span className="num">{t.num}</span>
                <span className="rule" aria-hidden="true"></span>
                <span className="lbl">{t.lbl}</span>
                <span className="seal" aria-hidden="true">
                  <span className="seal-inner">HE</span>
                </span>
                <span className="corner tl" aria-hidden="true"></span>
                <span className="corner br" aria-hidden="true"></span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ display: "none" }} aria-hidden="true"></section>
    </React.Fragment>
  );
}

function HeroPassportPreview() {
  return (
    <div className="hero-journey-stack">
      <img src="assets/passports-fan.png" alt="Haaraya Reading Passports — green, gold, blue and red" className="hero-passport-overlay" />
    </div>
  );
}

/* ------------ How It Works ------------ */

function HowItWorks() {
  const steps = [
    { n: 1, title: "Open a passport",   desc: "Each child gets a Reading Passport that grows with them — their reading identity, in one place." },
    { n: 2, title: "Read and listen",   desc: "Illustrated Nigerian books with audio narration on every page. Readable books, audio pages, and printable keepsakes. Not a worksheet dump." },
    { n: 3, title: "Collect stamps",    desc: "Finish a book, earn a stamp. Finish a level, earn a badge. The journey becomes a keepsake." },
    { n: 4, title: "Move up 12 levels", desc: "From first words to confident reader. Parents, teachers, and the system all guide what's next." },
  ];
  return (
    <section className="section-cream tight how-section">
      <div className="wrap">
        <div className="how-header-row">
          <SectionHeader
            eyebrow="How Haaraya works"
            title={<span className="hiw-title">A reading world, not just a book library.</span>}
            lede="One unified Reading Journey where phonics, high-frequency words, fiction, non-fiction, folktales, poetry, and longer-form stamina readers work together as one connected experience."
          />
        </div>
        <div className="steps">
          <span className="steps-route" aria-hidden="true"></span>
          {steps.map((s, i) => (
            <div className="step" key={s.n}>
              <div className="step-stamp" aria-hidden="true">
                <span className="step-stamp-ring"></span>
                <span className="step-stamp-num">{s.n}</span>
                <span className="step-stamp-label">CHKPT</span>
              </div>
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
              <span className="step-corner tl" aria-hidden="true"></span>
              <span className="step-corner br" aria-hidden="true"></span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------ Strands showcase ------------ */

function StrandsSection() {
  const order = ["hafwas", "soundables", "soundables-plus", "tafiya", "tafiya-nonfiction", "folktale", "poetry", "duniya", "stamina", "stamina-nonfiction"];

  return (
    <section className="section-sand">
      <div className="wrap">
        <SectionHeader
          eyebrow="Explore the strands"
          title={<>One journey.<br />Ten ways to read.</>}
          lede="Ten reading strands — not ten apps. They're interleaved threads inside one Haaraya journey, each with its own logo, color and personality, planned across all 12 levels."
        />
        <div className="strands-grid">
          {order.map(k => <StrandCard key={k} strand={STRANDS[k]} />)}
        </div>
      </div>
    </section>
  );
}

function StrandCard({ strand }) {
  if (strand.card) {
    return (
      <div className="strand-card-img" style={{ "--c": strand.color }} title={strand.name}>
        <img src={strand.card} alt={`${strand.name} — ${strand.vibe}`} loading="lazy" />
      </div>
    );
  }
  return (
    <div className="strand-card" style={{ "--c": strand.color, "--bg": strand.bg, "--bd": strand.bd }}>
      <div className="stripe" style={{ background: strand.color }} />
      <div className="strand-logo-frame" style={{ "--bg": strand.bg, "--bd": strand.bd }}>
        <StrandLogo strand={strand.key} height={64} />
      </div>
      <div className="strand-name" style={{
        fontFamily: "var(--font-display)",
        fontSize: 17,
        color: strand.color,
        textAlign: "center",
        marginTop: -4,
        marginBottom: 8,
        lineHeight: 1.15,
      }}>
        {strand.name}
      </div>
      <div className="meta">
        <span className="vibe" style={{ color: strand.color }}>{strand.vibe}</span>
      </div>
      <p className="desc">{strand.purpose}</p>
      <div className="foot">
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Levels
        </span>
        <span className="count" style={{ background: strand.bg, color: strand.color }}>{strand.levels}</span>
      </div>
    </div>
  );
}

/* ------------ 12-level Journey ------------ */

function JourneyPath({ onNavigate }) {
  // Hotspot positions in % of the journey illustration.
  // The map image is the background — stamps overlay on top of the baked-in marker spots.
  const DEFAULT_HOTSPOTS = [
    { lvl: 1,  x: 12.54, y: 62.56, label: "Tashi"    },
    { lvl: 2,  x: 16.57, y: 45.16, label: "Mataki"   },
    { lvl: 3,  x: 22.16, y: 62.56, label: "Hanya"    },
    { lvl: 4,  x: 35.07, y: 51.43, label: "Tafiya"   },
    { lvl: 5,  x: 45.60, y: 43.24, label: "Kwararo"  },
    { lvl: 6,  x: 49.47, y: 27.62, label: "Gada"     },
    { lvl: 7,  x: 58.68, y: 44.52, label: "Kwari"    },
    { lvl: 8,  x: 57.11, y: 55.39, label: "Tudun"    },
    { lvl: 9,  x: 68.79, y: 49.12, label: "Kololuwa" },
    { lvl: 10, x: 67.31, y: 31.08, label: "Fage"     },
    { lvl: 11, x: 80.63, y: 11.24, label: "Sarari"   },
    { lvl: 12, x: 72.66, y: 21.22, label: "Isa"      },
  ];

  const [calibrating, setCalibrating] = React.useState(() =>
    typeof window !== "undefined" && (
      new URLSearchParams(window.location.search).has("cal") ||
      (typeof localStorage !== "undefined" && localStorage.getItem("haaraya:cal") === "1")
    )
  );
  React.useEffect(() => {
    const sync = () => setCalibrating(localStorage.getItem("haaraya:cal") === "1");
    window.addEventListener("haaraya:cal", sync);
    return () => window.removeEventListener("haaraya:cal", sync);
  }, []);
  const wrapRef = React.useRef(null);
  const [hotspots, setHotspots] = React.useState(() => {
    if (!calibrating) return DEFAULT_HOTSPOTS;
    try {
      const saved = JSON.parse(localStorage.getItem("haaraya:journey:hotspots") || "null");
      if (Array.isArray(saved) && saved.length === 12) return saved;
    } catch {}
    return DEFAULT_HOTSPOTS;
  });

  const startDrag = (lvl) => (e) => {
    if (!calibrating) return;
    e.preventDefault();
    const wrap = wrapRef.current;
    if (!wrap) return;
    const move = (ev) => {
      const rect = wrap.getBoundingClientRect();
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      const y = ((ev.clientY - rect.top) / rect.height) * 100;
      setHotspots(prev => prev.map(h => h.lvl === lvl ? { ...h, x: +x.toFixed(2), y: +y.toFixed(2) } : h));
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  React.useEffect(() => {
    if (calibrating) {
      localStorage.setItem("haaraya:journey:hotspots", JSON.stringify(hotspots));
    }
  }, [hotspots, calibrating]);

  return (
    <section className="journey">
      <div className="wrap">
        <SectionHeader
          eyebrow="The 12-level reading journey"
          title="From first words to fluent reader."
          lede="A visible, collectible progression. Tap any level to see the books your child can read at that stage."
        />

        {calibrating && (
          <div style={{
            position: "fixed",
            top: 16, left: 16, right: 16,
            zIndex: 1000,
            background: "#1a1a1a", color: "#F5C518",
            padding: "12px 18px",
            borderRadius: 12,
            fontSize: 14, fontFamily: "ui-monospace, monospace",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,.4)",
          }}>
            <span><b>CALIBRATION MODE</b> — drag each stamp onto its target spot.</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{
                background: "transparent", color: "#F5C518", border: "1px solid #F5C518",
                padding: "8px 16px", borderRadius: 8, fontWeight: 800, cursor: "pointer",
                fontFamily: "ui-monospace, monospace", fontSize: 13,
              }} onClick={() => {
                setHotspots(DEFAULT_HOTSPOTS);
              }}>Reset</button>
              <button style={{
                background: "#F5C518", color: "#1a1a1a", border: 0,
                padding: "8px 18px", borderRadius: 8, fontWeight: 800, cursor: "pointer",
                fontFamily: "ui-monospace, monospace", fontSize: 13,
              }} onClick={() => {
                const out = JSON.stringify(hotspots, null, 2);
                navigator.clipboard.writeText(out).then(
                  () => alert("Copied to clipboard. Paste back into chat.\n\n" + out),
                  () => prompt("Copy these values:", out)
                );
              }}>Copy values</button>
            </div>
          </div>
        )}

        <div className="journey-image-wrap" ref={wrapRef}>
          <img
            src="assets/journey.png"
            alt="Haaraya 12-level reading journey"
            className="journey-image"
            draggable="false"
          />
          {hotspots.map(h => (
            <button
              key={h.lvl}
              className="journey-stamp"
              style={{
                left: `${h.x}%`,
                top: `${h.y}%`,
                cursor: calibrating ? "grab" : "pointer",
              }}
              onMouseDown={startDrag(h.lvl)}
              onClick={(e) => { if (!calibrating) onNavigate("library", { levelId: h.lvl }); }}
              aria-label={`Level ${h.lvl} — ${h.label}: see books`}
              title={`L${h.lvl} · ${h.label}`}
            >
              <img
                src={`assets/stamp-l${h.lvl}.png`}
                alt=""
                className="journey-stamp-img"
                draggable="false"
              />
              {calibrating && (
                <span style={{
                  position: "absolute",
                  bottom: "100%", left: "50%",
                  transform: "translateX(-50%)",
                  background: "#1a1a1a", color: "#F5C518",
                  fontFamily: "ui-monospace, monospace", fontSize: 10,
                  padding: "2px 6px", borderRadius: 4,
                  whiteSpace: "nowrap", pointerEvents: "none",
                  marginBottom: 4,
                }}>L{h.lvl}: {h.x.toFixed(1)}, {h.y.toFixed(1)}</span>
              )}
            </button>
          ))}
        </div>

        <div className="journey-legend">
          {LEVEL_TIERS.map(t => (
            <div className="journey-legend-item" key={t.range}>
              <span className="swatch" style={{ background: t.color }} />
              <span><strong>{t.range}</strong> · {t.family} · {t.meaning}</span>
            </div>
          ))}
          <div className="journey-legend-item" style={{ marginLeft: "auto" }}>
            <button className="btn btn-forest btn-sm" onClick={() => onNavigate("library")}>
              Browse all 396 books →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------ Passport feature ------------ */

function PassportFeature({ onNavigate }) {
  return (
    <section className="passport-feature">
      <div className="wrap">
        <div className="passport-feature-head">
          <SectionHeader
            eyebrow="The Reading Passport"
            title="A keepsake, not a leaderboard."
            lede="The Passport is Haaraya's heart. Children earn a stamp for every book they truly finish, badges for each level they complete, and special pages for reading milestones. It is a record of their journey, not a points race."
          />
        </div>
        <div className="passport-feature-showcase">
          <img
            src="assets/level6-on-journey.png"
            alt="A child's completed Level 6 Reading Passport page, layered over the Haaraya 12-level reading journey map"
          />
        </div>
        <div style={{ textAlign: "center" }}>
          <button className="btn btn-forest" style={{ marginTop: 32 }} onClick={() => onNavigate("passport")}>
            Open the Passport →
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------ Library teaser ------------ */

/* Official Haaraya strands, grouped into rows for the "Browse by strand" rail.
   Row 3 holds the whole Tafiya-branded family together. */
const STRAND_ROWS = [
  ["hafwas", "soundables", "soundables-plus"],
  ["folktale", "poetry"],
  ["tafiya", "tafiya-nonfiction", "duniya", "stamina", "stamina-nonfiction"],
];

/* Two curated shelves — Path (recommended for the reader now) and Fun (free reads).
   `tag` is subtle content metadata, never a navigation category.
   `level` drives which passport seal (stamp-lN.png) is stamped on the cover. */
const PATH_BOOKS = [
  { id: "p1", title: "Mama's Market Morning", strand: "tafiya-nonfiction", level: 5, tag: "everyday life" },
  { id: "p2", title: "Grandma's Compound",    strand: "tafiya",            level: 4, tag: "family story" },
  { id: "p3", title: "Rain on the Iroko",     strand: "poetry",            level: 4, tag: "everyday life" },
  { id: "p4", title: "Bisi and the Bell",     strand: "soundables",        level: 5, tag: "funny story" },
];
const FUN_BOOKS = [
  { id: "f1", title: "Anansi's Quiet Trick",  strand: "folktale",          level: 6, tag: "animal story" },
  { id: "f2", title: "Lagos by Lamplight",    strand: "stamina",           level: 8, tag: "adventure story" },
  { id: "f3", title: "The Whole Street Helps",strand: "tafiya",            level: 3, tag: "community story" },
  { id: "f4", title: "The Snow Hare's Gift",  strand: "duniya",            level: 7, tag: "animal story" },
];

function CatalogueCard({ book, onOpen }) {
  const s = STRANDS[book.strand];
  return (
    <article
      className="cat-card"
      style={{ "--cloth": s.color, "--cloth-bd": s.bd }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
    >
      <div className="cat-cover">
        <span className="cat-cover-frame" aria-hidden="true" />
        <span className="cat-cover-mark">
          <StrandLogo strand={book.strand} height={24} dark />
        </span>
        <div className="cat-cover-text">
          <h4 className="cat-cover-title">{book.title}</h4>
        </div>
        <img
          className="cat-seal"
          src={`assets/stamp-l${book.level}.png`}
          alt={`Level ${book.level} seal`}
          loading="lazy"
        />
      </div>
      <div className="cat-meta">
        <div className="cat-spine">
          <span className="cat-strand-tag">
            <i style={{ background: s.color }} />
            {s.name}
          </span>
          <span className="cat-leader" aria-hidden="true" />
          <span className="cat-level">L{book.level}</span>
        </div>
        <div className="cat-undertag">
          <span className="cat-ctag">{book.tag}</span>
          <span className="cat-stampnote" title="Completed books earn a passport stamp">
            <span className="cat-stampnote-seal" aria-hidden="true">✦</span>
            earns a stamp
          </span>
        </div>
      </div>
    </article>
  );
}

function LibraryTeaser({ onNavigate }) {
  return (
    <section className="library library--teaser">
      <div className="wrap">
        <SectionHeader
          center
          eyebrow="The library"
          title="Explore the Haaraya reading journey."
          lede="Discover books across Haaraya&rsquo;s reading strands, levels, stories, poems, folktales, and practice paths."
        />

        <div className="lib-teaser-strands" aria-hidden="true">
          {STRAND_ROWS.flat().map(key => (
            <span className="lib-teaser-logo" key={key} title={STRANDS[key].name}>
              <StrandLogo strand={key} height={56} />
            </span>
          ))}
        </div>

        <div className="lib-teaser-cta">
          <button className="btn btn-forest btn-lg" onClick={() => onNavigate("library")}>
            View the Library &rarr;
          </button>
        </div>
      </div>
    </section>
  );
}

/* ------------ Dashboards preview tabbed ------------ */

function DashboardsPreview({ onNavigate }) {
  const [tab, setTab] = useStateHome("child");
  return (
    <section className="dashboards">
      <div className="wrap">
        <SectionHeader
          eyebrow="One platform, three dashboards"
          title="Made for the people who use it."
          lede="A child-rich storybook world for readers. Clear progress for parents. Real assignment tools for teachers and schools."
        />

        <div className="tab-row">
          <button className={`tab ${tab === "child" ? "active" : ""}`} onClick={() => setTab("child")}>
            Child
          </button>
          <button className={`tab ${tab === "parent" ? "active" : ""}`} onClick={() => setTab("parent")}>
            Parent
          </button>
          <button className={`tab ${tab === "teacher" ? "active" : ""}`} onClick={() => setTab("teacher")}>
            Teacher
          </button>
        </div>

        {tab === "child" && <DashChildPreview onNavigate={onNavigate} />}
        {tab === "parent" && <DashParentPreview onNavigate={onNavigate} />}
        {tab === "teacher" && <DashTeacherPreview />}
      </div>
    </section>
  );
}

function DashChildPreview({ onNavigate }) {
  // Real catalogue books (with cover thumbnails) for the “Keep reading” preview.
  const keepReading = React.useMemo(() => {
    const T = window.TafiyaData;
    const list = T ? T.sortedCatalog() : [];
    return list.slice(0, 3).map(b => {
      const code = b.book_code || b.code;
      const uiKey = window.TafiyaBooks ? TafiyaBooks.strandUiOf(b) : "tafiya";
      const s = (window.STRANDS && window.STRANDS[uiKey]) || {};
      return {
        id: code, title: b.title, author: b.book_type || "",
        strand: uiKey, level: window.TafiyaBooks ? TafiyaBooks.levelNum(b) : b.level,
        c: s.color, bg: s.bg, thumb: b.thumbnail_image_path || "",
      };
    });
  }, []);
  return (
    <div className="dash">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <img src="assets/logo-haaraya-literacy.png" alt="Haaraya Literacy" />
          
        </div>
        <nav className="dash-nav">
          <a className="active"><span className="nav-icon" /> My Books</a>
          <a><span className="nav-icon" /> My Passport</a>
          <a><span className="nav-icon" /> Library</a>
          <a><span className="nav-icon" /> Assignments</a>
          <a><span className="nav-icon" /> Audio</a>
        </nav>
      </aside>
      <div className="dash-main">
        <div className="dash-child-hero">
          <Avatar name="Kaha" color="#E65100" size={72} />
          <div className="greet">
            <h4>Hi there, Kaha!</h4>
            <div className="level">Level 7 · Kwari</div>
            <div className="sub" style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600, marginTop: 4 }}>14 books completed</div>
          </div>
          <div className="stat">
            <div className="num">36</div>
            <div className="lbl">Stamps earned</div>
          </div>
        </div>
        <div className="dash-child-grid">
          <div className="dash-card">
            <h5>Keep reading</h5>
            <div className="dash-mini-books">
              {keepReading.map(b => <Book key={b.id} book={b} onClick={() => onNavigate("reader", { bookCode: b.id })} />)}
            </div>
          </div>
          <div className="dash-card">
            <h5>Recent stamps</h5>
            <div className="dash-passport-mini">
              <Stamp strand="tafiya"     title="Market" rotate={-3} />
              <Stamp strand="hafwas"     title="Bus"    rotate={3} />
              <Stamp strand="soundables" title="Run"    rotate={-2} />
              <Stamp strand="poetry"     title="Drum"   rotate={4} />
              <Stamp strand="tafiya"     title="Yams"   rotate={-4} />
              <Stamp strand="locked"     title="?" rotate={2} locked />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashParentPreview({ onNavigate }) {
  return (
    <div className="dash">
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
            <h3>Your children</h3>
            <div className="sub">3 children · Family plan · Renews 14 Aug</div>
          </div>
          <button className="btn btn-ghost-dark btn-sm">+ Add child</button>
        </div>
        <div className="kpis">
          <div className="kpi"><div className="lbl">Books read</div><div className="num">84</div><div className="delta">+12 this month</div></div>
          <div className="kpi"><div className="lbl">Reading time</div><div className="num">11h</div><div className="delta">+1.4h vs last month</div></div>
          <div className="kpi"><div className="lbl">Stamps earned</div><div className="num">96</div><div className="delta">Across 5 strands</div></div>
          <div className="kpi"><div className="lbl">Active streak</div><div className="num">9d</div><div className="delta">Family best</div></div>
        </div>
        <div className="child-rows">
          {[
            { name: "Kaha",  color: "#E65100", level: 7,  pct: 78, books: "14 / 18 books" },
            { name: "Tobi",   color: "#1565C0", level: 4,  pct: 42, books: "8 / 19 books"  },
            { name: "Chidi",  color: "#228B22", level: 10, pct: 60, books: "12 / 20 books" },
          ].map(c => (
            <div className="child-row" key={c.name}>
              <Avatar name={c.name} color={c.color} size={44} />
              <div>
                <div className="name">{c.name}</div>
                <div className="meta">{c.books} · Auto reading plan</div>
              </div>
              <div className="prog">
                <div className="lbl">Level progress</div>
                <div className="bar"><span style={{ width: `${c.pct}%` }} /></div>
              </div>
              <div className="lvl-pill">Level {c.level}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashTeacherPreview() {
  const rows = [
    { name: "Mama's Market Morning",   strand: "tafiya",     level: 5, status: "done", pct: "28 / 28" },
    { name: "The Big Big Bus",          strand: "hafwas",     level: 2, status: "progress", pct: "21 / 28" },
    { name: "Ade and the Lost Slipper", strand: "soundables", level: 3, status: "progress", pct: "18 / 28" },
    { name: "Anansi's Quiet Trick",     strand: "tafiya",     level: 6, status: "notstarted", pct: "0 / 28" },
    { name: "Rain on the Iroko",        strand: "poetry",     level: 4, status: "done", pct: "28 / 28" },
  ];
  return (
    <div className="dash">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <img src="assets/logo-haaraya-literacy.png" alt="Haaraya Literacy" />
          
        </div>
        <nav className="dash-nav">
          <a><span className="nav-icon" /> Classes</a>
          <a className="active"><span className="nav-icon" /> Assignments</a>
          <a><span className="nav-icon" /> Students</a>
          <a><span className="nav-icon" /> Reports</a>
          <a><span className="nav-icon" /> Library</a>
        </nav>
      </aside>
      <div className="dash-main">
        <div className="dash-header">
          <div>
            <h3>Primary 3B — Assignments</h3>
            <div className="sub">28 students · Mrs. Adekunle · Term 2 · Week 6</div>
          </div>
          <button className="btn btn-primary btn-sm">+ New assignment</button>
        </div>
        <table className="assign-table">
          <thead>
            <tr>
              <th style={{ width: "40%" }}>Book</th>
              <th>Strand</th>
              <th>Level</th>
              <th>Completed</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const s = STRANDS[r.strand];
              return (
                <tr key={r.name}>
                  <td>
                    <div className="book-cell">
                      <div className="book-mini" style={{ background: s.bg, "--c": s.color }} />
                      <strong>{r.name}</strong>
                    </div>
                  </td>
                  <td>
                    <StrandPill strand={r.strand} size="sm" />
                  </td>
                  <td><strong>L{r.level}</strong></td>
                  <td>{r.pct}</td>
                  <td>
                    <span className={`status ${r.status}`}>
                      {r.status === "done" ? "Complete" : r.status === "progress" ? "In progress" : "Not started"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------ Pricing / Waitlist ------------ */

function Pricing() {
  const tiers = [
    {
      for: "Individual",
      name: "Individual",
      blurb: "For one child beginning or continuing their Haaraya reading journey.",
      features: ["One child profile", "Full reading library", "Reading Passport & stamps", "Auto reading plan"],
      cta: "Join the waitlist",
    },
    {
      for: "Home",
      name: "Home",
      blurb: "For parents and caregivers supporting up to four children in one household.",
      features: ["Up to four child profiles", "One shared household", "Parent dashboard", "Far better value than four Individual plans"],
      cta: "Join the waitlist",
    },
    {
      for: "School",
      name: "School",
      blurb: "For schools assigning books, supporting pupils, and tracking reading progress.",
      features: ["Pupil profiles", "Teacher dashboard", "Class & progress reports", "Strand-aligned assignments", "School-wide rollout"],
      cta: "Request school access",
      featured: true,
    },
    {
      for: "Community",
      name: "Community",
      blurb: "For churches, NGOs, reading clubs, sponsors, and community groups supporting many children.",
      features: ["Many child profiles", "Group reading mode", "Sponsor & cohort reporting", "Onboarding support"],
      cta: "Request community access",
    },
  ];
  return (
    <section className="pricing">
      <div className="wrap">
        <SectionHeader
          eyebrow="Pricing"
          title="Built for every kind of reader."
          lede="Four ways to bring Haaraya to children — one child, a whole household, a school, or a community. Pricing isn't finalised yet; join the waitlist for launch pricing."
        />
        <div className="tiers">
          {tiers.map(t => (
            <div className={`tier ${t.featured ? "featured" : ""}`} key={t.name}>
              {t.featured && <div className="tier-ribbon">Best value</div>}
              <div className="for">{t.for}</div>
              <h4>{t.name}</h4>
              <div className="price-soon">Launch pricing coming soon</div>
              <p className="blurb">{t.blurb}</p>
              <ul>{t.features.map(f => <li key={f}>{f}</li>)}</ul>
              <button className={`btn ${t.featured ? "btn-primary" : "btn-ghost-dark"}`}>
                {t.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------ Footer ------------ */

function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div className="footer-top">
          <div>
            <div className="seal-big"><img src="assets/logo-haaraya-education.png" alt="Haaraya Education" /></div>
            <div className="pub">Published by</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "white", marginBottom: 12 }}>
              Haaraya Education
            </div>
            <p style={{ fontSize: 14, opacity: 0.7, maxWidth: 320, color: "rgba(255,255,255,0.85)" }}>
              A Nigerian publishing house building a literacy universe — Haaraya Literacy, Haaraya History, and the reading worlds in between.
            </p>
          </div>
          <div>
            <h5>The platform</h5>
            <div className="links">
              <a href="#">How it works</a>
              <a href="#">The strands</a>
              <a href="#">12-level journey</a>
              <a href="#">Reading Passport</a>
              <a href="#">Library</a>
            </div>
          </div>
          <div>
            <h5>For you</h5>
            <div className="links">
              <a href="#">Parents</a>
              <a href="#">Schools</a>
              <a href="#">Diaspora families</a>
              <a href="#">Reading clubs &amp; churches</a>
              <a href="#">NGOs</a>
            </div>
          </div>
          <div>
            <h5>Company</h5>
            <div className="links">
              <a href="#">About Haaraya</a>
              <a href="#">Authors &amp; characters</a>
              <a href="#">Press</a>
              <a href="#">Contact</a>
              <a href="#">Careers</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div>© 2026 Haaraya Education. Made for Nigerian children.</div>
          <div style={{ display: "flex", gap: 24 }}>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Child safety</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ------------ Compose Home ------------ */

function HomePage({ onNavigate }) {
  return (
    <>
      <Hero onNavigate={onNavigate} />
      <HowItWorks />
      <StrandsSection />
      <PassportFeature onNavigate={onNavigate} />
      <LibraryTeaser onNavigate={onNavigate} />
      <DashboardsPreview onNavigate={onNavigate} />
      <Pricing />
      <Footer />
    </>
  );
}

Object.assign(window, {
  Hero, HowItWorks, StrandsSection, JourneyPath,
  PassportFeature, LibraryTeaser, DashboardsPreview,
  Pricing, Footer, HomePage,
});
