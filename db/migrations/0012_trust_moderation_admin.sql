-- Trust, moderation, reporting, and admin controls for EKALOX.

alter table public.products
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'private')),
  add column if not exists verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'under_review', 'verified', 'flagged', 'removed')),
  add column if not exists is_archived boolean not null default false;

create table if not exists public.admin_users (
  user_id uuid primary key references public.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin', 'moderator')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  creator_profile_id uuid references public.creator_profiles(id) on delete set null,
  reason text not null check (reason in ('misleading_content', 'wrong_file', 'spam', 'scam', 'copyright', 'broken_download', 'adult_unsafe', 'other')),
  note text,
  status text not null default 'open' check (status in ('open', 'under_review', 'resolved', 'rejected')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  notification_type text not null check (notification_type in ('report', 'replacement_request')),
  actor_user_id uuid references public.users(id) on delete set null,
  product_id uuid references public.products(id) on delete cascade,
  related_id uuid,
  label text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.file_replacement_requests (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  creator_user_id uuid not null references public.users(id) on delete cascade,
  creator_profile_id uuid references public.creator_profiles(id) on delete set null,
  current_file_id uuid references public.product_download_files(id) on delete set null,
  reason text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  admin_note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.moderation_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references public.users(id) on delete set null,
  product_id uuid references public.products(id) on delete cascade,
  target_user_id uuid references public.users(id) on delete set null,
  action text not null,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.product_visibility_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  changed_by_user_id uuid references public.users(id) on delete set null,
  from_visibility text,
  to_visibility text not null check (to_visibility in ('public', 'private')),
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_reports_product_id on public.reports (product_id);
create index if not exists idx_reports_reporter_user_id on public.reports (reporter_user_id);
create index if not exists idx_reports_status on public.reports (status);
create index if not exists idx_admin_notifications_is_read on public.admin_notifications (is_read);
create index if not exists idx_file_replacement_requests_product_id on public.file_replacement_requests (product_id);
create index if not exists idx_file_replacement_requests_status on public.file_replacement_requests (status);
create index if not exists idx_moderation_logs_product_id on public.moderation_logs (product_id);
create index if not exists idx_product_visibility_history_product_id on public.product_visibility_history (product_id);
create index if not exists idx_products_visibility on public.products (visibility);
create index if not exists idx_products_verification_status on public.products (verification_status);
create index if not exists idx_products_is_archived on public.products (is_archived);

drop policy if exists "products_public_feed_read" on public.products;
create policy "products_public_feed_read"
on public.products
for select
to anon, authenticated
using (
  status in ('draft', 'approved')
  and visibility = 'public'
  and is_archived = false
  and verification_status in ('unverified', 'verified')
);

drop policy if exists "products_update_own_creator_profile" on public.products;
create policy "products_update_own_creator_profile"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.creator_profiles cp
    where cp.id = creator_profile_id
      and cp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.creator_profiles cp
    where cp.id = creator_profile_id
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "products_select_owned_or_entitled" on public.products;
create policy "products_select_owned_or_entitled"
on public.products
for select
to authenticated
using (
  exists (
    select 1
    from public.creator_profiles cp
    where cp.id = creator_profile_id
      and cp.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.orders o
    where o.product_id = id
      and o.buyer_user_id = auth.uid()
      and o.status in ('paid', 'fulfilled')
  )
  or exists (
    select 1
    from public.free_claims fc
    where fc.product_id = id
      and fc.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

drop policy if exists "product_reels_update_own_or_admin" on public.product_reels;
create policy "product_reels_update_own_or_admin"
on public.product_reels
for update
to authenticated
using (
  creator_user_id = auth.uid()
  or exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
)
with check (
  creator_user_id = auth.uid()
  or exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

drop policy if exists "product_reels_select_admin_all" on public.product_reels;
create policy "product_reels_select_admin_all"
on public.product_reels
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

drop policy if exists "product_download_files_select_admin_all" on public.product_download_files;
create policy "product_download_files_select_admin_all"
on public.product_download_files
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

drop policy if exists "creator_profiles_select_admin_all" on public.creator_profiles;
create policy "creator_profiles_select_admin_all"
on public.creator_profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

drop policy if exists "users_select_admin_all" on public.users;
create policy "users_select_admin_all"
on public.users
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

drop policy if exists "orders_select_admin_all" on public.orders;
create policy "orders_select_admin_all"
on public.orders
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

drop policy if exists "free_claims_select_admin_all" on public.free_claims;
create policy "free_claims_select_admin_all"
on public.free_claims
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

alter table public.admin_users enable row level security;
alter table public.admin_users force row level security;

drop policy if exists "admin_users_select_self" on public.admin_users;
create policy "admin_users_select_self"
on public.admin_users
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "admin_users_select_admin_all" on public.admin_users;
create policy "admin_users_select_admin_all"
on public.admin_users
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

alter table public.reports enable row level security;
alter table public.reports force row level security;

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own"
on public.reports
for insert
to authenticated
with check (reporter_user_id = auth.uid());

drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin"
on public.reports
for select
to authenticated
using (
  reporter_user_id = auth.uid()
  or exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

drop policy if exists "reports_update_admin" on public.reports;
create policy "reports_update_admin"
on public.reports
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

alter table public.admin_notifications enable row level security;
alter table public.admin_notifications force row level security;

drop policy if exists "admin_notifications_insert_actor" on public.admin_notifications;
create policy "admin_notifications_insert_actor"
on public.admin_notifications
for insert
to authenticated
with check (actor_user_id = auth.uid());

drop policy if exists "admin_notifications_select_admin" on public.admin_notifications;
create policy "admin_notifications_select_admin"
on public.admin_notifications
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

drop policy if exists "admin_notifications_update_admin" on public.admin_notifications;
create policy "admin_notifications_update_admin"
on public.admin_notifications
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

alter table public.file_replacement_requests enable row level security;
alter table public.file_replacement_requests force row level security;

drop policy if exists "file_replacement_requests_insert_own" on public.file_replacement_requests;
create policy "file_replacement_requests_insert_own"
on public.file_replacement_requests
for insert
to authenticated
with check (creator_user_id = auth.uid());

drop policy if exists "file_replacement_requests_select_own_or_admin" on public.file_replacement_requests;
create policy "file_replacement_requests_select_own_or_admin"
on public.file_replacement_requests
for select
to authenticated
using (
  creator_user_id = auth.uid()
  or exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

drop policy if exists "file_replacement_requests_update_admin" on public.file_replacement_requests;
create policy "file_replacement_requests_update_admin"
on public.file_replacement_requests
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
)
with check (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

alter table public.moderation_logs enable row level security;
alter table public.moderation_logs force row level security;

drop policy if exists "moderation_logs_select_admin" on public.moderation_logs;
create policy "moderation_logs_select_admin"
on public.moderation_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

drop policy if exists "moderation_logs_insert_admin" on public.moderation_logs;
create policy "moderation_logs_insert_admin"
on public.moderation_logs
for insert
to authenticated
with check (
  admin_user_id = auth.uid()
  and exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);

alter table public.product_visibility_history enable row level security;
alter table public.product_visibility_history force row level security;

drop policy if exists "product_visibility_history_insert_own_or_admin" on public.product_visibility_history;
create policy "product_visibility_history_insert_own_or_admin"
on public.product_visibility_history
for insert
to authenticated
with check (
  changed_by_user_id = auth.uid()
  and (
    exists (
      select 1
      from public.products p
      join public.creator_profiles cp on cp.id = p.creator_profile_id
      where p.id = product_id
        and cp.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.admin_users au
      where au.user_id = auth.uid()
        and au.is_active = true
    )
  )
);

drop policy if exists "product_visibility_history_select_own_or_admin" on public.product_visibility_history;
create policy "product_visibility_history_select_own_or_admin"
on public.product_visibility_history
for select
to authenticated
using (
  exists (
    select 1
    from public.products p
    join public.creator_profiles cp on cp.id = p.creator_profile_id
    where p.id = product_id
      and cp.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  )
);
