-- ============================================================================
-- Haaraya — patch: fix 5 reading-check questions that listed a duplicate option
-- Safe to run directly in Supabase (SQL Editor). Idempotent — matches by book_code.
-- Run against the LIVE flat schema (reading_checks, from quiz_deploy.sql).
-- ============================================================================

-- S-01-01  "/s/"  — Q3 had options: pin · pin · sun  →  pin · log · sun
update reading_checks
   set q3_a = 'pin', q3_b = 'log', q3_c = 'sun', q3_correct = 2
 where book_code = 'S-01-01';

-- H-01-01  "A"  — Q3 had options: pin · pin · mat  →  pin · rug · mat
update reading_checks
   set q3_a = 'pin', q3_b = 'rug', q3_c = 'mat', q3_correct = 2
 where book_code = 'H-01-01';

-- S-01-04  "Pat! Tap!"  — Q3 had options: tap · pin · pin  →  tap · mat · log
update reading_checks
   set q3_a = 'tap', q3_b = 'mat', q3_c = 'log', q3_correct = 0
 where book_code = 'S-01-04';

-- S-01-05  "Sip"  — Q2 had options: sips · pin · pin  →  sips · mat · log
--                   Q3 had options: pin · sips · pin  →  tap · sips · log
update reading_checks
   set q2_a = 'sips', q2_b = 'mat', q2_c = 'log', q2_correct = 0,
       q3_a = 'tap',  q3_b = 'sips', q3_c = 'log', q3_correct = 1
 where book_code = 'S-01-05';

-- ---- verify (should return the 4 patched rows, no duplicate options) --------
select book_code, book_title,
       q2_a, q2_b, q2_c, q2_correct,
       q3_a, q3_b, q3_c, q3_correct
  from reading_checks
 where book_code in ('S-01-01','H-01-01','S-01-04','S-01-05')
 order by book_code;
