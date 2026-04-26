-- Public read-only policies for reel/product browsing

alter table public.products enable row level security;
alter table public.products force row level security;

drop policy if exists "products_public_feed_read" on public.products;
create policy "products_public_feed_read"
on public.products
for select
to anon, authenticated
using (status in ('draft', 'approved'));

alter table public.product_reels enable row level security;
alter table public.product_reels force row level security;

drop policy if exists "product_reels_public_feed_read" on public.product_reels;
create policy "product_reels_public_feed_read"
on public.product_reels
for select
to anon, authenticated
using (true);

alter table public.creator_profiles enable row level security;

drop policy if exists "creator_profiles_public_read" on public.creator_profiles;
create policy "creator_profiles_public_read"
on public.creator_profiles
for select
to anon, authenticated
using (true);

alter table public.users enable row level security;

drop policy if exists "users_public_read_basic" on public.users;
create policy "users_public_read_basic"
on public.users
for select
to anon, authenticated
using (true);
