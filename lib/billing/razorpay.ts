import "server-only";
import {createHmac,timingSafeEqual} from "node:crypto";

export function billingEnabled(){const key=process.env.RAZORPAY_KEY_ID??"";return process.env.RAZORPAY_TEST_MODE==="true"&&key.startsWith("rzp_test_")&&Boolean(process.env.RAZORPAY_KEY_SECRET)&&Boolean(!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID||process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID===key)}
export function razorpayKeyId(){return process.env.RAZORPAY_KEY_ID??process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID??""}
export function verifyHmac(value:string,signature:string,secret:string){try{const expected=createHmac("sha256",secret).update(value).digest();const actual=Buffer.from(signature,"hex");return actual.length===expected.length&&timingSafeEqual(actual,expected)}catch{return false}}
export async function razorpayRequest<T>(path:string,body?:Record<string,unknown>):Promise<T>{
 const key=process.env.RAZORPAY_KEY_ID,secret=process.env.RAZORPAY_KEY_SECRET;
 if(!billingEnabled()||!key||!secret)throw new Error("Test mode billing is not configured.");
 const response=await fetch(`https://api.razorpay.com/v1/${path}`,{method:body?"POST":"GET",headers:{Authorization:`Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,"Content-Type":"application/json"},...(body?{body:JSON.stringify(body)}:{}),cache:"no-store",signal:AbortSignal.timeout(12_000)});
 const data=await response.json() as T & {error?:{description?:string}};
 if(!response.ok)throw new Error(data?.error?.description??"Razorpay request failed.");return data;
}
