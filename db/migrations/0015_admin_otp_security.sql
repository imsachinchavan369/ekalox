-- Admin OTP security foundation

create table if not exists public.admin_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  otp_hash text not null,
  attempts_remaining integer not null default 5,
  expires_at timestamptz not null,
  last_sent_at timestamptz not null default timezone('utc', now()),
  verified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_admin_otp_challenges_user_id
  on public.admin_otp_challenges (user_id);

create index if not exists idx_admin_otp_challenges_expires_at
  on public.admin_otp_challenges (expires_at);

alter table public.admin_otp_challenges enable row level security;
alter table public.admin_otp_challenges force row level security;

drop policy if exists "admin_otp_challenges_no_client_access" on public.admin_otp_challenges;
create policy "admin_otp_challenges_no_client_access"
on public.admin_otp_challenges
for all
to authenticated
using (false)
with check (false);
