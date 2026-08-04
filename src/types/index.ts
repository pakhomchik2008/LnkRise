// ---------------------------------------------------------------------------
// Onboarding
// ---------------------------------------------------------------------------

export type WorkStatus = "working" | "studying" | "both" | "transitioning";

export type LinkedInGoal =
  | "get_hired"
  | "personal_brand"
  | "generate_leads"
  | "network"
  | "thought_leadership";

export type TimeBudget = 15 | 30 | 60;

/**
 * What the optional manual-profile onboarding step collects. Deliberately
 * lighter than the full LinkedInProfile shape (one role, not a career
 * history) — the point is to give the audit real signal in thirty seconds,
 * not to rebuild a résumé.
 */
export interface ManualProfileDraft {
  headline: string;
  about: string;
  skills: string[];
  experience: LinkedInExperience[];
}

export interface OnboardingAnswers {
  workStatus: WorkStatus;
  goal: LinkedInGoal;
  industry: string;
  linkedinUrl: string;
  inspirations: string[];
  challenge: string;
  timeBudget: TimeBudget;
  /** Answers to adaptive follow-ups, keyed by the question id that triggered them. */
  followUps?: Record<string, string>;
  /** Set only if the user filled the optional manual-profile step. */
  profile?: ManualProfileDraft;
}

export interface ChatMessage {
  id: string;
  role: "coach" | "user";
  text: string;
  /** Rendered under the bubble once answered — e.g. the chips that were shown. */
  meta?: string;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export interface LinkedInExperience {
  title: string;
  company: string;
  period?: string;
  description?: string;
}

export interface LinkedInProfile {
  fullName: string;
  headline: string;
  about?: string;
  location?: string;
  experience: LinkedInExperience[];
  education: string[];
  skills: string[];
  followers?: number;
  connections?: number;
  imageUrl?: string;
  /** How we got this data. "manual" is the default path — see docs/PLATFORM-DATA.md. */
  source: "oauth" | "manual";
  fetchedAt: string;
}

export interface ScoredSection {
  score: number; // 1-10
  verdict: string;
  suggestions: string[];
}

export interface ProfileAnalysis {
  overallScore: number; // 0-100
  headline: ScoredSection;
  about: ScoredSection;
  experience: ScoredSection;
  skills: ScoredSection;
  completeness: ScoredSection;
  positioning: string;
  strengths: string[];
  improvements: string[];
  contentOpportunities: string[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Strategy & daily brief
// ---------------------------------------------------------------------------

export interface StrategyWeek {
  week: 1 | 2 | 3 | 4;
  theme: string;
  focus: string;
  milestones: string[];
}

export interface Strategy {
  headline: string;
  summary: string;
  postsPerWeek: number;
  commentsPerDay: number;
  connectsPerDay: number;
  weeks: StrategyWeek[];
  generatedAt: string;
}

export interface PostIdea {
  topic: string;
  why: string;
  hook: string;
  keyPoints: string[];
  cta: string;
  draft: string;
}

export interface ConnectSuggestion {
  audience: string;
  why: string;
  message: string;
  searchQuery: string;
  /**
   * Added in Phase 3. Briefs generated before that have no category, so every
   * reader must treat this as optional — `categoryOf()` in
   * lib/ai/connection-strategy.ts resolves the fallback rather than each call
   * site inventing one.
   */
  category?: ConnectionCategoryId;
}

export type ConnectionCategoryId =
  | "industry_leaders"
  | "peers"
  | "clients_recruiters"
  | "content_creators";

/**
 * One outreach lane on the Connections page. `searchQuery` is a LinkedIn
 * search string the user runs themselves — we never execute it for them.
 */
export interface ConnectionCategory {
  id: ConnectionCategoryId;
  label: string;
  lookFor: string;
  why: string;
  searchQuery: string;
  message: string;
}

export interface ConnectionPlan {
  categories: ConnectionCategory[];
  generatedAt: string;
}

export interface CommentSuggestion {
  topic: string;
  why: string;
  starters: string[];
  timeEstimate: string;
  /**
   * Set only by our own post-processing (attachRealPeople), never by the AI
   * or mock generator — a generated field claiming to name a real person
   * would be a hallucination risk. Absent means the topic is a category, not
   * an individual.
   */
  person?: { name: string; url: string };
}

export interface DailyBriefContent {
  todayFocus: string;
  postIdea: PostIdea;
  connectWith: ConnectSuggestion[];
  commentOn: CommentSuggestion[];
  optimizationTip: { title: string; detail: string };
}

/**
 * Yesterday's read, shown at the top of today's brief.
 *
 * The split exists because task completion is self-reported: a user can tick
 * every box and still have reached nobody. Only `measured` has real platform
 * numbers behind it. `unverified` deliberately refuses to present its number
 * as a result — the UI renders it as a warning, not a score — and `idle` is
 * the honest answer when there was no work to grade.
 */
export type EngagementScore =
  | {
      kind: "measured";
      score: number;
      tasksDone: number;
      tasksTotal: number;
      impressionsDelta: number;
      /** yyyy-mm-dd of the analytics snapshot the delta came from. */
      measuredOn: string;
    }
  | { kind: "unverified"; score: number; tasksDone: number; tasksTotal: number }
  | { kind: "idle" };

export type TaskType = "post" | "connect" | "comment" | "optimize" | "engage";
export type TaskStatus = "pending" | "completed" | "skipped";
export type TaskPriority = "high" | "medium" | "low";

// ---------------------------------------------------------------------------
// Analytics
// ---------------------------------------------------------------------------

export interface StatPoint {
  date: string; // yyyy-mm-dd
  profileViews: number;
  postImpressions: number;
  followers: number;
  connections: number;
}

export interface StatSummary {
  label: string;
  value: number;
  trend: number | null; // percent vs previous period, null when incomparable
  series: number[];
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export type PlanId = "trial" | "starter" | "pro";

export interface PlanFeatureAccess {
  fullBrief: boolean;
  connectionStrategy: boolean;
  commentCoaching: boolean;
  analytics: boolean;
  aiEditor: boolean;
  carousels: boolean;
  emailBriefs: boolean;
  aiGenerationsPerDay: number;
}
