import {
  GOAL_OPTIONS,
  INDUSTRY_SUGGESTIONS,
  TIME_BUDGET_OPTIONS,
  WORK_STATUS_OPTIONS,
} from "@/lib/constants";
import type { OnboardingAnswers } from "@/types";

export type StepId =
  | "workStatus"
  | "transitionDetail"
  | "goal"
  | "goalDetail"
  | "industry"
  | "linkedinUrl"
  | "inspirations"
  | "challenge"
  | "timeBudget";

export type StepKind = "chips" | "text" | "url" | "urlList";

export interface ChipOption {
  value: string;
  label: string;
  blurb?: string;
}

export interface OnboardingStep {
  id: StepId;
  kind: StepKind;
  /** What the coach says before the input appears. */
  question: string;
  /** Shown under the input. */
  hint?: string;
  options?: ChipOption[];
  suggestions?: string[];
  placeholder?: string;
  optional?: boolean;
  /** Follow-ups only appear when the earlier answer warrants them. */
  showIf?: (draft: Partial<OnboardingAnswers>) => boolean;
  /** Overrides `question` when it depends on an earlier answer. */
  dynamicQuestion?: (draft: Partial<OnboardingAnswers>) => string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "workStatus",
    kind: "chips",
    question:
      "I am LnkRise. Six questions and I will have your first plan ready — this takes about two minutes. To start: are you working, studying, or somewhere in between?",
    options: WORK_STATUS_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
  },
  {
    id: "transitionDetail",
    kind: "text",
    question: "Transitioning — from what, to what? One line is enough.",
    placeholder: "e.g. from agency account management into product marketing",
    showIf: (draft) => draft.workStatus === "transitioning",
  },
  {
    id: "goal",
    kind: "chips",
    question: "What do you actually want out of this? Pick the one that matters most right now.",
    options: GOAL_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
      blurb: option.blurb,
    })),
  },
  {
    id: "goalDetail",
    kind: "text",
    question: "One more on that.",
    dynamicQuestion: (draft) => {
      switch (draft.goal) {
        case "generate_leads":
          return "What do you sell, and who is the ideal client for it?";
        case "get_hired":
          return "What role are you targeting, and at roughly what kind of company?";
        case "thought_leadership":
          return "What is the argument you want to be known for? Even a rough version is fine.";
        default:
          return "One more on that.";
      }
    },
    placeholder: "A sentence or two",
    showIf: (draft) =>
      draft.goal === "generate_leads" ||
      draft.goal === "get_hired" ||
      draft.goal === "thought_leadership",
  },
  {
    id: "industry",
    kind: "text",
    question: "What field are you in? Be as specific as you can — it changes everything I write.",
    hint: "Specific beats broad: 'B2B SaaS onboarding' works better than 'tech'.",
    suggestions: INDUSTRY_SUGGESTIONS,
    placeholder: "Start typing…",
  },
  {
    id: "linkedinUrl",
    kind: "url",
    question:
      "Paste your profile URL so I can look at how it reads. If you would rather not, skip it — I will still build the plan.",
    hint: "Public profile URL only. Never your password, and I do not sign in as you.",
    placeholder: "https://www.linkedin.com/in/your-handle",
    optional: true,
  },
  {
    id: "inspirations",
    kind: "urlList",
    question:
      "Whose posts do you actually stop and read? One to three profiles — I will use them to shape the tone, not to copy them.",
    hint: "Optional, but this is the answer that makes the plan feel like yours.",
    optional: true,
  },
  {
    id: "challenge",
    kind: "text",
    question: "What is the part you are stuck on? Say it plainly — vague answers get vague plans.",
    placeholder: "e.g. I write drafts and never publish them",
  },
  {
    id: "timeBudget",
    kind: "chips",
    question:
      "Last one. Realistically, how much time can you give this on a normal weekday? I will size the plan to the honest answer, not the aspirational one.",
    options: TIME_BUDGET_OPTIONS.map((option) => ({
      value: String(option.value),
      label: option.label,
      blurb: option.blurb,
    })),
  },
];

export function visibleSteps(draft: Partial<OnboardingAnswers>): OnboardingStep[] {
  return ONBOARDING_STEPS.filter((step) => !step.showIf || step.showIf(draft));
}

/** What the coach says after an answer, before the next question. */
export function acknowledgement(step: StepId, value: string): string | null {
  switch (step) {
    case "workStatus":
      return value === "transitioning"
        ? "Transitions are the hardest case and the one where this helps most."
        : null;
    case "goal":
      return "Right. That narrows what is worth doing considerably.";
    case "industry":
      return `${value} — good. I will keep everything inside that.`;
    case "linkedinUrl":
      return value ? "Got it." : "No problem — I will work from your answers instead.";
    case "inspirations":
      return value ? "Useful. I will read those as a direction, not a template." : null;
    case "challenge":
      return "That is a solvable one.";
    default:
      return null;
  }
}
