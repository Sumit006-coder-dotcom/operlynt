import {Suspense} from "react";
import type {Metadata} from "next";
import {connection} from "next/server";
import {requireUser} from "@/lib/auth/require-user";
import type {InterviewQuestion} from "@/lib/interview/roles";
import InterviewLab from "./interview-lab";
import {loadRecommendationSignals} from "@/lib/recommendations/signals";
import {rankSmartRecommendations} from "@/lib/recommendations/engine";
import {RecommendationShelf} from "@/components/recommendation-shelf";

export const metadata:Metadata={title:"Interview Lab | Operlynt",description:"Practice curated role-based interview questions, track progress, and build confidence."};

export default function Page(){return <Suspense fallback={<main className="dashboard-wrap"/>}><InterviewLabContent/></Suspense>}
async function InterviewLabContent(){
 await connection();
 const {id,supabase}=await requireUser();
 const [{data:rows},{data:bookmarks},{data:progress},{data:attempts},{data:activeSession},signals,{data:dismissed}]=await Promise.all([
  supabase.from("interview_questions").select("id,role,topic,question_type,prompt,sample_answer,concept_explanation,difficulty,tags,evaluation_rubric").eq("is_published",true).order("role").order("topic"),
  supabase.from("interview_question_bookmarks").select("question_id").eq("user_id",id),
  supabase.from("interview_question_progress").select("question_id,is_completed,latest_attempt_at").eq("user_id",id),
  supabase.from("interview_attempts").select("id,question_id,overall_rating,created_at").eq("user_id",id).order("created_at",{ascending:false}).limit(10),
  supabase.from("interview_sessions").select("id,role,session_type,duration_minutes,started_at,expires_at,question_ids").eq("user_id",id).eq("status","active").order("created_at",{ascending:false}).limit(1).maybeSingle(),
  loadRecommendationSignals(supabase,id),
  supabase.from("dismissed_recommendations").select("recommendation_key").eq("user_id",id)
 ]);
 const questions=(rows??[]).map((q)=>({id:q.id,role:q.role,topic:q.topic,questionType:q.question_type,prompt:q.prompt,sampleAnswer:q.sample_answer,conceptExplanation:q.concept_explanation,difficulty:q.difficulty,tags:q.tags??[],evaluationRubric:q.evaluation_rubric??{}})) as InterviewQuestion[];
 const dismissedKeys=new Set((dismissed??[]).map(x=>x.recommendation_key));const recommendations=rankSmartRecommendations(signals).filter(x=>!dismissedKeys.has(x.key)).slice(0,5);
 return <><InterviewLab questions={questions} bookmarkedIds={(bookmarks??[]).map(x=>x.question_id)} progress={(progress??[]).map(x=>({questionId:x.question_id,completed:x.is_completed,latestAttemptAt:x.latest_attempt_at}))} attempts={(attempts??[]).map(x=>({id:x.id,questionId:x.question_id,rating:Number(x.overall_rating),createdAt:x.created_at}))} initialSession={activeSession as never}/><RecommendationShelf items={recommendations} surface="interview"/></>;
}
