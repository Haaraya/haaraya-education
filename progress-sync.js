/* ============================================================================
   Haaraya — reading-progress sync + offline write queue
   ----------------------------------------------------------------------------
   Bridges the local reading store (tafiya-data.js, which writes to
   localStorage for instant/offline-first UI) up to the LIVE Supabase
   reading_progress / passport_stamps tables for signed-in users.

   Every progress/complete event is appended to a durable localStorage queue
   FIRST, then a flush is attempted. If the network, the DB, or the active-child
   lookup isn't ready, the event waits in the queue and is retried on the next
   `online` event, session change, or page load.

   OBSERVABILITY (added 2026-08-30) — two failure modes used to be silent:
     1. `unknown-book`: the app's book CODE has no row in the live `books`
        table, so the event was dropped with no trace. A code mismatch between
        the catalogue and the DB therefore looked exactly like "nothing is
        being recorded". Those drops are now counted and logged loudly, once.
     2. `no-child`: a real session with no resolvable child uuid (e.g. a
        teacher/school login, or a parent whose children rows aren't readable)
        left the queue growing forever in silence.
   Run `HaarayaProgressSync.diagnose()` in the console for a one-object report
   of which is happening.

   Load AFTER platform-supabase.js and session.js. Exposes
   window.HaarayaProgressSync.
   ============================================================================ */
(function () {
  "use strict";

  var QKEY = "haaraya:syncq";
  var flushing = false;
  var childP = null;   // cached getChildrenForParent() promise

  // Diagnostics — cheap counters so a silent failure leaves evidence.
  var stats = { pushed: 0, written: 0, retried: 0, unknownBook: 0, noChild: 0, lastError: null };
  var unknownCodes = {};
  var warnedUnknown = false, warnedNoChild = false;

  function db() { return window.HaarayaPlatformDB || null; }
  function session() { return window.HaarayaSession || null; }
  function isReal() { var s = session(); return !!(s && s.isReal && s.isReal()); }
  function online() { return (typeof navigator === "undefined") || navigator.onLine !== false; }
  function warn() { if (window.console && console.warn) console.warn.apply(console, arguments); }

  function readQ() { try { return JSON.parse(localStorage.getItem(QKEY) || "[]") || []; } catch (e) { return []; } }
  function writeQ(q) { try { localStorage.setItem(QKEY, JSON.stringify(q)); } catch (e) { /* ignore */ } }
  function queueSize() { return readQ().length; }

  /* Resolve the active child uuid. Order: the session's chosen child, then the
     parent's first child (a child reads under the parent session). Returns
     null when there is nothing to write against — the caller keeps the queue. */
  async function activeChild() {
    var s = session();
    if (!s) return null;
    var cur = s.activeChildId ? s.activeChildId() : null;
    if (cur) return cur;
    var d = db();
    if (!d || !d.getChildrenForParent) return null;
    if (!childP) childP = d.getChildrenForParent();
    try {
      var kids = await childP;
      if (kids && kids.length) {
        if (s.setActiveChild) s.setActiveChild(kids[0].id);
        return kids[0].id;
      }
    } catch (e) { childP = null; stats.lastError = e.message || String(e); }
    return null;
  }

  /* Enqueue an event. type: "progress" | "complete". */
  function push(evt) {
    if (!evt || !evt.code) return;
    if (!isReal()) return;                 // visitor: local-only
    var q = readQ();
    // Collapse superseded progress pings for the same book (keep completes).
    if (evt.type === "progress") {
      q = q.filter(function (e) { return !(e.type === "progress" && e.code === evt.code); });
    }
    evt.ts = Date.now();
    q.push(evt);
    writeQ(q);
    stats.pushed++;
    flush();
  }

  /* Returns "ok" (written), "drop" (never writable — discard), or "retry". */
  async function apply(evt, childId) {
    var d = db();
    if (!d) return "retry";
    var r;
    if (evt.type === "complete") {
      if (!d.markBookComplete) return "retry";
      r = await d.markBookComplete(childId, evt.code);
    } else {
      if (!d.upsertReadingProgress) return "retry";
      r = await d.upsertReadingProgress(childId, evt.code, {
        status: evt.status || "in_progress",
        currentPage: evt.currentPage,
      });
    }
    if (r && r.ok) return "ok";
    if (r && r.reason === "unknown-book") {
      // The code isn't in the live `books` table. Dropping keeps the queue from
      // wedging, but this is a DATA defect, not a transient error — say so.
      stats.unknownBook++;
      unknownCodes[evt.code] = (unknownCodes[evt.code] || 0) + 1;
      if (!warnedUnknown) {
        warnedUnknown = true;
        warn("[ProgressSync] Book code not found in the live `books` table — progress for it can never be saved. " +
             "Check that books.book_code matches the app's catalogue codes. First offender: " + evt.code +
             ". Run HaarayaProgressSync.diagnose() for the full list.");
      }
      return "drop";
    }
    stats.lastError = (r && (r.error || r.reason)) || "unknown";
    return "retry";
  }

  async function flush() {
    if (flushing) return;
    if (!isReal() || !db() || !online()) return;
    var q = readQ();
    if (!q.length) return;
    flushing = true;
    try {
      var childId = await activeChild();
      if (!childId) {
        stats.noChild++;
        if (!warnedNoChild && stats.noChild > 2) {
          warnedNoChild = true;
          warn("[ProgressSync] " + q.length + " reading event(s) are queued but no child record could be " +
               "resolved for this session, so nothing is being saved. A parent account needs at least one " +
               "child row it can read (children.parent_user_id = the signed-in user). " +
               "Run HaarayaProgressSync.diagnose().");
        }
        return;                            // keep the queue, retry later
      }
      var remaining = [];
      for (var i = 0; i < q.length; i++) {
        var res = "retry";
        try { res = await apply(q[i], childId); }
        catch (e) { res = "retry"; stats.lastError = e.message || String(e); }
        if (res === "ok") stats.written++;
        else if (res === "retry") { stats.retried++; remaining.push(q[i]); }
      }
      writeQ(remaining);
    } finally {
      flushing = false;
    }
  }

  /* One-object health report for the console. Does a real (harmless) read of
     the book map and the child lookup so it reflects the live DB, not guesses. */
  async function diagnose() {
    var s = session(), d = db(), q = readQ();
    var out = {
      scriptLoaded: true,
      supabaseClient: !!window.HaarayaSupabase,
      platformDB: !!d,
      sessionReal: isReal(),
      sessionRole: s && s.role ? s.role() : null,
      online: online(),
      queued: q.length,
      queuedCodes: q.map(function (e) { return e.type + ":" + e.code; }).slice(0, 20),
      stats: JSON.parse(JSON.stringify(stats)),
      unknownBookCodes: Object.keys(unknownCodes),
      activeChildId: null,
      childrenVisible: null,
      sampleCodeResolves: null,
      verdict: "",
    };
    if (!out.supabaseClient) { out.verdict = "window.HaarayaSupabase is missing — supabase-client.js did not load (check _config.yml / the Pages build)."; return out; }
    if (!out.platformDB) { out.verdict = "HaarayaPlatformDB missing — platform-supabase.js did not load."; return out; }
    if (!out.sessionReal) { out.verdict = "Not a real signed-in session — writes are intentionally skipped. Sign in and retry."; return out; }
    try {
      out.activeChildId = await activeChild();
      if (d.getChildrenForParent) {
        var kids = await d.getChildrenForParent();
        out.childrenVisible = (kids || []).length;
      }
    } catch (e) { out.childLookupError = e.message || String(e); }
    if (d.bookIdByCode) {
      var probe = (q[0] && q[0].code) || Object.keys(unknownCodes)[0] || null;
      if (probe) { try { out.sampleCodeResolves = !!(await d.bookIdByCode(probe)); out.sampleCode = probe; } catch (e) { /* ignore */ } }
    }
    if (!out.activeChildId) out.verdict = "No child uuid resolvable (childrenVisible=" + out.childrenVisible + ") — every event stays queued. Either no children row belongs to this user, or RLS blocks reading it.";
    else if (out.sampleCodeResolves === false) out.verdict = "Child OK, but book code '" + out.sampleCode + "' has no row in the live `books` table — those writes are discarded. Seed/align books.book_code.";
    else if (stats.lastError) out.verdict = "Child + book resolve, but the write failed: " + stats.lastError + " (usually a missing INSERT/UPDATE RLS policy on reading_progress / passport_stamps).";
    else if (!q.length && stats.written) out.verdict = "Healthy — " + stats.written + " event(s) written, queue empty.";
    else out.verdict = "Nothing queued yet. Open a book, turn a page, then run this again.";
    if (window.console) console.log("[ProgressSync] " + out.verdict, out);
    return out;
  }

  if (typeof window !== "undefined") {
    window.addEventListener("online", function () { flush(); });
    window.addEventListener("haaraya:session", function () { childP = null; warnedNoChild = false; setTimeout(flush, 300); });
    window.addEventListener("haaraya:activechild", function () { setTimeout(flush, 100); });
    setTimeout(flush, 1500);   // opportunistic drain shortly after load
  }

  window.HaarayaProgressSync = {
    push: push,
    flush: flush,
    queueSize: queueSize,
    activeChild: activeChild,
    diagnose: diagnose,
    stats: function () { return JSON.parse(JSON.stringify(stats)); },
  };
})();
