import { z } from "zod";

/**
 * Each shape is declared twice on purpose: once as JSON Schema (what the model
 * is constrained to) and once as a Zod schema (what we trust after parsing).
 * The API guarantees shape, not sanity — the Zod pass is what the rest of the
 * app relies on, and it also validates mock-engine output in development.
 *
 * Array length is enforced only on the Zod side. Anthropic's structured-output
 * schema rejects `minItems`/`maxItems` above 1 outright (400 invalid_request_error),
 * so the model is steered by the prompt text instead — `boundedArray` then
 * truncates an over-long response rather than failing the whole generation for
 * what is usually the model returning one extra item.
 */

function boundedArray<T extends z.ZodTypeAny>(item: T, min: number, max: number) {
  return z
    .array(item)
    .transform((value) => value.slice(0, max))
    .pipe(z.array(item).min(min));
}

function exactArray<T extends z.ZodTypeAny>(item: T, length: number) {
  return boundedArray(item, length, length);
}

const scoredSection = z.object({
  score: z.number().min(1).max(10),
  verdict: z.string().min(1),
  suggestions: boundedArray(z.string().min(1), 1, 4),
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
  strengths: exactArray(z.string().min(1), 3),
  improvements: exactArray(z.string().min(1), 3),
  contentOpportunities: boundedArray(z.string().min(1), 3, 6),
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
  weeks: exactArray(
    z.object({
      week: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
      theme: z.string().min(1),
      focus: z.string().min(1),
      milestones: boundedArray(z.string().min(1), 2, 4),
    }),
    4,
  ),
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

const CONNECTION_CATEGORY_IDS = [
  "industry_leaders",
  "peers",
  "clients_recruiters",
  "content_creators",
] as const;

export const connectionPlanSchema = z.object({
  categories: exactArray(
    z.object({
      id: z.enum(CONNECTION_CATEGORY_IDS),
      label: z.string().min(1),
      lookFor: z.string().min(1),
      why: z.string().min(1),
      searchQuery: z.string().min(1),
      message: z.string().min(1),
    }),
    4,
  ),
});

export const connectionPlanJsonSchema = {
  type: "object",
  properties: {
    categories: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", enum: CONNECTION_CATEGORY_IDS },
          label: { type: "string" },
          lookFor: { type: "string" },
          why: { type: "string" },
          searchQuery: { type: "string" },
          message: { type: "string" },
        },
        required: ["id", "label", "lookFor", "why", "searchQuery", "message"],
        additionalProperties: false,
      },
    },
  },
  required: ["categories"],
  additionalProperties: false,
} as const;

export const postConceptsSchema = z.object({
  concepts: boundedArray(
    z.object({
      topic: z.string().min(1),
      angle: z.string().min(1),
      why: z.string().min(1),
    }),
    3,
    5,
  ),
});

export const postConceptsJsonSchema = {
  type: "object",
  properties: {
    concepts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topic: { type: "string" },
          angle: { type: "string" },
          why: { type: "string" },
        },
        required: ["topic", "angle", "why"],
        additionalProperties: false,
      },
    },
  },
  required: ["concepts"],
  additionalProperties: false,
} as const;

export const postOutlineSchema = z.object({
  topic: z.string().min(1),
  hook: z.string().min(1),
  points: boundedArray(z.string().min(1), 2, 6),
  cta: z.string().min(1),
});

export const postOutlineJsonSchema = {
  type: "object",
  properties: {
    topic: { type: "string" },
    hook: { type: "string" },
    points: { type: "array", items: { type: "string" } },
    cta: { type: "string" },
  },
  required: ["topic", "hook", "points", "cta"],
  additionalProperties: false,
} as const;

export const postDraftSchema = z.object({
  draft: z.string().min(1).max(3000),
});

export const postDraftJsonSchema = {
  type: "object",
  properties: { draft: { type: "string" } },
  required: ["draft"],
  additionalProperties: false,
} as const;

export const rewriteSchema = z.object({
  alternatives: boundedArray(z.string().min(1), 1, 3),
});

export const rewriteJsonSchema = {
  type: "object",
  properties: { alternatives: { type: "array", items: { type: "string" } } },
  required: ["alternatives"],
  additionalProperties: false,
} as const;

const commentSuggestion = z.object({
  topic: z.string().min(1),
  why: z.string().min(1),
  starters: boundedArray(z.string().min(1), 2, 3),
  timeEstimate: z.string().min(1),
});

const commentSuggestionJson = {
  type: "object",
  properties: {
    topic: { type: "string" },
    why: { type: "string" },
    starters: { type: "array", items: { type: "string" } },
    timeEstimate: { type: "string" },
  },
  required: ["topic", "why", "starters", "timeEstimate"],
  additionalProperties: false,
} as const;

export const commentSuggestionsSchema = z.object({
  suggestions: boundedArray(commentSuggestion, 1, 5),
});

export const commentSuggestionsJsonSchema = {
  type: "object",
  properties: { suggestions: { type: "array", items: commentSuggestionJson } },
  required: ["suggestions"],
  additionalProperties: false,
} as const;

export const dailyBriefSchema = z.object({
  todayFocus: z.string().min(1),
  postIdea: z.object({
    topic: z.string().min(1),
    why: z.string().min(1),
    hook: z.string().min(1),
    keyPoints: boundedArray(z.string().min(1), 2, 5),
    cta: z.string().min(1),
    draft: z.string().min(1),
  }),
  connectWith: exactArray(
    z.object({
      audience: z.string().min(1),
      why: z.string().min(1),
      message: z.string().min(1),
      searchQuery: z.string().min(1),
    }),
    3,
  ),
  commentOn: boundedArray(
    z.object({
      topic: z.string().min(1),
      why: z.string().min(1),
      starters: boundedArray(z.string().min(1), 2, 3),
      timeEstimate: z.string().min(1),
    }),
    2,
    3,
  ),
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
