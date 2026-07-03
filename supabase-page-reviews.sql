-- ============================================================
--  Haaraya — Page Review (QA) table
--  Run this once in the Supabase SQL editor.
--  Stores one review verdict per book screen (front cover,
--  each story page, back cover): is the TEXT ok, is the IMAGE
--  ok, and a free-text note describing the edit required.
--
--  text_ok / image_ok semantics:
--     NULL  = not reviewed yet
--     true  = OK
--     false = NEEDS EDIT   ← the thing we care about
-- ============================================================

create table if not exists public.page_reviews (
  id           uuid primary key default gen_random_uuid(),
  book_code    text not null,
  screen_key   text not null,          -- 'cover' | 'back' | 'page-<n>'
  page_number  int,                    -- null for cover/back
  text_ok      boolean,                -- null = unreviewed, false = needs edit
  image_ok     boolean,                -- null = unreviewed, false = needs edit
  note         text default '',        -- the edit required
  reviewer     text,                   -- signed-in demo user's name
  updated_at   timestamptz not null default now(),
  -- one row per screen of a book; re-reviewing updates it in place
  unique (book_code, screen_key)
);

-- Fast lookups when a book is opened.
create index if not exists page_reviews_book_idx on public.page_reviews (book_code);
-- Quick filter for "everything still flagged as needing an edit".
create index if not exists page_reviews_needs_edit_idx
  on public.page_reviews (book_code)
  where text_ok is false or image_ok is false;

-- Keep updated_at fresh on every write.
create or replace function public.page_reviews_touch()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists page_reviews_touch on public.page_reviews;
create trigger page_reviews_touch
  before update on public.page_reviews
  for each row execute function public.page_reviews_touch();

-- ------------------------------------------------------------
--  Row-Level Security
--  The app talks to Supabase with the publishable (anon) key and
--  no real auth, so we allow the anon role to read/write reviews.
--  (This is a QA/review tool — tighten later if it goes public.)
-- ------------------------------------------------------------
alter table public.page_reviews enable row level security;

drop policy if exists "page_reviews read"   on public.page_reviews;
drop policy if exists "page_reviews insert"  on public.page_reviews;
drop policy if exists "page_reviews update"  on public.page_reviews;

create policy "page_reviews read"
  on public.page_reviews for select
  to anon, authenticated
  using (true);

create policy "page_reviews insert"
  on public.page_reviews for insert
  to anon, authenticated
  with check (true);

create policy "page_reviews update"
  on public.page_reviews for update
  to anon, authenticated
  using (true) with check (true);

-- ------------------------------------------------------------
--  Handy view: everything a reviewer flagged as needing an edit.
-- ------------------------------------------------------------
create or replace view public.page_reviews_todo as
  select book_code, screen_key, page_number,
         text_ok, image_ok, note, reviewer, updated_at
  from public.page_reviews
  where text_ok is false or image_ok is false
  order by book_code, page_number nulls first;
