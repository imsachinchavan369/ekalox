-- Admin access foundation using public.users.role

alter table public.users
  add column if not exists role text;

update public.users
set role = 'user'
where role is null or btrim(role) = '';

update public.users
set role = 'creator'
where role = 'user'
  and exists (
    select 1
    from public.creator_profiles cp
    where cp.user_id = public.users.id
  );

alter table public.users
  alter column role set default 'user';

alter table public.users
  alter column role set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_role_allowed_values'
  ) then
    alter table public.users
      add constraint users_role_allowed_values
      check (role in ('user', 'creator', 'admin'));
  end if;
end $$;
