import Link from "next/link";

const limits = {
  resume: {
    label: "Resume builder",
    detail: "Editing and saving stay free. PDF export: 2 per day or 5 per month.",
  },
  ats: {
    label: "ATS resume score",
    detail: "Free analysis: 2 per day or 5 per month.",
  },
  interview: {
    label: "Interview preparation",
    detail: "Free answer submissions: 20 per day or 100 per month.",
  },
} as const;

type PlanUsageCardProps = { feature: keyof typeof limits };

export function PlanUsageCard({ feature }: PlanUsageCardProps) {
  const item = limits[feature];
  return (
    <aside className="plan-usage-card" aria-label={`${item.label} usage limits`}>
      <div>
        <span className="eyebrow">FREE PLAN LIMITS</span>
        <strong>{item.label}</strong>
        <p>{item.detail}</p>
      </div>
      <div className="plan-usage-card-side">
        <span>Pro from</span>
        <b>₹199<span>/mo</span></b>
        <small>or ₹1,499/year</small>
        <Link href="/pricing">Compare plans →</Link>
      </div>
    </aside>
  );
}
