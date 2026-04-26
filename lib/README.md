# lib/

Shared code that is not tied to a single feature.

## Structure

- `constants/`: shared app constants used across features
- `utils/`: pure utility helpers that are safe to reuse anywhere
- `supabase/`: reusable Supabase client setup for browser/server usage
- `auth/`: auth actions and route guards separated from UI

Current shared foundation includes:

- `constants/categories.ts`
- `constants/cta.ts`
- `utils/price.ts`
- `utils/product-cta.ts`
- `supabase/client.ts`
- `supabase/server.ts`
- `supabase/env.ts`
- `auth/actions.ts`
- `auth/guard.ts`
