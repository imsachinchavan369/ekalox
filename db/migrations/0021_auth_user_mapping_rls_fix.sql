-- Repair auth/public user mapping and RLS for creator upload flow.
-- Keeps admin policies intact.

update public.users u
set auth_user_id = au.id
from auth.users au
where u.auth_user_id is null
  and lower(u.email) = lower(au.email);

drop policy if exists "users_insert_own_auth_row" on public.users;
create policy "users_insert_own_auth_row"
on public.users
for insert
to authenticated
with check (
  (id = auth.uid() or auth_user_id = auth.uid())
  and email = (auth.jwt() ->> 'email')
);

drop policy if exists "users_update_own_auth_row" on public.users;
create policy "users_update_own_auth_row"
on public.users
for update
to authenticated
using (
  id = auth.uid()
  or auth_user_id = auth.uid()
  or email = (auth.jwt() ->> 'email')
)
with check (
  auth_user_id = auth.uid()
  and email = (auth.jwt() ->> 'email')
);

drop policy if exists "creator_profiles_select_own" on public.creator_profiles;
create policy "creator_profiles_select_own"
on public.creator_profiles
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = user_id
      and (u.auth_user_id = auth.uid() or u.email = (auth.jwt() ->> 'email'))
  )
);

drop policy if exists "creator_profiles_insert_own" on public.creator_profiles;
create policy "creator_profiles_insert_own"
on public.creator_profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = user_id
      and (u.auth_user_id = auth.uid() or u.email = (auth.jwt() ->> 'email'))
  )
);

drop policy if exists "creator_profiles_update_own" on public.creator_profiles;
create policy "creator_profiles_update_own"
on public.creator_profiles
for update
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = user_id
      and (u.auth_user_id = auth.uid() or u.email = (auth.jwt() ->> 'email'))
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = user_id
      and (u.auth_user_id = auth.uid() or u.email = (auth.jwt() ->> 'email'))
  )
);

drop policy if exists "products_insert_own_creator_profile" on public.products;
create policy "products_insert_own_creator_profile"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1
    from public.creator_profiles cp
    join public.users u on u.id = cp.user_id
    where cp.id = creator_profile_id
      and (cp.user_id = auth.uid() or u.auth_user_id = auth.uid() or u.email = (auth.jwt() ->> 'email'))
  )
);

drop policy if exists "products_select_own_creator_profile" on public.products;
create policy "products_select_own_creator_profile"
on public.products
for select
to authenticated
using (
  exists (
    select 1
    from public.creator_profiles cp
    join public.users u on u.id = cp.user_id
    where cp.id = creator_profile_id
      and (cp.user_id = auth.uid() or u.auth_user_id = auth.uid() or u.email = (auth.jwt() ->> 'email'))
  )
);

drop policy if exists "products_update_own_creator_profile" on public.products;
create policy "products_update_own_creator_profile"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.creator_profiles cp
    join public.users u on u.id = cp.user_id
    where cp.id = creator_profile_id
      and (cp.user_id = auth.uid() or u.auth_user_id = auth.uid() or u.email = (auth.jwt() ->> 'email'))
  )
)
with check (
  exists (
    select 1
    from public.creator_profiles cp
    join public.users u on u.id = cp.user_id
    where cp.id = creator_profile_id
      and (cp.user_id = auth.uid() or u.auth_user_id = auth.uid() or u.email = (auth.jwt() ->> 'email'))
  )
);

drop policy if exists "product_reels_insert_own" on public.product_reels;
create policy "product_reels_insert_own"
on public.product_reels
for insert
to authenticated
with check (
  creator_user_id = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = creator_user_id
      and (u.auth_user_id = auth.uid() or u.email = (auth.jwt() ->> 'email'))
  )
);

drop policy if exists "product_reels_select_own" on public.product_reels;
create policy "product_reels_select_own"
on public.product_reels
for select
to authenticated
using (
  creator_user_id = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = creator_user_id
      and (u.auth_user_id = auth.uid() or u.email = (auth.jwt() ->> 'email'))
  )
);

drop policy if exists "product_download_files_insert_own" on public.product_download_files;
create policy "product_download_files_insert_own"
on public.product_download_files
for insert
to authenticated
with check (
  creator_user_id = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = creator_user_id
      and (u.auth_user_id = auth.uid() or u.email = (auth.jwt() ->> 'email'))
  )
);

drop policy if exists "product_download_files_select_own" on public.product_download_files;
create policy "product_download_files_select_own"
on public.product_download_files
for select
to authenticated
using (
  creator_user_id = auth.uid()
  or exists (
    select 1
    from public.users u
    where u.id = creator_user_id
      and (u.auth_user_id = auth.uid() or u.email = (auth.jwt() ->> 'email'))
  )
);

drop policy if exists "products_public_feed_read" on public.products;
create policy "products_public_feed_read"
on public.products
for select
to anon, authenticated
using (
  status in ('published', 'verified')
  and visibility = 'public'
  and is_archived = false
  and moderation_status not in ('removed', 'under_review')
);
