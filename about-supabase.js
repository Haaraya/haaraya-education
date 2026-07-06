/* ============================================================
   Haaraya — "About this book" data layer  ·  Supabase source
   ------------------------------------------------------------
   The front-matter "About this book" content is served LIVE from
   Supabase so authors can update it in the database without
   rebuilding the app. Nothing is baked into the client.

   Schema (flat): supabase/about_deploy.sql
     about_pages       — one row per book
     about_page_codes  — every code that resolves to a page
                         (new · legacy · live DB), FK -> about_pages.id

   A book is reached by DIFFERENT codes in different places
   (new S-03-02 · legacy S-03-020 · live DB S-03-02), so we resolve
   through the alias table, never a single code column.

   Exposes window.HaarayaAboutDB:
     await HaarayaAboutDB.get(code)  -> { title, strand, level, about, read,
                                          focusVisible, focusSound, soundbite,
                                          soundCue, soundCueCheck } | null
     await HaarayaAboutDB.preload()  -> warm the whole cache in one round-trip
     HaarayaAboutDB.ready()          -> boolean (client present)
   ============================================================ */
(function () {
  "use strict";

  var COLS =
    "title,strand,level,about_text,read_to_find_out," +
    "focus_visible,focus_sound,soundbite,sound_cue,sound_cue_check";

  var cache = Object.create(null); // code -> page | null (negative cached too)
  var preloaded = false;
  var preloadPromise = null;

  function sb() { return window.HaarayaSupabase || null; }
  function clean(v) { return (v == null) ? "" : String(v); }

  // Map a flat about_pages row to the reader's camelCase shape.
  function rowToAbout(r) {
    if (!r) return null;
    return {
      title: clean(r.title),
      strand: clean(r.strand),
      level: (r.level == null ? null : Number(r.level)),
      about: clean(r.about_text),
      read: clean(r.read_to_find_out),
      focusVisible: clean(r.focus_visible),
      focusSound: clean(r.focus_sound),
      soundbite: clean(r.soundbite),
      soundCue: clean(r.sound_cue),
      soundCueCheck: !!r.sound_cue_check,
    };
  }

  // Fetch a single about page by any of its codes.
  async function get(code) {
    if (!code) return null;
    if (code in cache) return cache[code];
    var client = sb();
    if (!client) return null;
    try {
      var res = await client
        .from("about_page_codes")
        .select("about_pages(" + COLS + ")")
        .eq("code", code)
        .maybeSingle();
      if (res.error) throw res.error;
      var page = rowToAbout(res.data && res.data.about_pages);
      cache[code] = page;   // cache hit or miss
      return page;
    } catch (e) {
      if (window.console) console.warn("[About] Supabase get(" + code + ") failed:", e.message || e);
      return null; // do NOT poison cache on a transient/network error
    }
  }

  // Warm the whole cache in one query (every code -> its page).
  function preload() {
    if (preloadPromise) return preloadPromise;
    var client = sb();
    if (!client) return Promise.resolve(false);
    preloadPromise = (async function () {
      try {
        var res = await client
          .from("about_page_codes")
          .select("code,about_pages(" + COLS + ")");
        if (res.error) throw res.error;
        (res.data || []).forEach(function (row) {
          cache[row.code] = rowToAbout(row.about_pages);
        });
        preloaded = true;
        return true;
      } catch (e) {
        if (window.console) console.warn("[About] Supabase preload failed:", e.message || e);
        preloadPromise = null; // allow a later retry
        return false;
      }
    })();
    return preloadPromise;
  }

  window.HaarayaAboutDB = {
    get: get,
    preload: preload,
    ready: function () { return !!sb(); },
    isPreloaded: function () { return preloaded; },
    _cache: cache,
  };

  // Best-effort warm-up once the client is present (non-blocking).
  if (sb()) { try { preload(); } catch (e) { /* ignore */ } }
})();
