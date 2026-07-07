/* ============================================================
   Haaraya — Reading-check (quiz) data layer  ·  Supabase source
   ------------------------------------------------------------
   The after-book reading checks are served LIVE from Supabase so
   authors can update questions in the database without rebuilding
   the app. Nothing is baked into the client.

   Schema (flat): supabase/quiz_deploy.sql
     reading_checks       — one row per book's check (Q1/Q2/Q3 columns)
     reading_check_codes  — every code that resolves to a check
                            (new · legacy · live DB), FK -> reading_checks.id

   A book is reached by DIFFERENT codes in different places
   (new S-03-02 · legacy S-03-020 · live DB S-03-02), so we resolve
   through the alias table, never a single code column.

   Exposes window.HaarayaQuizDB:
     await HaarayaQuizDB.get(code)   -> { questions, write, retryNote, source }
                                        or null when the DB has no check
     await HaarayaQuizDB.preload()   -> warm the whole cache in one round-trip
     HaarayaQuizDB.ready()           -> boolean (client present)

   Returned shape matches what the reader expects:
     { questions:[{ q, options:[a,b,c], answer:0|1|2 }],
       write:{ prompt, answer }|null,
       retryNote:string,
       source:'supabase' }
   ============================================================ */
(function () {
  "use strict";

  var CHECK_COLS =
    "kind,write_prompt,write_answer,retry_note," +
    "q1_text,q1_a,q1_b,q1_c,q1_correct," +
    "q2_text,q2_a,q2_b,q2_c,q2_correct," +
    "q3_text,q3_a,q3_b,q3_c,q3_correct";

  var cache = Object.create(null); // code -> check | null (negative cached too)
  var preloaded = false;
  var preloadPromise = null;

  function sb() { return window.HaarayaSupabase || null; }

  function clean(v) { return (v == null) ? "" : String(v); }

  // Map a flat reading_checks row to the reader's check shape.
  function rowToCheck(rc) {
    if (!rc) return null;
    var qs = [];
    for (var i = 1; i <= 3; i++) {
      var t = rc["q" + i + "_text"];
      if (t == null || t === "") continue;
      var opts = [rc["q" + i + "_a"], rc["q" + i + "_b"], rc["q" + i + "_c"]]
        .filter(function (o) { return o != null && o !== ""; })
        .map(clean);
      var ans = parseInt(rc["q" + i + "_correct"], 10);
      if (isNaN(ans) || ans < 0 || ans >= opts.length) ans = 0;
      qs.push({ q: clean(t), options: opts, answer: ans });
    }
    if (!qs.length) return null;
    var write = (rc.write_prompt && rc.write_prompt !== "")
      ? { prompt: clean(rc.write_prompt), answer: clean(rc.write_answer) }
      : null;
    return { questions: qs, write: write, retryNote: clean(rc.retry_note), source: "supabase" };
  }

  // Fetch a single check by any of its codes.
  async function get(code) {
    if (!code) return null;
    if (code in cache) return cache[code];
    var client = sb();
    if (!client) return null;
    try {
      var res = await client
        .from("reading_check_codes")
        .select("reading_checks(" + CHECK_COLS + ")")
        .eq("code", code)
        .maybeSingle();
      if (res.error) throw res.error;
      var rc = res.data && res.data.reading_checks;
      var check = rowToCheck(rc);
      cache[code] = check;   // cache hit or miss
      return check;
    } catch (e) {
      if (window.console) console.warn("[Quiz] Supabase get(" + code + ") failed:", e.message || e);
      return null; // do NOT poison cache on a transient/network error
    }
  }

  // Warm the whole cache in one query (every code -> its check).
  function preload() {
    if (preloadPromise) return preloadPromise;
    var client = sb();
    if (!client) return Promise.resolve(false);
    preloadPromise = (async function () {
      try {
        var res = await client
          .from("reading_check_codes")
          .select("code,reading_checks(" + CHECK_COLS + ")");
        if (res.error) throw res.error;
        (res.data || []).forEach(function (row) {
          cache[row.code] = rowToCheck(row.reading_checks);
        });
        preloaded = true;
        return true;
      } catch (e) {
        if (window.console) console.warn("[Quiz] Supabase preload failed:", e.message || e);
        preloadPromise = null; // allow a later retry
        return false;
      }
    })();
    return preloadPromise;
  }

  window.HaarayaQuizDB = {
    get: get,
    preload: preload,
    ready: function () { return !!sb(); },
    isPreloaded: function () { return preloaded; },
    _cache: cache,
  };

  // Best-effort warm-up once the client is present (non-blocking).
  if (sb()) { try { preload(); } catch (e) { /* ignore */ } }
})();
