-- ============================================================================
--  Haaraya — DEVICE GUARD
--  ----------------------------------------------------------------------------
--  Stops one paid account being shared with a whole class / WhatsApp group.
--
--  How it works:
--   * Every browser generates a random device id once and keeps it in local
--     storage (companion client file: device-guard.js).
--   * On each sign-in the client calls register_device(). A known device is
--     waved through; a NEW device is refused once the account already has its
--     allowance of active devices, and the person is shown their device list
--     so they can remove one themselves.
--   * Every attempt — allowed or refused — is written to sign_in_events, so
--     staff can see an account with 40 devices and act.
--
--  Nothing here blocks a family: the allowance is one device for the grown-up
--  plus one per reader on the account (minimum 3, maximum 8), and a per-account
--  override lives in public.users.device_limit — set it with
--  admin_set_device_limit for a school or a genuinely unusual household.
--
--  Only hashes-of-nothing are stored: a random device id, a coarse label
--  ("Chrome on Android") and the first hop of x-forwarded-for.
--
--  Both tables are fully locked down — no direct read, even for the owner.
--  All access goes through the SECURITY DEFINER functions below.
--  Idempotent: safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
--  1) Tables
-- ---------------------------------------------------------------------------
create table if not exists public.account_devices (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  device_id     text not null,
  label         text,
  first_seen_at timestamptz not null default now(),
  last_seen_at  timestamptz not null default now(),
  revoked_at    timestamptz,
  unique (user_id, device_id)
);
create index if not exists account_devices_active_idx
  on public.account_devices (user_id) where revoked_at is null;

create table if not exists public.sign_in_events (
  id        bigserial primary key,
  user_id   uuid references auth.users (id) on delete cascade,
  device_id text,
  label     text,
  ip        text,
  allowed   boolean not null default true,
  reason    text,
  at        timestamptz not null default now()
);
create index if not exists sign_in_events_user_at_idx
  on public.sign_in_events (user_id, at desc);

-- Per-account override. NULL means "work it out from the number of readers".
alter table public.users add column if not exists device_limit int;

alter table public.account_devices enable row level security;
alter table public.sign_in_events  enable row level security;

drop policy if exists account_devices_no_direct_read on public.account_devices;
create policy account_devices_no_direct_read on public.account_devices
  for select to authenticated using (false);
drop policy if exists sign_in_events_no_direct_read on public.sign_in_events;
create policy sign_in_events_no_direct_read on public.sign_in_events
  for select to authenticated using (false);

-- ---------------------------------------------------------------------------
--  2) Helpers
-- ---------------------------------------------------------------------------
--  The allowance SCALES WITH THE FAMILY: one device for the grown-up plus one
--  per reader on the account, never fewer than 3 and never more than 8. A
--  family of four readers gets 5; a single-child account gets 3. A staff
--  override in users.device_limit always wins (use it for schools, where the
--  child count is a roll, not a household).
create or replace function public.device_limit_for(p_auth_uid uuid)
returns int
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select u.device_limit from public.users u where u.auth_uid = p_auth_uid),
    (select greatest(3, least(8, 1 + count(c.id)::int))
       from public.users u
       left join public.children c on c.parent_user_id = u.id
      where u.auth_uid = p_auth_uid),
    3);
$$;

create or replace function public.devices_json(p_auth_uid uuid)
returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object(
           'device_id',  d.device_id,
           'label',      coalesce(d.label, 'Unknown device'),
           'first_seen', d.first_seen_at,
           'last_seen',  d.last_seen_at
         ) order by d.last_seen_at desc), '[]'::json)
  from public.account_devices d
  where d.user_id = p_auth_uid and d.revoked_at is null;
$$;

create or replace function public.request_ip()
returns text
language sql stable as $$
  select nullif(split_part(coalesce(
    current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1), '');
$$;

-- ---------------------------------------------------------------------------
--  3) register_device — called by the client right after a successful sign-in
--     Returns { ok, reason, limit, active, devices? }
--     reason: known_device | new_device | device_limit | not_signed_in
-- ---------------------------------------------------------------------------
create or replace function public.register_device(
  p_device_id text,
  p_label     text default null
)
returns json
language plpgsql security definer set search_path = public
as $$
declare
  uid    uuid := auth.uid();
  lim    int;
  active int;
  known  boolean;
  v_ip   text := public.request_ip();
begin
  if uid is null then
    return json_build_object('ok', false, 'reason', 'not_signed_in');
  end if;
  if p_device_id is null or length(p_device_id) < 8 then
    return json_build_object('ok', false, 'reason', 'bad_device_id');
  end if;

  lim := public.device_limit_for(uid);

  select exists (
    select 1 from public.account_devices d
    where d.user_id = uid and d.device_id = p_device_id and d.revoked_at is null
  ) into known;

  if known then
    update public.account_devices
       set last_seen_at = now(), label = coalesce(p_label, label)
     where user_id = uid and device_id = p_device_id;
    insert into public.sign_in_events (user_id, device_id, label, ip, allowed, reason)
      values (uid, p_device_id, p_label, v_ip, true, 'known_device');
    select count(*) into active from public.account_devices
      where user_id = uid and revoked_at is null;
    return json_build_object('ok', true, 'reason', 'known_device',
                             'limit', lim, 'active', active);
  end if;

  select count(*) into active from public.account_devices
    where user_id = uid and revoked_at is null;

  if active >= lim then
    insert into public.sign_in_events (user_id, device_id, label, ip, allowed, reason)
      values (uid, p_device_id, p_label, v_ip, false, 'device_limit');
    return json_build_object('ok', false, 'reason', 'device_limit',
                             'limit', lim, 'active', active,
                             'devices', public.devices_json(uid));
  end if;

  insert into public.account_devices (user_id, device_id, label)
       values (uid, p_device_id, p_label)
  on conflict (user_id, device_id) do update
       set revoked_at = null, last_seen_at = now(),
           label = coalesce(excluded.label, account_devices.label);

  insert into public.sign_in_events (user_id, device_id, label, ip, allowed, reason)
    values (uid, p_device_id, p_label, v_ip, true, 'new_device');

  return json_build_object('ok', true, 'reason', 'new_device',
                           'limit', lim, 'active', active + 1);
end;
$$;

-- ---------------------------------------------------------------------------
--  4) Self-serve: list and remove your own devices
-- ---------------------------------------------------------------------------
create or replace function public.list_my_devices()
returns json
language plpgsql stable security definer set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return '[]'::json; end if;
  return json_build_object(
    'limit',   public.device_limit_for(uid),
    'devices', public.devices_json(uid));
end;
$$;

create or replace function public.revoke_my_device(p_device_id text)
returns json
language plpgsql security definer set search_path = public
as $$
declare uid uuid := auth.uid(); n int;
begin
  if uid is null then return json_build_object('ok', false, 'reason', 'not_signed_in'); end if;
  update public.account_devices
     set revoked_at = now()
   where user_id = uid and device_id = p_device_id and revoked_at is null;
  get diagnostics n = row_count;
  return json_build_object('ok', n > 0, 'removed', n,
                           'devices', public.devices_json(uid));
end;
$$;

-- ---------------------------------------------------------------------------
--  5) Staff view — who is sharing?
--     One row per account with an active device, busiest first.
-- ---------------------------------------------------------------------------
create or replace function public.admin_device_report(p_days int default 30)
returns json
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.is_haaraya_admin() then
    raise exception 'staff only';
  end if;

  return coalesce((
    select json_agg(r order by r.devices desc, r.sign_ins desc)
    from (
      select u.email,
             u.full_name,
             u.role,
             public.device_limit_for(u.auth_uid) as device_limit,
             u.device_limit is not null as limit_is_override,
             (select count(*) from public.children c where c.parent_user_id = u.id) as readers,
             (select count(*) from public.account_devices d
               where d.user_id = u.auth_uid and d.revoked_at is null) as devices,
             (select count(*) from public.sign_in_events e
               where e.user_id = u.auth_uid
                 and e.at > now() - make_interval(days => p_days)) as sign_ins,
             (select count(distinct e.ip) from public.sign_in_events e
               where e.user_id = u.auth_uid and e.ip is not null
                 and e.at > now() - make_interval(days => p_days)) as networks,
             (select count(*) from public.sign_in_events e
               where e.user_id = u.auth_uid and not e.allowed
                 and e.at > now() - make_interval(days => p_days)) as refused,
             (select max(e.at) from public.sign_in_events e
               where e.user_id = u.auth_uid) as last_sign_in,
             public.devices_json(u.auth_uid) as device_list
      from public.users u
      where u.auth_uid is not null
        and exists (select 1 from public.account_devices d
                     where d.user_id = u.auth_uid and d.revoked_at is null)
    ) r
  ), '[]'::json);
end;
$$;

create or replace function public.admin_set_device_limit(p_email text, p_limit int)
returns json
language plpgsql security definer set search_path = public
as $$
declare n int;
begin
  if not public.is_haaraya_admin() then raise exception 'staff only'; end if;
  if p_limit is not null and (p_limit < 1 or p_limit > 50) then
    raise exception 'limit must be between 1 and 50 (or null for the default)';
  end if;
  update public.users set device_limit = p_limit where lower(email) = lower(p_email);
  get diagnostics n = row_count;
  return json_build_object('ok', n > 0, 'email', p_email, 'limit', p_limit);
end;
$$;

--  Sign every device out of an account (they can re-add up to the allowance).
create or replace function public.admin_revoke_devices(p_email text, p_device_id text default null)
returns json
language plpgsql security definer set search_path = public
as $$
declare uid uuid; n int;
begin
  if not public.is_haaraya_admin() then raise exception 'staff only'; end if;
  select auth_uid into uid from public.users where lower(email) = lower(p_email);
  if uid is null then return json_build_object('ok', false, 'reason', 'no_such_account'); end if;
  update public.account_devices
     set revoked_at = now()
   where user_id = uid and revoked_at is null
     and (p_device_id is null or device_id = p_device_id);
  get diagnostics n = row_count;
  return json_build_object('ok', true, 'removed', n);
end;
$$;

-- ---------------------------------------------------------------------------
--  6) Grants — the anon key may only call the guarded functions
-- ---------------------------------------------------------------------------
grant execute on function public.register_device(text, text)   to authenticated;
grant execute on function public.list_my_devices()             to authenticated;
grant execute on function public.revoke_my_device(text)        to authenticated;
grant execute on function public.admin_device_report(int)      to authenticated;
grant execute on function public.admin_set_device_limit(text, int) to authenticated;
grant execute on function public.admin_revoke_devices(text, text)  to authenticated;

-- ---------------------------------------------------------------------------
--  7) Verify — expect four 1s and then your own report
-- ---------------------------------------------------------------------------
select count(*) from information_schema.tables
  where table_schema = 'public' and table_name = 'account_devices';
select count(*) from information_schema.tables
  where table_schema = 'public' and table_name = 'sign_in_events';
select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'register_device';
select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'admin_device_report';
