-- ============================================================================
-- Haaraya — DIAGNOSE the reading-check ↔ book mismatch, and preview a by-title
-- re-key. 100% READ-ONLY (SELECTs only). Nothing is changed. Review the output
-- before running the separate fix script.
--
-- Theory: each reading_check was authored FOR a specific book (its book_title).
-- The live books table holds the current code for that title. So the correct
-- mapping is: books.book_code  →  reading_checks (matched by title).
-- ============================================================================

-- A) How many books currently serve a MISMATCHED quiz -----------------------
select count(*) as mismatched_books
  from books b
  join reading_check_codes rcc on rcc.code = b.book_code
  join reading_checks      rc  on rc.id    = rcc.check_id
 where btrim(lower(b.title)) <> btrim(lower(rc.book_title));

-- B) BLOCKER CHECK 1 — checks whose title matches NO book -------------------
--    These cannot be auto-re-keyed by title (title changed, or book removed).
select rc.book_code as seed_code, rc.book_title
  from reading_checks rc
 where not exists (
         select 1 from books b
          where btrim(lower(b.title)) = btrim(lower(rc.book_title))
       )
 order by rc.book_title;

-- C) BLOCKER CHECK 2 — duplicate book titles (ambiguous target) -------------
--    If a title appears on >1 book, a by-title re-key is ambiguous for it.
select btrim(lower(title)) as norm_title, count(*) as n,
       string_agg(book_code, ', ' order by book_code) as codes
  from books
 group by btrim(lower(title))
having count(*) > 1
 order by n desc;

-- D) BLOCKER CHECK 3 — duplicate quiz titles --------------------------------
select btrim(lower(book_title)) as norm_title, count(*) as n,
       string_agg(book_code, ', ' order by book_code) as seed_codes
  from reading_checks
 group by btrim(lower(book_title))
having count(*) > 1
 order by n desc;

-- E) PREVIEW the corrected mapping ------------------------------------------
--    For every book, the check it SHOULD point to (by title) and whether that
--    link already exists. Rows where already_correct = false are what the fix
--    will add/repoint.
select b.book_code,
       b.title                                   as book_title,
       rc.book_code                              as seed_code_of_correct_check,
       exists(
         select 1 from reading_check_codes x
          where x.code = b.book_code and x.check_id = rc.id
       )                                          as already_correct
  from books b
  join reading_checks rc
    on btrim(lower(rc.book_title)) = btrim(lower(b.title))
 order by b.book_code;
