insert into public.users (auth_uid, email, full_name, role)
select au.id, au.email, 'Chukwu Family', 'parent'
from auth.users au
where au.email = 'haarayachukwu@gmail.com'
on conflict (email) do update
  set auth_uid = excluded.auth_uid;

insert into public.users (auth_uid, email, full_name, role)
select au.id, au.email, 'Haaraya Admin', 'haaraya_admin'
from auth.users au
where au.email = 'admin@haarayaeducation.org'
on conflict (email) do update
  set auth_uid = excluded.auth_uid,
      role     = 'haaraya_admin';

insert into public.children
  (parent_user_id, first_name, last_name, display_name, current_level_id, reading_mode)
select
  pu.id, 'Test', 'Reader', 'Test Reader',
  (select id from public.levels order by level_number limit 1),
  'automatic'
from public.users pu
where pu.email = 'haarayachukwu@gmail.com'
  and not exists (
    select 1 from public.children c
    where c.parent_user_id = pu.id and c.display_name = 'Test Reader'
  );

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (auth_uid, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    coalesce(nullif(new.raw_user_meta_data->>'role', ''), 'parent')
  )
  on conflict (email) do update
    set auth_uid = excluded.auth_uid
    where public.users.auth_uid is null;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

select au.email, pu.id as profile_id, pu.role, pu.full_name,
       (select count(*) from public.children c where c.parent_user_id = pu.id) as children
from auth.users au
left join public.users pu on pu.auth_uid = au.id
where au.email in ('haarayachukwu@gmail.com', 'admin@haarayaeducation.org');
