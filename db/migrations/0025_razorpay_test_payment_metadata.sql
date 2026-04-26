alter table public.orders
  add column if not exists provider_order_id text,
  add column if not exists provider_payment_id text;

create index if not exists idx_orders_provider_order_id
  on public.orders (provider_order_id);

create or replace function public.mark_order_razorpay_created(
  p_order_id uuid,
  p_provider_order_id text
)
returns table (
  order_id uuid,
  provider_order_id text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.orders o
  set
    payment_provider = 'razorpay_test',
    provider_order_id = p_provider_order_id,
    payment_reference = p_provider_order_id
  where o.id = p_order_id
    and o.buyer_user_id = auth.uid()
    and o.status = 'pending'
  returning o.id, o.provider_order_id;
end;
$$;

create or replace function public.mark_order_razorpay_paid(
  p_order_id uuid,
  p_provider_order_id text,
  p_provider_payment_id text
)
returns table (
  order_id uuid,
  product_id uuid,
  status public.order_status
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.orders o
  set
    status = 'paid',
    payment_provider = 'razorpay_test',
    payment_reference = p_provider_payment_id,
    provider_order_id = p_provider_order_id,
    provider_payment_id = p_provider_payment_id,
    purchased_at = timezone('utc', now())
  where o.id = p_order_id
    and o.buyer_user_id = auth.uid()
    and o.status = 'pending'
    and o.provider_order_id = p_provider_order_id
  returning o.id, o.product_id, o.status;
end;
$$;

grant execute on function public.mark_order_razorpay_created(uuid, text) to authenticated;
grant execute on function public.mark_order_razorpay_paid(uuid, text, text) to authenticated;
