import {z} from "zod";
const envSchema=z.object({NEXT_PUBLIC_SUPABASE_URL:z.string().url(),NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:z.string().min(1)});
export function getSupabaseEnv(){const result=envSchema.safeParse(process.env);if(!result.success)throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");return {url:result.data.NEXT_PUBLIC_SUPABASE_URL,key:result.data.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}}
export function isSupabaseConfigured(){return envSchema.safeParse(process.env).success}
