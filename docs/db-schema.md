# EKALOX Database Schema (Initial Phase)

This document explains the **first migration** for EKALOX in a beginner-friendly way.

Migration file: `db/migrations/0001_initial_schema.sql`

## Why this schema is "phase-1 only"

It includes only the core marketplace tables requested:

- users
- creator_profiles
- products
- product_videos
- product_assets
- orders
- downloads
- free_claims
- admin_reviews

It does **not** add phase-2/3 social or growth tables yet (likes, comments, follows, affiliates, refunds), but it leaves room to add them cleanly later.

## Enum types used

- `product_status`: `draft`, `pending_review`, `approved`, `rejected`
- `cta_type`: `buy`, `free`, `install`
- `order_status`: `pending`, `paid`, `fulfilled`, `cancelled`, `refunded`
- `review_decision`: `approved`, `rejected`, `changes_requested`
- `asset_kind`: `file`, `license`, `external_link`

These enums keep values consistent and reduce typo bugs.

## Table-by-table explanation

### 1) `users`
Stores marketplace users.

Key columns:
- `id`: internal UUID primary key
- `auth_user_id`: optional link to Supabase Auth user ID
- `email`, `username`, `display_name`
- `created_at`, `updated_at`

### 2) `creator_profiles`
One profile per creator account.

Key columns:
- `user_id` (unique FK to `users.id`) → enforces 1:1 relation
- `handle`, `bio`, `website_url`
- `is_verified`, `metadata`

### 3) `products`
Main product listing table.

Key columns:
- `creator_profile_id` FK
- `title`, `slug`, `summary`, `description`, `category`, `tags`
- `status` (`draft/pending_review/approved/rejected`)
- `cta_type` (`buy/free/install`)
- `price_cents`, `currency_code`
- lifecycle timestamps: `submitted_at`, `reviewed_at`, `published_at`, `archived_at`

Important rule:
- If `cta_type = 'free'`, then `price_cents` must be `0`.

### 4) `product_videos`
Preview/demo videos for products.

Key columns:
- `product_id` FK
- `video_url`, `provider`
- `thumbnail_url`, `duration_seconds`, `sort_order`

### 5) `product_assets`
Actual downloadable/installable assets.

Key columns:
- `product_id` FK
- `asset_kind` (`file/license/external_link`)
- `storage_path` or `external_url` (at least one required)
- `file_size_bytes`, `checksum_sha256`, `is_primary`

### 6) `orders`
Purchase records.

Key columns:
- `buyer_user_id` FK
- `product_id` FK
- `creator_profile_id` FK
- `status`, `unit_price_cents`, `total_price_cents`, `currency_code`
- payment fields for later integrations (`payment_provider`, `payment_reference`)

### 7) `downloads`
Tracks post-purchase downloads.

Key columns:
- `order_id` FK
- `product_asset_id` FK
- `user_id` FK
- `download_token` (unique), count/limits/expiry fields

### 8) `free_claims`
Tracks users claiming free products.

Key columns:
- `user_id` FK
- `product_id` FK
- unique pair (`user_id`, `product_id`) to prevent duplicate claims

### 9) `admin_reviews`
Moderation trail for product reviews.

Key columns:
- `product_id` FK
- `reviewer_user_id` FK
- `decision`, `notes`, `reviewed_at`

## Relationship map (simple)

- `users` 1—1 `creator_profiles`
- `creator_profiles` 1—N `products`
- `products` 1—N `product_videos`
- `products` 1—N `product_assets`
- `users` 1—N `orders` (as buyers)
- `orders` 1—N `downloads`
- `users` N—N `products` through `free_claims`
- `products` 1—N `admin_reviews`

## Future compatibility notes

This schema is ready for future additions without breaking naming patterns:

- **likes/comments/follows** can attach to `users.id` and `products.id`
- **affiliates** can connect to `creator_profiles.id` and `orders.id`
- **refunds** can be introduced with a dedicated table linked to `orders.id`

## Naming conventions used

- plural table names (`products`, `orders`)
- snake_case columns (`created_at`, `price_cents`)
- explicit FK naming via `_id` suffix
- enums for constrained workflow fields
