import {Suspense} from "react";
import {connection} from "next/server";
import type {Metadata} from "next";
import {requireUser} from "@/lib/auth/require-user";
import {careerRoadmaps} from "@/lib/roadmaps/catalog";
import {loadRecommendationSignals} from "@/lib/recommendations/signals";
import {rankSmartRecommendations} from "@/lib/recommendations/engine";
import RoadmapExplorer from "./roadmap-explorer";
import {RecommendationShelf} from "@/components/recommendation-shelf";
export const metadata:Metadata={title:"Career Roadmaps | Operlynt",description:"Build a role-focused learning plan and track completed milestones."};
export default function Page(){return <Suspense fallback={<main className="dashboard-wrap"/>}><RoadmapContent/></Suspense>}
async function RoadmapContent(){await connection();const {id,supabase}=await requireUser();const [{data:rows},signals]=await Promise.all([supabase.from("roadmap_milestone_progress").select("roadmap_key,milestone_id").eq("user_id",id).eq("completed",true),loadRecommendationSignals(supabase,id)]);const progress:Record<string,string[]>={};for(const row of rows??[])(progress[row.roadmap_key]??=[]).push(row.milestone_id);const {data:dismissed}=await supabase.from("dismissed_recommendations").select("recommendation_key").eq("user_id",id);const dismissedSet=new Set((dismissed??[]).map(x=>x.recommendation_key));const recommendations=rankSmartRecommendations({...signals,roadmapProgress:progress}).filter(x=>!dismissedSet.has(x.key)).slice(0,6);return <><header className="dash-header"><div><span className="eyebrow">CAREER ROADMAPS</span><h1>Make your next step clearer.</h1><p>Build skills in sequence, work through real projects and keep track of your milestones.</p></div></header><RoadmapExplorer roadmaps={careerRoadmaps} initialProgress={progress} trackable/><RecommendationShelf items={recommendations} surface="roadmap"/></>}
