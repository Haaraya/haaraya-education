/* ============================================================
   Haaraya — First-run guide
   Three "how it works" cards, shown once when a newly registered
   user lands on their dashboard. Role-aware content, one clear
   next step. Dismissal is remembered per user.

   Voice: warm and plain-spoken, like a good teacher. No jargon.
   ============================================================ */
const { useState: useStateOnb, useEffect: useEffectOnb } = React;

const ONB_KEY = "haaraya:onboarded:";

/* Which dashboard screen counts as "home" for each role, and what the
   guide says there. `cta.screen` is the one thing we want them to do next. */
const ONB_GUIDES = {
  parent: {
    screen: "parent",
    adult: true,
    eyebrow: "Welcome to Haaraya",
    title: "Here is how Haaraya works",
    lede: "Three things to know, and then you can get started. This takes a minute.",
    cards: [
      { n: 1, h: "Start at the right level", p: "Haaraya places your child at one of twelve reading levels, and their library offers books from that level. Nothing is too hard or too easy, so what they open next is always the right next step rather than a guess." },
      { n: 2, h: "Read it, pass the check", p: "At the end of each book there is a short reading check. Passing it is what earns the stamp in your child's Reading Passport, so the passport records reading understood rather than pages turned." },
      { n: 3, h: "Watch the journey", p: "This dashboard shows what each of your children has read, the level they are working through, and what comes next." },
    ],
    cta: { label: "Explore the library", screen: "library" },
    skip: "I'll look around on my own",
  },
  child: {
    screen: "child",
    adult: false,
    eyebrow: "Welcome to your reading journey",
    title: "Three things to know",
    lede: "Then you can start your first book.",
    cards: [
      { n: 1, h: "Your level, your books", p: "You are on one of the twelve Haaraya levels, and your library holds the books for it. They are in order, because each one builds on the book before." },
      { n: 2, h: "Read at your own pace", p: "You can stop partway and come back later. Haaraya remembers the page you were on." },
      { n: 3, h: "Collect your stamps", p: "At the end of a book there is a short check. Pass it and a stamp goes into your Reading Passport. Fill a level and you move up to the next one." },
    ],
    cta: { label: "Go to my books", screen: "library" },
    skip: "I'll have a look myself",
  },
  teacher: {
    screen: "teacher",
    adult: true,
    eyebrow: "Welcome to Haaraya",
    title: "Here is how Haaraya works",
    lede: "Three things to know before you start with your class.",
    cards: [
      { n: 1, h: "Your class, by level", p: "Every pupil in your classroom appears here with the level they are reading at, so you can see the spread at a glance." },
      { n: 2, h: "Set the reading", p: "Assign a book to one pupil, a few, or the whole class. They will find it waiting on their own dashboard." },
      { n: 3, h: "Follow the progress", p: "As pupils finish books their stamps and levels update here, so you can see who is moving and who needs a hand." },
    ],
    cta: { label: "Explore the library", screen: "library" },
    skip: "I'll look around on my own",
  },
  school_admin: {
    screen: "school",
    adult: true,
    eyebrow: "Welcome to Haaraya",
    title: "Here is how Haaraya works",
    lede: "Three things to know about running Haaraya across your school.",
    cards: [
      { n: 1, h: "Your school at a glance", p: "Classes, teachers and pupils all sit on this dashboard, with reading levels rolled up so you can see how the school is doing." },
      { n: 2, h: "Teachers and classes", p: "Add teachers, group pupils into classes, and each teacher gets their own view of the children they teach." },
      { n: 3, h: "See where to help", p: "Progress by class and by level shows you which groups are moving well and which need support." },
    ],
    cta: { label: "Explore the library", screen: "library" },
    skip: "I'll look around on my own",
  },
};

function onbSeen(who) {
  try { return localStorage.getItem(ONB_KEY + who) === "1"; } catch (e) { return false; }
}
function onbMarkSeen(who) {
  try { localStorage.setItem(ONB_KEY + who, "1"); } catch (e) { /* private mode */ }
}

function FirstRunGuide({ role, screen, session, onNavigate }) {
  const guide = ONB_GUIDES[role];
  const who = String((session && (session.userId || session.id || session.email)) || "guest");
  const [open, setOpen] = useStateOnb(false);

  useEffectOnb(() => {
    if (!guide || screen !== guide.screen) { setOpen(false); return; }
    setOpen(!onbSeen(who));
  }, [role, screen, who]);

  useEffectOnb(() => {
    if (!open) return;
    const esc = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  if (!guide || !open) return null;

  function close() { onbMarkSeen(who); setOpen(false); }
  function go() { close(); if (guide.cta.screen) onNavigate(guide.cta.screen); }

  return (
    <div className={"onb-scrim" + (guide.adult ? " role-adult" : "")} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="onb-card" role="dialog" aria-modal="true" aria-label={guide.title}>
        <div className="onb-head">
          <div className="onb-eye">{guide.eyebrow}</div>
          <h2>{guide.title}</h2>
          <p>{guide.lede}</p>
        </div>
        <div className="onb-steps">
          {guide.cards.map(c => (
            <div className="onb-step" key={c.n}>
              <div className="onb-num">{c.n}</div>
              <h3>{c.h}</h3>
              <p>{c.p}</p>
            </div>
          ))}
        </div>
        <div className="onb-foot">
          <button className="onb-go" onClick={go}>{guide.cta.label} &rarr;</button>
          <button className="onb-skip" onClick={close}>{guide.skip}</button>
        </div>
      </div>
    </div>
  );
}

/* Lets you see the guide again from the console: HaarayaOnboarding.reset() */
window.HaarayaOnboarding = {
  reset: function (who) {
    try {
      if (who) { localStorage.removeItem(ONB_KEY + who); return; }
      Object.keys(localStorage).filter(k => k.indexOf(ONB_KEY) === 0).forEach(k => localStorage.removeItem(k));
    } catch (e) { /* ignore */ }
  },
};

Object.assign(window, { FirstRunGuide });
