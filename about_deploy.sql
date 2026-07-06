-- ============================================================================
-- Haaraya — "About this book" front-matter tables · DEPLOY
-- Run this ONCE in the Supabase SQL editor (service role). Creates the two
-- tables the app reads at runtime via about-supabase.js, plus RLS
-- (public read, authenticated write). Flat shape = one row per book,
-- mirroring the authoring CSV so a re-import is a straight column load.
--
-- After this, load content with about_seed.sql (generated from the CSV).
-- ============================================================================

-- One "About this book" front-matter page per book.
create table if not exists about_pages (
  id                uuid primary key default gen_random_uuid(),
  book_code         text not null unique,       -- canonical code (the new book_code)
  title             text not null,
  strand            text,
  level             int  not null check (level between 1 and 13),
  about_text        text,                        -- "about_this_book"
  read_to_find_out  text,
  focus_visible     text,                        -- focus letter / word shown silently
  focus_sound       text,                        -- IPA
  soundbite         text,                        -- comma-separated example words
  sound_cue         text,                        -- spoken pronunciation
  sound_cue_check   boolean not null default false,  -- author flagged for review

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Every code that resolves to an about page: new · legacy · live DB. One row per code.
create table if not exists about_page_codes (
  code      text primary key,
  page_id   uuid not null references about_pages(id) on delete cascade
);
create index if not exists about_page_codes_page_id_idx on about_page_codes (page_id);

-- keep updated_at fresh (shared touch fn; guarded create for standalone runs)
create or replace function touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists about_pages_touch on about_pages;
create trigger about_pages_touch
  before update on about_pages
  for each row execute function touch_updated_at();

-- RLS: public read (the app uses the publishable key), authenticated write.
alter table about_pages       enable row level security;
alter table about_page_codes  enable row level security;

drop policy if exists read_about   on about_pages;
drop policy if exists read_acodes  on about_page_codes;
drop policy if exists write_about  on about_pages;
drop policy if exists write_acodes on about_page_codes;

create policy read_about   on about_pages       for select using (true);
create policy read_acodes  on about_page_codes  for select using (true);
create policy write_about  on about_pages       for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy write_acodes on about_page_codes  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Sanity after seeding:
--   select count(*) from about_pages;                                    -- 1 per book
--   select code from about_page_codes group by code having count(*) > 1; -- expect 0 rows
