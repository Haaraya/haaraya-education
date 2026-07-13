/* ============================================================
   Haaraya Odyssey — Captain's Log PROMPTS  ·  Supabase source
   ------------------------------------------------------------
   Book-specific Captain's Log questions, served LIVE from
   Supabase so authors can edit questions in the DB without
   rebuilding the app.  Nothing is baked into the client.

   Table: public.odyssey_captains_log_prompts
     book_code            e.g. "KN-13-01"
     book_number          1..100   (the reliable join key)
     book_title           reference / fallback match
     level, stream        reference only
     captain_log_q1..q3   the three log questions for this book
     spin_the_yarn_prompt the creative brief the Scribe writes to
     version, is_active   authoring metadata

   This layer holds ONLY the questions.  Children's answers +
   the spun log continue to live in odyssey_logs (scribe-data.js).

   Exposes window.HaarayaLogPrompts:
     await HaarayaLogPrompts.preload()      -> warm the whole cache
     await HaarayaLogPrompts.getForBook(bk) -> { fields, spinPrompt,
                                                 row, source } | null
     HaarayaLogPrompts.ready()              -> boolean (client present)

   `fields` matches the shape scribe-data.js NOTE_FIELDS uses, so
   the Shipmate Scribe form can render book questions or the
   generic fallback with the same code path:
     [{ key, label, prompt, icon, rows }]
   ============================================================ */
(function () {
  "use strict";

  var TABLE = "odyssey_captains_log_prompts";
  var COLS =
    "book_code,book_number,book_title,level,stream," +
    "captain_log_q1,captain_log_q2,captain_log_q3," +
    "spin_the_yarn_prompt,version,is_active";

  // Icons reuse the Scribe's existing vocabulary (anchor / star / spark).
  var ICONS = ["\u2693", "\u2606", "\u26A1"];

  var byNumber = Object.create(null);
  var byCode = Object.create(null);
  var byTitle = Object.create(null);
  var preloaded = false;
  var preloadPromise = null;

  function sb() { return window.HaarayaSupabase || null; }
  function clean(v) { return (v == null) ? "" : String(v).trim(); }
  function normCode(c) { return clean(c).toUpperCase(); }
  function normTitle(t) { return clean(t).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

  // Row -> the Scribe's field list (only non-empty questions).
  function toFields(row) {
    var fields = [];
    [row.captain_log_q1, row.captain_log_q2, row.captain_log_q3].forEach(function (q, i) {
      var label = clean(q);
      if (!label) return;
      fields.push({
        key: "q" + (i + 1),
        label: label,
        prompt: "Your answer, Captain\u2026",
        icon: ICONS[i] || "\u2693",
        rows: 3,
      });
    });
    return fields;
  }

  function pack(row) {
    if (!row) return null;
    var fields = toFields(row);
    if (!fields.length) return null;
    return {
      fields: fields,
      spinPrompt: clean(row.spin_the_yarn_prompt),
      row: row,
      source: "supabase",
    };
  }

  function index(row) {
    if (!row || row.is_active === false) return;
    if (row.book_number != null) byNumber[String(row.book_number)] = row;
    if (row.book_code) byCode[normCode(row.book_code)] = row;
    if (row.book_title) byTitle[normTitle(row.book_title)] = row;
  }

  function preload() {
    if (preloadPromise) return preloadPromise;
    var client = sb();
    if (!client) return Promise.resolve(false);
    preloadPromise = (async function () {
      try {
        var res = await client.from(TABLE).select(COLS).eq("is_active", true);
        if (res.error) throw res.error;
        (res.data || []).forEach(index);
        preloaded = true;
        return true;
      } catch (e) {
        if (window.console) console.warn("[LogPrompts] preload failed:", e.message || e);
        preloadPromise = null; // allow a later retry
        return false;
      }
    })();
    return preloadPromise;
  }

  // Resolve a book object -> its prompt pack, or null when the book
  // has no authored questions (caller then uses the generic fallback).
  async function getForBook(book) {
    book = book || {};
    if (!preloaded && sb()) { try { await preload(); } catch (e) { /* ignore */ } }
    var row =
      (book.book_number != null && byNumber[String(book.book_number)]) ||
      (book.book_code && byCode[normCode(book.book_code)]) ||
      (book.code && byCode[normCode(book.code)]) ||
      ((book.book_title || book.title) && byTitle[normTitle(book.book_title || book.title)]) ||
      null;
    return pack(row);
  }

  window.HaarayaLogPrompts = {
    preload: preload,
    getForBook: getForBook,
    toFields: toFields,
    ready: function () { return !!sb(); },
    isPreloaded: function () { return preloaded; },
    _index: { byNumber: byNumber, byCode: byCode, byTitle: byTitle },
  };

  // Best-effort warm-up once the client is present (non-blocking).
  if (sb()) { try { preload(); } catch (e) { /* ignore */ } }
})();
