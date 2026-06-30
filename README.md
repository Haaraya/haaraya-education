# Haaraya Education

A web prototype for the Haaraya / Tafiya reading programme — a marketing home page, a role-aware demo (visitor, parent, teacher, school, admin), a Reading Passport, a child dashboard, and a **book library + reader** for the real Tafiya catalogue.

## Running it

It's a static site — no build step. Open `Haaraya Home.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000/Haaraya%20Home.html
```

A local server is recommended over `file://` so the library's book images and the live book fetch work.

## Key files

| File | What it is |
|------|------------|
| `Haaraya Home.html` | Main entry point — loads everything below |
| `app.jsx` | App shell, hash router, role/session wiring, Tweaks panel |
| `home.jsx` | Marketing home page |
| `screens.jsx` | Passport, child dashboard, parent dashboard |
| `tafiya-reader.jsx` | **Library** (real Tafiya catalogue) + **Reader** (cover → pages → back cover) |
| `tafiya-data.js` | Tafiya catalogue + bundled sample book + Supabase fetch |
| `tafiya-reader.css` | Scoped reader + library styles (everything namespaced under `.tfr` / `.tfl-`) |
| `shared.jsx`, `reg-shared.jsx`, `registration.jsx`, `admin-screens.jsx` | Shared components & secondary screens |
| `styles.css`, `passport.css`, `skill-check.css` | Design system + screen styles |
| `session.js` | Prototype role/session layer (session-only persistence) |
| `data/` | Mock API + seed data for the demo (books, strands, levels) |
| `assets/`, `thumbnails/covers/` | Logos, strand art, book cover thumbnails |
| `books/T4-NF-01/images/` | Images for the offline **sample** book |

## How books load (hybrid online/offline)

Tapping a book in the library calls `TafiyaData.getPackage(code)`:

- The **sample** book `T4-NF-01` ("How We Cook Jollof Rice") is fully bundled and works offline — it's tagged **Sample** in the library.
- Every other book is fetched live from Supabase via the `get_book_package` RPC, with cover/page images served from the Supabase storage bucket.

The Supabase URL and **publishable** key live in `tafiya-data.js`. The publishable key is intended to be client-visible; treat it accordingly if this repo is public.

## Offline build

`Haaraya Education (offline).html` is a single self-contained file (all assets inlined) that runs without a server. It is generated from `Haaraya Home (offline-src).html` and currently uses the **previous** reader — regenerate it when you want the new library/reader bundled offline.

## Notes

- The demo role is stored in `sessionStorage`, so a fresh tab always starts as a public visitor. The Tweaks panel has a **Reset demo** button that clears all demo progress.
- The app always opens on the Home page regardless of the last session role.
