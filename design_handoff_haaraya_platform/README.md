# Handoff: Haaraya Education Platform

## Overview

Haaraya Education is a web platform for the **Haaraya / Tafiya reading
programme** — a structured, Nigerian-rooted early-literacy product. It comprises:

- A **marketing home page**.
- A **role-aware demo** (visitor, parent, teacher, school admin, Haaraya admin).
- A **Reading Passport** and **child dashboard** (progress, stamps, levels).
- A **book library + reader** for the real Tafiya catalogue (cover → pages →
  back cover), backed by Supabase.
- A **registration / onboarding flow** (including an avatar builder).

This bundle is the design + working prototype plus full documentation of the
**Supabase data layer**, which is the part currently wired to a real backend.

## About the Design Files

The HTML/JSX/CSS files in this bundle are a **working prototype built as a static
site** (React via in-browser Babel, no build step). They are accurate **design
references** — they show the intended look, copy, layout, and behavior.

The task on the receiving end is to **recreate these designs in the target
production environment** using its established patterns and libraries (a real
React/Vite/Next build, a component library, a proper bundler, etc.) — or, if no
codebase exists yet, to choose an appropriate stack and implement there. Do not
ship the in-browser-Babel prototype as production; treat it as the spec.

The **Supabase backend, schema, and seed data described below are real** and
should be reused as-is (it already serves live book content).

## Fidelity

**High-fidelity.** Final colors, typography, copy, layout, and interactions are
all present and intended. Recreate the UI faithfully; the prototype is the visual
source of truth. The one exception is engineering structure (build, bundling,
state management) which should follow the target codebase's conventions, not the
prototype's in-browser approach.

---

## Architecture at a glance

- **Static site, no build.** Entry point is `Haaraya Home.html`, which loads all
  `.jsx` (transpiled in-browser by Babel) and `.css`/`.js` files.
- **App shell / router:** `app.jsx` — hash router, role/session wiring, Tweaks
  panel.
- **Screens:** `home.jsx` (marketing), `screens.jsx` (passport, child + parent
  dashboards), `admin-screens.jsx`, `registration.jsx` + `reg-*.jsx`
  (onboarding/avatar), `tafiya-reader.jsx` (library + reader).
- **Data layer:** `data/api.js` — all functions are **async (Promise-returning)**
  so the mock implementation can be swapped for Supabase calls without moving any
  call sites. Demo seed in `data/seed.js`.
- **Reader data layer:** `tafiya-data.js` — fetches real books live from Supabase.
- **Session:** `session.js` — prototype role/session stored in `sessionStorage`;
  reading progress in `localStorage` (key `haaraya:reading:<childId>`).

### Two data layers, two states (important)

1. **Reader content = real Supabase.** `tafiya-data.js` calls the
   `get_book_package` RPC and pulls cover/page images from the `book-assets`
   storage bucket. This is **live**.
2. **Everything else (dashboards, parents, children, assignments, progress) =
   in-memory demo data** synthesized by `data/api.js`. These are **not** backed by
   Supabase yet. Connecting them is the main backend task remaining (see
   `Supabase Seeding Report.md`).

---

## Supabase configuration

Defined at the top of `tafiya-data.js`:

| Constant | Value |
|---|---|
| `SUPABASE_URL` | `https://laihhrkxnxzohaiiisou.supabase.co` |
| `SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` (client-visible publishable key) |
| `STORAGE_BUCKET` | `book-assets` |

- Book packages: `POST {SUPABASE_URL}/rest/v1/rpc/get_book_package`.
- Images: `…/storage/v1/object/public/book-assets/<path>`.
- The publishable key is intended to be client-visible. **Move it to an env var**
  in the production build; do not hardcode. Lock down row-level security and the
  storage bucket policy before going public.

### Database state (live)

The live database is the **UUID-based Tafiya reader DB**. Real, populated tables:
`books` (30 rows), `book_pages` (240), `book_skills` (30). Lookup tables seeded
during this work: `levels` (12), `strands` (10). All other platform tables
(`users`, `schools`, `children`, `classrooms`, `assignments`, `reading_progress`,
`passport_stamps`, …) exist but are **empty by design**.

**Full detail — including the gotcha that the shipped integer-id seed file does
NOT match the live UUID schema, the exact seed SQL that was run, and the known
`books.strand = "Tafiya"` vs. fine-grained-strands mismatch — is in
`Supabase Seeding Report.md` (included in this bundle). Read it before touching
the backend.**

---

## Screens / Views

> The prototype is the pixel source of truth; below is an orientation map. Open
> each file/screen and lift exact values from it.

- **Home (`home.jsx`)** — marketing landing: hero, programme explanation, strand
  showcase (the 10 strands), calls to action.
- **Registration (`registration.jsx`, `reg-flows.jsx`, `reg-avatar-builder.jsx`)**
  — multi-step onboarding by role; includes a child **avatar builder**.
- **Reading Passport (`screens.jsx`, `passport.css`)** — the child's progress
  artifact: levels, bands, collected stamps.
- **Child dashboard (`screens.jsx`)** — current level, assigned/available books,
  progress.
- **Parent dashboard (`screens.jsx`)** — child overview, progress, subscription.
- **Library + Reader (`tafiya-reader.jsx`, `tafiya-reader.css`)** — the real
  catalogue grid (namespaced `.tfl-`) and the page-turn reader (namespaced
  `.tfr`). Cover → pages → back cover. The sample book `T4-NF-01` is bundled and
  works offline; all others load live from Supabase.
- **Admin screens (`admin-screens.jsx`)** — Haaraya/school admin views.
- **Skill check (`skill-check.jsx`, `skill-check.css`)** — in-reader comprehension
  / phonics check.

## Design tokens

Pull exact values from `styles.css` (design-system root), plus `passport.css`,
`registration.css`, `tafiya-reader.css`, `skill-check.css`, `avatar.css`. The
reader/library styles are **fully namespaced** (`.tfr`, `.tfl-`) so they can be
lifted without collision.

Strand brand color is **`#000000` (black) for all 10 strands** (confirmed). Level
bands carry their own colors (Pink/Red/Yellow/Blue/… — see the `levels` seed in
the Supabase report).

## Assets

- `assets/`, `assets-min/` — logos and strand art (`assets/logos/logo-*.png`).
- `thumbnails/covers/` — book cover thumbnails.
- `books/T4-NF-01/images/` — pages for the bundled offline sample book.
- All other book imagery is served from the Supabase `book-assets` bucket.

## Files in this bundle

Core source is included alongside this README. Key references:

- `README.md` — the project's own run/architecture notes.
- `Supabase Seeding Report.md` — **the backend bible** (schema mismatch, seed SQL,
  what's done, what's deferred).
- `app.jsx`, `home.jsx`, `screens.jsx`, `admin-screens.jsx`,
  `registration.jsx`, `reg-*.jsx`, `tafiya-reader.jsx` — screens.
- `tafiya-data.js`, `data/` — data layers.
- `*.css` — styles / design tokens.
- `supabase-dashboard-tables.sql` — SQL used for the dashboard tables.

## Recommended first steps for the developer

1. Read `README.md`, then `Supabase Seeding Report.md`.
2. Run the prototype locally (`python3 -m http.server 8000`) to see intended
   behavior.
3. Stand up the production app skeleton in the chosen stack; move Supabase config
   to env vars.
4. Recreate screens hifi using the prototype as spec.
5. Replace `data/api.js`'s in-memory layer with real Supabase queries; seed the
   deferred platform tables (using the report's guidance, rewritten for UUIDs).
