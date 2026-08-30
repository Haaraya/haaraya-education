/* ============================================================
   Haaraya Odyssey — Shipmate Scribe  ·  data layer
   ------------------------------------------------------------
   window.ShipmateScribe:
     readerKey()            → stable per-child key
     load(readerKey)        → Promise<{ [book_code]: row }>
     loadOne(readerKey, bk) → Promise<row|null>
     save(row)              → Promise<row>            (upsert)
     spin(input)            → Promise<{title,text,shipmate_note,need_more_clue,source}>
     comprehensionSignal(notes) → 'thin'|'adequate'|'strong'
     NOTE_FIELDS            → ordered field metadata for the form

   The spin() call degrades gracefully:
     1. Supabase Edge Function  (real AI, works on the live site)
     2. window.claude.complete  (works in the design preview)
     3. template spin           (offline / no AI — child's own words)
   so the UI never dead-ends.
   ============================================================ */
(function () {
  "use strict";

  var TABLE = "odyssey_logs";
  var EDGE_URL = "https://laihhrkxnxzohaiiisou.supabase.co/functions/v1/spin-log";
  var EDGE_KEY = "sb_publishable_qW4msFbGQ9QuqIZ6-G8QfA_JY_pvcsY";

  var NOTE_FIELDS = [
    { key: "what_happened",    label: "What happened?",            prompt: "Tell the tale in a sentence or two.",          icon: "\u2693", rows: 2 },
    { key: "who_mattered_most", label: "Who mattered most?",        prompt: "A person, creature or crew \u2014 and why.",    icon: "\u2606", rows: 2 },
    { key: "big_idea",         label: "The trouble, surprise, lesson or big idea?", prompt: "What was the heart of it?",   icon: "\u26A1", rows: 2 },
    { key: "what_i_noticed",   label: "What did you notice?",       prompt: "Something small that caught your eye.",        icon: "\uD83D\uDD0D", rows: 2 },
    { key: "new_word",         label: "One word I found",           prompt: "A new or favourite word.",                     icon: "\uD83D\uDCDC", rows: 1 },
    { key: "feeling",          label: "How the book made me feel",  prompt: "One honest feeling.",                          icon: "\u2764", rows: 1 },
  ];

  function sb() { return window.HaarayaSupabase || null; }

  // A stable key for this reader: prefer real auth uid, else demo child.
  function readerKey() {
    try {
      var s = window.HaarayaSession;
      if (s && s.childId() != null) return "child:" + s.childId();
      if (s && s.userId() != null) return "user:" + s.userId();
    } catch (e) { /* ignore */ }
    // last resort: a per-browser guest key so the demo still persists locally
    var k = "guest";
    try {
      k = localStorage.getItem("haaraya:scribe:guest");
      if (!k) { k = "guest-" + Math.random().toString(36).slice(2, 9); localStorage.setItem("haaraya:scribe:guest", k); }
    } catch (e) { /* ignore */ }
    return "guest:" + k;
  }

  // ---- comprehension heuristic (never punitive) ----------------
  function wc(s) { return String(s || "").trim().split(/\s+/).filter(Boolean).length; }
  // `fields` defaults to the generic NOTE_FIELDS, but the Scribe passes the
  // book's own fields when a book has authored questions, so the signal is
  // measured against whatever questions the child was actually asked.
  function comprehensionSignal(notes, fields) {
    notes = notes || {};
    fields = (fields && fields.length) ? fields : NOTE_FIELDS;
    var total = fields.length || 1;
    var filled = fields.filter(function (f) { return String(notes[f.key] || "").trim().length > 0; }).length;
    var words = fields.reduce(function (a, f) { return a + wc(notes[f.key]); }, 0);
    // Scale thresholds to the number of questions (books have 3, generic has 6).
    if (filled >= total && words >= total * 4) return "strong";
    if (filled >= Math.ceil(total / 2) && words >= total * 1.5) return "adequate";
    return "thin";
  }

  // ---- localStorage mirror (offline-friendly) ------------------
  function lsKey(rk) { return "haaraya:scribe:" + rk; }
  function lsLoad(rk) {
    try { return JSON.parse(localStorage.getItem(lsKey(rk)) || "{}"); } catch (e) { return {}; }
  }
  function lsSaveOne(rk, row) {
    try { var m = lsLoad(rk); m[row.book_code] = row; localStorage.setItem(lsKey(rk), JSON.stringify(m)); } catch (e) { /* ignore */ }
  }

  // ---- load / save --------------------------------------------
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
      } catch (e) { /* offline → local only */ }
    }
    return local;
  }

  async function loadOne(rk, bookCode) {
    var m = await load(rk);
    return m[bookCode] || null;
  }

  async function save(row) {
    var rk = row.reader_key || readerKey();
    row = Object.assign({}, row, { reader_key: rk, updated_at: new Date().toISOString() });
    lsSaveOne(rk, row);                      // optimistic local write
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
        voice_level: row.voice_level || "younger_reader",
        person: row.person || "first",
        version: row.version || 1,
        completion_status: row.completion_status || "in_progress",
        comprehension_signal: row.comprehension_signal || "unknown",
        needs_review: !!row.needs_review,
      };
      try {
        var res = await client.from(TABLE).upsert(payload, { onConflict: "reader_key,book_code" }).select().single();
        if (!res.error && res.data) { lsSaveOne(rk, res.data); return res.data; }
      } catch (e) { /* keep local copy */ }
    }
    return row;
  }

  // ---- the spin ------------------------------------------------
  function tidy(s) { return String(s || "").trim(); }

  // The local writer (scribe-writer.js) does the real work: no AI, no network,
  // free to run. It never invents facts — it frames the child's own words.
  function templateSpin(input) {
    if (window.ScribeWriter && window.ScribeWriter.write) return window.ScribeWriter.write(input);
    // Bare-bones safety net if the writer script failed to load.
    var qa = (input.qa || []).filter(function (p) { return tidy(p.answer); });
    var bits = qa.length
      ? qa.map(function (p) { return tidy(p.answer); })
      : Object.keys(input.notes || {}).map(function (k) { return tidy((input.notes || {})[k]); });
    var text = bits.filter(Boolean).map(cap).join(" ");
    return {
      title: (tidy(input.book_title) || "The Voyage") + " \u2014 Log",
      text: text,
      shipmate_note: text ? "Another page of your Odyssey, Captain." : "Give me one more clue, Captain.",
      need_more_clue: !text,
      source: "template",
    };
  }
  function lower(s) { s = tidy(s); return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function cap(s) { s = tidy(s); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  async function viaEdge(input) {
    var res = await fetch(EDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + EDGE_KEY, "apikey": EDGE_KEY },
      body: JSON.stringify({
        notes: input.notes,
        qa: input.qa || null,
        spin_prompt: input.spin_prompt || null,
        book_title: input.book_title,
        voice_level: input.voice_level,
        person: input.person,
      }),
    });
    if (!res.ok) throw new Error("edge " + res.status);
    var d = await res.json();
    if (d.error) throw new Error(d.error);
    d.source = "edge";
    return d;
  }

  async function viaClaudeHelper(input) {
    if (!(window.claude && window.claude.complete)) throw new Error("no helper");
    var n = input.notes || {};
    var voice = input.voice_level === "older_reader" ? "Older reader: richer vocabulary is fine." : "Younger reader: simple, warm, short sentences.";
    var person = input.person === "third" ? "Third person, call the child 'the Captain'." : "First person, as the Captain ('I ...').";
    var system = "You are Shipmate Scribe, the loyal log-writer for a child reading the 100 Book Odyssey. Turn the child's Captain's Notes into a magical Odyssey Log Entry. Rules: Do not invent major plot events, characters, settings, or lessons. Every fact must come from the notes, but never simply restate them — reorder, connect and dramatise: open on the moment, carry it through, close on what it left the Captain thinking. Never reuse the Captain's phrasing verbatim beyond a name or title. Write it as a voyage (sea, chart, course, harbour, weather), sparingly and never twice the same way. Age-appropriate. Length: three short paragraphs, 110-170 words total, blank line between them. Make the child feel like the Captain of a reading adventure. Do not sound like a quiz or worksheet. Do not correct harshly. Plain text only — no markdown, asterisks, or headings. If the notes are too thin, ask for one more clue instead of writing the log. Output exactly: 'Title:' line, 'Odyssey Log Entry:' line, 'Shipmate Note:' line.";
    var qa = (input.qa || []).filter(function (p) { return tidy(p.question); });
    var user;
    if (qa.length) {
      // Book-specific questions: give the model each question + the child's answer.
      var lines = ["Book: " + (input.book_title || "(untitled)"), voice, person, ""];
      if (input.spin_prompt) lines.push("Creative brief (shape the log this way): " + input.spin_prompt, "");
      lines.push("Captain's Notes (the child's answers):");
      qa.forEach(function (p) { lines.push("- " + tidy(p.question) + " \u2192 " + (tidy(p.answer) || "(blank)")); });
      user = lines.join("\n");
    } else {
      user = [
        "Book: " + (input.book_title || "(untitled)"), voice, person, "",
        "Captain's Notes:",
        "- What happened: " + (n.what_happened || "(blank)"),
        "- Who mattered most: " + (n.who_mattered_most || "(blank)"),
        "- Trouble/surprise/lesson/big idea: " + (n.big_idea || "(blank)"),
        "- What I noticed: " + (n.what_i_noticed || "(blank)"),
        "- One word I found: " + (n.new_word || "(blank)"),
        "- How it made me feel: " + (n.feeling || "(blank)"),
      ].join("\n");
    }
    var raw = await window.claude.complete({ system: system, messages: [{ role: "user", content: user }], max_tokens: 600 });
    var grab = function (label) {
      var re = new RegExp(label + "\\s*:\\s*([\\s\\S]*?)(?=\\n(?:Title|Odyssey Log Entry|Shipmate Note)\\s*:|$)", "i");
      var m = String(raw).match(re); return m ? m[1].trim() : "";
    };
    var text = grab("Odyssey Log Entry");
    return { title: grab("Title"), text: text, shipmate_note: grab("Shipmate Note"), need_more_clue: text.length < 15, source: "claude" };
  }

  // The Odyssey is free, so the default writer is local: no API, no key, no
  // per-entry cost, works offline. Set window.HAARAYA_SCRIBE_AI = true to route
  // through the Edge Function instead (a paid-tier perk).
  async function spin(input) {
    input = input || {};
    if (window.HAARAYA_SCRIBE_AI) {
      try { return await viaEdge(input); } catch (e) { /* fall back to local */ }
      try { return await viaClaudeHelper(input); } catch (e) { /* fall back to local */ }
    }
    return templateSpin(input);
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
