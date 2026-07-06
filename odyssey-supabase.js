/* ============================================================
   Haaraya — Odyssey progress data layer
   ------------------------------------------------------------
   Reads a signed-in reader's 100 Book Odyssey progress from
   Supabase (table: odyssey_book_progress) and falls back to the
   local mock in odyssey-data.js when offline / signed-out.

   Exposes window.OdysseyData:
     await OdysseyData.load()            -> merged config (see below)
     await OdysseyData.markComplete(n)   -> mark book n complete
     await OdysseyData.markReading(n)    -> set book n as current
     await OdysseyData.reset()           -> clear this user's progress

   load() resolves to:
     { totalBooks, completedBooks, currentBook, completedSet,
       reader, stages, source }        source: 'supabase' | 'mock'
   stages come straight from the local mock (labels + medal files);
   only the numbers (completedBooks / currentBook) come from the DB.
   ============================================================ */
(function () {
  "use strict";

  function mock() {
    var O = window.ODYSSEY || {};
    return {
      totalBooks: O.totalBooks || 100,
      completedBooks: O.completedBooks || 0,
      currentBook: O.currentBook || 1,
      completedSet: null, // null => treat as contiguous 1..completedBooks
      reader: O.reader || null,
      stages: O.stages || [],
      source: "mock",
    };
  }

  function sb() { return window.HaarayaSupabase || null; }

  async function currentUser() {
    var client = sb();
    if (!client) return null;
    try {
      var res = await client.auth.getUser();
      return (res && res.data && res.data.user) || null;
    } catch (e) { return null; }
  }

  async function load() {
    var base = mock();
    var client = sb();
    var user = await currentUser();
    if (!client || !user) return base; // signed-out / no client -> mock

    try {
      var res = await client
        .from("odyssey_book_progress")
        .select("book_no,status")
        .eq("user_id", user.id);
      if (res.error) throw res.error;

      var rows = res.data || [];
      var completed = rows.filter(function (r) { return r.status === "complete"; })
                          .map(function (r) { return r.book_no; });
      var reading = rows.filter(function (r) { return r.status === "reading"; })
                        .map(function (r) { return r.book_no; })
                        .sort(function (a, b) { return a - b; });

      var completedBooks = completed.length;
      var currentBook = reading.length
        ? reading[0]
        : Math.min(completedBooks + 1, base.totalBooks);

      return {
        totalBooks: base.totalBooks,
        completedBooks: completedBooks,
        currentBook: currentBook,
        completedSet: completed.slice().sort(function (a, b) { return a - b; }),
        reader: base.reader,
        stages: base.stages,
        source: "supabase",
      };
    } catch (e) {
      if (window.console) console.warn("[Odyssey] progress load failed, using mock:", e.message || e);
      return base;
    }
  }

  async function upsert(bookNo, status) {
    var client = sb();
    var user = await currentUser();
    if (!client || !user) return { ok: false, reason: "signed-out" };
    var res = await client
      .from("odyssey_book_progress")
      .upsert(
        { user_id: user.id, book_no: bookNo, status: status },
        { onConflict: "user_id,book_no" }
      );
    if (res.error) return { ok: false, reason: res.error.message };
    return { ok: true };
  }

  function markComplete(n) { return upsert(n, "complete"); }
  function markReading(n) { return upsert(n, "reading"); }

  async function reset() {
    var client = sb();
    var user = await currentUser();
    if (!client || !user) return { ok: false, reason: "signed-out" };
    var res = await client
      .from("odyssey_book_progress")
      .delete()
      .eq("user_id", user.id);
    if (res.error) return { ok: false, reason: res.error.message };
    return { ok: true };
  }

  window.OdysseyData = {
    load: load,
    markComplete: markComplete,
    markReading: markReading,
    reset: reset,
  };
})();
