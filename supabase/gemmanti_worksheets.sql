-- ============================================================================
--  Haaraya: Gemmanti worksheet records
--
--  Adds three tables and one subscription column. It does not change any
--  existing table, policy or function.
--
--    1. subscriptions.addons: which paid add-ons a subscription includes.
--       A school has Gemmanti when an active or in-trial subscription for that
--       school lists 'gemmanti'.
--    2. worksheet_responses: the child's answers, read-aloud ticks and status
--       (in progress / handed in). One row per child per worksheet.
--    3. worksheet_reviews: the teacher's ratings and help level.
--       Parents can read these (report card), but cannot change them.
--    4. worksheet_teacher_notes: the teacher's private note. Staff only;
--       parents never see it.
--
--  Who can do what:
--    * Class teacher: sees and writes records for children CURRENTLY in their
--      class, including the child's earlier worksheets. When a child moves to
--      a new class, the new teacher sees everything and the old teacher loses
--      access. Nothing is deleted.
--    * School admin: sees and writes records for every child in their school.
--    * Parent: sees and fills in their own child's answers, and reads the
--      ratings. Never sees teacher notes.
--    * Haaraya admin: sees everything.
--    * Writing anything needs the child's school to have the Gemmanti add-on.
--
--  Voice recordings are NOT stored. Only "read aloud: done" is saved.
--
--  Run in the Supabase SQL editor AFTER enrolment_migration.sql and
--  enrolment_policies.sql. Idempotent: safe to run more than once.
-- ============================================================================

-- ---------- 1. add-ons on subscriptions ------------------------------------
alter table public.subscriptions
  add column if not exists addons text[] not null default '{}';

-- ---------- 2. helpers -------------------------------------------------------
--  SECURITY DEFINER so they can look up classes and schools without being
--  blocked by those tables' own access rules. Each answers one question about
--  the signed-in user.

-- Does this school have Gemmanti on an active (or still-in-trial) subscription?
create or replace function public.gemmanti_school_enabled(p_school uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.subscriptions s
    where s.school_id = p_school
      and 'gemmanti' = any(s.addons)
      and (
        s.status = 'active'
        or (s.status = 'trial' and coalesce(s.trial_ends_at, now()) > now())
      )
  )
$$;

-- Is the child's school a Gemmanti school?
create or replace function public.gemmanti_child_enabled(p_child uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((
    select public.gemmanti_school_enabled(c.school_id)
    from public.children c where c.id = p_child
  ), false)
$$;

-- Am I the teacher of a class this child is in right now?
create or replace function public.gemmanti_is_class_teacher(p_child uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.classroom_children cc
    join public.classrooms cl on cl.id = cc.classroom_id
    where cc.child_id = p_child
      and cl.teacher_user_id = public.current_user_id()
  )
$$;

-- Am I the admin of this child's school?
create or replace function public.gemmanti_is_school_admin(p_child uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.children c
    join public.schools s on s.id = c.school_id
    where c.id = p_child
      and s.admin_user_id = public.current_user_id()
  )
$$;

-- Am I this child's parent?
create or replace function public.gemmanti_is_parent(p_child uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.children c
    where c.id = p_child
      and c.parent_user_id = public.current_user_id()
  )
$$;

-- Am I Haaraya staff?
create or replace function public.gemmanti_is_haaraya()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_user_role() = 'haaraya_admin', false)
$$;

-- Teaching staff for this child: class teacher or school admin.
create or replace function public.gemmanti_is_staff_for(p_child uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select public.gemmanti_is_class_teacher(p_child)
      or public.gemmanti_is_school_admin(p_child)
$$;

alter function public.gemmanti_school_enabled(uuid)   owner to postgres;
alter function public.gemmanti_child_enabled(uuid)    owner to postgres;
alter function public.gemmanti_is_class_teacher(uuid) owner to postgres;
alter function public.gemmanti_is_school_admin(uuid)  owner to postgres;
alter function public.gemmanti_is_parent(uuid)        owner to postgres;
alter function public.gemmanti_is_haaraya()           owner to postgres;
alter function public.gemmanti_is_staff_for(uuid)     owner to postgres;

grant execute on function public.gemmanti_school_enabled(uuid)   to authenticated;
grant execute on function public.gemmanti_child_enabled(uuid)    to authenticated;
grant execute on function public.gemmanti_is_class_teacher(uuid) to authenticated;
grant execute on function public.gemmanti_is_school_admin(uuid)  to authenticated;
grant execute on function public.gemmanti_is_parent(uuid)        to authenticated;
grant execute on function public.gemmanti_is_haaraya()           to authenticated;
grant execute on function public.gemmanti_is_staff_for(uuid)     to authenticated;

-- Stamps updated_at and updated_by on every change.
create or replace function public.gemmanti_stamp()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  new.updated_by := public.current_user_id();
  return new;
end;
$$;

-- ---------- 3. worksheet_responses: the child's work ------------------------
create table if not exists public.worksheet_responses (
  child_id      uuid not null references public.children(id) on delete cascade,
  book_code     text not null,              -- e.g. 'S-01-06'
  responses     jsonb not null default '{}', -- answers, keyed by item id
  reads_done    jsonb not null default '[]', -- read-aloud ticks, no audio
  status        text  not null default 'in_progress'
                check (status in ('in_progress','handed_in')),
  handed_in_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references public.users(id),
  primary key (child_id, book_code)
);

drop trigger if exists worksheet_responses_stamp on public.worksheet_responses;
create trigger worksheet_responses_stamp
  before insert or update on public.worksheet_responses
  for each row execute function public.gemmanti_stamp();

alter table public.worksheet_responses enable row level security;

drop policy if exists wr_read on public.worksheet_responses;
create policy wr_read on public.worksheet_responses
  for select to authenticated using (
    public.gemmanti_is_staff_for(child_id)
    or public.gemmanti_is_parent(child_id)
    or public.gemmanti_is_haaraya()
  );

drop policy if exists wr_insert on public.worksheet_responses;
create policy wr_insert on public.worksheet_responses
  for insert to authenticated with check (
    public.gemmanti_child_enabled(child_id)
    and ( public.gemmanti_is_staff_for(child_id) or public.gemmanti_is_parent(child_id) )
  );

drop policy if exists wr_update on public.worksheet_responses;
create policy wr_update on public.worksheet_responses
  for update to authenticated
  using (
    public.gemmanti_is_staff_for(child_id) or public.gemmanti_is_parent(child_id)
  )
  with check (
    public.gemmanti_child_enabled(child_id)
    and ( public.gemmanti_is_staff_for(child_id) or public.gemmanti_is_parent(child_id) )
  );

grant select, insert, update on public.worksheet_responses to authenticated;

-- ---------- 4. worksheet_reviews: ratings and help --------------------------
create table if not exists public.worksheet_reviews (
  child_id     uuid not null references public.children(id) on delete cascade,
  book_code    text not null,
  ratings      jsonb not null default '{}', -- per section: NY / D / S / B
  help_level   text check (help_level in ('modelled','prompted','independent')),
  reviewed_at  timestamptz not null default now(),
  reviewed_by  uuid references public.users(id) default public.current_user_id(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  updated_by   uuid references public.users(id),
  primary key (child_id, book_code)
);

drop trigger if exists worksheet_reviews_stamp on public.worksheet_reviews;
create trigger worksheet_reviews_stamp
  before insert or update on public.worksheet_reviews
  for each row execute function public.gemmanti_stamp();

alter table public.worksheet_reviews enable row level security;

drop policy if exists wv_read on public.worksheet_reviews;
create policy wv_read on public.worksheet_reviews
  for select to authenticated using (
    public.gemmanti_is_staff_for(child_id)
    or public.gemmanti_is_parent(child_id)     -- report card
    or public.gemmanti_is_haaraya()
  );

drop policy if exists wv_insert on public.worksheet_reviews;
create policy wv_insert on public.worksheet_reviews
  for insert to authenticated with check (
    public.gemmanti_child_enabled(child_id)
    and public.gemmanti_is_staff_for(child_id)
  );

drop policy if exists wv_update on public.worksheet_reviews;
create policy wv_update on public.worksheet_reviews
  for update to authenticated
  using ( public.gemmanti_is_staff_for(child_id) )
  with check (
    public.gemmanti_child_enabled(child_id)
    and public.gemmanti_is_staff_for(child_id)
  );

grant select, insert, update on public.worksheet_reviews to authenticated;

-- ---------- 5. worksheet_teacher_notes: staff only --------------------------
create table if not exists public.worksheet_teacher_notes (
  child_id    uuid not null references public.children(id) on delete cascade,
  book_code   text not null,
  note        text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  updated_by  uuid references public.users(id),
  primary key (child_id, book_code)
);

drop trigger if exists worksheet_teacher_notes_stamp on public.worksheet_teacher_notes;
create trigger worksheet_teacher_notes_stamp
  before insert or update on public.worksheet_teacher_notes
  for each row execute function public.gemmanti_stamp();

alter table public.worksheet_teacher_notes enable row level security;

drop policy if exists wn_read on public.worksheet_teacher_notes;
create policy wn_read on public.worksheet_teacher_notes
  for select to authenticated using (
    public.gemmanti_is_staff_for(child_id)      -- no parent clause, on purpose
    or public.gemmanti_is_haaraya()
  );

drop policy if exists wn_insert on public.worksheet_teacher_notes;
create policy wn_insert on public.worksheet_teacher_notes
  for insert to authenticated with check (
    public.gemmanti_child_enabled(child_id)
    and public.gemmanti_is_staff_for(child_id)
  );

drop policy if exists wn_update on public.worksheet_teacher_notes;
create policy wn_update on public.worksheet_teacher_notes
  for update to authenticated
  using ( public.gemmanti_is_staff_for(child_id) )
  with check (
    public.gemmanti_child_enabled(child_id)
    and public.gemmanti_is_staff_for(child_id)
  );

grant select, insert, update on public.worksheet_teacher_notes to authenticated;

-- ---------- 6. check it worked ---------------------------------------------
--  Expect three rows, each with rls_on = true.
select c.relname as table_name, c.relrowsecurity as rls_on
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('worksheet_responses','worksheet_reviews','worksheet_teacher_notes')
order by 1;
