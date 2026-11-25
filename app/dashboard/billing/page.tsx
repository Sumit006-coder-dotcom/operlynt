import {Suspense} from "react";
import {connection} from "next/server";
import Link from "next/link";
import {requireUser} from "@/lib/auth/require-user";
import {BillingClient,CancelSubscription} from "./billing-client";
export const metadata={title:"Billing | Operlynt"};
export default function BillingPage({searchParams}:{searchParams:Promise<{payment?:string}>}){return <Suspense fallback={<main className="dashboard-wrap"/>}><BillingContent searchParams={searchParams}/></Suspense>}
async function BillingContent({searchParams}:{searchParams:Promise<{payment?:string}>}){
 await connection();
 const {id,supabase}=await requireUser(),query=await searchParams;
 const [{data:plans},{data:subs},{data:payments},{data:usage}]=await Promise.all([
  supabase.from("plans").select("id,slug,name,amount_minor,currency,billing_period,features,usage_limits,sort_order").eq("is_active",true).order("sort_order"),
  supabase.from("subscriptions").select("id,plan_id,status,current_period_start,current_period_end,cancel_at_period_end,provider_subscription_id").eq("user_id",id).order("created_at",{ascending:false}).limit(10),
  supabase.from("payments").select("id,amount_minor,currency,status,created_at,invoice_url,provider").eq("user_id",id).order("created_at",{ascending:false}).limit(20),
  supabase.from("usage_counters").select("feature,period_type,period_start,consumed_count,reserved_count").eq("user_id",id).order("period_start",{ascending:false}).limit(100),
 ]);
 const active=(subs??[]).find(s=>["active","trialing"].includes(s.status));const activePlan=(plans??[]).find(p=>p.id===active?.plan_id)??(plans??[]).find(p=>p.slug==="free");const currentDay=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());const currentMonth=currentDay.slice(0,7);
 const daily=(usage??[]).filter(x=>x.period_type==="day"&&x.period_start===currentDay),monthly=(usage??[]).filter(x=>x.period_type==="month"&&String(x.period_start).startsWith(currentMonth));const getRows=(period:"day"|"month",rows:typeof daily)=>{const limits=(activePlan?.usage_limits??{}) as Record<string,{daily?:number|null,monthly?:number|null}>;return Object.entries(limits).map(([feature,quota])=>{const used=rows.find(item=>item.feature===feature)?.consumed_count??0;const limit=period==="day"?quota.daily:quota.monthly;return <p key={feature}><span>{feature.replaceAll("_"," ")}</span><strong>{used} / {limit??"unlimited"}</strong></p>})};
 return <main className="container billing-page"><header className="dash-header"><div><span className="eyebrow">SUBSCRIPTION AND USAGE</span><h1>Your plan, clearly.</h1><p>Manage your Operlynt subscription and review how much practice and analysis you’ve used.</p></div><Link className="btn btn-outline" href="/pricing">Compare plans</Link></header>
 {query.payment==="success"&&<p className="billing-banner">Payment verified. Your Pro subscription is active.</p>}{query.payment==="failure"&&<p className="billing-banner failure">Payment was not completed. No Pro access was activated.</p>}
 <section className="billing-current-card"><div><span className="eyebrow">CURRENT PLAN</span><h2>{activePlan?.name??"Free"}</h2><p>{active?`Status: ${active.status}${active.current_period_end?` · Renews or ends ${new Date(active.current_period_end).toLocaleDateString("en-IN")}`:""}`:"Basic access is available with no payment required."}</p></div>{active&&<CancelSubscription id={active.id} cancelAtPeriodEnd={active.cancel_at_period_end}/>}</section>
 <section className="billing-section"><h2>Daily usage <small>India time · resets at midnight</small></h2><div className="usage-list">{getRows("day",daily)}</div><h2>Monthly usage <small>India time · resets on the first</small></h2><div className="usage-list">{getRows("month",monthly)}</div></section>
 <section className="billing-section"><h2>Choose a plan</h2><p>Secure merchant checkout is provided by Razorpay. Operlynt never stores card or UPI credentials. Test billing must be configured by the operator.</p><BillingClient plans={plans??[]} activeId={active?.plan_id??null}/></section>
 <section className="billing-section"><h2>Billing history</h2>{payments?.length?<div className="billing-history">{payments.map(payment=><article key={payment.id}><div><strong>{payment.provider?.toUpperCase()??"PAYMENT"} · {payment.status}</strong><small>{new Date(payment.created_at).toLocaleString("en-IN")}</small></div><strong>₹{(payment.amount_minor/100).toLocaleString("en-IN")}</strong>{payment.invoice_url&&<a href={payment.invoice_url} target="_blank" rel="noreferrer">View receipt</a>}</article>)}</div>:<p>No payments yet. Affiliate course purchases are tracked separately from subscriptions.</p>}</section>
 </main>
}
