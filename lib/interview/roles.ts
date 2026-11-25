export const interviewRoles=["Data Analyst","Data Scientist","Python Developer","SQL Developer","AI/ML Engineer","Web Developer","Software Developer","Business Analyst"] as const;
export type InterviewRole=typeof interviewRoles[number];
export const interviewQuestionTypes=["Technical","HR","Scenario-based","Project-based","Conceptual","Coding-related"] as const;
export type InterviewQuestionType=typeof interviewQuestionTypes[number];
export type InterviewDifficulty="beginner"|"intermediate"|"advanced";
export type RubricScores={accuracy:number;structure:number;clarity:number;evidence:number};
export type InterviewQuestion={id:string;role:InterviewRole;topic:string;questionType:InterviewQuestionType;prompt:string;sampleAnswer:string;conceptExplanation:string;difficulty:InterviewDifficulty;tags:string[];evaluationRubric:Record<string,string>};
export type InterviewRecommendation={title:string;description:string;href?:string};
const course=(skill:string,label:string):InterviewRecommendation=>({title:`${label} courses`,description:`Browse curated ${label} learning resources from official providers.`,href:`/courses?skill=${encodeURIComponent(skill)}`});
export function interviewRecommendations(role:string):InterviewRecommendation[]{
 if(role==="Python Developer")return [course("Python","Python"),{title:"Python coding practice",description:"Use hands-on Python course exercises to practice writing and testing small solutions.",href:"/courses?skill=Python"}];
 if(role==="SQL Developer")return [course("SQL","SQL"),{title:"SQL exercises",description:"Browse SQL courses with query lessons and guided exercises.",href:"/courses?skill=SQL"}];
 if(role==="Data Analyst")return [course("Excel","Excel"),course("SQL","SQL"),course("Power BI","Power BI"),{title:"Aptitude exercise idea",description:"Add a short data interpretation exercise using percentages, ratios, and chart reading."}];
 if(role==="AI/ML Engineer"||role==="Data Scientist")return [course("Machine Learning","Machine learning"),course("Statistics","Statistics"),course("Python","Python"),{title:"Python practice",description:"Use Python course exercises to practice preparing data and evaluating model results.",href:"/courses?skill=Python"},{title:"Related project",description:"Compare a simple baseline with a trained model, then explain the data split and evaluation metric."}];
 return [course("Python","Python"),course("SQL","SQL"),{title:"Practice a project walkthrough",description:"Choose one portfolio project and explain the problem, your contribution, and the result."}];
}
export function averageRubric(scores:RubricScores){const values=Object.values(scores);return Math.round(values.reduce((sum,value)=>sum+value,0)/values.length*10)/10;}
