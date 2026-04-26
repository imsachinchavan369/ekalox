-- Idempotent core upload-to-public-display repair.
-- Safe to run after 0019, including on databases where an older 0019 already ran.

alter table public.creator_profiles
  add column if not exists display_name text,
  add column if not exists username text,
  add column if not exists avatar_url text;

update public.creator_profiles cp
set
  display_name = coalesce(cp.display_name, u.display_name, cp.handle),
  username = coalesce(cp.username, cp.handle, u.username),
  avatar_url = coalesce(cp.avatar_url, u.avatar_url)
from public.users u
where cp.user_id = u.id;

create unique index if not exists idx_creator_profiles_username_unique
  on public.creator_profiles (username)
  where username is not null;

update public.products
set
  visibility = coalesce(visibility, 'public'),
  verification_status = coalesce(verification_status, 'unverified'),
  moderation_status = coalesce(moderation_status, 'clean');

update public.products
set
  status = 'published',
  visibility = 'public',
  verification_status = coalesce(verification_status, 'unverified'),
  moderation_status = coalesce(moderation_status, 'clean')
where status = 'approved'
  and is_archived = false
  and coalesce(moderation_status, 'clean') not in ('removed', 'under_review', 'flagged');

update public.products
set
  status = 'published',
  visibility = 'public',
  verification_status = coalesce(verification_status, 'unverified'),
  moderation_status = coalesce(moderation_status, 'clean')
where status = 'pending_review'
  and is_archived = false
  and coalesce(moderation_status, 'clean') not in ('removed', 'under_review', 'flagged');

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
