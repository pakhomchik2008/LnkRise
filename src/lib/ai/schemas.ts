import { z } from "zod";

/**
 * Each shape is declared twice on purpose: once as JSON Schema (what the model
 * is constrained to) and once as a Zod schema (what we trust after parsing).
 * The API guarantees shape, not sanity — the Zod pass is what the rest of the
 * app relies on, and it also validates mock-engine output in development.
 */

const scoredSection = z.object({
  score: z.number().min(1).max(10),
  verdict: z.string().min(1),
  suggestions: z.array(z.string().min(1)).min(1).max(4),
});

const scoredSectionJson = {
  type: "object",
  properties: {
    score: { type: "integer" },
    verdict: { type: "string" },
    suggestions: { type: "array", items: { type: "string" } },
  },
  required: ["score", "verdict", "suggestions"],
  additionalProperties: false,
} as const;

export const profileAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  headline: scoredSection,
  about: scoredSection,
  experience: scoredSection,
  skills: scoredSection,
  completeness: scoredSection,
  positioning: z.string().min(1),
  strengths: z.array(z.string().min(1)).length(3),
  improvements: z.array(z.string().min(1)).length(3),
  contentOpportunities: z.array(z.string().min(1)).min(3).max(6),
});

export const profileAnalysisJsonSchema = {
  type: "object",
  properties: {
    overallScore: { type: "integer" },
    headline: scoredSectionJson,
    about: scoredSectionJson,
    experience: scoredSectionJson,
    skills: scoredSectionJson,
    completeness: scoredSectionJson,
    positioning: { type: "string" },
    strengths: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
    contentOpportunities: { type: "array", items: { type: "string" } },
  },
  required: [
    "overallScore",
    "headline",
    "about",
    "experience",
    "skills",
    "completeness",
    "positioning",
    "strengths",
    "improvements",
    "contentOpportunities",
  ],
  additionalProperties: false,
} as const;

export const strategySchema = z.object({
  headline: z.string().min(1),
  summary: z.string().min(1),
  postsPerWeek: z.number().int().min(1).max(7),
  commentsPerDay: z.number().int().min(0).max(20),
  connectsPerDay: z.number().int().min(0).max(20),
  weeks: z
    .array(
      z.object({
        week: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
        theme: z.string().min(1),
        focus: z.string().min(1),
        milestones: z.array(z.string().min(1)).min(2).max(4),
      }),
    )
    .length(4),
});

export const strategyJsonSchema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    summary: { type: "string" },
    postsPerWeek: { type: "integer" },
    commentsPerDay: { type: "integer" },
    connectsPerDay: { type: "integer" },
    weeks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          week: { type: "integer", enum: [1, 2, 3, 4] },
          theme: { type: "string" },
          focus: { type: "string" },
          milestones: { type: "array", items: { type: "string" } },
        },
        required: ["week", "theme", "focus", "milestones"],
        additionalProperties: false,
      },
    },
  },
  required: ["headline", "summary", "postsPerWeek", "commentsPerDay", "connectsPerDay", "weeks"],
  additionalProperties: false,
} as const;

export const dailyBriefSchema = z.object({
  todayFocus: z.string().min(1),
  postIdea: z.object({
    topic: z.string().min(1),
    why: z.string().min(1),
    hook: z.string().min(1),
    keyPoints: z.array(z.string().min(1)).min(2).max(5),
    cta: z.string().min(1),
    draft: z.string().min(1),
  }),
  connectWith: z
    .array(
      z.object({
        audience: z.string().min(1),
        why: z.string().min(1),
        message: z.string().min(1),
        searchQuery: z.string().min(1),
      }),
    )
    .length(3),
  commentOn: z
    .array(
      z.object({
        topic: z.string().min(1),
        why: z.string().min(1),
        starters: z.array(z.string().min(1)).min(2).max(3),
        timeEstimate: z.string().min(1),
      }),
    )
    .min(2)
    .max(3),
  optimizationTip: z.object({
    title: z.string().min(1),
    detail: z.string().min(1),
  }),
});

export const dailyBriefJsonSchema = {
  type: "object",
  properties: {
    todayFocus: { type: "string" },
    postIdea: {
      type: "object",
      properties: {
        topic: { type: "string" },
        why: { type: "string" },
        hook: { type: "string" },
        keyPoints: { type: "array", items: { type: "string" } },
        cta: { type: "string" },
        draft: { type: "string" },
      },
      required: ["topic", "why", "hook", "keyPoints", "cta", "draft"],
      additionalProperties: false,
    },
    connectWith: {
      type: "array",
      items: {
        type: "object",
        properties: {
          audience: { type: "string" },
          why: { type: "string" },
          message: { type: "string" },
          searchQuery: { type: "string" },
        },
        required: ["audience", "why", "message", "searchQuery"],
        additionalProperties: false,
      },
    },
    commentOn: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topic: { type: "string" },
          why: { type: "string" },
          starters: { type: "array", items: { type: "string" } },
          timeEstimate: { type: "string" },
        },
        required: ["topic", "why", "starters", "timeEstimate"],
        additionalProperties: false,
      },
    },
    optimizationTip: {
      type: "object",
      properties: { title: { type: "string" }, detail: { type: "string" } },
      required: ["title", "detail"],
      additionalProperties: false,
    },
  },
  required: ["todayFocus", "postIdea", "connectWith", "commentOn", "optimizationTip"],
  additionalProperties: false,
} as const;
