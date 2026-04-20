-- EKALOX uploads table (protected upload metadata)

create table if not exists public.uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text,
  bucket text not null,
  storage_path text not null,
  original_name text not null,
  mime_type text,
  size_bytes bigint not null check (size_bytes >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_uploads_user_id on public.uploads (user_id);
create index if not exists idx_uploads_created_at on public.uploads (created_at desc);
