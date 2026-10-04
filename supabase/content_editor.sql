-- ============================================================================
-- Haaraya — staff content editor                        run once, idempotent
-- Backs "Haaraya Content Editor.html". Staff (haaraya_admin) can fix book
-- text, titles, About this book and quiz wording without SQL. Every save is
-- written to content_edits (who, when, old -> new).
-- ============================================================================
begin;

create table if not exists public.content_edits (
  id          bigserial primary key,
  edited_at   timestamptz not null default now(),
  edited_by   uuid references public.users(id) on delete set null,
  book_code   text not null,
  target      text not null,            -- page | about | quiz | title
  field       text not null,
  page_number int,
  old_value   text,
  new_value   text
);
create index if not exists content_edits_book_idx on public.content_edits (book_code, edited_at desc);
alter table public.content_edits enable row level security;   -- no policies: RPC only
revoke all on public.content_edits from anon, authenticated;

-- one book, everything editable ------------------------------------------------
create or replace function public.admin_content_lookup(p_code text)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare c text := upper(btrim(p_code)); b record; out jsonb;
begin
  if not public.is_haaraya_admin() then raise exception 'staff only'; end if;
  select id, book_code, title into b from books where upper(book_code) = c;
  out := jsonb_build_object(
    'book_code', coalesce(b.book_code, c),
    'title', b.title,
    'pages', coalesce((select jsonb_agg(jsonb_build_object(
                'page_number', p.page_number,
                'text', coalesce(p.display_text, p.page_text)) order by p.page_number)
              from book_pages p where p.book_id = b.id), '[]'::jsonb),
    'about', (select to_jsonb(a) from about_pages a
              where a.id = (select page_id from about_page_codes where upper(code) = c)
                 or upper(a.book_code) = c limit 1),
    'quiz',  (select to_jsonb(q) from reading_checks q
              where q.id = (select check_id from reading_check_codes where upper(code) = c)
                 or upper(q.book_code) = c limit 1),
    'edits', coalesce((select jsonb_agg(to_jsonb(e) order by e.edited_at desc) from (
                select e.edited_at, e.target, e.field, e.page_number, e.old_value, e.new_value, u.email as edited_by
                from content_edits e left join users u on u.id = e.edited_by
                where upper(e.book_code) = upper(coalesce(b.book_code, c))
                order by e.edited_at desc limit 50) e), '[]'::jsonb)
  );
  return out;
end $$;

-- save one field -----------------------------------------------------------------
create or replace function public.admin_edit_content(
  p_code text, p_target text, p_field text, p_value text, p_page int default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  c text := upper(btrim(p_code));
  me uuid := (select id from users where auth_uid = auth.uid());
  bid uuid; aid uuid; qid uuid; old text; n int := 0;
  about_ok text[] := array['about_text','read_to_find_out','focus_visible','focus_sound','soundbite',
                           'sound_cue','about_ant_hook','sound_alike_prompt'];
begin
  if not public.is_haaraya_admin() then raise exception 'staff only'; end if;
  select id into bid from books where upper(book_code) = c;
  select page_id  into aid from about_page_codes where upper(code) = c;
  if aid is null then select id into aid from about_pages where upper(book_code) = c; end if;
  select check_id into qid from reading_check_codes where upper(code) = c;
  if qid is null then select id into qid from reading_checks where upper(book_code) = c; end if;

  if p_target = 'page' then
    if bid is null or p_page is null then raise exception 'book page not found'; end if;
    select coalesce(display_text, page_text) into old from book_pages where book_id = bid and page_number = p_page;
    if not found then raise exception 'page % not found', p_page; end if;
    -- display_text keeps editorial line breaks; page_text is the same words on one line
    update book_pages set display_text = p_value,
                          page_text    = btrim(regexp_replace(p_value, '\s+', ' ', 'g'))
     where book_id = bid and page_number = p_page;
    n := 1;

  elsif p_target = 'title' then
    select title into old from books where id = bid;
    update books          set title      = p_value where id = bid;              get diagnostics n = row_count;
    update about_pages    set title      = p_value where id = aid;
    update reading_checks set book_title = p_value where id = qid;
    n := n + (case when aid is not null then 1 else 0 end) + (case when qid is not null then 1 else 0 end);

  elsif p_target = 'about' then
    if aid is null then raise exception 'no About page for %', c; end if;
    if not (p_field = any(about_ok)) then raise exception 'field % cannot be edited', p_field; end if;
    execute format('select %I::text from about_pages where id = $1', p_field) into old using aid;
    execute format('update about_pages set %I = nullif($1, '''') where id = $2', p_field) using p_value, aid;
    n := 1;

  elsif p_target = 'quiz' then
    if qid is null then raise exception 'no reading check for %', c; end if;
    if p_field !~ '^(q[1-3]_(text|a|b|c)(_spoken)?|q[1-3]_correct|write_prompt|write_answer|retry_note)$' then
      raise exception 'field % cannot be edited', p_field;
    end if;
    execute format('select %I::text from reading_checks where id = $1', p_field) into old using qid;
    if p_field like '%\_correct' then
      if p_value not in ('0','1','2') then raise exception 'correct answer must be A, B or C'; end if;
      execute format('update reading_checks set %I = $1::smallint, updated_at = now() where id = $2', p_field) using p_value, qid;
    elsif p_field ~ '^q[1-3]_(text|a|b|c)$' then
      if btrim(coalesce(p_value, '')) = '' then raise exception 'questions and options cannot be blank'; end if;
      execute format('update reading_checks set %I = $1, updated_at = now() where id = $2', p_field) using p_value, qid;
    else
      execute format('update reading_checks set %I = nullif($1, ''''), updated_at = now() where id = $2', p_field) using p_value, qid;
    end if;
    n := 1;
  else
    raise exception 'unknown target %', p_target;
  end if;

  if old is distinct from p_value then
    insert into content_edits (edited_by, book_code, target, field, page_number, old_value, new_value)
    values (me, c, p_target, coalesce(p_field, p_target), p_page, old, p_value);
  end if;
  return jsonb_build_object('updated', n);
end $$;

revoke all on function public.admin_content_lookup(text) from public, anon;
revoke all on function public.admin_edit_content(text, text, text, text, int) from public, anon;
grant execute on function public.admin_content_lookup(text) to authenticated;
grant execute on function public.admin_edit_content(text, text, text, text, int) to authenticated;

commit;

-- Check: expect 1, 2
--   select count(*) from information_schema.tables where table_name = 'content_edits';
--   select count(*) from pg_proc where proname in ('admin_content_lookup','admin_edit_content');
