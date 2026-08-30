/* ============================================================
   Haaraya Odyssey — Shipmate Scribe · local narrative writer v2
   ------------------------------------------------------------
   Zero AI calls. Zero per-entry cost. Works offline.

   Design principle:
     Captain's Notes = the child's evidence.
     Shipmate Yarn   = a short reflection on the PATH of thinking,
                       not a paraphrase of every answer.

   The writer may use:
     • the book title
     • the book's authored Spin-the-Yarn creative brief
     • the wording/shape of the questions
     • ONE short phrase from the Captain's own notes as an anchor

   It must NOT invent book facts. The authored creative brief is treated as
   permitted imaginative framing, not as factual evidence.

   Exposes:
     window.ScribeWriter.write(input)

   Input supports:
     book_code, book_title, book_number, stream, qa, notes,
     spin_prompt, person, reader_key, spin_version
   ============================================================ */
(function () {
  "use strict";

  function tidy(s) { return String(s == null ? "" : s).trim().replace(/\s+/g, " "); }
  function stripEnd(s) { return tidy(s).replace(/[.!?,;:]+$/, ""); }
  function cap(s) { s = tidy(s); return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
  function words(s) { return tidy(s).split(/\s+/).filter(Boolean); }
  function wc(s) { return words(s).length; }

  // ---------- deterministic variation ---------------------------------
  function seedOf(str) {
    var h = 2166136261;
    str = String(str || "odyssey");
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) || 1;
  }

  function picker(seed) {
    var s = seed >>> 0;
    return function (arr) {
      if (!arr || !arr.length) return "";
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return arr[s % arr.length];
    };
  }

  // ---------- book/world helpers --------------------------------------
  function streamFor(input) {
    var explicit = tidy(input.stream).toLowerCase();
    if (explicit) {
      if (/knowledge/.test(explicit)) return "knowledge";
      if (/stor/.test(explicit)) return "stories";
      if (/tafiya/.test(explicit)) return "tafiya";
    }
    var p = tidy(input.book_code).split("-")[0].toUpperCase();
    if (p === "KN") return "knowledge";
    if (p === "CL") return "stories";
    if (p === "ST") return "tafiya";
    return "odyssey";
  }

  function pronouns(person) {
    var third = person === "third";
    return {
      I: third ? "The Captain" : "I",
      i: third ? "the Captain" : "I",
      my: third ? "their" : "my",
      me: third ? "the Captain" : "me",
      was: third ? "was" : "was",
      have: third ? "has" : "have",
    };
  }

  // ---------- question-shape synthesis -------------------------------
  // This is intentionally about the STRUCTURE of the questions, not the
  // correctness/content of the child's answers.
  function questionShape(qa, stream) {
    var q = (qa || []).map(function (p) { return tidy(p && p.question); }).filter(Boolean).join(" ");
    if (!q) return stream === "stories"
      ? "The questions kept turning the story until a larger meaning appeared."
      : "The questions kept turning the subject until a larger idea appeared.";

    var hasCompare = /different|compare|similar|same|unlike|rather than/i.test(q);
    var hasWhy = /\bwhy\b|reason|because|cause/i.test(q);
    var hasHow = /\bhow\b|way|process/i.test(q);
    var hasEvidence = /fact|evidence|detail|example|use one|from the book/i.test(q);
    var hasChoice = /captain[’']?s choice|which|choose|would you|should/i.test(q);
    var hasFuture = /protect|preserve|future|next|help|save|remember|share/i.test(q);
    var hasCharacter = /character|person|people|choice|motive|decide|decision/i.test(q);

    if (hasCompare && hasWhy && hasChoice) return "The trail began with a difference, moved to why it mattered, and ended with what to carry forward.";
    if (hasWhy && hasFuture) return "The clues moved from why it mattered to what might be worth protecting or remembering.";
    if (hasEvidence && hasChoice) return "The questions moved from evidence to judgement: notice the clue, then choose what deserves the spotlight.";
    if (hasCharacter && hasWhy) return "The story trail moved from what people did to why their choices mattered.";
    if (hasCompare) return "The first turn was comparison; the difference made the bigger idea easier to see.";
    if (hasWhy && hasHow) return "The questions linked how something happened with why it mattered.";
    if (hasWhy) return "The questions pushed past what happened toward why it mattered.";
    if (hasHow) return "The questions followed what could be seen into how the pieces worked together.";
    if (hasChoice) return "The final turn belonged to the Captain: notice the clues, then choose what travels onward.";
    return stream === "stories"
      ? "The questions kept turning the story until a larger meaning appeared."
      : "The questions kept turning the subject until a larger idea appeared.";
  }

  // ---------- creative-brief genre ------------------------------------
  function genreFor(prompt) {
    var p = tidy(prompt).toLowerCase();
    if (/field report|news report|reporter|newsroom|broadcast/.test(p)) return "report";
    if (/diary|journal/.test(p)) return "diary";
    if (/letter|postcard|message home/.test(p)) return "letter";
    if (/mission|campaign|persuad|convince|club/.test(p)) return "mission";
    if (/interview|questions? a|conversation/.test(p)) return "interview";
    if (/museum|exhibit|gallery|guide/.test(p)) return "museum";
    if (/speech|debate|argument/.test(p)) return "speech";
    if (/travel|walking|visitor|journey|reaches|arrives|scene/.test(p)) return "travel";
    if (/retell|story|tale|scene/.test(p)) return "story";
    return "log";
  }

  var GENRE_OPENERS = {
    report: [
      "Field report: the map changed before this voyage was over.",
      "Ship's report: one set of clues led somewhere larger than the first question.",
      "Report from the reading deck: this voyage refused to stay inside a single fact.",
      "Dispatch from the chart room: the clues connected more than I expected.",
    ],
    diary: [
      "Diary note: I reached the last page with a different question from the one I started with.",
      "Journal entry: the most interesting part of this voyage was the turn between the clues.",
      "Tonight's log is less about one answer and more about where the questions led.",
      "Diary note: the book left a trail, and the trail mattered more than any single stop.",
    ],
    letter: [
      "Message home: this voyage gave me one clue worth sending back.",
      "Postcard from the reading route: the interesting part was how the clues joined up.",
      "A note for the crew back home: the map looks a little different now.",
      "Letter from the voyage: I am bringing back a connection, not a list of answers.",
    ],
    mission: [
      "Mission log: the questions turned reading into a decision about what matters next.",
      "Crew mission: follow the clues, find the connection, decide what deserves action.",
      "Mission report: this book did not end at knowing; it pushed toward choosing.",
      "The mission changed halfway through: first understand the clues, then decide what to do with them.",
    ],
    interview: [
      "Interview notes: the best answer was not a sentence to copy, but a connection to follow.",
      "From the interview desk: each question opened another door instead of closing the subject.",
      "Question by question, the conversation moved from detail to meaning.",
      "Interview log: the questions kept nudging the voyage beyond the obvious answer.",
    ],
    museum: [
      "Curator's note: one clue deserves a place under the glass, but the connection belongs on the wall.",
      "Museum log: the exhibit in my head changed as the questions added context.",
      "Gallery note: the object was only the beginning; the questions supplied the story around it.",
      "Curator's log: the strongest part of this voyage was deciding what deserves to be remembered.",
    ],
    speech: [
      "Speech notes: a strong case begins with clues, but it ends with why they matter.",
      "From the speaking deck: the questions built an argument one step at a time.",
      "Debate log: the facts mattered, but the real work was deciding what they added up to.",
      "Speech draft: the voyage moved from evidence toward a reason to care.",
    ],
    travel: [
      "Travel log: somewhere between the first clue and the last, the map grew wider.",
      "I set out with the title on the chart and came back carrying a connection.",
      "Travel note: this voyage changed direction when the questions moved beyond the obvious.",
      "The route through this book had a turn I did not want to lose from the log.",
    ],
    story: [
      "Story log: the ending was not the only thing worth keeping; the turn between the clues mattered too.",
      "After the last page, one thread was still running through the story.",
      "The tale ended, but the questions kept one part of it moving in my head.",
      "Story note: the interesting part was not repeating the plot, but spotting what the pieces meant together.",
    ],
    log: [
      "Log entry: this voyage left me with a connection instead of a list.",
      "The chart for this book has one line I want to keep.",
      "I closed the book, but one route through the questions stayed open.",
      "Another voyage logged, this time by following the turn between the clues.",
    ],
  };

  var WORLD_CLOSERS = {
    knowledge: [
      "Some books add a fact. This one changed the shape of the map.",
      "The best clue did not finish the subject; it made the next question better.",
      "That is the kind of discovery worth leaving marked on the chart.",
      "Knowledge gets interesting when the facts begin to connect.",
      "The page can close now. The question can keep travelling.",
    ],
    stories: [
      "The story is over, but that thread is still travelling with me.",
      "Some endings close a door. This one left a small light under it.",
      "That is the part of the tale I would carry onto the next voyage.",
      "The plot has ended; the echo has not.",
      "One good story leaves something moving after the last page.",
    ],
    tafiya: [
      "That is the part I would carry into the next chapter of the journey.",
      "The book ended, but the choice inside it still has weight.",
      "One small turn in the story became the thing worth remembering.",
      "The last page closed. The thought behind it did not.",
      "That is enough cargo for one voyage.",
    ],
    odyssey: [
      "One more line on the chart, and on to the next voyage.",
      "The log can close; the thought can keep travelling.",
      "Another crossing made, with one clue worth keeping.",
      "The chart is fuller now.",
    ],
  };

  var TITLES = {
    knowledge: [
      "The Map Grew Wider",
      "A Clue Worth Keeping",
      "Beyond the First Answer",
      "What the Trail Connected",
      "The Question After the Question",
      "A Mark on the Chart",
      "Where the Clues Led",
    ],
    stories: [
      "The Thread I Kept",
      "Where the Story Turned",
      "An Echo After the Ending",
      "Between the Lines",
      "The Choice That Stayed",
      "After the Last Page",
      "A Thread Still Moving",
    ],
    tafiya: [
      "What Stayed With Me",
      "The Turn I Remember",
      "One Thing I Carried",
      "After the Last Page",
      "The Part That Lingered",
      "A Thought for the Road",
      "The Choice I Kept",
    ],
    odyssey: [
      "A Clue Worth Keeping",
      "The Turn in the Voyage",
      "One Mark on the Chart",
      "After the Last Page",
      "What I Carried Forward",
    ],
  };

  var ANCHOR_LEADS_FIRST = [
    "One clue stayed in my margin: ",
    "I kept one line from my notes: ",
    "The clue I pinned to the chart was: ",
    "One phrase stayed aboard: ",
    "I carried one scrap forward: ",
  ];
  var ANCHOR_LEADS_THIRD = [
    "One clue stayed in the Captain's margin: ",
    "The Captain kept one line from the notes: ",
    "The clue pinned to the chart was: ",
    "One phrase stayed aboard: ",
    "One scrap travelled forward: ",
  ];

  var NO_ANCHOR_LINES_FIRST = [
    "I did not need to copy every answer into the yarn; the connection between them was the part worth logging.",
    "The notes stay on the Captain's page. Here I am keeping the turn they made together.",
    "Instead of repeating my answers, I marked the route the questions made through the book.",
  ];
  var NO_ANCHOR_LINES_THIRD = [
    "The Captain's answers stay on the notes page; the yarn keeps the connection between them.",
    "There is no need to copy every answer twice. The log marks the route the questions made together.",
    "The notes hold the answers. The yarn keeps the turn they made together.",
  ];


  var BOOK_LINES_FIRST = [
    "In “{book},” I followed the questions past the first answer.",
    "The route through “{book}” sharpened when I watched how the questions connected.",
    "I let “{book}” unfold clue by clue instead of copying my notes back.",
    "With “{book}” on the chart, I looked for the turn between the clues.",
    "I came through “{book}” with one connection worth logging.",
  ];
  var BOOK_LINES_THIRD = [
    "In “{book},” the Captain followed the questions past the first answer.",
    "The route through “{book}” sharpened as the Captain watched how the questions connected.",
    "The Captain let “{book}” unfold clue by clue instead of copying the notes back.",
    "With “{book}” on the chart, the Captain looked for the turn between the clues.",
    "The Captain came through “{book}” with one connection worth logging.",
  ];

  var SHIPMATE_NOTES = [
    "I kept your notes intact and logged the connection, Captain.",
    "Your answers stay yours; I only marked the trail between them.",
    "One clue, one connection, one clean log entry, Captain.",
    "Your notes are the evidence. This yarn keeps the thread between them.",
    "Logged without copying your whole notebook back to you, Captain.",
  ];

  // ---------- anchor selection ----------------------------------------
  function cleanAnchor(answer) {
    var a = tidy(answer).replace(/[“”"]/g, "");
    if (!a) return "";
    var w = words(a);
    if (w.length < 3) return "";
    if (w.length > 10) {
      a = w.slice(0, 10).join(" ");
      a = a.replace(/[,;:\-]+$/, "");
      return a + "…";
    }
    return stripEnd(a);
  }

  function chooseAnchor(qa) {
    var answered = (qa || []).filter(function (p) { return tidy(p && p.answer); });
    if (!answered.length) return "";

    // Prefer a concise, meaningful-looking answer. Captain's-choice answers
    // are useful when concise, otherwise a shorter earlier clue usually reads
    // better in a quoted margin note.
    var scored = answered.map(function (p, idx) {
      var a = tidy(p.answer), n = wc(a), q = tidy(p.question);
      var score = 0;
      if (n >= 4 && n <= 10) score += 6;
      else if (n >= 3 && n <= 16) score += 3;
      if (/captain[’']?s choice|which|choose/i.test(q) && n <= 10) score += 2;
      if (/because|why/i.test(a)) score += 1;
      score -= idx * 0.15;
      return { text: a, score: score };
    }).sort(function (a, b) { return b.score - a.score; });

    return cleanAnchor(scored[0].text);
  }

  // ---------- length control -----------------------------------------
  function clampWords(text, maxWords) {
    var w = words(text);
    if (w.length <= maxWords) return tidy(text);
    var cut = w.slice(0, maxWords).join(" ");
    var stop = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
    if (stop > cut.length * 0.55) return cut.slice(0, stop + 1);
    return cut.replace(/[,;:\s]+$/, "") + "…";
  }

  function write(input) {
    input = input || {};
    var qa = Array.isArray(input.qa) ? input.qa.filter(function (p) { return p && tidy(p.question); }) : [];
    var answered = qa.filter(function (p) { return tidy(p.answer); });

    // Legacy generic-note fallback, used only if no authored Q&A were supplied.
    if (!qa.length && input.notes) {
      var n = input.notes || {};
      qa = [
        { question: "What happened?", answer: n.what_happened || "" },
        { question: "Who mattered most?", answer: n.who_mattered_most || "" },
        { question: "What was the big idea?", answer: n.big_idea || "" },
        { question: "What did you notice?", answer: n.what_i_noticed || "" },
        { question: "One word I found", answer: n.new_word || "" },
        { question: "How did it make you feel?", answer: n.feeling || "" },
      ];
      answered = qa.filter(function (p) { return tidy(p.answer); });
    }

    if (answered.length < 2) {
      return {
        title: "",
        text: "",
        shipmate_note: "Give me one more clue, Captain, and I can follow the trail between them.",
        need_more_clue: true,
        source: "local-v2",
      };
    }

    var stream = streamFor(input);
    var person = input.person === "third" ? "third" : "first";
    var pro = pronouns(person);
    var genre = genreFor(input.spin_prompt);
    var version = Number(input.spin_version || 1) || 1;
    var seedMaterial = [
      tidy(input.reader_key) || "reader",
      tidy(input.book_code) || tidy(input.book_title),
      String(version),
      answered.map(function (p) { return tidy(p.answer); }).join("|")
    ].join("::");
    var pick = picker(seedOf(seedMaterial));

    var title = pick(TITLES[stream] || TITLES.odyssey);
    var opener = pick(GENRE_OPENERS[genre] || GENRE_OPENERS.log);
    var shape = questionShape(qa, stream);
    var anchor = chooseAnchor(qa);
    var anchorLead = person === "third" ? pick(ANCHOR_LEADS_THIRD) : pick(ANCHOR_LEADS_FIRST);
    var noAnchor = person === "third" ? pick(NO_ANCHOR_LINES_THIRD) : pick(NO_ANCHOR_LINES_FIRST);
    var closer = pick(WORLD_CLOSERS[stream] || WORLD_CLOSERS.odyssey);

    // Keep the book title present without turning the yarn into a summary.
    var bookTitle = tidy(input.book_title) || "this book";
    var bookLine = pick(person === "third" ? BOOK_LINES_THIRD : BOOK_LINES_FIRST)
      .replace("{book}", bookTitle);

    var p1 = opener + " " + bookLine + " " + shape;
    var p2;
    if (anchor) {
      p2 = anchorLead + "“" + anchor + ".” " + closer;
    } else {
      p2 = noAnchor + " " + closer;
    }

    // The illustrated log page has a hard visual budget. The phrase banks and
    // 10-word anchor cap keep the result naturally around 50–70 words.
    var text = (p1 + "\n\n" + p2).trim();

    return {
      title: title,
      text: text,
      shipmate_note: pick(SHIPMATE_NOTES),
      need_more_clue: false,
      source: "local-v2",
      _genre: genre,
      _stream: stream,
    };
  }

  window.ScribeWriter = { write: write };
})();
