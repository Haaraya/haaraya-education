-- ============================================================================
--  Haaraya: family email and emailed reports for school pupils
--
--  Run AFTER gemmanti_worksheets.sql and gemmanti_worksheets_v2.sql.
--  Idempotent: safe to run more than once. Changes no existing table.
--
--  1. school_pupil_contacts: one family email per school pupil. Kept out of
--     the children table so only the pupil's class teacher, the school admin
--     and Haaraya admins can ever see it.
--  2. report_email_log: a record of each report emailed to a family. Written
--     only by the gemmanti-report-email function; staff can read it.
-- ============================================================================

-- ---------- 1. family email --------------------------------------------------
create table if not exists public.school_pupil_contacts (
  child_id      uuid primary key references public.children(id) on delete cascade,
  family_email  text check (family_email is null or family_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  updated_by    uuid references public.users(id)
);

drop trigger if exists school_pupil_contacts_stamp on public.school_pupil_contacts;
create trigger school_pupil_contacts_stamp
  before insert or update on public.school_pupil_contacts
  for each row execute function public.gemmanti_stamp();

alter table public.school_pupil_contacts enable row level security;

drop policy if exists spc_read on public.school_pupil_contacts;
create policy spc_read on public.school_pupil_contacts
  for select to authenticated using (
    public.gemmanti_is_staff_for(child_id) or public.gemmanti_is_haaraya()
  );

drop policy if exists spc_insert on public.school_pupil_contacts;
create policy spc_insert on public.school_pupil_contacts
  for insert to authenticated with check ( public.gemmanti_is_staff_for(child_id) );

drop policy if exists spc_update on public.school_pupil_contacts;
create policy spc_update on public.school_pupil_contacts
  for update to authenticated
  using ( public.gemmanti_is_staff_for(child_id) )
  with check ( public.gemmanti_is_staff_for(child_id) );

grant select, insert, update on public.school_pupil_contacts to authenticated;

-- ---------- 2. emailed-report log -------------------------------------------
create table if not exists public.report_email_log (
  id          bigint generated always as identity primary key,
  child_id    uuid not null references public.children(id) on delete cascade,
  sent_to     text not null,
  book_codes  text[] not null default '{}',
  with_scores boolean not null default true,
  sent_at     timestamptz not null default now(),
  sent_by     uuid references public.users(id)
);
create index if not exists report_email_log_child on public.report_email_log (child_id, sent_at desc);

alter table public.report_email_log enable row level security;

drop policy if exists rel_read on public.report_email_log;
create policy rel_read on public.report_email_log
  for select to authenticated using (
    public.gemmanti_is_staff_for(child_id) or public.gemmanti_is_haaraya()
  );
-- No insert/update policy for signed-in users: only the email function
-- (service role) writes here.
grant select on public.report_email_log to authenticated;

-- ---------- 3. check it worked ---------------------------------------------
--  Expect two rows, each with rls_on = true.
select c.relname as table_name, c.relrowsecurity as rls_on
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('school_pupil_contacts','report_email_log')
order by 1;
