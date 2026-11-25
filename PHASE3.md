# Phase 3: Resume Studio

Apply `supabase/migrations/202611180003_resume_studio.sql` after Phase 2. The existing `resumes` and `resume_analyses` tables already have owner-scoped RLS; this migration adds owner-linked recommendations and server-only analysis commits that reserve analyzer usage, persist results, refresh role suggestions, and finalize quota in one transaction.

Resume data and analysis results are private. Server actions derive the user from the verified Supabase session. The PDF endpoint checks ownership, returns `private, no-store` bytes, and consumes the centralized export quota only after generation succeeds. Analyzer scores are rule-based guidance and do not predict acceptance by every ATS or employer.

## Local checks

- `npm run test:phase3:unit` validates document shape, weighted analysis categories, role recommendations, and PDF structure/page generation.
- `npm run test:phase3:integration` needs Phase 2 environment variables, a migrated non-production Supabase project, and two disposable confirmed accounts. It checks save/edit, cross-user RLS, atomic analysis metering, private results, PDF generation, and recommendation replacement.
- `npm run lint` and `npm run build` check the app.

The live integration script inserts one resume under the signed-in test account and deletes it in `finally`; its recommendation and analysis rows cascade. Keep dedicated test accounts for usage enforcement checks.
