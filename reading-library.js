/* ============================================================================
   Haaraya — "My reading library": the child's own saved shelf.

   The dashboard used to carry two rails of the same books ("Keep reading" and
   "My reading path"). They now split by OWNERSHIP:
     • My reading path    — system-chosen, the level journey. No storage here.
     • My reading library — child-chosen. This module.

   Books are saveable from either catalogue, and Tafiya and Odyssey books live
   in different tables, so an entry is keyed (source, code) — never a book uuid.

   Writes are optimistic: the shelf updates and repaints immediately, then the
   row goes to Supabase. A failed write is kept locally and retried on the next
   load, so a child never loses a save to a bad connection.

   Loaded after platform-supabase.js and progress-sync.js.
   Exposes window.HaarayaLibrary. Emits "haaraya:library" on every change.
   ============================================================================ */
(function () {
  var CAP = 20;                       // a rail of 60 saved books stops being useful
  var KEY = "haaraya.library.v1";
  var cache = null;                   // array of entries, newest first
  var cacheChild = null;              // child the cache belongs to
  var loadedFromDb = false;

  function db() { return window.HaarayaPlatformDB || null; }
  function sbc() {
    try { return window.HaarayaSupabase ? window.HaarayaSupabase.client() : null; }
    catch (e) { return null; }
  }
  function clean(v) { return v == null ? "" : String(v).trim(); }
  function keyOf(e) { return (e.source || "tafiya") + ":" + clean(e.code); }

  async function childId() {
    try {
      if (window.HaarayaProgressSync && window.HaarayaProgressSync.activeChild) {
        return await window.HaarayaProgressSync.activeChild();
      }
    } catch (e) { /* fall through */ }
    var s = window.HaarayaSession;
    return (s && s.activeChildId && s.activeChildId()) || null;
  }

  /* ── local mirror ──────────────────────────────────────────────────────── */
  function storeKey(cid) { return KEY + "." + (cid || "anon"); }
  function readLocal(cid) {
    try {
      var raw = window.localStorage.getItem(storeKey(cid));
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function writeLocal(cid, arr) {
    try { window.localStorage.setItem(storeKey(cid), JSON.stringify(arr)); }
    catch (e) { /* private mode / quota — the DB is still the record */ }
  }

  function emit() {
    try { window.dispatchEvent(new Event("haaraya:library")); } catch (e) { /* ignore */ }
  }

  /* ── read ──────────────────────────────────────────────────────────────── */
  /* Cached, so the rail, the library grid and the reader button all share one
     fetch. Pass force to re-read after a sign-in or a child switch. */
  async function load(force) {
    var cid = await childId();
    if (!force && cache && cacheChild === cid) return cache;
    cacheChild = cid;
    cache = readLocal(cid);
    loadedFromDb = false;

    var client = sbc();
    if (client && cid) {
      try {
        var res = await client
          .from("child_saved_books")
          .select("source,book_code,title,added_at")
          .eq("child_id", cid)
          .order("added_at", { ascending: false });
        if (res.error) throw res.error;
        var rows = (res.data || []).map(function (r) {
          return {
            source: clean(r.source) || "tafiya",
            code: clean(r.book_code),
            title: clean(r.title),
            addedAt: r.added_at || null,
            synced: true
          };
        });
        // Anything saved offline and not yet in the DB is kept and retried.
        var have = {};
        rows.forEach(function (r) { have[keyOf(r)] = true; });
        var pending = cache.filter(function (e) { return !e.synced && !have[keyOf(e)]; });
        cache = rows.concat(pending);
        loadedFromDb = true;
        writeLocal(cid, cache);
        pending.forEach(function (e) { pushAdd(cid, e); });
      } catch (e) {
        if (window.console) console.warn("[Library] shelf unreadable, using local copy:", e.message || e);
      }
    }
    return cache;
  }

  function listSync() { return cache ? cache.slice() : []; }
  function hasSync(source, code) {
    var k = (source || "tafiya") + ":" + clean(code);
    return listSync().some(function (e) { return keyOf(e) === k; });
  }
  function count() { return listSync().length; }
  function isFull() { return count() >= CAP; }

  /* ── write ─────────────────────────────────────────────────────────────── */
  async function pushAdd(cid, entry) {
    var client = sbc();
    if (!client || !cid) return false;
    try {
      var res = await client.from("child_saved_books")
        .upsert({
          child_id: cid,
          source: entry.source || "tafiya",
          book_code: entry.code,
          title: entry.title || null
        }, { onConflict: "child_id,source,book_code" });
      if (res.error) throw res.error;
      entry.synced = true;
      writeLocal(cid, cache || []);
      return true;
    } catch (e) {
      if (window.console) console.warn("[Library] save not written yet:", e.message || e);
      return false;
    }
  }

  /* book: { source, code, title, level, strandUi, thumb } */
  async function add(book) {
    var code = clean(book && book.code);
    if (!code) return { ok: false, reason: "args" };
    await load();
    var source = (book.source === "odyssey") ? "odyssey" : "tafiya";
    if (hasSync(source, code)) return { ok: true, already: true };
    if (isFull()) return { ok: false, reason: "full", cap: CAP };

    var entry = {
      source: source, code: code,
      title: clean(book.title), level: book.level != null ? book.level : null,
      strandUi: clean(book.strandUi) || null, thumb: clean(book.thumb) || null,
      addedAt: new Date().toISOString(), synced: false
    };
    cache = [entry].concat(cache || []);
    writeLocal(cacheChild, cache);
    emit();
    await pushAdd(cacheChild, entry);
    return { ok: true, count: count() };
  }

  async function remove(source, code) {
    code = clean(code);
    source = (source === "odyssey") ? "odyssey" : "tafiya";
    await load();
    var k = source + ":" + code;
    cache = (cache || []).filter(function (e) { return keyOf(e) !== k; });
    writeLocal(cacheChild, cache);
    emit();
    var client = sbc();
    if (client && cacheChild) {
      try {
        await client.from("child_saved_books").delete()
          .eq("child_id", cacheChild).eq("source", source).eq("book_code", code);
      } catch (e) {
        if (window.console) console.warn("[Library] remove not written:", e.message || e);
      }
    }
    return { ok: true, count: count() };
  }

  async function toggle(book) {
    var source = (book && book.source === "odyssey") ? "odyssey" : "tafiya";
    await load();
    if (hasSync(source, book.code)) return remove(source, book.code);
    return add(book);
  }

  /* Entries → the shape <Book> renders, resolved against the live catalogue so
     a saved book still shows its cover and level. Falls back to the metadata
     captured at save time when the catalogue has not loaded. */
  function toCards() {
    var T = window.TafiyaData;
    var catalog = (T && T.getCatalog) ? T.getCatalog() : [];
    var byCode = {};
    catalog.forEach(function (b) {
      var c = clean(b.book_code || b.code);
      if (c) byCode[c] = b;
    });
    return listSync().map(function (e) {
      var b = byCode[e.code];
      var strand = e.strandUi || (b && window.TafiyaData && window.TafiyaData.strandKeyOf
        ? window.TafiyaData.strandKeyOf(b) : "tafiya");
      var s = (window.STRANDS && (window.STRANDS[strand] || window.STRANDS.tafiya)) || {};
      return {
        id: e.code,
        source: e.source,
        title: (b && (b.title && b.title.text ? b.title.text : b.title)) || e.title || e.code,
        strand: strand,
        level: (b && b.level) != null ? b.level : e.level,
        c: s.color, bg: s.bg,
        thumb: (b && (b.thumbnail_image_path || b.cover_image_path)) || e.thumb || "",
        saved: true
      };
    });
  }

  if (typeof window !== "undefined") {
    // A sign-in or a child switch changes whose shelf this is.
    window.addEventListener("haaraya:session", function () { cache = null; cacheChild = null; });
    window.addEventListener("haaraya:activechild", function () { cache = null; cacheChild = null; load(true).then(emit); });
  }

  window.HaarayaLibrary = {
    CAP: CAP,
    load: load,
    list: listSync,
    has: hasSync,
    count: count,
    isFull: isFull,
    add: add,
    remove: remove,
    toggle: toggle,
    toCards: toCards,
    /* Console check: is the shelf actually reaching the database? */
    diagnose: async function () {
      var cid = await childId();
      await load(true);
      return {
        childId: cid,
        supabase: !!sbc(),
        loadedFromDb: loadedFromDb,
        saved: count(),
        unsynced: listSync().filter(function (e) { return !e.synced; }).length,
        verdict: !cid ? "No active child — saves stay on this device only."
          : !sbc() ? "Supabase client missing — check supabase-client.js loaded."
          : !loadedFromDb ? "Shelf could not be read — run supabase/reading_library.sql, then check the SELECT policy."
          : "Shelf is live."
      };
    }
  };
})();
