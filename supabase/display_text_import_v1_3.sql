-- ============================================================================
-- Haaraya — display_text import (manuscript v1.3)  ** SUPERSEDES v1.2 **
-- Source: uploads/HAARAYA_ALL_LEVELS_MASTER_v1_3_DISPLAY_TEXT.csv
--
-- WHY THIS EXISTS
--   The database currently holds the v1.2 display_text. v1.3 keeps the same
--   8,097 rows and byte-identical page_text, but REVISES display_text on 2,017
--   rows — almost all of them removing breaks that v1.2 applied too eagerly
--   (v1.2: "Pat.\nPat."  →  v1.3: "Pat. Pat."). Break-carrying rows drop from
--   2,732 to 1,399. Re-running this is what brings the reader in line with the
--   approved editorial pass.
--
-- GUARANTEES
--   • page_text is never written. (v1.3 page_text == v1.2 page_text on every
--     row — verified by diff — so the TF-03-01 correction already applied in
--     the v1.2 run stands. STEP 5 re-asserts it and is a no-op.)
--   • Matched on book_code + page_number. No inserts, no deletes, no changes
--     to page order, image paths, audio, progress or book relationships.
--   • Idempotent: re-running settles to the same state and reports 0 changes.
--
-- Run the steps in order in the Supabase SQL editor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1 — column (already present from the v1.2 run; no-op then)
-- ---------------------------------------------------------------------------
alter table public.book_pages add column if not exists display_text text;

comment on column public.book_pages.display_text is
  'Reader-formatted manuscript: identical wording to page_text, with editorial line breaks. Rendered verbatim (white-space: pre-line). NULL = fall back to page_text.';

-- ---------------------------------------------------------------------------
-- STEP 2 — staging table (columns mirror the CSV header exactly, all text)
-- ---------------------------------------------------------------------------
drop table if exists public.page_master_import;
create table public.page_master_import (
  book_code text, book_title text, strand text, level text, level_seq text,
  programme_seq text, week text, band text, "position" text, page_num text,
  is_cover text, image_id text, file_name text, page_text text, display_text text,
  story_words text, scene_description text, character_lock_ids text, status text
);

-- ---------------------------------------------------------------------------
-- STEP 3 — load the CSV into public.page_master_import
--   Dashboard:  Table editor → page_master_import → Import data from CSV.
--   Or psql:    \copy public.page_master_import from
--               'HAARAYA_ALL_LEVELS_MASTER_v1_3_DISPLAY_TEXT.csv'
--               with (format csv, header true);
--   Both preserve the newlines inside quoted display_text fields — do not
--   pre-process, trim or normalise the file.
--
-- Sanity check after loading. EXPECT EXACTLY:
--   rows = 8097,  rows_with_breaks = 1399
-- If rows_with_breaks comes back near 2732 you have loaded v1.2 — stop.
--
--   select count(*) as rows,
--          count(*) filter (where display_text like E'%\n%') as rows_with_breaks
--   from public.page_master_import;
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- STEP 4 — PRE-FLIGHT. Read this before running STEP 5. Nothing is written.
-- ---------------------------------------------------------------------------
-- 4a. Match coverage. Expect matched = 8097, unmatched_csv = 0.
select
  count(*)                                               as csv_rows,
  count(p.id)                                            as matched,
  count(*) filter (where p.id is null)                   as unmatched_csv
from public.page_master_import i
left join public.books b on b.book_code = i.book_code
left join public.book_pages p on p.book_id = b.id and p.page_number = i.page_num::int;

-- 4b. Which CSV rows fail to match, if 4a shows any. Surface, never ignore.
select i.book_code, i.page_num, i.image_id
from public.page_master_import i
left join public.books b on b.book_code = i.book_code
left join public.book_pages p on p.book_id = b.id and p.page_number = i.page_num::int
where p.id is null
order by i.book_code, i.page_num::int;

-- 4c. Live pages the CSV does not cover (expect 0; any row here keeps whatever
--     display_text it already has — it is not cleared).
select b.book_code, p.page_number
from public.book_pages p
join public.books b on b.id = p.book_id
left join public.page_master_import i
       on i.book_code = b.book_code and i.page_num::int = p.page_number
where i.book_code is null
order by b.book_code, p.page_number;

-- 4d. How many rows STEP 5 will actually change. Expect ~2017 on the first
--     v1.3 run, then 0 on any re-run.
select count(*) as rows_to_update
from public.book_pages p
join public.books b on b.id = p.book_id
join public.page_master_import i
     on i.book_code = b.book_code and i.page_num::int = p.page_number
where coalesce(p.display_text, '') <> coalesce(nullif(i.display_text, ''), '');

-- 4e. Proof page_text is untouched by this import: CSV page_text vs live
--     page_text. Expect 0 rows (v1.3 carries the corrected TF-03-01 already).
select b.book_code, p.page_number
from public.book_pages p
join public.books b on b.id = p.book_id
join public.page_master_import i
     on i.book_code = b.book_code and i.page_num::int = p.page_number
where coalesce(p.page_text, '') <> coalesce(i.page_text, '')
order by b.book_code, p.page_number;

-- ---------------------------------------------------------------------------
-- STEP 5 — write display_text onto the live pages.
-- display_text ONLY. page_text does not appear on the left of the SET.
-- ---------------------------------------------------------------------------
update public.book_pages p
set    display_text = nullif(i.display_text, '')
from   public.page_master_import i
join   public.books b on b.book_code = i.book_code
where  p.book_id = b.id
  and  p.page_number = i.page_num::int
  and  coalesce(p.display_text, '') <> coalesce(nullif(i.display_text, ''), '');

-- ---------------------------------------------------------------------------
-- STEP 6 — VERIFY. Run all of these; each states its expected result.
-- ---------------------------------------------------------------------------
-- 6a. Population. Expect interior_with_display_text = 7628,
--     rows_with_breaks = 1399.
select
  count(*) filter (where coalesce(p.is_cover, false) = false)                          as interior_pages,
  count(*) filter (where coalesce(p.is_cover, false) = false and p.display_text is not null) as interior_with_display_text,
  count(*) filter (where p.display_text like E'%\n%')                                  as rows_with_breaks
from public.book_pages p;

-- 6b. TEST CASE 1 — H-05-07 p2 must carry the editorial break.
--     Expect display_text = 'Today a teacher came.' || chr(10) || '"I''m Ms Eze," she said.'
select p.page_number, p.page_text, p.display_text,
       p.display_text like E'%\n%' as has_break
from public.book_pages p join public.books b on b.id = p.book_id
where b.book_code = 'H-05-07' and p.page_number = 2;

-- 6c. TEST CASE 2 — S-05-10 p5 must have NO break (one flowing line).
--     Expect has_break = false and display_text = page_text.
select p.page_number, p.display_text,
       p.display_text like E'%\n%'                as has_break,
       p.display_text = p.page_text               as identical_to_page_text
from public.book_pages p join public.books b on b.id = p.book_id
where b.book_code = 'S-05-10' and p.page_number = 5;

-- 6d. The v1.2 over-break regression, now corrected. Expect has_break = false
--     on every row (v1.2 left these as "Pat.\nPat.").
select p.page_number, p.display_text, p.display_text like E'%\n%' as has_break
from public.book_pages p join public.books b on b.id = p.book_id
where b.book_code = 'S-01-04' and p.page_number between 3 and 8
order by p.page_number;

-- 6e. TEST CASE 5 — multi-break (dialogue/poetry) rows survive intact.
--     Expect 3 breaks on S-05-04 p4.
select b.book_code, p.page_number, p.display_text,
       length(p.display_text) - length(replace(p.display_text, E'\n', '')) as breaks
from public.book_pages p join public.books b on b.id = p.book_id
where (b.book_code, p.page_number) in (('S-05-04', 4), ('S-05-06', 10), ('S-05-14', 6))
order by b.book_code, p.page_number;

-- 6f. TEST CASE 7 — TF-03-01 uses Naza, never Itohan.
--     Expect itohan_rows = 0 and naza_rows = 5.
select
  count(*) filter (where p.page_text ilike '%itohan%' or p.display_text ilike '%itohan%') as itohan_rows,
  count(*) filter (where p.page_text ilike '%naza%'   or p.display_text ilike '%naza%')   as naza_rows
from public.book_pages p join public.books b on b.id = p.book_id
where b.book_code = 'TF-03-01';

-- 6g. Scope check — Itohan elsewhere is untouched and still present.
select b.book_code, count(*) as itohan_pages
from public.book_pages p join public.books b on b.id = p.book_id
where p.page_text ilike '%itohan%'
group by b.book_code
order by b.book_code;

-- 6h. Wording integrity — display_text must never differ from page_text by
--     anything other than whitespace. Expect 0 rows.
select b.book_code, p.page_number
from public.book_pages p join public.books b on b.id = p.book_id
where p.display_text is not null
  and regexp_replace(p.display_text, '\s+', ' ', 'g') <> regexp_replace(p.page_text, '\s+', ' ', 'g')
order by b.book_code, p.page_number;

-- ---------------------------------------------------------------------------
-- STEP 7 — tidy up (optional; keep the staging table if you want to re-verify)
-- ---------------------------------------------------------------------------
-- drop table if exists public.page_master_import;
