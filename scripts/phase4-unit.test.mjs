import assert from "node:assert/strict";
import {COURSE_CATALOG,isVerifiedProviderUrl} from "../lib/courses/catalog.ts";
import {rankCourses,relatedLearningLinks} from "../lib/courses/recommendations.ts";
import {courseMatchesFilters,sortCourses} from "../lib/courses/search.ts";
assert.equal(COURSE_CATALOG.length,15,"the initial catalog includes all requested providers and core roles");
for(const course of COURSE_CATALOG){assert.ok(course.title&&course.provider&&course.description&&course.skills.length&&course.careerRoles.length&&course.difficulty&&course.language&&course.pricing&&course.certificate&&course.lastVerified&&course.status);assert.ok(isVerifiedProviderUrl(course.provider,course.officialUrl),`${course.slug} must use its provider's verified https domain`);assert.equal(course.affiliateApproved,false);assert.equal(course.affiliateUrl,null);}
assert.ok(COURSE_CATALOG.some(x=>x.provider==="Coursera"));for(const provider of ["Coursera","Udemy","edX","freeCodeCamp","Microsoft Learn","Kaggle Learn","Google Skills"])assert.ok(COURSE_CATALOG.some(x=>x.provider===provider),`missing ${provider}`);
const sql=COURSE_CATALOG.find(x=>x.slug==="kaggle-intro-sql");assert.ok(sql);assert.equal(courseMatchesFilters(sql,{skill:"sql",role:"Data Analyst",level:"Beginner",price:"Free"}),true);assert.equal(courseMatchesFilters(sql,{role:"Python Developer"}),false);assert.equal(courseMatchesFilters(sql,{query:"bigquery"}),true);
const names=sortCourses(COURSE_CATALOG,"title").map(x=>x.title);assert.deepEqual(names,[...names].sort((a,b)=>a.localeCompare(b)));
const personalized=rankCourses(COURSE_CATALOG,{careerInterests:["Data Analyst"],skills:["Power BI"],resumeSkillGaps:["SQL"]});assert.ok(personalized.some(x=>x.course.slug==="microsoft-power-bi-visualize"));assert.ok(personalized.some(x=>x.course.skills.includes("SQL")));assert.ok(personalized[0].score>=personalized.at(-1).score);
const python=relatedLearningLinks(["Python"]);assert.ok(python.some(x=>/interview/i.test(x.title)));assert.ok(python.some(x=>/coding practice/i.test(x.title)));
const sqlRelated=relatedLearningLinks(["SQL"]);assert.ok(sqlRelated.some(x=>/interview/i.test(x.title)));assert.ok(sqlRelated.some(x=>/exercises/i.test(x.title)));
const ml=relatedLearningLinks(["Machine Learning"]);assert.ok(ml.some(x=>x.href.includes("skill=Python")));assert.ok(ml.some(x=>x.href.includes("skill=Statistics")));assert.ok(ml.some(x=>/interview/i.test(x.title)));assert.ok(ml.some(x=>/project idea/i.test(x.title)));
const pbi=relatedLearningLinks(["Power BI"]);assert.ok(pbi.some(x=>/Data Analyst interview/i.test(x.title)));assert.ok(pbi.some(x=>/dashboard practice/i.test(x.title)));
assert.equal(isVerifiedProviderUrl("Coursera","https://coursera.org/learn/course"),true);assert.equal(isVerifiedProviderUrl("Coursera","http://coursera.org/course"),false);assert.equal(isVerifiedProviderUrl("Coursera","https://coursera.org.evil.example"),false);assert.equal(isVerifiedProviderUrl("Coursera","https://evil.example/?to=coursera.org"),false);
console.log("Phase 4 unit checks passed: provider catalog, required metadata, filtering, ranking, related recommendations and outbound URL allowlist.");
