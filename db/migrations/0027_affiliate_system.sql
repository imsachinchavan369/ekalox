alter table public.products
  add column if not exists affiliate_enabled boolean not null default false;

create index if not exists idx_products_affiliate_enabled
  on public.products (affiliate_enabled)
  where affiliate_enabled = true;

create table if not exists public.order_affiliates (
  id uuid primary key default gen_random_uuid(),
  affiliate_user_id uuid not null references public.users(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_order_affiliates_affiliate_user_id
  on public.order_affiliates (affiliate_user_id, created_at desc);

create index if not exists idx_order_affiliates_product_id
  on public.order_affiliates (product_id);

create table if not exists public.affiliate_earnings (
  id uuid primary key default gen_random_uuid(),
  affiliate_user_id uuid not null references public.users(id) on delete restrict,
  seller_id uuid not null references public.users(id) on delete restrict,
  buyer_id uuid not null references public.users(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  final_price numeric(12, 2) not null default 0 check (final_price >= 0),
  base_price numeric(12, 2) not null default 0 check (base_price >= 0),
  gst_amount numeric(12, 2) not null default 0 check (gst_amount >= 0),
  seller_earning numeric(12, 2) not null default 0 check (seller_earning >= 0),
  affiliate_earning numeric(12, 2) not null default 0 check (affiliate_earning >= 0),
  platform_earning numeric(12, 2) not null default 0 check (platform_earning >= 0),
  payment_fee numeric(12, 2) not null default 0 check (payment_fee >= 0),
  currency char(3) not null default 'INR',
  payment_status text not null default 'paid' check (payment_status in ('paid', 'pending', 'refunded')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_affiliate_earnings_affiliate_user_id
  on public.affiliate_earnings (affiliate_user_id, created_at desc);

create index if not exists idx_affiliate_earnings_product_id
  on public.affiliate_earnings (product_id);

alter table public.order_affiliates enable row level security;
alter table public.affiliate_earnings enable row level security;

drop policy if exists "order_affiliates_select_own" on public.order_affiliates;
create policy "order_affiliates_select_own"
on public.order_affiliates
for select
to authenticated
using (affiliate_user_id = auth.uid());

drop policy if exists "order_affiliates_insert_buyer_order" on public.order_affiliates;
create policy "order_affiliates_insert_buyer_order"
on public.order_affiliates
for insert
to authenticated
with check (
  affiliate_user_id <> auth.uid()
  and exists (
    select 1
    from public.orders o
    join public.products p on p.id = o.product_id
    join public.creator_profiles cp on cp.id = o.creator_profile_id
    where o.id = order_id
      and o.product_id = product_id
      and o.buyer_user_id = auth.uid()
      and o.status = 'pending'
      and p.affiliate_enabled = true
      and cp.user_id <> affiliate_user_id
  )
);

drop policy if exists "affiliate_earnings_select_own" on public.affiliate_earnings;
create policy "affiliate_earnings_select_own"
on public.affiliate_earnings
for select
to authenticated
using (affiliate_user_id = auth.uid());

create or replace function public.record_paid_order_earning_and_notifications(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
  v_final_price numeric(12, 2);
  v_base_price numeric(12, 2);
  v_gst_amount numeric(12, 2);
  v_platform_fee numeric(12, 2);
  v_seller_earning numeric(12, 2);
  v_affiliate_earning numeric(12, 2);
  v_platform_earning numeric(12, 2);
  v_payment_fee numeric(12, 2) := 0;
begin
  select
    o.id,
    o.buyer_user_id,
    o.product_id,
    o.total_price_cents,
    o.currency_code,
    o.status,
    cp.user_id as seller_id,
    p.title as product_title,
    oa.affiliate_user_id
  into v_order
  from public.orders o
  join public.creator_profiles cp on cp.id = o.creator_profile_id
  join public.products p on p.id = o.product_id
  left join public.order_affiliates oa on oa.order_id = o.id
  where o.id = p_order_id
    and o.buyer_user_id = auth.uid()
    and o.status = 'paid';

  if v_order.id is null then
    raise exception 'Paid order not found';
  end if;

  v_final_price := round((v_order.total_price_cents::numeric / 100), 0);
  v_base_price := round((v_final_price / 1.18), 0);
  v_gst_amount := round((v_final_price - (v_final_price / 1.18)), 0);

  if v_order.affiliate_user_id is not null then
    v_seller_earning := round(((v_final_price / 1.18) * 0.60), 0);
    v_affiliate_earning := round(((v_final_price / 1.18) * 0.25), 0);
    v_platform_earning := greatest(round(((v_final_price / 1.18) * 0.15), 0) - v_payment_fee, 0);
    v_platform_fee := v_platform_earning;

    insert into public.affiliate_earnings (
      affiliate_user_id,
      seller_id,
      buyer_id,
      product_id,
      order_id,
      final_price,
      base_price,
      gst_amount,
      seller_earning,
      affiliate_earning,
      platform_earning,
      payment_fee,
      currency,
      payment_status
    )
    values (
      v_order.affiliate_user_id,
      v_order.seller_id,
      v_order.buyer_user_id,
      v_order.product_id,
      v_order.id,
      v_final_price,
      v_base_price,
      v_gst_amount,
      v_seller_earning,
      v_affiliate_earning,
      v_platform_earning,
      v_payment_fee,
      coalesce(v_order.currency_code, 'INR'),
      'paid'
    )
    on conflict (order_id) do nothing;
  else
    v_platform_fee := round(((v_final_price / 1.18) * 0.20), 0);
    v_seller_earning := round(((v_final_price / 1.18) - ((v_final_price / 1.18) * 0.20)), 0);
  end if;

  insert into public.seller_earnings (
    seller_id,
    buyer_id,
    product_id,
    order_id,
    final_price,
    base_price,
    gst_amount,
    platform_fee,
    seller_earning,
    currency,
    payment_status
  )
  values (
    v_order.seller_id,
    v_order.buyer_user_id,
    v_order.product_id,
    v_order.id,
    v_final_price,
    v_base_price,
    v_gst_amount,
    v_platform_fee,
    v_seller_earning,
    coalesce(v_order.currency_code, 'INR'),
    'paid'
  )
  on conflict (order_id) do nothing;

  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    related_product_id,
    related_order_id
  )
  select
    v_order.buyer_user_id,
    'payment_success',
    'Purchase successful',
    'Purchase successful. Your download is ready.',
    v_order.product_id,
    v_order.id
  where not exists (
    select 1
    from public.notifications n
    where n.user_id = v_order.buyer_user_id
      and n.related_order_id = v_order.id
      and n.type = 'payment_success'
  );

  insert into public.notifications (
    user_id,
    type,
    title,
    message,
    related_product_id,
    related_order_id
  )
  select
    v_order.seller_id,
    'new_sale',
    'New sale',
    'You received a new sale.',
    v_order.product_id,
    v_order.id
  where not exists (
    select 1
    from public.notifications n
    where n.user_id = v_order.seller_id
      and n.related_order_id = v_order.id
      and n.type = 'new_sale'
  );
end;
$$;

grant execute on function public.record_paid_order_earning_and_notifications(uuid) to authenticated;
