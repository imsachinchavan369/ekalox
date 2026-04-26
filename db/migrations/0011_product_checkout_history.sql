-- Checkout/download history foundation for profile library and payment integrations.

create table if not exists public.product_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  product_title text not null,
  creator_name text not null,
  event_type text not null check (event_type in ('free_download', 'paid_purchase', 'paid_download')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_product_history_user_id
  on public.product_history (user_id);

create index if not exists idx_product_history_product_id
  on public.product_history (product_id);

alter table public.product_history enable row level security;
alter table public.product_history force row level security;

drop policy if exists "product_history_select_own" on public.product_history;
create policy "product_history_select_own"
on public.product_history
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "product_history_insert_own" on public.product_history;
create policy "product_history_insert_own"
on public.product_history
for insert
to authenticated
with check (user_id = auth.uid());
