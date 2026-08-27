-- ============================================================================
--  Haaraya — enrolment migration
--  Adds what real registration and enrolment need. Idempotent; safe to re-run.
--  Run AFTER supabase-dashboard-tables.sql.
--  Run supabase/enrolment_policies.sql AFTER this file.
-- ============================================================================

-- ---------- 1. school pupils have no guardian login -------------------------
--  A school-enrolled pupil belongs to the school, not to a parent account, so
--  parent_user_id must be allowed to be empty. The check keeps every child
--  anchored to SOMETHING: a parent, a school, or both.
alter table public.children alter column parent_user_id drop not null;

alter table public.children drop constraint if exists children_has_owner;
alter table public.children add constraint children_has_owner
  check (parent_user_id is not null or school_id is not null);

--  Who created the pupil, for a school audit trail.
alter table public.children add column if not exists enrolled_by_user_id uuid references public.users(id);

-- ---------- 2. the 14-day unpaid window ------------------------------------
alter table public.subscriptions add column if not exists trial_ends_at timestamptz;

--  'trial' is already an allowed plan_type and status, so nothing to widen.
--  A fresh signup gets status 'trial' + trial_ends_at = now() + 14 days, and
--  the app treats an elapsed trial as read-only.
create or replace function public.subscription_is_active(sub_id uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select case
    when s.status = 'active' then true
    when s.status = 'trial'  then coalesce(s.trial_ends_at, now()) > now()
    else false
  end
  from public.subscriptions s where s.id = sub_id
$$;

-- ---------- 3. sponsored access codes --------------------------------------
--  One code per child, consumed once, then dead.
create table if not exists public.access_codes (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null,
  programme_name text not null,
  school_id      uuid references public.schools(id),
  created_by     uuid references public.users(id),
  created_at     timestamptz not null default now(),
  expires_at     timestamptz,
  consumed_at    timestamptz,
  consumed_by    uuid references public.users(id),
  child_id       uuid references public.children(id)
);

create index if not exists access_codes_code_idx on public.access_codes (lower(code));

--  Check a code WITHOUT consuming it. Returns one row when usable.
--  SECURITY DEFINER so an anonymous visitor can validate before registering,
--  without being able to read the codes table itself.
create or replace function public.check_access_code(p_code text)
returns table (valid boolean, programme_name text, reason text)
language plpgsql stable security definer set search_path = public as $$
declare c public.access_codes;
begin
  select * into c from public.access_codes
  where lower(code) = lower(trim(p_code)) limit 1;

  if c.id is null then
    return query select false, null::text, 'not_found';
  elsif c.consumed_at is not null then
    return query select false, c.programme_name, 'already_used';
  elsif c.expires_at is not null and c.expires_at < now() then
    return query select false, c.programme_name, 'expired';
  else
    return query select true, c.programme_name, null::text;
  end if;
end;
$$;

--  Consume a code and attach it to the child it created. Atomic: the update
--  only lands if the code is still unconsumed, so two people racing the same
--  code cannot both win.
create or replace function public.consume_access_code(p_code text, p_child_id uuid)
returns boolean
language plpgsql security definer set search_path = public as $$
declare hit int;
begin
  update public.access_codes
     set consumed_at = now(),
         consumed_by = public.current_user_id(),
         child_id    = p_child_id
   where lower(code) = lower(trim(p_code))
     and consumed_at is null
     and (expires_at is null or expires_at > now());
  get diagnostics hit = row_count;
  return hit > 0;
end;
$$;

grant execute on function public.check_access_code(text)          to anon, authenticated;
grant execute on function public.consume_access_code(text, uuid)  to authenticated;
grant execute on function public.subscription_is_active(uuid)     to authenticated;

-- ---------- 4. generate codes for a programme ------------------------------
--  Haaraya/school admins call this to mint a batch. Returns the codes.
create or replace function public.mint_access_codes(
  p_programme text, p_count int, p_school_id uuid default null, p_expires timestamptz default null)
returns setof text
language plpgsql security definer set search_path = public as $$
declare i int; new_code text; me uuid; my_role text;
begin
  me := public.current_user_id();
  select role into my_role from public.users where id = me;
  if my_role not in ('haaraya_admin','school_admin') then
    raise exception 'only admins may mint access codes';
  end if;

  for i in 1..greatest(p_count, 0) loop
    loop
      new_code := upper(
        substr(regexp_replace(encode(gen_random_bytes(8), 'base64'), '[^A-Za-z0-9]', '', 'g'), 1, 8)
      );
      exit when not exists (select 1 from public.access_codes where code = new_code);
    end loop;

    insert into public.access_codes (code, programme_name, school_id, created_by, expires_at)
    values (new_code, p_programme, p_school_id, me, p_expires);

    return next new_code;
  end loop;
end;
$$;

grant execute on function public.mint_access_codes(text, int, uuid, timestamptz) to authenticated;
