import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const first=readFileSync("supabase/migrations/202611180001_phase2_auth_data_usage.sql","utf8");
const second=readFileSync("supabase/migrations/202611180002_atomic_usage_engine.sql","utf8");
for(const table of ["profiles","resumes","resume_analyses","courses","course_skills","course_bookmarks","learning_progress","interview_questions","practice_questions","practice_attempts","career_roadmaps","roadmap_skills","recommendations","usage_counters","usage_events","plans","subscriptions","payments","credit_balances","payment_webhooks"]){assert.ok(first.includes(`create table public.${table} (`),`${table} table exists`);assert.ok(first.includes(`alter table public.%I enable row level security`),"RLS loop exists")}
for(const feature of ["resume_builder_export","resume_analyzer","interview_question","aptitude_test","coding_sql_question","ai_request"]){assert.ok(first.includes(`\"${feature}\"`),`${feature} plan config exists`)}
assert.ok(second.includes("Asia/Kolkata"),"usage periods use India timezone");assert.ok(second.includes("pg_advisory_xact_lock"),"usage reservations serialize concurrent requests");assert.ok(second.includes("private.reserve_usage_internal"),"privileged quota logic stays in the private schema");
console.log("Schema smoke checks passed: all requested tables, RLS, limits, timezone and atomic lock.");
