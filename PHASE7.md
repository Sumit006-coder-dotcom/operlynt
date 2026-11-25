# Phase 7: Career Roadmaps and Smart Recommendations

## Database setup

Apply `supabase/migrations/202611190002_career_roadmaps_recommendations.sql` after the Phase 2–6 migrations. It seeds the eight requested roles and skill lists, adds private milestone progress, stores recommendation analytics, and stores user dismissals.

## Roadmaps

Public roadmaps live at `/career-roadmaps`; signed-in completion tracking lives at `/dashboard/career-roadmaps`. Paths cover Data Analyst, Data Scientist, AI/ML Engineer, Python Developer, SQL Developer, Full Stack Developer, Software Developer and Business Analyst. Each roadmap provides sequenced beginner/intermediate/advanced milestones, required skills, curated course links, interview and aptitude/coding practice links, projects, resources and owner-scoped completion state.

## Recommendation engine

The central ranking service uses selected roles and skills, opted-in saved resume skill gaps, recognized course-search skills, saved-course skills, completed course skills, interview topic ratings, aptitude and coding topic outcomes, and roadmap progress. Ranking considers role and skill match, learning progress, inferred difficulty fit and curated-content quality. Explanations name the role and relevant gap or weak topic. Recommendations are filtered when dismissed; users can dismiss suggestions or change their learning preferences.

Course search analytics store only recognized skill signals (for example `SQL`), never raw query text. Recommendation events store event type, surface and recommendation key. Resume text is not copied into analytics or sent to course providers; saved resume gaps affect course recommendations only when the learner opts in. Affiliate status does not affect ranking.

## Checks and limits

- `npm run test:phase7:quality` covers predefined scenarios for all roadmap roles, Data Analyst plus SQL gaps, SQL course search, weak probability and Python practice, milestone sequencing, completed skills, explanations and unrelated-content filtering.
- `npm run test:phase3:unit` checks that resume recommendations still use the central engine.
- `npm run lint`
- `npm run build`
- Live RLS, event insertion, roadmap persistence and authenticated recommendation-signal checks require a configured Supabase test project and applied migrations.

The course and learning resource catalogue remains a small curated set. The engine ranks the content present in Operlynt and does not invent external course endorsements or placement promises.
