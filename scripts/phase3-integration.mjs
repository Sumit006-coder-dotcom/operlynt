import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { emptyResumeDocument } from "../lib/resume/model.ts";
import { analyzeResume, recommendationsForRole } from "../lib/resume/analysis.ts";
import { generateResumePdf } from "../lib/resume/pdf.ts";

const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const email=process.env.SUPABASE_TEST_USER_EMAIL, password=process.env.SUPABASE_TEST_USER_PASSWORD, otherEmail=process.env.SUPABASE_TEST_OTHER_EMAIL, otherPassword=process.env.SUPABASE_TEST_OTHER_PASSWORD;
for(const [name,value] of Object.entries({NEXT_PUBLIC_SUPABASE_URL:url,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key,SUPABASE_TEST_USER_EMAIL:email,SUPABASE_TEST_USER_PASSWORD:password,SUPABASE_TEST_OTHER_EMAIL:otherEmail,SUPABASE_TEST_OTHER_PASSWORD:otherPassword})) assert.ok(value,`${name} is required; use disposable accounts and a non-production Supabase project.`);
const client=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}}), other=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});

const login=await client.auth.signInWithPassword({email,password}); assert.ifError(login.error); const user=login.data.user; assert.ok(user);
const otherLogin=await other.auth.signInWithPassword({email:otherEmail,password:otherPassword}); assert.ifError(otherLogin.error);
const doc=structuredClone(emptyResumeDocument); doc.targetRole="Data Analyst"; doc.contact.fullName="Phase Three Test"; doc.contact.email=email;
doc.skills=["SQL","Excel"];
const created=await client.from("resumes").insert({user_id:user.id,title:"Phase 3 integration",content:doc}).select("id").single(); assert.ifError(created.error); const resumeId=created.data.id;
try {
 const updated={...doc,summary:"Edited private resume"}; const edit=await client.from("resumes").update({content:updated}).eq("id",resumeId).select("id").single(); assert.ifError(edit.error); assert.equal(edit.data.id,resumeId);
 const own=await client.from("resumes").select("content").eq("id",resumeId).single(); assert.ifError(own.error); assert.equal(own.data.content.summary,"Edited private resume");
 const hidden=await other.from("resumes").select("id").eq("id",resumeId); assert.ifError(hidden.error); assert.equal(hidden.data.length,0,"RLS hides another user's resume");
 const recs=recommendationsForRole("Data Analyst"); const sync=await client.rpc("replace_resume_recommendations",{p_resume_id:resumeId,p_recommendations:recs}); assert.ifError(sync.error); assert.equal(sync.data.ok,true);
 const savedRecs=await client.from("recommendations").select("recommendation_key").eq("source_resume_id",resumeId); assert.ifError(savedRecs.error); assert.equal(savedRecs.data.length,6);
 const analysis=analyzeResume(updated); const requestKey=randomUUID(); const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(JSON.stringify(updated))); const inputHash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,"0")).join("");
 const commit=await client.rpc("commit_resume_analysis",{p_resume_id:resumeId,p_request_key:requestKey,p_result:analysis,p_recommendations:recs,p_input_hash:inputHash}); assert.ifError(commit.error); assert.equal(commit.data.ok,true,"analysis is saved under quota");
 const persisted=await client.from("resume_analyses").select("id,result").eq("resume_id",resumeId); assert.ifError(persisted.error); assert.equal(persisted.data.length,1); assert.equal(persisted.data[0].result.score,analysis.score);
 const privateAnalysis=await other.from("resume_analyses").select("id").eq("resume_id",resumeId); assert.ifError(privateAnalysis.error); assert.equal(privateAnalysis.data.length,0);
 const pdf=generateResumePdf(updated); assert.ok(pdf.toString("latin1").startsWith("%PDF-1.4"));
 const python=await client.rpc("replace_resume_recommendations",{p_resume_id:resumeId,p_recommendations:recommendationsForRole("Python Developer")}); assert.ifError(python.error); assert.equal(python.data.ok,true);
 const pythonRows=await client.from("recommendations").select("recommendation_key").eq("source_resume_id",resumeId); assert.ifError(pythonRows.error); assert.equal(pythonRows.data.length,4,"editing target role replaces recommendations");
 console.log("Phase 3 integration passed: resume save/edit, owner RLS, private analysis, atomic quota commit, PDF bytes and role recommendation refresh.");
} finally { const deleted=await client.from("resumes").delete().eq("id",resumeId); assert.ifError(deleted.error); await client.auth.signOut(); await other.auth.signOut(); }
