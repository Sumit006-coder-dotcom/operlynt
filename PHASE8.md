# Phase 8: Monetization and Billing

## Setup

Apply `supabase/migrations/202611190003_phase8_billing.sql` after the existing Phase 2–7 migrations. The migration seeds the central `plans` catalog with Free, Pro Monthly (₹199/month) and Pro Annual (₹1,499/year), and stores plan entitlements and recurring Razorpay plan IDs.

Copy the Razorpay test credentials into server environment variables using `.env.example`. Keep `RAZORPAY_TEST_MODE=true`; checkout is additionally blocked unless `RAZORPAY_KEY_ID` starts with `rzp_test_`. `NEXT_PUBLIC_RAZORPAY_KEY_ID` is optional and, if set, must match the server key ID. Never configure live keys for this flow.

Configure the test-mode Razorpay webhook URL as `/api/billing/webhook`, with the same webhook secret in `RAZORPAY_WEBHOOK_SECRET`. Subscribe to subscription lifecycle events, subscription charges, payment authorization/capture/failure and refund events. Razorpay should be set to test mode in its merchant dashboard before any checkout flow is tried.

## Billing behavior

`/pricing` reads active prices and features from `plans`; signed-in users can manage plans, cancel at period end, view payment history and review India-time usage at `/dashboard/billing`. The browser sends a plan slug and request key only. The server reads the price and limits from the catalog, creates Razorpay plans/subscriptions, and gives Checkout the public key ID.

The checkout callback is not trusted to grant access. Its signature is checked server-side, then Razorpay payment and subscription records are fetched and checked for captured status, plan, amount and currency. Webhooks are verified against their exact raw body, deduplicated by Razorpay event ID and processed through a service-role-only database function. A captured payment must match the configured plan before activation. Renewals update the current period; successful upgrades schedule the old recurring subscription to cancel at period end. Processed refunds expire the associated entitlement. Receipt/invoice links are shown only when Razorpay supplies them.

The existing atomic usage reservation engine remains authoritative for daily and monthly feature caps, with Asia/Kolkata period boundaries. Quota is consumed only when the protected operation succeeds. Purchased credits are not enabled. Course affiliate actions remain separate from subscription payments. Raw resume content is not used for billing or advertising.

## Checks and provider test flows

- `npm run test:phase8:billing` checks the test-only key gate, server-owned plan selection, callback/webhook signature paths, raw-body binding, event idempotency and payment lifecycle wiring.
- `npm run test:phase6:smoke` and `npm run test:phase7:quality` check practice usage and recommendation behavior.
- `npx tsc --noEmit` and focused ESLint checks validate the implementation.
- Successful/failed test payments, real duplicate deliveries, cancellation, refund and renewal need an approved Razorpay **test-mode** merchant account and configured Supabase test database with this migration applied. These provider-side flows must be completed in test mode before production onboarding; this project does not enable live keys.
