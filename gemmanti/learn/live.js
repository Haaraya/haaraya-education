/* Gemmanti — live data.
   Reads the signed-in person's real schools, classes, children and worksheet
   records from the Haaraya database, and saves worksheet work back.
   Uses the website's own sign-in (window.HaarayaAuth / window.HaarayaSupabase),
   so a person signed in on the Haaraya site is signed in here too.
   Every read and write goes through the database's access rules. */
(function () {
  "use strict";

  // The invented demo is kept for design review: add ?demo to the address.
  var DEMO = /[?&]demo\b/.test(location.search);
  window.HL_LIVE_ON = !DEMO;

  // School accounts only. Parent accounts are a separate product and never use Gemmanti.
  var ROLE = { teacher: "teacher", school_admin: "school", haaraya_admin: "admin" };
  var HELP_TO_DB = { M: "modelled", P: "prompted", I: "independent" };
  var HELP_FROM_DB = { modelled: "M", prompted: "P", independent: "I" };

  function sb() { return window.HaarayaSupabase || null; }
  function rows(res, what) {
    if (res.error) { var e = new Error(what + ": " + (res.error.message || res.error)); e.cause = res.error; throw e; }
    return res.data || [];
  }
  function uniq(a) { return Array.from(new Set(a.filter(Boolean))); }
  function nameOf(c) {
    return c.display_name || [c.first_name, c.last_name].filter(Boolean).join(" ") || "Pupil";
  }
  function day(ts) { return ts ? String(ts).slice(0, 10) : ""; }

  /* ---------- who is signed in ---------- */
  async function whoAmI() {
    if (!window.HaarayaAuth || !sb()) return { error: "offline" };
    var session = null;
    try { session = await window.HaarayaAuth.getSession(); } catch (e) { return { error: "offline" }; }
    if (!session) return { signedOut: true };
    var p = await window.HaarayaAuth.getProfile();
    if (!p) return { noProfile: true };
    return { profile: p, role: ROLE[p.role] || null };
  }

  /* ---------- reads ---------- */
  async function gemmantiSchools(ids) {
    var out = {};
    await Promise.all(uniq(ids).map(async function (id) {
      var r = await sb().rpc("gemmanti_school_enabled", { p_school: id });
      out[id] = !r.error && r.data === true;
    }));
    return out;
  }

  async function childrenByIds(ids) {
    if (!ids.length) return [];
    var res = await sb().from("children")
      .select("id,first_name,last_name,display_name,school_id,parent_user_id,current_level_id")
      .in("id", ids);
    return rows(res, "children");
  }

  async function levelNumbers(levelIds) {
    var ids = uniq(levelIds); if (!ids.length) return {};
    var res = await sb().from("levels").select("id,level_number").in("id", ids);
    if (res.error) return {};
    var m = {}; res.data.forEach(function (l) { m[l.id] = l.level_number; }); return m;
  }

  async function worksheetRecords(childIds, withNotes) {
    var byChild = {};
    if (!childIds.length) return byChild;
    var get = function (t, cols) { return sb().from(t).select(cols).in("child_id", childIds); };
    var all = await Promise.all([
      get("worksheet_responses", "child_id,book_code,responses,reads_done,status,handed_in_at,updated_at"),
      get("worksheet_reviews", "child_id,book_code,ratings,help_level,reviewed_at"),
      withNotes ? get("worksheet_teacher_notes", "child_id,book_code,note") : Promise.resolve({ data: [] })
    ]);
    var put = function (cid, code) {
      var c = byChild[cid] || (byChild[cid] = {});
      return c[code] || (c[code] = { status: "not_started", resp: {}, reads: [] });
    };
    rows(all[0], "worksheet answers").forEach(function (r) {
      var w = put(r.child_id, r.book_code);
      w.resp = r.responses || {}; w.reads = r.reads_done || [];
      w.status = r.status; w.at = day(r.updated_at); if (r.handed_in_at) w.handedAt = day(r.handed_in_at);
    });
    rows(all[1], "worksheet ratings").forEach(function (r) {
      var w = put(r.child_id, r.book_code);
      w.ratings = r.ratings || {}; w.help = HELP_FROM_DB[r.help_level] || null;
      w.status = "reviewed"; w.reviewedAt = day(r.reviewed_at); w.seen = true;
    });
    rows(all[2], "teacher notes").forEach(function (r) { put(r.child_id, r.book_code).note = r.note || ""; });
    return byChild;
  }

  function learnerFrom(c, classId, level, ws) {
    return {
      id: c.id, name: nameOf(c), classId: classId || null, schoolId: c.school_id || null,
      level: level || 1, levelPct: 0, lastActive: 0, weekly: [],
      booksDone: [], reading: {}, lessons: {}, worksheets: ws || {}, achievements: [], skills: null
    };
  }

  async function buildPeople(childIds, classOf, withNotes) {
    var kids = await childrenByIds(childIds);
    var lv = await levelNumbers(kids.map(function (k) { return k.current_level_id; }));
    var ws = await worksheetRecords(kids.map(function (k) { return k.id; }), withNotes);
    var learners = {};
    kids.forEach(function (k) { learners[k.id] = learnerFrom(k, classOf[k.id], lv[k.current_level_id], ws[k.id]); });
    return learners;
  }

  async function classMembers(classIds) {
    if (!classIds.length) return [];
    var res = await sb().from("classroom_children").select("classroom_id,child_id").in("classroom_id", classIds);
    return rows(res, "class lists");
  }

  function baseState(me, role) {
    return {
      v: 3, live: true, role: role, personaId: null, route: { view: role === "admin" ? "schools" : "worksheets" },
      me: me, learners: {}, assignments: [], events: [], requests: [], teachers: [], classes: [], schools: [],
      orgCollections: {}, adminUsers: [], toast: null
    };
  }

  /* show_library arrives with gemmanti_library_switch.sql; until that has run,
     load classes without it so nothing else breaks. */
  async function classRows(q) {
    var r = await q("id,name,school_id,teacher_user_id,show_scores,show_library");
    if (r.error && /show_library/.test(r.error.message || "")) r = await q("id,name,school_id,teacher_user_id,show_scores");
    return rows(r, "classes");
  }

  async function loadStaff(me, role) {
    var s = baseState(me, role);
    var schools, classes;
    if (role === "teacher") {
      classes = await classRows(function (cols) { return sb().from("classrooms").select(cols).eq("teacher_user_id", me.id).order("name"); });
      var sIds = uniq(classes.map(function (c) { return c.school_id; }));
      schools = sIds.length ? rows(await sb().from("schools").select("id,name,type").in("id", sIds), "schools") : [];
    } else {
      schools = rows(await sb().from("schools").select("id,name,type").eq("admin_user_id", me.id), "schools");
      var ids = schools.map(function (x) { return x.id; });
      classes = ids.length ? await classRows(function (cols) { return sb().from("classrooms").select(cols).in("school_id", ids).order("name"); }) : [];
    }
    var on = await gemmantiSchools(schools.map(function (x) { return x.id; }));
    s.schools = schools.map(function (x) { return { id: x.id, name: x.name, type: x.type, gemmanti: !!on[x.id] }; });
    var enabled = {}; s.schools.forEach(function (x) { if (x.gemmanti) enabled[x.id] = true; });
    classes = classes.filter(function (c) { return enabled[c.school_id]; });

    var tIds = uniq(classes.map(function (c) { return c.teacher_user_id; }));
    var tUsers = tIds.length ? (await sb().from("users").select("id,full_name,email").in("id", tIds)).data || [] : [];
    var tName = {}; tUsers.forEach(function (u) { tName[u.id] = u.full_name || u.email || "Teacher"; });
    if (role === "teacher") tName[me.id] = me.name;

    var members = await classMembers(classes.map(function (c) { return c.id; }));
    var classOf = {}; members.forEach(function (m) { if (!classOf[m.child_id]) classOf[m.child_id] = m.classroom_id; });
    s.learners = await buildPeople(Object.keys(classOf), classOf, true);
    var kidIds = Object.keys(s.learners);
    if (kidIds.length) {
      var con = await sb().from("school_pupil_contacts").select("child_id,family_email").in("child_id", kidIds);
      if (!con.error) con.data.forEach(function (c) { if (s.learners[c.child_id]) s.learners[c.child_id].familyEmail = c.family_email || ""; });
    }

    s.classes = classes.map(function (c) {
      return { id: c.id, name: c.name, schoolId: c.school_id, teacherId: c.teacher_user_id, teacherName: tName[c.teacher_user_id] || "No teacher yet",
        expected: null, size: members.filter(function (m) { return m.classroom_id === c.id; }).length,
        showScores: c.show_scores !== false, showLibrary: c.show_library === true };
    });
    s.teachers = tIds.map(function (id) { return { id: id, name: tName[id] || "Teacher", classes: s.classes.filter(function (c) { return c.teacherId === id; }).map(function (c) { return c.id; }) }; });
    return s;
  }

  async function loadAdmin(me) {
    var s = baseState(me, "admin");
    var schools = rows(await sb().from("schools").select("id,name,type,city,country").order("name"), "schools");
    var subs = rows(await sb().from("subscriptions").select("id,school_id,plan_type,status,addons,trial_ends_at").not("school_id", "is", null), "subscriptions");
    s.schools = schools.map(function (x) {
      var mine = subs.filter(function (u) { return u.school_id === x.id; });
      var live = mine.find(function (u) { return u.status === "active" || u.status === "trial"; }) || mine[0] || null;
      return { id: x.id, name: x.name, type: x.type, city: x.city, country: x.country,
        sub: live ? { id: live.id, status: live.status, addons: live.addons || [] } : null,
        gemmanti: !!(live && (live.addons || []).indexOf("gemmanti") >= 0) };
    });
    return s;
  }

  async function load() {
    var who = await whoAmI();
    if (!who.profile) return who;
    var p = who.profile;
    var me = { id: p.id, name: p.full_name || [p.first_name, p.last_name].filter(Boolean).join(" ") || p.email || "You", role: p.role };
    if (!who.role) return { unsupported: true, parentAccount: p.role === "parent", me: me };
    var state;
    if (who.role === "admin") state = await loadAdmin(me);
    else state = await loadStaff(me, who.role);
    return { state: state };
  }

  /* ---------- writes ---------- */
  async function saveWork(childId, code, rec, handingIn) {
    var row = { child_id: childId, book_code: code, responses: rec.resp || {}, reads_done: rec.reads || [],
      status: rec.status === "handed_in" || rec.status === "reviewed" ? "handed_in" : "in_progress" };
    if (handingIn) row.handed_in_at = new Date().toISOString();
    var r = await sb().from("worksheet_responses").upsert(row, { onConflict: "child_id,book_code" });
    if (r.error) throw r.error;
  }

  async function saveReview(childId, code, rec) {
    var r1 = await sb().from("worksheet_reviews").upsert({
      child_id: childId, book_code: code, ratings: rec.ratings || {}, help_level: HELP_TO_DB[rec.help] || null,
      reviewed_at: new Date().toISOString()
    }, { onConflict: "child_id,book_code" });
    if (r1.error) throw r1.error;
    if (rec.note != null) {
      var r2 = await sb().from("worksheet_teacher_notes").upsert({ child_id: childId, book_code: code, note: rec.note || "" }, { onConflict: "child_id,book_code" });
      if (r2.error) throw r2.error;
    }
  }

  async function setGemmanti(sub, on) {
    var addons = (sub.addons || []).filter(function (a) { return a !== "gemmanti"; });
    if (on) addons.push("gemmanti");
    var r = await sb().from("subscriptions").update({ addons: addons }).eq("id", sub.id).select("id,addons");
    if (r.error) throw r.error;
    if (!r.data || !r.data.length) throw new Error("not allowed");
    return r.data[0].addons;
  }

  async function setShowScores(classId, on) {
    var r = await sb().from("classrooms").update({ show_scores: !!on }).eq("id", classId).select("id,show_scores");
    if (r.error) throw r.error;
    if (!r.data || !r.data.length) throw new Error("not allowed");
    return r.data[0].show_scores;
  }

  async function setShowLibrary(classId, on) {
    var r = await sb().from("classrooms").update({ show_library: !!on }).eq("id", classId).select("id,show_library");
    if (r.error) throw r.error;
    if (!r.data || !r.data.length) throw new Error("not allowed");
    return r.data[0].show_library;
  }

  /* The Haaraya book catalogue, for the pupils' library. Loaded once. */
  var SUPA = "https://laihhrkxnxzohaiiisou.supabase.co";
  function coverOf(p) {
    if (!p) return "";
    var raw = String(p).trim();
    if (/^(https?:|data:)/.test(raw)) return raw;
    if (/^(assets\/|thumbnails\/)/.test(raw)) return "../" + raw;
    if (raw.indexOf("/storage/v1/object/public/") === 0) return SUPA + raw;
    raw = raw.replace(/^\/+/, "").replace(/^book-assets\//, "").replace(/\.png$/i, ".webp");
    return SUPA + "/storage/v1/object/public/book-assets/" + encodeURI(raw);
  }
  var bookList = null;
  function books() {
    if (bookList) return bookList;
    bookList = sb().from("books").select("book_code,title,level,strand,cover_image_path").range(0, 4999).then(function (r) {
      if (r.error) throw r.error;
      return (r.data || []).filter(function (b) { return b.book_code; }).map(function (b) {
        var m = String(b.level || "").match(/\d+/);
        return { id: b.book_code, t: b.title || b.book_code, l: m ? +m[0] : 0, s: b.strand || "", img: coverOf(b.cover_image_path) };
      }).sort(function (a, b) { return a.l - b.l || a.t.localeCompare(b.t); });
    }).catch(function (e) { bookList = null; throw e; });
    return bookList;
  }

  async function setFamilyEmail(childId, email) {
    var v = String(email || "").trim() || null;
    var r = await sb().from("school_pupil_contacts").upsert({ child_id: childId, family_email: v }, { onConflict: "child_id" });
    if (r.error) throw r.error;
    return v || "";
  }

  // Emails each family its child's report. The server checks who may send and
  // reads the ratings itself; the catalogue only supplies worksheet titles.
  async function emailReports(classId, childIds) {
    var cat = {};
    (window.HLWS ? HLWS.list() : []).forEach(function (w) { cat[w.code] = { title: w.title, level: w.level, strand: w.strand }; });
    var r = await sb().functions.invoke("gemmanti-report-email", { body: { class_id: classId, child_ids: childIds, catalogue: cat } });
    if (r.error) throw r.error;
    return r.data || {};
  }

  async function signOut() { try { await window.HaarayaAuth.signOut(); } catch (e) {} }

  window.HLLive = { demo: DEMO, load: load, saveWork: saveWork, saveReview: saveReview, setGemmanti: setGemmanti, setShowScores: setShowScores, setShowLibrary: setShowLibrary, books: books, setFamilyEmail: setFamilyEmail, emailReports: emailReports, signOut: signOut };
})();
