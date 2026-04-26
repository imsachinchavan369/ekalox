-- Enum-only migration.
-- Run and commit this before 0019 so PostgreSQL can safely use new enum values.

alter type public.product_status add value if not exists 'under_review';
alter type public.product_status add value if not exists 'removed';
alter type public.product_status add value if not exists 'verified';
