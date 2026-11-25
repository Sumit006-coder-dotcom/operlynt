import {Suspense} from "react";
import type {Metadata} from "next";
import {connection} from "next/server";
import {requireUser} from "@/lib/auth/require-user";
import {practiceQuestions} from "@/lib/practice/bank";
import {practiceCategories} from "@/lib/practice/categories";
import {loadRecommendationSignals} from "@/lib/recommendations/signals";
import {rankSmartRecommendations} from "@/lib/recommendations/engine";
import {RecommendationShelf} from "@/components/recommendation-shelf";
import PracticeArena from "./practice-arena";
export const metadata:Metadata={title:"Practice Arena | Operlynt",description:"Build aptitude, Python, programming logic and SQL skills with focused practice."};
export default function Page({searchParams}:{searchParams:Promise<{category?:string}>}){return <Suspense fallback={<main className="dashboard-wrap"/>}><PracticeContent searchParams={searchParams}/></Suspense>}
async function PracticeContent({searchParams}:{searchParams:Promise<{category?:string}>}){await connection();const [query,{id,supabase}]=await Promise.all([searchParams,requireUser()]);const initialCategory=practiceCategories.find(x=>x===query.category)??"Quantitative Aptitude";const [{data:rows},signals,{data:dismissed}]=await Promise.all([supabase.from("practice_arena_attempts").select("id,question_key,category,topic,difficulty,is_correct,duration_seconds,created_at").eq("user_id",id).order("created_at",{ascending:false}).limit(200),loadRecommendationSignals(supabase,id),supabase.from("dismissed_recommendations").select("recommendation_key").eq("user_id",id)]);const dismissedKeys=new Set((dismissed??[]).map(x=>x.recommendation_key));const recommendations=rankSmartRecommendations(signals).filter(x=>!dismissedKeys.has(x.key)).slice(0,5);const questions=practiceQuestions.map(q=>({id:q.id,category:q.category,topic:q.topic,kind:q.kind,difficulty:q.difficulty,prompt:q.prompt,choices:q.choices,hint:q.hint}));return <><PracticeArena questions={questions} initialCategory={initialCategory} attempts={(rows??[]).map(x=>({id:x.id,questionId:x.question_key,category:x.category,topic:x.topic,difficulty:x.difficulty,correct:x.is_correct,duration:x.duration_seconds,createdAt:x.created_at}))}/><RecommendationShelf items={recommendations} surface="practice"/></>}
