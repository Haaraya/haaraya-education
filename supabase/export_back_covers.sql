-- ============================================================================
-- Export a back-covers CSV from Supabase
-- Run in Supabase → SQL Editor, then click "Download CSV" on the result grid.
-- ============================================================================

-- STEP 1 — confirm the skills table/column names in your DB.
-- (The reader receives these as pkg.skills via the get_book_package RPC, so the
--  columns exist somewhere; this tells you where.)
select table_name, column_name, data_type
from information_schema.columns
where column_name in (
        'reading_strategy','comprehension_skill','phonological_awareness',
        'grammar_mechanics','word_work','text_structure',
        'fp_level','uk_book_band','about_text','website')
  and table_schema = 'public'
order by table_name, ordinal_position;


-- STEP 2 — the export. Adjust the table name in the JOIN if step 1 shows
-- something other than book_skills.
select
  b.book_code                                    as "Book code",
  b.title                                        as "Title",
  b.book_type                                    as "Book type",
  b.level                                        as "Haaraya level",
  s.fp_level                                     as "Fountas & Pinnell",
  s.uk_book_band                                 as "UK book band",
  s.reading_strategy                             as "Reading strategy",
  s.comprehension_skill                          as "Comprehension skill",
  s.phonological_awareness                       as "Phonological awareness",
  s.grammar_mechanics                            as "Grammar and mechanics",
  s.word_work                                    as "Word work",
  s.text_structure                               as "Text structure",
  s.about_text                                   as "About this book",
  coalesce(s.website, 'haarayaeducation.org')    as "Website"
from books b
left join book_skills s on s.book_code = b.book_code
order by b.level, b.book_code;


-- FALLBACK — if the skills live only inside the RPC's JSON output and not in a
-- flat table, this pulls them out of the package per book instead:
--
-- select
--   b.book_code,
--   b.title,
--   p.pkg -> 'skills' ->> 'reading_strategy'        as reading_strategy,
--   p.pkg -> 'skills' ->> 'comprehension_skill'     as comprehension_skill,
--   p.pkg -> 'skills' ->> 'phonological_awareness'  as phonological_awareness,
--   p.pkg -> 'skills' ->> 'grammar_mechanics'       as grammar_mechanics,
--   p.pkg -> 'skills' ->> 'word_work'               as word_work,
--   p.pkg -> 'skills' ->> 'text_structure'          as text_structure,
--   p.pkg -> 'skills' ->> 'fp_level'                as fp_level,
--   p.pkg -> 'skills' ->> 'uk_book_band'            as uk_book_band,
--   p.pkg -> 'skills' ->> 'about_text'              as about_text
-- from books b
-- cross join lateral (select get_book_package(b.book_code) as pkg) p
-- order by b.level, b.book_code;
