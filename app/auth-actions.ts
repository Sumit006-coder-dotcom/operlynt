"use server";
import {z} from "zod";
import {redirect} from "next/navigation";
import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
import {getSupabaseEnv,isSupabaseConfigured} from "@/lib/supabase/env";
const emailSchema=z.string().trim().email().max(254);
const passwordSchema=z.string().min(10).max(128);
const displayNameSchema=z.string().trim().min(1).max(80);
function read(form:FormData,key:string){const value=form.get(key);return typeof value==="string"?value:""}
async function authClient(fallback="/login"){if(!isSupabaseConfigured())redirect(`${fallback}?error=not_configured`);const store=await cookies();const {url,key}=getSupabaseEnv();return createServerClient(url,key,{cookies:{getAll:()=>store.getAll(),setAll(values){try{values.forEach(({name,value,options})=>store.set(name,value,options))}catch{/* Server Components cannot mutate cookies. */}}}})}
const origin=()=>process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000";

export async function register(form: FormData) {
  const email = emailSchema.safeParse(read(form, "email"));
  const password = passwordSchema.safeParse(read(form, "password"));
  const name = displayNameSchema.safeParse(read(form, "display_name"));

  if (!email.success || !password.success || !name.success) {
    redirect("/register?error=invalid");
  }

  const supabase = await authClient("/register");

  const { error, data } = await supabase.auth.signUp({
    email: email.data,
    password: password.data,
    options: {
      data: {
        display_name: name.data,
      },
      emailRedirectTo: `${origin()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    console.error("SUPABASE REGISTRATION ERROR:", {
      message: error.message,
      status: error.status,
      code: error.code,
    });

    redirect("/register?error=registration");
  }

  console.log("SUPABASE REGISTRATION SUCCESS:", {
    userId: data.user?.id,
    hasSession: !!data.session,
    emailConfirmed: !!data.user?.email_confirmed_at,
  });

  if (data.session) {
    redirect("/dashboard");
  }

  redirect("/verify-email");
}
export async function login(form:FormData){const email=emailSchema.safeParse(read(form,"email"));const password=passwordSchema.safeParse(read(form,"password"));if(!email.success||!password.success)redirect("/login?error=invalid");const supabase=await authClient();const {error}=await supabase.auth.signInWithPassword({email:email.data,password:password.data});if(error)redirect("/login?error=credentials");redirect("/dashboard");}
export async function logout(){const supabase=await authClient();await supabase.auth.signOut({scope:"local"});redirect("/login?logged_out=1");}
export async function requestPasswordReset(form:FormData){const email=emailSchema.safeParse(read(form,"email"));if(!email.success)redirect("/forgot-password?error=invalid");const supabase=await authClient("/forgot-password");await supabase.auth.resetPasswordForEmail(email.data,{redirectTo:`${origin()}/auth/callback?next=/reset-password`});redirect("/forgot-password?sent=1");}
export async function updatePassword(form:FormData){const password=passwordSchema.safeParse(read(form,"password"));if(!password.success)redirect("/reset-password?error=invalid");const supabase=await authClient("/reset-password");const {data}=await supabase.auth.getClaims();if(!data?.claims?.sub)redirect("/login?error=sign_in_required");const {error}=await supabase.auth.updateUser({password:password.data});if(error)redirect("/reset-password?error=update");redirect("/profile?password_updated=1");}
export async function googleLogin(){if(process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED!=="true")redirect("/login?error=google_not_configured");const supabase=await authClient();const {data,error}=await supabase.auth.signInWithOAuth({provider:"google",options:{redirectTo:`${origin()}/auth/callback?next=/dashboard`}});if(error||!data.url)redirect("/login?error=oauth");redirect(data.url);}
