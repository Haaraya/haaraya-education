/* ============================================================
   Haaraya — Frequently asked questions
   Content lives in FAQ_SECTIONS so it can move to Supabase later
   (same pattern as the About pages) without touching the layout.
   Voice: warm, plain-spoken, no jargon.
   ============================================================ */
const { useState: useStateFaq, useEffect: useEffectFaq } = React;

const FAQ_SECTIONS = [
  {
    id: "start",
    title: "Getting started",
    items: [
      {
        q: "What is Haaraya?",
        a: "Haaraya is a Nigerian reading journey for children. Books are organised into twelve levels, so a child always has something to read that is neither too easy nor too hard, and their progress is recorded in a Reading Passport as they go.",
      },
      {
        q: "How do we begin?",
        a: "Register as a parent, a school, or with an access code if a sponsor or programme has given you one. You will add your child, choose a starting level, and their library is ready straight away.",
      },
      {
        q: "Do children need their own login?",
        a: "No. Children read under the family account, so there is one set of details for a household to remember. A parent opens the child's view from their own dashboard.",
      },
      {
        q: "What age is Haaraya for?",
        a: "The twelve levels run from a child's very first sounds through to long, confident chapter reading, so the journey covers the whole of primary and beyond. Level, not age, decides where a child starts.",
      },
    ],
  },
  {
    id: "levels",
    title: "Reading levels and the readiness check",
    items: [
      {
        q: "What are the twelve levels?",
        a: "In order: Tashi, Mataki, Hanya, Tafiya, Kwararo, Gada, Kwari, Tudun, Kololuwa, Fage, Sarari and Isa. Each level has its own set of books across the reading strands, and a child moves up when they have read their way through it.",
      },
      {
        q: "How do we know which level to start at?",
        a: "The readiness check is a short set of questions at registration that suggests a starting level. If you already know your child's reading well, you can skip it and choose a level yourself.",
      },
      {
        q: "What happens if we skip the readiness check?",
        a: "Your child starts at the level you chose, which is fine. The earlier Soundables and Hafwas skills they skipped past stay marked as unchecked rather than mastered, until a readiness check or a teacher assessment resolves them. Nothing is recorded as passed that was never tested.",
      },
      {
        q: "Can a child move up or down a level?",
        a: "Yes. Levels are a guide, not a cage. If a level is turning out too hard or too easy, it can be changed, and the books follow.",
      },
      {
        q: "Who chooses which book comes next?",
        a: "You choose how it works. In automatic mode Haaraya sets a reading plan and offers the next book at the right level. In choose mode the child browses their level and picks whatever appeals to them.",
      },
    ],
  },
  {
    id: "passport",
    title: "The Reading Passport",
    items: [
      {
        q: "What is the Reading Passport?",
        a: "It is your child's record of everything they have read. Each finished book earns a stamp, stamps fill up a level, and a completed level is a page of the passport they can look back on.",
      },
      {
        q: "How does a book get stamped?",
        a: "At the end of every book there is a short reading check. Passing it is what earns the stamp — reaching the last page is not enough on its own. If your child does not pass, they can read the book again and take the check again. That is what makes the passport a record of reading understood rather than pages turned.",
      },
      {
        q: "Can a child read the same book again?",
        a: "As often as they like, and re-reading is genuinely good for young readers. The stamp stays as it is; the passport counts books read, not times read.",
      },
    ],
  },
  {
    id: "library",
    title: "The library",
    items: [
      {
        q: "What is in the library?",
        a: "Nigerian-rooted books written for Nigerian children — market mornings, harmattan, folktales, families, work and weather — alongside phonics readers and non-fiction about the world they live in.",
      },
      {
        q: "What are the strands?",
        a: "Ten threads running through one journey rather than ten separate apps. Soundables and Hafwas build the sounds and sight words; Tafiya Fiction, Non-Fiction, Folktale, Poetry and Duniya carry the stories; the Stamina strands build the endurance for longer reading. Each has its own colour and character, and they are interleaved across all twelve levels.",
      },
      {
        q: "Can a child read outside their level?",
        a: "The books at their level are open, and so is everything below it — going back to easier books is good for a young reader, not a step backwards. Haaraya is a progressive series, so the books at a level are meant to be read in order, each one building on the last. A book above their level comes to them as an assignment from a teacher or parent, so reaching higher is always a decision someone made rather than a stumble.",
      },
    ],
  },
  {
    id: "pricing",
    title: "Plans and pricing",
    items: [
      {
        q: "What does Haaraya cost?",
        a: "Individual is ₦20,000 per child each month, or ₦200,000 for the year. Family is ₦40,000 a month for up to four children in one household, or ₦400,000 for the year. Schools and community groups pay ₦20,000 per child each month, dropping to ₦10,000 once there are more than a hundred pupils. Paying yearly gives you two months free.",
      },
      {
        q: "Is there a free way to read with Haaraya?",
        a: "Yes — Haaraya Odyssey, the 100 Book Challenge, is free forever and open to every child. You only need to register to start.",
      },
      {
        q: "Which plan suits a family with three children?",
        a: "The Family plan. It covers up to four children in one household and works out well below three Individual plans.",
      },
      {
        q: "Can we change plans later?",
        a: "Yes. Families move between Individual and Family as their household changes, and a school can start with a few classes and widen out.",
      },
    ],
  },
  {
    id: "schools",
    title: "Schools, churches and community groups",
    items: [
      {
        q: "How does Haaraya work in a school?",
        a: "Pupils are grouped into classes, each with a teacher. The teacher sees every pupil's level and progress on one dashboard, and school leaders see the picture across all classes.",
      },
      {
        q: "Can a teacher set particular books?",
        a: "Yes. A teacher can assign a book to one pupil, to several, or to a whole class, with a due date if they want one. It appears waiting on each child's own dashboard.",
      },
      {
        q: "We are a church, NGO or reading club, not a school.",
        a: "The Community plan is built for you — reading clubs, churches, NGOs and sponsors supporting many children, with group reading mode and reporting for cohorts and sponsors.",
      },
      {
        q: "Someone gave us an access code.",
        a: "That means a school, sponsor or programme has already paid for a child's place. Register with the code and the child's reading journey is set up under that programme, at no cost to you.",
      },
    ],
  },
  {
    id: "odyssey",
    title: "Haaraya Odyssey",
    items: [
      {
        q: "What is the Odyssey?",
        a: "The 100 Book Challenge: a hundred books to read, with badges and milestones along the way, and a Captain's Log for a child to write about what they have read. It is free, always.",
      },
      {
        q: "Is it the same as the reading journey?",
        a: "They sit side by side. The twelve-level journey is the structured path that grows a reader's skill; the Odyssey is a challenge that rewards reading widely. Many children do both.",
      },
    ],
  },
  {
    id: "accounts",
    title: "Accounts",
    items: [
      {
        q: "Can two parents share one account?",
        a: "Yes. A household account can be used by both parents, and the children, reading and passports are all shared.",
      },
      {
        q: "Can one child be in a school and a family account?",
        a: "Yes, and it is common. A child reading at school and at home keeps one reading record, so the levels and stamps do not get counted twice or start over.",
      },
      {
        q: "How do we change our details?",
        a: "Your dashboard holds your account details, your children's profiles and your plan, and each of those can be edited there.",
      },
    ],
  },
];

function FaqItem({ item }) {
  const [open, setOpen] = useStateFaq(false);
  return (
    <div className={"faq-item" + (open ? " open" : "")}>
      <button className="faq-q" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{item.q}</span>
        <span className="faq-mark" aria-hidden="true" />
      </button>
      {open && <div className="faq-a"><p>{item.a}</p></div>}
    </div>
  );
}

function FaqScreen({ onNavigate }) {
  const [active, setActive] = useStateFaq(FAQ_SECTIONS[0].id);
  // The fixed publisher seal overlaps the question list; hide it while here.
  useEffectFaq(() => {
    document.body.classList.add("faq-screen-open");
    return () => document.body.classList.remove("faq-screen-open");
  }, []);
  const section = FAQ_SECTIONS.find(s => s.id === active) || FAQ_SECTIONS[0];
  return (
    <main className="faq-page" data-screen-label="FAQ">
      <section className="faq-hero">
        <div className="wrap">
          <div className="section-header center">
            <div className="eyebrow"><span className="bar" /> Questions</div>
            <h2>Things parents and teachers ask us</h2>
            <p className="lede">How the levels work, what it costs, and what happens once your child starts reading.</p>
          </div>
        </div>
      </section>

      <section className="faq-body">
        <div className="wrap faq-layout">
          <nav className="faq-side" aria-label="FAQ sections">
            {FAQ_SECTIONS.map(s => (
              <button key={s.id} className={"faq-tab" + (s.id === active ? " on" : "")} onClick={() => setActive(s.id)}>
                {s.title}
              </button>
            ))}
          </nav>

          <div className="faq-list">
            <h3 className="faq-sechead">{section.title}</h3>
            {section.items.map(it => <FaqItem key={it.q} item={it} />)}
          </div>
        </div>
      </section>

      <section className="faq-cta">
        <div className="wrap">
          <div className="faq-cta-card">
            <h3>Ready to start reading?</h3>
            <p>Register a child, or take the Odyssey challenge — that one is free, always.</p>
            <div className="faq-cta-row">
              <button className="btn btn-primary" onClick={() => onNavigate("library")}>Explore the library</button>
              <button className="btn btn-forest" onClick={() => onNavigate("odyssey")}>See the Odyssey</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

Object.assign(window, { FaqScreen, FAQ_SECTIONS });
