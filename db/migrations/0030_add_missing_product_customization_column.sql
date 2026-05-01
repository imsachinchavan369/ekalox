alter table public.products
  add column if not exists customization jsonb default '{}'::jsonb;

-- Replace old Supabase URLs manually with R2 URLs for existing products.
