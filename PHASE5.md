# Phase 5: Interview Lab

## Database setup

Apply the two migrations in order:

1. `supabase/migrations/202611180005_interview_lab.sql`
2. `supabase/migrations/202611180006_interview_question_bank.sql`

They extend the existing published interview question table with role, topic, answer and rubric fields; add owner-scoped bookmarks, progress, sessions and private attempts; and seed a curated starter bank. Do not run against an existing production database until the normal migration backup/review process is complete.

## User experience

- Public role-filtered question previews live at `/interview-preparation`.
- Authenticated practice lives at `/dashboard/interview-lab`.
- Search covers prompt, topic and tags. Filters cover role, topic, question type and difficulty.
- Learners can open sample answers and concept notes, bookmark questions, draft answers, self-assess four rubric dimensions, and save private attempts with optional reflection.
- Timed (10-minute) and mock (20-minute) sessions sequence curated questions. Sessions use the question bank and timer; there is no AI interviewer, audio recording or automated evaluation.
- Progress and the latest ten attempts are shown for the signed-in owner only.
- Recommendations link to the existing curated course catalogue. Aptitude/project suggestions are presented as guidance rather than links to features that do not exist.

## Quota and privacy

Each saved practice attempt uses the existing central `interview_question` usage feature (free plan: 20 daily and 100 monthly; premium plan: configured as unlimited). The RPC reserves/finalizes quota and records the attempt and completion in one transaction. Draft answers do not leave the browser. Saved answers are only in RLS-protected `interview_attempts`; public question rows contain only curated sample material. Session starts and bookmarks do not consume interview question quotas.

## Checks

- `npm run test:phase5:unit` checks bank role/type coverage, role recommendations, rubric calculation, private-table RLS declarations and quota RPC wiring.
- `npm run lint`
- `npm run build`
- Live authentication, RLS, concurrent quota and session/attempt checks require a separately configured Supabase test project and authenticated test users. They were not run as part of this local UI/schema check.

## Current scope limits

- Question content is a hand-curated starter bank (34 questions), not a large question provider integration.
- Self-assessment scores are learner-entered and are not presented as AI grading.
- Sessions are text-based; there is no recording/transcription or interviewer simulation.
- No job search, job listings or job application features are included.
