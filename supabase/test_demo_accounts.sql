-- Test each demo account's profile read under its OWN session.
-- Every row must come back with a role, and non-zero counts where expected.

do $$
declare
  r record;
  uid uuid;
  got record;
begin
  for r in
    select au.id, au.email
    from auth.users au
    where au.email like 'demo.%@haaraya-demo.com'
    order by au.email
  loop
    execute format('set local role authenticated');
    execute format('set local request.jwt.claims = %L',
      json_build_object('sub', r.id, 'role', 'authenticated')::text);

    select count(*) into got from public.users where auth_uid = auth.uid();
    raise notice 'ACCOUNT % -> profile rows: %', r.email, got.count;

    reset role;
  end loop;
end $$;

-- Plain per-account summary (runs as owner, so it always shows the truth).
select
  au.email,
  pu.role,
  pu.full_name,
  (select count(*) from public.children c        where c.parent_user_id = pu.id) as own_children,
  (select count(*) from public.schools s         where s.admin_user_id  = pu.id) as admin_of_schools,
  (select count(*) from public.teacher_school_links l where l.teacher_user_id = pu.id) as teacher_links,
  (select count(*) from public.subscriptions sub where sub.owner_user_id = pu.id) as own_subscriptions
from auth.users au
left join public.users pu on pu.auth_uid = au.id
where au.email like 'demo.%@haaraya-demo.com'
order by au.email;
