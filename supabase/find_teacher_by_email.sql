-- ============================================================================
--  Haaraya — find a teacher by email, for school enrolment
--  Run AFTER supabase/enrolment_policies.sql. Idempotent; safe to re-run.
--
--  Why this exists: a school admin adding a teacher needs to look that teacher
--  up BEFORE any link between them exists — but the read policies on
--  public.users only expose the admin's own row and colleagues at schools they
--  are already linked to. So a plain select can never find them.
--
--  SECURITY DEFINER narrows that to exactly one safe capability: given a FULL
--  email address, return that one account if it is a teacher. It cannot list
--  users, cannot be used to enumerate addresses (no partial matching), and
--  returns nothing for parents, admins, or unknown addresses.
-- ============================================================================

create or replace function public.find_teacher_by_email(p_email text)
returns table (id uuid, full_name text, email text)
language sql stable security definer set search_path = public as $$
  select u.id, u.full_name, u.email
  from public.users u
  where lower(u.email) = lower(trim(p_email))
    and u.role = 'teacher'
  limit 1
$$;

--  Only a signed-in school admin (or Haaraya staff) has any use for this.
revoke all on function public.find_teacher_by_email(text) from public, anon;
grant execute on function public.find_teacher_by_email(text) to authenticated;
