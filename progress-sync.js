/* ============================================================================
   Haaraya — reading-progress sync + offline write queue
   ----------------------------------------------------------------------------
   Bridges the local reading store (tafiya-data.js, which writes to
   localStorage for instant/offline-first UI) up to the LIVE Supabase
   reading_progress / passport_stamps tables — but only for REAL signed-in
   users. Demo sessions stay entirely local (push() is a no-op for them), so
   the mock dashboards are untouched.

   Design:
     • Every progress/complete event is appended to a durable localStorage
       queue FIRST, then a flush is attempted. If the network (or the DB, or
       the active-child lookup) isn't ready, the event simply waits in the
       queue and is retried on the next `online` event, session change, or
       page load. A dropped connection therefore never loses a finished book.
     • This queue is the same mechanism the later PWA offline layer builds on:
       reads come from cache, writes accumulate here and drain when online.

   The reader never needs the child's DB uuid — this module resolves the
   active child (auto-picking the parent's first child if none is chosen yet)
   and maps the app's book CODE to the catalogue book_id inside
   platform-supabase.js.

   Load AFTER platform-supabase.js and session.js. Exposes
   window.HaarayaProgressSync.
   ============================================================================ */
(function () {
  "use strict";

  var QKEY = "haaraya:syncq";
  var flushing = false;
  var childP = null;   // cached getChildrenForParent() promise

  function db() { return window.HaarayaPlatformDB || null; }
  function session() { return window.HaarayaSession || null; }
  function isReal() { var s = session(); return !!(s && s.isReal && s.isReal()); }
  function online() { return (typeof navigator === "undefined") || navigator.onLine !== false; }

  function readQ() { try { return JSON.parse(localStorage.getItem(QKEY) || "[]") || []; } catch (e) { return []; } }
  function writeQ(q) { try { localStorage.setItem(QKEY, JSON.stringify(q)); } catch (e) { /* ignore */ } }
  function queueSize() { return readQ().length; }

  /* Resolve the active real child uuid; auto-pick the first child when the
     session hasn't chosen one yet (a child reads under the parent session). */
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
    } catch (e) { childP = null; }
    return null;
  }

  /* Enqueue an event. type: "progress" | "complete". */
  function push(evt) {
    if (!evt || !evt.code) return;
    if (!isReal()) return;                 // demo / visitor: local-only
    var q = readQ();
    // Collapse superseded progress pings for the same book (keep completes).
    if (evt.type === "progress") {
      q = q.filter(function (e) { return !(e.type === "progress" && e.code === evt.code); });
    }
    evt.ts = Date.now();
    q.push(evt);
    writeQ(q);
    flush();
  }

  async function apply(evt, childId) {
    var d = db();
    if (!d) return false;
    if (evt.type === "complete") {
      if (!d.markBookComplete) return false;
      var r = await d.markBookComplete(childId, evt.code);
      // unknown-book: nothing we can do — drop it so it can't wedge the queue.
      return !!(r && (r.ok || r.reason === "unknown-book"));
    }
    if (!d.upsertReadingProgress) return false;
    var r2 = await d.upsertReadingProgress(childId, evt.code, {
      status: evt.status || "in_progress",
      currentPage: evt.currentPage,
    });
    return !!(r2 && (r2.ok || r2.reason === "unknown-book"));
  }

  async function flush() {
    if (flushing) return;
    if (!isReal() || !db() || !online()) return;
    var q = readQ();
    if (!q.length) return;
    flushing = true;
    try {
      var childId = await activeChild();
      if (!childId) return;              // no child yet — retry later
      var remaining = [];
      for (var i = 0; i < q.length; i++) {
        var ok = false;
        try { ok = await apply(q[i], childId); } catch (e) { ok = false; }
        if (!ok) remaining.push(q[i]);   // network/DB failure — keep for retry
      }
      writeQ(remaining);
    } finally {
      flushing = false;
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("online", function () { flush(); });
    window.addEventListener("haaraya:session", function () { childP = null; setTimeout(flush, 300); });
    window.addEventListener("haaraya:activechild", function () { setTimeout(flush, 100); });
    setTimeout(flush, 1500);   // opportunistic drain shortly after load
  }

  window.HaarayaProgressSync = {
    push: push,
    flush: flush,
    queueSize: queueSize,
    activeChild: activeChild,
  };
})();
