import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {billingEnabled,razorpayRequest,verifyHmac} from "@/lib/billing/razorpay";
import {z} from "zod";
const schema=z.object({razorpay_payment_id:z.string().min(1).max(100),razorpay_subscription_id:z.string().min(1).max(100),razorpay_signature:z.string().regex(/^[a-f0-9]{64}$/i)});
type Entity={id:string,status:string,amount?:number,currency?:string,subscription_id?:string,plan_id?:string,created_at?:number,current_start?:number,current_end?:number};
export async function POST(request:Request){
 if(!billingEnabled())return Response.json({error:"Billing is unavailable."},{status:503});
 const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return Response.json({error:"Invalid payment verification."},{status:400});
 const {razorpay_payment_id:paymentId,razorpay_subscription_id:subscriptionId,razorpay_signature:signature}=parsed.data;
 if(!verifyHmac(`${paymentId}|${subscriptionId}`,signature,process.env.RAZORPAY_KEY_SECRET!))return Response.json({error:"Payment signature did not verify."},{status:400});
 const client=await createClient(),{data:claims}=await client.auth.getClaims(),userId=claims?.claims?.sub;if(typeof userId!=="string")return Response.json({error:"Sign in required."},{status:401});
 const admin=createAdminClient(),{data:sub}=await admin.from("subscriptions").select("id,user_id,plan_id,status,provider_subscription_id").eq("provider_subscription_id",subscriptionId).eq("user_id",userId).eq("provider","razorpay").maybeSingle();
 if(!sub)return Response.json({error:"Subscription was not found."},{status:404});
 try{
  const [payment,providerSub]=await Promise.all([razorpayRequest<Entity>(`payments/${paymentId}`),razorpayRequest<Entity>(`subscriptions/${subscriptionId}`)]);
  if(payment.subscription_id!==subscriptionId||payment.status!=="captured"||providerSub.status!=="active")return Response.json({status:"pending",message:"Payment is verified. Your plan will update when Razorpay confirms activation."},{status:202});
  const {data:plan}=await admin.from("plans").select("amount_minor,currency,billing_period,razorpay_plan_id").eq("id",sub.plan_id).maybeSingle();
  if(!plan||payment.amount!==plan.amount_minor||payment.currency!==plan.currency||providerSub.plan_id!==plan.razorpay_plan_id)return Response.json({error:"Payment amount, currency or plan did not match the selected plan."},{status:400});
  const now=new Date(),period=new Date(now);if(providerSub.current_end)period.setTime(providerSub.current_end*1000);else if(plan.billing_period==="yearly")period.setFullYear(period.getFullYear()+1);else{const date=period.getDate();period.setDate(1);period.setMonth(period.getMonth()+1);period.setDate(Math.min(date,new Date(period.getFullYear(),period.getMonth()+1,0).getDate()))}
  await admin.from("payments").upsert({user_id:userId,subscription_id:sub.id,provider:"razorpay",provider_payment_id:paymentId,amount_minor:payment.amount,currency:payment.currency,status:"paid",metadata:{verified_by:"server_signature_and_api"}},{onConflict:"provider,provider_payment_id"});
  await admin.from("subscriptions").update({status:"active",current_period_start:providerSub.current_start?new Date(providerSub.current_start*1000).toISOString():now.toISOString(),current_period_end:period.toISOString()}).eq("id",sub.id).eq("user_id",userId);
  return Response.json({status:"active"});
 }catch{return Response.json({error:"Could not confirm payment with Razorpay. Webhook confirmation will retry."},{status:503})}
}
