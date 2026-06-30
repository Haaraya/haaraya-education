# Haaraya Platform — Supabase Seeding Report

_Last updated: June 28, 2026_

This document records everything done (and decided) while seeding the Haaraya
Supabase/Postgres database, so the work can be picked up cleanly next time.

---

## 1. The core discovery: two incompatible schemas

The project ships with a **platform seed plan** in `uploads/`:

- `Haaraya_Platform_Postgres_Schema_v1.sql` — table definitions
- `Haaraya_Platform_Postgres_Seed_v1.sql` — INSERT statements

That seed plan was written for a database where **every `id` is an
auto-incrementing integer** (`BIGSERIAL`), with integer foreign keys and a
**9-strand / 12-level taxonomy**.

The **live Supabase database is different.** It is the **Tafiya reader
database**, where:

- **Every `id` is a `uuid`** (with `gen_random_uuid()` defaults), not an integer.
- The `books` table has **no foreign keys** to `levels`/`strands`. Instead it
  stores `level` and `strand` as **plain text**.

**Consequence:** the shipped seed file (`...Seed_v1.sql`) **cannot be run as-is** —
it fails immediately because it inserts integer ids (`1,2,3,4`) into UUID columns:

```
ERROR: 42804: column "id" is of type uuid but expression is of type integer
```

Everything we wrote had to be **rewritten for UUIDs** and reconciled against the
live reader model rather than the shipped file.

---

## 2. State of the live database

Schema was already created successfully (all tables + views exist). Row counts
captured during diagnosis:

| Table | id type | Rows | Status |
| --- | --- | --- | --- |
| `books` | uuid | **30** | **Real data — do not touch** |
| `book_pages` | uuid | **240** | **Real data — do not touch** |
| `book_skills` | uuid | **30** | **Real data — do not touch** |
| `levels` | uuid | 0 → **12** | Seeded this session |
| `strands` | uuid | 0 → **10** | Seeded this session |
| `users` | uuid | 0 | Not seeded (deferred) |
| `schools` | uuid | 0 | Not seeded (deferred) |
| `children` | uuid | 0 | Not seeded (deferred) |
| `classrooms` | uuid | 0 | Not seeded (deferred) |
| `classroom_children` | (none) | 0 | Not seeded (deferred) |
| `teacher_school_links` | (none) | 0 | Not seeded (deferred) |
| `subscriptions` | uuid | 0 | Not seeded (deferred) |
| `assignments` | uuid | 0 | Not seeded (deferred) |
| `reading_progress` | uuid | 0 | Not seeded (deferred) |
| `passport_stamps` | uuid | 0 | Not seeded (deferred) |

### What the live `books` table actually looks like

Columns: `id (uuid)`, `book_code`, `title`, **`strand` (text)**, **`level` (text)**,
`tafiya_name`, `book_type`, `theme`, `topic`, `cover_image_path`, `status`,
`created_at`, `updated_at`.

Distinct values currently used by the 30 books:

- **`level`**: `1` (7 books), `2` (7), `3` (8), `4` (8) — i.e. only levels 1–4 in use.
- **`strand`**: `Tafiya` — **all 30 books** use this single coarse label.
  The sub-category (Fiction, etc.) is carried by `book_type`, not `strand`.

---

## 3. What we decided

**Recommendation followed: seed the lookup tables now, defer the demo platform.**

Reasoning:
1. The valuable data (books/pages/skills) is already live and correct.
2. The app's prototype runs on **in-memory demo data** (`data/api.js` /
   `data/seed.js`) — so seeding demo `users`/`children`/`assignments` into
   Supabase right now would add **fake accounts to the real DB for zero working
   features**.
3. The platform tables came from the mismatched (integer/9-strand) design and
   were never reconciled with the reader model. Best to wire them up later, when
   the app's data layer is actually pointed at Supabase and we know the real
   column/relationship requirements.

So this session = **`levels` + `strands` only.**

---

## 4. What was seeded

### 4a. `levels` — canonical 12-level ladder ✅

UUID-keyed via `gen_random_uuid()`. `level_number` aligns numerically with the
text `level` values on books (books use 1–4; full ladder is 1–12).

```sql
INSERT INTO levels (id, level_number, level_code, level_name, band, badge_color, sort_order, description) VALUES
(gen_random_uuid(), 1,  'L1',  'Tashi',    'Pink',     'green',  1,  'Haaraya Level 1: Tashi (Pink band)'),
(gen_random_uuid(), 2,  'L2',  'Mataki',   'Red',      'green',  2,  'Haaraya Level 2: Mataki (Red band)'),
(gen_random_uuid(), 3,  'L3',  'Hanya',    'Yellow',   'green',  3,  'Haaraya Level 3: Hanya (Yellow band)'),
(gen_random_uuid(), 4,  'L4',  'Tafiya',   'Blue',     'green',  4,  'Haaraya Level 4: Tafiya (Blue band)'),
(gen_random_uuid(), 5,  'L5',  'Kwararo',  'Green',    'lime',   5,  'Haaraya Level 5: Kwararo (Green band)'),
(gen_random_uuid(), 6,  'L6',  'Gada',     'Orange',   'lime',   6,  'Haaraya Level 6: Gada (Orange band)'),
(gen_random_uuid(), 7,  'L7',  'Kwari',    'Turquoise','purple', 7,  'Haaraya Level 7: Kwari (Turquoise band)'),
(gen_random_uuid(), 8,  'L8',  'Tudun',    'Purple',   'purple', 8,  'Haaraya Level 8: Tudun (Purple band)'),
(gen_random_uuid(), 9,  'L9',  'Kololuwa', 'Gold',     'purple', 9,  'Haaraya Level 9: Kololuwa (Gold band)'),
(gen_random_uuid(), 10, 'L10', 'Fage',     'White',    'purple', 10, 'Haaraya Level 10: Fage (White band)'),
(gen_random_uuid(), 11, 'L11', 'Sarari',   'Lime',     'purple', 11, 'Haaraya Level 11: Sarari (Lime band)'),
(gen_random_uuid(), 12, 'L12', 'Isa',      'Dark Red', 'purple', 12, 'Haaraya Level 12: Isa (Dark Red band)');
```

> ⚠️ **Verify there are exactly 12, not 24.** If a "duplicate key" error ever
> caused a re-run, check `SELECT count(*) FROM levels;`. If it shows 24,
> de-duplicate (see §6).

### 4b. `strands` — canonical 10 strands ✅

Final agreed list = **10 strands** (the old `data/strands.json` only had 9; the
difference is that **Stamina is now split into Stamina Fiction + Stamina
Non-Fiction**, Duniya is active, and "Folktales" is plural). The source of truth
for these 10 was the strand cards in the app.

Decisions baked in:
- **`color` = `#000000` for all 10** (user confirmed all strands are black).
- **`logo_url`** points at the real bundled PNGs in `assets/logos/` (not SVGs).
- All 10 marked **`is_active = TRUE`**.
- The `strands` table has no column for the card keyword (REPEATED /
  FOUNDATIONAL…) or the level range — those were folded into `description` /
  omitted.

Because `strands` already contained an earlier (partial/9-strand) set, the run
hit a unique-constraint error on `name`:

```
ERROR: 23505: duplicate key value violates unique constraint "strands_name_key"
DETAIL: Key (name)=(Hafwas) already exists.
```

Resolved by **resetting the table** (safe: the only referencing table,
`passport_stamps`, is empty — 0 rows — so no ids are depended upon):

```sql
DELETE FROM strands;

INSERT INTO strands (id, name, slug, color, logo_url, description, is_active) VALUES
(gen_random_uuid(), 'Hafwas',             'hafwas',              '#000000', '/assets/logos/logo-hafwas.png',                  'High-frequency words. Rhythm and repetition that build reading confidence early.', TRUE),
(gen_random_uuid(), 'Soundables',         'soundables',          '#000000', '/assets/logos/logo-soundables.png',              'Decodable phonics readers. Friendly patterns, structured progress.', TRUE),
(gen_random_uuid(), 'Soundables+',        'soundables-plus',     '#000000', '/assets/logos/logo-soundables-plus.png',         'Prefixes, suffixes, roots. Unlocking the architecture of words.', TRUE),
(gen_random_uuid(), 'Tafiya Fiction',     'tafiya-fiction',      '#000000', '/assets/logos/logo-tafiya-fiction.png',          'The leveled story journey. Nigerian-rooted fiction at the heart of every level.', TRUE),
(gen_random_uuid(), 'Tafiya Non-Fiction', 'tafiya-non-fiction',  '#000000', '/assets/logos/logo-tafiya-nonfiction.png',       'Real-world Nigerian non-fiction. Markets, weather, work, animals — the world children live in.', TRUE),
(gen_random_uuid(), 'Tafiya Folktales',   'tafiya-folktales',    '#000000', '/assets/logos/logo-folktales.png',               'Traditional Nigerian and West African folktales — the oral tradition, on the page.', TRUE),
(gen_random_uuid(), 'Tafiya Poetry',      'tafiya-poetry',       '#000000', '/assets/logos/logo-poetry.png',                  'Rhythm, rhyme, oral language. A love of how words sound.', TRUE),
(gen_random_uuid(), 'Tafiya Duniya',      'tafiya-duniya',       '#000000', '/assets/logos/logo-tafiya-duniya.png',           'Folktales from the wider world — Haaraya looking outward.', TRUE),
(gen_random_uuid(), 'Stamina Fiction',    'stamina-fiction',     '#000000', '/assets/logos/logo-tafiya-stamina-fiction.png',  'Extended fiction readers. Deeper, longer, more demanding stories for confident readers.', TRUE),
(gen_random_uuid(), 'Stamina Non-Fiction','stamina-non-fiction', '#000000', '/assets/logos/logo-tafiya-stamina-nonfiction.png','Long-form non-fiction. Place, science, history — Nigerian and global, for fluent readers.', TRUE);
```

> ✅ Confirm `SELECT count(*) FROM strands;` returns **10**.

---

## 5. Known mismatch to resolve later (important)

The lookup tables now hold the **fine-grained** strand taxonomy
(`tafiya-fiction`, `tafiya-folktales`, …), but the **30 live books still store
`strand = "Tafiya"`** (the coarse label). There is **no foreign key**, so nothing
breaks — but the two will **not text-match** until the books are relabeled.

When ready to connect books to strands, decide one of:
- **Relabel books**: update `books.strand` from `"Tafiya"` to the finer slug,
  driven by `book_type` (e.g. `book_type = 'Fiction'` → `tafiya-fiction`).
- **Keep coarse**: leave books as `"Tafiya"` and map coarse→fine in the app layer
  (note: `data/api.js` already contains a slug→UI-key mapping for this purpose).

This is a product decision, not a bug.

---

## 6. Useful verification / cleanup queries

```sql
-- Row counts of the two seeded tables
SELECT 'levels'  AS t, count(*) FROM levels
UNION ALL
SELECT 'strands' AS t, count(*) FROM strands;
-- expect levels = 12, strands = 10

-- If levels got duplicated to 24, keep one of each level_number:
DELETE FROM levels a USING levels b
WHERE a.ctid < b.ctid AND a.level_number = b.level_number;

-- Inspect strands
SELECT name, slug, color, is_active FROM strands ORDER BY name;
```

---

## 7. Not done yet (deferred — by deliberate choice)

These tables remain **empty on purpose**, to be seeded only when the app is wired
to Supabase and their real requirements are known:

`users`, `schools`, `children`, `classrooms`, `classroom_children`,
`teacher_school_links`, `subscriptions`, `assignments`, `reading_progress`,
`passport_stamps`.

When that time comes, the shipped `Haaraya_Platform_Postgres_Seed_v1.sql` will
**still need rewriting for UUIDs** (it uses integer ids/FKs), and demo
`assignments` / `reading_progress` / `passport_stamps` will need to reference real
books by `book_code` (or by the books' UUID `id`), since there is no FK from those
tables to the reader `books` table.

---

## 8. One-line summary

Live DB is the **UUID-based Tafiya reader** (books/pages/skills already loaded),
**not** the integer-based platform the shipped seed assumed. This session safely
seeded **12 `levels`** and **10 `strands`** (all black, real logo paths) to match
the real catalogue, and **deferred all demo-platform tables** until the app's data
layer is connected to Supabase.
