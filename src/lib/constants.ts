import type { LinkedInGoal, PlanFeatureAccess, PlanId, WorkStatus } from "@/types";

export const APP_NAME = "LnkRise";
export const APP_TAGLINE = "Your AI growth coach for professional networking";
export const APP_DESCRIPTION =
  "LnkRise turns your profile, your goals and the creators you admire into one daily plan: what to post, who to reach out to, what to comment on — and proof that it is working.";

// ---------------------------------------------------------------------------
// Plans
//
// Note on the pricing model: "Starter" is a 15-day access pass, not a
// recurring subscription — it is a one-time Stripe payment that opens a
// window. "Pro" is a real monthly subscription. Billing is wired in Phase 6;
// the shape below is what the UI and the feature gate read today.
// ---------------------------------------------------------------------------

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: string;
  priceNote: string;
  billing: "one_time" | "recurring";
  durationDays: number | null;
  tagline: string;
  features: string[];
  missing: string[];
  highlighted: boolean;
  cta: string;
}

export const PLANS: PlanDefinition[] = [
  {
    id: "trial",
    name: "Free Trial",
    price: "$0",
    priceNote: "3 days",
    billing: "one_time",
    durationDays: 3,
    tagline: "See what a real coaching plan looks like.",
    features: [
      "Profile score and positioning read",
      "Daily focus + one post draft you can copy",
      "Basic growth dashboard",
    ],
    missing: ["Connection strategy", "Comment coaching", "AI writing workspace"],
    highlighted: false,
    cta: "Start free",
  },
  {
    id: "starter",
    name: "Starter",
    price: "$9",
    priceNote: "15-day pass",
    billing: "one_time",
    durationDays: 15,
    tagline: "A full fortnight of daily coaching, paid once.",
    features: [
      "Everything in Free Trial",
      "Full daily brief, no sections held back",
      "Connection strategy with outreach messages",
      "Comment coaching",
      "Growth analytics",
    ],
    missing: ["AI writing workspace", "Carousel generation"],
    highlighted: false,
    cta: "Get the pass",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$19",
    priceNote: "per month",
    billing: "recurring",
    durationDays: null,
    tagline: "The whole coach, every day, plus the writing room.",
    features: [
      "Everything in Starter",
      "AI writing workspace with live preview",
      "Carousel generation",
      "Advanced analytics and weekly reports",
      "Morning brief in your inbox",
      "Priority AI",
    ],
    missing: [],
    highlighted: true,
    cta: "Go Pro",
  },
];

export const PLAN_ACCESS: Record<PlanId, PlanFeatureAccess> = {
  trial: {
    fullBrief: false,
    connectionStrategy: false,
    commentCoaching: false,
    analytics: false,
    aiEditor: false,
    carousels: false,
    emailBriefs: false,
    aiGenerationsPerDay: 3,
  },
  starter: {
    fullBrief: true,
    connectionStrategy: true,
    commentCoaching: true,
    analytics: true,
    aiEditor: false,
    carousels: false,
    emailBriefs: false,
    aiGenerationsPerDay: 10,
  },
  pro: {
    fullBrief: true,
    connectionStrategy: true,
    commentCoaching: true,
    analytics: true,
    aiEditor: true,
    carousels: true,
    emailBriefs: true,
    aiGenerationsPerDay: 50,
  },
};

// ---------------------------------------------------------------------------
// Growth score tiers
// ---------------------------------------------------------------------------

export interface GrowthTier {
  min: number;
  max: number;
  label: string;
  gradient: string;
}

export const GROWTH_TIERS: GrowthTier[] = [
  { min: 0, max: 20, label: "Getting Started", gradient: "var(--gradient-tier-1)" },
  { min: 21, max: 40, label: "Building Momentum", gradient: "var(--gradient-tier-2)" },
  { min: 41, max: 60, label: "Growing", gradient: "var(--gradient-tier-3)" },
  { min: 61, max: 80, label: "Thriving", gradient: "var(--gradient-tier-4)" },
  { min: 81, max: 100, label: "Standout", gradient: "var(--gradient-tier-5)" },
];

export function growthTier(score: number): GrowthTier {
  const clamped = Math.max(0, Math.min(100, score));
  return GROWTH_TIERS.find((tier) => clamped >= tier.min && clamped <= tier.max) ?? GROWTH_TIERS[0]!;
}

// ---------------------------------------------------------------------------
// Onboarding option sets
// ---------------------------------------------------------------------------

export const WORK_STATUS_OPTIONS: { value: WorkStatus; label: string }[] = [
  { value: "working", label: "Working" },
  { value: "studying", label: "Studying" },
  { value: "both", label: "Both" },
  { value: "transitioning", label: "Transitioning" },
];

export const GOAL_OPTIONS: { value: LinkedInGoal; label: string; blurb: string }[] = [
  { value: "get_hired", label: "Get hired", blurb: "Be found by recruiters and hiring managers" },
  { value: "personal_brand", label: "Build my brand", blurb: "Be known for something specific" },
  { value: "generate_leads", label: "Generate leads", blurb: "Turn the feed into a pipeline" },
  { value: "network", label: "Network", blurb: "Meet people who move my field" },
  { value: "thought_leadership", label: "Thought leadership", blurb: "Shape the conversation in my niche" },
];

export const INDUSTRY_SUGGESTIONS = [
  "Software engineering",
  "Product management",
  "Data & analytics",
  "Design & UX",
  "Marketing",
  "Sales",
  "Finance",
  "Consulting",
  "Healthcare",
  "Education",
  "Recruiting & HR",
  "Operations",
  "Legal",
  "Founder / small business",
];

export const TIME_BUDGET_OPTIONS = [
  { value: 15, label: "15 min", blurb: "Tight — engagement only" },
  { value: 30, label: "30 min", blurb: "Balanced — post and engage" },
  { value: 60, label: "1 hour", blurb: "Ambitious — build fast" },
] as const;

export const CONTENT_TONES = [
  { value: "professional", label: "Professional", blurb: "Measured, credible, no slang" },
  { value: "conversational", label: "Conversational", blurb: "Like explaining to a colleague" },
  { value: "bold", label: "Bold", blurb: "Opinionated, takes a side" },
  { value: "storyteller", label: "Storyteller", blurb: "Leads with scenes and people" },
];

export const POSTING_FREQUENCIES = [
  { value: "daily", label: "Every weekday" },
  { value: "3_per_week", label: "3 times a week" },
  { value: "weekly", label: "Once a week" },
];

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface NavItem {
  href: string;
  label: string;
  icon: string; // lucide icon name, resolved in the sidebar
  premium?: boolean;
}

export const APP_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/daily-brief", label: "Daily Brief", icon: "Sunrise" },
  { href: "/content", label: "Content", icon: "PenLine" },
  { href: "/facts", label: "Your material", icon: "Library" },
  { href: "/analytics", label: "Analytics", icon: "TrendingUp", premium: true },
  { href: "/connections", label: "Connections", icon: "Users", premium: true },
  { href: "/settings", label: "Settings", icon: "Settings" },
];

/** Shown only to role === "coach", above the regular nav. */
export const COACH_NAV: NavItem[] = [
  { href: "/coach", label: "Clients", icon: "Users2" },
  { href: "/coach/settings", label: "White-label", icon: "Palette" },
];
