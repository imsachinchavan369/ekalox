-- Purchase/download/review access rules for product detail actions.

alter table public.orders enable row level security;
alter table public.orders force row level security;

drop policy if exists "orders_select_own_purchase_history" on public.orders;
create policy "orders_select_own_purchase_history"
on public.orders
for select
to authenticated
using (buyer_user_id = auth.uid());

drop policy if exists "orders_insert_own_pending_purchase" on public.orders;
create policy "orders_insert_own_pending_purchase"
on public.orders
for insert
to authenticated
with check (buyer_user_id = auth.uid());

alter table public.free_claims enable row level security;
alter table public.free_claims force row level security;

drop policy if exists "free_claims_select_own" on public.free_claims;
create policy "free_claims_select_own"
on public.free_claims
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "free_claims_insert_own" on public.free_claims;
create policy "free_claims_insert_own"
on public.free_claims
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "product_download_files_select_authorized" on public.product_download_files;
create policy "product_download_files_select_authorized"
on public.product_download_files
for select
to authenticated
using (
  creator_user_id = auth.uid()
  or exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.cta_type = 'free'
  )
  or exists (
    select 1
    from public.orders o
    where o.product_id = product_id
      and o.buyer_user_id = auth.uid()
      and o.status in ('paid', 'fulfilled')
  )
  or exists (
    select 1
    from public.free_claims fc
    where fc.product_id = product_id
      and fc.user_id = auth.uid()
  )
);

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
        pdf.creator_user_id = auth.uid()
        or exists (
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
      )
  )
);

drop policy if exists "reel_reviews_insert_own" on public.reel_reviews;
create policy "reel_reviews_insert_own"
on public.reel_reviews
for insert
to authenticated
with check (
  user_id = auth.uid()
  and (
    exists (
      select 1
      from public.free_claims fc
      where fc.product_id = reel_id
        and fc.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.orders o
      where o.product_id = reel_id
        and o.buyer_user_id = auth.uid()
        and o.status in ('paid', 'fulfilled')
    )
  )
);

drop policy if exists "reel_reviews_update_own" on public.reel_reviews;
create policy "reel_reviews_update_own"
on public.reel_reviews
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (
    exists (
      select 1
      from public.free_claims fc
      where fc.product_id = reel_id
        and fc.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.orders o
      where o.product_id = reel_id
        and o.buyer_user_id = auth.uid()
        and o.status in ('paid', 'fulfilled')
    )
  )
);
