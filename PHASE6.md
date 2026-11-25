# Phase 6: Practice Arena

## Database setup

Apply `supabase/migrations/202611190001_practice_arena.sql` after the Phase 2 usage-engine migrations. It adds owner-scoped practice attempts, preserves or fills the central aptitude and coding/SQL allowance keys, and adds a transaction that records a verified result while consuming quota.

## User experience

Authenticated practice lives at `/dashboard/practice-arena`. The curated starter set covers quantitative aptitude, logical reasoning, verbal ability, data interpretation, Python fundamentals/programming, programming logic, SQL basics, joins, subqueries, CTEs and window functions. Formats include MCQs, output prediction and find-the-error questions. Learners can filter by category, difficulty and format, open hints, inspect explanations, take a ten-minute timed practice session, review topic accuracy and browse recent attempts.

Answers are checked against a server-side answer key. No user-supplied Python or SQL is executed. Each successfully saved answer consumes one unit from `aptitude_test` or `coding_sql_question`, according to the central plan limits. A request key and owner-scoped unique constraint make retries idempotent. The timer itself and unanswered questions do not consume quota. Session score is derived from the saved answers made during that session; saved attempts are the persistent progress record.

Weak SQL JOIN, probability and Python topics show links to existing course catalogue and interview preparation routes.

## Checks and limits

- `npm run test:phase6:smoke` checks answer-key privacy, server-side scoring, quota/attempt transaction wiring, duplicate protection, timer and progress wiring.
- `npm run lint`
- `npm run build`
- Live quota concurrency, authenticated RLS, and persistence require applying the migration to a configured Supabase test project. They are not exercised by the local smoke check.
- This is a small curated question set; no automatic code execution or SQL sandbox is provided.
