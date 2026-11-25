import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { PageHero } from "@/components/ui";
import { plans as fallbackPlans, type PlanCard } from "@/lib/pricing";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "Pricing and subscription plans",
  description: "See Operlynt free limits and choose monthly or yearly Pro access for resume scoring and interview preparation.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Operlynt pricing — monthly and yearly plans",
    description: "Compare free access with Pro monthly and yearly plans for resume, ATS, and interview practice limits.",
    url: "/pricing",
    type: "website",
    siteName: "Operlynt",
    images: ["/opengraph-image"],
  },
};

export default function Page() {
  return <Suspense fallback={<section className="page-hero" />}><PricingContent /></Suspense>;
}

async function PricingContent() {
  await connection();
  let current: PlanCard[] = fallbackPlans;
  try {
    const { data } = await createAdminClient().from("plans").select("slug,name,amount_minor,billing_period,features,sort_order").eq("is_active", true).order("sort_order");
    if (data?.length) {
      current = data.map((row) => {
        const fallback = fallbackPlans.find((plan) => plan.slug === row.slug);
        return {
          slug: row.slug,
          name: row.name,
          price: row.amount_minor === 0 ? "₹0" : `₹${(row.amount_minor / 100).toLocaleString("en-IN")}`,
          cadence: row.billing_period ? `/ ${row.billing_period === "yearly" ? "year" : "month"}` : "forever",
          summary: fallback?.summary ?? "A structured plan for continued learning.",
          features: Array.isArray(row.features) ? row.features as string[] : fallback?.features ?? [],
          cta: fallback?.cta ?? "Choose plan",
          href: row.slug === "free" ? "/register" : "/login?next=/dashboard/billing",
          featured: row.slug === "pro_monthly",
        };
      });
    }
  } catch {
    // The static fallback keeps the pricing page useful if the database is unavailable.
  }

  return <>
    <PageHero eyebrow="PLANS THAT MOVE WITH YOU" title="Know your limits. Choose your pace." description="Start free, then upgrade monthly or yearly when you need more resume scoring and interview practice." />
    <section className="content-section container">
      <div className="pricing-grid">
        {current.map((plan) => <article key={plan.slug} className={`price-card ${plan.featured ? "featured" : ""}`}>
          {plan.featured && <span className="pricing-ribbon">Most popular</span>}
          <span className="card-tag">{plan.name.toUpperCase()}</span>
          <h2>{plan.name}</h2>
          <div className="price">{plan.price}<small> {plan.cadence}</small></div>
          <p>{plan.summary}</p>
          <ul>{plan.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <Link className={`btn ${plan.name !== "Free" ? "btn-outline" : ""}`} href={plan.href}>{plan.cta} <span aria-hidden="true">→</span></Link>
        </article>)}
      </div>
      <div className="pricing-note"><strong>Free limits are clear:</strong> 2 PDF exports/day and 5/month, 2 ATS analyses/day and 5/month, and 20 interview answer submissions/day and 100/month. Pro is ₹199/month or ₹1,499/year. Checkout is completed securely after sign-in from your Billing page.</div>
    </section>
    <section className="section container pricing-comparison">
      <div className="section-heading"><span className="eyebrow">WHAT YOU GET</span><h2>More room for <em>consistent practice.</em></h2><p>Your saved resumes, scores, course progress, and interview history stay in your account while your plan controls the usage allowance.</p></div>
      <div className="comparison-grid">
        <article><h3>Resume and ATS</h3><p>Build and save resumes for free. Use Pro when you want more PDF exports and more frequent score checks.</p><Link href="/free-resume-builder">Open resume builder →</Link></article>
        <article><h3>Interview preparation</h3><p>Practice role-based questions with feedback, explanations, and recommendations. Pro gives you a larger answer allowance.</p><Link href="/interview-preparation">Explore interview prep →</Link></article>
        <article><h3>Courses and roadmaps</h3><p>Browse relevant learning and career paths without a subscription. Course-provider checkout links are shown on course pages.</p><Link href="/courses">Browse courses →</Link></article>
      </div>
    </section>
  </>;
}
