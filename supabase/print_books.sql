-- Haaraya: printable books for school staff, with a traceable print code.
-- Every print is issued a code by issue_print_code(), which checks that the
-- signed-in person is a teacher or school admin at a school whose plan has the
-- 'print' add-on (Haaraya admins can always print), and records who printed
-- which book, when, on which paper. Each school also has a fixed school code.

create table if not exists public.print_log (
  id          bigint generated always as identity primary key,
  code        text not null unique,
  school_id   uuid references public.schools(id) on delete set null,
  school_code text not null,
  user_id     uuid references public.users(id),
  book_code   text not null,
  paper       text not null check (paper in ('a4', 'letter')),
  created_at  timestamptz not null default now()
);
create index if not exists print_log_school on public.print_log (school_id, created_at desc);
alter table public.print_log enable row level security;
drop policy if exists print_log_read on public.print_log;
create policy print_log_read on public.print_log
  for select to authenticated using ( public.gemmanti_is_haaraya() or user_id = public.current_user_id() );
grant select on public.print_log to authenticated;
-- No insert policy: rows are only written by issue_print_code().

create or replace function public.print_school_code(p_school uuid)
returns text language sql immutable as $$
  select upper(substr(md5('haaraya-print:' || p_school::text), 1, 4))
$$;

create or replace function public.issue_print_code(p_book text, p_paper text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := public.current_user_id();
  v_role text := public.current_user_role();
  v_school uuid; v_name text; v_scode text; v_code text; i int;
begin
  if v_user is null then raise exception 'Please sign in to print.'; end if;
  if p_paper not in ('a4', 'letter') then raise exception 'Unknown paper size.'; end if;
  if coalesce(p_book, '') = '' then raise exception 'No book chosen.'; end if;
  if v_role = 'haaraya_admin' then
    v_school := null;
  elsif v_role in ('teacher', 'school_admin') then
    select s.id into v_school from public.schools s where s.admin_user_id = v_user limit 1;
    if v_school is null then
      select cl.school_id into v_school from public.classrooms cl where cl.teacher_user_id = v_user limit 1;
    end if;
    if v_school is null then raise exception 'Printing is for staff of a Haaraya school.'; end if;
    if not exists (
      select 1 from public.subscriptions su
      where su.school_id = v_school and 'print' = any(su.addons)
        and (su.status = 'active' or (su.status = 'trial' and coalesce(su.trial_ends_at, now()) > now()))
    ) then raise exception 'Printing books is not part of your school''s plan.'; end if;
  else
    raise exception 'Printing books is for teachers and school admins.';
  end if;
  select name into v_name from public.schools where id = v_school;
  v_scode := case when v_school is null then 'HAAR' else public.print_school_code(v_school) end;
  for i in 1..6 loop
    v_code := 'HX-' || upper(translate(substr(md5(random()::text || clock_timestamp()::text || i::text), 1, 6), '01', 'XY'));
    begin
      insert into public.print_log (code, school_id, school_code, user_id, book_code, paper)
      values (v_code, v_school, v_scode, v_user, p_book, p_paper);
      exit;
    exception when unique_violation then
      if i = 6 then raise; end if;
    end;
  end loop;
  return jsonb_build_object('code', v_code, 'school_code', v_scode, 'school_name', coalesce(v_name, 'Haaraya Education'));
end $$;
revoke all on function public.issue_print_code(text, text) from public;
grant execute on function public.issue_print_code(text, text) to authenticated;

-- Demo school gets the Print add-on (demos show every feature).
update public.subscriptions set addons = array_append(addons, 'print')
where school_id = 'cccc0000-0000-4000-8000-000000000001' and not ('print' = any(addons));
