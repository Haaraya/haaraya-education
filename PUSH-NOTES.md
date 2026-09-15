# Push — display_text reader formatting (2026-09-14)

## Changed files (2 required)
- `tafiya-reader.jsx` — TfrPage renders `display_text || page_text`; the
  "centre a single line" case is now limited to <=24 chars with no newline.
- `tafiya-reader.css` — `.story-text`: `white-space: pre-line`, left aligned
  (was justify + text-align-last: center + hyphens: auto).

Also in `tafiya-reader.jsx` (same file, two related fixes):
- Auto-fit: 3px of slack on the overflow test + bail out when a shrink step
  stops buying height. Fixes short passages being shrunk to the 60% floor by a
  subpixel rounding artefact (e.g. H-05-07 p6 rendered at 12px, now 20px).
- Text block is measured to the rendered illustration's left edge and width, so
  the first character lines up with the picture instead of the page margin.

## Optional
- `supabase/display_text_import.sql` — record of the migration/import already
  run against the live DB (adds `book_pages.display_text`, imports from
  HAARAYA_ALL_LEVELS_MASTER_v1_2_DISPLAY_TEXT.csv, corrects TF-03-01). Does not
  affect the live site.

## Already done in Supabase — no further DB work
7,628 interior pages carry display_text (2,732 with editorial breaks).
`get_book_package` already returns the column, so no RPC change is needed.

## After pushing
1. Actions -> "pages build and deployment" must be green.
2. Hard-refresh, open H-05-07 page 2: it must read
   "Today a teacher came." / "I'm Ms Eze," she said." on two lines.
3. No new root-level JS/CSS files were added, so no `_config.yml` change.
