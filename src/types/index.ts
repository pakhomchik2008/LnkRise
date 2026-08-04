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
