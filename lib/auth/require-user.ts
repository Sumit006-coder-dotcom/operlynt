import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {isSupabaseConfigured} from "@/lib/supabase/env";
export async function requireUser(){if(!isSupabaseConfigured())redirect("/login?error=not_configured");const supabase=await createClient();const {data,error}=await supabase.auth.getClaims();const claims=data?.claims;if(error||!claims||typeof claims.sub!=="string")redirect("/login?error=sign_in_required");return {id:claims.sub,email:typeof claims.email==="string"?claims.email:null,supabase};}
