alter table public.products
  add column if not exists customization jsonb default '{}'::jsonb;
