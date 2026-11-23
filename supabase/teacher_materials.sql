-- ============================================================
-- Haaraya — teacher materials (worksheet and teacher guide PDFs)
--
-- The 24 showcase PDFs live in a PRIVATE storage bucket. Nobody reads
-- them directly: the teacher-material Edge Function fetches the file,
-- stamps the school code and a download code on every page, and logs
-- the download in print_log (paper = 'ws-pdf' or 'tg-pdf').
-- Path: teacher-materials/<book code>/worksheet.pdf | guide.pdf
-- ============================================================
insert into storage.buckets (id, name, public)
values ('teacher-materials', 'teacher-materials', false)
on conflict (id) do update set public = false;

-- Haaraya admins may add or replace files (future uploads).
drop policy if exists teacher_materials_admin_write on storage.objects;
create policy teacher_materials_admin_write on storage.objects
  for all to authenticated
  using (bucket_id = 'teacher-materials' and public.gemmanti_is_haaraya())
  with check (bucket_id = 'teacher-materials' and public.gemmanti_is_haaraya());

-- One-off: lets the demo teacher account upload the first 24 files.
-- Dropped straight after the upload (see teacher_materials_upload_done).
drop policy if exists teacher_materials_seed_upload on storage.objects;
create policy teacher_materials_seed_upload on storage.objects
  for insert to authenticated
  with check (bucket_id = 'teacher-materials' and (auth.jwt() ->> 'email') = 'demo.teacher@haaraya-demo.com');

-- print_log also records worksheet and guide downloads.
alter table public.print_log drop constraint if exists print_log_paper_check;
alter table public.print_log add constraint print_log_paper_check
  check (paper in ('a4', 'letter', 'ws-pdf', 'tg-pdf'));

-- Issue a download code for a worksheet or teacher guide PDF.
-- Teachers and school admins of a Haaraya school, and Haaraya admins.
create or replace function public.issue_material_code(p_book text, p_kind text)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_user uuid := public.current_user_id();
  v_role text := public.current_user_role();
  v_school uuid; v_name text; v_scode text; v_code text; i int;
begin
  if v_user is null then raise exception 'Please sign in to download.'; end if;
  if p_kind not in ('worksheet', 'guide') then raise exception 'Unknown material.'; end if;
  if coalesce(p_book, '') = '' then raise exception 'No book chosen.'; end if;
  if v_role = 'haaraya_admin' then
    v_school := null;
  elsif v_role in ('teacher', 'school_admin') then
    select s.id into v_school from public.schools s where s.admin_user_id = v_user limit 1;
    if v_school is null then
      select cl.school_id into v_school from public.classrooms cl where cl.teacher_user_id = v_user limit 1;
    end if;
    if v_school is null then raise exception 'Downloads are for staff of a Haaraya school.'; end if;
  else
    raise exception 'Worksheets and teacher guides are for teachers and school admins.';
  end if;
  select name into v_name from public.schools where id = v_school;
  v_scode := case when v_school is null then 'HAAR' else public.print_school_code(v_school) end;
  for i in 1..6 loop
    v_code := 'HX-' || upper(translate(substr(md5(random()::text || clock_timestamp()::text || i::text), 1, 6), '01', 'XY'));
    begin
      insert into public.print_log (code, school_id, school_code, user_id, book_code, paper)
      values (v_code, v_school, v_scode, v_user, p_book, case p_kind when 'worksheet' then 'ws-pdf' else 'tg-pdf' end);
      exit;
    exception when unique_violation then
      if i = 6 then raise; end if;
    end;
  end loop;
  return jsonb_build_object('code', v_code, 'school_code', v_scode, 'school_name', coalesce(v_name, 'Haaraya Education'));
end $$;
grant execute on function public.issue_material_code(text, text) to authenticated;
