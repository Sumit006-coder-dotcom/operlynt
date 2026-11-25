import {createClient} from "@/lib/supabase/server";
import {createAdminClient} from "@/lib/supabase/admin";
import {billingEnabled,razorpayRequest} from "@/lib/billing/razorpay";
import {z} from "zod";
const schema=z.object({subscriptionId:z.string().uuid()});
export async function POST(request:Request){
 const input=schema.safeParse(await request.json().catch(()=>null));if(!input.success)return Response.json({error:"Invalid cancellation request."},{status:400});
 const client=await createClient(),{data:claims}=await client.auth.getClaims(),userId=claims?.claims?.sub;if(typeof userId!=="string")return Response.json({error:"Sign in required."},{status:401});
 const admin=createAdminClient(),{data:sub}=await admin.from("subscriptions").select("id,provider_subscription_id,status").eq("id",input.data.subscriptionId).eq("user_id",userId).maybeSingle();if(!sub)return Response.json({error:"Subscription not found."},{status:404});
 if(sub.status!=="active")return Response.json({error:"Only active subscriptions can be cancelled."},{status:409});
 if(!billingEnabled()||!sub.provider_subscription_id)return Response.json({error:"Test billing is not configured for cancellation."},{status:503});
 try{await razorpayRequest(`subscriptions/${sub.provider_subscription_id}/cancel`,{cancel_at_cycle_end:true});const {error}=await admin.from("subscriptions").update({cancel_at_period_end:true}).eq("id",sub.id).eq("user_id",userId);if(error)throw error;return Response.json({ok:true})}catch{return Response.json({error:"Razorpay could not cancel this subscription. Try again."},{status:502})}
}
