/* ============================================================
   Haaraya — Admin control-center data layer  ·  Supabase source
   ------------------------------------------------------------
   The Haaraya Admin (owner back end) reads the LIVE content that
   actually drives the site — the 469 About pages and 469 Reading
   Checks (quizzes) authors maintain in Supabase — instead of the
   mock in-memory seed. Nothing here is baked into the client.

   Tables (see supabase/about_deploy.sql, supabase/quiz_deploy.sql):
     about_pages       — one row per book (front-matter "About this book")
     reading_checks    — one row per book (after-book quiz: Q1/Q2/Q3 + write)

   Both key on book_code (1:1, 469 rows each), so the catalogue is a
   straight merge on book_code — no alias table needed for the admin
   overview (that resolution only matters for the reader's lookups).

   Exposes window.HaarayaAdminDB:
     await preload()          -> warm the merged catalogue (2 round-trips)
     await overview()         -> counts + by-strand + by-level + quiz kinds
     await catalogue(filter)  -> merged rows { code,title,strand,strandUi,
                                   level,kind,hasAbout,hasQuiz }
     await get(book_code)     -> { about, check } full content for inspect
     ready()                  -> boolean (client present)
   ============================================================ */
(function () {
  "use strict";

  function sb() { return window.HaarayaSupabase || null; }
  function clean(v) { return (v == null) ? "" : String(v); }

  /* DB strand display name -> UI strand key used by STRANDS / StrandPill */
  var STRAND_NAME_TO_UI = {
    "Soundables":      "soundables",
    "Soundables+":     "soundables-plus",
    "Hafwas":          "hafwas",
    "Tafiya Fiction":  "tafiya",
    "Tafiya NF":       "tafiya-nonfiction",
    "Tafiya Folktale": "folktale",
    "Tafiya Poetry":   "poetry",
    "Tafiya Duniya":   "duniya",
    "Stamina Fiction": "stamina",
    "Stamina NF":      "stamina-nonfiction",
  };
  function strandUi(name) { return STRAND_NAME_TO_UI[name] || null; }

  var CHECK_COLS =
    "book_code,book_title,level,strand,kind,write_prompt,write_answer,retry_note," +
    "q1_text,q1_a,q1_b,q1_c,q1_correct," +
    "q2_text,q2_a,q2_b,q2_c,q2_correct," +
    "q3_text,q3_a,q3_b,q3_c,q3_correct";

  var ABOUT_COLS =
    "book_code,title,strand,level,about_text,read_to_find_out," +
    "focus_visible,focus_sound,soundbite,sound_cue,sound_cue_check,updated_at";

  /* Merged catalogue cache: book_code -> merged row */
  var catalogueCache = null;      // array
  var catalogueByCode = null;     // map
  var preloadPromise = null;

  function rowToCheck(rc) {
    if (!rc) return null;
    var qs = [];
    for (var i = 1; i <= 3; i++) {
      var t = rc["q" + i + "_text"];
      if (t == null || t === "") continue;
      var opts = [rc["q" + i + "_a"], rc["q" + i + "_b"], rc["q" + i + "_c"]]
        .filter(function (o) { return o != null && o !== ""; }).map(clean);
      var ans = parseInt(rc["q" + i + "_correct"], 10);
      if (isNaN(ans) || ans < 0 || ans >= opts.length) ans = 0;
      qs.push({ q: clean(t), options: opts, answer: ans });
    }
    var write = (rc.write_prompt && rc.write_prompt !== "")
      ? { prompt: clean(rc.write_prompt), answer: clean(rc.write_answer) } : null;
    return { kind: clean(rc.kind), questions: qs, write: write, retryNote: clean(rc.retry_note) };
  }

  function preload() {
    if (preloadPromise) return preloadPromise;
    var client = sb();
    if (!client) return Promise.resolve(false);
    preloadPromise = (async function () {
      try {
        var aRes = await client.from("about_pages").select("book_code,title,strand,level,updated_at");
        if (aRes.error) throw aRes.error;
        var cRes = await client.from("reading_checks").select("book_code,book_title,level,strand,kind");
        if (cRes.error) throw cRes.error;

        var checkByCode = Object.create(null);
        (cRes.data || []).forEach(function (r) { checkByCode[r.book_code] = r; });

        var byCode = Object.create(null);
        var list = [];
        (aRes.data || []).forEach(function (a) {
          var c = checkByCode[a.book_code];
          var name = a.strand || (c && c.strand) || "";
          var row = {
            code: a.book_code,
            title: clean(a.title) || (c && clean(c.book_title)),
            strand: name,
            strandUi: strandUi(name),
            level: (a.level != null ? Number(a.level) : (c ? Number(c.level) : null)),
            kind: c ? clean(c.kind) : null,
            hasAbout: true,
            hasQuiz: !!c,
            updatedAt: a.updated_at || null,
          };
          byCode[row.code] = row; list.push(row);
        });
        // checks with no about page (should be none, but stay honest)
        (cRes.data || []).forEach(function (c) {
          if (byCode[c.book_code]) return;
          var name = c.strand || "";
          var row = {
            code: c.book_code, title: clean(c.book_title), strand: name,
            strandUi: strandUi(name), level: (c.level != null ? Number(c.level) : null),
            kind: clean(c.kind), hasAbout: false, hasQuiz: true, updatedAt: null,
          };
          byCode[row.code] = row; list.push(row);
        });

        list.sort(function (a, b) {
          return (a.level - b.level) || String(a.code).localeCompare(String(b.code));
        });
        catalogueCache = list;
        catalogueByCode = byCode;
        return true;
      } catch (e) {
        if (window.console) console.warn("[Admin] Supabase preload failed:", e.message || e);
        preloadPromise = null; // allow retry
        return false;
      }
    })();
    return preloadPromise;
  }

  async function catalogue(filter) {
    filter = filter || {};
    await preload();
    var list = catalogueCache || [];
    if (filter.strandUi) list = list.filter(function (r) { return r.strandUi === filter.strandUi; });
    if (filter.level)    list = list.filter(function (r) { return r.level === Number(filter.level); });
    if (filter.kind)     list = list.filter(function (r) { return r.kind === filter.kind; });
    if (filter.search) {
      var q = String(filter.search).toLowerCase();
      list = list.filter(function (r) {
        return (r.title || "").toLowerCase().indexOf(q) >= 0 ||
               (r.code || "").toLowerCase().indexOf(q) >= 0;
      });
    }
    return list.slice();
  }

  async function overview() {
    await preload();
    var list = catalogueCache || [];
    var byStrand = {}, byLevel = {}, kinds = {};
    var withQuiz = 0, withAbout = 0;
    list.forEach(function (r) {
      var sk = r.strandUi || r.strand || "—";
      byStrand[sk] = (byStrand[sk] || 0) + 1;
      if (r.level != null) byLevel[r.level] = (byLevel[r.level] || 0) + 1;
      if (r.kind) kinds[r.kind] = (kinds[r.kind] || 0) + 1;
      if (r.hasQuiz) withQuiz++;
      if (r.hasAbout) withAbout++;
    });
    return {
      total: list.length,
      aboutPages: withAbout,
      readingChecks: withQuiz,
      strandCount: Object.keys(byStrand).length,
      levelCount: Object.keys(byLevel).length,
      byStrand: byStrand,
      byLevel: byLevel,
      kinds: kinds,
    };
  }

  async function get(code) {
    if (!code) return null;
    var client = sb();
    if (!client) return null;
    try {
      var aRes = await client.from("about_pages").select(ABOUT_COLS).eq("book_code", code).maybeSingle();
      var cRes = await client.from("reading_checks").select(CHECK_COLS).eq("book_code", code).maybeSingle();
      var a = aRes.data || null;
      var about = a ? {
        title: clean(a.title), strand: clean(a.strand), level: a.level,
        about: clean(a.about_text), read: clean(a.read_to_find_out),
        focusVisible: clean(a.focus_visible), focusSound: clean(a.focus_sound),
        soundbite: clean(a.soundbite), soundCue: clean(a.sound_cue),
        soundCueCheck: !!a.sound_cue_check, updatedAt: a.updated_at || null,
      } : null;
      return { about: about, check: rowToCheck(cRes.data) };
    } catch (e) {
      if (window.console) console.warn("[Admin] Supabase get(" + code + ") failed:", e.message || e);
      return null;
    }
  }

  /* ---- Operational data (people / orgs / access / progress) ----------
     These tables carry personal data, so they live behind RLS and are
     only readable by a signed-in Haaraya admin (see
     supabase/admin_read_grants.sql). Every fetch degrades gracefully:
     it returns { rows, error, denied, missing } and never throws, so the
     dashboard can show a "grant pending / sign in" state per section
     instead of blanking out. */
  async function fetchTable(name, opts) {
    opts = opts || {};
    var client = sb();
    if (!client) return { rows: [], error: "no-client", denied: false, missing: false };
    try {
      var q = client.from(name).select(opts.select || "*", { count: "exact" });
      if (opts.order) q = q.order(opts.order, { ascending: opts.ascending !== false });
      if (opts.limit) q = q.limit(opts.limit);
      var res = await q;
      if (res.error) {
        var code = res.error.code || "";
        return {
          rows: [], count: null, error: res.error.message || String(res.error),
          denied: code === "42501" || code === "PGRST301" || code === "PGRST116",
          missing: code === "PGRST205" || code === "42P01",
        };
      }
      return { rows: res.data || [], count: res.count, error: null, denied: false, missing: false };
    } catch (e) {
      return { rows: [], count: null, error: e.message || String(e), denied: false, missing: false };
    }
  }

  async function count(name) {
    var client = sb();
    if (!client) return { count: null, error: "no-client", denied: false };
    try {
      var res = await client.from(name).select("*", { count: "exact", head: true });
      if (res.error) {
        var code = res.error.code || "";
        return { count: null, error: res.error.message, denied: code === "42501", missing: code === "PGRST205" };
      }
      return { count: res.count, error: null, denied: false, missing: false };
    } catch (e) { return { count: null, error: e.message, denied: false }; }
  }

  async function isStaff() {
    try {
      if (!window.HaarayaAuth) return false;
      var user = await window.HaarayaAuth.getUser();
      if (!user) return false;
      var p = null; try { p = await window.HaarayaAuth.getProfile(); } catch (e) {}
      return !!(p && (p.role === "haaraya_admin" || p.role === "admin" || p.role === "staff"));
    } catch (e) { return false; }
  }

  async function currentUser() {
    try {
      if (!window.HaarayaAuth) return null;
      var user = await window.HaarayaAuth.getUser();
      if (!user) return null;
      var p = null; try { p = await window.HaarayaAuth.getProfile(); } catch (e) {}
      return { email: user.email, name: (p && p.full_name) || user.email, role: (p && p.role) || null };
    } catch (e) { return null; }
  }

  var ops = {
    users:       function () { return fetchTable("users", { select: "id,full_name,email,role,created_at", order: "created_at", ascending: false }); },
    children:    function () { return fetchTable("children", { select: "id,display_name,current_level_id,school_id,created_at", order: "created_at", ascending: false }); },
    schools:     function () { return fetchTable("schools", { select: "id,name,type,country,city,created_at", order: "created_at", ascending: false }); },
    classrooms:  function () { return fetchTable("classrooms", { select: "id,name,school_id,teacher_user_id,created_at", order: "created_at", ascending: false }); },
    subscriptions: function () { return fetchTable("subscriptions", { select: "id,plan_type,billing_cycle,status,max_children,owner_user_id,school_id,started_at,expires_at" }); },
    assignments: function () { return fetchTable("assignments", { select: "id,status,assignment_type,assigned_at" }); },
    progress:    function () { return fetchTable("reading_progress", { select: "id,status,times_read" }); },
    strands:     function () { return fetchTable("strands", { select: "id,name,slug,color,is_active", order: "id" }); },
    levels:      function () { return fetchTable("levels", { select: "id,level_number,level_code,level_name,band,badge_color", order: "sort_order" }); },
    odyssey:     function () { return fetchTable("odyssey_books", {}); },
  };

  window.HaarayaAdminDB = {
    preload: preload,
    overview: overview,
    catalogue: catalogue,
    get: get,
    ready: function () { return !!sb(); },
    strandUi: strandUi,
    isStaff: isStaff,
    currentUser: currentUser,
    ops: ops,
    fetchTable: fetchTable,
    count: count,
    _catalogue: function () { return catalogueCache; },
  };

  if (sb()) { try { preload(); } catch (e) { /* ignore */ } }
})();
