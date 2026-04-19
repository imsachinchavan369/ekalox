-- EKALOX initial schema (phase 1 foundation)
-- Postgres / Supabase compatible

create extension if not exists pgcrypto;

-- ----------
-- Enums
-- ----------
create type public.product_status as enum (
  'draft',
  'pending_review',
  'approved',
  'rejected'
);

create type public.cta_type as enum (
  'buy',
  'free',
  'install'
);

create type public.order_status as enum (
  'pending',
  'paid',
  'fulfilled',
  'cancelled',
  'refunded'
);

create type public.review_decision as enum (
  'approved',
  'rejected',
  'changes_requested'
);

create type public.asset_kind as enum (
  'file',
  'license',
  'external_link'
);

-- ----------
-- Timestamp helper
-- ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ----------
-- users
-- ----------
create table public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  username text unique,
  email text not null unique,
  display_name text not null,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

-- ----------
-- creator_profiles
-- ----------
create table public.creator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  handle text not null unique,
  bio text,
  website_url text,
  payout_email text,
  is_verified boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger trg_creator_profiles_updated_at
before update on public.creator_profiles
for each row execute function public.set_updated_at();

-- ----------
-- products
-- ----------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  creator_profile_id uuid not null references public.creator_profiles(id) on delete restrict,
  title text not null,
  slug text not null unique,
  summary text,
  description text not null,
  category text not null,
  tags text[] not null default '{}',
  status public.product_status not null default 'draft',
  cta_type public.cta_type not null default 'buy',
  price_cents integer not null default 0 check (price_cents >= 0),
  currency_code char(3) not null default 'USD',
  cover_image_url text,
  metadata jsonb not null default '{}'::jsonb,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint products_free_must_be_zero_price
    check (cta_type <> 'free' or price_cents = 0)
);

create index idx_products_creator_profile_id on public.products (creator_profile_id);
create index idx_products_status on public.products (status);
create index idx_products_cta_type on public.products (cta_type);
create index idx_products_category on public.products (category);

create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- ----------
-- product_videos
-- ----------
create table public.product_videos (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  video_url text not null,
  provider text not null,
  thumbnail_url text,
  duration_seconds integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index idx_product_videos_product_id on public.product_videos (product_id);

-- ----------
-- product_assets
-- ----------
create table public.product_assets (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  asset_kind public.asset_kind not null default 'file',
  file_name text,
  storage_path text,
  external_url text,
  file_size_bytes bigint,
  checksum_sha256 text,
  is_primary boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  constraint product_assets_location_required
    check (storage_path is not null or external_url is not null)
);

create index idx_product_assets_product_id on public.product_assets (product_id);

-- ----------
-- orders
-- ----------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_user_id uuid not null references public.users(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  creator_profile_id uuid not null references public.creator_profiles(id) on delete restrict,
  status public.order_status not null default 'pending',
  unit_price_cents integer not null check (unit_price_cents >= 0),
  total_price_cents integer not null check (total_price_cents >= 0),
  currency_code char(3) not null default 'USD',
  payment_provider text,
  payment_reference text,
  purchased_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index idx_orders_buyer_user_id on public.orders (buyer_user_id);
create index idx_orders_product_id on public.orders (product_id);
create index idx_orders_status on public.orders (status);

create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- ----------
-- downloads
-- ----------
create table public.downloads (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_asset_id uuid not null references public.product_assets(id) on delete restrict,
  user_id uuid not null references public.users(id) on delete restrict,
  download_token text not null unique,
  download_count integer not null default 0,
  max_downloads integer,
  expires_at timestamptz,
  last_downloaded_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index idx_downloads_order_id on public.downloads (order_id);
create index idx_downloads_user_id on public.downloads (user_id);

-- ----------
-- free_claims
-- ----------
create table public.free_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  claim_source text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, product_id)
);

create index idx_free_claims_product_id on public.free_claims (product_id);

-- ----------
-- admin_reviews
-- ----------
create table public.admin_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  reviewer_user_id uuid not null references public.users(id) on delete restrict,
  decision public.review_decision not null,
  notes text,
  reviewed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index idx_admin_reviews_product_id on public.admin_reviews (product_id);
create index idx_admin_reviews_reviewer_user_id on public.admin_reviews (reviewer_user_id);

-- Compatibility notes:
-- - likes/comments/follows can reference users(id) and products(id)
-- - affiliates can reference creator_profiles(id) and orders(id)
-- - refunds can extend orders via order_status='refunded' + dedicated refund table later
