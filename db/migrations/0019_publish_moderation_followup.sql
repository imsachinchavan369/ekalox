-- Publishing, verification, reporting, moderation, and account safety follow-up.
-- Requires 0016 and 0018 to have committed before this migration runs.

alter table public.products
  alter column status set default 'published';

alter table public.products
  drop constraint if exists products_verification_status_check;

alter table public.products
  add column if not exists moderation_status text not null default 'clean'
    check (moderation_status in ('clean', 'flagged', 'under_review', 'removed')),
  add column if not exists admin_note text,
  add column if not exists moderated_by uuid references public.users(id) on delete set null,
  add column if not exists moderated_at timestamptz;

alter table public.users
  add column if not exists account_safety_status text not null default 'active'
    check (account_safety_status in ('active', 'temporarily_restricted', 'suspended')),
  add column if not exists restricted_reason text,
  add column if not exists restricted_at timestamptz,
  add column if not exists restricted_by text check (restricted_by in ('system', 'admin')),
  add column if not exists restriction_note text;

alter table public.creator_profiles
  add column if not exists display_name text,
  add column if not exists username text,
  add column if not exists avatar_url text;

alter table public.reports
  add column if not exists creator_id uuid references public.users(id) on delete set null;

alter table public.reports
  drop constraint if exists reports_reason_check;

alter table public.reports
  add constraint reports_reason_check
    check (reason in (
      'scam_misleading',
      'wrong_file',
      'broken_download',
      'sexual_content',
      'violence_unsafe',
      'copyright',
      'spam',
      'other',
      'misleading_content',
      'scam',
      'adult_unsafe'
    ));

alter table public.admin_notifications
  drop constraint if exists admin_notifications_notification_type_check;

alter table public.admin_notifications
  add constraint admin_notifications_notification_type_check
    check (notification_type in ('report', 'replacement_request', 'policy_risk', 'verification_request'));

update public.products
set
  visibility = coalesce(visibility, 'public'),
  verification_status = coalesce(verification_status, 'unverified'),
  moderation_status = coalesce(moderation_status, 'clean');

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
  verification_status = case
    when verification_status = 'verified' then 'verified'
    else 'unverified'
  end,
  moderation_status = case
    when verification_status = 'flagged' then 'flagged'
    when verification_status = 'under_review' then 'under_review'
    when verification_status = 'removed' then 'removed'
    when is_archived = true then 'removed'
    else moderation_status
  end,
  visibility = case
    when verification_status in ('flagged', 'under_review', 'removed') or is_archived = true then 'private'
    else visibility
  end,
  status = case
    when status = 'draft' then status
    when verification_status = 'removed' or is_archived = true then 'removed'::public.product_status
    when verification_status = 'under_review' then 'under_review'::public.product_status
    else 'published'::public.product_status
  end;

update public.products
set status = 'published'
where status in ('approved', 'pending_review')
  and is_archived = false
  and moderation_status not in ('removed', 'under_review');

alter table public.products
  add constraint products_verification_status_check
    check (verification_status in (
      'unverified',
      'verification_requested',
      'verified',
      'verification_rejected'
    ));

create index if not exists idx_products_moderation_status on public.products (moderation_status);
create index if not exists idx_users_account_safety_status on public.users (account_safety_status);
create index if not exists idx_reports_creator_id on public.reports (creator_id);

create or replace function public.prevent_non_admin_product_moderation_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
begin
  select exists (
    select 1
    from public.admin_users au
    where au.user_id = auth.uid()
      and au.is_active = true
  ) into is_admin;

  if is_admin then
    return new;
  end if;

  if new.verification_status in ('verified', 'verification_rejected')
    and new.verification_status is distinct from old.verification_status then
    raise exception 'Only admins can approve or reject product verification.';
  end if;

  if new.moderation_status is distinct from old.moderation_status
    or new.admin_note is distinct from old.admin_note
    or new.moderated_by is distinct from old.moderated_by
    or new.moderated_at is distinct from old.moderated_at then
    raise exception 'Only admins can update moderation state.';
  end if;

  if new.status in ('under_review', 'removed', 'verified')
    and new.status is distinct from old.status then
    raise exception 'Only admins can update protected product status.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_products_prevent_non_admin_moderation_update on public.products;
create trigger trg_products_prevent_non_admin_moderation_update
before update on public.products
for each row execute function public.prevent_non_admin_product_moderation_update();

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
