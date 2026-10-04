-- ============================================================================
-- Haaraya — privacy tools (NDPA 2023 · COPPA)          run once, idempotent
--   1. consent record on public.users (copied from sign-up metadata)
--   2. export_child_data(child)  -> jsonb   parent downloads everything held
--   3. delete_child_data(child)             parent erases one child
--   4. delete_my_account()                  parent erases account + children
--   5. weekly-email opt-out columns (used by weekly_parent_email.sql)
-- Everything is SECURITY DEFINER and checks ownership itself.
-- ============================================================================
begin;

-- 1. consent ------------------------------------------------------------------
alter table public.users add column if not exists consent_version text;
alter table public.users add column if not exists consent_at      timestamptz;
alter table public.users add column if not exists weekly_email    boolean not null default true;
alter table public.users add column if not exists email_token     uuid    not null default gen_random_uuid();
create unique index if not exists users_email_token_idx on public.users (email_token);

create or replace function public.users_copy_consent()
returns trigger language plpgsql security definer set search_path = public, auth as $$
declare m jsonb;
begin
  if new.consent_at is null and new.auth_uid is not null then
    select raw_user_meta_data -> 'consent' into m from auth.users where id = new.auth_uid;
    if m is not null and m ? 'at' then
      new.consent_version := m ->> 'version';
      new.consent_at      := (m ->> 'at')::timestamptz;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists users_copy_consent on public.users;
create trigger users_copy_consent before insert or update on public.users
  for each row execute function public.users_copy_consent();

-- 2. helpers: every real table that carries a child_id ------------------------
create or replace function public._child_tables()
returns setof text language sql stable security definer set search_path = public as $$
  select c.table_name::text
  from information_schema.columns c
  join information_schema.tables t
    on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
  where c.table_schema = 'public' and c.column_name = 'child_id' and c.table_name <> 'children'
  order by 1
$$;
revoke all on function public._child_tables() from public, anon, authenticated;

-- 3. export -------------------------------------------------------------------
create or replace function public.export_child_data(p_child uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare out jsonb; tbl text; rows jsonb;
begin
  if not public.owns_child(p_child) then raise exception 'not your child'; end if;
  select jsonb_build_object(
           'exported_at', now(),
           'exported_by', (select email from users where auth_uid = auth.uid()),
           'child', to_jsonb(c))
    into out from children c where c.id = p_child;
  for tbl in select * from public._child_tables() loop
    execute format('select coalesce(jsonb_agg(to_jsonb(t)), ''[]''::jsonb) from public.%I t where t.child_id = $1', tbl)
      into rows using p_child;
    if jsonb_array_length(rows) > 0 then out := out || jsonb_build_object(tbl, rows); end if;
  end loop;
  return out;
end $$;

-- 4. delete one child ---------------------------------------------------------
create or replace function public.delete_child_data(p_child uuid)
returns void language plpgsql security definer set search_path = public as $$
declare tbl text;
begin
  if not public.owns_child(p_child) then raise exception 'not your child'; end if;
  update public.access_codes set child_id = null where child_id = p_child;
  for tbl in select * from public._child_tables() where _child_tables <> 'access_codes' loop
    execute format('delete from public.%I where child_id = $1', tbl) using p_child;
  end loop;
  delete from children where id = p_child;
end $$;

-- 5. delete the whole account (parents only; schools own pupil records) ------
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = public, auth as $$
declare pid uuid; r text; kid uuid;
begin
  select id, role into pid, r from users where auth_uid = auth.uid();
  if pid is null then raise exception 'no profile'; end if;
  if r <> 'parent' then
    raise exception 'school and staff accounts hold records for others — email info@haarayaeducation.org to close this account';
  end if;

  for kid in select id from children where parent_user_id = pid loop
    perform public.delete_child_data(kid);
  end loop;

  if to_regclass('public.subscriptions')        is not null then delete from subscriptions        where owner_user_id = pid; end if;
  if to_regclass('public.teacher_school_links') is not null then delete from teacher_school_links where teacher_user_id = pid; end if;
  if to_regclass('public.assignments')          is not null then update assignments set assigned_by_user_id = null where assigned_by_user_id = pid; end if;
  if to_regclass('public.content_edits')        is not null then update content_edits set edited_by = null where edited_by = pid; end if;

  delete from users where id = pid;
  delete from auth.users where id = auth.uid();   -- cascades device, odyssey and log rows keyed on user_id
end $$;

revoke all on function public.export_child_data(uuid) from public, anon;
revoke all on function public.delete_child_data(uuid) from public, anon;
revoke all on function public.delete_my_account()     from public, anon;
grant execute on function public.export_child_data(uuid) to authenticated;
grant execute on function public.delete_child_data(uuid) to authenticated;
grant execute on function public.delete_my_account()     to authenticated;

commit;

-- backfill consent for anyone who signed up after the checkbox went live
update public.users set consent_at = consent_at where consent_at is null;

-- Checks
--   select count(*) filter (where consent_at is not null) as consented, count(*) from public.users;
--   select * from public._child_tables();   -- every table a delete/export will touch
