-- ============================================================================
--  Haaraya — TRIAL GUARD
--  ----------------------------------------------------------------------------
--  Stops the same person (or the same child) taking a free trial over and over
--  with a new email every fortnight.
--
--  Design notes:
--   * We store a NORMALISED email (no +tag, no Gmail dots) so the usual tricks
--     collapse onto one row.
--   * We also store a CHILD FINGERPRINT (first name + birth year, hashed
--     client-side). That is the real deterrent, because the product is priced
--     per child and a family cannot invent new children.
--   * Only hashes and a normalised address are kept, nothing a child could be
--     identified from by a reader of this table.
--   * Both RPCs are SECURITY DEFINER with a locked search_path, so the anon
--     key can ask "has this been used?" without being able to read the table.
--
--  BEFORE YOU RUN: the backfill at the bottom marks EVERY existing account as
--  having used its trial — including your own. That is usually what you want,
--  but it means an existing person who re-registers gets no second free trial.
--  Two safety valves: a repeat signup is never blocked (it is created awaiting
--  payment instead, see enrolment.js), and public.clear_trial_claim(email)
--  exempts anyone you choose. Comment the backfill out if you would rather
--  start from today only.
--
--  Companion client file: trial-guard.js
--  Idempotent: safe to re-run.
-- ============================================================================

create table if not exists public.trial_claims (
  id           uuid primary key default gen_random_uuid(),
  email_norm   text not null,
  child_print  text,
  user_id      uuid references auth.users (id) on delete set null,
  claimed_at   timestamptz not null default now(),
  -- Staff escape hatch: an exempt row never counts as a used trial, so a
  -- genuine case (a parent who lost an account, a pilot family) can be waved
  -- through without deleting history.
  exempt       boolean not null default false
);

alter table public.trial_claims add column if not exists exempt boolean not null default false;

create unique index if not exists trial_claims_email_idx on public.trial_claims (email_norm)
  where child_print is null;
create unique index if not exists trial_claims_child_idx on public.trial_claims (child_print)
  where child_print is not null;

alter table public.trial_claims enable row level security;

-- Nobody reads this table directly — not even authenticated users. All access
-- goes through the two functions below.
drop policy if exists trial_claims_no_direct_read on public.trial_claims;
create policy trial_claims_no_direct_read on public.trial_claims
  for select to authenticated using (false);

-- ---------------------------------------------------------------------------
--  Has this email or any of these children already had a trial?
--  Returns { email_seen: bool, child_seen: bool } and nothing else, so a
--  caller learns only what it needs to show the right message.
-- ---------------------------------------------------------------------------
create or replace function public.claim_trial_check(
  p_email_norm text,
  p_child_prints text[] default '{}'
)
returns json
language plpgsql
stable
security definer set search_path = public
as $$
declare
  email_seen boolean := false;
  child_seen boolean := false;
begin
  if coalesce(p_email_norm, '') <> '' then
    select exists (
      select 1 from public.trial_claims
       where email_norm = lower(p_email_norm) and not exempt
    ) into email_seen;
  end if;

  if p_child_prints is not null and array_length(p_child_prints, 1) > 0 then
    select exists (
      select 1 from public.trial_claims
       where child_print = any (p_child_prints) and not exempt
    ) into child_seen;
  end if;

  return json_build_object('email_seen', email_seen, 'child_seen', child_seen);
end $$;

grant execute on function public.claim_trial_check(text, text[]) to anon, authenticated;

-- ---------------------------------------------------------------------------
--  Record the claim once the account exists. Idempotent.
-- ---------------------------------------------------------------------------
create or replace function public.claim_trial_record(
  p_email_norm text,
  p_child_prints text[] default '{}'
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  p text;
begin
  if coalesce(p_email_norm, '') = '' then return; end if;

  insert into public.trial_claims (email_norm, child_print, user_id)
  values (lower(p_email_norm), null, auth.uid())
  on conflict do nothing;

  if p_child_prints is not null then
    foreach p in array p_child_prints loop
      if coalesce(p, '') <> '' then
        insert into public.trial_claims (email_norm, child_print, user_id)
        values (lower(p_email_norm), p, auth.uid())
        on conflict do nothing;
      end if;
    end loop;
  end if;
end $$;

-- Granted to anon as well: with email confirmation ON, signUp() returns no
-- session, so the claim is made while the caller is still anonymous. The
-- function is SECURITY DEFINER and accepts only a normalised address plus
-- one-way hashes, and it cannot read the table back.
grant execute on function public.claim_trial_record(text, text[]) to anon, authenticated;

-- ---------------------------------------------------------------------------
--  STAFF OVERRIDE. Wave a specific email (and its children) back through.
--  service_role only — never exposed to the anon or authenticated key.
-- ---------------------------------------------------------------------------
create or replace function public.clear_trial_claim(p_email text, p_exempt boolean default true)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  norm text;
  n integer;
begin
  norm := case
    when split_part(lower(p_email), '@', 2) in ('gmail.com', 'googlemail.com')
      then replace(split_part(split_part(lower(p_email), '@', 1), '+', 1), '.', '') || '@gmail.com'
    else split_part(split_part(lower(p_email), '@', 1), '+', 1)
         || '@' || split_part(lower(p_email), '@', 2)
  end;

  if p_exempt then
    update public.trial_claims set exempt = true where email_norm = norm;
  else
    delete from public.trial_claims where email_norm = norm;
  end if;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.clear_trial_claim(text, boolean) from public, anon, authenticated;
grant execute on function public.clear_trial_claim(text, boolean) to service_role;

-- ---------------------------------------------------------------------------
--  Backfill from accounts that already exist, so today's users aren't offered
--  a second trial tomorrow.
-- ---------------------------------------------------------------------------
insert into public.trial_claims (email_norm, child_print, user_id)
select distinct
       -- same normalisation as trial-guard.js: drop +tag, drop Gmail dots
       case
         when split_part(lower(u.email), '@', 2) in ('gmail.com', 'googlemail.com')
           then replace(split_part(split_part(lower(u.email), '@', 1), '+', 1), '.', '')
                || '@gmail.com'
         else split_part(split_part(lower(u.email), '@', 1), '+', 1)
              || '@' || split_part(lower(u.email), '@', 2)
       end,
       null,
       u.id
from auth.users u
on conflict do nothing;

-- ---------------------------------------------------------------------------
--  VERIFY
-- ---------------------------------------------------------------------------
--   select count(*) from public.trial_claims;
--   select public.claim_trial_check('oluchi@gmail.com', '{}');           -- expect email_seen true after backfill
--   select public.claim_trial_check('brand.new@example.com', '{}');      -- expect both false
--
--  Waving someone through (service role):
--   select public.clear_trial_claim('parent@example.com');        -- exempt, keeps history
--   select public.clear_trial_claim('parent@example.com', false); -- delete outright
--
--  A note on what this does NOT do: it cannot stop a determined person with
--  unlimited real inboxes. It removes the casual path, and every recycled
--  account still abandons that child's passport, stamps and Odyssey progress
--  — which is the deterrent that actually bites.
