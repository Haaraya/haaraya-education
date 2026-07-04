-- ============================================================
--  Haaraya — Page Review (QA) table  ·  REAL-AUTH edition
--  Run this once in the Supabase SQL editor.
--
--  Only signed-in users whose profile role is a REVIEWER role
--  ('reviewer' / 'admin' / 'staff') can read or write reviews.
--  Public/anon and ordinary parent/child accounts get NOTHING —
--  the notes are not queryable by normal readers.
--
--  Reviewer identity (who reviewed what) is stamped server-side
--  from the JWT, so it can't be spoofed by the client.
--
--  Requires the auth setup in supabase-auth-setup.sql (public.users
--  with an auth_uid + role column, auto-created on signup).
--
--  text_ok / image_ok / page_order_ok / layout_ok:
--     NULL = unreviewed, true = OK, false = NEEDS EDIT
-- ============================================================

create table if not exists public.page_reviews (
  id             uuid primary key default gen_random_uuid(),
  book_code      text not null,
  screen_key     text not null,          -- 'cover' | 'back' | 'page-<n>'
  page_number    int,                    -- null for cover/back
  -- verdict fields
  text_ok        boolean,
  image_ok       boolean,
  page_order_ok  boolean,
  layout_ok      boolean,
  issue_type     text,                   -- image_mismatch | bad_cover | ...
  review_status  text not null default 'open',   -- open | fixed | ignored
  note           text default '',
  -- context (denormalised for traceable reporting)
  book_title     text,
  strand         text,
  level          int,
  -- identity (stamped by trigger from the JWT)
  reviewer       text,                   -- display name (client-supplied)
  reviewer_id    uuid,                   -- auth.uid()
  reviewer_email text,
  updated_at     timestamptz not null default now(),
  unique (book_code, screen_key)
);

create index if not exists page_reviews_book_idx on public.page_reviews (book_code);
create index if not exists page_reviews_status_idx on public.page_reviews (review_status);
create index if not exists page_reviews_needs_edit_idx
  on public.page_reviews (book_code)
  where text_ok is false or image_ok is false
     or page_order_ok is false or layout_ok is false;

-- ------------------------------------------------------------
--  Who counts as a reviewer? (checks the caller's profile role)
--  Reviewers self-register through the Reviewer Access page, which
--  sets role = 'reviewer' at sign-up — so no manual promotion needed.
-- ------------------------------------------------------------
create or replace function public.is_reviewer()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.users u
    where u.auth_uid = auth.uid()
      and u.role in ('reviewer', 'admin', 'staff')
  );
$$;

-- ------------------------------------------------------------
--  Stamp identity + updated_at on every write (anti-spoof).
-- ------------------------------------------------------------
create or replace function public.page_reviews_stamp()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  new.reviewer_id    := auth.uid();
  new.reviewer_email := (select email from auth.users where id = auth.uid());
  new.updated_at     := now();
  return new;
end $$;

drop trigger if exists page_reviews_stamp on public.page_reviews;
create trigger page_reviews_stamp
  before insert or update on public.page_reviews
  for each row execute function public.page_reviews_stamp();

-- ------------------------------------------------------------
--  Row-Level Security — reviewers only, no anon access.
-- ------------------------------------------------------------
alter table public.page_reviews enable row level security;

-- Remove any earlier public policies from the first version.
drop policy if exists "page_reviews read"   on public.page_reviews;
drop policy if exists "page_reviews insert"  on public.page_reviews;
drop policy if exists "page_reviews update"  on public.page_reviews;
drop policy if exists "page_reviews reviewer read"   on public.page_reviews;
drop policy if exists "page_reviews reviewer insert" on public.page_reviews;
drop policy if exists "page_reviews reviewer update" on public.page_reviews;

create policy "page_reviews reviewer read"
  on public.page_reviews for select
  to authenticated
  using (public.is_reviewer());

create policy "page_reviews reviewer insert"
  on public.page_reviews for insert
  to authenticated
  with check (public.is_reviewer());

create policy "page_reviews reviewer update"
  on public.page_reviews for update
  to authenticated
  using (public.is_reviewer())
  with check (public.is_reviewer());

-- ------------------------------------------------------------
--  Reporting view: everything still flagged as needing an edit.
--  security_invoker => the same reviewer-only RLS applies here.
-- ------------------------------------------------------------
drop view if exists public.page_reviews_todo;
create view public.page_reviews_todo
  with (security_invoker = on)
as
  select book_code, book_title, strand, level, screen_key, page_number,
         text_ok, image_ok, page_order_ok, layout_ok,
         issue_type, review_status, note,
         reviewer, reviewer_email, updated_at
  from public.page_reviews
  where review_status <> 'fixed'
    and (text_ok is false or image_ok is false
         or page_order_ok is false or layout_ok is false
         or issue_type is not null);

-- ============================================================
--  ONBOARDING A REVIEWER
--  1. They self-register on the Haaraya Registration page
--     (creates a public.users row with role = 'parent').
--  2. You promote them to a reviewer here:
--
--       update public.users set role = 'reviewer'
--       where email = 'them@example.com';
--
--     (roles that can review: 'reviewer', 'admin', 'staff')
-- ============================================================
