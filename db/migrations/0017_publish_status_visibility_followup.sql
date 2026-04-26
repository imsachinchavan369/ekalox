-- Use the committed 'published' enum value after 0016 has completed.
-- EKALOX publishes items immediately, then moderation/trust continues via
-- visibility + verification_status.

update public.products
set status = 'published'
where status = 'approved';

drop policy if exists "products_public_feed_read" on public.products;
create policy "products_public_feed_read"
on public.products
for select
to anon, authenticated
using (
  status = 'published'
  and visibility = 'public'
  and is_archived = false
  and verification_status in ('unverified', 'verified')
);

create index if not exists idx_products_creator_profile_created_at
  on public.products (creator_profile_id, created_at desc);
