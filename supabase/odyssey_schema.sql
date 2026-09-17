-- ============================================================================
-- Haaraya — 100 Book Odyssey schema  (Postgres / Supabase)
-- ============================================================================
--  Adds the Odyssey to the database:
--    • odyssey_stages         — the 6 stages + their medals (reference data)
--    • odyssey_books          — the 100-book catalogue (reference data)
--    • odyssey_book_progress  — ONE row per (user, book): reading / complete
--
--  Progress is per signed-in user (auth.uid()). A child dimension is left
--  open via child_id (nullable) for when child sub-profiles are wired up.
--
--  Reference tables are world-readable; progress is private to its owner,
--  enforced by Row-Level Security. Requires Supabase Auth (auth.users).
--
--  Safe to re-run: uses IF NOT EXISTS / on conflict do update / OR REPLACE.
-- ============================================================================

-- ---- enums -----------------------------------------------------------------
do $$ begin
  create type odyssey_book_status as enum ('reading', 'complete');
exception when duplicate_object then null; end $$;

-- ---- 6 stages (reference) --------------------------------------------------
create table if not exists odyssey_stages (
  stage_no     int  primary key check (stage_no between 1 and 6),
  name         text not null,
  medal_code   text not null unique,
  medal_label  text not null,
  medal_file   text not null,            -- asset filename (assets/<file>)
  book_start   int  not null,
  book_end     int  not null,
  check (book_end >= book_start)
);

-- ---- 100 books (reference) -------------------------------------------------
create table if not exists odyssey_books (
  book_no    int  primary key check (book_no between 1 and 100),
  code       text not null unique,       -- catalogue code, e.g. 'KN-13-010'
  title      text not null,
  stream     text,                        -- Knowledge / Classics / Estate Fiction
  stage_no   int  not null references odyssey_stages(stage_no),
  is_capstone boolean not null default false   -- book 100, "The Odyssey"
);
create index if not exists odyssey_books_stage_idx on odyssey_books (stage_no);

-- ---- per-user progress -----------------------------------------------------
-- One row per book a user has started or finished. No row = not yet begun.
create table if not exists odyssey_book_progress (
  user_id      uuid not null references auth.users(id) on delete cascade,
  book_no      int  not null references odyssey_books(book_no),
  child_id     uuid,                       -- optional: which child profile
  status       odyssey_book_status not null default 'reading',
  started_at   timestamptz not null default now(),
  completed_at timestamptz,
  updated_at   timestamptz not null default now(),
  primary key (user_id, book_no)
);
create index if not exists odyssey_progress_user_idx on odyssey_book_progress (user_id);

-- keep completed_at + updated_at honest
create or replace function odyssey_touch_progress() returns trigger as $$
begin
  new.updated_at = now();
  if new.status = 'complete' and new.completed_at is null then
    new.completed_at = now();
  elsif new.status <> 'complete' then
    new.completed_at = null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists odyssey_progress_touch on odyssey_book_progress;
create trigger odyssey_progress_touch
  before insert or update on odyssey_book_progress
  for each row execute function odyssey_touch_progress();

-- ---- convenience: a signed-in user's own progress summary ------------------
-- Returns one row: how many books done, and the "current" book (the lowest
-- book still in progress, else the next unread, capped at 100).
create or replace function odyssey_my_summary()
returns table (completed_books int, current_book int, medals_unlocked int)
language sql stable security invoker as $$
  with mine as (
    select book_no, status from odyssey_book_progress where user_id = auth.uid()
  ),
  done as (select count(*)::int c from mine where status = 'complete'),
  reading as (select min(book_no) b from mine where status = 'reading')
  select
    (select c from done) as completed_books,
    coalesce(
      (select b from reading),
      least((select c from done) + 1, 100)
    ) as current_book,
    (select count(*)::int from odyssey_stages s
       where (select c from done) >= s.book_end) as medals_unlocked;
$$;

-- ---- Row-Level Security ----------------------------------------------------
alter table odyssey_stages         enable row level security;
alter table odyssey_books          enable row level security;
alter table odyssey_book_progress  enable row level security;

-- Reference data: readable by everyone (anon + authenticated).
drop policy if exists odyssey_stages_read on odyssey_stages;
create policy odyssey_stages_read on odyssey_stages for select using (true);
drop policy if exists odyssey_books_read on odyssey_books;
create policy odyssey_books_read on odyssey_books for select using (true);

-- Progress: each user sees and writes ONLY their own rows.
drop policy if exists odyssey_progress_select_own on odyssey_book_progress;
create policy odyssey_progress_select_own on odyssey_book_progress
  for select using (user_id = auth.uid());
drop policy if exists odyssey_progress_insert_own on odyssey_book_progress;
create policy odyssey_progress_insert_own on odyssey_book_progress
  for insert with check (user_id = auth.uid());
drop policy if exists odyssey_progress_update_own on odyssey_book_progress;
create policy odyssey_progress_update_own on odyssey_book_progress
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists odyssey_progress_delete_own on odyssey_book_progress;
create policy odyssey_progress_delete_own on odyssey_book_progress
  for delete using (user_id = auth.uid());

-- ============================================================================
-- SEED — reference data (idempotent)
-- ============================================================================

insert into odyssey_stages (stage_no, name, medal_code, medal_label, medal_file, book_start, book_end) values
  (1, 'Wonder Stage', 'nsude_wonder', 'Nsude Wonder', 'odyssey_nsude_wonder.png', 1, 15),
  (2, 'Explorer Stage', 'ocean_explorer', 'Ocean Explorer', 'odyssey_ocean_explorer.png', 16, 30),
  (3, 'Story Stage', 'story_spell', 'Story Spell', 'odyssey_story_spell.png', 31, 45),
  (4, 'Quest Stage', 'code_quest', 'Code Quest', 'odyssey_code_quest.png', 46, 60),
  (5, 'Spark Stage', 'power_spark', 'Power Spark', 'odyssey_power_spark.png', 61, 80),
  (6, 'Legend Stage', 'legend', 'Odyssey Legend', 'odyssey_legend.png', 81, 100)
on conflict (stage_no) do update set
  name = excluded.name, medal_code = excluded.medal_code, medal_label = excluded.medal_label,
  medal_file = excluded.medal_file, book_start = excluded.book_start, book_end = excluded.book_end;

insert into odyssey_books (book_no, code, title, stream, stage_no, is_capstone) values
  (1, 'KN-13-010', 'The Nsude Pyramids', 'Knowledge', 1, false),
  (2, 'KN-13-020', 'The Pyramids of Egypt', 'Knowledge', 1, false),
  (3, 'KN-13-030', 'The Great Wall of Benin', 'Knowledge', 1, false),
  (4, 'KN-13-040', 'The Great Wall of China', 'Knowledge', 1, false),
  (5, 'KN-13-050', 'Wild Animals of Nigeria', 'Knowledge', 1, false),
  (6, 'KN-13-060', 'The Nigerian Rainforest', 'Knowledge', 1, false),
  (7, 'KN-13-070', 'Snakes', 'Knowledge', 1, false),
  (8, 'KN-13-080', 'The Sahara Desert', 'Knowledge', 1, false),
  (9, 'KN-13-090', 'The Amazon Rainforest', 'Knowledge', 1, false),
  (10, 'KN-13-100', 'Oceans of the World', 'Knowledge', 1, false),
  (11, 'KN-13-110', 'Big Cats', 'Knowledge', 1, false),
  (12, 'KN-13-120', 'Sharks', 'Knowledge', 1, false),
  (13, 'KN-13-130', 'The Solar System', 'Knowledge', 1, false),
  (14, 'KN-13-140', 'The Moon', 'Knowledge', 1, false),
  (15, 'KN-13-150', 'Volcanoes', 'Knowledge', 1, false),
  (16, 'KN-13-160', 'Your Amazing Heart', 'Knowledge', 2, false),
  (17, 'KN-13-170', 'Bones and Muscles', 'Knowledge', 2, false),
  (18, 'KN-13-180', 'How Planes Fly', 'Knowledge', 2, false),
  (19, 'CL-13-010', 'Aesop''s Fables', 'Classics', 2, false),
  (20, 'CL-13-020', 'Tales from the Panchatantra', 'Classics', 2, false),
  (21, 'CL-13-030', 'Tales from the Arabian Nights', 'Classics', 2, false),
  (22, 'CL-13-040', 'Greek Myths', 'Classics', 2, false),
  (23, 'CL-13-050', 'Norse Myths', 'Classics', 2, false),
  (24, 'CL-13-060', 'Grimm''s Fairy Tales', 'Classics', 2, false),
  (25, 'CL-13-070', 'Hans Andersen''s Tales', 'Classics', 2, false),
  (26, 'CL-13-080', 'Kipling''s Just So Stories', 'Classics', 2, false),
  (27, 'CL-13-090', 'Tales of Robin Hood', 'Classics', 2, false),
  (28, 'CL-13-100', 'Tales of King Arthur', 'Classics', 2, false),
  (29, 'ST-13-010', 'The Voice on the Lost Phone', 'Estate Fiction', 2, false),
  (30, 'ST-13-020', 'The New Girl Who Said Nothing', 'Estate Fiction', 2, false),
  (31, 'ST-13-030', 'Save the Old Hut', 'Estate Fiction', 3, false),
  (32, 'ST-13-040', 'The Wall Painter', 'Estate Fiction', 3, false),
  (33, 'ST-13-050', 'The Locked Room', 'Estate Fiction', 3, false),
  (34, 'ST-13-060', 'The Long Walk Home', 'Estate Fiction', 3, false),
  (35, 'KN-14-010', 'Empires of the World', 'Knowledge', 3, false),
  (36, 'KN-14-020', 'Gods of the World', 'Knowledge', 3, false),
  (37, 'KN-14-030', 'Ancient Greece', 'Knowledge', 3, false),
  (38, 'KN-14-040', 'Ancient Rome', 'Knowledge', 3, false),
  (39, 'KN-14-050', 'The Brain and the Senses', 'Knowledge', 3, false),
  (40, 'CL-14-010', 'Five Holmes Cases', 'Classics', 3, false),
  (41, 'CL-14-020', 'The Jungle Book', 'Classics', 3, false),
  (42, 'CL-14-030', 'Three Shakespeare Stories', 'Classics', 3, false),
  (43, 'CL-14-040', 'The Iliad: Selected Episodes', 'Classics', 3, false),
  (44, 'CL-14-060', 'Gulliver''s Travels', 'Classics', 3, false),
  (45, 'CL-14-100', 'Sundiata: the Full Epic', 'Classics', 3, false),
  (46, 'CL-14-070', 'Alice''s Adventures in Wonderland', 'Classics', 4, false),
  (47, 'CL-14-080', 'The Wizard of Oz', 'Classics', 4, false),
  (48, 'CL-14-090', 'Pinocchio', 'Classics', 4, false),
  (49, 'ST-14-010', 'The Estate Newspaper', 'Estate Fiction', 4, false),
  (50, 'ST-14-020', 'The Coding Club', 'Estate Fiction', 4, false),
  (51, 'ST-14-030', 'The Talent Show', 'Estate Fiction', 4, false),
  (52, 'ST-14-040', 'The Student Council Election', 'Estate Fiction', 4, false),
  (53, 'ST-14-050', 'The Old Photograph', 'Estate Fiction', 4, false),
  (54, 'KN-14-060', 'Lungs and Breathing', 'Knowledge', 4, false),
  (55, 'KN-14-070', 'Food and Digestion', 'Knowledge', 4, false),
  (56, 'KN-14-080', 'Stars and Galaxies', 'Knowledge', 4, false),
  (57, 'KN-14-090', 'The Sun', 'Knowledge', 4, false),
  (58, 'KN-14-100', 'Earthquakes', 'Knowledge', 4, false),
  (59, 'KN-14-110', 'Weather and Climate', 'Knowledge', 4, false),
  (60, 'KN-14-120', 'Whales and Dolphins', 'Knowledge', 4, false),
  (61, 'KN-14-130', 'Birds of the World', 'Knowledge', 5, false),
  (62, 'KN-14-140', 'Insects', 'Knowledge', 5, false),
  (63, 'KN-14-150', 'Reptiles', 'Knowledge', 5, false),
  (64, 'KN-14-160', 'The Frozen Poles', 'Knowledge', 5, false),
  (65, 'KN-14-170', 'The Niger and the Benue', 'Knowledge', 5, false),
  (66, 'KN-14-180', 'How Computers Work', 'Knowledge', 5, false),
  (67, 'KN-15-01', 'The Scramble for Africa', 'Knowledge', 5, false),
  (68, 'KN-15-02', 'African Independence', 'Knowledge', 5, false),
  (69, 'KN-15-03', 'The Story of Writing', 'Knowledge', 5, false),
  (70, 'KN-15-04', 'Great Explorers', 'Knowledge', 5, false),
  (71, 'KN-15-05', 'The Universe', 'Knowledge', 5, false),
  (72, 'KN-15-06', 'Light and Colour', 'Knowledge', 5, false),
  (73, 'KN-15-07', 'Sound', 'Knowledge', 5, false),
  (74, 'KN-15-08', 'Electricity', 'Knowledge', 5, false),
  (75, 'KN-15-09', 'Energy', 'Knowledge', 5, false),
  (76, 'KN-15-10', 'Forces and Machines', 'Knowledge', 5, false),
  (77, 'KN-15-11', 'The Age of Dinosaurs', 'Knowledge', 5, false),
  (78, 'KN-15-12', 'Tiny Life', 'Knowledge', 5, false),
  (79, 'KN-15-13', 'The Seven Continents', 'Knowledge', 5, false),
  (80, 'KN-15-14', 'The Story of the Earth', 'Knowledge', 5, false),
  (81, 'KN-15-15', 'Inventions That Changed the World', 'Knowledge', 6, false),
  (82, 'KN-15-16', 'The Story of Medicine', 'Knowledge', 6, false),
  (83, 'KN-15-17', 'How the Internet Works', 'Knowledge', 6, false),
  (84, 'KN-15-18', 'Climate and Our Planet', 'Knowledge', 6, false),
  (85, 'CL-15-01', 'Treasure Island', 'Classics', 6, false),
  (86, 'CL-15-02', 'Robinson Crusoe', 'Classics', 6, false),
  (87, 'CL-15-03', 'Great Expectations', 'Classics', 6, false),
  (88, 'CL-15-04', 'The Hound of the Baskervilles', 'Classics', 6, false),
  (89, 'CL-15-05', 'Three Shakespeare Tragedies', 'Classics', 6, false),
  (90, 'CL-15-06', 'Oliver Twist', 'Classics', 6, false),
  (91, 'CL-15-07', 'A Christmas Carol', 'Classics', 6, false),
  (92, 'CL-15-08', 'The Adventures of Tom Sawyer', 'Classics', 6, false),
  (93, 'CL-15-09', 'Black Beauty', 'Classics', 6, false),
  (94, 'CL-15-10', 'Around the World in Eighty Days', 'Classics', 6, false),
  (95, 'ST-15-01', 'The Secret of the Old House', 'Estate Fiction', 6, false),
  (96, 'ST-15-02', 'The Inventor', 'Estate Fiction', 6, false),
  (97, 'ST-15-03', 'The Visitor from Abroad', 'Estate Fiction', 6, false),
  (98, 'ST-15-04', 'The Summer of the Storm', 'Estate Fiction', 6, false),
  (99, 'ST-15-05', 'The Long Vacation', 'Estate Fiction', 6, false),
  (100, 'CL-15-11', 'The Odyssey', 'Classics', 6, true)
on conflict (book_no) do update set
  code = excluded.code, title = excluded.title, stream = excluded.stream,
  stage_no = excluded.stage_no, is_capstone = excluded.is_capstone;

-- ============================================================================
-- OPTIONAL demo seed — mark books 1–22 complete, book 23 in progress, for the
-- currently signed-in user. Run manually while signed in if you want the
-- screens to show the sample state against the live DB.
-- ----------------------------------------------------------------------------
--  insert into odyssey_book_progress (user_id, book_no, status)
--  select auth.uid(), g, case when g <= 22 then 'complete'::odyssey_book_status
--                             else 'reading'::odyssey_book_status end
--  from generate_series(1, 23) g
--  on conflict (user_id, book_no) do update set status = excluded.status;
-- ============================================================================
