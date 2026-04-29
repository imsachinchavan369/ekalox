alter table public.products
  add column if not exists customization jsonb not null default '{}'::jsonb,
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

update public.products
set customization = jsonb_strip_nulls(jsonb_build_object(
  'heroImage', hero_image_url,
  'heroImageUrl', hero_image_url,
  'heroTitle', hero_title,
  'heroSubtitle', hero_subtitle,
  'badgeText', badge_text,
  'productTheme', product_theme,
  'galleryImages', preview_gallery,
  'previewGallery', preview_gallery,
  'includes', included_items,
  'includedItems', included_items,
  'features', feature_blocks,
  'featureBlocks', feature_blocks,
  'landingDescription', landing_description,
  'isFeatured', is_featured,
  'isVerifiedByEkalox', is_verified_by_ekalox
))
where customization = '{}'::jsonb
  and (
    hero_image_url is not null
    or hero_title is not null
    or hero_subtitle is not null
    or badge_text is not null
    or product_theme is not null
    or preview_gallery <> '[]'::jsonb
    or included_items <> '[]'::jsonb
    or feature_blocks <> '[]'::jsonb
    or landing_description is not null
    or is_featured = true
    or is_verified_by_ekalox = true
  );
