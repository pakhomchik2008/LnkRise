import type {
  DailyBriefContent,
  LinkedInProfile,
  OnboardingAnswers,
  ProfileAnalysis,
  Strategy,
} from "@/types";
import { seededRandom } from "@/lib/utils";
import { GOAL_PROFILES, HOOK_TEMPLATES, OPTIMIZATION_TIPS } from "./banks";
import { templateVars } from "./vars";

/**
 * Deterministic stand-in for the AI layer. Same seed in, same coaching out —
 * which makes the app demoable, testable, and usable before any key exists.
 */

export interface MockInput {
  seed: string;
  answers: OnboardingAnswers;
  profile?: LinkedInProfile | null;
}

function pick<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)] ?? items[0]!;
}

function pickMany<T>(items: readonly T[], count: number, random: () => number): T[] {
  const pool = [...items];
  const out: T[] = [];
  while (out.length < count && pool.length > 0) {
    const [taken] = pool.splice(Math.floor(random() * pool.length), 1);
    if (taken !== undefined) out.push(taken);
  }
  return out;
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
}

function scoreFrom(random: () => number, floor: number, ceiling: number): number {
  return Math.round(floor + random() * (ceiling - floor));
}

// ---------------------------------------------------------------------------
// Profile analysis
// ---------------------------------------------------------------------------

export function mockProfileAnalysis({ seed, answers, profile }: MockInput): ProfileAnalysis {
  const random = seededRandom(`${seed}:analysis`);
  const goal = GOAL_PROFILES[answers.goal];
  const industry = answers.industry || "your field";
  const vars = templateVars(answers.industry);

  const hasAbout = Boolean(profile?.about && profile.about.length > 120);
  const hasSkills = (profile?.skills.length ?? 0) >= 5;
  const hasExperience = (profile?.experience.length ?? 0) >= 1;

  const headline = {
    score: scoreFrom(random, 4, 7),
    verdict: profile?.headline
      ? "Readable, but it describes your job rather than the problem you solve."
      : "Not enough to work with yet — this is the highest-leverage thing to fix.",
    suggestions: [
      `Lead with who you help in ${industry} and what changes for them.`,
      "Drop the company name — it is already directly below.",
      "Keep it under 180 characters so it is not truncated in search results.",
    ],
  };

  const about = {
    score: hasAbout ? scoreFrom(random, 5, 8) : scoreFrom(random, 2, 4),
    verdict: hasAbout
      ? "There is substance here, but the first two lines do not earn the click on 'see more'."
      : "Effectively empty. This is the section that converts a profile view into a follow.",
    suggestions: [
      "Open with the problem, not your background.",
      `Name the specific reader: someone working in ${industry} with a decision to make.`,
      "End with one clear next step.",
    ],
  };

  const experience = {
    score: hasExperience ? scoreFrom(random, 4, 7) : scoreFrom(random, 2, 4),
    verdict: hasExperience
      ? "Responsibilities are described; outcomes mostly are not."
      : "Thin. Even two lines per role beats an empty entry.",
    suggestions: [
      "Convert one bullet per role from task to outcome.",
      "Add a number that shows scope — team size, volume, budget, cycle time.",
      "Cut anything that would be true of anyone with the same job title.",
    ],
  };

  const skills = {
    score: hasSkills ? scoreFrom(random, 5, 8) : scoreFrom(random, 3, 5),
    verdict: hasSkills
      ? "Coverage is fine; ordering is not aligned to where you are going."
      : "Too few listed to influence search.",
    suggestions: [
      `Put the three skills that match "${goal.label.toLowerCase()}" at the top.`,
      "Remove anything you would not want to be interviewed on.",
      "Aim for a spread of ten to fifteen, not fifty.",
    ],
  };

  const completeness = {
    score: scoreFrom(random, 5, 8),
    verdict: "The structural basics are mostly there. The gaps are in the sections people actually read.",
    suggestions: [
      "Replace the default banner image.",
      "Add a featured item once you have published a post worth pinning.",
      "Fill the location and industry fields — they feed search filters.",
    ],
  };

  const overallScore = Math.round(
    ((headline.score + about.score + experience.score + skills.score + completeness.score) / 50) * 100,
  );

  return {
    overallScore,
    headline,
    about,
    experience,
    skills,
    completeness,
    positioning: `Right now your profile reads as someone working in ${industry}. Your stated goal is ${goal.label.toLowerCase()}, and that requires it to read as someone who solves a specific problem in ${industry}. That gap — general competence versus a named specialism — is what the next four weeks are for.`,
    strengths: pickMany(
      [
        `You already have real ${industry} experience to draw on — most people posting in this space do not.`,
        "Your goal is specific enough to build a plan around, which is rarer than it sounds.",
        `There is a clear audience for ${industry} content that is written by a practitioner rather than a commentator.`,
        "Nothing on your profile actively works against you — this is an addition problem, not a repair job.",
      ],
      3,
      random,
    ),
    improvements: pickMany(
      [
        "Your headline describes a job, not a value.",
        "The first two lines of your About section are wind-up rather than substance.",
        "There is no evidence of a point of view anywhere on the profile.",
        "Nothing tells a visitor what to do next.",
      ],
      3,
      random,
    ),
    contentOpportunities: pickMany(
      goal.postAngles.map((angle) => fill(angle, vars)),
      Math.min(4, goal.postAngles.length),
      random,
    ),
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Strategy
// ---------------------------------------------------------------------------

export function mockStrategy({ answers }: MockInput): Strategy {
  const goal = GOAL_PROFILES[answers.goal];
  const industry = answers.industry || "your field";
  const budget = answers.timeBudget;

  const postsPerWeek = budget === 15 ? 1 : budget === 30 ? 2 : 3;
  const commentsPerDay = budget === 15 ? 3 : budget === 30 ? 5 : 8;
  const connectsPerDay = budget === 15 ? 2 : budget === 30 ? 5 : 8;

  return {
    headline: `${goal.label} in ${industry} — a four-week plan built around ${budget} minutes a day`,
    summary: `${fill(goal.focusLine, { industry })} At ${budget} minutes a day the realistic shape is ${postsPerWeek} ${postsPerWeek === 1 ? "post" : "posts"} a week, ${commentsPerDay} considered comments a day, and ${connectsPerDay} connection requests that reference something specific. Engagement comes first: comments compound faster than posts when nobody knows you yet.`,
    postsPerWeek,
    commentsPerDay,
    connectsPerDay,
    weeks: goal.weekThemes.map((week, index) => ({
      week: (index + 1) as 1 | 2 | 3 | 4,
      theme: fill(week.theme, { industry }),
      focus: fill(week.focus, { industry }),
      milestones: week.milestones.map((milestone) => fill(milestone, { industry })),
    })),
    generatedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Daily brief
// ---------------------------------------------------------------------------

export function mockDailyBrief({ seed, answers }: MockInput & { day?: string }): DailyBriefContent {
  const day = new Date().toISOString().slice(0, 10);
  const random = seededRandom(`${seed}:brief:${day}`);
  const goal = GOAL_PROFILES[answers.goal];
  const industry = answers.industry || "your field";
  const vars = templateVars(answers.industry);

  const angle = fill(pick(goal.postAngles, random), vars);
  const hook = fill(pick(HOOK_TEMPLATES, random), vars);
  const cta = fill(pick(goal.ctas, random), vars);

  const keyPoints = [
    `What you actually observed in ${industry} — the specific situation, not the generalisation.`,
    "The reasoning: why the obvious answer did not work.",
    "What you would do differently, stated plainly enough to disagree with.",
  ];

  const draft = [
    hook,
    "",
    `${keyPoints[0]}`,
    "",
    `${keyPoints[1]}`,
    "",
    `${keyPoints[2]}`,
    "",
    cta,
  ].join("\n");

  const connectWith = goal.connectAudiences.map((audience) => ({
    audience: fill(audience.audience, vars),
    why: fill(audience.why, vars),
    message: fill(audience.opener, vars),
    searchQuery: fill(audience.searchQuery, vars),
  }));

  const commentOn = pickMany(goal.commentAngles, Math.min(3, goal.commentAngles.length), random).map(
    (item) => ({
      topic: fill(item.topic, vars),
      why: fill(item.why, vars),
      starters: item.starters.map((starter) => fill(starter, vars)),
      timeEstimate: `~${3 + Math.floor(random() * 3)} minutes`,
    }),
  );

  return {
    todayFocus: fill(goal.focusLine, vars),
    postIdea: {
      topic: angle,
      why: `It sits inside your stated goal (${goal.label.toLowerCase()}) and it is a post only someone who has done the work in ${industry} could write.`,
      hook,
      keyPoints,
      cta,
      draft,
    },
    connectWith,
    commentOn,
    optimizationTip: pick(OPTIMIZATION_TIPS, random),
  };
}
