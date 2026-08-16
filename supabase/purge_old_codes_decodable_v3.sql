-- ============================================================================
-- Haaraya — Purge OLD (non-canonical) reading-check codes · DECODABLE v3.0
--   Run AFTER quiz_seed_decodable_v3.sql. Scoped to phonics (decodable) books
--   only — narrative/comprehension aliases are left untouched.
--   Keeps exactly the canonical book_code per book; deletes every other alias.
-- ============================================================================

-- 1) COUNT what would be removed (run this first, read the number):
select count(*) as old_codes_to_delete
from reading_check_codes c
join reading_checks rc on rc.id = c.check_id
where rc.kind = 'phonics'
  and c.code <> rc.book_code;

-- 2) PREVIEW them (optional):
-- select c.code, rc.book_code
-- from reading_check_codes c
-- join reading_checks rc on rc.id = c.check_id
-- where rc.kind = 'phonics' and c.code <> rc.book_code
-- order by rc.book_code, c.code;

-- 3) PURGE (uncomment to run):
-- delete from reading_check_codes c
-- using reading_checks rc
-- where c.check_id = rc.id
--   and rc.kind = 'phonics'
--   and c.code <> rc.book_code;

-- 4) VERIFY: every phonics book resolves by exactly ONE code = its book_code
-- select rc.book_code, count(*) as codes
-- from reading_checks rc
-- join reading_check_codes c on c.check_id = rc.id
-- where rc.kind = 'phonics'
-- group by rc.book_code
-- having count(*) <> 1;   -- expect 0 rows
