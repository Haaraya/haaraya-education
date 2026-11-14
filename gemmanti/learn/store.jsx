/* Gemmanti — local application state (simulated learning record). */
const HL_KEY = "gemmanti-demo-v1";
const D = window.HL_DATA;

function hlSeed() {
  const learners = {};
  D.LEARNERS.forEach(l => { learners[l.id] = JSON.parse(JSON.stringify(l)); });
  return {
    v: 3, role: "learner", personaId: "amara", route: { view: "home" },
    learners, assignments: D.ASSIGNMENTS.slice(), events: D.EVENTS.slice(), requests: D.REQUESTS.slice(),
    teachers: D.TEACHERS.slice(), classes: D.CLASSES.slice(),
    orgCollections: Object.fromEntries(Object.entries(D.ORG_STATS).map(([k, v]) => [k, v.collections.slice()])),
    adminUsers: D.ADMIN_USERS.slice(), toast: null
  };
}
function hlLoad() {
  try { const s = JSON.parse(localStorage.getItem(HL_KEY)); if (s && s.v === 3) return s; } catch (e) {}
  return hlSeed();
}
const HLStore = React.createContext(null);
const nowLabel = () => "Just now";

const hlToday = () => new Date().toISOString().slice(0, 10);

function HLProvider({ children, initial }) {
  const [state, setState] = React.useState(() => initial || hlLoad());
  /* Demo keeps its state in this browser; live state lives in the database. */
  React.useEffect(() => { if (state.live) return; const { toast, ...rest } = state; try { localStorage.setItem(HL_KEY, JSON.stringify(rest)); } catch (e) {} }, [state]);
  /* Live saving: queue a save, then read the record from the latest state when it runs. */
  const latest = React.useRef(state); latest.current = state;
  const queue = React.useRef({});
  const save = (kind, lid, code, handIn) => {
    if (!latest.current.live || !window.HLLive) return;
    const k = kind + "|" + lid + "|" + code; const q = queue.current[k] || (queue.current[k] = {});
    if (handIn) q.handIn = true;
    clearTimeout(q.t);
    q.t = setTimeout(() => {
      delete queue.current[k];
      const L = latest.current.learners[lid]; const rec = L && L.worksheets && L.worksheets[code]; if (!rec) return;
      const p = kind === "review" ? HLLive.saveReview(lid, code, rec) : HLLive.saveWork(lid, code, rec, !!q.handIn);
      p.then(() => { if (kind === "review") toast("Record saved"); else if (q.handIn) toast("Handed in"); })
       .catch(e => { console.warn("Gemmanti save failed", e); toast("Couldn’t save. Check your connection and try again."); });
    }, kind === "work" && !handIn ? 800 : 60);
  };
  const up = fn => setState(s => { const n = JSON.parse(JSON.stringify(s)); fn(n); return n; });
  const toast = msg => { up(s => { s.toast = { msg, id: Date.now() }; }); setTimeout(() => setState(s => ({ ...s, toast: null })), 2600); };
  const first = n => n.split(" ")[0];
  const actions = {
    go: (view, params = {}) => { up(s => { s.route = { view, ...params }; }); window.scrollTo(0, 0); },
    setRole: (role, personaId) => up(s => {
      s.role = role; if (personaId) s.personaId = personaId;
      s.route = { view: role === "learner" ? "home" : "overview" };
    }),
    lessonSave: (lid, lessonId, patch) => up(s => {
      const L = s.learners[lid]; const r = L.lessons[lessonId] || (L.lessons[lessonId] = { status: "not_started", step: 0, attempts: [] });
      if (r.status === "not_started") r.status = "in_progress";
      Object.assign(r, patch); L.lastActive = 0;
    }),
    lessonAttempt: (lid, lessonId, score, total, answers) => {
      const pass = score >= D.LESSON.passMark;
      up(s => {
        const L = s.learners[lid]; const r = L.lessons[lessonId] || (L.lessons[lessonId] = { status: "in_progress", step: 0, attempts: [] });
        r.attempts.push({ score, total, pass, date: "2026-10-26", answers });
        r.step = 5; r.status = pass ? "complete" : "in_progress"; L.lastActive = 0;
        L.weekly[L.weekly.length - 1] += 1;
        L.skills.seq = Math.round((L.skills.seq + Math.round(score / total * 100)) / 2);
        L.skills.comp = Math.min(99, L.skills.comp + (pass ? 3 : 0));
        if (pass && !r.counted) { r.counted = true; L.levelPct = Math.min(100, L.levelPct + 12); if (!L.achievements.includes("order-finder")) L.achievements.push("order-finder"); }
        s.events.unshift({ at: nowLabel(), who: first(L.name), text: `${pass ? "passed" : "attempted"} Steps in Order · ${score}/${total}`, classId: L.classId, live: true });
      });
    },
    readSave: (lid, bookId, page, pages) => up(s => {
      const L = s.learners[lid]; const prev = L.reading[bookId];
      L.reading[bookId] = { page, pages, done: (prev && prev.done) || false, at: "2026-10-26" }; L.lastActive = 0;
    }),
    readFinish: (lid, book) => up(s => {
      const L = s.learners[lid];
      L.reading[book.id] = { page: book.pages, pages: book.pages, done: true, at: "2026-10-26" };
      if (!L.booksDone.includes(book.id)) {
        L.booksDone.unshift(book.id); L.levelPct = Math.min(100, L.levelPct + 4);
        s.events.unshift({ at: nowLabel(), who: first(L.name), text: `finished ${book.t}`, classId: L.classId, live: true });
      }
    }),
    wsResp: (lid, code, id, val) => up(s => {
      const L = s.learners[lid]; L.worksheets = L.worksheets || {};
      const r = L.worksheets[code] || (L.worksheets[code] = { status: "in_progress", resp: {}, reads: [], at: hlToday() });
      if (r.status === "not_started") r.status = "in_progress";
      r.resp[id] = val; L.lastActive = 0;
    }) || save("work", lid, code),
    wsReads: (lid, code, reads) => up(s => {
      const L = s.learners[lid]; L.worksheets = L.worksheets || {};
      const r = L.worksheets[code] || (L.worksheets[code] = { status: "in_progress", resp: {}, reads: [], at: hlToday() });
      r.reads = reads;
    }) || save("work", lid, code),
    wsHandIn: (lid, code) => { up(s => {
      const L = s.learners[lid]; const r = L.worksheets[code]; if (!r) return;
      r.status = "handed_in"; r.handedAt = hlToday(); if (L.weekly.length) L.weekly[L.weekly.length - 1] += 1;
      s.events.unshift({ at: nowLabel(), who: first(L.name), text: `handed in the ${HLWS.get(code).title} worksheet`, classId: L.classId, live: true });
    }); save("work", lid, code, true); },
    wsReview: (lid, code, rec) => { up(s => {
      const L = s.learners[lid]; L.worksheets = L.worksheets || {};
      const r = L.worksheets[code] || (L.worksheets[code] = { status: "not_started", resp: {}, reads: [] });
      Object.assign(r, rec, { status: "reviewed", reviewedAt: hlToday(), seen: false });
    }); if (latest.current.live) save("review", lid, code); else toast("Record saved"); },
    wsSeen: (lid, code) => up(s => { const r = s.learners[lid].worksheets[code]; if (r) r.seen = true; }),
    addAssignment: a => { up(s => { s.assignments.unshift({ id: "a" + Date.now(), created: "2026-10-26", ...a }); }); toast("Assignment sent"); },
    removeAssignment: id => up(s => { s.assignments = s.assignments.filter(a => a.id !== id); }),
    addRequest: r => { up(s => { s.requests.unshift({ id: "r" + Date.now(), status: "Received", date: "2026-10-26", ...r }); }); toast("Request sent to the Haaraya content team"); },
    addTeacher: t => { up(s => { s.teachers.push({ id: "t" + Date.now(), schoolId: "gf", classes: [], ...t }); }); toast("Teacher invited"); },
    assignTeacher: (classId, teacherId) => up(s => {
      const c = s.classes.find(c => c.id === classId); c.teacherId = teacherId;
      s.teachers.forEach(t => { t.classes = t.classes.filter(x => x !== classId); if (t.id === teacherId) t.classes.push(classId); });
    }),
    addClass: c => { up(s => { const id = "c" + Date.now(); s.classes.push({ id, size: 0, ...c }); }); toast("Class created"); },
    enroll: (name, classId) => { up(s => {
      const id = "n" + Date.now(); const c = s.classes.find(c => c.id === classId);
      s.learners[id] = { id, name, classId, schoolId: "gf", level: c.expected, levelPct: 0, lastActive: 99, weekly: Array(10).fill(0), booksDone: [], reading: {}, lessons: {}, achievements: [], skills: { phonics: 0, sight: 0, vocab: 0, comp: 0, seq: 0 }, isNew: true };
    }); toast(`${name} enrolled`); },
    setClassScores: (classId, on) => {
      const flip = v => up(s => { const c = s.classes.find(c => c.id === classId); if (c) c.showScores = v; });
      flip(on);
      if (latest.current.live && window.HLLive) HLLive.setShowScores(classId, on)
        .then(() => toast(on ? "Scores are on for this class" : "Scores are off for this class"))
        .catch(e => { console.warn(e); flip(!on); toast("Couldn’t change it. Try again."); });
    },
    toggleCollection: (orgId, colId) => up(s => { const a = s.orgCollections[orgId]; const i = a.indexOf(colId); i >= 0 ? a.splice(i, 1) : a.push(colId); }),
    toggleUser: id => up(s => { const u = s.adminUsers.find(u => u.id === id); u.active = !u.active; }),
    setUserRole: (id, role) => up(s => { s.adminUsers.find(u => u.id === id).role = role; }),
    toast,
    reset: () => { try { localStorage.removeItem(HL_KEY); } catch (e) {} setState(hlSeed()); }
  };
  return <HLStore.Provider value={{ state, ...actions }}>{children}</HLStore.Provider>;
}
const useHL = () => React.useContext(HLStore);

/* Worksheet score from the section ratings: Not Yet 0, Developing 1, Secure 2,
   Beyond 2 plus a star. Not observed (–), absent (A) and blank sections are left
   out, so a child is never marked down for something nobody saw. Help is not
   part of the score. Returns null when nothing has been rated. */
const HL_POINTS = { NY: 0, D: 1, S: 2, B: 2 };
function hlWsScore(rec) {
  const r = (rec && rec.ratings) || {}; let pts = 0, max = 0, star = false;
  Object.keys(r).forEach(k => { const v = r[k]; if (v in HL_POINTS) { pts += HL_POINTS[v]; max += 2; if (v === "B") star = true; } });
  return max ? { pts, max, pct: Math.round(pts / max * 100), star } : null;
}
const hlScoreText = sc => sc ? `${sc.pts}/${sc.max} · ${sc.pct}%${sc.star ? " ★" : ""}` : "—";

/* Derived selectors */
const hlBook = id => D.BOOKS.find(b => b.id === id);
const hlWsRec = (L, code) => (L.worksheets || {})[code] || { status: "not_started", resp: {}, reads: [] };
const hlClassLearners = (state, classId) => Object.values(state.learners).filter(l => l.classId === classId);
function hlLessonRec(L, id = D.LESSON_ID) { return L.lessons[id] || { status: "not_started", step: 0, attempts: [] }; }
function hlBestAttempt(rec) { return rec.attempts.reduce((b, a) => (!b || a.score > b.score ? a : b), null); }
function hlLastAttempt(rec) { return rec.attempts[rec.attempts.length - 1] || null; }
function hlAvgScore(L) {
  const all = Object.values(L.lessons).flatMap(r => r.attempts.length ? [hlLastAttempt(r)] : []);
  return all.length ? Math.round(all.reduce((s, a) => s + a.score / a.total, 0) / all.length * 100) : null;
}
function hlFlags(L, cls) {
  const f = []; const rec = hlLessonRec(L); const last = hlLastAttempt(rec);
  if (last && !last.pass) f.push("Below pass mark");
  if (L.lastActive >= 7 && L.lastActive < 99) f.push(`Inactive ${L.lastActive} days`);
  if (cls && L.level < cls.expected - 1) f.push("Below expected level");
  if (L.isNew) f.push("Not started");
  return f;
}
function hlAssignedFor(state, L) {
  return state.assignments.filter(a => a.classId === L.classId && (a.to === "all" || (Array.isArray(a.to) && a.to.includes(L.id))));
}
function hlAssignStatus(L, a) {
  if (a.type === "lesson") { const r = hlLessonRec(L, a.ref); return r.status; }
  if (a.type === "worksheet") { const r = (L.worksheets || {})[a.ref]; return !r ? "not_started" : r.status === "reviewed" || r.status === "handed_in" ? "complete" : "in_progress"; }
  if (a.type === "book") { const r = L.reading[a.ref]; return L.booksDone.includes(a.ref) ? "complete" : r ? "in_progress" : "not_started"; }
  return "in_progress";
}
Object.assign(window, { hlWsScore, hlScoreText, HLProvider, useHL, hlBook, hlWsRec, hlClassLearners, hlLessonRec, hlBestAttempt, hlLastAttempt, hlAvgScore, hlFlags, hlAssignedFor, hlAssignStatus });
