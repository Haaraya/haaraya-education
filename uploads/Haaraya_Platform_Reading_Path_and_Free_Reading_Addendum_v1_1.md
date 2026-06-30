# Haaraya Platform Addendum v1.1
## Reading Path, Free Reading, Reminders, and Database Updates

**Purpose**

This document records the platform decisions about how children will use the Haaraya reading app, especially the difference between structured reading, story practice, and free reading. It should be stored with the main Haaraya platform/design brief and the database addendum.

---

## 1. Core Product Decision

Children should not be limited to only assigned books.

Haaraya should support both:

1. **Structured reading**, where books are assigned or automatically sequenced.
2. **Free reading**, where children can explore books for pleasure, practice, curiosity, and rereading.

This protects the literacy sequence while keeping the platform joyful and alive. If children can only read assigned books, Haaraya may feel like homework. If children can read absolutely anything with no structure, some children may skip foundational work or get frustrated.

The best product structure is:

**Here is your path. Here is your playground. Both matter.**

---

## 2. Main App Reading Zones

The app should organize reading into clear zones.

### 2.1 Continue Reading

This is the first and most immediate section on the child dashboard.

It shows the child the book they have already started and should continue.

**Purpose:** Reduce friction and help the child return to reading quickly.

**Example content:**

- Last opened book
- Current page
- Progress through the book
- Continue button

---

### 2.2 My Reading Path

This is the structured reading area.

It contains the books that teach or reinforce the literacy sequence.

**Main strands in this zone:**

- Soundables
- Hafwas
- Soundables+
- Selected Tafiya books when needed for consolidation

**Purpose:** Teach decoding, high-frequency words, phonics, morphology, and controlled reading progression.

**This zone includes:**

- Teacher-assigned books
- Parent-assigned books
- Automatically recommended next books
- Books required to complete the current reading level

**Product feeling:** This is the child’s reading mission for the day, but it should still feel warm, rewarding, and adventurous.

---

### 2.3 Story Practice

This is where Tafiya mainly belongs.

Tafiya books consolidate what the child has learned through fuller Nigerian stories. They are not as tightly sequenced as Soundables and Hafwas, but they should still be matched to the child’s level.

**Main strand in this zone:**

- Tafiya

**Purpose:** Build confidence, comprehension, fluency, identity, and enjoyment through levelled Nigerian fiction and narrative reading.

**Access style:**

- Matched to the child’s current level
- Can count toward progress
- Can also be browsed more freely than Soundables or Hafwas

---

### 2.4 Explore Library / Read for Fun

This is the free reading area.

It should feel like the child’s reading playground.

**Strands and book types in this zone:**

- Poetry
- Folktales
- Duniya
- Stamina
- Non-fiction
- Rereads
- Some Tafiya books
- Easier books below the child’s level

**Purpose:** Encourage joy, curiosity, rereading, cultural connection, wider knowledge, and independent reading habits.

**Product feeling:** Discovery, not homework.

---

## 3. Strand Roles in the App

| Strand / Book Type | Main Role | App Zone | Sequence Rule | Progress Rule |
|---|---|---|---|---|
| Soundables | Teach decoding and phonics | My Reading Path | Strict sequence | Counts toward level progress |
| Hafwas | Teach high-frequency words | My Reading Path | Strict sequence | Counts toward level progress |
| Soundables+ | Teach advanced phonics and morphemes | My Reading Path | Strict or semi-strict sequence | Counts toward level progress |
| Tafiya | Consolidate reading through Nigerian stories | Story Practice | Semi-sequenced | Counts toward level progress when at child’s level |
| Poetry | Oral language, rhythm, rhyme, rereading | Explore Library | Flexible | Counts as practice/enrichment |
| Folktales | Cultural stories and comprehension | Explore Library / Extension | Flexible | Counts as enrichment or extension |
| Duniya | Wider world stories | Explore Library / Extension | Flexible | Counts as enrichment or extension |
| Stamina | Longer reading endurance | Explore Library / Extension | Flexible | Counts as extension |
| Non-fiction | Knowledge building and informational reading | Explore Library / Extension | Flexible | Counts as enrichment or extension |

---

## 4. How Reading Should Count

Different reading contexts should count differently.

| Reading Type | Counts Toward Level Progress? | Earns Passport Stamp? | Notes |
|---|---:|---:|---|
| Assigned books | Yes | Yes | Teacher, parent, or system assignment |
| Automatic path books | Yes | Yes | Part of the structured sequence |
| Tafiya books at current level | Yes | Yes | Consolidation reading |
| Free books at current level | Yes or partial | Yes | Should encourage independent reading |
| Free books below current level | Practice only | Yes, but not duplicate main stamp | Good for fluency and confidence |
| Free books above current level | Exploration only | Yes, but should not move level automatically | Prevents children from gaming levels or becoming frustrated |
| Rereads | Fluency practice | Reread badge or reread count, not duplicate stamp | Encourages rereading without cluttering passport |

---

## 5. Passport Stamp Rule

Passport stamps should be visual images.

The database should not store the actual image file inside the table. It should store the link/path to the image.

A stamp record should answer:

- Which child earned it?
- Which book or level caused it?
- Which strand does it belong to?
- Which image should be shown?
- When was it earned?

**Example:**

```text
stamp_image_url = /assets/stamps/L7/hafwas-big-bus-stamp.webp
```

The actual stamp image lives in cloud storage or the app’s asset system.

---

## 6. Daily Reminders

Haaraya can have daily reminders, but they should be gentle and joyful, not guilt-based.

Avoid harsh streak language like:

- “You broke your streak.”
- “You missed your goal.”
- “Don’t disappoint us.”

Better reminder language:

- “Your passport is waiting.”
- “Read one book today.”
- “Earn a new stamp.”
- “Continue your journey.”
- “Nasa found a new book for you.”
- “Tima is probably doing too much again. Come and read.”

Parents should be able to turn reminders on or off.

Schools may have their own reminder settings for classes.

---

## 7. Database Updates Required

The database schema should be updated to support the reading-zone logic.

### 7.1 Add Fields to `strands`

Recommended fields:

| Field | Type | Purpose |
|---|---|---|
| `primary_app_zone` | text | reading_path, story_practice, explore |
| `requires_sequence` | boolean | Whether books in this strand must follow a strict sequence |
| `counts_for_level_progress_default` | boolean | Default rule for whether books in this strand count toward level progress |
| `is_extension_strand` | boolean | Marks Duniya, Stamina, and similar strands as extension/enrichment |

**Example strand settings:**

| Strand | primary_app_zone | requires_sequence | counts_for_level_progress_default |
|---|---|---:|---:|
| Soundables | reading_path | true | true |
| Hafwas | reading_path | true | true |
| Soundables+ | reading_path | true | true |
| Tafiya | story_practice | false | true |
| Poetry | explore | false | false |
| Folktales | explore | false | false |
| Duniya | explore | false | false |
| Stamina | explore | false | false |
| Non-fiction | explore | false | false |

---

### 7.2 Add Fields to `books`

Recommended fields:

| Field | Type | Purpose |
|---|---|---|
| `app_zone_override` | text/null | Allows a specific book to appear in a different zone from its strand default |
| `counts_for_level_progress` | boolean | Book-specific progress rule |
| `requires_sequence` | boolean | Book-specific sequencing rule |
| `sequence_group` | text/null | Groups books into a sequence, e.g. L1 Soundables Set A |
| `sequence_order` | integer/null | Order within a structured sequence |
| `is_free_reading_allowed` | boolean | Whether the child can open it freely |
| `min_level_access` | integer/null | Lowest level allowed to access the book freely |
| `max_level_access` | integer/null | Optional upper limit for targeted recommendations |

This gives flexibility. For example, most Tafiya books may be free story practice, but one Tafiya book can still be placed in the structured path if needed.

---

### 7.3 Add Field to `reading_progress`

Add:

| Field | Type | Purpose |
|---|---|---|
| `reading_context` | text | Explains why/how the child read the book |

Recommended values:

```text
assigned
teacher_assignment
parent_assignment
automatic_path
story_practice
free_reading
reread
extension
```

This field is important because the same book might be read for different reasons.

Example:

- A child reads a Tafiya book because the teacher assigned it: `teacher_assignment`
- A child chooses the same Tafiya book for fun later: `reread`
- A child reads a Duniya book above level: `extension`

---

### 7.4 Add Fields to `passport_stamps`

Recommended fields:

| Field | Type | Purpose |
|---|---|---|
| `stamp_image_url` | text | Link to the stamp image |
| `stamp_category` | text | book, level, strand, reread, challenge |
| `reading_context` | text | Context that produced the stamp |
| `is_duplicate_allowed` | boolean | Whether repeat reading can produce another stamp |

This prevents the passport from becoming messy with duplicate book stamps.

---

### 7.5 Add Reminder Table

A new table should be added later for reminders.

Suggested table: `reading_reminders`

| Field | Type | Purpose |
|---|---|---|
| `id` | uuid | Unique reminder ID |
| `child_id` | uuid | Child receiving reminder |
| `parent_user_id` | uuid | Parent linked to reminder settings |
| `reminder_enabled` | boolean | On/off setting |
| `reminder_time` | time | Preferred reminder time |
| `reminder_style` | text | gentle, achievement, character-led |
| `last_sent_at` | timestamp | Last reminder sent |

Reminder notifications should be optional.

---

## 8. Product Rule for Level Movement

Children should not automatically move up a level just because they freely opened harder books.

Level movement should be based on structured progress, teacher/parent settings, and completed books that count for level progression.

Recommended rule:

- Reading Path books count fully.
- Story Practice books at the current level count fully or partially.
- Explore Library books count as enrichment unless specifically marked otherwise.
- Above-level reading earns exploration credit but does not automatically advance the child.

---

## 9. Interface Updates Required

The already-designed web app should keep its visual design, but the content structure should reflect these zones.

### Child Dashboard Should Show

1. Continue Reading
2. My Reading Path
3. Story Practice
4. Explore Library / Read for Fun
5. Passport progress
6. Earned stamps
7. Gentle reminder prompt, if enabled

### Parent Dashboard Should Show

1. Child profiles
2. Current level
3. Reading Path progress
4. Story Practice activity
5. Free reading activity
6. Stamps earned
7. Reminder settings

### Teacher Dashboard Should Show

1. Assigned Reading Path books
2. Student completion status
3. Story Practice reading
4. Children who need support
5. Books read for fun, as secondary insight

---

## 10. Final Platform Principle

Haaraya should not feel like a locked school assignment system.

It should feel like a Nigerian reading journey where structured literacy, cultural stories, identity, curiosity, and joy work together.

The platform should teach children to read, but also make them want to read.

