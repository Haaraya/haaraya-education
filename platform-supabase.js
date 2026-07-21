/* ============================================================
   Haaraya — Platform data layer  ·  Supabase source (REAL users)
   ------------------------------------------------------------
   This is the LIVE counterpart to data/api.js (the in-memory mock
   that powers the DEMO accounts). It reads the real dashboard
   tables — users / children / schools / classrooms / subscriptions /
   assignments / reading_progress / passport_stamps — scoped to the
   SIGNED-IN Supabase auth user via public.users.auth_uid = auth.uid()
   and the RLS policies in supabase/platform_rls.sql.

   DEMO accounts never touch this file — they stay on HaarayaApi.
   The dashboards pick one or the other at runtime via
   HaarayaSession.isReal().

   It mirrors the HaarayaApi method NAMES + return SHAPES the
   dashboards consume, so a screen can do:
       const Api = real ? HaarayaPlatformDB : HaarayaApi;
   and keep the same call sites. Scoping args (parentId, schoolId…)
   are ignored here — scope comes from the auth session, not an id.

   Every method degrades gracefully: on no-client / RLS-denied /
   empty table it returns a sensible empty value and never throws,
   so a real user with an un-seeded DB sees empty states, not a
   crash. Exposes window.HaarayaPlatformDB.
   ============================================================ */
(function () {
  "use strict";

  function sb() { return window.HaarayaSupabase || null; }
  function clean(v) { return (v == null) ? "" : String(v); }
  function num(v) { var n = Number(v); return isNaN(n) ? null : n; }

  /* DB strand slug → UI strand key used by StrandLogo / STRANDS palette.
     Mirrors data/api.js STRAND_SLUG_TO_UI so cards colour correctly. */
  var STRAND_SLUG_TO_UI = {
    "soundables": "soundables",
    "hafwas": "hafwas",
    "tafiya-fiction": "tafiya",
    "tafiya": "tafiya",
    "tafiya-folktale": "folktale",
    "tafiya-folktales": "folktale",
    "tafiya-non-fiction": "tafiya",
    "tafiya-nonfiction": "tafiya",
    "tafiya-poetry": "poetry",
    "soundables-plus": "soundables-plus",
    "tafiya-duniya": "duniya",
    "duniya": "duniya",
    "stamina": "stamina",
    "stamina-fiction": "stamina",
    "stamina-non-fiction": "stamina-nonfiction",
  };
  function strandUiFromSlug(slug) {
    if (!slug) return "tafiya";
    var s = String(slug).toLowerCase();
    return STRAND_SLUG_TO_UI[s] || s;
  }

  /* Deterministic avatar colour from a name (children have no colour column). */
  var AV_COLORS = ["#1565C0", "#E65100", "#8E24AA", "#00838F", "#2E7D32", "#AD1457", "#5E35B1", "#00695C", "#EF6C00"];
  function avatarColor(name) {
    var str = clean(name) || "?";
    var h = 0;
    for (var i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return AV_COLORS[h % AV_COLORS.length];
  }
  function firstName(full) { return (clean(full).split(/\s+/)[0]) || clean(full); }

  /* ── cached lookups (fetched once) ───────────────────────── */
  var profileP = null;   // Promise<profile|null>
  var mapsP = null;      // Promise<{ levelById, levelTotals }>

  function profile() {
    if (profileP) return profileP;
    profileP = (async function () {
      var client = sb();
      if (!client || !window.HaarayaAuth) return null;
      try {
        var u = await window.HaarayaAuth.getUser();
        if (!u) return null;
        var res = await client.from("users").select("*").eq("auth_uid", u.id).maybeSingle();
        if (res.error) throw res.error;
        return res.data || null;
      } catch (e) {
        if (window.console) console.warn("[Platform] profile() failed:", e.message || e);
        return null;
      }
    })();
    return profileP;
  }

  /* levels: uuid → level_number ; book counts per level_number */
  function maps() {
    if (mapsP) return mapsP;
    mapsP = (async function () {
      var out = { levelById: Object.create(null), levelName: Object.create(null), levelTotals: Object.create(null) };
      var client = sb();
      if (!client) return out;
      try {
        var lv = await client.from("levels").select("id,level_number,level_name");
        (lv.data || []).forEach(function (r) {
          out.levelById[r.id] = num(r.level_number);
          out.levelName[num(r.level_number)] = clean(r.level_name);
        });
      } catch (e) { /* ignore */ }
      try {
        // Count catalogue books per numeric level (books.level is text).
        var bk = await client.from("books").select("level");
        (bk.data || []).forEach(function (r) {
          var n = num(r.level);
          if (n == null) return;
          out.levelTotals[n] = (out.levelTotals[n] || 0) + 1;
        });
      } catch (e) { /* ignore */ }
      return out;
    })();
    return mapsP;
  }

  function resetCaches() { profileP = null; mapsP = null; }
  if (window.HaarayaAuth && window.HaarayaAuth.onChange) {
    try { window.HaarayaAuth.onChange(function () { resetCaches(); }); } catch (e) { /* ignore */ }
  }

  /* ── row → app shape ─────────────────────────────────────── */
  function childShape(r, lm) {
    if (!r) return null;
    var dn = clean(r.display_name) || [clean(r.first_name), clean(r.last_name)].filter(Boolean).join(" ");
    var short = clean(r.first_name) || firstName(dn) || dn;
    return {
      id: r.id,
      shortName: short,
      displayName: dn || short,
      avatarColor: avatarColor(dn || short),
      avatarUrl: clean(r.avatar_url) || null,
      currentLevelId: (lm && lm.levelById[r.current_level_id]) || 1,
      readingMode: clean(r.reading_mode) || "automatic",
      schoolId: r.school_id || null,
    };
  }

  /* ── PEOPLE ──────────────────────────────────────────────── */
  async function getCurrentParent() {
    var p = await profile();
    if (!p) return null;
    return { id: p.id, displayName: clean(p.full_name), shortName: firstName(p.full_name), email: clean(p.email) };
  }
  var getCurrentTeacher = getCurrentParent; // same profile shape

  async function getChildrenForParent() {
    var client = sb(); var p = await profile();
    if (!client || !p) return [];
    try {
      var lm = await maps();
      var res = await client.from("children").select("*").eq("parent_user_id", p.id);
      if (res.error) throw res.error;
      return (res.data || []).map(function (r) { return childShape(r, lm); });
    } catch (e) {
      if (window.console) console.warn("[Platform] getChildrenForParent failed:", e.message || e);
      return [];
    }
  }

  async function getChild(childId) {
    var client = sb();
    if (!client || !childId) return null;
    try {
      var lm = await maps();
      var res = await client.from("children").select("*").eq("id", childId).maybeSingle();
      if (res.error) throw res.error;
      return childShape(res.data, lm);
    } catch (e) { return null; }
  }

  /* ── PROGRESS / PASSPORT ─────────────────────────────────── */
  // reading_progress rows for a child, with the joined book's level/strand.
  async function progressRows(childId) {
    var client = sb();
    if (!client || !childId) return [];
    try {
      var res = await client
        .from("reading_progress")
        .select("id,status,current_page,updated_at,completed_at,times_read,book:books(book_code,title,level,strand)")
        .eq("child_id", childId);
      if (res.error) throw res.error;
      return res.data || [];
    } catch (e) {
      if (window.console) console.warn("[Platform] progressRows failed:", e.message || e);
      return [];
    }
  }

  async function getChildReadingProgress(childId) {
    var rows = await progressRows(childId);
    return rows.map(function (r) {
      return {
        id: r.id, childId: childId,
        status: clean(r.status) || "not_started",
        pagesRead: num(r.current_page) || 0,
        completedAt: r.completed_at || null,
        updatedAt: r.updated_at || null,
        timesRead: num(r.times_read) || 0,
        bookCode: r.book ? clean(r.book.book_code) : null,
        levelId: r.book ? num(r.book.level) : null,
        strandUi: r.book ? strandUiFromSlug(r.book.strand) : "tafiya",
      };
    });
  }

  async function getPassportStamps(childId) {
    var client = sb();
    if (!client || !childId) return [];
    try {
      var res = await client
        .from("passport_stamps")
        .select("id,stamp_name,stamp_type,stamp_image_url,earned_at,book:books(book_code,title,level,strand),strand:strands(slug),level:levels(level_number)")
        .eq("child_id", childId)
        .order("earned_at", { ascending: true });
      if (res.error) throw res.error;
      return (res.data || []).map(function (r) {
        var title = clean(r.stamp_name) || (r.book && clean(r.book.title)) || "Stamp";
        var slug = (r.book && r.book.strand) || (r.strand && r.strand.slug) || null;
        var lvl = (r.level && num(r.level.level_number)) || (r.book && num(r.book.level)) || null;
        return {
          code: r.book ? clean(r.book.book_code) : r.id,
          bookId: r.book ? clean(r.book.book_code) : null,
          title: title,
          levelId: lvl,
          strandUi: strandUiFromSlug(slug),
          earnedAt: r.earned_at ? String(r.earned_at).slice(0, 10) : null,
        };
      });
    } catch (e) {
      if (window.console) console.warn("[Platform] getPassportStamps failed:", e.message || e);
      return [];
    }
  }

  async function getChildSummary(childId) {
    var lm = await maps();
    var child = await getChild(childId);
    if (!child) return null;
    var rows = await progressRows(childId);
    var completed = rows.filter(function (r) { return r.status === "completed"; });
    var inProgress = rows.filter(function (r) { return r.status === "in_progress"; });
    var stamps = await getPassportStamps(childId);
    var lvl = child.currentLevelId;
    var doneThisLevel = completed.filter(function (r) { return r.book && num(r.book.level) === lvl; }).length;
    var totalThisLevel = lm.levelTotals[lvl] || 0;
    return {
      child: child,
      booksCompleted: completed.length,
      booksInProgress: inProgress.length,
      stampsEarned: stamps.length,
      currentLevelCompleted: doneThisLevel,
      currentLevelTotal: totalThisLevel,
      currentLevelPct: totalThisLevel ? Math.round((doneThisLevel / totalThisLevel) * 100) : 0,
    };
  }

  async function getReadingPathProgress(childId) {
    var s = await getChildSummary(childId);
    if (!s) return { total: 0, completed: 0, pct: 0 };
    return { total: s.currentLevelTotal, completed: s.currentLevelCompleted, pct: s.currentLevelPct };
  }

  /* ── SUBSCRIPTION ────────────────────────────────────────── */
  async function getSubscriptionForParent() {
    var client = sb(); var p = await profile();
    if (!client || !p) return null;
    try {
      var res = await client.from("subscriptions").select("*").eq("owner_user_id", p.id).limit(1).maybeSingle();
      if (res.error) throw res.error;
      var s = res.data;
      if (!s) return null;
      return {
        plan: clean(s.plan_type) || "family",
        status: clean(s.status),
        maxChildren: num(s.max_children),
        renewsOn: s.expires_at || null,
        billingCycle: clean(s.billing_cycle),
      };
    } catch (e) { return null; }
  }

  /* ── TEACHER ─────────────────────────────────────────────── */
  async function getClassroomsForTeacher() {
    var client = sb(); var p = await profile();
    if (!client || !p) return [];
    try {
      var res = await client.from("classrooms").select("id,name,school_id,school:schools(name)").eq("teacher_user_id", p.id);
      if (res.error) throw res.error;
      var list = res.data || [];
      // pupil counts per classroom
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        try {
          var cc = await client.from("classroom_children").select("child_id", { count: "exact", head: true }).eq("classroom_id", c.id);
          c.pupilCount = cc.count || 0;
        } catch (e) { c.pupilCount = 0; }
        c.school = c.school || null;
      }
      return list.map(function (c) {
        return { id: c.id, name: clean(c.name), pupilCount: c.pupilCount || 0, school: c.school ? { name: clean(c.school.name) } : null };
      });
    } catch (e) {
      if (window.console) console.warn("[Platform] getClassroomsForTeacher failed:", e.message || e);
      return [];
    }
  }

  async function classroomChildIds(classroomId) {
    var client = sb();
    if (!client || !classroomId) return [];
    try {
      var res = await client.from("classroom_children").select("child_id").eq("classroom_id", classroomId);
      if (res.error) throw res.error;
      return (res.data || []).map(function (r) { return r.child_id; });
    } catch (e) { return []; }
  }

  async function getChildrenForClassroom(classroomId) {
    var ids = await classroomChildIds(classroomId);
    var out = [];
    for (var i = 0; i < ids.length; i++) { var c = await getChild(ids[i]); if (c) out.push(c); }
    return out;
  }

  async function getClassReadingProgress(classroomId) {
    var ids = await classroomChildIds(classroomId);
    var out = [];
    for (var i = 0; i < ids.length; i++) { var s = await getChildSummary(ids[i]); if (s) out.push(s); }
    return out;
  }

  async function getClassReadingPathProgress(classroomId) {
    var summaries = await getClassReadingProgress(classroomId);
    var total = 0, completed = 0;
    summaries.forEach(function (s) { total += s.currentLevelTotal; completed += s.currentLevelCompleted; });
    return { total: total, completed: completed, pct: total ? Math.round((completed / total) * 100) : 0, pupilCount: summaries.length };
  }

  async function getSupportAlerts(classroomId) {
    var summaries = await getClassReadingProgress(classroomId);
    var alerts = [];
    summaries.forEach(function (s) {
      var c = s.child;
      if (s.booksCompleted === 0) {
        alerts.push({ child: c, severity: "warn", reason: "not started", detail: "No books completed yet" });
      } else if (s.currentLevelCompleted < 2 && c.currentLevelId > 1) {
        alerts.push({ child: c, severity: "info", reason: "stuck", detail: "Only " + s.currentLevelCompleted + " books at L" + c.currentLevelId });
      }
    });
    return alerts;
  }

  async function getAssignmentsForClassroom(classroomId) {
    var client = sb();
    if (!client || !classroomId) return [];
    // assignments are per-child in this schema; roll up the classroom's children.
    var ids = await classroomChildIds(classroomId);
    if (!ids.length) return [];
    try {
      var res = await client
        .from("assignments")
        .select("id,status,assignment_type,assigned_at,due_date,book:books(book_code,title,level,strand)")
        .in("child_id", ids);
      if (res.error) throw res.error;
      return (res.data || []).map(function (a) {
        return {
          id: a.id,
          status: clean(a.status),
          completedPct: a.status === "completed" ? 100 : 0,
          dueOn: a.due_date || null,
          assignmentType: clean(a.assignment_type),
          book: a.book ? { title: clean(a.book.title), strandUi: strandUiFromSlug(a.book.strand), levelId: num(a.book.level) } : null,
        };
      });
    } catch (e) {
      if (window.console) console.warn("[Platform] getAssignmentsForClassroom failed:", e.message || e);
      return [];
    }
  }

  /* ── SCHOOL ADMIN ────────────────────────────────────────── */
  async function mySchoolId() {
    var client = sb(); var p = await profile();
    if (!client || !p) return null;
    try {
      var res = await client.from("schools").select("id").eq("admin_user_id", p.id).limit(1).maybeSingle();
      if (!res.error && res.data) return res.data.id;
    } catch (e) { /* ignore */ }
    try {
      var link = await client.from("teacher_school_links").select("school_id").eq("teacher_user_id", p.id).limit(1).maybeSingle();
      if (!link.error && link.data) return link.data.school_id;
    } catch (e) { /* ignore */ }
    return null;
  }

  async function getSchoolDashboard() {
    var client = sb();
    var schoolId = await mySchoolId();
    if (!client || !schoolId) return null;
    try {
      var lm = await maps();
      var schoolRes = await client.from("schools").select("id,name,type,city,country").eq("id", schoolId).maybeSingle();
      var school = schoolRes.data || { name: "Your school" };

      var linksRes = await client.from("teacher_school_links").select("status,teacher:users(id,full_name,email,role)").eq("school_id", schoolId);
      var teachers = (linksRes.data || []).map(function (l) {
        return { id: l.teacher ? l.teacher.id : Math.random(), role: (l.teacher && clean(l.teacher.role)) || "teacher", teacher: { displayName: (l.teacher && clean(l.teacher.full_name)) || "—", email: (l.teacher && clean(l.teacher.email)) || "" } };
      });

      var classRes = await client.from("classrooms").select("id,name,teacher_user_id,teacher:users(full_name)").eq("school_id", schoolId);
      var classrooms = [];
      for (var i = 0; i < (classRes.data || []).length; i++) {
        var c = classRes.data[i];
        var cc = await client.from("classroom_children").select("child_id", { count: "exact", head: true }).eq("classroom_id", c.id);
        classrooms.push({
          id: c.id, name: clean(c.name), grade: "—",
          primaryTeacher: c.teacher ? { displayName: clean(c.teacher.full_name) } : null,
          pupilCount: cc.count || 0, term: "Term 2", year: new Date().getFullYear(),
        });
      }

      var pupilsRes = await client.from("children").select("*").eq("school_id", schoolId);
      var pupils = (pupilsRes.data || []).map(function (r) { return childShape(r, lm); });

      var subRes = await client.from("subscriptions").select("plan_type,status").eq("school_id", schoolId).limit(1).maybeSingle();
      var subscription = subRes.data ? { plan: clean(subRes.data.plan_type) } : null;

      return { school: school, teachers: teachers, classrooms: classrooms, pupils: pupils, subscription: subscription, sponsored: [] };
    } catch (e) {
      if (window.console) console.warn("[Platform] getSchoolDashboard failed:", e.message || e);
      return null;
    }
  }

  async function getSchoolUsageOverview() {
    var data = await getSchoolDashboard();
    if (!data) return null;
    var pupils = data.pupils || [];
    var totalBooks = 0, totalStamps = 0, levelSum = 0;
    for (var i = 0; i < pupils.length; i++) {
      var s = await getChildSummary(pupils[i].id);
      if (s) { totalBooks += s.booksCompleted; totalStamps += s.stampsEarned; }
      levelSum += pupils[i].currentLevelId || 0;
    }
    return {
      pupilCount: pupils.length,
      teacherCount: (data.teachers || []).length,
      classroomCount: (data.classrooms || []).length,
      totalBooks: totalBooks,
      totalStamps: totalStamps,
      avgLevel: pupils.length ? Math.round((levelSum / pupils.length) * 10) / 10 : 0,
    };
  }

  /* Does a real signed-in user with a platform profile exist? */
  async function isRealUser() {
    var p = await profile();
    return !!p;
  }

  window.HaarayaPlatformDB = {
    ready: function () { return !!sb(); },
    isRealUser: isRealUser,
    profile: profile,
    resetCaches: resetCaches,
    // people
    getCurrentParent: getCurrentParent,
    getCurrentTeacher: getCurrentTeacher,
    getChildrenForParent: getChildrenForParent,
    getChild: getChild,
    // progress / passport
    getChildReadingProgress: getChildReadingProgress,
    getPassportStamps: getPassportStamps,
    getChildSummary: getChildSummary,
    getReadingPathProgress: getReadingPathProgress,
    // subscription
    getSubscriptionForParent: getSubscriptionForParent,
    // teacher
    getClassroomsForTeacher: getClassroomsForTeacher,
    getChildrenForClassroom: getChildrenForClassroom,
    getClassReadingProgress: getClassReadingProgress,
    getClassReadingPathProgress: getClassReadingPathProgress,
    getSupportAlerts: getSupportAlerts,
    getAssignmentsForClassroom: getAssignmentsForClassroom,
    // school admin
    getSchoolDashboard: getSchoolDashboard,
    getSchoolUsageOverview: getSchoolUsageOverview,
  };
})();
