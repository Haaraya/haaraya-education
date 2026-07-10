/* ============================================================
   Haaraya Odyssey - The 100 Book Challenge
   • OdysseySection - premium band on the Home page
   • OdysseyScreen  - the dedicated Odyssey landing page (#odyssey)
   Extends the existing Haaraya component + design system.
   ============================================================ */

const { useState: useStateOdy } = React;

/* Shared data ------------------------------------------------ */

const ODY_PATHWAY = [
  { k: "Learn to Read",       s: "Phonics & first words",     state: "done" },
  { k: "Become a Reader",     s: "12 levels, fluent at last", state: "done" },
  { k: "The Haaraya Odyssey", s: "Reading to learn",          state: "now"  },
  { k: "Read 100 Great Books", s: "A lifetime of reading",    state: "next" },
];

/* "How it fits" — collectible storybook milestone plaques */
const ODY_FIT = [
  { k: "Learn to Read",        s: "Phonics & first words",     token: "assets/learn.png", theme: "green" },
  { k: "Become a Reader",      s: "12 levels, fluent at last", token: "assets/become.png",  theme: "olive" },
  { k: "The Haaraya Odyssey",  s: "Reading to learn",          token: "assets/odyssey.png", theme: "navy", hero: true },
  { k: "Read 100 Great Books", s: "A lifetime of reading",     token: "assets/books.png",   theme: "gold" },
];

const ODY_MILESTONES = [
  { n: 1,   cap: "Set sail",       note: "Your first great book",  state: "done" },
  { n: 10,  cap: "Bronze",         note: "First milestone",         state: "done" },
  { n: 25,  cap: "Silver",         note: "Finding your stride",    state: "done" },
  { n: 50,  cap: "Halfway",        note: "Gold reader",            state: "now"  },
  { n: 75,  cap: "Voyager",        note: "The long haul",          state: "next" },
  { n: 100, cap: "Grand Voyager",  note: "The full odyssey",       state: "next" },
];

const ODY_CATEGORIES = [
  { key: "stories",   name: "Tafiya Tales", cls: "ody-cat-stories",   desc: "Novels, tales and worlds to get lost inside.",            n: 18, token: "assets/w-stories.png"   },
  { key: "adventure", name: "Adventure", cls: "ody-cat-adventure", desc: "Journeys, quests and daring escapes.",                    n: 12, token: "assets/w-adventure.png" },
  { key: "mystery",   name: "Mystery",   cls: "ody-cat-mystery",   desc: "Clues, puzzles and secrets to unravel.",                  n: 8,  token: "assets/w-mystery.png"   },
  { key: "science",   name: "Science",   cls: "ody-cat-science",   desc: "How the world works, from atoms to galaxies.",            n: 11, token: "assets/w-science.png"   },
  { key: "nature",    name: "Nature",    cls: "ody-cat-nature",    desc: "Animals, plants and the living planet.",                  n: 10, token: "assets/w-nature.png"    },
  { key: "history",   name: "History",   cls: "ody-cat-history",   desc: "Empires, heroes and the story of us.",                    n: 9,  token: "assets/w-history.png"   },
  { key: "biography", name: "Biography", cls: "ody-cat-biography", desc: "Real lives that changed the world.",                      n: 8,  token: "assets/w-biography.png" },
  { key: "geography", name: "Geography", cls: "ody-cat-geography", desc: "Places, peoples and journeys across the map.",            n: 7,  token: "assets/w-geography.png" },
  { key: "poetry",    name: "Poetry",    cls: "ody-cat-poetry",    desc: "Rhythm, verse and words that sing.",                      n: 9,  token: "assets/w-poetry.png"    },
  { key: "culture",   name: "Culture",   cls: "ody-cat-culture",   desc: "Traditions, festivals and life across Nigeria.",          n: 8,  token: "assets/w-culture.png"   },
];

const ODY_ACHIEVEMENTS = [
  { name: "Bronze Reader",   req: "10 books",  medal: "medal-bronze",   glyph: "10", state: "done" },
  { name: "Silver Reader",   req: "25 books",  medal: "medal-silver",   glyph: "25", state: "done" },
  { name: "Gold Reader",     req: "50 books",  medal: "medal-gold",     glyph: "50", state: "now"  },
  { name: "Odyssey Explorer", req: "6 categories", medal: "medal-explorer", glyph: "✦", state: "now" },
  { name: "Master Reader",   req: "75 books",  medal: "medal-master",   glyph: "75", state: "next" },
  { name: "Grand Voyager",   req: "100 books", medal: "medal-voyager",  glyph: "100", state: "next" },
];

/* ============================================================
   HOME PAGE SECTION
   ============================================================ */
function OdysseySection({ onNavigate }) {
  return (
    <section className="ody-home">
      <div className="wrap">
        <div className="ody-home-grid">
          <div className="ody-home-copy">
            <div className="ody-home-eyebrow">The next chapter</div>
            <img
              className="ody-home-logo"
              src="assets/odyssey-logo-white-trim.png"
              alt="Haaraya Odyssey"
            />
            <p className="ody-home-body">
              You've learned to read. Now discover the <strong>joy</strong> of reading.
              Travel through stories, science, history, mysteries, biographies, adventures
              and amazing ideas from around the world, earning badges and completing your
              own reading journey.
            </p>
            <div className="ody-home-actions">
              <button className="btn btn-gold" onClick={() => onNavigate("odyssey")}>
                Start the Odyssey <span aria-hidden="true">→</span>
              </button>
              <button className="btn btn-ghost-light" onClick={() => onNavigate("odyssey-library")}>
                Browse the 100 Books
              </button>
            </div>
          </div>

          <div className="ody-path">
            <div className="ody-path-title">The Haaraya Journey</div>
            {ODY_PATHWAY.map((p, i) => (
              <div key={p.k} className={`ody-path-step ${p.state}`}>
                <div className="ody-path-node">
                  {p.state === "next" ? (i + 1) : (p.state === "now" ? "★" : "✓")}
                </div>
                <div className="ody-path-label">
                  <span className="k">{p.k}</span>
                  <span className="s">{p.s}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   LANDING PAGE
   ============================================================ */
function OdysseyHero({ onNavigate }) {
  return (
    <section className="ody-hero">
      <div className="wrap">
        <div className="ody-hero-grid">
          <div className="ody-hero-copy">
            <img
              className="ody-hero-logo"
              src="assets/odyssey-logo-forest.png"
              alt="Haaraya Odyssey — The 100 Book Challenge"
            />
            <p className="ody-hero-tag">One Incredible Journey</p>
            <p className="ody-hero-sub">
              You can read anything now, so this is where reading becomes truly yours.
              The Odyssey is the next chapter after becoming a confident reader: one hundred
              great books and ten worlds of stories, history, science and discovery, with a
              path you chart yourself. Time to set sail.
            </p>
            <div className="ody-hero-actions">
              <button className="btn btn-gold btn-lg" onClick={() => onNavigate("odyssey-library")}>
                Start the Odyssey <span aria-hidden="true">→</span>
              </button>
              <button className="btn btn-ghost-dark btn-lg" onClick={() => onNavigate("odyssey-library")}>
                Explore the Library
              </button>
            </div>
            <div className="ody-hero-meta">
              <div className="m"><span className="n">100</span><span className="l">Books</span></div>
              <div className="m"><span className="n">10</span><span className="l">Worlds to Explore</span></div>
            </div>
          </div>

          {/* Odyssey hero artwork */}
          <div className="ody-hero-art">
            <span className="ody-art-corner tl" aria-hidden="true"></span>
            <span className="ody-art-corner tr" aria-hidden="true"></span>
            <span className="ody-art-corner bl" aria-hidden="true"></span>
            <span className="ody-art-corner br" aria-hidden="true"></span>
            <img
              className="ody-hero-img"
              src="assets/odyssey_hero.png"
              alt="An open storybook beside a lantern, compass and golden medals, looking out over an island sea at sunset"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function OdysseyPathwayBand() {
  return (
    <section className="ody-section tight ody-band-sand">
      <div className="wrap">
        <SectionHeader
          center
          eyebrow="How it fits"
          title="The next chapter, not a new book."
          lede="The Odyssey picks up exactly where the Haaraya literacy journey ends. The natural continuation once a child can truly read."
        />
        <div className="ody-fit">
          {ODY_FIT.map((p, i) => (
            <React.Fragment key={p.k}>
              <article className={`ody-plaque theme-${p.theme} ${p.hero ? "is-hero" : ""}`}>
                {p.hero && <span className="ody-plaque-flag">You are here</span>}
                <div className="ody-plaque-holder">
                  <img className="ody-plaque-token" src={p.token} alt="" loading="lazy" />
                </div>
                <h4 className="ody-plaque-title">{p.k}</h4>
                <p className="ody-plaque-sub">{p.s}</p>
              </article>
              {i < ODY_FIT.length - 1 && (
                <span className="ody-fit-arrow" aria-hidden="true">
                  <svg viewBox="0 0 42 16" width="42" height="16"><path d="M2 8 H33" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="1 6" /><path d="M31 2 L39 8 L31 14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

function OdysseyJourney() {
  return (
    <section className="ody-section ody-band-deep">
      <div className="wrap">
        <SectionHeader
          eyebrow="The reading journey"
          title="One hundred books. One great voyage."
          lede="Every book moves you farther across your Odyssey map, earning a badge for every rank you reach."
        />
        <div className="ody-journey-track" style={{ "--ody-progress": "42%" }}>
          {ODY_MILESTONES.map(m => (
            <div key={m.n} className={`ody-mile ${m.state}`}>
              <div className="ody-mile-seal">
                <span className="num">{m.n}</span>
                <span className="of">{m.n === 1 ? "book" : "books"}</span>
              </div>
              <div className="ody-mile-cap">{m.cap}</div>
              <div className="ody-mile-note">{m.note}</div>
            </div>
          ))}
        </div>
        <div className="ody-journey-legend">
          <span><span className="dot" style={{ background: "var(--ody-gold)" }}></span>Completed</span>
          <span><span className="dot" style={{ background: "rgba(245,197,24,.3)", border: "1px solid var(--ody-gold)" }}></span>In progress</span>
          <span><span className="dot" style={{ background: "rgba(255,255,255,.15)" }}></span>Ahead of you</span>
        </div>
      </div>
    </section>
  );
}

function OdysseyDashboard() {
  const kpis = [
    { label: "Books read",    num: "42", sub: "of 100 · +6 this month" },
    { label: "Current streak", num: <React.Fragment>12<small> days</small></React.Fragment>, sub: "Your longest yet" },
    { label: "Badges earned", num: "3", sub: "Bronze · Silver · Explorer" },
    { label: "Reading time",  num: <React.Fragment>41<small>h</small></React.Fragment>, sub: "Since you set sail" },
    { label: "Categories",    num: <React.Fragment>7<small>/10</small></React.Fragment>, sub: "Worlds explored" },
  ];
  return (
    <section className="ody-section ody-band-cream">
      <div className="wrap">
        <SectionHeader
          title="Every reader gets a captain's log."
          lede="A calm, beautiful dashboard, not a leaderboard. It shows how far you've come and gently points to what's next."
        />
        <div className="ody-dash">
          <div className="ody-dash-head">
            <div className="ody-dash-avatar">K</div>
            <div className="who">
              <h4>Kaha's Odyssey</h4>
              <div className="sub">Set sail 14 March · 42 books in</div>
            </div>
            <div className="rank">
              <div className="r-label">Current rank</div>
              <div className="r-name">Gold Reader</div>
            </div>
          </div>
          <div className="ody-kpis">
            {kpis.map(k => (
              <div className="ody-kpi" key={k.label}>
                <div className="k-label">{k.label}</div>
                <div className="k-num">{k.num}</div>
                <div className="k-sub">{k.sub}</div>
              </div>
            ))}
          </div>
          <div className="ody-dash-foot">
            <div className="cur">
              <div className="lbl">Current challenge</div>
              <div className="bookname">Read 3 Biography books to unlock the Historian badge</div>
            </div>
            <div className="ody-dash-progress">
              <div className="bar"><span style={{ width: "42%" }}></span></div>
              <div className="pct">42 / 100 books</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OdysseyCategories({ onNavigate }) {
  return (
    <section className="ody-section ody-band-sand">
      <div className="wrap">
        <SectionHeader
          eyebrow="Ten worlds"
          title="Read widely. Read the whole world."
          lede="Ten worlds wait on your Odyssey map, each a destination full of books to discover. Explore them all and you don't just read more, you read the whole world."
        />
        <div className="ody-cats">
          {ODY_CATEGORIES.map(c => (
            <button key={c.key} type="button" className={`ody-cat ${c.cls}`}
              onClick={() => onNavigate && onNavigate("odyssey-library", { world: c.key })}>
              <div className="ody-cat-token">
                <img src={c.token} alt="" loading="lazy" />
              </div>
              <h4>{c.name}</h4>
              <p>{c.desc}</p>
              <span className="ody-cat-go">Explore this world <span aria-hidden="true">→</span></span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function OdysseyAchievements() {
  return (
    <section className="ody-section ody-band-deep">
      <div className="wrap">
        <SectionHeader
          eyebrow="Reader ranks"
          title="Earn your place, one book at a time."
          lede="Six ranks mark the voyage: elegant seals to be proud of, not points to chase. Each is earned by reading, never bought."
        />
        <div className="ody-achievements">
          {ODY_ACHIEVEMENTS.map(a => (
            <div key={a.name} className={`ody-ach ${a.state === "next" ? "locked" : ""}`}>
              <div className={`ody-ach-medal ${a.medal}`}>{a.glyph}</div>
              <h4>{a.name}</h4>
              <div className="req">{a.req}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OdysseyParentsTeachers() {
  const points = [
    { h: "Track progress",       p: "See books read, streaks and categories at a glance, for one child or a whole class." },
    { h: "Celebrate milestones", p: "Get a nudge whenever a child earns a badge or reaches a reading milestone." },
    { h: "Encourage independence", p: "The Odyssey is child-led. Readers choose their own books from a curated, age-right shelf." },
  ];
  return (
    <section className="ody-section ody-band-sand">
      <div className="wrap">
        <SectionHeader
          eyebrow="For parents & teachers"
          title="Quietly powerful for the grown-ups."
          lede="Everything you need to support the reader in your life, without turning reading into a chore."
        />
        <div className="ody-pt-grid">
          {points.map(pt => (
            <div className="ody-pt" key={pt.h}>
              <div className="ody-pt-ic"><span></span></div>
              <h4>{pt.h}</h4>
              <p>{pt.p}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function OdysseyShipmateScribe() {
  const [open, setOpen] = useStateOdy(false);
  const ScribeUI = window.ShipmateScribeUI;
  const demoBook = { book_code: "book_012", book_title: "The Red Cap", book_number: 12, level: "Level 3" };
  return (
    <section className="ody-section ody-band-deep">
      <div className="wrap">
        <SectionHeader
          center
          eyebrow="Shipmate Scribe"
          title="The Captain speaks. The Shipmate writes."
          lede="After every book, jot a few Captain’s Notes. Your loyal Shipmate Scribe spins them into a short adventure log for your Odyssey."
        />
        <div className="ody-scribe-cta">
          {ScribeUI ? (
            <button className="ody-scribe-demo" type="button" onClick={() => setOpen(true)}>
              <span aria-hidden="true">&#x1F58B;</span> Try the Captain’s Log
            </button>
          ) : null}
        </div>
      </div>
      {open && ScribeUI ? <ScribeUI book={demoBook} onClose={() => setOpen(false)} /> : null}
    </section>
  );
}

function OdysseyCTA({ onNavigate }) {
  return (
    <section className="ody-cta">
      <div className="wrap">
        <h2>Your <span className="gold">odyssey</span> is waiting.</h2>
        <p>One hundred books. A lifetime of reading. It begins with a single page.</p>
        <div className="ody-cta-actions">
          <button className="btn btn-gold btn-lg btn-logo" aria-label="Start the Odyssey" onClick={() => onNavigate("odyssey-library")}>
            <img className="btn-logo-odyssey" src="assets/odyssey-logo-forest.png" alt="The Odyssey" />
            <span aria-hidden="true">→</span>
          </button>
          <button className="btn btn-ghost-dark btn-lg btn-logo" aria-label="Back to Haaraya Literacy" onClick={() => onNavigate("home")}>
            <img className="btn-logo-literacy" src="assets/logo-haaraya-literacy.png" alt="Haaraya Literacy" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   SIX STAGES / MEDAL CASE  (ported from the standalone Odyssey pages)
   ============================================================ */
const ODY_STAGE_DATA = (window.ODYSSEY && window.ODYSSEY.stages) ? window.ODYSSEY : {
  totalBooks: 100, completedBooks: 22, currentBook: 23, reader: "Amaka",
  stages: [
    { name: "Wonder Stage",   medal: "Nsude Wonder",   medalFile: "odyssey_nsude_wonder.png",  start: 1,  end: 15  },
    { name: "Explorer Stage", medal: "Ocean Explorer", medalFile: "odyssey_ocean_explorer.png", start: 16, end: 30  },
    { name: "Story Stage",    medal: "Story Spell",    medalFile: "odyssey_story_spell.png",    start: 31, end: 45  },
    { name: "Quest Stage",    medal: "Code Quest",     medalFile: "odyssey_code_quest.png",     start: 46, end: 60  },
    { name: "Spark Stage",    medal: "Power Spark",    medalFile: "odyssey_power_spark.png",     start: 61, end: 80  },
    { name: "Legend Stage",   medal: "Odyssey Legend", medalFile: "odyssey_legend.png",          start: 81, end: 100 }
  ]
};
const ODY_LIGHT_IMG = {
  empty:   "assets/odyssey-booklight-empty.png",
  complete:"assets/odyssey-booklight-complete.png",
  current: "assets/odyssey-booklight-current.png",
};
function odyLightState(n, O) {
  if (n < O.currentBook) return "complete";
  if (n === O.currentBook) return "current";
  return "empty";
}

function OdysseyStages({ onNavigate }) {
  const O = ODY_STAGE_DATA;
  return (
    <section className="ody-section ody-band-cream">
      <div className="wrap">
        <div className="odh-stages">
          <div className="odh-stages-head">
            <div className="eb">The Journey</div>
            <h2>Six stages, six medals</h2>
            <p>Travel stage by stage. Each one ends with a satin-gold medal for your case.</p>
          </div>
          <div className="odh-stage-row">
            {O.stages.map((s, i) => {
              let st, tag;
              if (O.completedBooks >= s.end) { st = "done"; tag = "Unlocked"; }
              else if (O.currentBook >= s.start && O.currentBook <= s.end) {
                const done = Math.max(0, Math.min(s.end, O.completedBooks) - (s.start - 1));
                st = "prog"; tag = `${done} / ${s.end - s.start + 1}`;
              } else { st = "locked"; tag = "Locked"; }
              return (
                <div key={s.name} className={`odh-stage-card ${st}`}>
                  <div className="medal"><img src={`assets/${s.medalFile}`} alt={`${s.medal} medal`} /></div>
                  <div className="snum">Stage {i + 1}</div>
                  <div className="sname">{s.name}</div>
                  <div className="srange">Books {s.start}–{s.end}</div>
                  <div className="stag">{tag}</div>
                </div>
              );
            })}
          </div>
          <div className="ody-stages-cta">
            <button className="btn btn-gold btn-lg" onClick={() => onNavigate("odyssey-medals")}>
              See my Medal Case <span aria-hidden="true">→</span>
            </button>
            <div className="ody-stages-note">
              <h3>One hundred books. One great voyage.</h3>
              <p>Every book moves you farther across your Odyssey map, earning a badge for every rank you reach.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function OdysseyMedals({ onNavigate }) {
  const Footer = window.Footer;
  const O = ODY_STAGE_DATA;
  const pct = Math.round((O.completedBooks / O.totalBooks) * 100);
  const unlocked = O.stages.filter(s => O.completedBooks >= s.end).length;
  const titles = window.ODYSSEY_TITLES || {};
  const codes = window.ODYSSEY_CODES || {};
  const openBook = (code) => { if (code) onNavigate("odyssey-reader", { bookCode: code }); };
  const lockSvg = (
    <span className="lock">
      <svg viewBox="0 0 24 24" fill="none" stroke="#f6dfa1" strokeWidth="2">
        <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
    </span>
  );
  return (
    <main className="odx ody-medals-page">
      <section className="odm-head">
        <div className="odx-wrap">
          <button className="btn btn-ghost-dark btn-sm ody-medals-back" onClick={() => onNavigate("odyssey")}>← The Odyssey</button>
          <p className="odm-eyebrow">Your Collection</p>
          <h1>My Odyssey Medals</h1>
          <p className="sub">Read 100 books. Light every book-light. Unlock every medal.</p>
          <div className="odm-prog">
            <div className="odm-prog-top">
              <div className="n"><b>{O.completedBooks}</b> of {O.totalBooks} books completed</div>
              <div className="pct">{pct}%</div>
            </div>
            <div className="odm-bar"><span style={{ width: pct + "%" }}></span></div>
          </div>
          <div className="odm-summary">
            <div className="st"><div className="v"><em>{unlocked}</em> / 6</div><div className="l">Medals unlocked</div></div>
            <div className="st"><div className="v">{O.completedBooks}</div><div className="l">Book-lights lit</div></div>
            <div className="st"><div className="v">{O.totalBooks - O.completedBooks}</div><div className="l">Books to go</div></div>
          </div>
        </div>
      </section>

      <section className="odm-case-wrap">
        <div className="odm-case">
          <div className="odm-case-inner">
            <div className="odm-crest">
              <img className="odm-crest-logo" src="assets/odyssey-logo-white-trim.png" alt="The Odyssey · 100 Book Challenge" />
              <span className="lbl">{O.reader ? `${O.reader}'s Medal Case` : "The Odyssey Medal Case"}</span>
            </div>
            <div className="odm-stations">
              {O.stages.map((s, i) => {
                const isLegend = i === O.stages.length - 1;
                const total = s.end - s.start + 1;
                const doneInStage = Math.max(0, Math.min(s.end, O.completedBooks) - (s.start - 1));
                let state, statusTxt;
                if (O.completedBooks >= s.end) { state = "unlocked"; statusTxt = "Medal unlocked"; }
                else if (O.currentBook >= s.start && O.currentBook <= s.end) { state = "progress"; statusTxt = `${doneInStage} of ${total} read`; }
                else { state = "locked"; statusTxt = "Locked"; }
                const lights = [];
                for (let n = s.start; n <= s.end; n++) {
                  const ls = odyLightState(n, O);
                  const bookTitle = titles[n] || ("Book " + n);
                  const code = codes[n] || "";
                  const clickable = (ls === "complete" || ls === "current") && code;
                  const verb = ls === "current" ? "Continue reading" : "Open book";
                  lights.push(
                    <span
                      key={n}
                      className={"bl " + ls + (clickable ? " bl-link" : "")}
                      tabIndex={0}
                      role={clickable ? "button" : undefined}
                      onClick={clickable ? () => openBook(code) : undefined}
                      onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openBook(code); } } : undefined}
                      aria-label={`Book ${n}: ${bookTitle}`}
                    >
                      <img src={ODY_LIGHT_IMG[ls]} alt="" />
                      <span className="bl-tip"><b>Book {n}</b>{bookTitle}{clickable ? <span className="bl-tip-go">{verb} →</span> : null}</span>
                    </span>
                  );
                }
                return (
                  <React.Fragment key={s.name}>
                    <div className={`odm-st ${state} ${isLegend ? "legend" : ""}`}>
                      <div className="odm-slot">
                        <img src={`assets/${s.medalFile}`} alt={`${s.medal} medal`} />
                        {state === "unlocked" ? null : lockSvg}
                      </div>
                      <div className="s-no">Stage {i + 1}{isLegend ? " · Final" : ""}</div>
                      <div className="s-name">{s.medal}</div>
                      <div className="s-range">{s.name} · Books {s.start}–{s.end}</div>
                      <div className="s-status"><span className="dot"></span>{statusTxt}</div>
                      <div className="odm-lights">{lights}</div>
                    </div>
                    {(i === 1 || i === 3) ? <div className="odm-st-divider"></div> : null}
                  </React.Fragment>
                );
              })}
            </div>
            <div className="odm-legend-key">
              <span className="k"><span className="sw"><img src={ODY_LIGHT_IMG.complete} alt="" /></span>Book read</span>
              <span className="k"><span className="sw"><img src={ODY_LIGHT_IMG.current} alt="" /></span>Reading now</span>
              <span className="k"><span className="sw"><img src={ODY_LIGHT_IMG.empty} alt="" /></span>Not yet</span>
            </div>
          </div>
        </div>
      </section>
      {Footer ? <Footer /> : null}
    </main>
  );
}

function OdysseyScreen({ onNavigate }) {
  const Footer = window.Footer;
  return (
    <main className="ody-page">
      <OdysseyHero onNavigate={onNavigate} />
      <OdysseyStages onNavigate={onNavigate} />
      <OdysseyPathwayBand />
      <OdysseyCategories onNavigate={onNavigate} />
      <OdysseyShipmateScribe />
      <OdysseyCTA onNavigate={onNavigate} />
      {Footer ? <Footer /> : null}
    </main>
  );
}

Object.assign(window, {
  OdysseySection, OdysseyScreen, OdysseyMedals,
});
