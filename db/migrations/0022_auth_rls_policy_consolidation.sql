-- Upload-only creator profile repair.
-- This intentionally does not change public feed/product/profile read policies,
-- admin policies, payment policies, or existing product display logic.

update public.users u
set auth_user_id = au.id
from auth.users au
where u.auth_user_id is null
  and lower(u.email) = lower(au.email);

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.id = auth.uid()
     or u.auth_user_id = auth.uid()
     or lower(u.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  order by
    case
      when u.auth_user_id = auth.uid() then 0
      when u.id = auth.uid() then 1
      else 2
    end
  limit 1
$$;

create or replace function public.is_current_app_user(app_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select app_user_id = auth.uid()
    or app_user_id = public.current_app_user_id()
$$;

alter table public.users enable row level security;

drop policy if exists "users_insert_own_auth_row" on public.users;
create policy "users_insert_own_auth_row"
on public.users
for insert
to authenticated
with check (
  (id = auth.uid() or auth_user_id = auth.uid())
  and lower(email) = lower(coalesce(auth.jwt() ->> 'email', email))
);

drop policy if exists "users_update_own_auth_row" on public.users;
create policy "users_update_own_auth_row"
on public.users
for update
to authenticated
using (
  id = auth.uid()
  or auth_user_id = auth.uid()
  or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
with check (
  auth_user_id = auth.uid()
  and lower(email) = lower(coalesce(auth.jwt() ->> 'email', email))
);

alter table public.creator_profiles enable row level security;

drop policy if exists "creator_profiles_select_own" on public.creator_profiles;
create policy "creator_profiles_select_own"
on public.creator_profiles
for select
to authenticated
using (public.is_current_app_user(user_id));

drop policy if exists "creator_profiles_insert_own" on public.creator_profiles;
create policy "creator_profiles_insert_own"
on public.creator_profiles
for insert
to authenticated
with check (public.is_current_app_user(user_id));

drop policy if exists "creator_profiles_update_own" on public.creator_profiles;
create policy "creator_profiles_update_own"
on public.creator_profiles
for update
to authenticated
using (public.is_current_app_user(user_id))
with check (public.is_current_app_user(user_id));

alter table public.products enable row level security;

drop policy if exists "products_insert_own_creator_profile" on public.products;
create policy "products_insert_own_creator_profile"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1
    from public.creator_profiles cp
    where cp.id = creator_profile_id
      and public.is_current_app_user(cp.user_id)
  )
);

alter table public.product_reels enable row level security;

drop policy if exists "product_reels_insert_own" on public.product_reels;
create policy "product_reels_insert_own"
on public.product_reels
for insert
to authenticated
with check (public.is_current_app_user(creator_user_id));

alter table public.product_download_files enable row level security;

drop policy if exists "product_download_files_insert_own" on public.product_download_files;
create policy "product_download_files_insert_own"
on public.product_download_files
for insert
to authenticated
with check (public.is_current_app_user(creator_user_id));
