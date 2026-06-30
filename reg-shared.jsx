/* ============================================================
   Haaraya Registration — shared atoms
   Exported to window for the flow + app scripts.
   ============================================================ */
const { useState: useStateR, useEffect: useEffectR, useMemo: useMemoR, useRef: useRefR } = React;

/* ---------- Tiny stroke icons ---------- */
function Ic({ d, size = 22, sw = 2 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none"
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {d}
    </svg>
  );
}
const ICONS = {
  check: <polyline points="4 12.5 9.5 18 20 6" />,
  arrowR: <g><line x1="4" y1="12" x2="19" y2="12" /><polyline points="13 6 19 12 13 18" /></g>,
  arrowL: <g><line x1="20" y1="12" x2="5" y2="12" /><polyline points="11 6 5 12 11 18" /></g>,
  family: <g><circle cx="8" cy="8" r="3" /><circle cx="17" cy="9.5" r="2.3" /><path d="M2.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" /><path d="M15 14.6c2.6.2 4.5 2.2 4.5 5" /></g>,
  school: <g><path d="M3 9.5 12 4l9 5.5" /><path d="M5 11v7.5h14V11" /><line x1="3" y1="20.5" x2="21" y2="20.5" /><line x1="12" y1="14" x2="12" y2="20.5" /></g>,
  ticket: <g><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4Z" /><line x1="13" y1="7" x2="13" y2="17" strokeDasharray="1.5 2.5" /></g>,
  book: <g><path d="M12 6.5C10.5 5 8 4.5 4 4.8v12.5c4-.3 6.5.2 8 1.7 1.5-1.5 4-2 8-1.7V4.8c-4-.3-6.5.2-8 1.7Z" /><line x1="12" y1="6.5" x2="12" y2="18.5" /></g>,
  spark: <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z" />,
  level: <g><path d="M5 19V11" /><path d="M12 19V6" /><path d="M19 19v-5" /></g>,
  shield: <g><path d="M12 3l7 2.5V11c0 4.6-3 7.8-7 9.5-4-1.7-7-4.9-7-9.5V5.5Z" /><polyline points="9 11.5 11.2 13.7 15 9.5" /></g>,
  calendar: <g><rect x="4" y="5" width="16" height="16" rx="2" /><line x1="4" y1="9.5" x2="20" y2="9.5" /><line x1="9" y1="3" x2="9" y2="6.5" /><line x1="15" y1="3" x2="15" y2="6.5" /></g>,
  demo: <g><rect x="3" y="5" width="18" height="12" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><polygon points="11 9 15 11 11 13" fill="currentColor" stroke="none" /></g>,
  pilot: <path d="M12 3c-2 3-3 6-3 9a3 3 0 0 0 6 0c0-3-1-6-3-9Zm0 18v-3M8 14l-3 3M16 14l3 3" />,
  dash: <g><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="11" width="8" height="10" rx="1.5" /><rect x="3" y="14" width="8" height="7" rx="1.5" /></g>,
};

/* ---------- Form field ---------- */
function Field({ label, optional, hint, children }) {
  return (
    <div className="reg-field">
      {label && (
        <label>{label}{optional && <span className="opt">Optional</span>}</label>
      )}
      {children}
      {hint && <div className="hint">{hint}</div>}
    </div>
  );
}
function Input(props) { return <input className="reg-input" {...props} />; }
function Select({ children, placeholder, value, onChange, ...rest }) {
  return (
    <select className="reg-select" value={value} onChange={onChange} {...rest}>
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
  );
}

/* ---------- Choice (radio card) ---------- */
function Choice({ selected, onClick, lead, title, desc, soon }) {
  return (
    <button type="button" className={"reg-choice" + (selected ? " sel" : "")} onClick={onClick}>
      {lead && <span className="lead">{lead}</span>}
      <span className="body">
        <span className="t">{title}</span>
        {desc && <span className="d">{desc}</span>}
      </span>
      {soon && <span className="tag-soon">Coming soon</span>}
      <span className="tick"><Ic d={ICONS.check} size={13} sw={3.4} /></span>
    </button>
  );
}

/* ---------- Progress trail ---------- */
function Trail({ steps, current }) {
  return (
    <div className="reg-trail">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "";
        return (
          <div key={s.key} className={"reg-trail-step " + state}>
            <span className="node">
              {i < current ? <Ic d={ICONS.check} size={16} sw={3.2} /> : i + 1}
            </span>
            <span className="txt">
              <span className="t">{s.title}</span>
              <span className="s">{s.sub}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Live child reading passport (rail) ---------- */
const READING_START_LABEL = {
  start_level_1: "Level 1 · Tashi",
  readiness_check: "Readiness check",
  manual_level: "Chosen level",
};
const CONFIDENCE_LABEL = {
  just_starting: "Just starting",
  some_words: "Reading some words",
  simple_books: "Reading simple books",
  fluent: "Reading fluently",
};

function ChildPassportPreview({ child, plan, programme, stampsFilled = 0 }) {
  const name = (child && (child.passportName || child.firstName)) || "";
  const initial = name ? name.trim()[0].toUpperCase() : "";
  const fullName = child ? [child.firstName, child.lastName].filter(Boolean).join(" ") : "";
  const startLabel = child && child.readingStart ? READING_START_LABEL[child.readingStart] : "";
  return (
    <div className="reg-passport-card">
      <div className="pp-grain" />
      <div className="reg-passport-top">
        <img src="assets/logo-haaraya-education.png" alt="Haaraya"
          style={{ filter: "brightness(0) saturate(100%) invert(86%) sepia(38%) saturate(700%) hue-rotate(2deg) brightness(95%)" }} />
        <div className="meta">
          <span className="by">Haaraya</span>
          <span className="ttl">Reading Passport</span>
        </div>
      </div>
      <div className="reg-passport-body">
        {child && child.avatar
          ? <div className="reg-passport-photo has-avatar"><PassportAvatar config={child.avatar} size={64} /></div>
          : <div className="reg-passport-photo">{initial || "?"}</div>}
        <div className="reg-passport-fields">
          <div className="reg-passport-field">
            <div className="k">Passport name</div>
            <div className={"v" + (name ? "" : " empty")}>{name || "Your child's name"}</div>
          </div>
          <div className="reg-passport-field">
            <div className="k">Reader</div>
            <div className={"v" + (fullName ? "" : " empty")}>{fullName || "—"}</div>
          </div>
          <div className="reg-passport-field">
            <div className="k">{programme ? "Programme" : "Starting point"}</div>
            <div className={"v" + (startLabel || programme ? "" : " empty")}>
              {programme || startLabel || "To be set"}
            </div>
          </div>
        </div>
      </div>
      <div className="reg-passport-stamps">
        {["L1", "★", "✦", "❖"].map((g, i) => (
          <span key={i} className={"reg-pp-stamp" + (i < stampsFilled ? " filled" : "")}
            style={{ "--r": `${[-5, 4, -3, 6][i]}deg` }}>{g}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Live school account (rail) ---------- */
function SchoolAccountPreview({ school, stampsFilled = 0 }) {
  const name = (school && school.schoolName) || "";
  const initial = name ? name.trim()[0].toUpperCase() : "";
  const roleLabel = { teacher: "Teacher", school_admin: "School admin", coordinator: "Reading coordinator" }[school && school.role] || "";
  const place = school ? [school.city, school.country].filter(Boolean).join(", ") : "";
  return (
    <div className="reg-passport-card">
      <div className="pp-grain" />
      <div className="reg-passport-top">
        <img src="assets/logo-haaraya-education.png" alt="Haaraya"
          style={{ filter: "brightness(0) saturate(100%) invert(86%) sepia(38%) saturate(700%) hue-rotate(2deg) brightness(95%)" }} />
        <div className="meta">
          <span className="by">Haaraya</span>
          <span className="ttl">School Account</span>
        </div>
      </div>
      <div className="reg-passport-body">
        <div className="reg-passport-photo">{initial || "?"}</div>
        <div className="reg-passport-fields">
          <div className="reg-passport-field">
            <div className="k">School</div>
            <div className={"v" + (name ? "" : " empty")}>{name || "Your school name"}</div>
          </div>
          <div className="reg-passport-field">
            <div className="k">Lead</div>
            <div className={"v" + ((school && school.adminName) ? "" : " empty")}>{(school && school.adminName) || "—"}</div>
          </div>
          <div className="reg-passport-field">
            <div className="k">Role</div>
            <div className={"v" + (roleLabel ? "" : " empty")}>{roleLabel || place || "To be set"}</div>
          </div>
        </div>
      </div>
      <div className="reg-passport-stamps">
        {["⌂", "✦", "★", "❖"].map((g, i) => (
          <span key={i} className={"reg-pp-stamp" + (i < stampsFilled ? " filled" : "")}
            style={{ "--r": `${[-5, 4, -3, 6][i]}deg` }}>{g}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------- Rail wrapper ---------- */
function FlowRail({ kicker, title, blurb, steps, current, children }) {
  return (
    <aside className="reg-rail">
      <div className="reg-rail-head">
        <div className="kicker">{kicker}</div>
        <h2>{title}</h2>
        {blurb && <p>{blurb}</p>}
      </div>
      <Trail steps={steps} current={current} />
      {children}
      <div className="reg-rail-assure">
        <span className="ic"><Ic d={ICONS.shield} size={13} sw={2.4} /></span>
        <span>Your details start the child's reading record. No payment is taken during sign-up.</span>
      </div>
    </aside>
  );
}

/* ---------- Step shell (tag + title + sub) ---------- */
function StepHead({ n, total, tag, title, sub }) {
  return (
    <React.Fragment>
      <div className="reg-step-tag">
        <span className="n">{n}</span>{tag} · Step {n} of {total}
      </div>
      <h2 className="reg-card-title">{title}</h2>
      {sub && <p className="reg-card-sub">{sub}</p>}
    </React.Fragment>
  );
}

/* ---------- Footer actions ---------- */
function Actions({ onBack, backLabel = "Back", onNext, nextLabel = "Continue", nextDisabled, gold }) {
  return (
    <div className="reg-actions">
      {onBack && (
        <button type="button" className="reg-back" onClick={onBack}>
          <Ic d={ICONS.arrowL} size={17} sw={2.4} /> {backLabel}
        </button>
      )}
      <div className="spacer" />
      <button type="button" className={"reg-btn-next" + (gold ? " reg-btn-gold" : "")}
        onClick={onNext} disabled={nextDisabled}>
        {nextLabel} <Ic d={ICONS.arrowR} size={18} sw={2.4} />
      </button>
    </div>
  );
}

const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "South Africa", "United Kingdom", "United States", "Canada", "Other"];
const YEARS = (() => { const a = []; const now = 2026; for (let y = now - 3; y >= now - 14; y--) a.push(y); return a; })();

Object.assign(window, {
  Ic, ICONS, Field, Input, Select, Choice, Trail,
  ChildPassportPreview, SchoolAccountPreview, FlowRail, StepHead, Actions,
  READING_START_LABEL, CONFIDENCE_LABEL, COUNTRIES, YEARS,
});
