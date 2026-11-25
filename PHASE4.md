# Phase 4: Course discovery

Apply `supabase/migrations/202611180004_course_discovery.sql` after Phases 2 and 3. It extends the existing public course catalog, seeds manually curated provider records, adds profile learning preferences, and adds private clicks plus a verified outbound-link RPC. It does not scrape provider pages or require provider APIs.

The catalog includes Coursera, Udemy, edX, freeCodeCamp, Microsoft Learn, Kaggle Learn, and Google Skills. Every entry includes provider, description, skills, career roles, level, language, access classification, certificate availability, official URL, nullable affiliate URL, approval state, last-verified date, and status. Pricing is categorical and course ratings/prices are not fabricated.

Bookmarks and self-reported progress use the existing owner-RLS tables. Learning recommendations use user-selected roles and skills. Resume-analysis skill gaps are used only when the user opts in on the Learning Hub; the matcher reads only the saved recommended-skill list, and resume content is never sent to course providers. Provider outbound URLs must use HTTPS and an approved provider domain. Clicks are recorded by the database RPC before redirect. Affiliate URLs default off and must be provider-approved and domain-verified before activation.

## Checks

- `npm run test:phase4:unit` checks catalog metadata, provider host allowlists, search filters, ranking, and related recommendations.
- `npm run test:phase4:integration` uses two disposable accounts in a migrated, non-production Supabase project and a service-role key only for verifying/removing the recorded click row. It checks bookmarks and progress, profile consent privacy, cross-user RLS, and the outbound RPC.
- `npm run lint` and `npm run build` check the application.

The live integration test restores the test account's previous profile preferences, bookmarks, and learning progress after it runs. Use a dedicated test account and non-production project.
