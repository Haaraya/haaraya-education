/* ============================================================================
   Tafiya bridge — adapts the real Tafiya catalogue + reading-progress store
   into the data shapes the Passport and Child Dashboard screens expect, so
   those screens no longer depend on the old 396-book mock data.
   Loaded after tafiya-data.js. Exposes window.TafiyaBooks.
   ============================================================================ */
(function () {
  "use strict";
  const T = window.TafiyaData;

  function strandUiOf(b) {
    const t = String(b.book_type || "").toLowerCase();
    if (t.indexOf("non") >= 0) return "tafiya-nonfiction";
    if (t.indexOf("folktale") >= 0) return "folktale";
    if (t.indexOf("poet") >= 0) return "poetry";
    return "tafiya";
  }
  function levelNum(b) { const m = String(b.level || "").match(/\d+/); return m ? +m[0] : 999; }

  function toBook(b) {
    const code = b.book_code || b.code;
    return {
      id: code, code: code,
      title: b.title,
      strandUi: strandUiOf(b),
      levelId: levelNum(b),
      bookType: b.book_type,
      audioUrl: null,
      thumbnail_image_path: b.thumbnail_image_path || "",
    };
  }

  async function all() {
    const list = (T && T.loadCatalog) ? await T.loadCatalog() : (T ? T.getCatalog() : []);
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

  async function getContinueReading(childId, n) {
    const list = await all();
    const ip = new Set(T ? T.inProgressCodes() : []);
    const inProg = list.filter(b => ip.has(b.code));
    // Fall back to the first few books if nothing is in progress yet.
    const result = inProg.length ? inProg : (T ? T.sortedCatalog(list).slice(0, n || 4) : list.slice(0, n || 4));
    return result.slice(0, n || 4);
  }

  async function getExploreLibrary(childId, n) {
    const list = await all();
    const done = new Set(T ? T.completedCodes() : []);
    const fresh = (T ? T.sortedCatalog(list) : list).filter(b => !done.has(b.code));
    return (fresh.length ? fresh : list).slice(0, n || 4);
  }

  async function getReadingPath(childId, n) {
    const list = T ? T.sortedCatalog(await all()) : await all();
    return list.slice(0, n || 4);
  }

  async function getStoryPractice(childId, n) {
    const list = await all();
    const f = list.filter(b => b.strandUi === "folktale" || /poet|practice/i.test(b.bookType || ""));
    return (f.length ? f : list).slice(0, n || 4);
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
