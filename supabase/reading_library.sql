-- ============================================================================
--  Haaraya — "My reading library" (the child's own saved shelf)
--
--  The dashboard used to show two rails of the same books under two headings.
--  They now split by OWNERSHIP:
--    • My reading path    — system-chosen, the level journey (no new storage)
--    • My reading library — child-chosen, this table
--
--  Books can be saved from either catalogue, and Tafiya books and Odyssey books
--  live in different tables, so a row stores (source, book_code) rather than a
--  foreign key to `books`. Title is denormalised so a saved shelf still renders
--  if a catalogue row is later renamed or withdrawn.
--
--  Idempotent; safe to re-run.
-- ============================================================================

create table if not exists public.child_saved_books (
  id         uuid primary key default gen_random_uuid(),
  child_id   uuid not null references public.children(id) on delete cascade,
  source     text not null default 'tafiya' check (source in ('tafiya', 'odyssey')),
  book_code  text not null,
  title      text,
  added_at   timestamptz not null default now(),
  unique (child_id, source, book_code)
);

create index if not exists child_saved_books_child_idx
  on public.child_saved_books (child_id, added_at desc);

alter table public.child_saved_books enable row level security;

--  Same ownership rules as reading_progress: the child's parent, their school
--  teacher/admin, or Haaraya staff. Helpers come from
--  fix_reading_progress_writes.sql — run that first if they are missing.
drop policy if exists saved_books_visible on public.child_saved_books;
create policy saved_books_visible on public.child_saved_books
  for select to authenticated
  using ( public.owns_child(child_id) or public.can_see_child(child_id) );

drop policy if exists saved_books_insert on public.child_saved_books;
create policy saved_books_insert on public.child_saved_books
  for insert to authenticated
  with check ( public.owns_child(child_id) or public.can_see_child(child_id) );

drop policy if exists saved_books_delete on public.child_saved_books;
create policy saved_books_delete on public.child_saved_books
  for delete to authenticated
  using ( public.owns_child(child_id) or public.can_see_child(child_id) );

grant select, insert, delete on public.child_saved_books to authenticated;

--  NOTE — demo account: the nightly reset function in demo_readonly.sql clears
--  the demo child's reading activity. Saving a book IS reading activity, so add
--  this line inside that function or the demo shelf grows forever:
--
--    delete from public.child_saved_books
--    where child_id in (select id from public.children where is_demo);
--
--  Not patched automatically here: the reset function's body is owned by
--  demo_readonly.sql and rewriting it blind would drop whatever else it does.

-- what is on each shelf right now
select c.display_name, sb.source, sb.book_code, sb.title, sb.added_at
from public.child_saved_books sb
join public.children c on c.id = sb.child_id
order by c.display_name, sb.added_at desc;
