/* ============================================================
   Haaraya — Skill Check panel (Child Dashboard)
   ------------------------------------------------------------
   Shows the readiness rule in action:
   - A child placed by MANUAL level choice (readingMode "choose")
     skips the readiness check, so earlier Soundables & Hafwas
     skills stay UNCHECKED — never mastered/completed/failed —
     until a real check resolves them.
   - A child who climbed the path normally (readingMode
     "automatic") has those earlier skills "mastered" via reading.
   Resolutions: a readiness check (bulk) or a teacher/assessment
   outcome (per skill) → mastered | needs_review | reassess_later.
   State persists to localStorage (prototype only).
   ============================================================ */
const { useState: useSC, useEffect: useSCE } = React;

const SC_STATUS = {
  unchecked:      { label: "Unchecked",      cls: "unchecked" },
  mastered:       { label: "Mastered",       cls: "mastered" },
  needs_review:   { label: "Needs review",   cls: "needs-review" },
  reassess_later: { label: "Reassess later", cls: "reassess" },
};
const SC_SOURCE_LABEL = {
  reading_path:   "via reading path",
  readiness_check:"readiness check",
  teacher_check:  "teacher check",
  skill_check:    "skill check",
};

function scLevel(n) {
  return (window.HaarayaSeed.levels.find(l => l.number === n) || { name: "", code: "L" + n });
}

/* Two teaching skills per earlier level: Soundables + Hafwas */
function scBuildSkills(currentLevel) {
  const rows = [];
  for (let L = 1; L < currentLevel; L++) {
    const lv = scLevel(L);
    rows.push({ id: `L${L}-soundables`, level: L, levelName: lv.name, code: lv.code, track: "Soundables", desc: "Letter sounds & blending" });
    rows.push({ id: `L${L}-hafwas`,     level: L, levelName: lv.name, code: lv.code, track: "Hafwas",     desc: "Heart words by sight" });
  }
  return rows;
}

function scStorageKey(childId) { return "haaraya:readiness:" + childId; }
const scToday = () => new Date("2026-05-24").toISOString().slice(0, 10);

function scDefaultRecord(child) {
  const manual = child.readingMode === "choose";
  const skills = {};
  scBuildSkills(child.currentLevelId).forEach(s => {
    skills[s.id] = manual
      ? { status: "unchecked", source: null, assessedAt: null }
      : { status: "mastered", source: "reading_path", assessedAt: child.startedAt || null };
  });
  return {
    placement: manual ? "manual_level" : (child.currentLevelId === 1 ? "level_1_start" : "reading_path"),
    startLevel: child.currentLevelId,
    readinessCheckStatus: manual ? "skipped" : "not_required",
    skills,
  };
}

function scLoadRecord(child) {
  const def = scDefaultRecord(child);
  try {
    const raw = localStorage.getItem(scStorageKey(child.id));
    if (raw) {
      const saved = JSON.parse(raw);
      // reconcile: keep saved skill states, ensure every current skill exists
      const skills = {};
      Object.keys(def.skills).forEach(id => { skills[id] = (saved.skills && saved.skills[id]) || def.skills[id]; });
      return { ...def, ...saved, skills };
    }
  } catch (e) { /* ignore */ }
  return def;
}

function scSaveRecord(childId, rec) {
  try { localStorage.setItem(scStorageKey(childId), JSON.stringify(rec)); } catch (e) { /* ignore */ }
}

/* deterministic readiness-check outcome — ~75% mastered, 25% needs review */
function scAutoOutcome(skillId) {
  let h = 0;
  for (let i = 0; i < skillId.length; i++) h = (h * 31 + skillId.charCodeAt(i)) & 0xffff;
  return (h % 4 === 0) ? "needs_review" : "mastered";
}

function SkillCheckPanel({ defaultChildId }) {
  const { data: kids } = useApi(async () => {
    const role = window.HaarayaSession ? HaarayaSession.role() : "visitor";
    const uid = window.HaarayaSession ? HaarayaSession.userId() : null;
    if (role === "parent" && uid != null) {
      const list = await HaarayaApi.getChildrenForParent(uid);
      if (list && list.length) return list;
    }
    const c = await HaarayaApi.getChild(defaultChildId);
    return c ? [c] : [];
  }, [defaultChildId]);

  const [activeId, setActiveId] = useSC(defaultChildId);
  const [userPicked, setUserPicked] = useSC(false);
  const [rec, setRec] = useSC(null);
  const [checking, setChecking] = useSC(false);
  const [justResolved, setJustResolved] = useSC({});

  const child = (kids || []).find(k => k.id === activeId) || (kids || [])[0] || null;

  // Once kids load, open on the child who needs attention (a manual placement
  // with earlier skills still unchecked) — unless the user has chosen one.
  useSCE(() => {
    if (!kids || !kids.length || userPicked) return;
    const needs = kids.find(k => k.readingMode === "choose" && k.currentLevelId > 1);
    const target = needs || kids.find(k => k.id === defaultChildId) || kids[0];
    if (target && target.id !== activeId) setActiveId(target.id);
  }, [kids]);

  // load record whenever active child changes
  useSCE(() => {
    if (!child) return;
    setRec(scLoadRecord(child));
    setJustResolved({});
  }, [child && child.id]);

  if (!kids || !child || !rec) return null;

  const skills = scBuildSkills(child.currentLevelId);
  const byLevel = {};
  skills.forEach(s => { (byLevel[s.level] = byLevel[s.level] || []).push(s); });
  const levels = Object.keys(byLevel).map(Number).sort((a, b) => a - b);

  const stateOf = (id) => (rec.skills[id] || { status: "unchecked", source: null, assessedAt: null });
  const uncheckedCount = skills.filter(s => stateOf(s.id).status === "unchecked").length;
  const checkedCount = skills.length - uncheckedCount;
  const isManual = rec.placement === "manual_level";
  const curLv = scLevel(child.currentLevelId);

  const persist = (next) => { setRec(next); scSaveRecord(child.id, next); };

  const setSkill = (id, status, source) => {
    const next = {
      ...rec,
      skills: {
        ...rec.skills,
        [id]: status === "unchecked"
          ? { status: "unchecked", source: null, assessedAt: null }
          : { status, source: source || "teacher_check", assessedAt: scToday() },
      },
    };
    persist(next);
  };

  const runReadinessCheck = () => {
    if (checking) return;
    setChecking(true);
    const targets = skills.filter(s => stateOf(s.id).status === "unchecked");
    setTimeout(() => {
      const nextSkills = { ...rec.skills };
      const resolved = {};
      targets.forEach(s => {
        const outcome = scAutoOutcome(s.id);
        nextSkills[s.id] = { status: outcome, source: "readiness_check", assessedAt: scToday() };
        resolved[s.id] = true;
      });
      persist({ ...rec, skills: nextSkills, readinessCheckStatus: "completed" });
      setJustResolved(resolved);
      setChecking(false);
      setTimeout(() => setJustResolved({}), 1400);
    }, 1100);
  };

  const resetAll = () => {
    persist(scDefaultRecord(child));
    setJustResolved({});
  };

  /* ---------- banner ---------- */
  const placementText = isManual
    ? `Placed at Level ${child.currentLevelId} · ${curLv.name} by manual choice`
    : child.currentLevelId === 1
      ? `Started at Level 1 · ${curLv.name}`
      : `Climbing the reading path · now Level ${child.currentLevelId} · ${curLv.name}`;
  const readinessPill = {
    skipped:      { t: "Readiness check: Skipped", c: "warn" },
    completed:    { t: "Readiness check: Completed", c: "ok" },
    pending:      { t: "Readiness check: Pending", c: "info" },
    not_required: { t: "Full path · nothing skipped", c: "ok" },
  }[rec.readinessCheckStatus] || { t: rec.readinessCheckStatus, c: "info" };

  return (
    <div className="sc-panel">
      <div className="sc-head">
        <div className="sc-head-main">
          <div className="sc-kicker">Skill Check</div>
          <h3>Soundables &amp; Hafwas readiness</h3>
          <p>Skills below a reader's level stay <strong>unchecked</strong> until a real check confirms them — a manual level choice never marks them passed, completed or failed.</p>
        </div>
        {kids.length > 1 && (
          <div className="sc-switch" role="tablist" aria-label="Choose child">
            {kids.map(k => (
              <button key={k.id} role="tab" aria-selected={k.id === activeId}
                className={"sc-switch-btn" + (k.id === activeId ? " on" : "")}
                onClick={() => { setUserPicked(true); setActiveId(k.id); }}>
                <Avatar name={k.shortName || k.displayName} color={k.avatarColor} size={26} border={false} />
                {k.shortName || k.displayName}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={"sc-banner " + (isManual ? "is-manual" : "is-path")}>
        <Avatar name={child.shortName || child.displayName} color={child.avatarColor} size={46} />
        <div className="sc-banner-body">
          <div className="sc-banner-name">{child.displayName}</div>
          <div className="sc-banner-place">{placementText}</div>
        </div>
        <div className={"sc-readiness-pill " + readinessPill.c}>{readinessPill.t}</div>
      </div>

      {child.currentLevelId === 1 ? (
        <div className="sc-empty">
          <span className="sc-empty-ic">✓</span>
          Started at the very first level — there's nothing earlier to check. Skills are earned as {child.shortName || "your reader"} reads forward.
        </div>
      ) : (
        <React.Fragment>
          <div className="sc-meta-row">
            <div className="sc-count">
              <strong>{checkedCount}</strong> of {skills.length} earlier skills checked
              {uncheckedCount > 0 && <span className="sc-count-open"> · {uncheckedCount} still unchecked</span>}
            </div>
            <div className="sc-actions">
              {uncheckedCount > 0 && (
                <button className="sc-btn sc-btn-primary" onClick={runReadinessCheck} disabled={checking}>
                  {checking ? "Running readiness check…" : "Run readiness check"}
                </button>
              )}
              {checkedCount > 0 && (
                <button className="sc-btn sc-btn-ghost" onClick={resetAll}>Reset</button>
              )}
            </div>
          </div>

          <div className={"sc-levels" + (checking ? " is-checking" : "")}>
            {levels.map(L => {
              const lv = scLevel(L);
              return (
                <div key={L} className="sc-level">
                  <div className="sc-level-head">
                    <span className="sc-level-code">{lv.code}</span>
                    <span className="sc-level-name">{lv.name}</span>
                    <span className="sc-level-band">Earlier level</span>
                  </div>
                  <div className="sc-skills">
                    {byLevel[L].map(s => {
                      const st = stateOf(s.id);
                      const meta = SC_STATUS[st.status] || SC_STATUS.unchecked;
                      return (
                        <div key={s.id} className={"sc-skill" + (justResolved[s.id] ? " just" : "")}>
                          <span className={"sc-track sc-track-" + s.track.toLowerCase()}>{s.track}</span>
                          <span className="sc-skill-desc">{s.desc}</span>
                          <span className={"sc-pill " + meta.cls}>{meta.label}</span>
                          {st.source && <span className="sc-source">{SC_SOURCE_LABEL[st.source]}</span>}
                          <select className="sc-select" value={st.status}
                            onChange={(e) => setSkill(s.id, e.target.value, e.target.value === "mastered" && st.source === "reading_path" ? "reading_path" : "teacher_check")}
                            aria-label={`Set outcome for ${s.code} ${s.track}`}>
                            <option value="unchecked">Unchecked</option>
                            <option value="mastered">Mastered</option>
                            <option value="needs_review">Needs review</option>
                            <option value="reassess_later">Reassess later</option>
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sc-foot">
            <span className="sc-foot-ic">ℹ</span>
            <span>Skipping the readiness check lets a child start reading at the chosen level — but it does not validate or complete any skipped teaching skill. Only a readiness check, skill check, teacher check or approved assessment can change a skill from <em>unchecked</em>.</span>
          </div>
        </React.Fragment>
      )}
    </div>
  );
}

Object.assign(window, { SkillCheckPanel });
