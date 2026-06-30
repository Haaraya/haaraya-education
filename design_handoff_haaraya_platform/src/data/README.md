# Haaraya — Data layer

This folder is the **only** place that talks to the database. Screens never reach
into JSON files; they always call `window.HaarayaApi.*`.

```
data/
├── strands.json          ← from uploads/strands.csv      (9 rows)
├── levels.json           ← from uploads/levels.csv       (12 rows)
├── books.json            ← from uploads/books_normalized.csv (396 rows)
├── seed.js               ← demo users / children / subs / assignments (in-memory)
├── types.js              ← JSDoc shapes — single source of truth for record types
└── api.js                ← Promise-returning mock API surface
```

## Boot

`app.jsx` calls `await HaarayaApi.boot()` once on startup. It fetches the three
JSON dumps, annotates each book with `strandSlug` / `strandUi` / `levelCode`,
then synthesises **reading_progress** and **passport_stamps** rows for the demo
children so the prototype paints a believable state.

## Reading zones (Addendum v1.1)

Three product zones govern what the child sees and how reading counts:

| Zone | UI label | Strands | Sequence | Counts toward level |
|---|---|---|---|---|
| `reading_path`   | **My Reading Path**  | Soundables, Hafwas, Soundables+ | strict      | yes |
| `story_practice` | **Story Practice**   | Tafiya Fiction                  | semi        | yes (at level) |
| `explore`        | **Explore for Fun**  | Poetry, Folktales, Duniya, Stamina, Non-fiction | flexible | enrichment / extension |

`api.boot()` annotates every strand and every book with:
- `primaryAppZone` — `"reading_path" | "story_practice" | "explore"`
- `countsForLevelProgress` — boolean
- `requiresSequence` — boolean
- `isFreeReadingAllowed` — boolean
- `sequenceGroup` / `sequenceOrder` — sequence membership

### New API helpers

```js
HaarayaApi.getReadingPath(childId, limit=6)      // Soundables/Hafwas/+ for current level, in sequence order
HaarayaApi.getStoryPractice(childId, limit=6)    // Tafiya Fiction at the child's level
HaarayaApi.getExploreLibrary(childId, limit=8)   // Poetry, Folktales, Duniya, Stamina, Non-fiction
HaarayaApi.getReadingPathProgress(childId)       // { total, completed, pct } for the structured path at current level
```

### `completeBook` now takes context

```js
await HaarayaApi.completeBook(childId, bookId, { context: "free_reading" });
```

If omitted, context is inferred from the book's zone. A re-read of a finished
book is auto-marked as `"reread"` with `countsForProgress: false`, and produces
a stamp with `stampCategory: "reread"` so the passport doesn't fill with
duplicates.

### `ReadingProgress` and `PassportStamp` new fields

```ts
ReadingProgress {
  readingContext: "assigned"|"teacher_assignment"|"parent_assignment"
                | "automatic_path"|"story_practice"|"free_reading"|"reread"|"extension"
  countsForProgress: boolean
  earnsStamp: boolean
}

PassportStamp {
  stampCategory: "book"|"level"|"strand"|"reread"|"challenge"
  stampImageUrl: string|null     // CDN URL only; image file never stored in DB
  readingContext: string|null
  isDuplicateAllowed: boolean
}
```

## Screen → DB mapping

| Screen | Tables read | Tables written | Key fields used |
|---|---|---|---|
| **Home / Hero** | — | — | static; just demos the brand |
| **Library** | `books`, `strands`, `levels` | — | `title`, `coverUrl`, `audioUrl`, `levelCode`, `strandUi` |
| **Reader** | `books`, `book_pages` (later), `reading_progress` | `reading_progress`, `passport_stamps` | `pageCount`, `audioUrl`; awards a stamp on finish |
| **Child Dashboard** | `children`, `reading_progress`, `passport_stamps`, `levels`, `strands`, `assignments` | `reading_progress` (on continue), `passport_stamps` (on finish) | child summary, continue reading, recommended next, recent stamps |
| **Reading Passport** | `children`, `passport_stamps`, `passport_themes` | — | stamps grouped by strand, level path, holder header |
| **Parent Dashboard** | `users` (self), `children`, `reading_progress`, `passport_stamps`, `subscriptions` | — | KPIs, per-child progress, weekly chart, recent stamps |
| **Teacher Dashboard** | `users` (self), `assignments`, `books`, `strands` | `assignments` (when creating) | book, strand, level, completion % |

## Mock API functions (all async)

```js
HaarayaApi.boot()                                  // call once on app start
HaarayaApi.getStrands(): Strand[]
HaarayaApi.getLevels():  Level[]
HaarayaApi.getBooks({ levelId?, strandSlug?, strandUi?, audioOnly?, search?, limit?, offset? })
HaarayaApi.getBookById(id):    Book | null
HaarayaApi.getBooksByLevel(n)
HaarayaApi.getBooksByStrand(slug)

HaarayaApi.getCurrentParent(): User
HaarayaApi.getCurrentTeacher(): User
HaarayaApi.getChild(id)
HaarayaApi.getChildrenForParent(parentUserId): Child[]
HaarayaApi.getChildrenForSchool(schoolId): Child[]

HaarayaApi.getChildReadingProgress(childId): ReadingProgress[]
HaarayaApi.getPassportStamps(childId, { strandSlug?, levelId? }): PassportStamp[]
HaarayaApi.getChildSummary(childId): ChildSummary
HaarayaApi.getContinueReading(childId, limit=4): Book[]
HaarayaApi.getNextRecommendedBooks(childId, limit=4): Book[]
HaarayaApi.getNextRecommendedBook(childId): Book | null

HaarayaApi.getSubscriptionForParent(parentUserId): Subscription | null
HaarayaApi.getAssignmentsForTeacher(teacherUserId): (Assignment & { book: Book })[]

HaarayaApi.completeBook(childId, bookId): PassportStamp   // mutation
HaarayaApi.awardStamp(childId, { kind, bookId?, title, strandSlug?, levelId? })
```

## Strand mapping (DB → UI)

Production has nine strands; the website visualises eight (Tafiya Fiction and
Tafiya Non-Fiction share one identity, "tafiya"):

| DB slug | UI key |
|---|---|
| `soundables` | `soundables` |
| `hafwas` | `hafwas` |
| `tafiya-fiction` | `tafiya` |
| `tafiya-non-fiction` | `tafiya` |
| `tafiya-folktale` | `folktale` |
| `tafiya-poetry` | `poetry` |
| `soundables-plus` | `soundables-plus` |
| `tafiya-duniya` | `duniya` |
| `stamina` | `stamina` |

`api.boot()` annotates each book with both `strandSlug` and `strandUi` so screens
can filter by either.

## Demo children (from the Schema Readme)

| id | Name | Level | Mode | What this demo shows |
|---|---|---|---|---|
| 1 | Kahamefule Obi ("Kaha") | L7 | automatic | Strong reader: many completed books + a full passport |
| 2 | Amaka Obi | L3 | choose | Mid-level reader who picks her own books |
| 3 | Nasa Demo | L1 | automatic | Classroom child seeded by a school account |

## Replacing this with Supabase later

Each `HaarayaApi.*` function has the shape `(...args) => Promise<Record[]>`. To
swap to Supabase you only change function bodies:

```js
async function getBooksByLevel(levelId) {
  const { data } = await supabase
    .from("books")
    .select("*, strand:strands(slug, color, name)")
    .eq("level_id", levelId)
    .order("sequence_position");
  return data;
}
```

No call site changes. The JSDoc types in `data/types.js` describe the row
shape every backend implementation must return.

## Assets are URLs, never binary

Following the production rule in `Haaraya_DB_Schema_Readme_v1.md`, the DB stores
URLs only. Today they point at the placeholder paths inside `books_normalized.csv`
(`/assets/placeholders/covers/...`). When real WebP pages, audio, and covers are
uploaded to Cloudflare R2, only those URL strings change.
