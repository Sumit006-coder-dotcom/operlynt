# Operlynt

Operlynt is a career growth and learning platform for students, graduates and professionals. It includes public learning pages, authenticated learning tools, resume authoring and analysis, course discovery, interview and practice modules, career roadmaps, recommendations, and test-mode subscription billing.

## Getting started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and configure a Supabase project before using authenticated features. Keep Razorpay in test mode. See [PHASE2.md](PHASE2.md) through [PHASE8.md](PHASE8.md) for setup and module details, and [PHASE9.md](PHASE9.md) for launch configuration and outstanding production requirements.

## Public learning routes

`/free-resume-builder`, `/resume-analyzer`, `/interview-preparation`, `/python-interview-questions`, `/sql-interview-questions`, `/aptitude-practice`, `/coding-practice`, `/courses`, and role roadmaps at `/career-roadmaps/data-analyst`, `/career-roadmaps/data-scientist`, `/career-roadmaps/python-developer`, `/career-roadmaps/ai-ml-engineer`. About, Contact, Privacy Policy, Terms, Pricing, sitemap and robots routes are included. Public SEO pages use canonical metadata and FAQ/breadcrumb structured data where relevant. Private account and workspace pages are noindex and excluded from the sitemap.

## Workspace routes

`/dashboard` provides Resume Studio, Learning Hub, Interview Lab, Practice Arena, Career Roadmaps, Recommendations, and Subscription & Usage. Protected routes require a verified Supabase session. Resume content and personal learning records remain user-scoped.

## Checks

Run `npm run lint`, `npx tsc --noEmit`, `npm run test:phase3:unit`, `npm run test:phase4:unit`, `npm run test:phase5:unit`, `npm run test:phase6:smoke`, `npm run test:phase7:quality`, `npm run test:phase8:billing`, and `npm run test:phase9:readiness`. Live Supabase integration checks require a dedicated non-production test project and test users. See Phase 9 for deployment and external-service validation status.
