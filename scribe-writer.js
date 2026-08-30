/* ============================================================
   Haaraya Odyssey — Shipmate Scribe · local writer
   ------------------------------------------------------------
   Writes the Odyssey Log entry with no AI and no network call,
   so the free Odyssey costs nothing to run.

   It never invents facts. Every content word comes from the
   child's own Captain's Notes; the writer supplies only the
   voyage furniture around them — and picks that furniture from
   a seeded set so two books never read the same way, while the
   SAME book always spins the same log (stable on re-open).

   Exposes window.ScribeWriter.write(input) -> { title, text,
   shipmate_note, need_more_clue, source }.
   ============================================================ */
(function () {
  "use strict";

  function tidy(s) { return String(s == null ? "" : s).trim(); }
  function cap(s) { s = tidy(s); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function lower(s) { s = tidy(s); return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function stripEnd(s) { return tidy(s).replace(/[.!?,;:]+$/, ""); }
  function sentence(s) { s = tidy(s); if (!s) return ""; return /[.!?]$/.test(s) ? cap(s) : cap(s) + "."; }
  // A clause that continues a sentence already begun by a lead ("…eye: ", "…felt "):
  // punctuate it, but never capitalise it.
  function clause(s) { s = tidy(s); if (!s) return ""; return /[.!?]$/.test(s) ? s : stripEnd(s) + "."; }
  // Join a lead to the child's words. A lead that ends a sentence ("… was this. ")
  // needs a capital after it; one that opens a clause (": ", "\u2014 ", "felt ") does not.
  function joinLead(lead, text) {
    lead = String(lead || "");
    if (!tidy(text)) return "";
    if (!tidy(lead)) return sentence(text);
    return /[.!?]\s*$/.test(lead) ? lead + sentence(text) : lead + clause(lower(text));
  }

  // Seeded picker — same book, same log; different books, different voice.
  function seedOf(str) {
    var h = 2166136261;
    str = String(str || "odyssey");
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0) || 1;
  }
  function picker(seed) {
    var s = seed;
    return function (arr) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return arr[s % arr.length];
    };
  }

  var OPENERS = [
    "{I} set a course for \u201C{title}\u201D and let the sails fill.",
    "The chart said \u201C{title}\u201D{comma} so that is where {I_low} steered.",
    "{I} weighed anchor and sailed into \u201C{title}\u201D{stop}",
    "First light, a clear sea, and \u201C{title}\u201D waiting on the horizon.",
    "{I} opened \u201C{title}\u201D the way you open a harbour \u2014 slowly, then all at once.",
    "The wind was fair the day {I_low} put out for \u201C{title}\u201D{stop}",
  ];
  var HAPPENED_LEADS = [
    "Here is what {I_low} found: ",
    "This is what the voyage held: ",
    "What happened was this. ",
    "The log of it, plainly: ",
    "",
  ];
  var WHO_LEADS = [
    "The one who mattered most was ",
    "Above all others on this voyage: ",
    "If {I_low} had to name one soul, it would be ",
    "The name {I_low} will remember is ",
  ];
  var NOTICED_LEADS = [
    "{I} noticed something {my} crew might have sailed straight past: ",
    "Something caught {my} eye: ",
    "{I} kept watch, and {I_low} saw it \u2014 ",
    "Not everything is on the chart. {I} spotted this: ",
  ];
  var WORD_LEADS = [
    "{I} hauled a new word up from the deep: ",
    "One word came aboard and stayed: ",
    "{I} am keeping a word from this voyage: ",
    "A new word for {my} ship's dictionary: ",
  ];
  var IDEA_LEADS = [
    "The heart of it, though \u2014 ",
    "Here is the true cargo: ",
    "Strip away the weather and this is what is left: ",
    "What this voyage was really about: ",
  ];
  var FEELING_LEADS = [
    "By the last page the voyage left {me} feeling ",
    "{I} closed the cover feeling ",
    "The harbour {I_low} reached at the end felt ",
    "And when it was done, {I_low} felt ",
  ];
  var EXTRA_LEADS = [
    "Worth setting down: ",
    "{I} will log this too: ",
    "One more thing from the crossing: ",
    "Also true of this voyage: ",
  ];
  var CLOSERS = [
    "One more stretch of sea behind {me}.",
    "The chart is a little fuller tonight.",
    "{I} will carry this one a while.",
    "Log closed. The next book is already on the horizon.",
    "Another crossing made, in {my} own words.",
    "Fair winds, and on to the next.",
  ];
  var TITLES = [
    "{book} \u2014 Log",
    "The {book} Crossing",
    "Voyage: {book}",
    "{book}, Logged",
    "A Course Through {book}",
  ];
  var SHIPMATE_NOTES = [
    "Another page of your Odyssey, Captain \u2014 written in your own hand.",
    "Logged and filed, Captain. The words are yours.",
    "A fine entry. Your voyage, your telling.",
    "Signed and sealed, Captain \u2014 straight from your own notes.",
  ];

  // Map a book's own question wording onto the slots the writer knows.
  var SLOT_TESTS = [
    ["word", /\bword\b|vocab|new phrase|language/i],
    ["feeling", /feel|felt|emotion|enjoy|like best|favourite|favorite/i],
    ["who", /\bwho\b|character|person|people|friend|family/i],
    ["noticed", /notice|spot|\bsaw\b|picture|image|detail|interesting/i],
    ["idea", /idea|lesson|learn|mean|message|\bwhy\b|matter|teach|think/i],
    ["happened", /happen|story|plot|events?|beginning/i],
  ];
  function slotFor(question) {
    var q = tidy(question);
    for (var i = 0; i < SLOT_TESTS.length; i++) if (SLOT_TESTS[i][1].test(q)) return SLOT_TESTS[i][0];
    return "";
  }

  function collect(input) {
    var slots = { happened: "", who: "", idea: "", noticed: "", word: "", feeling: "" };
    var extra = [];
    var qa = (input.qa || []).filter(function (p) { return tidy(p.answer); });
    if (qa.length) {
      qa.forEach(function (p) {
        var s = slotFor(p.question);
        if (s && !slots[s]) slots[s] = tidy(p.answer);
        else extra.push(tidy(p.answer));
      });
      return { slots: slots, extra: extra, count: qa.length };
    }
    var n = input.notes || {};
    slots.happened = tidy(n.what_happened);
    slots.who      = tidy(n.who_mattered_most);
    slots.idea     = tidy(n.big_idea);
    slots.noticed  = tidy(n.what_i_noticed);
    slots.word     = tidy(n.new_word);
    slots.feeling  = tidy(n.feeling);
    var count = 0;
    Object.keys(slots).forEach(function (k) { if (slots[k]) count++; });
    return { slots: slots, extra: extra, count: count };
  }

  function write(input) {
    input = input || {};
    var got = collect(input);
    var slots = got.slots, extra = got.extra;
    var bookTitle = tidy(input.book_title) || "this book";
    // "Who Drew This?" keeps its mark; the sentence stop is dropped instead.
    var bookQuoted = bookTitle.replace(/[.]+$/, "");
    var endsMarked = /[?!]$/.test(bookQuoted);
    var third = (input.person || "first") === "third";

    var vars = {
      "{title}": bookQuoted,
      "{book}": bookQuoted,
      "{I}": third ? "The Captain" : "I",
      "{I_low}": third ? "the Captain" : "I",
      "{my}": third ? "their" : "my",
      "{me}": third ? "the Captain" : "me",
      "{stop}": endsMarked ? "" : ".",
      "{comma}": endsMarked ? "" : ",",
    };
    function fill(s) {
      return String(s).replace(/\{title\}|\{book\}|\{I_low\}|\{I\}|\{my\}|\{me\}|\{stop\}|\{comma\}/g, function (m) { return vars[m]; });
    }

    var pick = picker(seedOf(tidy(input.book_code) + "|" + bookTitle));
    var filled = 0;
    Object.keys(slots).forEach(function (k) { if (slots[k]) filled++; });
    if (!filled && !extra.length) {
      return {
        title: fill(pick(TITLES)),
        text: "",
        shipmate_note: "Give me one more clue, Captain, and I'll spin the yarn.",
        need_more_clue: true,
        source: "local",
      };
    }

    // ---- Paragraph 1: setting out, and what happened ----
    var p1 = [fill(pick(OPENERS))];
    if (slots.happened) p1.push(joinLead(fill(pick(HAPPENED_LEADS)), slots.happened));

    // ---- Paragraph 2: the crew, the watch, the new word ----
    var p2 = [];
    if (slots.who) p2.push(joinLead(fill(pick(WHO_LEADS)), slots.who));
    if (slots.noticed) p2.push(joinLead(fill(pick(NOTICED_LEADS)), slots.noticed));
    extra.slice(0, 2).forEach(function (e) { p2.push(joinLead(fill(pick(EXTRA_LEADS)), e)); });
    if (slots.word) p2.push(fill(pick(WORD_LEADS)) + "\u201C" + stripEnd(slots.word) + ".\u201D");

    // ---- Paragraph 3: the true cargo, and the harbour ----
    var p3 = [];
    if (slots.idea) p3.push(joinLead(fill(pick(IDEA_LEADS)), slots.idea));
    if (slots.feeling) p3.push(joinLead(fill(pick(FEELING_LEADS)), slots.feeling));
    p3.push(fill(pick(CLOSERS)));

    // Keep three paragraphs when there is material for three; otherwise fold
    // the thin ones together so the entry never looks like an empty frame.
    var paras;
    if (p1.length < 2) {
      // The opener alone is just voyage furniture — fold it into the first
      // paragraph that carries a fact.
      if (p2.length) paras = (p3.length > 1) ? [p1.concat(p2), p3] : [p1.concat(p2).concat(p3)];
      else paras = [p1.concat(p3)];
    } else if (p2.length && p3.length > 1) paras = [p1, p2, p3];
    else if (p2.length || p3.length > 1) paras = [p1, p2.concat(p3)];
    else paras = [p1.concat(p3)];

    var text = paras
      .map(function (a) { return a.filter(Boolean).join(" ").replace(/\s+/g, " ").trim(); })
      .filter(Boolean)
      .join("\n\n");

    return {
      title: fill(pick(TITLES)),
      text: text,
      shipmate_note: pick(SHIPMATE_NOTES),
      need_more_clue: false,
      source: "local",
    };
  }

  window.ScribeWriter = { write: write };
})();
