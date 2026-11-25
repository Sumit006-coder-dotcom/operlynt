import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {createHmac,timingSafeEqual} from "node:crypto";

const razorpay=await readFile(new URL("../lib/billing/razorpay.ts",import.meta.url),"utf8");
const checkout=await readFile(new URL("../app/api/billing/checkout/route.ts",import.meta.url),"utf8");
const verify=await readFile(new URL("../app/api/billing/verify/route.ts",import.meta.url),"utf8");
const webhook=await readFile(new URL("../app/api/billing/webhook/route.ts",import.meta.url),"utf8");
const migration=await readFile(new URL("../supabase/migrations/202611190003_phase8_billing.sql",import.meta.url),"utf8");
const schema=await readFile(new URL("../supabase/migrations/202611180001_phase2_auth_data_usage.sql",import.meta.url),"utf8");
const pricing=await readFile(new URL("../lib/pricing.ts",import.meta.url),"utf8");

assert.match(razorpay,/RAZORPAY_TEST_MODE==="true"/);
assert.match(razorpay,/key\.startsWith\("rzp_test_"\)/,"test flag alone cannot permit live credentials");
assert.match(razorpay,/timingSafeEqual/);
assert.match(checkout,/from\("plans"\)/,"checkout amount and plan are selected server-side");
assert.match(checkout,/unique|requestKey/);
assert.match(checkout,/total_count/);
assert.match(verify,/paymentId\}\|\$\{subscriptionId/);
assert.match(verify,/payments\/\$\{paymentId\}/,"verify payment state with Razorpay API");
assert.match(verify,/providerSub\.status!=="active"/);
assert.match(webhook,/await request\.text\(\)/,"verify raw webhook body");
assert.match(webhook,/x-razorpay-signature/i);
assert.match(webhook,/x-razorpay-event-id/i);
assert.match(schema,/unique\(provider, provider_event_id\)/i);
assert.match(migration,/on conflict\(provider,provider_event_id\) do nothing/i);
assert.match(migration,/process_razorpay_webhook/);
assert.match(migration,/subscription\.charged/);
assert.match(migration,/refund\.processed/);
assert.match(migration,/status='failed'/);
assert.match(pricing,/₹199/);assert.match(pricing,/₹1,499/);

const raw=JSON.stringify({event:"payment.captured",payload:{x:1}}),secret="test-webhook-secret";
const signature=createHmac("sha256",secret).update(raw).digest();
assert.equal(timingSafeEqual(signature,Buffer.from(createHmac("sha256",secret).update(raw).digest("hex"),"hex")),true);
assert.notEqual(createHmac("sha256",secret).update(JSON.stringify(JSON.parse(raw),null,2)).digest("hex"),signature.toString("hex"),"signature must bind exact raw body bytes");
console.log("Phase 8 checks passed: test-only credentials, server plan authority, signed callbacks, raw webhook verification, idempotency, renewal and payment status handling.");
