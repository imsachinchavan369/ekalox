-- Fixes:
-- 1) Public reel feed signed URL generation failing due missing anon read policy on storage objects.
-- 2) Auth sync upsert failing on public.users / public.creator_profiles due missing write policies.

-- -----------------------------
-- storage.objects: allow public read for reel videos only
-- -----------------------------
drop policy if exists "ekalox_reels_public_read" on storage.objects;
create policy "ekalox_reels_public_read"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'ekalox-uploads'
  and (storage.foldername(name))[2] = 'reels'
);

-- -----------------------------
-- public.users: allow authenticated user to upsert own row
-- -----------------------------
alter table public.users enable row level security;

drop policy if exists "users_insert_own_auth_row" on public.users;
create policy "users_insert_own_auth_row"
on public.users
for insert
to authenticated
with check (
  id = auth.uid()
  and auth_user_id = auth.uid()
);

drop policy if exists "users_update_own_auth_row" on public.users;
create policy "users_update_own_auth_row"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and auth_user_id = auth.uid()
);

-- -----------------------------
-- public.creator_profiles: allow authenticated user to upsert own profile row
-- -----------------------------
alter table public.creator_profiles enable row level security;

drop policy if exists "creator_profiles_insert_own" on public.creator_profiles;
create policy "creator_profiles_insert_own"
on public.creator_profiles
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "creator_profiles_update_own" on public.creator_profiles;
create policy "creator_profiles_update_own"
on public.creator_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
