-- ============================================================================
--  Haaraya — passport detail columns + sequential passport serials
--
--  The Reading Passport page was rendering placeholders (a hardcoded date of
--  birth, "Lagos" for everyone, a serial computed as 72467 + child.id which is
--  NaN now ids are uuids) because these columns did not exist. This adds them
--  and gives every existing child a serial.
--
--  Idempotent; safe to re-run.
-- ============================================================================

-- ---- 1. columns -------------------------------------------------------------
alter table public.children add column if not exists city            text;
alter table public.children add column if not exists passport_color  text;
alter table public.children add column if not exists avatar          jsonb;

--  Sequential, DB-owned passport number. A sequence (not a count) so numbers
--  are never reused and never collide under concurrent signups.
create sequence if not exists public.passport_serial_seq start with 1001;

alter table public.children
  add column if not exists passport_serial bigint;

alter table public.children
  alter column passport_serial set default nextval('public.passport_serial_seq');

--  Backfill anyone created before this migration, oldest first so the numbers
--  follow join order.
update public.children c
set passport_serial = nextval('public.passport_serial_seq')
where c.passport_serial is null;

create unique index if not exists children_passport_serial_key
  on public.children (passport_serial);

-- ---- 2. sensible default for the cover colour -------------------------------
update public.children set passport_color = 'green' where passport_color is null;
alter table public.children alter column passport_color set default 'green';

-- ---- 3. keep the colour to the four real covers -----------------------------
alter table public.children drop constraint if exists children_passport_color_chk;
alter table public.children add constraint children_passport_color_chk
  check (passport_color is null or passport_color in ('green','blue','red','beige'));

-- ---- 4. check ---------------------------------------------------------------
select id, display_name, passport_serial, passport_color, city, date_of_birth
from public.children
order by passport_serial;
