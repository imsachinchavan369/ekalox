-- Add the post-publish product status value.
-- Keep this migration enum-only so PostgreSQL can commit the new value
-- before any later migration uses it in updates, policies, or defaults.

alter type public.product_status add value if not exists 'published';
