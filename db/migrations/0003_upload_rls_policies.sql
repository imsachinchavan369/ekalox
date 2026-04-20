-- RLS policies for protected uploads
-- Goal:
-- 1) authenticated users can upload only into their own folder in bucket ekalox-uploads
-- 2) authenticated users can insert/select only their own metadata rows in public.uploads

-- -----------------------------
-- uploads table policies
-- -----------------------------
alter table public.uploads enable row level security;

alter table public.uploads force row level security;

drop policy if exists "uploads_insert_own" on public.uploads;
create policy "uploads_insert_own"
on public.uploads
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "uploads_select_own" on public.uploads;
create policy "uploads_select_own"
on public.uploads
for select
to authenticated
using (user_id = auth.uid());

-- -----------------------------
-- storage.objects policies (bucket: ekalox-uploads)
-- -----------------------------
drop policy if exists "ekalox_upload_insert_own_folder" on storage.objects;
create policy "ekalox_upload_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ekalox-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "ekalox_upload_select_own_folder" on storage.objects;
create policy "ekalox_upload_select_own_folder"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ekalox-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "ekalox_upload_delete_own_folder" on storage.objects;
create policy "ekalox_upload_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'ekalox-uploads'
  and (storage.foldername(name))[1] = auth.uid()::text
);
