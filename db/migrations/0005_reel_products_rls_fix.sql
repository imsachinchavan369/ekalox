-- Fix: reel upload fails on products RLS insert
-- Context: code inserts into products first, then product_reels.
-- If products RLS is enabled (manually or via dashboard) without insert policy,
-- upload fails before reel row can be created.

-- Keep products RLS enabled with explicit creator-ownership policies.
alter table public.products enable row level security;
alter table public.products force row level security;

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
      and cp.user_id = auth.uid()
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
    where cp.id = creator_profile_id
      and cp.user_id = auth.uid()
  )
);

-- Defensive policy in case creator_profiles RLS was enabled manually.
drop policy if exists "creator_profiles_select_own" on public.creator_profiles;
create policy "creator_profiles_select_own"
on public.creator_profiles
for select
to authenticated
using (user_id = auth.uid());
