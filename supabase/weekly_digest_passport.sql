-- ============================================================================
-- Haaraya — weekly parent email: passport page thumbnail
-- Adds to each child in weekly_parent_digest():
--   level        current level number (1–12)
--   cover_color  passport cover (green | blue | red | beige)
--   page         one status per book at that level, in book order:
--                'c' complete · 'r' reading · 'n' not started
-- Also adds next.about (About this book text). Everything else is unchanged.
-- Run in Supabase SQL Editor. Idempotent.
-- ============================================================================
create or replace function public.weekly_parent_digest()
returns table (email text, full_name text, email_token uuid, children jsonb)
language sql stable security definer set search_path = public as $$
  with since as (select now() - interval '7 days' as t)
  select u.email, u.full_name, u.email_token,
    jsonb_agg(jsonb_build_object(
      'name', coalesce(nullif(c.display_name, ''), c.first_name),
      'books', coalesce((select jsonb_agg(b.title order by rp.completed_at)
                 from reading_progress rp join books b on b.id = rp.book_id
                 where rp.child_id = c.id and rp.completed_at >= (select t from since)), '[]'::jsonb),
      'quiz_taken',  (select count(*) from reading_check_results r where r.child_id = c.id and r.created_at >= (select t from since)),
      'quiz_passed', (select count(*) from reading_check_results r where r.child_id = c.id and r.passed and r.created_at >= (select t from since)),
      'quiz_pct',    (select round(100.0 * sum(r.score) / nullif(sum(r.total), 0))
                      from reading_check_results r where r.child_id = c.id and r.created_at >= (select t from since)),
      'days', (select count(distinct d) from (
                 select rp.updated_at::date d from reading_progress rp where rp.child_id = c.id and rp.updated_at >= (select t from since)
                 union select r.created_at::date from reading_check_results r where r.child_id = c.id and r.created_at >= (select t from since)) x),
      'stamps', (select count(*) from passport_stamps s where s.child_id = c.id and s.earned_at >= (select t from since)),
      'stamps_total', (select count(*) from passport_stamps s where s.child_id = c.id),
      'odyssey', (select count(*) from odyssey_book_progress o
                  where o.status = 'complete' and o.completed_at >= (select t from since)
                    and (o.child_id = c.id or (o.child_id is null and o.user_id = u.auth_uid))),
      'next', (select jsonb_build_object('code', b.book_code, 'title', b.title,
                        'about', (select a.about_text from about_pages a where a.book_code = b.book_code limit 1))
               from books b join levels l on l.id = c.current_level_id
               where b.level::text = l.level_number::text
                 and not exists (select 1 from reading_progress rp
                                 where rp.child_id = c.id and rp.book_id = b.id and rp.status = 'completed')
               order by b.book_code limit 1),
      'level', (select l.level_number from levels l where l.id = c.current_level_id),
      'cover_color', coalesce(c.passport_color, 'green'),
      'page', coalesce((
        select jsonb_agg(
                 case when rp.status = 'completed' then 'c'
                      when rp.book_id is not null  then 'r'
                      else 'n' end
                 order by b.book_code)
        from books b
        join levels l on l.id = c.current_level_id and b.level::text = l.level_number::text
        left join reading_progress rp on rp.child_id = c.id and rp.book_id = b.id
      ), '[]'::jsonb)
    ) order by c.created_at) as children
  from users u
  join children c on c.parent_user_id = u.id
  where u.role = 'parent' and u.weekly_email and u.auth_uid is not null
    and u.email not ilike '%demo%'
  group by u.id, u.email, u.full_name, u.email_token
$$;
revoke all on function public.weekly_parent_digest() from public, anon, authenticated;
grant execute on function public.weekly_parent_digest() to service_role;

-- Check: each child now has level, cover_color and a page array
--   select email, jsonb_pretty(children) from public.weekly_parent_digest() limit 2;
