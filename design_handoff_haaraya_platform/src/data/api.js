/* ============================================================
   Haaraya — Mock API surface
   ----------------------------------------------------------------
   All functions are async (Promise-returning) so swapping the
   implementation for Supabase later is purely a body change —
   the call sites in shared.jsx / home.jsx / screens.jsx don't move.

   USAGE
     await HaarayaApi.boot()                          // call once on app start
     const books = await HaarayaApi.getBooks()        // all books
     const subset = await HaarayaApi.getBooksByLevel(5)
     const stamps = await HaarayaApi.getPassportStamps(childId)
     await HaarayaApi.completeBook(childId, bookId)   // mutation

   TYPES are defined as JSDoc in data/types.js.
   ============================================================ */

(function () {
  const S = window.HaarayaSeed;

  // ── helpers ─────────────────────────────────────────────────
  const sleep  = (ms = 0)        => new Promise(r => setTimeout(r, ms));
  const clone  = (x)             => JSON.parse(JSON.stringify(x));
  const byId   = (arr, id)       => arr.find(r => r.id === id) || null;

  /* Map DB strand slugs → UI strand keys used by StrandLogo / palette.
     The DB has separate strands for Tafiya Fiction, Folktale, Non-Fiction;
     the website rolls Fiction + Non-Fiction under one "tafiya" identity. */
  const STRAND_SLUG_TO_UI = {
    "soundables":         "soundables",
    "hafwas":             "hafwas",
    "tafiya-fiction":     "tafiya",
    "tafiya-folktale":    "folktale",
    "tafiya-non-fiction": "tafiya",
    "tafiya-poetry":      "poetry",
    "soundables-plus":    "soundables-plus",
    "tafiya-duniya":      "duniya",
    "stamina":            "stamina",
  };

  /* Reading-zone rules per Addendum v1.1 §3.
     primary_app_zone:   "reading_path" | "story_practice" | "explore"
     requires_sequence:  books must be opened in DB sequence order
     countsForProgress:  whether finishing this strand's book advances the level */
  const STRAND_ZONE_RULES = {
    "soundables":         { zone: "reading_path",   requiresSequence: true,  countsForProgress: true,  isExtension: false, freeReadingAllowed: false },
    "hafwas":             { zone: "reading_path",   requiresSequence: true,  countsForProgress: true,  isExtension: false, freeReadingAllowed: false },
    "soundables-plus":    { zone: "reading_path",   requiresSequence: true,  countsForProgress: true,  isExtension: false, freeReadingAllowed: false },
    "tafiya-fiction":     { zone: "story_practice", requiresSequence: false, countsForProgress: true,  isExtension: false, freeReadingAllowed: true  },
    "tafiya-non-fiction": { zone: "explore",        requiresSequence: false, countsForProgress: false, isExtension: false, freeReadingAllowed: true  },
    "tafiya-folktale":    { zone: "explore",        requiresSequence: false, countsForProgress: false, isExtension: false, freeReadingAllowed: true  },
    "tafiya-poetry":      { zone: "explore",        requiresSequence: false, countsForProgress: false, isExtension: false, freeReadingAllowed: true  },
    "tafiya-duniya":      { zone: "explore",        requiresSequence: false, countsForProgress: false, isExtension: true,  freeReadingAllowed: true  },
    "stamina":            { zone: "explore",        requiresSequence: false, countsForProgress: false, isExtension: true,  freeReadingAllowed: true  },
  };

  function strandUiKey(strandRow) {
    return STRAND_SLUG_TO_UI[strandRow.slug] || strandRow.slug;
  }
  function zoneRulesForStrand(strandRow) {
    return STRAND_ZONE_RULES[strandRow.slug] || { zone: "explore", requiresSequence: false, countsForProgress: false, isExtension: false, freeReadingAllowed: true };
  }

  /* ──────────────────────────────────────────────────────────
     Boot — fetch the static JSON dumps and stash on the seed.
     Also synthesise per-child reading progress + stamps so the
     prototype has a believable demo state on first paint.
     ────────────────────────────────────────────────────────── */
  let booted = null;
  async function boot() {
    if (booted) return booted;
    booted = (async () => {
      const R = (typeof window !== "undefined" && window.__resources) || {};
      const [strandsRes, levelsRes, booksRes] = await Promise.all([
        fetch(R.dataStrands || "data/strands.json"),
        fetch(R.dataLevels  || "data/levels.json"),
        fetch(R.dataBooks   || "data/books.json"),
      ]);
      S.strands = await strandsRes.json();
      S.levels  = await levelsRes.json();
      S.books   = await booksRes.json();

      // Annotate each strand with its zone rules
      for (const sr of S.strands) {
        const rules = zoneRulesForStrand(sr);
        sr.primaryAppZone = rules.zone;
        sr.requiresSequence = rules.requiresSequence;
        sr.countsForLevelProgressDefault = rules.countsForProgress;
        sr.isExtensionStrand = rules.isExtension;
      }

      // Annotate each book with its UI strand key + zone fields once, for cheap rendering.
      const strandsById = Object.fromEntries(S.strands.map(s => [s.id, s]));
      for (const b of S.books) {
        const sr = strandsById[b.strandId];
        b.strandSlug = sr ? sr.slug : null;
        b.strandUi   = sr ? strandUiKey(sr) : null;
        b.levelCode  = (S.levels.find(l => l.number === b.levelId) || {}).code || `L${b.levelId}`;
        const rules = sr ? zoneRulesForStrand(sr) : { zone: "explore", requiresSequence: false, countsForProgress: false, isExtension: false, freeReadingAllowed: true };
        b.primaryAppZone        = rules.zone;
        b.countsForLevelProgress = rules.countsForProgress;
        b.requiresSequence       = rules.requiresSequence;
        b.isFreeReadingAllowed   = rules.freeReadingAllowed;
        b.sequenceGroup          = sr ? `${b.levelCode} ${sr.name}` : null;
        b.sequenceOrder          = b.sequence;
        b.minLevelAccess         = null;
        b.maxLevelAccess         = null;
      }

      seedProgressAndStamps();
    seedAssignmentsWithBooks();
    })();
    return booted;
  }

  function seedAssignmentsWithBooks() {
    // The seed file shipped without book ids on assignments — pair each with a real book.
    const fictionPool = S.books.filter(b => b.primaryAppZone === "story_practice" && b.levelId === 3).slice(0, 3);
    const pathPool    = S.books.filter(b => b.primaryAppZone === "reading_path"   && b.levelId === 3).slice(0, 3);
    const all         = [...pathPool, ...fictionPool, ...fictionPool];
    for (const [i, a] of S.assignments.entries()) {
      if (!a.bookId && all[i]) a.bookId = all[i].id;
    }
  }

  function seedProgressAndStamps() {
    // Wipe any prior runs (e.g. hot reload)
    S.readingProgress = [];
    S.passportStamps = [];

    // Kaha (id=1, L7) — strong reader, lots of completed books.
    seedChildState(1, {
      level: 7,
      completedCountPerLevel: { 1: 10, 2: 12, 3: 14, 4: 14, 5: 12, 6: 10, 7: 14 },
      inProgressCount: 2,
    });
    // Amaka (id=2, L3) — newer reader, "choose" mode.
    seedChildState(2, {
      level: 3,
      completedCountPerLevel: { 1: 8, 2: 8, 3: 6 },
      inProgressCount: 1,
    });
    // Nasa (id=3, L1) — classroom child, very early.
    seedChildState(3, {
      level: 1,
      completedCountPerLevel: { 1: 4 },
      inProgressCount: 1,
    });
    // Classroom children (sundry profiles, demo state for the teacher dash)
    seedChildState(4,  { level: 5, completedCountPerLevel: { 1: 10, 2: 12, 3: 10, 4: 8, 5: 4 },  inProgressCount: 2 });
    seedChildState(5,  { level: 4, completedCountPerLevel: { 1: 10, 2: 8, 3: 6, 4: 3 },           inProgressCount: 1 });
    seedChildState(6,  { level: 6, completedCountPerLevel: { 1: 12, 2: 12, 3: 12, 4: 10, 5: 6, 6: 4 }, inProgressCount: 1 });
    seedChildState(7,  { level: 3, completedCountPerLevel: { 1: 8, 2: 6, 3: 1 },                   inProgressCount: 0 });
    seedChildState(8,  { level: 2, completedCountPerLevel: { 1: 6, 2: 2 },                         inProgressCount: 1 });
    seedChildState(9,  { level: 8, completedCountPerLevel: { 1: 12, 2: 12, 3: 12, 4: 10, 5: 10, 6: 10, 7: 8, 8: 6 }, inProgressCount: 1 });
    seedChildState(10, { level: 5, completedCountPerLevel: { 1: 10, 2: 10, 3: 8, 4: 6, 5: 2 },     inProgressCount: 1 });
    seedChildState(11, { level: 4, completedCountPerLevel: { 1: 8, 2: 6, 3: 4, 4: 2 },             inProgressCount: 0 });
  }

  function seedChildState(childId, { level, completedCountPerLevel, inProgressCount }) {
    let stampIdSeed = (childId * 1000);
    let progressIdSeed = (childId * 1000);
    const today = new Date("2026-05-24");

    for (const [lvl, n] of Object.entries(completedCountPerLevel)) {
      const pool = S.books.filter(b => b.levelId === Number(lvl));
      const picked = pool.slice(0, n);
      for (const [i, book] of picked.entries()) {
        const days = (Object.keys(completedCountPerLevel).length - Number(lvl) + 1) * 30 + (n - i);
        const date = new Date(today.getTime() - days * 86400000);
        const context = book.primaryAppZone === "reading_path"
          ? "automatic_path"
          : book.primaryAppZone === "story_practice"
            ? "story_practice"
            : "free_reading";
        S.readingProgress.push({
          id: ++progressIdSeed,
          childId, bookId: book.id,
          status: "completed",
          pagesRead: book.pageCount || 8,
          completedAt: date.toISOString().slice(0, 10),
          updatedAt: date.toISOString().slice(0, 10),
          readingContext: context,
          countsForProgress: book.countsForLevelProgress,
          earnsStamp: true,
        });
        S.passportStamps.push({
          id: ++stampIdSeed,
          childId, bookId: book.id,
          stampCategory: "book",
          kind: "book",
          strandSlug: book.strandSlug,
          levelId: book.levelId,
          title: book.title,
          readingContext: context,
          stampImageUrl: `/assets/stamps/${book.levelCode}/${book.slug}-stamp.webp`,
          isDuplicateAllowed: false,
          earnedAt: date.toISOString().slice(0, 10),
        });
      }
    }
    // In-progress books at the current level (favor reading_path strands)
    const inProgPool = S.books.filter(b => b.levelId === level)
      .sort((a, b) => (a.primaryAppZone === "reading_path" ? -1 : 1) - (b.primaryAppZone === "reading_path" ? -1 : 1));
    const inProg = inProgPool.slice(completedCountPerLevel[level] || 0, (completedCountPerLevel[level] || 0) + inProgressCount);
    for (const book of inProg) {
      S.readingProgress.push({
        id: ++progressIdSeed,
        childId, bookId: book.id,
        status: "in_progress",
        pagesRead: Math.max(1, Math.floor((book.pageCount || 8) * 0.45)),
        completedAt: null,
        updatedAt: today.toISOString().slice(0, 10),
        readingContext: book.primaryAppZone === "reading_path" ? "automatic_path" : "story_practice",
        countsForProgress: book.countsForLevelProgress,
        earnsStamp: true,
      });
    }
  }

  /* ──────────────────────────────────────────────────────────
     READ — strands & levels
     ────────────────────────────────────────────────────────── */
  async function getStrands() { await boot(); return clone(S.strands); }
  async function getLevels()  { await boot(); return clone(S.levels); }

  /* ──────────────────────────────────────────────────────────
     READ — books
     ────────────────────────────────────────────────────────── */
  async function getBooks(filter = {}) {
    await boot();
    let list = S.books;
    if (filter.levelId)    list = list.filter(b => b.levelId === filter.levelId);
    if (filter.strandSlug) list = list.filter(b => b.strandSlug === filter.strandSlug);
    if (filter.strandUi)   list = list.filter(b => b.strandUi === filter.strandUi);
    if (filter.audioOnly)  list = list.filter(b => !!b.audioUrl);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(b => b.title.toLowerCase().includes(q));
    }
    if (filter.limit) list = list.slice(filter.offset || 0, (filter.offset || 0) + filter.limit);
    return clone(list);
  }

  async function getBookById(id)         { await boot(); return clone(byId(S.books, id)); }
  async function getBooksByLevel(levelId){ return getBooks({ levelId }); }
  async function getBooksByStrand(slug)  { return getBooks({ strandSlug: slug }); }

  /* ──────────────────────────────────────────────────────────
     READ — children / parents / teachers
     ────────────────────────────────────────────────────────── */
  async function getChildrenForParent(parentUserId) {
    await boot();
    return clone(S.children.filter(c => c.parentUserId === parentUserId));
  }
  async function getChildrenForSchool(schoolId) {
    await boot();
    return clone(S.children.filter(c => c.schoolId === schoolId));
  }
  async function getChild(id) {
    await boot();
    return clone(byId(S.children, id));
  }
  function sessionUserId() {
    return (typeof window !== "undefined" && window.HaarayaSession)
      ? window.HaarayaSession.userId() : null;
  }
  async function getCurrentParent() {
    await boot();
    const uid = sessionUserId();
    const bySession = uid != null ? byId(S.users, uid) : null;
    return clone(bySession || S.users.find(u => u.role === "parent")) || null;
  }
  async function getCurrentTeacher() {
    await boot();
    const uid = sessionUserId();
    const bySession = uid != null ? byId(S.users, uid) : null;
    return clone(bySession || S.users.find(u => u.role === "teacher")) || null;
  }

  /* ──────────────────────────────────────────────────────────
     READ — child progress / passport
     ────────────────────────────────────────────────────────── */
  async function getChildReadingProgress(childId) {
    await boot();
    return clone(S.readingProgress.filter(p => p.childId === childId));
  }

  async function getPassportStamps(childId, { strandSlug, levelId } = {}) {
    await boot();
    let list = S.passportStamps.filter(s => s.childId === childId);
    if (strandSlug) list = list.filter(s => s.strandSlug === strandSlug);
    if (levelId)    list = list.filter(s => s.levelId === levelId);
    return clone(list);
  }

  async function getChildSummary(childId) {
    await boot();
    const child = byId(S.children, childId);
    if (!child) return null;
    const progress = S.readingProgress.filter(p => p.childId === childId);
    const completed = progress.filter(p => p.status === "completed");
    const inProgress = progress.filter(p => p.status === "in_progress");
    const stamps = S.passportStamps.filter(s => s.childId === childId);
    const currentLevelBooks = S.books.filter(b => b.levelId === child.currentLevelId);
    const completedThisLevel = completed.filter(p => {
      const b = byId(S.books, p.bookId);
      return b && b.levelId === child.currentLevelId;
    });
    return clone({
      child,
      booksCompleted: completed.length,
      booksInProgress: inProgress.length,
      stampsEarned: stamps.length,
      currentLevelCompleted: completedThisLevel.length,
      currentLevelTotal: currentLevelBooks.length,
      currentLevelPct: currentLevelBooks.length
        ? Math.round((completedThisLevel.length / currentLevelBooks.length) * 100)
        : 0,
    });
  }

  async function getContinueReading(childId, limit = 4) {
    await boot();
    const inProg = S.readingProgress
      .filter(p => p.childId === childId && p.status === "in_progress")
      .map(p => byId(S.books, p.bookId)).filter(Boolean);
    if (inProg.length >= limit) return clone(inProg.slice(0, limit));
    // Top up with recommended next books
    const next = await getNextRecommendedBooks(childId, limit - inProg.length);
    return clone([...inProg, ...next]);
  }

  /* ──────────────────────────────────────────────────────────
     ZONES — Reading Path / Story Practice / Explore for Fun
     Per Addendum v1.1 §2.
     ────────────────────────────────────────────────────────── */

  async function getReadingPath(childId, limit = 6) {
    await boot();
    const child = byId(S.children, childId);
    if (!child) return [];
    const progressed = new Set(
      S.readingProgress.filter(p => p.childId === childId && p.status === "completed").map(p => p.bookId)
    );
    // Path books = strands in reading_path zone, current level or one back for review.
    const pool = S.books.filter(b =>
      b.primaryAppZone === "reading_path" &&
      (b.levelId === child.currentLevelId || b.levelId === Math.max(1, child.currentLevelId - 1)) &&
      !progressed.has(b.id)
    );
    // Sort by sequence so structured order is preserved.
    pool.sort((a, b) => (a.levelId - b.levelId) || (a.sequence - b.sequence));
    return clone(pool.slice(0, limit));
  }

  async function getStoryPractice(childId, limit = 6) {
    await boot();
    const child = byId(S.children, childId);
    if (!child) return [];
    const progressed = new Set(
      S.readingProgress.filter(p => p.childId === childId && p.status === "completed").map(p => p.bookId)
    );
    const pool = S.books.filter(b =>
      b.primaryAppZone === "story_practice" &&
      b.levelId === child.currentLevelId &&
      !progressed.has(b.id)
    );
    return clone(pool.slice(0, limit));
  }

  async function getExploreLibrary(childId, limit = 8) {
    await boot();
    const child = byId(S.children, childId);
    if (!child) return [];
    // Explore = all strands in explore zone, at or below child's level (encourages enjoyment, not over-reach).
    const pool = S.books.filter(b =>
      b.primaryAppZone === "explore" &&
      b.levelId <= child.currentLevelId + 1 // allow one stretch level
    );
    // Shuffle deterministically by id parity for a "discovery" feel
    const ordered = pool.slice().sort((a, b) => ((a.id * 9973) % 100) - ((b.id * 9973) % 100));
    return clone(ordered.slice(0, limit));
  }

  async function getReadingPathProgress(childId) {
    await boot();
    const child = byId(S.children, childId);
    if (!child) return { total: 0, completed: 0, pct: 0 };
    const pathBooks = S.books.filter(b => b.primaryAppZone === "reading_path" && b.levelId === child.currentLevelId);
    const completed = S.readingProgress.filter(p => {
      if (p.childId !== childId || p.status !== "completed") return false;
      return pathBooks.some(b => b.id === p.bookId);
    });
    return {
      total: pathBooks.length,
      completed: completed.length,
      pct: pathBooks.length ? Math.round((completed.length / pathBooks.length) * 100) : 0,
    };
  }

  async function getNextRecommendedBooks(childId, limit = 4) {
    await boot();
    const child = byId(S.children, childId);
    if (!child) return [];
    const progressed = new Set(
      S.readingProgress.filter(p => p.childId === childId).map(p => p.bookId)
    );
    const pool = S.books.filter(b => b.levelId === child.currentLevelId && !progressed.has(b.id));
    return clone(pool.slice(0, limit));
  }

  async function getNextRecommendedBook(childId) {
    const list = await getNextRecommendedBooks(childId, 1);
    return list[0] || null;
  }

  /* ──────────────────────────────────────────────────────────
     READ — subscriptions / assignments
     ────────────────────────────────────────────────────────── */
  async function getSubscriptionForParent(parentUserId) {
    await boot();
    return clone(S.subscriptions.find(s => s.ownerType === "parent" && s.ownerId === parentUserId)) || null;
  }

  async function getAssignmentsForTeacher(teacherUserId) {
    await boot();
    const rows = S.assignments.filter(a => a.assignedBy === teacherUserId);
    // Bind dummy books for visualisation
    return clone(rows.map((a, i) => ({
      ...a,
      book: a.bookId ? byId(S.books, a.bookId) : S.books[10 + i * 7] || S.books[i],
    })));
  }

  /* ──────────────────────────────────────────────────────────
     MUTATIONS — write back to in-memory seed (no persistence)
     ────────────────────────────────────────────────────────── */
  async function completeBook(childId, bookId, { context = null } = {}) {
    await boot();
    const book = byId(S.books, bookId);
    if (!book) throw new Error("Book not found");
    const readingContext = context || (
      book.primaryAppZone === "reading_path"   ? "automatic_path" :
      book.primaryAppZone === "story_practice" ? "story_practice" :
                                                  "free_reading"
    );
    let p = S.readingProgress.find(r => r.childId === childId && r.bookId === bookId);
    const today = new Date().toISOString().slice(0, 10);
    const isReread = p && p.status === "completed";
    if (!p) {
      p = {
        id: Date.now(),
        childId, bookId,
        status: "completed",
        pagesRead: book.pageCount || 8,
        completedAt: today, updatedAt: today,
        readingContext,
        countsForProgress: !!book.countsForLevelProgress,
        earnsStamp: true,
      };
      S.readingProgress.push(p);
    } else {
      p.status = "completed";
      p.completedAt = today;
      p.updatedAt = today;
      p.pagesRead = book.pageCount || p.pagesRead;
      p.readingContext = isReread ? "reread" : readingContext;
      p.countsForProgress = !!book.countsForLevelProgress && !isReread;
      p.earnsStamp = true;
    }
    return awardStamp(childId, {
      kind: isReread ? "reread" : "book",
      stampCategory: isReread ? "reread" : "book",
      bookId,
      title: book.title,
      strandSlug: book.strandSlug,
      levelId: book.levelId,
      readingContext: p.readingContext,
      stampImageUrl: `/assets/stamps/${book.levelCode}/${book.slug}-stamp.webp`,
      isDuplicateAllowed: false,
    });
  }

  async function awardStamp(childId, {
    kind = "book",
    stampCategory = null,
    bookId = null,
    title,
    strandSlug = null,
    levelId = null,
    readingContext = null,
    stampImageUrl = null,
    isDuplicateAllowed = false,
  }) {
    await boot();
    const stamp = {
      id: Date.now() + Math.floor(Math.random() * 999),
      childId, bookId, kind,
      stampCategory: stampCategory || kind,
      title, strandSlug, levelId,
      readingContext,
      stampImageUrl,
      isDuplicateAllowed,
      earnedAt: new Date().toISOString().slice(0, 10),
    };
    S.passportStamps.push(stamp);
    return clone(stamp);
  }

  /* ──────────────────────────────────────────────────────────
     TEACHER · SCHOOL ADMIN · HAARAYA ADMIN
     ────────────────────────────────────────────────────────── */

  async function getClassroomsForTeacher(teacherUserId) {
    await boot();
    const classrooms = S.classrooms.filter(c => c.primaryTeacherId === teacherUserId);
    return clone(classrooms.map(c => {
      const rosterIds = S.classroomChildren.filter(r => r.classroomId === c.id).map(r => r.childId);
      const pupils = rosterIds.map(id => byId(S.children, id)).filter(Boolean);
      const school = byId(S.schools, c.schoolId);
      return { ...c, pupilCount: pupils.length, school };
    }));
  }

  async function getChildrenForClassroom(classroomId) {
    await boot();
    const ids = S.classroomChildren.filter(r => r.classroomId === classroomId).map(r => r.childId);
    return clone(ids.map(id => byId(S.children, id)).filter(Boolean));
  }

  async function getClassReadingProgress(classroomId) {
    await boot();
    const pupils = await getChildrenForClassroom(classroomId);
    const summaries = await Promise.all(pupils.map(p => getChildSummary(p.id)));
    return clone(summaries);
  }

  async function getClassReadingPathProgress(classroomId) {
    await boot();
    const pupils = await getChildrenForClassroom(classroomId);
    let total = 0, completed = 0;
    for (const p of pupils) {
      const r = await getReadingPathProgress(p.id);
      total += r.total;
      completed += r.completed;
    }
    return { total, completed, pct: total ? Math.round((completed / total) * 100) : 0, pupilCount: pupils.length };
  }

  async function getSupportAlerts(classroomId) {
    await boot();
    const pupils = await getChildrenForClassroom(classroomId);
    const today = new Date("2026-05-24").getTime();
    const alerts = [];
    for (const p of pupils) {
      const progress = S.readingProgress.filter(rp => rp.childId === p.id);
      const lastUpdate = progress.length ? Math.max(...progress.map(rp => new Date(rp.updatedAt).getTime())) : 0;
      const daysSince = Math.floor((today - lastUpdate) / 86400000);
      const completedAtLevel = progress.filter(rp => rp.status === "completed" && (byId(S.books, rp.bookId) || {}).levelId === p.currentLevelId).length;
      if (lastUpdate && daysSince > 7) {
        alerts.push({ child: p, severity: "warn",  reason: "inactive",   detail: `No reading in ${daysSince} days` });
      } else if (completedAtLevel < 2 && p.currentLevelId > 1) {
        alerts.push({ child: p, severity: "info",  reason: "stuck",      detail: `Only ${completedAtLevel} books at L${p.currentLevelId}` });
      }
    }
    return clone(alerts);
  }

  async function getAssignmentsForClassroom(classroomId) {
    await boot();
    const rows = S.assignments.filter(a => a.classroomId === classroomId);
    return clone(rows.map(a => ({ ...a, book: a.bookId ? byId(S.books, a.bookId) : null })));
  }

  async function assignBookToClassroom(teacherUserId, classroomId, bookId) {
    await boot();
    const row = {
      id: Date.now(), bookId, assignedBy: teacherUserId,
      targetType: "class", classroomId, childId: null,
      assignmentType: "teacher_assignment",
      status: "assigned",
      assignedAt: new Date().toISOString().slice(0, 10),
      dueOn: null, completedPct: 0,
    };
    S.assignments.push(row);
    return clone(row);
  }

  /* ── School admin ── */

  async function getSchoolDashboard(schoolId) {
    await boot();
    const school = byId(S.schools, schoolId);
    const teachers = S.teacherSchoolLinks.filter(l => l.schoolId === schoolId)
      .map(l => ({ ...l, teacher: byId(S.users, l.teacherUserId) }));
    const classrooms = S.classrooms.filter(c => c.schoolId === schoolId)
      .map(c => ({ ...c,
        primaryTeacher: byId(S.users, c.primaryTeacherId),
        pupilCount: S.classroomChildren.filter(r => r.classroomId === c.id).length,
      }));
    const pupils = S.children.filter(c => c.schoolId === schoolId);
    const subscription = S.subscriptions.find(s => s.ownerType === "school" && s.ownerId === schoolId) || null;
    const sponsored = S.sponsoredAccess.filter(s => pupils.some(p => p.id === s.childId));
    return clone({ school, teachers, classrooms, pupils, subscription, sponsored });
  }

  async function getSchoolUsageOverview(schoolId) {
    await boot();
    const pupils = S.children.filter(c => c.schoolId === schoolId);
    const summaries = await Promise.all(pupils.map(p => getChildSummary(p.id)));
    const totalBooks = summaries.reduce((s, x) => s + x.booksCompleted, 0);
    const totalStamps = summaries.reduce((s, x) => s + x.stampsEarned, 0);
    const avgLevel = pupils.length ? Math.round(pupils.reduce((s, p) => s + p.currentLevelId, 0) / pupils.length * 10) / 10 : 0;
    return clone({
      pupilCount: pupils.length,
      teacherCount: S.teacherSchoolLinks.filter(l => l.schoolId === schoolId).length,
      classroomCount: S.classrooms.filter(c => c.schoolId === schoolId).length,
      totalBooks, totalStamps, avgLevel,
    });
  }

  /* ── Haaraya admin ── */

  async function getAdminCatalogue() {
    await boot();
    return clone({
      booksTotal:    S.books.length,
      booksActive:   S.books.filter(b => b.isActive).length,
      booksHidden:   S.books.filter(b => !b.isActive).length,
      strands:       S.strands.length,
      levels:        S.levels.length,
      assets:        S.assets.length,
      passportThemes:S.passportThemes.length,
    });
  }

  async function getAdminSubscriptions() {
    await boot();
    return clone(S.subscriptions.map(s => {
      let ownerName = "—";
      if (s.ownerType === "parent") ownerName = (byId(S.users, s.ownerId) || {}).displayName;
      if (s.ownerType === "school") ownerName = (byId(S.schools, s.ownerId) || {}).name;
      return { ...s, ownerName };
    }));
  }

  async function getAdminSponsoredAccess() {
    await boot();
    return clone(S.sponsoredAccess.map(s => ({ ...s, child: byId(S.children, s.childId) })));
  }

  async function getAdminAuditLog(limit = 20) {
    await boot();
    return clone(S.adminAuditLog.slice(-limit).reverse());
  }

  async function deactivateBook(bookId) {
    await boot();
    const b = byId(S.books, bookId);
    if (b) b.isActive = false;
    S.adminAuditLog.push({
      id: Date.now(), adminUserId: 3,
      actionType: "deactivate", tableName: "books", recordId: bookId,
      notes: `Deactivated book ${bookId}`,
      createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    });
    return clone(b);
  }

  /* ──────────────────────────────────────────────────────────
     Expose
     ────────────────────────────────────────────────────────── */
  window.HaarayaApi = {
    boot,
    // strands & levels
    getStrands, getLevels,
    // books
    getBooks, getBookById, getBooksByLevel, getBooksByStrand,
    // people
    getCurrentParent, getCurrentTeacher,
    getChildrenForParent, getChildrenForSchool, getChild,
    // progress & passport
    getChildReadingProgress, getPassportStamps, getChildSummary,
    getContinueReading, getNextRecommendedBooks, getNextRecommendedBook,
    // reading zones (Addendum v1.1)
    getReadingPath, getStoryPractice, getExploreLibrary, getReadingPathProgress,
    // subscriptions / assignments
    getSubscriptionForParent, getAssignmentsForTeacher,
    // teacher
    getClassroomsForTeacher, getChildrenForClassroom, getClassReadingProgress,
    getClassReadingPathProgress, getSupportAlerts, getAssignmentsForClassroom,
    assignBookToClassroom,
    // school admin
    getSchoolDashboard, getSchoolUsageOverview,
    // haaraya admin
    getAdminCatalogue, getAdminSubscriptions, getAdminSponsoredAccess,
    getAdminAuditLog, deactivateBook,
    // mutations
    completeBook, awardStamp,
    // utilities
    strandUiKey, zoneRulesForStrand,
  };
})();
