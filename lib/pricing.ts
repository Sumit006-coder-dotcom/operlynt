export type PlanCard={slug:string,name:string,price:string,cadence:string,summary:string,features:string[],cta:string,href:string,featured?:boolean};
export const plans:PlanCard[] = [
  { slug: "free", name: "Free", price: "₹0", cadence: "forever", summary: "A thoughtful place to get started.", features: ["Basic resume tools and analysis", "Course discovery and roadmaps", "Limited interview and practice sessions", "Contextual recommendations"], cta: "Start exploring", href: "/dashboard" },
  { slug: "pro_monthly", name: "Pro Monthly", price: "₹199", cadence: "/ month", summary: "More room to grow, every week.", features: ["Higher resume export and analysis limits", "Premium resume templates", "More interviews, aptitude and coding practice", "Detailed learning analytics and recommendations"], cta: "Upgrade to Pro", href: "/dashboard/billing", featured: true },
  { slug: "pro_annual", name: "Pro Annual", price: "₹1,499", cadence: "/ year", summary: "A full year of focused progress.", features: ["Everything in Pro Monthly", "One annual subscription", "Additional AI assisted requests", "Advanced personalized recommendations"], cta: "Choose annual", href: "/dashboard/billing" },
];
