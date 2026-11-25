# Phase 9: Production readiness and launch

## Implemented in the repository

- Public SEO landing pages for resume, interview, aptitude, coding, course discovery and four career roadmaps. Pages include original instructional content, metadata, canonicals, internal links, visible FAQs and appropriate FAQ/breadcrumb JSON-LD.
- Generated sitemap, robots policy, Open Graph image/metadata and noindex metadata for private account and workspace pages.
- Course catalog destination validation, affiliate disclosure, free alternatives, sponsored/organic labeling, and eligible outbound click tracking. No affiliate approval is inferred from an ordinary provider URL.
- About, Contact, Privacy Policy and Terms pages. Legal content is a draft and needs review for the jurisdictions and services where Operlynt will operate.
- Consent-gated, optional GA and ad loading. Ads are disabled unless publisher configuration, a learning slot, consent and the CMP readiness gate are all present. No ad slots are included in editing, export, practice, interview sessions or billing flows.
- Security and readiness checks covering sitemap exclusions, noindex, consent gates and course URL checks.

## Database setup

Apply migrations in order, including `supabase/migrations/202611190003_phase8_billing.sql` and then `supabase/migrations/202611190004_phase9_course_quality.sql`, after the earlier Phase 2–7 migrations. Run Supabase RLS tests on a dedicated test project before production. Do not run integration scripts against a production database.

## Environment and external configuration

Copy `.env.example` to the target environment and set the canonical HTTPS `NEXT_PUBLIC_SITE_URL`, Supabase project URL and publishable key. Set the service role key only in server-side deployment secrets. Configure test-only Razorpay credentials and webhook secret as documented in [PHASE8.md](PHASE8.md). Never expose secret keys or use live Razorpay credentials until merchant onboarding and test lifecycle validation are complete.

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` and `NEXT_PUBLIC_GSC_VERIFICATION` only after creating the relevant properties. Add the production domain to Search Console and submit `/sitemap.xml`. AdSense remains disabled by default. Before enabling ads, obtain publisher approval, configure real ad slots, integrate and review an appropriate certified consent management platform for applicable regions, and verify ad placement policy. The app's consent banner is not a substitute for that publisher/CMP work.

For Vercel, import the repository, configure production and preview environment variables separately, deploy a preview first, and then attach the chosen custom domain and verify HTTPS. Configure Supabase production redirect URLs, auth email settings, RLS policies and scheduled database backups/PITR appropriate to the selected plan. Document who can restore a backup and periodically validate a restore in a non-production project. These external account and infrastructure steps have not been performed from this workspace.

## Security and operational gaps

- Metered feature quotas and payment processing are enforced server-side by the Phase 8 service and database routines. Razorpay is test-key gated. Production credentials, merchant onboarding, provider dashboard configuration, real delivery retries, and test-account lifecycle verification remain unverified.
- There is no distributed general-purpose IP rate limiter for all routes. Configure one at the hosting/edge layer or add a shared, atomic limiter before public launch; usage quotas do not replace request-abuse controls.
- Supabase RLS, account deletion cascades and private data protections are implemented in migrations and routes, but production policies, auth configuration, key rotation, backup restore and deletion behavior require verification on the actual production project.
- Legal terms, privacy disclosures, cookie/consent behavior, payment/refund disclosures, and applicable India/other-region requirements need qualified review before sales or tracking launch.
- A source-level focused readiness check does not replace external end-to-end testing, payment-provider webhooks, penetration testing or accessibility review.

## Validation status

Run `npm run lint`, `npx tsc --noEmit`, `npm run test:phase3:unit`, `npm run test:phase4:unit`, `npm run test:phase5:unit`, `npm run test:phase6:smoke`, `npm run test:phase7:quality`, `npm run test:phase8:billing`, `npm run test:phase9:readiness`, and `npm run build` before deployment. Phase 2–5 live database integration checks require a dedicated test Supabase project and should not be pointed at production. Mobile/Core Web Vitals measurements must be run against a deployed preview; no such deployment or Lighthouse results are available here.

This repository is **not yet production-ready** until the outstanding infrastructure, security controls, external service validation, legal review, and deployed performance checks above are complete.
