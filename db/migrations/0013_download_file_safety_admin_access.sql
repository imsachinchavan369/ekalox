-- Tighten direct file-object access for downloadable assets.
-- Creators keep metadata management, but raw verification-style access is reserved for admin and entitled buyers.

drop policy if exists "ekalox_downloads_select_authorized" on storage.objects;
create policy "ekalox_downloads_select_authorized"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ekalox-uploads'
  and (storage.foldername(name))[2] = 'downloads'
  and exists (
    select 1
    from public.product_download_files pdf
    where pdf.storage_path = name
      and (
        exists (
          select 1
          from public.products p
          where p.id = pdf.product_id
            and p.cta_type = 'free'
        )
        or exists (
          select 1
          from public.orders o
          where o.product_id = pdf.product_id
            and o.buyer_user_id = auth.uid()
            and o.status in ('paid', 'fulfilled')
        )
        or exists (
          select 1
          from public.free_claims fc
          where fc.product_id = pdf.product_id
            and fc.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.admin_users au
          where au.user_id = auth.uid()
            and au.is_active = true
        )
      )
  )
);
