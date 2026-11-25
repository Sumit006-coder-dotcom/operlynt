import "server-only";
import {z} from "zod";
import {requireUser} from "@/lib/auth/require-user";
import type {MeteredFeature} from "./limits";
const featureSchema=z.enum(["resume_builder_export","resume_analyzer","interview_question","aptitude_test","coding_sql_question","ai_request"]);
const reserveSchema=z.object({allowed:z.boolean(),reason:z.string().optional(),event_id:z.string().uuid().optional(),status:z.string().optional(),daily_remaining:z.number().nullable().optional(),monthly_remaining:z.number().nullable().optional()});
const finalizeSchema=z.object({ok:z.boolean(),reason:z.string().optional(),status:z.string().optional(),duplicate:z.boolean().optional()});
export type UsageReservation={allowed:true;eventId:string;dailyRemaining:number|null;monthlyRemaining:number|null}|{allowed:false;reason:string};
export async function reserveUsage(feature:MeteredFeature,requestKey:string):Promise<UsageReservation>{
 const featureResult=featureSchema.safeParse(feature);const keyResult=z.string().uuid().safeParse(requestKey);if(!featureResult.success||!keyResult.success)return {allowed:false,reason:"invalid_request"};
 const {supabase}=await requireUser();const {data,error}=await supabase.rpc("reserve_usage",{p_feature:featureResult.data,p_request_key:keyResult.data});if(error)return {allowed:false,reason:"usage_service_unavailable"};const result=reserveSchema.safeParse(data);if(!result.success)return {allowed:false,reason:"invalid_usage_response"};if(!result.data.allowed||!result.data.event_id)return {allowed:false,reason:result.data.reason??"limit_reached"};return {allowed:true,eventId:result.data.event_id,dailyRemaining:result.data.daily_remaining??null,monthlyRemaining:result.data.monthly_remaining??null};
}
export async function finalizeUsage(eventId:string,succeeded:boolean,failureCode?:string){const id=z.string().uuid().safeParse(eventId);if(!id.success)throw new Error("Invalid usage reservation.");const {supabase}=await requireUser();const {data,error}=await supabase.rpc("finalize_usage",{p_event_id:id.data,p_succeeded:succeeded,p_failure_code:failureCode?.slice(0,80)??null});if(error)throw new Error("Could not finalize usage reservation.");const result=finalizeSchema.parse(data);if(!result.ok)throw new Error(result.reason??"Could not finalize usage reservation.");return result;}
export class UsageLimitError extends Error{constructor(public readonly reason:string){super(reason);this.name="UsageLimitError"}}
export async function withUsage<T>(feature:MeteredFeature,requestKey:string,operation:()=>Promise<T>):Promise<T>{const reservation=await reserveUsage(feature,requestKey);if(!reservation.allowed)throw new UsageLimitError(reservation.reason);let result:T;try{result=await operation()}catch(error){await finalizeUsage(reservation.eventId,false,error instanceof Error?error.name:"operation_failed");throw error}await finalizeUsage(reservation.eventId,true);return result}
