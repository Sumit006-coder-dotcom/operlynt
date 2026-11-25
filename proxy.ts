import {NextResponse,type NextRequest} from "next/server";
import {createServerClient} from "@supabase/ssr";
import {isSupabaseConfigured} from "@/lib/supabase/env";
export async function proxy(request:NextRequest){
 if(!isSupabaseConfigured())return NextResponse.next({request});
 let response=NextResponse.next({request});
 const supabase=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{cookies:{getAll(){return request.cookies.getAll()},setAll(values,headers){values.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});values.forEach(({name,value,options})=>response.cookies.set(name,value,options));for(const [name,value] of Object.entries(headers))response.headers.set(name,value)}}});
 await supabase.auth.getClaims();
 return response;
}
export const config={matcher:["/dashboard/:path*","/profile","/account/:path*","/reset-password","/auth/callback"]};
