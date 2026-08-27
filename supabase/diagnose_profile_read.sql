-- 1. Is RLS on, and which policies exist on public.users?
select relname, relrowsecurity
from pg_class where relname = 'users' and relnamespace = 'public'::regnamespace;

select policyname, cmd, qual
from pg_policies
where schemaname = 'public' and tablename = 'users';

-- 2. Does the `authenticated` role have table-level SELECT at all?
--    (RLS filters rows; without this grant the role cannot reach the table.)
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'users'
order by grantee, privilege_type;

-- 3. Do the helper functions exist?
select proname, prosecdef as is_security_definer
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('current_user_id','current_user_role',
                  'my_admin_school_ids','my_teacher_school_ids');

-- 4. THE REAL TEST — read the row as your signed-in session would.
set local role authenticated;
set local request.jwt.claims = '{"sub":"f62618ae-9d50-4889-88a8-04a17aeec3e1","role":"authenticated"}';

select id, email, role from public.users where auth_uid = auth.uid();

reset role;
