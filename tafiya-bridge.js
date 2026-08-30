/* ============================================================================
   Tafiya bridge — adapts the real Tafiya catalogue + reading-progress store
   into the data shapes the Passport and Child Dashboard screens expect, so
   those screens no longer depend on the old 396-book mock data.
   Loaded after tafiya-data.js. Exposes window.TafiyaBooks.
   ============================================================================ */
(function () {
  "use strict";
  const T = window.TafiyaData;

  // Resolve a book to its UI strand key. Uses the shared taxonomy in
  // tafiya-data.js so home/dashboards match the library across all 10 strands.
  function strandUiOf(b) {
    if (T && T.strandKeyOf) return T.strandKeyOf(b);
    var t = String(b.book_type || "").toLowerCase();
    if (t.indexOf("hafwas") >= 0) return "hafwas";
    if (t.indexOf("soundables+") >= 0 || t.indexOf("soundables plus") >= 0) return "soundables-plus";
    if (t.indexOf("soundable") >= 0) return "soundables";
    if (t.indexOf("stamina") >= 0) return t.indexOf("non") >= 0 ? "stamina-nonfiction" : "stamina";
    if (t.indexOf("duniya") >= 0) return "duniya";
    if (t.indexOf("poet") >= 0) return "poetry";
    if (t.indexOf("folktale") >= 0) return "folktale";
    if (t.indexOf("non") >= 0) return "tafiya-nonfiction";
    return "tafiya";
  }
  function levelNum(b) { const m = String(b.level || "").match(/\d+/); return m ? +m[0] : 999; }

  function toBook(b) {
    const code = b.book_code || b.code;
    // The cover-PAGE thumbnail is the card image. The catalogue RPC doesn't
    // always carry the path, so _COVERS (from the books table) fills the gap.
    const cover = b.thumbnail_image_path || _COVERS[code] || b.cover_image_path || "";
    return {
      id: code, code: code,
      title: b.title,
      strandUi: strandUiOf(b),
      levelId: levelNum(b),
      bookType: b.book_type,
      audioUrl: null,
      thumbnail_image_path: cover,
    };
  }

  // Cover paths straight from the books table, keyed by book_code. One query,
  // cached, so every dashboard card can show its real front cover.
  let _COVERS = {};
  let _coverPromise = null;
  function loadCovers() {
    if (_coverPromise) return _coverPromise;
    const client = window.HaarayaSupabase;
    if (!client) return (_coverPromise = Promise.resolve(_COVERS));
    _coverPromise = client.from("books").select("book_code,cover_image_path")
      .then(res => {
        // PostgREST resolves on error, so check it explicitly — a schema change
        // must surface here rather than silently emptying the fallback.
        if (res.error) { console.warn("[tafiya-bridge] cover query failed:", res.error.message || res.error); return _COVERS; }
        (res.data || []).forEach(r => {
          const p = r.cover_image_path;
          if (r.book_code && p) _COVERS[r.book_code] = p;
        });
        return _COVERS;
      })
      .catch(() => _COVERS);
    return _coverPromise;
  }

  async function all() {
    const [list] = await Promise.all([
      (T && T.loadCatalog) ? T.loadCatalog() : Promise.resolve(T ? T.getCatalog() : []),
      loadCovers(),
    ]);
    return list.filter(b => b && (b.book_code || b.code)).map(toBook);
  }
  function allSync() { return (T ? T.getCatalog() : []).map(toBook); }

  async function getBooks(filter) {
    filter = filter || {};
    let list = await all();
    if (filter.levelId != null) list = list.filter(b => b.levelId === Number(filter.levelId));
    if (filter.strandUi) list = list.filter(b => b.strandUi === filter.strandUi);
    return list;
  }

  async function getPassportStamps(childId, filter) {
    filter = filter || {};
    const list = await all();
    const out = [];
    list.forEach(b => {
      if (filter.levelId != null && b.levelId !== Number(filter.levelId)) return;
      if (T && T.isCompleted(b.code)) {
        const p = T.progressOf(b.code);
        out.push({
          bookId: b.id, code: b.code, levelId: b.levelId, title: b.title, strandUi: b.strandUi,
          earnedAt: (p && p.completedAt) ? new Date(p.completedAt).toISOString().slice(0, 10) : "",
        });
      }
    });
    return out;
  }

  /* Keep reading — a short window around where the child actually is:
     the last two books they finished (marked past → shown in grey) and the
     next two ahead of them in programme order (in full colour). */
  async function getContinueReading(childId, n, levelId) {
    const list = await all();
    let seq = T ? T.sortedCatalog(list) : list;
    if (levelId != null) {
      const inLevel = seq.filter(b => b.levelId === Number(levelId));
      if (inLevel.length) seq = inLevel;
    }
    const done = new Set(T ? T.completedCodes() : []);
    const ip = new Set(T ? T.inProgressCodes() : []);
    const past = seq.filter(b => done.has(b.code)).slice(-2).map(b => Object.assign({}, b, { past: true }));
    const ahead = seq.filter(b => !done.has(b.code));
    // Anything already open comes first among the books ahead.
    ahead.sort((a, b) => (ip.has(b.code) ? 1 : 0) - (ip.has(a.code) ? 1 : 0));
    return past.concat(ahead.slice(0, 2));
  }

  async function getExploreLibrary(childId, n, levelId) {
    const list = await all();
    const done = new Set(T ? T.completedCodes() : []);
    let seq = (T ? T.sortedCatalog(list) : list);
    if (levelId != null) {
      const inLevel = seq.filter(b => b.levelId === Number(levelId));
      if (inLevel.length) seq = inLevel;
    }
    const fresh = seq.filter(b => !done.has(b.code));
    return (fresh.length ? fresh : seq).slice(0, n || 4);
  }

  /* My reading path — the books of the level the parent placed the child on,
     in programme order. Falls back to the whole catalogue if the level is
     unknown or empty. */
  async function getReadingPath(childId, n, levelId) {
    const list = T ? T.sortedCatalog(await all()) : await all();
    const inLevel = (levelId != null) ? list.filter(b => b.levelId === Number(levelId)) : [];
    return (inLevel.length ? inLevel : list).slice(0, n || 4);
  }

  async function getStoryPractice(childId, n, levelId) {
    const list = await all();
    let seq = (T ? T.sortedCatalog(list) : list);
    if (levelId != null) {
      const inLevel = seq.filter(b => b.levelId === Number(levelId));
      if (inLevel.length) seq = inLevel;
    }
    const f = seq.filter(b => b.strandUi === "folktale" || /poet|practice/i.test(b.bookType || ""));
    // Folktale/poetry titles are thin at any single level, so top the rail up
    // with the rest of the level's books rather than showing a short rail.
    const codes = new Set(f.map(b => b.code));
    return f.concat(seq.filter(b => !codes.has(b.code))).slice(0, n || 4);
  }

  // How many books exist / are completed at each level — for passport figures.
  async function levelCounts() {
    const list = await all(); const c = {};
    list.forEach(b => { c[b.levelId] = (c[b.levelId] || 0) + 1; });
    return c;
  }
  function completedByLevel() {
    const c = {};
    if (!T) return c;
    allSync().forEach(b => { if (T.isCompleted(b.code)) c[b.levelId] = (c[b.levelId] || 0) + 1; });
    return c;
  }

  window.TafiyaBooks = {
    all, allSync, getBooks, getPassportStamps,
    getContinueReading, getExploreLibrary, getReadingPath, getStoryPractice,
    levelCounts, completedByLevel, strandUiOf, levelNum,
  };
})();
