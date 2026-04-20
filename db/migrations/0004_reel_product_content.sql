-- Minimal reel-first content layer for EKALOX

create extension if not exists pgcrypto;

create table if not exists public.product_reels (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  creator_user_id uuid not null references public.users(id) on delete cascade,
  reel_video_path text not null,
  thumbnail_path text,
  caption text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_product_reels_creator_user_id
  on public.product_reels (creator_user_id);

create index if not exists idx_product_reels_product_id
  on public.product_reels (product_id);

create table if not exists public.product_download_files (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  creator_user_id uuid not null references public.users(id) on delete cascade,
  storage_path text not null,
  original_name text,
  mime_type text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_product_download_files_product_id
  on public.product_download_files (product_id);

create index if not exists idx_product_download_files_creator_user_id
  on public.product_download_files (creator_user_id);

alter table public.product_reels enable row level security;
alter table public.product_reels force row level security;

drop policy if exists "product_reels_insert_own" on public.product_reels;
create policy "product_reels_insert_own"
on public.product_reels
for insert
to authenticated
with check (creator_user_id = auth.uid());

drop policy if exists "product_reels_select_own" on public.product_reels;
create policy "product_reels_select_own"
on public.product_reels
for select
to authenticated
using (creator_user_id = auth.uid());

alter table public.product_download_files enable row level security;
alter table public.product_download_files force row level security;

drop policy if exists "product_download_files_insert_own" on public.product_download_files;
create policy "product_download_files_insert_own"
on public.product_download_files
for insert
to authenticated
with check (creator_user_id = auth.uid());

drop policy if exists "product_download_files_select_own" on public.product_download_files;
create policy "product_download_files_select_own"
on public.product_download_files
for select
to authenticated
using (creator_user_id = auth.uid());
