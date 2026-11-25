# Phase 2 environment and rollout

1. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key.
2. Set `SUPABASE_SERVICE_ROLE_KEY` only in the server environment. This is used only by the account-deletion server action and must never use a `NEXT_PUBLIC_` prefix.
3. Apply migrations with `supabase db push` (or run the local Supabase stack and `supabase migration up`). The private schema must stay out of the Data API exposed schemas; `supabase/config.toml` exposes only `public` and `graphql_public`.
4. Configure the Supabase email templates and allowed redirect URLs to include `${NEXT_PUBLIC_SITE_URL}/auth/callback`.
5. For Google sign-in, enable Google in Supabase Auth, add the provider client ID/secret and callback URL in the Google console, then set `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED=true`.
6. Set `NEXT_PUBLIC_SITE_URL` to the actual deployed Operlynt origin before production email callbacks.

## Usage limits

`lib/usage/limits.ts` is the application-side reference. The database plan rows seeded in the first migration are the enforcement source of truth. Keep their feature keys and values aligned. Every metered server operation should use `withUsage(feature, idempotencyUuid, operation)` and supply a new stable UUID for each logical request. Reservation is atomic; successful work commits usage, failed work releases the reservation. Abandoned reservations are reclaimed after 15 minutes. Course discovery and basic roadmaps have no meter.

## Tests

- `supabase/tests/phase2_rls.test.sql` checks profile/resume ownership, public catalog filtering and direct-write denial for usage records. Run via `supabase test db` after applying migrations.
- `npm run test:phase2:integration` runs real auth/profile/RLS and concurrent daily/monthly RPC checks. Use a disposable non-production project, two confirmed test accounts and all `SUPABASE_TEST_*` values listed in the integration script. The script creates and cleans a temporary plan/subscription.
- Manual auth checks after Supabase setup: register and confirm email; password login/logout; reset and change password; Google OAuth when enabled; private dashboard redirect; edit profile; delete a disposable account.

No real Supabase project credentials are committed. Integration checks require a configured project and were not run as part of code generation.
