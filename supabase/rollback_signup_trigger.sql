drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_auth_user();

select au.email, pu.id as profile_id, pu.role
from auth.users au
left join public.users pu on pu.auth_uid = au.id
where au.email in ('haarayachukwu@gmail.com', 'admin@haarayaeducation.org');
