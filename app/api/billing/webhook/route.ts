import {createAdminClient} from "@/lib/supabase/admin";
import {razorpayRequest,verifyHmac} from "@/lib/billing/razorpay";
export async function POST(request:Request){
 const secret=process.env.RAZORPAY_WEBHOOK_SECRET;if(!secret)return Response.json({error:"Webhook is not configured."},{status:503});
 const raw=await request.text();if(raw.length>1_000_000)return Response.json({error:"Webhook payload is too large."},{status:413});const signature=request.headers.get("x-razorpay-signature")??"",eventId=request.headers.get("x-razorpay-event-id")??"";
 if(!eventId||eventId.length>160||!verifyHmac(raw,signature,secret))return Response.json({error:"Invalid webhook signature or event id."},{status:400});
 let payload:Record<string,unknown>;try{payload=JSON.parse(raw) as Record<string,unknown>}catch{return Response.json({error:"Invalid webhook payload."},{status:400})}
 const type=typeof payload.event==="string"?payload.event:"";if(!type)return Response.json({error:"Missing webhook event type."},{status:400});
 const admin=createAdminClient();const {data,error}=await admin.rpc("process_razorpay_webhook",{p_event_id:eventId,p_event_type:type,p_payload:payload});
 if(error)return Response.json({error:"Webhook processing failed; retry delivery."},{status:500});
 if(type==="subscription.charged"||type==="payment.captured"){
  const eventPayload=payload.payload as {subscription?:{entity?:{id?:string}},payment?:{entity?:{subscription_id?:string}}}|undefined;
  const newProviderId=String(eventPayload?.subscription?.entity?.id??eventPayload?.payment?.entity?.subscription_id??"");
  const {data:newSub}=await admin.from("subscriptions").select("id,user_id").eq("provider","razorpay").eq("provider_subscription_id",newProviderId).maybeSingle();
  if(newSub){const {data:older}=await admin.from("subscriptions").select("id,provider_subscription_id").eq("user_id",newSub.user_id).eq("status","active").eq("cancel_at_period_end",false).neq("id",newSub.id);
   for(const previous of older??[]){if(!previous.provider_subscription_id)continue;try{await razorpayRequest(`subscriptions/${previous.provider_subscription_id}/cancel`,{cancel_at_cycle_end:true});await admin.from("subscriptions").update({cancel_at_period_end:true}).eq("id",previous.id)}catch{return Response.json({error:"New plan activated; existing subscription cancellation is pending retry."},{status:500})}}
  }
 }
 return Response.json({ok:true,duplicate:(data as {duplicate?:boolean})?.duplicate??false});
}
