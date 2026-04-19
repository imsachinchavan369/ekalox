# EKALOX Auth Routing (Supabase)

## Public routes

- `/login`
- `/signup`

## Protected routes

- `/upload`
- `/profile`

## How protection works

1. `middleware.ts` runs on each request and refreshes Supabase auth cookies.
2. If a visitor is not authenticated and tries `/upload` or `/profile`, middleware redirects to `/login` with `?next=...`.
3. If an authenticated user visits `/login` or `/signup`, middleware redirects them to `/profile`.
4. `lib/auth/guard.ts` adds a server-side guard (`requireUser`) used inside protected pages/layouts as a second check.

This double layer (middleware + server guard) keeps route protection reliable for RLS-friendly server access patterns.

## User sync flow (Auth ➜ DB)

To keep Supabase Auth and app tables aligned:

- `lib/auth/sync-user.ts` upserts into `users` and `creator_profiles` using the Supabase Auth user ID.
- On login, server action calls `syncCurrentAuthenticatedUser()`.
- On signup, if a session exists immediately, server action syncs and redirects to `/profile`.
- On protected route entry, `requireUser()` also calls sync as a safety net.

Because sync uses upserts with conflict keys (`users.id`, `creator_profiles.user_id`), repeated calls are safe and do not create duplicate rows.
