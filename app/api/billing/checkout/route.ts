import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {billingEnabled,razorpayKeyId,razorpayRequest} from "@/lib/billing/razorpay";
import {z} from "zod";
const inputSchema=z.object({planSlug:z.enum(["pro_monthly","pro_annual"]),requestKey:z.string().uuid()});
type RazorPlan={id:string};type RazorSubscription={id:string,short_url?:string};
export async function POST(request:Request){
 if(!billingEnabled())return Response.json({error:"Test billing is not configured."},{status:503});
 const body=await request.json().catch(()=>null),parsed=inputSchema.safeParse(body);if(!parsed.success)return Response.json({error:"Invalid checkout request."},{status:400});
 const supabase=await createClient(),{data:claims}=await supabase.auth.getClaims(),userId=claims?.claims?.sub;
 if(typeof userId!=="string")return Response.json({error:"Sign in to continue."},{status:401});
 const admin=createAdminClient();const {data:plan}=await admin.from("plans").select("id,slug,name,amount_minor,currency,billing_period,interval_count,razorpay_plan_id").eq("slug",parsed.data.planSlug).eq("is_active",true).maybeSingle();
 if(!plan||plan.amount_minor<1||!plan.billing_period)return Response.json({error:"Plan is unavailable."},{status:404});
 const {data:old}=await admin.from("billing_checkout_requests").select("id,status,subscription_id").eq("user_id",userId).eq("request_key",parsed.data.requestKey).maybeSingle();
 if(old?.subscription_id){const {data:existing}=await admin.from("subscriptions").select("provider_subscription_id,checkout_url").eq("id",old.subscription_id).eq("user_id",userId).maybeSingle();if(existing?.provider_subscription_id)return Response.json({subscriptionId:existing.provider_subscription_id,checkoutUrl:existing.checkout_url,keyId:razorpayKeyId(),planName:plan.name})}
 if(old?.status==="creating")return Response.json({error:"This checkout is still being prepared. Retry with a new request."},{status:409});
 const {data:active}=await admin.from("subscriptions").select("id,status").eq("user_id",userId).in("status",["active","trialing"]).limit(1).maybeSingle();
 // A new plan can be started alongside the existing period; the activated webhook cancels the older recurring subscription.
 const {data:requestRow,error:requestError}=await admin.from("billing_checkout_requests").insert({user_id:userId,request_key:parsed.data.requestKey,plan_id:plan.id,status:"creating"}).select("id").single();
 if(requestError||!requestRow)return Response.json({error:"Could not start checkout. Please retry."},{status:409});
 try{
  let providerPlanId=plan.razorpay_plan_id as string|null;
  if(!providerPlanId){const created=await razorpayRequest<RazorPlan>("plans",{period:plan.billing_period=== "monthly"?"monthly":"yearly",interval:plan.interval_count,item:{name:plan.name,amount:plan.amount_minor,currency:plan.currency,description:`Operlynt ${plan.name} subscription`}});providerPlanId=created.id;await admin.from("plans").update({razorpay_plan_id:providerPlanId}).eq("id",plan.id).is("razorpay_plan_id",null)}
  const {data:subscription,error:subError}=await admin.from("subscriptions").insert({user_id:userId,plan_id:plan.id,status:"created",provider:"razorpay",request_key:parsed.data.requestKey}).select("id").single();
  if(subError||!subscription)throw new Error("Could not create billing record.");
  await admin.from("billing_checkout_requests").update({subscription_id:subscription.id}).eq("id",requestRow.id);
  const result=await razorpayRequest<RazorSubscription>("subscriptions",{plan_id:providerPlanId,total_count:plan.billing_period==="monthly"?120:10,quantity:1,customer_notify:1,notes:{operlynt_subscription_id:subscription.id,operlynt_user_id:userId}});
  await admin.from("subscriptions").update({provider_subscription_id:result.id,checkout_url:result.short_url}).eq("id",subscription.id).eq("user_id",userId);
  await admin.from("billing_checkout_requests").update({status:"ready"}).eq("id",requestRow.id);
  if(active?.id){} // Activation webhook reconciles any previous paid subscription.
  return Response.json({subscriptionId:result.id,checkoutUrl:result.short_url??null,keyId:razorpayKeyId(),planName:plan.name});
 }catch(error){await admin.from("billing_checkout_requests").update({status:"failed"}).eq("id",requestRow.id);return Response.json({error:error instanceof Error?error.message:"Checkout could not be prepared."},{status:502})}
}
