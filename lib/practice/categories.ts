export const practiceCategories = ["Quantitative Aptitude","Logical Reasoning","Verbal Ability","Data Interpretation","Python Fundamentals","Python Programming","SQL Basics","SQL Joins","SQL Subqueries","SQL CTEs","SQL Window Functions","Programming Logic"] as const;
export type PracticeCategory=typeof practiceCategories[number];
