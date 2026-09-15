-- ============================================================================
-- Haaraya — display_text import (manuscript v1.2)
-- Source: uploads/HAARAYA_ALL_LEVELS_MASTER_v1_2_DISPLAY_TEXT.csv
--
-- display_text = the SAME manuscript wording as page_text, with the editorial
-- line breaks applied. page_text is NEVER overwritten by this script, with the
-- single scoped exception of TF-03-01 (STEP 5), where the CSV carries the
-- corrected manuscript (Naza, not Itohan) and is authoritative.
--
-- Safe to re-run: every step is idempotent. Nothing here touches book codes,
-- page numbers, image paths, audio, reading progress or book relationships.
-- Run the steps in order in the Supabase SQL editor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- STEP 1 — add the column (nullable, no default)
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
--               'HAARAYA_ALL_LEVELS_MASTER_v1_2_DISPLAY_TEXT.csv'
--               with (format csv, header true);
--   Both preserve the newlines inside quoted display_text fields — do not
--   pre-process, trim or normalise the file.
-- Sanity check after loading (expect ~12k rows, and a non-zero break count):
--   select count(*) as rows,
--          count(*) filter (where display_text like E'%\n%') as rows_with_breaks
--   from public.page_master_import;
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- STEP 4 — write display_text onto the live pages, matched on
-- book_code + page_number (the project's canonical page key; image_id in the
-- CSV is book_code || '_' || band, which maps to the same pair).
-- ---------------------------------------------------------------------------
update public.book_pages p
set    display_text = nullif(i.display_text, '')
from   public.page_master_import i
join   public.books b on b.book_code = i.book_code
where  p.book_id = b.id
  and  p.page_number = i.page_num::int
  and  coalesce(p.display_text, '') <> coalesce(nullif(i.display_text, ''), '');

-- ---------------------------------------------------------------------------
-- STEP 5 — TF-03-01 only: the CSV is authoritative for the corrected
-- manuscript (Naza replaces Itohan). Scoped to this one book code.
-- ---------------------------------------------------------------------------
update public.book_pages p
set    page_text = i.page_text,
       display_text = nullif(i.display_text, '')
from   public.page_master_import i
join   public.books b on b.book_code = i.book_code
where  b.book_code = 'TF-03-01'
  and  p.book_id = b.id
  and  p.page_number = i.page_num::int
  and  coalesce(p.page_text, '') <> coalesce(i.page_text, '');

update public.books b
set    title = i.book_title
from  (select distinct book_code, book_title from public.page_master_import
       where book_code = 'TF-03-01') i
where  b.book_code = i.book_code
  and  coalesce(b.title, '') <> coalesce(i.book_title, '');

-- ---------------------------------------------------------------------------
-- STEP 6 — verification
-- ---------------------------------------------------------------------------
-- Confirmed on 2026-09-14: 8,097 CSV rows / 469 books imported; 7,628 interior
-- pages updated (all of them), 2,732 carrying editorial breaks; the 469 unmatched
-- CSV rows are the front covers (page_num 0), which live on books, not book_pages.
-- 6a. how many pages now carry display_text, and how many carry real breaks
select count(*)                                            as pages_total,
       count(display_text)                                 as pages_with_display_text,
       count(*) filter (where display_text like E'%\n%')    as pages_with_editorial_breaks,
       count(*) filter (where display_text is null)         as pages_falling_back_to_page_text
from   public.book_pages;

-- 6b. test case: H-05-07 page 2 — one line of page_text, two display lines
select p.page_number, p.page_text, p.display_text
from   public.book_pages p join public.books b on b.id = p.book_id
where  b.book_code = 'H-05-07' and p.page_number = 2;

-- 6c. test case: TF-03-01 must read Naza, never Itohan
select p.page_number, p.page_text
from   public.book_pages p join public.books b on b.id = p.book_id
where  b.book_code = 'TF-03-01' and p.page_text ilike '%itohan%';   -- expect 0 rows

-- 6d. wording must be identical apart from whitespace (expect 0 rows)
select b.book_code, p.page_number
from   public.book_pages p join public.books b on b.id = p.book_id
where  p.display_text is not null
  and  regexp_replace(p.display_text, '\s+', ' ', 'g') is distinct from
       regexp_replace(coalesce(p.page_text, ''), '\s+', ' ', 'g')
limit  50;

-- 6e. does get_book_package already expose the new column to the reader?
--     (The RPC returns whole page rows, so it normally does.)
select (get_book_package(input_book_code => 'H-05-07')::jsonb -> 'pages' -> 2) ? 'display_text'
       as rpc_exposes_display_text;

-- If 6e returns false, the RPC builds its pages array from an explicit column
-- list and needs display_text added to it. Inspect it with:
--   select pg_get_functiondef('public.get_book_package(text)'::regprocedure);

-- ---------------------------------------------------------------------------
-- STEP 7 — optional cleanup once verified
-- ---------------------------------------------------------------------------
-- drop table if exists public.page_master_import;
