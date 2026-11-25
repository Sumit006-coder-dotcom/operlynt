export const usageLimits = {
  free: {
    resume_builder_export: { daily: 2, monthly: 5 },
    resume_analyzer: { daily: 2, monthly: 5 },
    interview_question: { daily: 20, monthly: 100 },
    aptitude_test: { daily: 2, monthly: 10 },
    coding_sql_question: { daily: 10, monthly: 50 },
    ai_request: { daily: 2, monthly: 10 },
  },
  premium: {
    resume_builder_export: { daily: null, monthly: null },
    resume_analyzer: { daily: null, monthly: null },
    interview_question: { daily: null, monthly: null },
    aptitude_test: { daily: null, monthly: null },
    coding_sql_question: { daily: null, monthly: null },
    ai_request: { daily: null, monthly: null },
  },
  timezone: "Asia/Kolkata",
} as const;
export type MeteredFeature = keyof typeof usageLimits.free;
