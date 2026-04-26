create table if not exists public.seller_earnings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users(id) on delete restrict,
  buyer_id uuid not null references public.users(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  order_id uuid not null unique references public.orders(id) on delete restrict,
  final_price numeric(12, 2) not null default 0 check (final_price >= 0),
  base_price numeric(12, 2) not null default 0 check (base_price >= 0),
  gst_amount numeric(12, 2) not null default 0 check (gst_amount >= 0),
  platform_fee numeric(12, 2) not null default 0 check (platform_fee >= 0),
  seller_earning numeric(12, 2) not null default 0 check (seller_earning >= 0),
  currency char(3) not null default 'INR',
  payment_status text not null default 'paid' check (payment_status in ('paid', 'pending', 'refunded')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_seller_earnings_seller_id
  on public.seller_earnings (seller_id, created_at desc);

create index if not exists idx_seller_earnings_product_id
  on public.seller_earnings (product_id);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('payment_success', 'payment_failed', 'new_sale', 'download_ready', 'system_alert')),
  title text not null,
  message text not null,
  is_read boolean not null default false,
  related_product_id uuid references public.products(id) on delete set null,
  related_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_notifications_user_id
  on public.notifications (user_id, is_read, created_at desc);

alter table public.seller_earnings enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "seller_earnings_select_own" on public.seller_earnings;
create policy "seller_earnings_select_own"
on public.seller_earnings
for select
to authenticated
using (seller_id = auth.uid());

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
on public.notifications
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "notifications_update_own_read_state" on public.notifications;
create policy "notifications_update_own_read_state"
on public.notifications
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

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
begin
  select
    o.id,
    o.buyer_user_id,
    o.product_id,
    o.total_price_cents,
    o.currency_code,
    o.status,
    cp.user_id as seller_id,
    p.title as product_title
  into v_order
  from public.orders o
  join public.creator_profiles cp on cp.id = o.creator_profile_id
  join public.products p on p.id = o.product_id
  where o.id = p_order_id
    and o.buyer_user_id = auth.uid()
    and o.status = 'paid';

  if v_order.id is null then
    raise exception 'Paid order not found';
  end if;

  v_final_price := round((v_order.total_price_cents::numeric / 100), 0);
  v_base_price := round((v_final_price / 1.18), 0);
  v_gst_amount := round((v_final_price - (v_final_price / 1.18)), 0);
  v_platform_fee := round(((v_final_price / 1.18) * 0.20), 0);
  v_seller_earning := round(((v_final_price / 1.18) - ((v_final_price / 1.18) * 0.20)), 0);

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

create or replace function public.record_failed_payment_notification(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order record;
begin
  select id, buyer_user_id, product_id
  into v_order
  from public.orders
  where id = p_order_id
    and buyer_user_id = auth.uid()
    and status in ('pending', 'cancelled');

  if v_order.id is null then
    raise exception 'Order not found';
  end if;

  update public.orders
  set status = 'cancelled'
  where id = p_order_id
    and buyer_user_id = auth.uid()
    and status = 'pending';

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
    'payment_failed',
    'Payment failed',
    'Payment failed or cancelled.',
    v_order.product_id,
    v_order.id
  where not exists (
    select 1
    from public.notifications n
    where n.user_id = v_order.buyer_user_id
      and n.related_order_id = v_order.id
      and n.type = 'payment_failed'
  );
end;
$$;

grant execute on function public.record_paid_order_earning_and_notifications(uuid) to authenticated;
grant execute on function public.record_failed_payment_notification(uuid) to authenticated;
