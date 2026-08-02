import type { LinkedInProfile, OnboardingAnswers, ProfileAnalysis, Strategy } from "@/types";
import { GOAL_PROFILES } from "./mock/banks";

const HOUSE_STYLE = `You are the coaching engine behind LnkRise, a growth coach for professional networking platforms.

How to write:
- Address the user directly. No preamble, no restating the question.
- Be specific to their field. Advice that would work for anyone is worthless here.
- Prefer a concrete, arguable claim over a hedged general one.
- Never suggest anything that violates a platform's terms of service: no automation, no scraping, no bulk messaging, no engagement pods.
- Never impersonate the platform or reference its branding.
- Plain text only. No markdown headers, no emoji.`;

function profileBlock(profile?: LinkedInProfile | null): string {
  if (!profile) {
    return "Profile data: not available. The user has not completed the manual profile form yet — reason from their questionnaire answers alone and say plainly where you are inferring.";
  }

  return [
    `Name: ${profile.fullName}`,
    `Headline: ${profile.headline}`,
    `About: ${profile.about ?? "(empty)"}`,
    `Experience: ${
      profile.experience.length > 0
        ? profile.experience
            .map((role) => `${role.title} at ${role.company}${role.period ? ` (${role.period})` : ""}`)
            .join("; ")
        : "(none listed)"
    }`,
    `Skills: ${profile.skills.length > 0 ? profile.skills.join(", ") : "(none listed)"}`,
    `Followers: ${profile.followers ?? "unknown"} · Connections: ${profile.connections ?? "unknown"}`,
    `Source: ${profile.source === "oauth" ? "platform sign-in" : "entered by the user"}`,
  ].join("\n");
}

function answersBlock(answers: OnboardingAnswers): string {
  const goal = GOAL_PROFILES[answers.goal];
  return [
    `Situation: ${answers.workStatus}`,
    `Goal: ${goal.label}`,
    `Field: ${answers.industry}`,
    `Time available per day: ${answers.timeBudget} minutes`,
    `Biggest challenge in their own words: "${answers.challenge}"`,
    answers.inspirations.length > 0
      ? `People they admire: ${answers.inspirations.join(", ")}`
      : "People they admire: none given",
    answers.followUps && Object.keys(answers.followUps).length > 0
      ? `Follow-up answers: ${Object.entries(answers.followUps)
          .map(([key, value]) => `${key}: ${value}`)
          .join(" · ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export const profileAnalysisSystem = `${HOUSE_STYLE}

Your task: audit a professional profile and score it honestly. Scores are 1-10 per section and 0-100 overall. A profile with an empty About section does not score above 4 on that section — inflated scores make the whole product useless. Every suggestion must be an edit the user could make in under five minutes.`;

export function profileAnalysisPrompt(answers: OnboardingAnswers, profile?: LinkedInProfile | null): string {
  return `Audit this profile.

QUESTIONNAIRE
${answersBlock(answers)}

PROFILE
${profileBlock(profile)}

Return exactly three strengths and three improvements. Content opportunities must be post topics only this person could credibly write.`;
}

export const strategySystem = `${HOUSE_STYLE}

Your task: turn an audit plus a stated goal into a four-week plan. The plan must fit inside the user's stated daily time budget — if the numbers do not fit in the time available, lower the numbers. Week 1 is foundation, week 2 momentum, week 3 acceleration, week 4 measurement. Every milestone must be a single action the user can mark as done.`;

export function strategyPrompt(answers: OnboardingAnswers, analysis: ProfileAnalysis): string {
  return `Build the four-week plan.

QUESTIONNAIRE
${answersBlock(answers)}

AUDIT
Overall score: ${analysis.overallScore}/100
Positioning: ${analysis.positioning}
Strengths: ${analysis.strengths.join(" · ")}
To improve: ${analysis.improvements.join(" · ")}
Content openings: ${analysis.contentOpportunities.join(" · ")}

Set postsPerWeek, commentsPerDay and connectsPerDay to what genuinely fits ${answers.timeBudget} minutes a day.`;
}

export const dailyBriefSystem = `${HOUSE_STYLE}

Your task: write one day of the plan.

The post draft is the centrepiece — it must be publishable as-is, in the user's field, with a hook that would stop someone scrolling and no filler. Aim for 900-1300 characters.

The three outreach suggestions describe categories of people, never named individuals. Each carries a search query the user can paste into the platform's search, and a first message that references something specific rather than complimenting the recipient generically.

The engagement suggestions name the kind of post to look for and give openers the user can adapt — not comments to paste verbatim.`;

export function dailyBriefPrompt(
  answers: OnboardingAnswers,
  strategy: Strategy,
  dayNumber: number,
  recentTopics: string[],
): string {
  const week = Math.min(4, Math.ceil(dayNumber / 7)) as 1 | 2 | 3 | 4;
  const currentWeek = strategy.weeks.find((entry) => entry.week === week) ?? strategy.weeks[0];

  return `Write day ${dayNumber} of the plan.

QUESTIONNAIRE
${answersBlock(answers)}

PLAN
${strategy.summary}
Current week (${week}): ${currentWeek?.theme ?? ""} — ${currentWeek?.focus ?? ""}
Cadence: ${strategy.postsPerWeek} posts/week, ${strategy.commentsPerDay} comments/day, ${strategy.connectsPerDay} connection requests/day

${
  recentTopics.length > 0
    ? `ALREADY COVERED — pick a different angle:\n${recentTopics.map((topic) => `- ${topic}`).join("\n")}`
    : "This is their first brief. Make the post idea an easy one to start with."
}`;
}
