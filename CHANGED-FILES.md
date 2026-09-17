# Push manifest — 2026-09-17
Compared against `Haaraya/haaraya-education@main` (tree 7c9ab93eb85d) file-by-file (git blob SHA).
Everything else in the project root is already identical to main.

## Modified — replace in repo root (17)
- `Haaraya Home.html`
- `app.jsx`
- `avatar-v1.jsx`
- `dashboard-theme.css`
- `odyssey-captains-log.css`
- `odyssey-captains-log.jsx`
- `odyssey-data.js`
- `odyssey.jsx`
- `reg-flows.jsx`
- `registration.jsx`
- `screens.jsx`
- `scribe-data.js`
- `scribe-writer.js`
- `session.js`
- `shipmate-scribe.jsx`
- `tafiya-reader.css`
- `tafiya-reader.jsx`

## New root files — must exist live (3)
- `access.js`
- `trial-guard.js`
- `reading-library.js`
`Haaraya Home.html` loads `access.js`, `trial-guard.js` and `reading-library.js`.
If any 404s the console throws and the app half-boots. After the Pages build is green, check each returns 200:
`https://haaraya.github.io/haaraya-education/access.js` (and the other two).
Do NOT add a bare `access`, `trial`, `reading` or `supabase` entry to `_config.yml` exclude — a bare entry also matches root files with that prefix.

## New SQL — record only, all already run against the live DB (18)
- `supabase/auth_repair.sql`
- `supabase/demo_readonly.sql`
- `supabase/diagnose_check_mapping.sql`
- `supabase/display_text_import_v1_3.sql`
- `supabase/export_back_covers.sql`
- `supabase/fix_books_select_and_progress.sql`
- `supabase/fix_check_mapping.sql`
- `supabase/fix_femi_and_the_wind.sql`
- `supabase/fix_quiz_grants.sql`
- `supabase/odyssey_schema.sql`
- `supabase/platform_write_policies.sql`
- `supabase/quiz_schema.sql`
- `supabase/quiz_schema_flat.sql`
- `supabase/reading_library.sql`
- `supabase/reconcile_books_vs_checks.sql`
- `supabase/scholarship.sql`
- `supabase/trial_expiry.sql`
- `supabase/trial_guard.sql`

## What these files change
- **Reader — mobile.** `tafiya-reader.css`/`.jsx`: topbar reflows to two rows with a scrolling pill strip, no sideways overflow at 360–430px, phone-in-landscape turns the story page into a side-by-side spread instead of a stamp, safe-area padding on the bottom bar.
- **Reader — editorial line breaks.** Story pages render `book_pages.display_text` (falls back to `page_text`), verbatim, left-aligned, text block measured to the illustration's edges; auto-fit no longer shrinks short passages.
- **Access / trial / library.** `access.js` (entitlement state + gate messaging), `trial-guard.js`, `reading-library.js` (the child's saved shelf) plus the reader/library gate that consumes them.
- **Odyssey + Scribe.** Captain's Log, `odyssey.jsx`/`odyssey-data.js`, `scribe-writer.js`/`scribe-data.js`, `shipmate-scribe.jsx`.
- **Registration / dashboards.** `reg-flows.jsx`, `registration.jsx`, `screens.jsx`, `session.js`, `dashboard-theme.css`, `avatar-v1.jsx`, `app.jsx`.

## Not for deployment (left out on purpose)
`offline-assets-*.js`, `offline-shim.js`, `Haaraya Home (Standalone*).html`, `*-print*.html`, `support.js`, `Canvas*.dc.html`, `library-catalog.json`, `tafiya-data.BACKUP-with-30-books.js`, the `audit/` and `push-*/` folders, and the stale `for-git/` mirror.
