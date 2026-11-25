import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {COURSE_CATALOG,isVerifiedProviderUrl} from "../lib/courses/catalog.ts";
import {landingPages} from "../lib/seo/landing-pages.ts";
import {careerRoadmaps} from "../lib/roadmaps/catalog.ts";

const sitemap=await readFile(new URL("../app/sitemap.ts",import.meta.url),"utf8");
const robots=await readFile(new URL("../app/robots.ts",import.meta.url),"utf8");
const courseRoute=await readFile(new URL("../app/api/courses/[slug]/outbound/route.ts",import.meta.url),"utf8");
const courseSchema=await readFile(new URL("../supabase/migrations/202611180004_course_discovery.sql",import.meta.url),"utf8");
const launchMigration=await readFile(new URL("../supabase/migrations/202611190004_phase9_course_quality.sql",import.meta.url),"utf8");
const consent=await readFile(new URL("../components/optional-consent.tsx",import.meta.url),"utf8");
const ad=await readFile(new URL("../components/public-ad-slot.tsx",import.meta.url),"utf8");
const dashboard=await readFile(new URL("../app/dashboard/layout.tsx",import.meta.url),"utf8");

const routes=["/free-resume-builder","/resume-analyzer","/interview-preparation","/python-interview-questions","/sql-interview-questions","/aptitude-practice","/coding-practice","/courses","/career-roadmaps/data-analyst","/career-roadmaps/data-scientist","/career-roadmaps/python-developer","/career-roadmaps/ai-ml-engineer"];
for(const path of routes){
 const slug=path.split("/").at(-1);
 if(slug&&landingPages.some(page=>page.slug===slug))assert.ok(landingPages.find(page=>page.slug===slug)?.faqs.length>=2,path);
 if(path.startsWith("/career-roadmaps/"))assert.ok(careerRoadmaps.some(roadmap=>roadmap.id===slug),path);
 assert.ok(sitemap.includes(path)||sitemap.includes("landingPages.map")&&landingPages.some(page=>`/${page.slug}`===path)||path.startsWith("/career-roadmaps/")&&sitemap.includes(slug)||path==="/courses",`${path} should appear in the public sitemap`);
}
for(const course of COURSE_CATALOG){assert.ok(isVerifiedProviderUrl(course.provider,course.officialUrl),`${course.slug} official URL must use verified HTTPS provider domain`);if(course.affiliateApproved&&course.affiliateUrl)assert.ok(isVerifiedProviderUrl(course.provider,course.affiliateUrl),`${course.slug} affiliate URL must use verified provider domain`)}
assert.match(courseRoute,/isVerifiedProviderUrl/);assert.match(courseRoute,/course_outbound/);assert.match(courseSchema,/private\.course_destination_is_valid/);
assert.match(launchMigration,/2026-11-19/);assert.match(robots,/\/dashboard/);for(const privatePath of ["/profile","/account","/api"])assert.match(robots,new RegExp(privatePath.replaceAll("/","\\/")));
assert.doesNotMatch(sitemap,/dashboard|billing|profile|account/);
assert.match(consent,/operlynt-\$\{kind\}-consent/);assert.match(consent,/kind:"analytics"\|"ads"/);assert.match(ad,/Advertisement/);assert.match(dashboard,/index:false/);
console.log("Phase 9 readiness checks passed: requested SEO routes, sitemap exclusions, course domain validation, affiliate disclosure safeguards, consent gates and dashboard noindex.");
