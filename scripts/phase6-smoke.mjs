import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const migration=await readFile(new URL("../supabase/migrations/202611190001_practice_arena.sql",import.meta.url),"utf8");
const page=await readFile(new URL("../app/dashboard/practice-arena/page.tsx",import.meta.url),"utf8");
const client=await readFile(new URL("../app/dashboard/practice-arena/practice-arena.tsx",import.meta.url),"utf8");
const bank=await readFile(new URL("../lib/practice/bank.ts",import.meta.url),"utf8");

assert.match(migration,/unique\(user_id,request_key\)/,"attempts must be idempotent per request key");
assert.match(migration,/private\.reserve_usage_internal\(p_feature,p_request_key\)/,"successful attempt commit must reserve central quota");
assert.match(migration,/private\.finalize_usage_internal\([\s\S]*?true,null\)/,"quota is consumed in the same transaction as the attempt");
assert.match(migration,/create policy "practice arena attempts owner read"[\s\S]*?auth\.uid\(\)/,"attempts must be owner scoped");
assert.match(page,/\.eq\("user_id",id\)/,"history read must be scoped to the authenticated owner");
assert.doesNotMatch(page,/\.\.\.q\s*,?\s*answer|answer:\s*q\.answer/,"answer keys must not be serialized to the client");
assert.match(migration,/v_is_correct:=p_selected_index=v_correct_index/,"correctness must be decided against the private database answer key");
assert.match(client,/value>=9\*60\+59/,"timed practice must stop at ten minutes");
assert.match(client,/score:next\.filter\(a=>a\.correct\)\.length,total:next\.length/,"score must use correct and answered counts");
assert.match(client,/setAttempts\(prev=>\[saved/ ,"successful attempts must update visible progress");
assert.match(bank,/category:"SQL Joins"[\s\S]*?LEFT JOIN/,"SQL join practice must include left join coverage");
assert.match(bank,/category:"SQL Window Functions"/,"window functions must be represented");
assert.match(bank,/category:"Python Fundamentals"/,"Python fundamentals must be represented");
console.log("Phase 6 smoke checks passed: answer privacy, server scoring, quota atomicity, duplicate protection, timer, score and progress wiring.");
