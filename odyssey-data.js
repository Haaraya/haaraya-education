/* ============================================================
   100 Book Odyssey — mock progress data (swap for real data later)
   Book-light state and medal unlocks derive from these numbers.
   ============================================================ */
window.ODYSSEY = {
  totalBooks: 100,
  completedBooks: 22,   // books 1–22 are lit
  currentBook: 23,      // the book being read right now
  reader: "Amaka",
  stages: [
    { name: "Wonder Stage",   medal: "Nsude Wonder",   medalFile: "odyssey_nsude_wonder.png",  start: 1,  end: 15  },
    { name: "Explorer Stage", medal: "Ocean Explorer", medalFile: "odyssey_ocean_explorer.png", start: 16, end: 30  },
    { name: "Story Stage",    medal: "Story Spell",    medalFile: "odyssey_story_spell.png",    start: 31, end: 45  },
    { name: "Quest Stage",    medal: "Code Quest",     medalFile: "odyssey_code_quest.png",     start: 46, end: 60  },
    { name: "Spark Stage",    medal: "Power Spark",    medalFile: "odyssey_power_spark.png",     start: 61, end: 80  },
    { name: "Legend Stage",   medal: "Odyssey Legend", medalFile: "odyssey_legend.png",          start: 81, end: 100 }
  ]
};
