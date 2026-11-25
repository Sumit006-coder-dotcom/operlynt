import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {interviewRoles,interviewQuestionTypes,interviewRecommendations,averageRubric} from "../lib/interview/roles.ts";
const migration=await readFile(new URL("../supabase/migrations/202611180006_interview_question_bank.sql",import.meta.url),"utf8");
const ids=[...migration.matchAll(/'61000000-0000-4000-8000-0000000000(\d+)'/g)].map(x=>Number(x[1]));
assert.equal(new Set(ids).size,34,"question IDs are unique");assert.ok(interviewRoles.length===8);for(const role of interviewRoles)assert.ok(migration.includes(`'${role}','${role}'`),`${role} has curated questions`);
for(const type of interviewQuestionTypes)assert.ok(migration.includes(`'${type}'`),`${type} has at least one curated question`);
for(const role of ["Python Developer","SQL Developer","Data Analyst","AI/ML Engineer"]){const rec=interviewRecommendations(role);assert.ok(rec.length>=2);assert.ok(rec.some(x=>x.href?.startsWith("/courses?skill=")),`${role} recommendations link to courses`)}
assert.ok(interviewRecommendations("Data Analyst").some(x=>x.title.includes("Excel")));assert.ok(interviewRecommendations("Data Analyst").some(x=>x.title.includes("Power BI")));assert.ok(interviewRecommendations("AI/ML Engineer").some(x=>x.title.includes("Statistics")));assert.equal(averageRubric({accuracy:4,structure:3,clarity:5,evidence:4}),4);
const schema=await readFile(new URL("../supabase/migrations/202611180005_interview_lab.sql",import.meta.url),"utf8");for(const table of ["interview_question_bookmarks","interview_question_progress","interview_sessions","interview_attempts"])assert.ok(schema.includes(`create table public.${table}`)&&schema.includes(`alter table public.${table} enable row level security`),`${table} is private with RLS`);assert.ok(schema.includes("private.reserve_usage_internal('interview_question'"));assert.ok(schema.includes("private.finalize_usage_internal(v_event_id,true,null)"));
console.log("Phase 5 unit checks passed: role/type coverage, curated bank IDs, recommendation paths, rubric scoring, RLS tables, and atomic quota integration.");
