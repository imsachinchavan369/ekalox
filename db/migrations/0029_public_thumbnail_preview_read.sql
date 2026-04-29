-- Allow public preview access for product/reel thumbnails only.
-- Downloadable product files remain protected by the downloads-specific policies.

drop policy if exists "ekalox_thumbnails_public_read" on storage.objects;
create policy "ekalox_thumbnails_public_read"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'ekalox-uploads'
  and (storage.foldername(name))[2] = 'thumbnails'
);
