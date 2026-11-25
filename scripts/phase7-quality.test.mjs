import assert from "node:assert/strict";
import {careerRoadmaps} from "../lib/roadmaps/catalog.ts";
import {emptyRecommendationSignals,rankSmartRecommendations} from "../lib/recommendations/engine.ts";

assert.deepEqual(careerRoadmaps.map(x=>x.role),["Data Analyst","Data Scientist","AI/ML Engineer","Python Developer","SQL Developer","Full Stack Developer","Software Developer","Business Analyst"]);
for(const roadmap of careerRoadmaps){assert.ok(roadmap.requiredSkills.length>=4);assert.ok(roadmap.milestones.length>=3);assert.ok(roadmap.milestones.every(x=>x.project&&x.practice&&x.interview&&x.resource&&x.courseSlugs));}
const data=rankSmartRecommendations({...emptyRecommendationSignals(),roles:["Data Analyst"],gaps:["SQL"]});
assert.ok(data.some(x=>x.key==="course:kaggle-intro-sql"));
assert.ok(data.some(x=>x.key==="roadmap:data-analyst"));
assert.ok(data.every(x=>!x.key.includes("machine-learning")),"avoid unrelated ML suggestions for a SQL gap");
assert.ok(data.some(x=>/selected Data Analyst and need to improve SQL/.test(x.reason)),"provide a concrete explanation");
const search=rankSmartRecommendations({...emptyRecommendationSignals(),searchedSkills:["SQL"]});
assert.ok(search.some(x=>x.type==="interview"));assert.ok(search.some(x=>x.type==="practice"&&x.href.includes("SQL%20Joins")));assert.ok(search.some(x=>x.key==="roadmap:data-analyst"));
const probability=rankSmartRecommendations({...emptyRecommendationSignals(),aptitudeSignals:[{topic:"Probability",score:35,count:4}]});
assert.ok(probability.some(x=>x.type==="practice"&&/probability/i.test(x.title)));assert.ok(probability.some(x=>x.key==="course:coursera-statistics-python"));
const python=rankSmartRecommendations({...emptyRecommendationSignals(),codingSignals:[{topic:"Python Fundamentals",score:40,count:5}]});
assert.ok(python.some(x=>x.type==="course"&&x.skills.includes("Python")));assert.ok(python.some(x=>x.type==="interview"));assert.ok(python.some(x=>x.key==="roadmap:python-developer"));
const progressed=rankSmartRecommendations({...emptyRecommendationSignals(),roles:["Data Analyst"],roadmapProgress:{"data-analyst":["foundations"]}});
assert.ok(progressed.some(x=>x.key==="milestone:data-analyst:sql"),"recommend the next incomplete roadmap milestone");
const completed=rankSmartRecommendations({...emptyRecommendationSignals(),roles:["Data Analyst"],completedSkills:["SQL","Data analysis","Data quality"]});
assert.ok(!completed.some(x=>x.key==="course:coursera-sql-data-science"),"deprioritize a fully completed skill course");
console.log("Phase 7 scenarios passed: roadmap coverage, role and gap relevance, search, weak aptitude/coding signals, explanations and progress ranking.");
