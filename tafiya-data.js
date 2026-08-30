/* ============================================================================
   Haaraya — Tafiya reader data layer
   ----------------------------------------------------------------------------
   • TAFIYA_CATALOG       — bundled fallback catalogue (used until a Supabase
                            list endpoint is available)
   • TafiyaData.getPackage(code) — fetches a book package live from Supabase
     (get_book_package RPC).
   Ported from the Haaraya/tafiya-web-reader-test reader. Plain JS — no build.
   ============================================================================ */
(function () {
  "use strict";

  const SUPABASE_URL = "https://laihhrkxnxzohaiiisou.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_qW4msFbGQ9QuqIZ6-G8QfA_JY_pvcsY";
  const STORAGE_BUCKET = "book-assets";

  const DEFAULT_LOGOS = {
    tafiya: "assets/logos/tafiya.png",
    haaraya_literacy: "assets/logos/haaraya_literacy.png",
    haaraya_education: "assets/logos/haaraya_education.png",
  };

  const TAFIYA_CATALOG = [];

  // Resolve an image path to a usable URL.
  //  • assets/… and thumbnails/… are always bundled with the app → use as-is.
  //  • For a bundled (local) package, every path is already a real project path.
  //  • For a live Supabase package, relative paths point inside the storage
  //    bucket and get the public-bucket prefix.
  function assetUrl(path, local) {
    if (!path) return "";
    const raw = String(path).trim();
    if (!raw) return "";
    if (/^(https?:|data:|blob:)/.test(raw)) return raw;
    if (/^(assets\/|thumbnails\/)/.test(raw)) return raw; // always bundled
    if (local) return raw;                                // bundled sample book
    if (raw.startsWith("/storage/v1/object/public/")) return SUPABASE_URL + raw;
    let clean = raw.replace(/^\/+/, "");
    if (clean.startsWith(STORAGE_BUCKET + "/")) clean = clean.slice(STORAGE_BUCKET.length + 1);
    // All Supabase book assets were flattened to .webp (pngs deleted for quota).
    clean = clean.replace(/\.png$/i, ".webp");
    clean = encodeURI(clean).replace(/#/g, "%23");
    return SUPABASE_URL + "/storage/v1/object/public/" + STORAGE_BUCKET + "/" + clean;
  }

  function normalizeBookPackage(data) {
    let pkg = data;
    if (Array.isArray(pkg)) pkg = pkg[0];
    if (pkg && pkg.get_book_package) pkg = pkg.get_book_package;
    if (pkg && pkg.data && pkg.data.book) pkg = pkg.data;
    if (!pkg || typeof pkg !== "object") {
      throw new Error("Supabase returned an empty or invalid book package.");
    }
    pkg.book = pkg.book || {};
    pkg.pages = Array.isArray(pkg.pages) ? pkg.pages : [];
    pkg.skills = pkg.skills || {};
    pkg.assets = pkg.assets || {};
    pkg.assets.logos = Object.assign({}, DEFAULT_LOGOS, pkg.assets.logos || {});
    return pkg;
  }

  async function fetchBookPackage(bookCode) {
    const endpoint = SUPABASE_URL + "/rest/v1/rpc/get_book_package";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ input_book_code: bookCode }),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error("Supabase RPC failed: " + response.status + " " + response.statusText + ". " + detail);
    }
    return normalizeBookPackage(await response.json());
  }

  // Books load live from Supabase (auto-includes any newly added title).
  async function getPackage(bookCode) {
    return fetchBookPackage(bookCode);
  }

  // ---- Catalogue (auto-growth ready) ----
  // Try a Supabase list RPC first so new books appear automatically once the
  // backend exposes one; fall back to the bundled catalogue meanwhile.
  var _catalogCache = null;
  var LIST_RPCS = ["get_book_list", "get_books", "list_books", "get_catalog"];
  function normalizeCatalog(rows) {
    if (!Array.isArray(rows)) rows = (rows && (rows.books || rows.data)) || [];
    return rows.filter(function (b) { return b && (b.book_code || b.code); });
  }
  async function fetchCatalog() {
    for (var i = 0; i < LIST_RPCS.length; i++) {
      try {
        var r = await fetch(SUPABASE_URL + "/rest/v1/rpc/" + LIST_RPCS[i], {
          method: "POST",
          headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: "Bearer " + SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json", Accept: "application/json" },
          body: "{}",
        });
        if (r.ok) { var rows = normalizeCatalog(await r.json()); if (rows.length) return rows; }
      } catch (e) { /* try next */ }
    }
    return null; // no list endpoint yet
  }
  async function loadCatalog() {
    if (_catalogCache) return _catalogCache.slice();
    var live = await fetchCatalog();
    _catalogCache = (live && live.length) ? live : TAFIYA_CATALOG.slice();
    return _catalogCache.slice();
  }
  function getCatalog() { return (_catalogCache || TAFIYA_CATALOG).slice(); }
  function codeOf(b) { return (b && (b.book_code || b.code)) || ""; }
  function getCatalogEntry(code) { return (_catalogCache || TAFIYA_CATALOG).find(function (b) { return codeOf(b) === code; }) || null; }

  // ---- Free samples: first N books in catalogue order ----
  var SAMPLE_LIMIT = 15;
  function levelNum(b) { var m = String(b.level || "").match(/\d+/); return m ? +m[0] : (typeof b.level === "number" ? b.level : 999); }
  // Strand taxonomy — resolve a book to its UI strand key, and rank strands in
  // pedagogical reading order so the catalogue sequences sensibly.
  var STRAND_UI_ORDER = ["hafwas", "soundables", "soundables-plus", "tafiya", "tafiya-nonfiction", "folktale", "poetry", "duniya", "stamina", "stamina-nonfiction"];
  var STRAND_UI_BY_NAME = {
    "Hafwas": "hafwas", "Soundables": "soundables", "Soundables+": "soundables-plus",
    "Tafiya Fiction": "tafiya", "Tafiya Non-Fiction": "tafiya-nonfiction", "Tafiya Folktale": "folktale",
    "Tafiya Poetry": "poetry", "Tafiya Duniya": "duniya", "Stamina Fiction": "stamina", "Stamina Non-Fiction": "stamina-nonfiction",
  };
  function strandKeyOf(b) {
    var name = String((b && b.strand) || "").trim();
    if (STRAND_UI_BY_NAME[name]) return STRAND_UI_BY_NAME[name];
    var t = String((b && b.book_type) || "").toLowerCase();
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
  function strandRank(b) { var i = STRAND_UI_ORDER.indexOf(strandKeyOf(b)); return i < 0 ? 99 : i; }
  // Programme sequence = global v4_2 teaching order, joined to each book by its
  // Book_Code via window.HAARAYA_PROGRESSION. This interleaves strands exactly as
  // the curriculum intends. Books with no mapping fall back to level/code order.
  function progNum(b) { var m = window.HAARAYA_PROGRESSION; var c = codeOf(b); return (m && m[c] != null) ? m[c] : null; }
  function seqNum(b) { var m = String(codeOf(b)).split("-").pop(); var n = parseInt(m, 10); return isNaN(n) ? 999999 : n; }
  function sortedCatalog(list) {
    return (list || getCatalog()).filter(function (b) { return codeOf(b); }).slice().sort(function (a, b) {
      var pa = progNum(a), pb = progNum(b);
      if (pa != null && pb != null) return pa - pb;
      if (pa != null) return -1;
      if (pb != null) return 1;
      return (levelNum(a) - levelNum(b)) || (seqNum(a) - seqNum(b)) || codeOf(a).localeCompare(codeOf(b), undefined, { numeric: true });
    });
  }
  function freeCodes(list) { return sortedCatalog(list).slice(0, SAMPLE_LIMIT).map(codeOf); }
  function isFree(code, list) { return freeCodes(list).indexOf(code) >= 0; }

  // ---- Reading progress (per child, localStorage) ----
  function childId() {
    var s = window.HaarayaSession;
    if (s && s.activeChildId) { var a = s.activeChildId(); if (a) return a; }
    return (s && s.childId && s.childId()) || 1;
  }
  // Mirror a local reading event up to the live DB (real users only; no-op
  // for demo). Guarded so a sync hiccup never breaks the reader.
  function syncPush(evt) { try { if (window.HaarayaProgressSync) window.HaarayaProgressSync.push(evt); } catch (e) { /* ignore */ } }
  function progKey(cid) { return "haaraya:reading:" + (cid || childId()); }
  function readProgress(cid) { try { return JSON.parse(localStorage.getItem(progKey(cid)) || "{}") || {}; } catch (e) { return {}; } }
  function writeProgress(cid, obj) { try { localStorage.setItem(progKey(cid), JSON.stringify(obj)); } catch (e) {} }
  function emit() { try { window.dispatchEvent(new Event("haaraya:reading")); } catch (e) {} }
  function recordOpen(code, total) {
    if (!code) return; var cid = childId(); var p = readProgress(cid); var e = p[code] || {};
    e.opened = true; e.startedAt = e.startedAt || Date.now(); e.lastAt = Date.now(); if (total) e.total = total;
    p[code] = e; writeProgress(cid, p); emit();
    syncPush({ type: "progress", code: code, status: "in_progress", currentPage: 0, total: total });
  }
  function recordProgress(code, screen, total) {
    if (!code) return; var cid = childId(); var p = readProgress(cid); var e = p[code] || {};
    e.opened = true; e.lastScreen = screen; e.total = total || e.total; e.lastAt = Date.now();
    p[code] = e; writeProgress(cid, p);
    syncPush({ type: "progress", code: code, status: "in_progress", currentPage: screen, total: total || e.total });
  }
  function recordComplete(code) {
    if (!code) return; var cid = childId(); var p = readProgress(cid); var e = p[code] || {};
    e.opened = true; e.completed = true; e.completedAt = e.completedAt || Date.now(); e.lastAt = Date.now();
    p[code] = e; writeProgress(cid, p); emit();
    syncPush({ type: "complete", code: code });
  }
  function isCompleted(code, cid) { var e = readProgress(cid)[code]; return !!(e && e.completed); }
  function progressOf(code, cid) { return readProgress(cid)[code] || null; }
  function completedCodes(cid) { var p = readProgress(cid); return Object.keys(p).filter(function (c) { return p[c].completed; }); }
  function inProgressCodes(cid) { var p = readProgress(cid); return Object.keys(p).filter(function (c) { return p[c].opened && !p[c].completed; }); }

  window.TafiyaData = {
    SAMPLE_LIMIT: SAMPLE_LIMIT,
    loadCatalog: loadCatalog,
    getCatalog: getCatalog,
    getCatalogEntry: getCatalogEntry,
    getPackage: getPackage,
    assetUrl: assetUrl,
    sortedCatalog: sortedCatalog,
    strandKeyOf: strandKeyOf,
    strandRank: strandRank,
    freeCodes: freeCodes,
    isFree: isFree,
    levelNum: levelNum,
    recordOpen: recordOpen,
    recordProgress: recordProgress,
    recordComplete: recordComplete,
    isCompleted: isCompleted,
    progressOf: progressOf,
    completedCodes: completedCodes,
    inProgressCodes: inProgressCodes,
    DEFAULT_LOGOS: DEFAULT_LOGOS,
  };
})();
