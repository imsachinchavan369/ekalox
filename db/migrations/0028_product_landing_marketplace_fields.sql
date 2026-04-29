alter table public.products
  add column if not exists hero_title text,
  add column if not exists hero_subtitle text,
  add column if not exists hero_image_url text,
  add column if not exists badge_text text,
  add column if not exists product_theme text,
  add column if not exists preview_gallery jsonb not null default '[]'::jsonb,
  add column if not exists included_items jsonb not null default '[]'::jsonb,
  add column if not exists feature_blocks jsonb not null default '[]'::jsonb,
  add column if not exists landing_description text,
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_verified_by_ekalox boolean not null default false;

create index if not exists products_is_featured_idx
  on public.products (is_featured)
  where is_featured = true;
