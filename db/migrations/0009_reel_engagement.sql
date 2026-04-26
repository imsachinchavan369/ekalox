-- Real engagement state for reel products and creator storefronts.
-- Counts start at zero and change only through authenticated user actions.

create table if not exists public.reel_likes (
  user_id uuid not null references public.users(id) on delete cascade,
  reel_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, reel_id)
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reel_likes' and column_name = 'product_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'reel_likes' and column_name = 'reel_id'
  ) then
    alter table public.reel_likes rename column product_id to reel_id;
  end if;
end $$;

create index if not exists idx_reel_likes_reel_id
  on public.reel_likes (reel_id);

create table if not exists public.reel_reviews (
  user_id uuid not null references public.users(id) on delete cascade,
  reel_id uuid not null references public.products(id) on delete cascade,
  rating numeric(2, 1) not null check (rating >= 0 and rating <= 5),
  text text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, reel_id)
);

create index if not exists idx_reel_reviews_reel_id
  on public.reel_reviews (reel_id);

create table if not exists public.creator_follows (
  follower_id uuid not null references public.users(id) on delete cascade,
  creator_id uuid not null references public.creator_profiles(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (follower_id, creator_id)
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'creator_follows' and column_name = 'follower_user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'creator_follows' and column_name = 'follower_id'
  ) then
    alter table public.creator_follows rename column follower_user_id to follower_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'creator_follows' and column_name = 'creator_profile_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'creator_follows' and column_name = 'creator_id'
  ) then
    alter table public.creator_follows rename column creator_profile_id to creator_id;
  end if;
end $$;

create index if not exists idx_creator_follows_creator_id
  on public.creator_follows (creator_id);

create table if not exists public.reel_downloads (
  user_id uuid not null references public.users(id) on delete cascade,
  reel_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, reel_id)
);

create index if not exists idx_reel_downloads_reel_id
  on public.reel_downloads (reel_id);

alter table public.reel_likes enable row level security;
alter table public.reel_likes force row level security;

drop policy if exists "reel_likes_public_read" on public.reel_likes;
create policy "reel_likes_public_read"
on public.reel_likes
for select
to anon, authenticated
using (true);

drop policy if exists "reel_likes_insert_own" on public.reel_likes;
create policy "reel_likes_insert_own"
on public.reel_likes
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "reel_likes_delete_own" on public.reel_likes;
create policy "reel_likes_delete_own"
on public.reel_likes
for delete
to authenticated
using (user_id = auth.uid());

alter table public.reel_reviews enable row level security;
alter table public.reel_reviews force row level security;

drop policy if exists "reel_reviews_public_read" on public.reel_reviews;
create policy "reel_reviews_public_read"
on public.reel_reviews
for select
to anon, authenticated
using (true);

drop policy if exists "reel_reviews_insert_own" on public.reel_reviews;
create policy "reel_reviews_insert_own"
on public.reel_reviews
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "reel_reviews_update_own" on public.reel_reviews;
create policy "reel_reviews_update_own"
on public.reel_reviews
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "reel_reviews_delete_own" on public.reel_reviews;
create policy "reel_reviews_delete_own"
on public.reel_reviews
for delete
to authenticated
using (user_id = auth.uid());

alter table public.creator_follows enable row level security;
alter table public.creator_follows force row level security;

drop policy if exists "creator_follows_public_read" on public.creator_follows;
create policy "creator_follows_public_read"
on public.creator_follows
for select
to anon, authenticated
using (true);

drop policy if exists "creator_follows_insert_own" on public.creator_follows;
create policy "creator_follows_insert_own"
on public.creator_follows
for insert
to authenticated
with check (follower_id = auth.uid());

drop policy if exists "creator_follows_delete_own" on public.creator_follows;
create policy "creator_follows_delete_own"
on public.creator_follows
for delete
to authenticated
using (follower_id = auth.uid());

alter table public.reel_downloads enable row level security;
alter table public.reel_downloads force row level security;

drop policy if exists "reel_downloads_public_read" on public.reel_downloads;
create policy "reel_downloads_public_read"
on public.reel_downloads
for select
to anon, authenticated
using (true);

drop policy if exists "reel_downloads_insert_own" on public.reel_downloads;
create policy "reel_downloads_insert_own"
on public.reel_downloads
for insert
to authenticated
with check (user_id = auth.uid());
