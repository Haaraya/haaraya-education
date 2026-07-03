/* ============================================================
   Haaraya — Page Review (QA) data layer
   ------------------------------------------------------------
   Reads/writes the `page_reviews` table over the Supabase REST
   API using the same publishable key as tafiya-data.js. No
   external deps. Exposes window.HaarayaReview:

     reviewer()                     → current reviewer name
     load(bookCode)  -> Promise<map>  keyed by screen_key
     save(row)       -> Promise<row|null>  upsert one screen

   A review "row": { book_code, screen_key, page_number,
                     text_ok, image_ok, note }
   text_ok / image_ok: null = unreviewed, true = OK, false = needs edit.
   ============================================================ */
(function () {
  "use strict";

  var SUPABASE_URL = "https://laihhrkxnxzohaiiisou.supabase.co";
  var SUPABASE_KEY = "sb_publishable_qW4msFbGQ9QuqIZ6-G8QfA_JY_pvcsY";
  var TABLE = "page_reviews";

  function headers(extra) {
    var h = {
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (extra) for (var k in extra) h[k] = extra[k];
    return h;
  }

  function reviewer() {
    try {
      var s = window.HaarayaSession && window.HaarayaSession.get();
      return (s && s.displayName) || "Anonymous";
    } catch (e) { return "Anonymous"; }
  }

  // Fetch every stored review for a book → { screen_key: row }.
  async function load(bookCode) {
    if (!bookCode) return {};
    var url = SUPABASE_URL + "/rest/v1/" + TABLE +
      "?book_code=eq." + encodeURIComponent(bookCode) + "&select=*";
    try {
      var r = await fetch(url, { headers: headers() });
      if (!r.ok) throw new Error("load " + r.status);
      var rows = await r.json();
      var map = {};
      (rows || []).forEach(function (row) { map[row.screen_key] = row; });
      return map;
    } catch (e) {
      console.error("[Haaraya Review] load failed:", e);
      return {};
    }
  }

  // Upsert one screen's verdict. Conflict target = (book_code, screen_key).
  async function save(row) {
    if (!row || !row.book_code || !row.screen_key) return null;
    var body = {
      book_code: row.book_code,
      screen_key: row.screen_key,
      page_number: (row.page_number == null ? null : row.page_number),
      text_ok: (row.text_ok === undefined ? null : row.text_ok),
      image_ok: (row.image_ok === undefined ? null : row.image_ok),
      note: row.note || "",
      reviewer: reviewer(),
    };
    var url = SUPABASE_URL + "/rest/v1/" + TABLE +
      "?on_conflict=book_code,screen_key";
    try {
      var r = await fetch(url, {
        method: "POST",
        headers: headers({ Prefer: "resolution=merge-duplicates,return=representation" }),
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        var detail = await r.text().catch(function () { return ""; });
        throw new Error("save " + r.status + " " + detail);
      }
      var out = await r.json();
      return Array.isArray(out) ? out[0] : out;
    } catch (e) {
      console.error("[Haaraya Review] save failed:", e);
      throw e;
    }
  }

  window.HaarayaReview = { reviewer: reviewer, load: load, save: save };
})();
