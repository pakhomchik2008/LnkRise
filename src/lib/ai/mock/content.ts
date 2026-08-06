import type {
  OnboardingAnswers,
  PostConcept,
  PostOutline,
  RewriteMode,
} from "@/types";
import { seededRandom } from "@/lib/utils";
import { GOAL_PROFILES, HOOK_TEMPLATES } from "./banks";
import { templateVars } from "./vars";

/**
 * Mock content generation. Same contract as the rest of the mock layer:
 * deterministic for a given seed, and good enough to use for real, because
 * the app has to work before any key exists.
 */

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match);
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

const ANGLES = [
  "Tell it through one specific incident rather than as general advice",
  "Argue against the position most people in the field hold",
  "Show the numbers before and after, including what it cost",
  "Write it as the advice you would give your earlier self",
  "Explain the part everyone skips because it is boring",
];

export function mockConcepts(
  seed: string,
  answers: OnboardingAnswers,
  count: number,
): PostConcept[] {
  const random = seededRandom(`${seed}:concepts`);
  const goal = GOAL_PROFILES[answers.goal];
  const industry = answers.industry || "your field";
  const vars = templateVars(answers.industry);

  const topics = pickMany(goal.postAngles, Math.min(count, goal.postAngles.length), random);

  return topics.map((topic, index) => ({
    topic: fill(topic, vars),
    angle: ANGLES[index % ANGLES.length]!,
    // Reasons are grounded in what the user told us, never in invented
    // engagement figures — see the note in prompts.ts.
    why: `It sits inside your stated goal (${goal.label.toLowerCase()}), and because it comes out of your own work in ${industry}, nobody else can post it. Your stated obstacle — "${answers.challenge}" — is the thing this kind of post gets you past, since it needs no research.`,
  }));
}

export function mockOutline(seed: string, answers: OnboardingAnswers, topic: string): PostOutline {
  const random = seededRandom(`${seed}:outline:${topic}`);
  const goal = GOAL_PROFILES[answers.goal];
  const industry = answers.industry || "your field";
  const vars = templateVars(answers.industry);

  return {
    topic,
    hook: fill(pick(HOOK_TEMPLATES, random), vars),
    points: [
      `The specific situation in ${industry} — what actually happened, not the generalisation.`,
      "Why the obvious answer did not work.",
      "What you changed, and what it cost you.",
      "The rule you follow now, stated plainly enough to disagree with.",
    ],
    cta: fill(pick(goal.ctas, random), vars),
  };
}

export function mockDraft(outline: PostOutline): string {
  return [
    outline.hook,
    "",
    outline.points[0] ?? "",
    "",
    outline.points.slice(1, -1).join("\n\n"),
    "",
    outline.points.at(-1) ?? "",
    "",
    outline.cta,
  ]
    .filter((block, index, all) => block !== "" || all[index - 1] !== "")
    .join("\n");
}

/**
 * Deleting a filler word can strand the wrong article — "a very important
 * point" becomes "a important point". Cheap to correct, and visibly wrong if
 * left alone.
 */
function fixArticles(text: string): string {
  return text
    .replace(/\ba (?=[aeiou])/g, "an ")
    .replace(/\bA (?=[aeiou])/g, "An ")
    .replace(/\ban (?=[^aeiou\s])/g, "a ")
    .replace(/\bAn (?=[^aeiou\s])/g, "A ");
}

/**
 * Rewrites without a model, by transforming the passage mechanically.
 *
 * Honest about being mechanical: the transformations only rearrange or strip
 * the user's own words. Inventing new claims is something a template-based
 * rewriter has no business doing, and the real model path is what produces
 * genuinely new prose.
 */
export function mockRewrite(passage: string, mode: RewriteMode): string[] {
  const sentences = passage.split(/(?<=[.!?])\s+/).filter(Boolean);
  const trimmed = passage.trim();

  const options = (() => {
    switch (mode) {
      case "shorten":
        return [
          // Dropping half the sentences only shortens anything when there is
          // more than one; on a single sentence it returns the input.
          sentences.length > 1
            ? sentences.slice(0, Math.ceil(sentences.length / 2)).join(" ")
            : trimmed.replace(/\b(that |which |in order )/gi, ""),
          trimmed.replace(/\b(really|very|quite|just|actually|basically|simply)\s+/gi, ""),
        ];
      case "expand":
        return [
          `${trimmed}\n\nThe part that surprised me: it kept working after the situation changed, which is not what I expected.`,
          `${trimmed}\n\nConcretely, that meant changing one thing and leaving everything else alone.`,
        ];
      case "bolder":
        return [
          trimmed
            .replace(/\b(I think|I believe|in my opinion|perhaps|maybe|possibly)\b,?\s*/gi, "")
            .replace(/\b(might|could) be\b/gi, "is"),
          `Most people get this wrong. ${trimmed}`,
        ];
      case "warmer":
        return [
          trimmed.replace(/\bone (should|must)\b/gi, "you can").replace(/\bit is\b/gi, "it's"),
          `Here is the honest version. ${trimmed}`,
        ];
      default:
        return [
          sentences.length > 1 ? [...sentences].reverse().join(" ") : trimmed,
          trimmed.replace(/\b(that|which)\s+/gi, ""),
        ];
    }
  })();

  const cleaned = options
    .map((option) => fixArticles(option.replace(/\s{2,}/g, " ").trim()))
    // Offering the user their own text back as an "alternative" wastes the
    // slot and reads as a broken feature.
    .filter((option, index, all) => option.length > 0 && option !== trimmed && all.indexOf(option) === index);

  // Every transformation can no-op on some input (nothing to strip, one
  // sentence). Falling back keeps the caller's contract of at least one
  // option rather than rendering an empty picker.
  return cleaned.length > 0
    ? cleaned
    : [`${trimmed}\n\nThe detail that makes this concrete: it changed how the next decision got made.`];
}
