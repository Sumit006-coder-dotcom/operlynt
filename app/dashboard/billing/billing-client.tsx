"use client";
import Script from "next/script";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {trackAnalyticsEvent} from "@/lib/analytics/client";

declare global{interface Window{Razorpay?:new(options:Record<string,unknown>)=>{open:()=>void}}}
type Plan={id:string,slug:string,name:string,amount_minor:number,currency:string,billing_period:string|null,features:string[]};
export function BillingClient({plans,activeId}:{plans:Plan[],activeId:string|null}){
 const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);const router=useRouter();
 async function checkout(planSlug:string){
  setBusy(true);setMessage("");
  try{
   const response=await fetch("/api/billing/checkout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({planSlug,requestKey:crypto.randomUUID()})});const data=await response.json();
   if(!response.ok)throw new Error(data.error??"Checkout unavailable.");
   if(!window.Razorpay){if(data.checkoutUrl){window.location.assign(data.checkoutUrl);return}throw new Error("Razorpay Checkout did not load.")}
   const checkout=new window.Razorpay({key:data.keyId,subscription_id:data.subscriptionId,name:"Operlynt",description:data.planName,theme:{color:"#7055d9"},handler:async(result:Record<string,string>)=>{
    const verified=await fetch("/api/billing/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(result)});const outcome=await verified.json();
    if(verified.ok){if(outcome.status==="active")trackAnalyticsEvent("subscription_verified",{plan:planSlug});setMessage(outcome.status==="active"?"Payment verified. Pro is active.":outcome.message??"Payment is being confirmed.");if(outcome.status==="active")router.push("/dashboard/billing?payment=success")}
    else router.push("/dashboard/billing?payment=failure");
   },modal:{ondismiss:()=>setMessage("Checkout closed. No subscription change was made.")}});checkout.open();
  }catch(error){setMessage(error instanceof Error?error.message:"Checkout could not be opened.")}finally{setBusy(false)}
 }
 return <><Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload"/><div className="billing-plans">{plans.map(plan=><article className="billing-plan" key={plan.slug}><span className="eyebrow">{plan.billing_period??"FREE ACCESS"}</span><h2>{plan.name}</h2><p className="billing-price">₹{(plan.amount_minor/100).toLocaleString("en-IN")}<small> / {plan.billing_period??"forever"}</small></p><ul>{plan.features.map(feature=><li key={feature}>{feature}</li>)}</ul>{plan.slug==="free"?<span className="billing-current">Available to everyone</span>:<button className="btn" disabled={busy||activeId===plan.id} onClick={()=>checkout(plan.slug)}>{activeId===plan.id?"Current plan":"Choose plan"}</button>}</article>)}</div>{message&&<p className="billing-message" role="status">{message}</p>}</>
}
export function CancelSubscription({id,cancelAtPeriodEnd}:{id:string,cancelAtPeriodEnd:boolean}){
 const [message,setMessage]=useState("");
 async function cancel(){if(!window.confirm("Cancel this subscription at the end of its current billing period?"))return;const response=await fetch("/api/billing/cancel",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subscriptionId:id})});const data=await response.json();if(response.ok)window.location.reload();else setMessage(data.error??"Cancellation failed.")}
 return <div>{cancelAtPeriodEnd?<span>Cancellation scheduled at period end.</span>:<button className="billing-cancel" onClick={cancel}>Cancel at period end</button>}{message&&<small role="alert">{message}</small>}</div>
}
