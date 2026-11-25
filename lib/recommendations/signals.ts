import "server-only";
import type {createClient} from "@/lib/supabase/server";
import {emptyRecommendationSignals,type ActivitySignal,type RecommendationSignals} from "./engine";
type SupabaseClient=Awaited<ReturnType<typeof createClient>>;
const uniq=(values:string[])=>[...new Set(values.map(x=>x.trim()).filter(Boolean))];
function aggregate(rows:{topic:string;score:number}[]):ActivitySignal[]{const grouped=new Map<string,number[]>();for(const row of rows){const list=grouped.get(row.topic)??[];list.push(row.score);grouped.set(row.topic,list)}return [...grouped].map(([topic,scores])=>({topic,score:Math.round(scores.reduce((a,b)=>a+b,0)/scores.length),count:scores.length}))}
export async function loadRecommendationSignals(supabase:SupabaseClient,userId:string):Promise<RecommendationSignals>{const base=emptyRecommendationSignals();const [profileResult,searchResult,bookmarkResult,progressResult,interviewResult,practiceResult,roadmapResult]=await Promise.all([
 supabase.from("profiles").select("career_interests,learning_skills,course_recommendations_consent").eq("id",userId).maybeSingle(),
 supabase.from("recommendation_events").select("signal_value").eq("user_id",userId).eq("event_type","course_search").gte("created_at",new Date(Date.now()-90*86400000).toISOString()).limit(100),
 supabase.from("course_bookmarks").select("course_id").eq("user_id",userId),
 supabase.from("learning_progress").select("course_id,progress_percent").eq("user_id",userId).order("updated_at",{ascending:false}).limit(100),
 supabase.from("interview_attempts").select("overall_rating,question_id").eq("user_id",userId).order("created_at",{ascending:false}).limit(100),
 supabase.from("practice_arena_attempts").select("category,topic,is_correct").eq("user_id",userId).order("created_at",{ascending:false}).limit(200),
 supabase.from("roadmap_milestone_progress").select("roadmap_key,milestone_id").eq("user_id",userId).eq("completed",true)
 ]);
 const profile=profileResult.data;base.roles=uniq(profile?.career_interests??[]);base.skills=uniq(profile?.learning_skills??[]);
 if(profile?.course_recommendations_consent){const {data}=await supabase.from("resume_analyses").select("result").eq("user_id",userId).order("created_at",{ascending:false}).limit(1).maybeSingle();const result=data?.result as {recommendedSkills?:unknown}|undefined;base.gaps=Array.isArray(result?.recommendedSkills)?uniq(result.recommendedSkills.filter((x):x is string=>typeof x==="string").slice(0,30)):[]}
 base.searchedSkills=uniq((searchResult.data??[]).map(x=>x.signal_value).filter((x):x is string=>typeof x==="string"));
 const courseIds=uniq([...(bookmarkResult.data??[]).map(x=>x.course_id),...(progressResult.data??[]).map(x=>x.course_id).filter((x):x is string=>!!x)]);
 if(courseIds.length){const {data}=await supabase.from("courses").select("id,course_skills(skill)").in("id",courseIds);const skillsById=new Map((data??[]).map(course=>[course.id,(course.course_skills??[]).map((x:{skill:string})=>x.skill)]));base.savedSkills=uniq((bookmarkResult.data??[]).flatMap(x=>skillsById.get(x.course_id)??[]));const completedIds=new Set((progressResult.data??[]).filter(x=>x.progress_percent>=100).map(x=>x.course_id));base.completedSkills=uniq([...completedIds].flatMap(id=>skillsById.get(id)??[]))}
 const qIds=uniq((interviewResult.data??[]).map(x=>x.question_id));if(qIds.length){const {data}=await supabase.from("interview_questions").select("id,topic").in("id",qIds);const topicById=new Map((data??[]).map(x=>[x.id,x.topic]));base.interviewSignals=aggregate((interviewResult.data??[]).flatMap(x=>{const topic=topicById.get(x.question_id);return topic?[{topic,score:Math.round(Number(x.overall_rating)*20)}]:[]}))}
 const practiced=practiceResult.data??[];base.aptitudeSignals=aggregate(practiced.filter(x=>["Quantitative Aptitude","Logical Reasoning","Verbal Ability","Data Interpretation"].includes(x.category)).map(x=>({topic:x.topic,score:x.is_correct?100:0})));base.codingSignals=aggregate(practiced.filter(x=>!["Quantitative Aptitude","Logical Reasoning","Verbal Ability","Data Interpretation"].includes(x.category)).map(x=>({topic:x.topic,score:x.is_correct?100:0})));
 for(const row of roadmapResult.data??[]){const list=base.roadmapProgress[row.roadmap_key]??[];list.push(row.milestone_id);base.roadmapProgress[row.roadmap_key]=list}
 return base;
}
