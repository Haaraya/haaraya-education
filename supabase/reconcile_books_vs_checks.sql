-- ============================================================================
-- Haaraya — reconcile reading_checks (469) against the website book catalog
-- Run in Supabase SQL Editor. Read-only (SELECTs only) — safe to run anytime.
--
-- Matches the LIVE `books` table: (book_code, title, status, ...). There is no
-- is_active column — books carry a text `status` instead (see query 0 for the
-- values present). Linkage: books.book_code → reading_check_codes.code → reading_checks
-- ============================================================================

-- 0) Counts + the status values in use --------------------------------------
select
  (select count(*) from books)               as books_total,
  (select count(*) from reading_checks)       as reading_checks_total,
  (select count(*) from reading_check_codes)  as check_codes_total;

select status, count(*) as n
  from books
 group by status
 order by n desc;

-- 1) WEBSITE BOOKS WITH NO READING CHECK -------------------------------------
select b.book_code, b.title, b.status
  from books b
  left join reading_check_codes rcc on rcc.code = b.book_code
 where rcc.code is null
 order by b.book_code;

-- 2) TITLE MISMATCHES --------------------------------------------------------
select b.book_code,
       b.title       as website_title,
       rc.book_title as quiz_title,
       b.status
  from books b
  join reading_check_codes rcc on rcc.code = b.book_code
  join reading_checks      rc  on rc.id    = rcc.check_id
 where btrim(b.title) <> btrim(rc.book_title)
 order by b.book_code;

-- 3) ORPHAN READING CHECKS (quiz matches no book in the catalog) -------------
select rc.book_code, rc.book_title
  from reading_checks rc
 where not exists (
         select 1
           from reading_check_codes rcc
           join books b on b.book_code = rcc.code
          where rcc.check_id = rc.id
       )
 order by rc.book_code;

-- 4) CODE-FORMAT DRIFT (S-1-01 vs S-01-01 zero-padding) ----------------------
with norm as (
  select 'book'  as src, book_code as code,
         regexp_replace(book_code, '(^|-)0+([0-9])', '\1\2', 'g') as ncode
    from books
  union all
  select 'check' as src, code,
         regexp_replace(code, '(^|-)0+([0-9])', '\1\2', 'g')
    from reading_check_codes
)
select b.code as book_code, c.code as check_code, b.ncode as normalised
  from norm b
  join norm c on c.ncode = b.ncode and c.code <> b.code
 where b.src = 'book' and c.src = 'check'
 order by b.ncode;
