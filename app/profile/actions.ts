"use server";
import {z} from "zod";
import {redirect} from "next/navigation";
import {requireUser} from "@/lib/auth/require-user";
const profileSchema=z.object({display_name:z.string().trim().min(1).max(80),timezone:z.string().trim().min(1).max(80)});
export async function updateProfile(form:FormData){const parsed=profileSchema.safeParse({display_name:form.get("display_name"),timezone:form.get("timezone")});if(!parsed.success)redirect("/profile?error=invalid");const {id,supabase}=await requireUser();const {error}=await supabase.from("profiles").update({...parsed.data,updated_at:new Date().toISOString()}).eq("id",id);if(error)redirect("/profile?error=save");redirect("/profile?saved=1")}
