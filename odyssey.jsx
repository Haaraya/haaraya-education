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

const ODY_MILESTONES = [
  { n: 1,   cap: "Set sail",       note: "Your first great book",  state: "done" },
  { n: 10,  cap: "Bronze",         note: "First certificate",      state: "done" },
  { n: 25,  cap: "Silver",         note: "Finding your stride",    state: "done" },
  { n: 50,  cap: "Halfway",        note: "Gold reader",            state: "now"  },
  { n: 75,  cap: "Voyager",        note: "The long haul",          state: "next" },
  { n: 100, cap: "Grand Voyager",  note: "The full odyssey",       state: "next" },
];

const ODY_CATEGORIES = [
  { key: "stories",   name: "Stories",   cls: "ody-cat-stories",   desc: "Novels, tales and worlds to get lost inside.",            n: 18 },
  { key: "adventure", name: "Adventure", cls: "ody-cat-adventure", desc: "Journeys, quests and daring escapes.",                    n: 12 },
  { key: "mystery",   name: "Mystery",   cls: "ody-cat-mystery",   desc: "Clues, puzzles and secrets to unravel.",                  n: 8  },
  { key: "science",   name: "Science",   cls: "ody-cat-science",   desc: "How the world works, from atoms to galaxies.",            n: 11 },
  { key: "nature",    name: "Nature",    cls: "ody-cat-nature",    desc: "Animals, plants and the living planet.",                  n: 10 },
  { key: "history",   name: "History",   cls: "ody-cat-history",   desc: "Empires, heroes and the story of us.",                    n: 9  },
  { key: "biography", name: "Biography", cls: "ody-cat-biography", desc: "Real lives that changed the world.",                      n: 8  },
  { key: "geography", name: "Geography", cls: "ody-cat-geography", desc: "Places, peoples and journeys across the map.",            n: 7  },
  { key: "poetry",    name: "Poetry",    cls: "ody-cat-poetry",    desc: "Rhythm, verse and words that sing.",                      n: 9  },
  { key: "culture",   name: "Culture",   cls: "ody-cat-culture",   desc: "Traditions, festivals and life across Nigeria.",          n: 8  },
];

const ODY_ACHIEVEMENTS = [
  { name: "Bronze Reader",   req: "10 books",  medal: "medal-bronze",   glyph: "10", state: "done" },
  { name: "Silver Reader",   req: "25 books",  medal: "medal-silver",   glyph: "25", state: "done" },
  { name: "Gold Reader",     req: "50 books",  medal: "medal-gold",     glyph: "50", state: "now"  },
  { name: "Odyssey Explorer", req: "6 categories", medal: "medal-explorer", glyph: "✦", state: "now" },
  { name: "Master Reader",   req: "75 books",  medal: "medal-master",   glyph: "75", state: "next" },
  { name: "Grand Voyager",   req: "100 books", medal: "medal-voyager",  glyph: "100", state: "next" },
];

const ODY_CERTS = [
  { n: 10,  t: "First Milestone" },
  { n: 25,  t: "Quarter Voyage" },
  { n: 50,  t: "Halfway Mariner" },
  { n: 75,  t: "Seasoned Voyager" },
  { n: 100, t: "The Full Odyssey" },
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
            <h2>Haaraya <span className="gold">Odyssey.</span></h2>
            <p className="ody-home-tag">The 100 Book Challenge</p>
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
              <button className="btn btn-ghost-light" onClick={() => onNavigate("odyssey")}>
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
              src="assets/odyssey-logo-white-trim.png"
              alt="Haaraya Odyssey"
            />
            <h1>The <span className="gold">100 Book</span> Challenge.</h1>
            <p className="ody-hero-tag">One Incredible Journey</p>
            <p className="ody-hero-sub">
              You can read anything now, so this is where reading becomes truly yours.
              The Odyssey is the next chapter after becoming a confident reader: one hundred
              great books and ten worlds of stories, history, science and discovery, with a
              path you chart yourself. Time to set sail.
            </p>
            <div className="ody-hero-actions">
              <button className="btn btn-gold btn-lg" onClick={() => onNavigate("library")}>
                Start the Odyssey <span aria-hidden="true">→</span>
              </button>
              <button className="btn btn-ghost-light btn-lg" onClick={() => onNavigate("library")}>
                Explore the Library
              </button>
            </div>
            <div className="ody-hero-meta">
              <div className="m"><span className="n">100</span><span className="l">Books</span></div>
              <div className="m"><span className="n">10</span><span className="l">Worlds to Explore</span></div>
              <div className="m"><span className="n">6</span><span className="l">Achievement Ranks</span></div>
            </div>
          </div>

          {/* [PLACEHOLDER: ODYSSEY MAP] / [PLACEHOLDER: ODYSSEY PASSPORT]
              The image below is the temporary Tafiya journey artwork, kept only as a
              stand-in. New Odyssey map & passport artwork will be produced elsewhere
              and dropped into this slot; do not generate replacements here. */}
          <div className="ody-hero-art">
            <span className="ody-art-corner tl" aria-hidden="true"></span>
            <span className="ody-art-corner tr" aria-hidden="true"></span>
            <span className="ody-art-corner bl" aria-hidden="true"></span>
            <span className="ody-art-corner br" aria-hidden="true"></span>
            <span className="ody-art-ph" aria-hidden="true">[PLACEHOLDER: ODYSSEY MAP + PASSPORT]</span>
            <image-slot
              id="odyssey-hero"
              shape="rect"
              placeholder="[PLACEHOLDER: ODYSSEY MAP + PASSPORT]: new Odyssey artwork goes here (temporary Tafiya map shown)"
              src="assets/journey.png"
            ></image-slot>
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
        <div className="ody-pathline">
          {ODY_PATHWAY.map((p, i) => (
            <React.Fragment key={p.k}>
              <div className={`ody-pathline-node ${p.state}`}>
                <span className="ring">{p.state === "done" ? "✓" : (p.state === "now" ? "★" : i + 1)}</span>
                <span className="k">{p.k}</span>
                <span className="s">{p.s}</span>
              </div>
              {i < ODY_PATHWAY.length - 1 && <span className="ody-pathline-arrow" aria-hidden="true">→</span>}
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
          lede="Every book moves you farther across your Odyssey map. Collect a certificate at each milestone and a badge for every rank you reach."
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
          eyebrow="Your progress"
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

function OdysseyCategories() {
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
            <article key={c.key} className={`ody-cat ${c.cls}`}>
              <div className="ody-cat-ic"><span></span></div>
              <h4>{c.name}</h4>
              <p>{c.desc}</p>
              <div className="count">{c.n} books</div>
              <span className="ody-cat-go" aria-hidden="true">Explore this world →</span>
            </article>
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

function OdysseyCertificates() {
  return (
    <section className="ody-section ody-band-cream">
      <div className="wrap">
        <SectionHeader
          center
          eyebrow="Keepsakes"
          title="Stamps, certificates and keepsakes."
          lede="Every milestone leaves a mark: a passport stamp for each book, an expedition certificate at every stage, and printable keepsakes for the bedroom wall or the classroom display."
        />
        <div className="ody-certs">
          {ODY_CERTS.map(c => (
            <div key={c.n} className="ody-cert">
              <div className="ody-cert-ph">[Certificate design to be supplied later]</div>
              <div className="n">{c.n}<small>books</small></div>
              <div className="t">{c.t}</div>
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
    { h: "Celebrate milestones", p: "Get a nudge whenever a child earns a badge or reaches a certificate milestone." },
    { h: "Encourage independence", p: "The Odyssey is child-led. Readers choose their own books from a curated, age-right shelf." },
    { h: "Printable certificates", p: "Generate and print milestone certificates for the wall, assembly or report card." },
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
          lede="After every book, jot a few Captain’s Notes. Your loyal Shipmate Scribe spins them into a short adventure log for your Odyssey — in your own words, never invented."
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
          <button className="btn btn-gold btn-lg" onClick={() => onNavigate("library")}>
            Start the Odyssey <span aria-hidden="true">→</span>
          </button>
          <button className="btn btn-ghost-light btn-lg" onClick={() => onNavigate("home")}>
            Back to Haaraya
          </button>
        </div>
      </div>
    </section>
  );
}

function OdysseyScreen({ onNavigate }) {
  const Footer = window.Footer;
  return (
    <main className="ody-page">
      <OdysseyHero onNavigate={onNavigate} />
      <OdysseyPathwayBand />
      <OdysseyJourney />
      <OdysseyDashboard />
      <OdysseyCategories />
      <OdysseyAchievements />
      <OdysseyCertificates />
      <OdysseyParentsTeachers />
      <OdysseyShipmateScribe />
      <OdysseyCTA onNavigate={onNavigate} />
      {Footer ? <Footer /> : null}
    </main>
  );
}

Object.assign(window, {
  OdysseySection, OdysseyScreen,
});
