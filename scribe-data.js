/* ============================================================
   Haaraya Odyssey — Shipmate Scribe · data layer v2
   ------------------------------------------------------------
   Free-runtime architecture:
     • Captain's Notes persist in Supabase when available
     • localStorage mirrors every entry for resilience/offline use
     • Yarn composition happens ONLY in scribe-writer.js
     • NO Anthropic/OpenAI/Edge Function call is made by spin()

   window.ShipmateScribe:
     readerKey()
     load(readerKey)
     loadOne(readerKey, bookCode)
     save(row)
     spin(input)
     comprehensionSignal(notes, fields)
     NOTE_FIELDS
   ============================================================ */
(function () {
  "use strict";

  var TABLE = "odyssey_logs";

  var NOTE_FIELDS = [
    { key: "what_happened",     label: "What happened?", prompt: "Tell the tale in a sentence or two.", icon: "\u2693", rows: 2 },
    { key: "who_mattered_most", label: "Who mattered most?", prompt: "A person, creature or crew — and why.", icon: "\u2606", rows: 2 },
    { key: "big_idea",          label: "The trouble, surprise, lesson or big idea?", prompt: "What was the heart of it?", icon: "\u26A1", rows: 2 },
    { key: "what_i_noticed",    label: "What did you notice?", prompt: "Something small that caught your eye.", icon: "\uD83D\uDD0D", rows: 2 },
    { key: "new_word",          label: "One word I found", prompt: "A new or favourite word.", icon: "\uD83D\uDCDC", rows: 1 },
    { key: "feeling",           label: "How the book made me feel", prompt: "One honest feeling.", icon: "\u2764", rows: 1 },
  ];

  function sb() { return window.HaarayaSupabase || null; }

  function readerKey() {
    try {
      var s = window.HaarayaSession;
      if (s && s.childId && s.childId() != null) return "child:" + s.childId();
      if (s && s.userId && s.userId() != null) return "user:" + s.userId();
    } catch (e) { /* ignore */ }

    var k = "guest";
    try {
      k = localStorage.getItem("haaraya:scribe:guest");
      if (!k) {
        k = "guest-" + Math.random().toString(36).slice(2, 9);
        localStorage.setItem("haaraya:scribe:guest", k);
      }
    } catch (e) { /* ignore */ }
    return "guest:" + k;
  }

  function wc(s) { return String(s || "").trim().split(/\s+/).filter(Boolean).length; }

  function comprehensionSignal(notes, fields) {
    notes = notes || {};
    fields = (fields && fields.length) ? fields : NOTE_FIELDS;
    var total = fields.length || 1;
    var filled = fields.filter(function (f) {
      return String(notes[f.key] || "").trim().length > 0;
    }).length;
    var words = fields.reduce(function (a, f) { return a + wc(notes[f.key]); }, 0);

    if (filled >= total && words >= total * 4) return "strong";
    if (filled >= Math.ceil(total / 2) && words >= total * 1.5) return "adequate";
    return "thin";
  }

  function lsKey(rk) { return "haaraya:scribe:" + rk; }

  function lsLoad(rk) {
    try { return JSON.parse(localStorage.getItem(lsKey(rk)) || "{}"); }
    catch (e) { return {}; }
  }

  function lsSaveOne(rk, row) {
    try {
      var m = lsLoad(rk);
      m[row.book_code] = row;
      localStorage.setItem(lsKey(rk), JSON.stringify(m));
    } catch (e) { /* ignore */ }
  }

  async function load(rk) {
    rk = rk || readerKey();
    var local = lsLoad(rk);
    var client = sb();

    if (client) {
      try {
        var res = await client.from(TABLE).select("*").eq("reader_key", rk);
        if (!res.error && res.data) {
          res.data.forEach(function (row) { local[row.book_code] = row; });
          try { localStorage.setItem(lsKey(rk), JSON.stringify(local)); } catch (e) { /* ignore */ }
        }
      } catch (e) { /* offline: use local */ }
    }
    return local;
  }

  async function loadOne(rk, bookCode) {
    var m = await load(rk);
    return m[bookCode] || null;
  }

  async function save(row) {
    var rk = row.reader_key || readerKey();
    row = Object.assign({}, row, {
      reader_key: rk,
      updated_at: new Date().toISOString(),
    });

    lsSaveOne(rk, row);

    var client = sb();
    if (client) {
      var payload = {
        reader_key: rk,
        child_id: row.child_id != null ? String(row.child_id) : null,
        odyssey_id: row.odyssey_id || "100_book_odyssey_2026",
        book_code: row.book_code,
        book_number: row.book_number == null ? null : row.book_number,
        book_title: row.book_title || null,
        raw_captain_notes: row.raw_captain_notes || {},
        spun_log_entry: row.spun_log_entry || null,
        voice_level: row.voice_level || "older_reader",
        person: row.person || "first",
        version: row.version || 1,
        completion_status: row.completion_status || "in_progress",
        comprehension_signal: row.comprehension_signal || "unknown",
        needs_review: !!row.needs_review,
      };

      try {
        var res = await client
          .from(TABLE)
          .upsert(payload, { onConflict: "reader_key,book_code" })
          .select()
          .single();
        if (!res.error && res.data) {
          lsSaveOne(rk, res.data);
          return res.data;
        }
      } catch (e) { /* local copy remains authoritative until next sync */ }
    }

    return row;
  }

  async function spin(input) {
    input = Object.assign({}, input || {});
    input.reader_key = input.reader_key || readerKey();

    if (!(window.ScribeWriter && window.ScribeWriter.write)) {
      return {
        title: "",
        text: "",
        shipmate_note: "The Scribe's local writing engine did not load. Please refresh this page, Captain.",
        need_more_clue: true,
        source: "local-error",
      };
    }

    // Deliberately no fetch() here. Odyssey yarn composition is local-only.
    return window.ScribeWriter.write(input);
  }

  window.ShipmateScribe = {
    NOTE_FIELDS: NOTE_FIELDS,
    readerKey: readerKey,
    load: load,
    loadOne: loadOne,
    save: save,
    spin: spin,
    comprehensionSignal: comprehensionSignal,
  };
})();
